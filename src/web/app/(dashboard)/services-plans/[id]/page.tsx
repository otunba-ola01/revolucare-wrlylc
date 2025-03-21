import React, { Suspense } from 'react'; // react ^18.0.0
import { useRouter, useParams, notFound } from 'next/navigation'; // next/navigation ^13.4.1
import { FileText, Edit, Trash2, CheckCircle, XCircle, ArrowLeft } from 'lucide-react'; // lucide-react ^0.284.0
import { Metadata } from 'next'; // next ^13.4.1

import { ServicePlanCard } from '../../../../components/services-plans/service-plan-card';
import { ServiceItemList } from '../../../../components/services-plans/service-item-list';
import { FundingSources } from '../../../../components/services-plans/funding-sources';
import { CostEstimator } from '../../../../components/services-plans/cost-estimator';
import { Button } from '../../../../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs';
import { Skeleton } from '../../../../components/ui/skeleton';
import { useServicesPlan, useDeleteServicesPlan, useApproveServicesPlan, useRejectServicesPlan } from '../../../../hooks/use-services-plans';
import { useAuth } from '../../../../hooks/use-auth';
import { useToast } from '../../../../hooks/use-toast';
import { formatDate } from '../../../../lib/utils/date';
import { formatCurrency } from '../../../../lib/utils/format';
import { PlanStatus } from '../../../../config/constants';

/**
 * Generates metadata for the service plan detail page
 * @param params Object containing the service plan ID
 * @returns Promise resolving to page metadata
 */
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  // Extract service plan ID from route parameters
  const { id } = params;

  // Return metadata object with title and description for the service plan page
  return {
    title: `Service Plan Details - ${id}`,
    description: `View details for service plan ${id}`,
  };
}

/**
 * Main component for the service plan detail page
 * @param params Object containing the service plan ID
 * @returns Rendered service plan detail page
 */
export default function ServicePlanDetailPage({ params }: { params: { id: string } }) {
  // Extract service plan ID from route parameters
  const { id } = params;

  // Wrap the ServicePlanDetail component with Suspense for loading state
  return (
    <Suspense fallback={<ServicePlanDetailSkeleton />}>
      <ServicePlanDetail id={id} />
    </Suspense>
  );
}

/**
 * Skeleton component for loading state
 */
function ServicePlanDetailSkeleton() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle><Skeleton className="h-6 w-32" /></CardTitle>
        <CardDescription><Skeleton className="h-4 w-64" /></CardDescription>
      </CardHeader>
      <CardContent>
        <Skeleton height={200} />
      </CardContent>
    </Card>
  );
}

/**
 * Component that displays the service plan details
 * @param id The ID of the service plan to display
 * @returns Rendered service plan detail component
 */
const ServicePlanDetail: React.FC<{ id: string }> = ({ id }) => {
  // Get the router for navigation
  const router = useRouter();

  // Get the toast notification functions
  const { toast } = useToast();

  // Get user authentication context
  const auth = useAuth();

  // Fetch service plan data using useServicesPlan hook
  const { data: servicePlan, isLoading, error } = useServicesPlan(id);

  // Initialize delete, approve, and reject mutations
  const { mutate: deleteServicePlan, isLoading: isDeleting } = useDeleteServicesPlan();
  const { mutate: approveServicePlan, isLoading: isApproving } = useApproveServicesPlan();
  const { mutate: rejectServicePlan, isLoading: isRejecting } = useRejectServicesPlan();

  // Handle loading state with skeleton UI
  if (isLoading) {
    return <ServicePlanDetailSkeleton />;
  }

  // Handle error state with error message
  if (error) {
    return (
      <Card className="w-full">
        <CardContent>Error: {error.message}</CardContent>
      </Card>
    );
  }

  // Handle not found state with notFound() function
  if (!servicePlan) {
    return notFound();
  }

  // Implement handlers for edit, delete, approve, and reject actions
  const handleEdit = () => {
    router.push(`/dashboard/services-plans/${id}/edit`);
  };

  const handleDelete = () => {
    deleteServicePlan(id);
  };

  const handleApprove = () => {
    approveServicePlan({ id, data: { approvalNotes: '', status: PlanStatus.APPROVED } });
  };

  const handleReject = () => {
    rejectServicePlan({ id, data: { approvalNotes: '', status: PlanStatus.REJECTED } });
  };

  // Render the service plan details with header and back button
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Service Plans
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Service Plan Details</h1>
      </div>

      {/* Render the service plan card with plan information */}
      <ServicePlanCard
        plan={servicePlan}
        showClient
        onView={() => { }}
        onEdit={auth.hasRole('case_manager') ? handleEdit : undefined}
        onDelete={auth.hasRole('administrator') ? handleDelete : undefined}
        onApprove={auth.hasRole('case_manager') && servicePlan.status === PlanStatus.IN_REVIEW ? handleApprove : undefined}
        className="mb-4"
      />

      {/* Render tabs for Services, Funding, and Cost Estimate */}
      <Tabs defaultValue="services" className="w-full">
        <TabsList>
          <TabsTrigger value="services">
            <FileText className="mr-2 h-4 w-4" />
            Services
          </TabsTrigger>
          <TabsTrigger value="funding">
            <DollarSign className="mr-2 h-4 w-4" />
            Funding
          </TabsTrigger>
          <TabsTrigger value="cost">
            <DollarSign className="mr-2 h-4 w-4" />
            Cost Estimate
          </TabsTrigger>
        </TabsList>
        <TabsContent value="services" className="mt-2">
          {/* Render ServiceItemList component in Services tab */}
          <ServiceItemList
            items={servicePlan.services}
            onAdd={() => {
              toast({
                title: 'Not implemented',
                description: 'Adding services is not yet implemented',
              });
            }}
            onEdit={(item) => {
              toast({
                title: 'Not implemented',
                description: 'Editing services is not yet implemented',
              });
            }}
            onRemove={(itemId) => {
              toast({
                title: 'Not implemented',
                description: 'Removing services is not yet implemented',
              });
            }}
          />
        </TabsContent>
        <TabsContent value="funding" className="mt-2">
          {/* Render FundingSources component in Funding tab */}
          <FundingSources
            clientId={servicePlan.clientId}
            fundingSources={servicePlan.fundingSources}
            onChange={(fundingSources) => {
              toast({
                title: 'Not implemented',
                description: 'Updating funding sources is not yet implemented',
              });
            }}
            totalCost={servicePlan.estimatedCost}
          />
        </TabsContent>
        <TabsContent value="cost" className="mt-2">
          {/* Render CostEstimator component in Cost Estimate tab */}
          <CostEstimator servicesPlanId={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};