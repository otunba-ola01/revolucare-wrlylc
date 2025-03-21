import React from 'react'; // React library for building the component - v18.2.0
import { notFound, useRouter } from 'next/navigation'; // Next.js function for handling not found pages and hook for programmatic navigation - v14.0.0
import { Edit, FileText, ArrowLeft } from 'lucide-react'; // Icon components for action buttons - v0.284.0
import {
  PageContainer, // Container component for consistent page layout
} from '../../../../components/layout/page-container';
import {
  Breadcrumbs, // Navigation breadcrumbs for showing the current page location
} from '../../../../components/layout/breadcrumbs';
import {
  PlanStatusBadge, // Component for displaying care plan status with appropriate styling
} from '../../../../components/care-plans/plan-status';
import {
  ConfidenceScore, // Component for displaying AI confidence score for care plans
} from '../../../../components/care-plans/confidence-score';
import {
  GoalTracker, // Component for tracking and displaying care plan goals
} from '../../../../components/care-plans/goal-tracker';
import {
  InterventionList, // Component for displaying care plan interventions
} from '../../../../components/care-plans/intervention-list';
import {
  Button, // UI button component for actions
} from '../../../../components/ui/button';
import {
  Card, // Card component for structured content display
  CardHeader, // Card header component for structured content display
  CardTitle, // Card title component for structured content display
  CardContent, // Card content component for structured content display
  CardFooter, // Card footer component for structured content display
} from '../../../../components/ui/card';
import { useCarePlan } from '../../../../hooks/use-care-plans'; // Hook for fetching care plan data by ID
import { useAuth } from '../../../../hooks/use-auth'; // Hook for accessing authentication context and user permissions
import { formatDate } from '../../../../lib/utils/date'; // Utility for formatting date strings
import { ROUTES } from '../../../../config/constants'; // Application route constants for navigation

/**
 * Generates metadata for the care plan detail page
 * @param {object} { params } - The parameters object containing the care plan ID
 * @returns {object} Page metadata including title and description
 */
export async function generateMetadata({ params }: { params: { id: string } }) {
  // Extract the care plan ID from the params object
  const { id } = params;

  // Return metadata object with dynamic title including the care plan ID
  return {
    title: `Care Plan Details - ${id}`, // Include appropriate description for SEO
    description: `Detailed information about care plan ${id}`,
  };
}

/**
 * Page component that displays detailed information about a specific care plan
 * @param {object} { params } - The parameters object containing the care plan ID
 * @returns {JSX.Element} Rendered care plan detail page
 */
const CarePlanDetailPage = ({ params }: { params: { id: string } }) => {
  // Extract the care plan ID from the params object
  const { id: carePlanId } = params;

  // Use the useCarePlan hook to fetch the care plan data by ID
  const { data: carePlan, isLoading, isError, error } = useCarePlan(carePlanId);

  // Use the useAuth hook to get user information and permissions
  const { hasPermission } = useAuth();

  // Use the useRouter hook for navigation
  const router = useRouter();

  // Handle loading state with a skeleton UI
  if (isLoading) {
    return (
      <PageContainer>
        <Card>
          <CardHeader>
            <CardTitle>Loading Care Plan...</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Loading care plan details...</p>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  // Handle error state with appropriate error message
  if (isError) {
    return (
      <PageContainer>
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Error loading care plan: {error?.message || 'Unknown error'}</p>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  // If care plan is not found, call the notFound function
  if (!carePlan) {
    notFound();
  }

  // Format dates for display using formatDate utility
  const createdAtFormatted = formatDate(carePlan.createdAt, 'MMMM dd, yyyy');
  const approvedAtFormatted = carePlan.approvedAt ? formatDate(carePlan.approvedAt, 'MMMM dd, yyyy') : 'N/A';

  // Render the page with PageContainer for consistent layout
  return (
    <PageContainer>
      {/* Include Breadcrumbs for navigation context */}
      <Breadcrumbs />

      {/* Display care plan header with title, status, and actions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Care Plan: {carePlan.title}</CardTitle>
          <div className="space-x-2">
            <PlanStatusBadge status={carePlan.status} />
            {/* Include action buttons for editing or viewing history based on permissions */}
            {hasPermission('edit:care-plan') && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => router.push(`${ROUTES.CARE_PLANS}/${carePlanId}/edit`)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`${ROUTES.CARE_PLANS}/${carePlanId}/history`)}
            >
              <FileText className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Show care plan metadata including creation date, author, and confidence score */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <div>
              <p className="text-sm text-gray-500">
                Created On: {createdAtFormatted}
              </p>
              <p className="text-sm text-gray-500">
                Approved On: {approvedAtFormatted}
              </p>
            </div>
            <div>
              <ConfidenceScore score={carePlan.confidenceScore} />
            </div>
          </div>

          {/* Render care plan description */}
          <div className="mt-4">
            <h3 className="text-lg font-semibold">Description</h3>
            <p className="text-gray-700">{carePlan.description}</p>
          </div>

          {/* Display GoalTracker component for visualizing goal progress */}
          <div className="mt-6">
            <GoalTracker carePlan={carePlan} />
          </div>

          {/* Show InterventionList component for displaying interventions */}
          <div className="mt-6">
            <InterventionList
              interventions={carePlan.interventions}
              onAddIntervention={() => {
                // Implement add intervention logic
              }}
              onRemoveIntervention={(index) => {
                // Implement remove intervention logic
              }}
              onUpdateIntervention={(index, intervention) => {
                // Implement update intervention logic
              }}
            />
          </div>
        </CardContent>
        <CardFooter>
          {/* Add any additional actions or information here */}
        </CardFooter>
      </Card>
    </PageContainer>
  );
};

export default CarePlanDetailPage;