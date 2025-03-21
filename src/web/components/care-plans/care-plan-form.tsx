import React, { useState, useEffect } from 'react'; // react ^18.2.0
import { useRouter } from 'next/navigation'; // next/navigation ^13.4.0
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormSection,
  FormActions,
} from '../ui/form'; // src/web/components/ui/form.tsx
import { Button } from '../ui/button'; // src/web/components/ui/button.tsx
import { Input } from '../ui/input'; // src/web/components/ui/input.tsx
import { Textarea } from '../ui/textarea'; // src/web/components/ui/textarea.tsx
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select'; // src/web/components/ui/select.tsx
import { Calendar } from '../ui/calendar'; // src/web/components/ui/calendar.tsx
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/card'; // src/web/components/ui/card.tsx
import { Progress } from '../ui/progress'; // src/web/components/ui/progress.tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs'; // src/web/components/ui/tabs.tsx
import { GoalTracker } from './goal-tracker'; // src/web/components/care-plans/goal-tracker.tsx
import { InterventionList } from './intervention-list'; // src/web/components/care-plans/intervention-list.tsx
import { ConfidenceScore } from './confidence-score'; // src/web/components/care-plans/confidence-score.tsx
import {
  CarePlan,
  CarePlanFormData,
  CarePlanOption,
  GoalStatus,
  InterventionStatus,
  PlanStatus,
} from '../../types/care-plan'; // src/web/types/care-plan.ts
import { useForm, useMultiStepForm } from '../../hooks/use-form'; // src/web/hooks/use-form.ts
import { useCreateCarePlan, useUpdateCarePlan, useGenerateCarePlanOptions } from '../../hooks/use-care-plans'; // src/web/hooks/use-care-plans.ts
import { useToast } from '../../hooks/use-toast'; // src/web/hooks/use-toast.ts
import { carePlanFormSchema } from '../../lib/schemas/care-plan'; // src/web/lib/schemas/care-plan.ts
import { cn } from '../../lib/utils/color'; // src/web/lib/utils/color.ts
import {
  PlusIcon,
  TrashIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
} from 'lucide-react'; // lucide-react ^0.284.0
import { zodResolver } from '@hookform/resolvers/zod'; // @hookform/resolvers/zod ^3.1.0
import React from "react"; // react ^18.2.0

interface CarePlanFormProps {
  initialData: CarePlan | null;
  clientId: string;
  onSuccess: (carePlan: CarePlan) => void;
  className?: string;
}

/**
 * Generates default values for the care plan form based on existing care plan or empty template
 * @param existingCarePlan - CarePlan | null
 * @returns Default form values
 */
const getDefaultFormValues = (existingCarePlan: CarePlan | null): CarePlanFormData => {
  if (existingCarePlan) {
    return {
      clientId: existingCarePlan.clientId,
      title: existingCarePlan.title,
      description: existingCarePlan.description,
      goals: existingCarePlan.goals.map(goal => ({
        id: goal.id,
        description: goal.description,
        targetDate: goal.targetDate || undefined,
        status: goal.status || GoalStatus.PENDING,
        measures: goal.measures,
      })),
      interventions: existingCarePlan.interventions.map(intervention => ({
        id: intervention.id,
        description: intervention.description,
        frequency: intervention.frequency,
        duration: intervention.duration,
        responsibleParty: intervention.responsibleParty,
        status: intervention.status || InterventionStatus.PENDING,
      })),
      status: existingCarePlan.status || PlanStatus.DRAFT,
    };
  } else {
    return {
      clientId: '',
      title: '',
      description: '',
      goals: [],
      interventions: [],
      status: PlanStatus.DRAFT,
    };
  }
};

/**
 * Maps a selected AI-generated care plan option to form data structure
 * @param option - CarePlanOption
 * @param clientId - string
 * @returns Form data populated from the selected option
 */
const mapOptionToFormData = (option: CarePlanOption, clientId: string): CarePlanFormData => {
  return {
    clientId: clientId,
    title: option.title,
    description: option.description,
    goals: option.goals.map(goal => ({
      description: goal.description,
      targetDate: goal.targetDate || undefined,
      status: GoalStatus.PENDING,
      measures: goal.measures,
    })),
    interventions: option.interventions.map(intervention => ({
      description: intervention.description,
      frequency: intervention.frequency,
      duration: intervention.duration,
      responsibleParty: intervention.responsibleParty,
      status: InterventionStatus.PENDING,
    })),
    status: PlanStatus.DRAFT,
  };
};

/**
 * A comprehensive form component for creating and editing care plans
 * @param props - CarePlanFormProps
 * @returns Rendered form component
 */
export const CarePlanForm: React.FC<CarePlanFormProps> = ({
  initialData,
  clientId,
  onSuccess,
  className,
}) => {
  // Destructure initialData, clientId, onSuccess, and className props
  // Initialize router for navigation
  const router = useRouter();

  // Initialize toast notifications
  const { toast } = useToast();

  // Set up state for AI-generated options and selected option
  const [aiOptions, setAiOptions] = useState<CarePlanOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<CarePlanOption | null>(null);

  // Initialize form with validation schema and default values
  const form = useForm<CarePlanFormData>({
    resolver: zodResolver(carePlanFormSchema),
    defaultValues: getDefaultFormValues(initialData),
  });

  // Set up multi-step form with defined steps
  const { currentStep, goToNextStep, goToPreviousStep, isFirstStep, isLastStep, progress } =
    useMultiStepForm({
      steps: ['Details', 'Goals', 'Interventions'],
    });

  // Initialize mutation hooks for creating, updating, and generating care plans
  const { mutate: createCarePlan, isLoading: isCreating } = useCreateCarePlan({ onSuccess });
  const { mutate: updateCarePlan, isLoading: isUpdating } = useUpdateCarePlan({ onSuccess });
  const { mutate: generateAiOptions, isLoading: isGenerating } = useGenerateCarePlanOptions({
    onSuccess: (data) => {
      setAiOptions(data.options);
    },
    onError: () => {
      toast({
        title: 'Error generating AI options',
        description: 'Failed to generate care plan options. Please try again.',
        variant: 'error',
      });
    },
  });

  /**
   * Handles form submission based on whether it's a new plan or update
   * @param values - CarePlanFormData
   */
  const onSubmit = (values: CarePlanFormData) => {
    if (initialData) {
      updateCarePlan({ id: initialData.id, data: values });
    } else {
      createCarePlan(values);
    }
  };

  /**
   * Implements handlers for generating AI options and selecting an option
   */
  const handleGenerateAiOptions = () => {
    generateAiOptions({ clientId: clientId, documentIds: [], additionalContext: {}, includeOptions: true, optionsCount: 3 });
  };

  const handleSelectOption = (option: CarePlanOption) => {
    setSelectedOption(option);
    form.reset(mapOptionToFormData(option, clientId));
  };

  /**
   * Implements handlers for adding and removing goals and interventions
   */
  const handleAddGoal = () => {
    form.setValue('goals', [...form.getValues().goals, { description: '', measures: [] }]);
  };

  const handleRemoveGoal = (index: number) => {
    const updatedGoals = [...form.getValues().goals];
    updatedGoals.splice(index, 1);
    form.setValue('goals', updatedGoals);
  };

  const handleAddIntervention = () => {
    form.setValue('interventions', [...form.getValues().interventions, { description: '', frequency: '', duration: '', responsibleParty: '' }]);
  };

  const handleRemoveIntervention = (index: number) => {
    const updatedInterventions = [...form.getValues().interventions];
    updatedInterventions.splice(index, 1);
    form.setValue('interventions', updatedInterventions);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={cn('space-y-8', className)}>
        <Progress value={progress} />

        {/* Render different form content based on current step */}
        {currentStep === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Care Plan Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Care plan title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Care plan description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}

        {currentStep === 1 && (
          <GoalTracker
            carePlan={{
              id: '',
              clientId: '',
              createdById: '',
              title: '',
              description: '',
              status: PlanStatus.DRAFT,
              confidenceScore: 0,
              version: 0,
              previousVersionId: null,
              approvedById: null,
              approvedAt: null,
              approvalNotes: null,
              goals: form.getValues().goals,
              interventions: [],
              createdAt: '',
              updatedAt: '',
            }}
            readOnly={false}
            onGoalUpdate={(updatedCarePlan) => {
              form.setValue('goals', updatedCarePlan.goals);
            }}
          />
        )}

        {currentStep === 2 && (
          <InterventionList
            interventions={form.getValues().interventions}
            onAddIntervention={handleAddIntervention}
            onRemoveIntervention={handleRemoveIntervention}
            onUpdateIntervention={(index, intervention) => {
              const updatedInterventions = [...form.getValues().interventions];
              updatedInterventions[index] = intervention;
              form.setValue('interventions', updatedInterventions);
            }}
            readOnly={false}
          />
        )}

        {/* Render navigation buttons for moving between steps */}
        <FormActions>
          {!isFirstStep && (
            <Button variant="outline" onClick={goToPreviousStep}>
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Previous
            </Button>
          )}
          {!isLastStep ? (
            <Button type="button" onClick={goToNextStep}>
              Next
              <ArrowRightIcon className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" disabled={isCreating || isUpdating}>
              {isCreating || isUpdating ? 'Submitting...' : 'Submit'}
            </Button>
          )}
        </FormActions>
      </form>
    </Form>
  );
};