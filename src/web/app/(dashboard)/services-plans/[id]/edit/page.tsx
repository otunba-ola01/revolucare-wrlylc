# src/web/app/(dashboard)/services-plans/[id]/edit/page.tsx
```tsx
import React from 'react'; // react ^18.2.0
import { notFound, useRouter } from 'next/navigation'; // next/navigation ^14.0.0
import { PageContainer } from '../../../../components/layout/page-container'; // src/web/components/layout/page-container.tsx
import { Breadcrumbs } from '../../../../components/layout/breadcrumbs'; // src/web/components/layout/breadcrumbs.tsx
import { ServicePlanForm } from '../../../../components/services-plans/service-plan-form'; // src/web/components/services-plans/service-plan-form.tsx
import { LoadingSpinner } from '../../../../components/common/loading-spinner'; // src/web/components/common/loading-spinner.tsx
import { useServicesPlan } from '../../../../hooks/use-services-plans'; // src/web/hooks/use-services-plans.ts
import { ServicesPlanFormData } from '../../../../types/service-plan'; // src/web/types/service-plan.ts

/**
 * Page component for editing an existing service plan
 * @param {object} params - The parameters object containing the service plan ID
 * @returns {JSX.Element} Rendered page component
 */
const ServicePlanEditPage: React.FC<{ params: { id: string } }> = ({ params }) => {
  // LD1: Extract the service plan ID from the URL params
  const { id } = params;

  // LD1: Initialize router for navigation
  const router = useRouter();

  // LD1: Fetch the service plan data using useServicesPlan hook
  const { data: servicePlan, isLoading, error } = useServicesPlan(id);

  // LD1: Handle loading state with LoadingSpinner component
  if (isLoading) {
    return (
      <PageContainer>
        <LoadingSpinner text="Loading service plan..." />
      </PageContainer>
    );
  }

  // LD1: Handle not found case with notFound() function if service plan doesn't exist
  if (!servicePlan) {
    notFound();
  }

  // LD1: Handle error state with appropriate error message
  if (error) {
    return (
      <PageContainer>
        <div className="text-red-500">Error: {error.message}</div>
      </PageContainer>
    );
  }

  // LD1: Transform the fetched service plan data into the form data format
  const initialFormData: ServicesPlanFormData = {
    clientId: servicePlan.clientId,
    carePlanId: servicePlan.carePlanId || '',
    title: servicePlan.title,
    description: servicePlan.description,
    needsAssessmentId: servicePlan.needsAssessmentId,
    status: servicePlan.status,
    services: servicePlan.services.map(service => ({
      id: service.id,
      serviceType: service.serviceType,
      providerId: service.providerId || '',
      description: service.description,
      frequency: service.frequency,
      duration: service.duration,
      estimatedCost: service.estimatedCost,
      status: service.status,
    }) as any),
    fundingSources: servicePlan.fundingSources.map(fundingSource => ({
      id: fundingSource.id,
      name: fundingSource.name,
      type: fundingSource.type,
      coveragePercentage: fundingSource.coveragePercentage,
      coverageAmount: fundingSource.coverageAmount,
      verificationStatus: fundingSource.verificationStatus,
      details: fundingSource.details || null,
    }) as any),
  };

  // LD1: Implement success handler to navigate back to the service plan details page
  const onSuccess = () => {
    router.push(`/services-plans/${id}`);
  };

  // LD1: Render the page with PageContainer, Breadcrumbs, and ServicePlanForm components
  return (
    <PageContainer>
      {/* LD1: Navigation breadcrumbs for page context */}
      <Breadcrumbs />

      {/* LD1: Form component for editing service plans */}
      {/* LD1: Pass the service plan data to the ServicePlanForm component */}
      <ServicePlanForm
        clientId={servicePlan.clientId}
        initialData={initialFormData}
        onSuccess={onSuccess}
      />
    </PageContainer>
  );
};

// IE3: Be generous about your exports so long as it doesn't create a security risk.
export default ServicePlanEditPage;