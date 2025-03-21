import React from 'react'; // React v18.2.0
import { useRouter, useSearchParams } from 'next/navigation'; // next/navigation v14.0.0
import { PageContainer } from '../../../../components/layout/page-container';
import { Breadcrumbs } from '../../../../components/layout/breadcrumbs';
import { ServicePlanForm } from '../../../../components/services-plans/service-plan-form';
import { useAuth } from '../../../../hooks/use-auth';
import { ServicesPlanFormData } from '../../../../types/service-plan';

/**
 * Page component for creating a new service plan
 * @returns Rendered create service plan page
 */
const CreateServicePlanPage: React.FC = () => {
  // Get router for navigation after form submission
  const router = useRouter();

  // Get search params to extract clientId from URL query
  const searchParams = useSearchParams();

  // Get authentication state and user role using useAuth hook
  const { requireAuth, isCaseManager, isAdmin } = useAuth();

  // Extract clientId from search params
  const clientId = searchParams.get('clientId');

  // Implement handleSuccess function to navigate to the created plan
  const handleSuccess = (data: ServicesPlanFormData) => {
    router.push(`/services-plans/${data.id}`);
  };

  // Verify user has permission to create service plans (case manager or admin)
  if (!requireAuth() || (!isCaseManager && !isAdmin)) {
    return <div>You do not have permission to view this page.</div>;
  }

  // Render page with breadcrumbs and title
  return (
    <PageContainer>
      <Breadcrumbs />
      <h1 className="text-2xl font-semibold mb-4">Create Service Plan</h1>

      {clientId ? (
        // Render ServicePlanForm component with clientId and success handler
        <ServicePlanForm clientId={clientId} onSuccess={handleSuccess} />
      ) : (
        // Handle case where clientId is missing with appropriate error message
        <div className="text-red-500">
          Error: Client ID is missing. Please provide a client ID to create a service plan.
        </div>
      )}
    </PageContainer>
  );
};

export default CreateServicePlanPage;