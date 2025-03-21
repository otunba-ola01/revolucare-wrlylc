/**
 * @file Form-related type definitions for the Revolucare application
 * This file centralizes form-related type definitions used across the application
 * for consistent form state management, validation, and submission.
 */

import { 
  FieldValues, 
  UseFormReturn, 
  FieldErrors, 
  UseFormProps, 
  SubmitHandler, 
  FieldError 
} from 'react-hook-form'; // v7.43.9
import { z, ZodSchema } from 'zod'; // v3.21.4

/**
 * Configuration options for the useForm hook
 */
export interface FormConfig<T extends FieldValues = any> {
  /**
   * Initial values for form fields
   */
  defaultValues?: Record<string, any>;
  
  /**
   * Zod schema for form validation
   */
  validationSchema?: ZodSchema<any>;
  
  /**
   * Callback function to handle form submission
   */
  onSubmit: SubmitHandler<T>;
  
  /**
   * Form validation mode
   * @default "onSubmit"
   */
  mode?: string;
}

/**
 * Represents the current state of a form
 */
export interface FormState {
  /**
   * Whether the form is currently being submitted
   */
  isSubmitting: boolean;
  
  /**
   * Whether the form was successfully submitted
   */
  isSubmitSuccessful: boolean;
  
  /**
   * Whether all form fields are valid
   */
  isValid: boolean;
  
  /**
   * Whether any form field has been modified
   */
  isDirty: boolean;
  
  /**
   * Whether form validation is in progress
   */
  isValidating: boolean;
  
  /**
   * Number of times the form has been submitted
   */
  submitCount: number;
  
  /**
   * Object containing validation errors for form fields
   */
  errors: Record<string, FormError>;
}

/**
 * Represents a form field validation error
 */
export interface FormError {
  /**
   * Type of validation error
   */
  type: string;
  
  /**
   * Error message to display
   */
  message: string;
  
  /**
   * Reference to the form element with the error
   */
  ref: any;
}

/**
 * Return type for the useForm hook with enhanced functionality
 */
export interface UseFormHookReturn<T extends FieldValues = any> {
  /**
   * Current state of the form
   */
  formState: FormState;
  
  /**
   * Function to handle form submission
   */
  handleSubmit: UseFormReturn<T>['handleSubmit'];
  
  /**
   * Function to register form fields
   */
  register: UseFormReturn<T>['register'];
  
  /**
   * Object to control form fields in controlled components
   */
  control: UseFormReturn<T>['control'];
  
  /**
   * Function to reset form values
   */
  reset: UseFormReturn<T>['reset'];
  
  /**
   * Function to set a specific form field value
   */
  setValue: UseFormReturn<T>['setValue'];
  
  /**
   * Function to get current form values
   */
  getValues: UseFormReturn<T>['getValues'];
  
  /**
   * Function to watch form field values
   */
  watch: UseFormReturn<T>['watch'];
  
  /**
   * Function to manually set error for a form field
   */
  setError: UseFormReturn<T>['setError'];
  
  /**
   * Function to clear form errors
   */
  clearErrors: UseFormReturn<T>['clearErrors'];
  
  /**
   * Function to trigger validation for specified fields
   */
  trigger: UseFormReturn<T>['trigger'];
}

/**
 * Configuration options for multi-step forms
 */
export interface MultiStepFormConfig {
  /**
   * Array of step names/identifiers
   */
  steps: string[];
  
  /**
   * Index of the initial step (0-based)
   * @default 0
   */
  initialStep: number;
}

/**
 * State and navigation methods for multi-step forms
 */
export interface MultiStepFormState {
  /**
   * Current step index (0-based)
   */
  currentStep: number;
  
  /**
   * Name/identifier of the current step
   */
  currentStepName: string;
  
  /**
   * Total number of steps
   */
  totalSteps: number;
  
  /**
   * Whether the current step is the first step
   */
  isFirstStep: boolean;
  
  /**
   * Whether the current step is the last step
   */
  isLastStep: boolean;
  
  /**
   * Progress percentage (0-100)
   */
  progress: number;
  
  /**
   * Navigate to a specific step by index
   */
  goToStep: (step: number) => void;
  
  /**
   * Navigate to the next step
   */
  goToNextStep: () => void;
  
  /**
   * Navigate to the previous step
   */
  goToPreviousStep: () => void;
}

/**
 * State and methods for form submission handling
 */
export interface FormSubmissionState<T = any> {
  /**
   * Whether the form is currently being submitted
   */
  isSubmitting: boolean;
  
  /**
   * Whether the form was successfully submitted
   */
  isSubmitSuccessful: boolean;
  
  /**
   * Error object if submission failed
   */
  error: Error | null;
  
  /**
   * Function to submit the form
   */
  submit: (data: T) => Promise<void>;
  
  /**
   * Function to reset the submission state
   */
  reset: () => void;
}

/**
 * Represents the validation state of a form field
 */
export interface FieldState {
  /**
   * Whether the field has a validation error
   */
  invalid: boolean;
  
  /**
   * Whether the field value has been modified
   */
  isDirty: boolean;
  
  /**
   * Whether the field has been touched/focused
   */
  isTouched: boolean;
  
  /**
   * Error message if validation failed
   */
  error?: string;
}

/**
 * State and methods for managing form data across multiple steps or components
 */
export interface FormDataState<T = Record<string, any>> {
  /**
   * Current form data
   */
  data: T;
  
  /**
   * Function to update form data (partial update)
   */
  updateData: (updates: Partial<T>) => void;
  
  /**
   * Function to reset form data to initial values
   */
  resetData: () => void;
}

/**
 * Type definition for form data transformations
 * A function that transforms form data before submission or after retrieval
 */
export type FormTransformation<T = any, R = any> = (data: T) => R;

/**
 * Type definition for form validation modes
 * Controls when validation occurs during form interaction
 */
export type ValidationMode = 'onSubmit' | 'onChange' | 'onBlur' | 'onTouched' | 'all';