# src/web/components/services-plans/needs-assessment.tsx
```tsx
import React, { useState, useEffect } from 'react'; // react ^18.2.0
import { useForm } from 'react-hook-form'; // react-hook-form ^7.43.9
import { zodResolver } from '@hookform/resolvers/zod'; // @hookform/resolvers/zod ^2.0.0

import { needsAssessmentFormSchema } from '../../lib/schemas/service-plan'; // Validation schema for needs assessment form
import { NeedsAssessment, NeedsAssessmentFormData } from '../../types/service-plan'; // Type definitions for needs assessment data
import useAuth from '../../hooks/use-auth'; // Authentication hook for user context and permissions
import { useNeedsAssessment, useCreateNeedsAssessment, useUpdateNeedsAssessment } from '../../hooks/use-services-plans'; // Custom hooks for needs assessment data management
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormActions } from '../ui/form'; // Form components for structured form layout
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../ui/card'; // Card components for structured content layout
import { Button } from '../ui/button'; // Button component for form actions
import { Textarea } from '../ui/textarea'; // Textarea component for multi-line text input
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'; // Tabs component for organizing assessment sections
import { LoadingSpinner } from '../common/loading-spinner'; // Loading indicator for async operations

/**
 * Generates default values for the needs assessment form
 * @param clientId string
 * @param existingAssessment NeedsAssessment | null
 * @returns NeedsAssessmentFormData Default form values
 */
const getDefaultValues = (clientId: string, existingAssessment: NeedsAssessment | null): NeedsAssessmentFormData => {
  // Return default values for a new assessment if no existing assessment is provided
  if (!existingAssessment) {
    return {
      clientId: clientId,
      assessmentData: {},
      notes: '',
    };
  }

  // Return values from existing assessment if provided
  return {
    clientId: existingAssessment.clientId,
    assessmentData: existingAssessment.assessmentData,
    notes: existingAssessment.notes,
  };
};

interface AssessmentDomain {
  name: string;
  title: string;
  description: string;
  fields: {
    name: string;
    label: string;
    type: 'select' | 'textarea';
    options?: string[];
  }[];
}

/**
 * Component for conducting and displaying needs assessments for clients
 * @param clientId string
 * @param assessmentId string (optional)
 * @param onSuccess (assessmentId: string) => void (optional)
 * @param onCancel () => void (optional)
 * @param readOnly boolean (optional)
 * @returns JSX.Element Rendered needs assessment form or display
 */
interface NeedsAssessmentProps {
  clientId: string;
  assessmentId?: string;
  onSuccess?: (assessmentId: string) => void;
  onCancel?: () => void;
  readOnly?: boolean;
}

const NeedsAssessment: React.FC<NeedsAssessmentProps> = ({ clientId, assessmentId, onSuccess, onCancel, readOnly }) => {
  // Get user context using useAuth hook to determine permissions
  const auth = useAuth();

  // Initialize state for active tab and loading state
  const [activeTab, setActiveTab] = useState<string>('physical');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Fetch existing assessment data if assessmentId is provided using useNeedsAssessment hook
  const { data: existingAssessment, isLoading: isAssessmentLoading } = useNeedsAssessment(assessmentId || '', {
    enabled: !!assessmentId,
  });

  // Initialize form with react-hook-form and zod validation using needsAssessmentFormSchema
  const form = useForm<NeedsAssessmentFormData>({
    resolver: zodResolver(needsAssessmentFormSchema),
    defaultValues: useMemo(() => getDefaultValues(clientId, existingAssessment || null), [clientId, existingAssessment]),
    mode: 'onSubmit',
  });

  // Set up form submission handler with createNeedsAssessment or updateNeedsAssessment mutation
  const { mutate: createAssessment, isLoading: isCreateLoading } = useCreateNeedsAssessment({
    onSuccess: (data: NeedsAssessment) => {
      setIsSubmitting(false);
      onSuccess?.(data.id);
    },
    onError: () => {
      setIsSubmitting(false);
    },
  });

  const { mutate: updateAssessment, isLoading: isUpdateLoading } = useUpdateNeedsAssessment({
    onSuccess: () => {
      setIsSubmitting(false);
      onSuccess?.(assessmentId || '');
    },
    onError: () => {
      setIsSubmitting(false);
    },
  });

  // Define assessment domains
  const assessmentDomains: AssessmentDomain[] = [
    {
      name: 'physical',
      title: 'Physical Needs',
      description: 'Assessment of physical capabilities and needs',
      fields: [
        { name: 'mobility', label: 'Mobility', type: 'select', options: ['Independent', 'Needs Assistance', 'Dependent', 'Not Applicable'] },
        { name: 'adl', label: 'Activities of Daily Living', type: 'select', options: ['Independent', 'Needs Assistance', 'Dependent', 'Not Applicable'] },
        { name: 'physicalNotes', label: 'Additional Notes', type: 'textarea' },
      ],
    },
    {
      name: 'cognitive',
      title: 'Cognitive Needs',
      description: 'Assessment of cognitive capabilities and needs',
      fields: [
        { name: 'memory', label: 'Memory', type: 'select', options: ['No Impairment', 'Mild Impairment', 'Moderate Impairment', 'Severe Impairment'] },
        { name: 'problemSolving', label: 'Problem Solving', type: 'select', options: ['No Impairment', 'Mild Impairment', 'Moderate Impairment', 'Severe Impairment'] },
        { name: 'cognitiveNotes', label: 'Additional Notes', type: 'textarea' },
      ],
    },
    {
      name: 'social',
      title: 'Social Needs',
      description: 'Assessment of social support and needs',
      fields: [
        { name: 'socialSupport', label: 'Social Support Network', type: 'select', options: ['Strong', 'Moderate', 'Limited', 'None'] },
        { name: 'communityEngagement', label: 'Community Engagement', type: 'select', options: ['Active', 'Occasional', 'Rare', 'None'] },
        { name: 'socialNotes', label: 'Additional Notes', type: 'textarea' },
      ],
    },
    {
      name: 'emotional',
      title: 'Emotional Needs',
      description: 'Assessment of emotional and psychological needs',
      fields: [
        { name: 'mentalHealth', label: 'Mental Health Status', type: 'select', options: ['Stable', 'Mild Concerns', 'Moderate Concerns', 'Severe Concerns'] },
        { name: 'copingSkills', label: 'Coping Skills', type: 'select', options: ['Strong', 'Adequate', 'Limited', 'Poor'] },
        { name: 'emotionalNotes', label: 'Additional Notes', type: 'textarea' },
      ],
    },
    {
      name: 'environmental',
      title: 'Environmental Needs',
      description: 'Assessment of living environment and accessibility',
      fields: [
        { name: 'housingStability', label: 'Housing Stability', type: 'select', options: ['Stable', 'At Risk', 'Unstable', 'Homeless'] },
        { name: 'accessibility', label: 'Home Accessibility', type: 'select', options: ['Fully Accessible', 'Partially Accessible', 'Not Accessible', 'Unknown'] },
        { name: 'environmentalNotes', label: 'Additional Notes', type: 'textarea' },
      ],
    },
    {
      name: 'summary',
      title: 'Assessment Summary',
      description: 'Overall summary and additional notes',
      fields: [
        { name: 'priorityNeeds', label: 'Priority Needs', type: 'textarea' },
        { name: 'strengths', label: 'Client Strengths', type: 'textarea' },
        { name: 'notes', label: 'Additional Notes', type: 'textarea' },
      ],
    },
  ];

  // Implement form submission handler
  const onSubmit = async (data: NeedsAssessmentFormData) => {
    setIsSubmitting(true);
    if (assessmentId) {
      updateAssessment({ id: assessmentId, data });
    } else {
      createAssessment(data);
    }
  };

  // Implement conditional rendering based on readOnly prop
  if (readOnly) {
    if (isAssessmentLoading || !existingAssessment) {
      return <LoadingSpinner text="Loading Assessment..." />;
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>Needs Assessment Summary</CardTitle>
          <CardDescription>Summary of the needs assessment for client {clientId}</CardDescription>
        </CardHeader>
        <CardContent>
          <AssessmentSummary assessment={existingAssessment} />
        </CardContent>
        <CardFooter>
          <Button onClick={onCancel}>Close</Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Needs Assessment</CardTitle>
        <CardDescription>Complete the needs assessment for client {clientId}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <input type="hidden" {...form.register('clientId')} />
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                {assessmentDomains.map((domain) => (
                  <TabsTrigger key={domain.name} value={domain.name}>
                    {domain.title}
                  </TabsTrigger>
                ))}
              </TabsList>
              {assessmentDomains.map((domain) => (
                <TabsContent key={domain.name} value={domain.name} className="space-y-4">
                  <AssessmentDomainForm domain={domain} control={form.control} readOnly={readOnly || false} />
                </TabsContent>
              ))}
            </Tabs>
            <FormActions>
              <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting || isCreateLoading || isUpdateLoading ? (
                  <>
                    <LoadingSpinner size="sm" color="white" />
                    Submitting...
                  </>
                ) : (
                  'Submit'
                )}
              </Button>
            </FormActions>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

interface AssessmentDomainFormProps {
  domain: AssessmentDomain;
  control: any;
  readOnly: boolean;
}

/**
 * Sub-component for rendering a specific assessment domain form
 * @param domain AssessmentDomain
 * @param control Control from react-hook-form
 * @param readOnly boolean
 * @returns JSX.Element Rendered assessment domain form
 */
const AssessmentDomainForm: React.FC<AssessmentDomainFormProps> = ({ domain, control, readOnly }) => {
  return (
    <div className="space-y-4">
      {domain.fields.map((field) => (
        <FormItem key={field.name}>
          <FormLabel required={field.type !== 'textarea'}>{field.label}</FormLabel>
          <FormControl>
            {field.type === 'select' ? (
              <select
                className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                {...control.register(`assessmentData.${domain.name}.${field.name}`)}
                disabled={readOnly}
              >
                <option value="">Select {field.label}</option>
                {field.options?.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <Textarea
                placeholder={`Enter ${field.label.toLowerCase()}`}
                {...control.register(`assessmentData.${domain.name}.${field.name}`)}
                readOnly={readOnly}
              />
            )}
          </FormControl>
          <FormMessage />
        </FormItem>
      ))}
    </div>
  );
};

interface AssessmentSummaryProps {
  assessment: NeedsAssessment;
}

/**
 * Sub-component for displaying a summary of the needs assessment
 * @param assessment NeedsAssessment
 * @returns JSX.Element Rendered assessment summary
 */
const AssessmentSummary: React.FC<AssessmentSummaryProps> = ({ assessment }) => {
  return (
    <div className="space-y-4">
      {Object.entries(assessment.assessmentData).map(([domainName, domainData]) => (
        <div key={domainName} className="space-y-2">
          <h3>{domainName}</h3>
          {Object.entries(domainData as Record<string, any>).map(([fieldName, fieldValue]) => (
            <div key={fieldName} className="flex items-start space-x-2">
              <dt className="font-medium text-gray-900">{fieldName}:</dt>
              <dd className="text-gray-700">{fieldValue}</dd>
            </div>
          ))}
        </div>
      ))}
      <div>
        <h3>Notes</h3>
        <p>{assessment.notes}</p>
      </div>
    </div>
  );
};

export default NeedsAssessment;