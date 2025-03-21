/**
 * Custom React hook that provides enhanced form handling capabilities for the Revolucare platform.
 * This hook wraps react-hook-form with additional functionality for validation, error handling,
 * multi-step forms, and form state persistence.
 */

import { useForm as reactUseForm, UseFormProps, FieldValues, SubmitHandler, FieldErrors } from 'react-hook-form'; // v7.43.9
import { zodResolver } from '@hookform/resolvers/zod'; // v3.1.0
import { useState, useEffect, useCallback, useMemo } from 'react'; // v18.2.0

import { 
  FormConfig, 
  FormState, 
  FormError, 
  UseFormHookReturn, 
  MultiStepFormConfig, 
  MultiStepFormState, 
  FormSubmissionState 
} from '../../types/form';

import { 
  formatFormErrors, 
  serializeFormData, 
  deserializeFormData, 
  validateFormData, 
  getStepProgress 
} from '../lib/utils/form';

import { useLocalStorage } from './use-local-storage';
import { useToast } from './use-toast';

/**
 * Enhanced version of react-hook-form's useForm hook with additional functionality
 * for validation, error handling, and data transformation.
 * 
 * @template T - Type of form values
 * @param {FormConfig<T>} config - Configuration options for the form
 * @returns {UseFormHookReturn<T>} Enhanced form control object
 * 
 * @example
 * const { 
 *   register, 
 *   handleSubmit, 
 *   formState 
 * } = useForm({
 *   defaultValues: { name: '', email: '' },
 *   validationSchema: z.object({
 *     name: z.string().min(2),
 *     email: z.string().email()
 *   }),
 *   onSubmit: (data) => console.log(data)
 * });
 */
export function useForm<T extends FieldValues = any>(
  config: FormConfig<T>
): UseFormHookReturn<T> {
  const { defaultValues, validationSchema, onSubmit, mode = 'onSubmit' } = config;
  
  // Initialize react-hook-form with zodResolver for schema validation
  const formMethods = reactUseForm<T>({
    defaultValues,
    resolver: validationSchema ? zodResolver(validationSchema) : undefined,
    mode: mode as UseFormProps['mode'],
  });
  
  const { formState: reactFormState, reset: reactReset, handleSubmit: reactHandleSubmit } = formMethods;
  
  // Format errors into consistent structure
  const formattedErrors = useMemo(() => {
    return formatFormErrors(reactFormState.errors);
  }, [reactFormState.errors]);
  
  // Custom reset function that properly handles defaultValues
  const reset = useCallback((values?: Record<string, any>) => {
    reactReset(values || defaultValues);
  }, [reactReset, defaultValues]);
  
  // Form submission handler with error handling and serialization
  const handleSubmit = useCallback((handler: SubmitHandler<T>) => {
    return reactHandleSubmit((data: T) => {
      try {
        // Serialize data before submission
        const serializedData = serializeFormData(data) as T;
        return handler(serializedData);
      } catch (error) {
        console.error('Form submission error:', error);
        throw error;
      }
    });
  }, [reactHandleSubmit]);
  
  // Enhanced form state with formatted errors
  const formState: FormState = {
    isSubmitting: reactFormState.isSubmitting,
    isSubmitSuccessful: reactFormState.isSubmitSuccessful,
    isValid: reactFormState.isValid,
    isDirty: reactFormState.isDirty,
    isValidating: reactFormState.isValidating,
    submitCount: reactFormState.submitCount,
    errors: formattedErrors,
  };
  
  // Return enhanced form control object
  return {
    ...formMethods,
    formState,
    handleSubmit,
    reset,
  } as UseFormHookReturn<T>;
}

/**
 * Hook for managing multi-step form state and navigation
 * 
 * @param {MultiStepFormConfig} config - Configuration options for the multi-step form
 * @returns {MultiStepFormState} Multi-step form state and navigation methods
 * 
 * @example
 * const { 
 *   currentStep,
 *   currentStepName,
 *   progress,
 *   goToNextStep,
 *   goToPreviousStep
 * } = useMultiStepForm({
 *   steps: ['Personal', 'Contact', 'Review'],
 *   initialStep: 0
 * });
 */
export function useMultiStepForm(
  config: MultiStepFormConfig
): MultiStepFormState {
  const { steps, initialStep = 0 } = config;
  
  // Initialize current step state
  const [currentStep, setCurrentStep] = useState(initialStep);
  
  // Calculate derived state
  const totalSteps = steps.length;
  const currentStepName = steps[currentStep] || '';
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;
  
  // Calculate progress percentage
  const progress = useMemo(() => {
    return getStepProgress(currentStep + 1, totalSteps);
  }, [currentStep, totalSteps]);
  
  // Navigation methods
  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step < totalSteps) {
      setCurrentStep(step);
    }
  }, [totalSteps]);
  
  const goToNextStep = useCallback(() => {
    if (!isLastStep) {
      setCurrentStep(prevStep => prevStep + 1);
    }
  }, [isLastStep]);
  
  const goToPreviousStep = useCallback(() => {
    if (!isFirstStep) {
      setCurrentStep(prevStep => prevStep - 1);
    }
  }, [isFirstStep]);
  
  return {
    currentStep,
    currentStepName,
    totalSteps,
    isFirstStep,
    isLastStep,
    progress,
    goToStep,
    goToNextStep,
    goToPreviousStep,
  };
}

/**
 * Hook for handling form submission state and errors
 * 
 * @template T - Type of form values
 * @param {SubmitHandler<T>} onSubmit - Form submission handler
 * @returns {FormSubmissionState<T>} Form submission state and methods
 * 
 * @example
 * const { 
 *   isSubmitting, 
 *   isSubmitSuccessful, 
 *   error, 
 *   submit, 
 *   reset 
 * } = useFormSubmission(async (data) => {
 *   await api.createUser(data);
 * });
 */
export function useFormSubmission<T = any>(
  onSubmit: SubmitHandler<T>
): FormSubmissionState<T> {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitSuccessful, setIsSubmitSuccessful] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const submit = useCallback(async (data: T) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      await onSubmit(data);
      setIsSubmitSuccessful(true);
    } catch (err) {
      setIsSubmitSuccessful(false);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsSubmitting(false);
    }
  }, [onSubmit]);
  
  const reset = useCallback(() => {
    setIsSubmitting(false);
    setIsSubmitSuccessful(false);
    setError(null);
  }, []);
  
  return {
    isSubmitting,
    isSubmitSuccessful,
    error,
    submit,
    reset,
  };
}

/**
 * Hook for persisting form state in localStorage
 * 
 * @param {string} formKey - Unique key for storing form data
 * @param {Record<string, any>} initialValues - Initial form values
 * @returns Object containing persisted values and update methods
 * 
 * @example
 * const { 
 *   values, 
 *   updateValues, 
 *   resetValues 
 * } = usePersistentForm('registration-form', { name: '', email: '' });
 */
export function usePersistentForm(
  formKey: string,
  initialValues: Record<string, any>
): {
  values: Record<string, any>;
  updateValues: (newValues: Record<string, any>) => void;
  resetValues: () => void;
} {
  const [values, setValues] = useLocalStorage(formKey, initialValues);
  
  const updateValues = useCallback((newValues: Record<string, any>) => {
    setValues(prevValues => ({
      ...prevValues,
      ...newValues,
    }));
  }, [setValues]);
  
  const resetValues = useCallback(() => {
    setValues(initialValues);
  }, [initialValues, setValues]);
  
  return {
    values,
    updateValues,
    resetValues,
  };
}

/**
 * Hook for managing and displaying form errors
 * 
 * @param {FieldErrors<any>} errors - Form errors from react-hook-form
 * @returns Error handling utilities
 * 
 * @example
 * const { 
 *   formattedErrors, 
 *   hasErrors, 
 *   getFieldError, 
 *   displayToastError 
 * } = useFormErrors(formState.errors);
 */
export function useFormErrors(
  errors: FieldErrors<any>
): {
  formattedErrors: Record<string, FormError>;
  hasErrors: boolean;
  getFieldError: (fieldName: string) => FormError | undefined;
  displayToastError: () => void;
} {
  const { toast } = useToast();
  
  // Format errors using formatFormErrors utility
  const formattedErrors = useMemo(() => {
    return formatFormErrors(errors);
  }, [errors]);
  
  // Calculate hasErrors flag
  const hasErrors = useMemo(() => {
    return Object.keys(formattedErrors).length > 0;
  }, [formattedErrors]);
  
  // Function to get a specific field error
  const getFieldError = useCallback((fieldName: string) => {
    return formattedErrors[fieldName];
  }, [formattedErrors]);
  
  // Function to display a toast notification with errors
  const displayToastError = useCallback(() => {
    if (hasErrors) {
      const firstErrorKey = Object.keys(formattedErrors)[0];
      const firstError = formattedErrors[firstErrorKey];
      
      toast({
        title: 'Form Error',
        description: firstError.message || 'Please check the form for errors.',
        variant: 'error',
        duration: 5000,
      });
    }
  }, [formattedErrors, hasErrors, toast]);
  
  return {
    formattedErrors,
    hasErrors,
    getFieldError,
    displayToastError,
  };
}