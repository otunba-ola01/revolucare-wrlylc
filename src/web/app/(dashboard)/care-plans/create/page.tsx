import React, { useState, useEffect } from 'react'; // react ^18.2.0
import { useRouter, useSearchParams } from 'next/navigation'; // next/navigation ^14.0.0
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '../../../../components/ui/card'; // src/web/components/ui/card.tsx
import { Button } from '../../../../components/ui/button'; // src/web/components/ui/button.tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../../components/ui/tabs'; // src/web/components/ui/tabs.tsx
import { PageContainer } from '../../../../components/layout/page-container'; // src/web/components/layout/page-container.tsx
import { Breadcrumbs } from '../../../../components/layout/breadcrumbs'; // src/web/components/layout/breadcrumbs.tsx
import { CarePlanForm } from '../../../../components/care-plans/care-plan-form'; // src/web/components/care-plans/care-plan-form.tsx
import { DocumentAnalysis } from '../../../../components/care-plans/document-analysis'; // src/web/components/care-plans/document-analysis.tsx
import { PlanOptions } from '../../../../components/care-plans/plan-options'; // src/web/components/care-plans/plan-options.tsx
import { useAuth } from '../../../../hooks/use-auth'; // src/web/hooks/use-auth.ts
import { useToast } from '../../../../hooks/use-toast'; // src/web/hooks/use-toast.ts
import { CarePlanOptionsResponse, CarePlanOption } from '../../../../types/care-plan'; // src/web/types/care-plan.ts

// Define the type for the workflow step
interface WorkflowStep {
  DOCUMENT_ANALYSIS: string;
  PLAN_OPTIONS: string;
  CREATE_PLAN: string;
}

// Define the workflow steps
const WorkflowStep: WorkflowStep = {
  DOCUMENT_ANALYSIS: 'document-analysis',
  PLAN_OPTIONS: 'plan-options',
  CREATE_PLAN: 'create-plan',
};

/**
 * Page component for creating a new care plan
 * @returns Rendered page component
 */
const CreateCarePlanPage: React.FC = () => {
  // Initialize router for navigation
  const router = useRouter();

  // Get search parameters to extract clientId
  const searchParams = useSearchParams();
  const clientId = searchParams.get('clientId');

  // Get user information from authentication context
  const { user } = useAuth();

  // Initialize toast notifications
  const { toast } = useToast();

  // Set up state for workflow step, AI-generated options, and selected option
  const [activeTab, setActiveTab] = useState(WorkflowStep.DOCUMENT_ANALYSIS);
  const [aiOptions, setAiOptions] = useState<CarePlanOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<CarePlanOption | null>(null);

  // Validate that clientId is provided, show error if missing
  useEffect(() => {
    if (!clientId) {
      toast({
        title: 'Missing Client ID',
        description: 'Please select a client to create a care plan.',
        variant: 'error',
      });
      // Redirect to a safe location if clientId is missing
      router.push('/care-plans');
    }
  }, [clientId, router, toast]);

  // Implement handleAnalysisComplete to handle document analysis results
  const handleAnalysisComplete = (options: CarePlanOptionsResponse) => {
    setAiOptions(options.options);
    setActiveTab(WorkflowStep.PLAN_OPTIONS);
  };

  // Implement handleOptionSelect to handle care plan option selection
  const handleOptionSelect = (option: CarePlanOption) => {
    setSelectedOption(option);
    setActiveTab(WorkflowStep.CREATE_PLAN);
  };

  // Implement handleCarePlanCreated to handle successful care plan creation
  const handleCarePlanCreated = (carePlan: any) => {
    toast({
      title: 'Care Plan Created',
      description: 'The care plan has been created successfully.',
      variant: 'success',
    });
    router.push(`/care-plans/${carePlan.id}`);
  };

  // Implement handleCustomPlan to switch to manual care plan creation
  const handleCustomPlan = () => {
    setSelectedOption(null);
    setActiveTab(WorkflowStep.CREATE_PLAN);
  };

  // Render page container with breadcrumbs for navigation context
  return (
    <PageContainer>
      <Breadcrumbs />

      {/* Render page title and description */}
      <Card>
        <CardHeader>
          <CardTitle>Create Care Plan</CardTitle>
        </CardHeader>
        <CardContent>
          {clientId ? (
            // Implement tabs for the multi-step workflow (Document Analysis, Plan Options, Create Plan)
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value={WorkflowStep.DOCUMENT_ANALYSIS}>
                  Document Analysis
                </TabsTrigger>
                <TabsTrigger
                  value={WorkflowStep.PLAN_OPTIONS}
                  disabled={aiOptions.length === 0}
                >
                  Plan Options
                </TabsTrigger>
                <TabsTrigger value={WorkflowStep.CREATE_PLAN}>
                  Create Plan
                </TabsTrigger>
              </TabsList>

              {/* Render DocumentAnalysis component in the first tab */}
              <TabsContent value={WorkflowStep.DOCUMENT_ANALYSIS}>
                <DocumentAnalysis
                  clientId={clientId}
                  onAnalysisComplete={handleAnalysisComplete}
                />
              </TabsContent>

              {/* Render PlanOptions component in the second tab if options are available */}
              <TabsContent value={WorkflowStep.PLAN_OPTIONS}>
                {aiOptions.length > 0 ? (
                  <PlanOptions
                    options={aiOptions}
                    selectedOption={selectedOption}
                    onSelectOption={handleOptionSelect}
                  />
                ) : (
                  <div>
                    <p>No AI-generated options available.</p>
                    <Button onClick={handleCustomPlan}>Create Custom Plan</Button>
                  </div>
                )}
              </TabsContent>

              {/* Render CarePlanForm component in the third tab with selected option data */}
              <TabsContent value={WorkflowStep.CREATE_PLAN}>
                <CarePlanForm
                  initialData={null}
                  clientId={clientId}
                  onSuccess={handleCarePlanCreated}
                />
              </TabsContent>
            </Tabs>
          ) : (
            <div>Loading...</div>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
};

export default CreateCarePlanPage;