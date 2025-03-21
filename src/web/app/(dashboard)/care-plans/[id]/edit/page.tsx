import React from 'react'; // react ^18.2.0
import { notFound, useRouter } from 'next/navigation'; // next/navigation ^14.0.0
import { Loader2 } from 'lucide-react'; // lucide-react ^0.284.0
import { PageContainer } from '../../../../../components/layout/page-container'; // src/web/components/layout/page-container.tsx
import { Breadcrumbs } from '../../../../../components/layout/breadcrumbs'; // src/web/components/layout/breadcrumbs.tsx
import { CarePlanForm } from '../../../../../components/care-plans/care-plan-form'; // src/web/components/care-plans/care-plan-form.tsx
import { useCarePlan } from '../../../../../hooks/use-care-plans'; // src/web/hooks/use-care-plans.ts
import useAuth from '../../../../../hooks/use-auth'; // src/web/hooks/use-auth.ts
import { ROUTES } from '../../../../../config/constants'; // src/web/config/constants.ts

interface CarePlanEditPageProps {
  params: {
    id: string;
  };
}

/**
 * Generates metadata for the care plan edit page
 * @param {object} { params } - Object containing route parameters
 * @returns {object} Page metadata including title and description
 */
export async function generateMetadata({ params }: CarePlanEditPageProps) {
  // Extract the care plan ID from the params object
  const { id } = params;

  // Return metadata object with dynamic title including the care plan ID
  return {
    title: `Edit Care Plan - ${id}`, // Include appropriate description for SEO
    description: `Edit care plan with ID ${id} on Revolucare`,
  };
}

/**
 * Page component that provides an interface for editing an existing care plan
 * @param {object} { params } - Object containing route parameters
 * @returns {JSX.Element} Rendered care plan edit page
 */
const CarePlanEditPage: React.FC<CarePlanEditPageProps> = ({ params }) => {
  // Extract the care plan ID from the params object
  const { id: carePlanId } = params;

  // Use the useCarePlan hook to fetch the care plan data by ID
  const { data: carePlan, isLoading, isError, error } = useCarePlan(carePlanId);

  // Use the useAuth hook to get user information and permissions
  const { hasPermission, requireAuth } = useAuth();

  // Use the useRouter hook for navigation
  const router = useRouter();

  // Handle loading state with a loading indicator
  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-48">
          <Loader2 className="mr-2 h-6 w-6 animate-spin" />
          Loading care plan...
        </div>
      </PageContainer>
    );
  }

  // Handle error state with appropriate error message
  if (isError) {
    return (
      <PageContainer>
        <div className="text-red-500">Error: {error?.message || 'Failed to load care plan.'}</div>
      </PageContainer>
    );
  }

  // If care plan is not found, call the notFound function
  if (!carePlan) {
    notFound();
  }

  // Check user permissions to edit the care plan
  if (!requireAuth() || !hasPermission('edit:care-plan')) {
    // If user doesn't have permission, redirect to view page
    router.push(`${ROUTES.CARE_PLANS}/${carePlanId}`);
    return null;
  }

  // Render the page with PageContainer for consistent layout
  return (
    <PageContainer>
      {/* Include Breadcrumbs for navigation context */}
      <Breadcrumbs />

      {/* Render the CarePlanForm component with the care plan data */}
      {carePlan && (
        <CarePlanForm
          initialData={carePlan}
          clientId={carePlan.clientId}
          onSuccess={(updatedCarePlan) => {
            // Handle successful form submission by navigating to the care plan view page
            router.push(`${ROUTES.CARE_PLANS}/${updatedCarePlan.id}`);
          }}
        />
      )}
    </PageContainer>
  );
};

export default CarePlanEditPage;