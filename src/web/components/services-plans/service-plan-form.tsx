import React, { useState, useEffect, useCallback } from 'react'; // react ^18.2.0
import { useRouter } from 'next/navigation'; // next/navigation
import {
  ServicesPlanFormData,
  ServiceItem,
  FundingSource,
  ServiceItemFormData,
  FundingSourceFormData,
} from '../../types/service-plan';
import { PlanStatus } from '../../config/constants';
import { servicesPlanFormSchema } from '../../lib/schemas/service-plan';
import { useForm } from '../../hooks/use-form';
import {
  useCreateServicesPlan,
  useUpdateServicesPlan,
  useClientNeedsAssessments,
} from '../../hooks/use-services-plans';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormSection,
  FormActions,
} from '../ui/form';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { ServiceItemList } from './service-item-list';
import { FundingSources } from './funding-sources';
import { CostEstimator } from './cost-estimator';

/**
 * A form component for creating and editing service plans
 * @param {Object} props - Component props
 * @param {string} props.clientId - The ID of the client for whom the service plan is being created
 * @param {ServicesPlanFormData} [props.initialData] - Initial data for the form (optional, for editing existing plans)
 * @param {string} [props.carePlanId] - The ID of the care plan associated with the service plan (optional)
 * @param {(data: ServicesPlanFormData) => void} [props.onSuccess] - Callback function to execute after successful form submission (optional)
 * @param {boolean} [props.readOnly] - If true, the form will be displayed in read-only mode (optional)
 * @returns {JSX.Element} Rendered service plan form component
 */
export const ServicePlanForm: React.FC<{
  clientId: string;
  initialData?: ServicesPlanFormData;
  carePlanId?: string;
  onSuccess?: (data: ServicesPlanFormData) => void;
  readOnly?: boolean;
}> = ({ clientId, initialData, carePlanId, onSuccess, readOnly = false }) => {
  // Initialize router for navigation after form submission
  const router = useRouter();

  // Set up state for services, funding sources, and cost estimate
  const [services, setServices] = useState<ServiceItem[]>(initialData?.services || []);
  const [fundingSources, setFundingSources] = useState<FundingSource[]>(initialData?.fundingSources || []);
  const [totalCost, setTotalCost] = useState<number>(0);

  // Fetch client needs assessments using useClientNeedsAssessments hook
  const { data: needsAssessments } = useClientNeedsAssessments(clientId);

  // Initialize form with useForm hook and servicesPlanFormSchema validation
  const form = useForm<ServicesPlanFormData>({
    resolver: zodResolver(servicesPlanFormSchema),
    defaultValues: {
      clientId: clientId,
      carePlanId: carePlanId || null,
      title: initialData?.title || '',
      description: initialData?.description || '',
      needsAssessmentId: initialData?.needsAssessmentId || '',
      status: initialData?.status || PlanStatus.DRAFT,
      services: initialData?.services || [],
      fundingSources: initialData?.fundingSources || [],
    },
    mode: 'onChange',
  });

  // Set up create and update mutations using useCreateServicesPlan and useUpdateServicesPlan hooks
  const { mutate: createServicePlan, isLoading: isCreating } = useCreateServicesPlan({
    onSuccess: (data) => {
      onSuccess?.(data);
      router.push(`/services-plans/${data.id}`);
    },
  });
  const { mutate: updateServicePlan, isLoading: isUpdating } = useUpdateServicesPlan({
    onSuccess: (data) => {
      onSuccess?.(data);
    },
  });

  // Populate form with initialData if provided (editing mode)
  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
      setServices(initialData.services);
      setFundingSources(initialData.fundingSources);
    }
  }, [initialData, form]);

  // Handle form submission with validation and API calls
  const handleSubmit = (data: ServicesPlanFormData) => {
    if (initialData) {
      updateServicePlan({ id: initialData.id, data });
    } else {
      createServicePlan(data);
    }
  };

  // Implement handlers for adding, editing, and removing service items
  const handleAddService = useCallback(() => {
    // TODO: Implement add service logic
    console.log('Add service');
  }, []);

  const handleEditService = useCallback((item: ServiceItem) => {
    // TODO: Implement edit service logic
    console.log('Edit service', item);
  }, []);

  const handleRemoveService = useCallback((itemId: string) => {
    // TODO: Implement remove service logic
    console.log('Remove service', itemId);
  }, []);

  // Implement handlers for managing funding sources
  const handleFundingSourcesChange = useCallback((newFundingSources: FundingSource[]) => {
    setFundingSources(newFundingSources);
  }, []);

  // Update cost estimate when services or funding sources change
  const handleEstimateGenerated = useCallback((estimate: any) => {
    setTotalCost(estimate?.totalCost || 0);
  }, []);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <CardContent>
          <FormSection title="Basic Information" description="Enter the basic details of the service plan.">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={readOnly} />
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
                    <Textarea {...field} disabled={readOnly} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="needsAssessmentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Needs Assessment</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={readOnly}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a needs assessment" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {needsAssessments?.map((assessment) => (
                        <SelectItem key={assessment.id} value={assessment.id}>
                          {assessment.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </FormSection>

          <FormSection title="Services" description="Define the services included in this plan.">
            <ServiceItemList
              items={services}
              onAdd={handleAddService}
              onEdit={handleEditService}
              onRemove={handleRemoveService}
              readOnly={readOnly}
            />
          </FormSection>

          <FormSection title="Funding Sources" description="Specify the funding sources for this plan.">
            <FundingSources
              clientId={clientId}
              fundingSources={fundingSources}
              onChange={handleFundingSourcesChange}
              totalCost={totalCost}
              readOnly={readOnly}
            />
          </FormSection>

          <FormSection title="Cost Estimate" description="View the estimated cost breakdown for this plan.">
            <CostEstimator
              servicesPlanId={initialData?.id}
              clientId={clientId}
              services={services}
              fundingSources={fundingSources}
              onEstimateGenerated={handleEstimateGenerated}
            />
          </FormSection>
        </CardContent>

        <FormActions>
          <Button type="button" variant="ghost" onClick={() => router.back()} disabled={readOnly}>
            Cancel
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting || readOnly}>
            {form.formState.isSubmitting ? 'Submitting...' : 'Submit'}
          </Button>
        </FormActions>
      </form>
    </Form>
  );
};