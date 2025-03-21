/**
 * Utility functions for form handling in the Revolucare web application.
 * This file provides reusable functions for form error formatting, data transformation,
 * and form state management that are used across the application's form components and hooks.
 */

import { FieldErrors } from 'react-hook-form'; // v7.43.9
import { ZodError } from 'zod'; // v3.21.4
import { FormError } from '../../types/form';
import { sanitizeInput } from './validation';

/**
 * Extracts a human-readable error message from a form error object
 * 
 * @param error - Form error object or undefined
 * @returns Human-readable error message or undefined if no error
 */
export function getFormErrorMessage(error: FormError | undefined): string | undefined {
  if (!error) {
    return undefined;
  }

  return error.message || 'An error occurred. Please check your input.';
}

/**
 * Formats error objects from react-hook-form into a consistent structure
 * 
 * @param errors - Field errors from react-hook-form
 * @returns Formatted error objects by field name
 */
export function formatFormErrors(errors: FieldErrors<any>): Record<string, FormError> {
  const formattedErrors: Record<string, FormError> = {};

  if (!errors) {
    return formattedErrors;
  }

  Object.keys(errors).forEach((fieldName) => {
    const fieldError = errors[fieldName];
    
    if (fieldError) {
      formattedErrors[fieldName] = {
        type: fieldError.type || 'validation',
        message: fieldError.message || 'Invalid value',
        ref: fieldError.ref || null
      };
    }
  });

  return formattedErrors;
}

/**
 * Prepares form data for submission by sanitizing inputs and transforming values
 * 
 * @param data - Form data object
 * @returns Sanitized and transformed form data
 */
export function serializeFormData(data: Record<string, any>): Record<string, any> {
  const serialized: Record<string, any> = { ...data };

  Object.keys(serialized).forEach((key) => {
    const value = serialized[key];

    // Handle string values - sanitize to prevent XSS
    if (typeof value === 'string') {
      serialized[key] = sanitizeInput(value);
    }
    // Handle Date objects - convert to ISO string
    else if (value instanceof Date) {
      serialized[key] = value.toISOString();
    }
    // Handle nested objects recursively
    else if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof File)) {
      serialized[key] = serializeFormData(value);
    }
    // Handle arrays that might contain objects
    else if (Array.isArray(value)) {
      serialized[key] = value.map(item => {
        if (item !== null && typeof item === 'object' && !(item instanceof Date) && !(item instanceof File)) {
          return serializeFormData(item);
        }
        if (typeof item === 'string') {
          return sanitizeInput(item);
        }
        if (item instanceof Date) {
          return item.toISOString();
        }
        return item;
      });
    }
  });

  return serialized;
}

/**
 * Transforms API response data into a format suitable for form initialization
 * 
 * @param data - API response data
 * @returns Transformed data for form initialization
 */
export function deserializeFormData(data: Record<string, any>): Record<string, any> {
  const deserialized: Record<string, any> = { ...data };

  Object.keys(deserialized).forEach((key) => {
    const value = deserialized[key];

    // Convert ISO date strings to Date objects
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        deserialized[key] = date;
      }
    }
    // Handle nested objects recursively
    else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      deserialized[key] = deserializeFormData(value);
    }
    // Handle arrays that might contain objects or date strings
    else if (Array.isArray(value)) {
      deserialized[key] = value.map(item => {
        if (item !== null && typeof item === 'object') {
          return deserializeFormData(item);
        }
        if (typeof item === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(item)) {
          const date = new Date(item);
          if (!isNaN(date.getTime())) {
            return date;
          }
        }
        return item;
      });
    }
  });

  return deserialized;
}

/**
 * Validates form data against a schema and returns formatted errors
 * 
 * @param data - Form data to validate
 * @param schema - Zod schema to validate against
 * @returns Validation result with formatted errors
 */
export function validateFormData(
  data: Record<string, any>,
  schema: any
): { isValid: boolean; errors?: Record<string, FormError> } {
  try {
    schema.parse(data);
    return { isValid: true };
  } catch (error) {
    if (error instanceof ZodError) {
      const formattedErrors = formatZodErrors(error);
      return { isValid: false, errors: formattedErrors };
    }
    
    // Handle non-Zod errors
    return { 
      isValid: false, 
      errors: {
        _form: {
          type: 'validation',
          message: error instanceof Error ? error.message : 'Validation failed',
          ref: null
        }
      }
    };
  }
}

/**
 * Converts Zod validation errors to the application's FormError format
 * 
 * @param error - Zod error object
 * @returns Formatted error objects by field name
 */
export function formatZodErrors(error: ZodError): Record<string, FormError> {
  const formattedErrors: Record<string, FormError> = {};
  
  const flattenedErrors = error.flatten().fieldErrors;
  
  Object.entries(flattenedErrors).forEach(([key, messages]) => {
    if (messages && messages.length > 0) {
      formattedErrors[key] = {
        type: 'zod',
        message: messages[0],
        ref: null
      };
    }
  });
  
  // Handle form-level errors
  const formErrors = error.flatten().formErrors;
  if (formErrors.length > 0) {
    formattedErrors._form = {
      type: 'zod',
      message: formErrors[0],
      ref: null
    };
  }
  
  return formattedErrors;
}

/**
 * Calculates the progress percentage for multi-step forms
 * 
 * @param currentStep - Current step index (1-based)
 * @param totalSteps - Total number of steps
 * @returns Progress percentage (0-100)
 */
export function getStepProgress(currentStep: number, totalSteps: number): number {
  if (totalSteps <= 0) {
    return 0;
  }
  
  const progress = (currentStep / totalSteps) * 100;
  return Math.min(Math.max(progress, 0), 100);
}

/**
 * Creates a FormData object from a plain JavaScript object
 * Useful for file uploads and multipart form submissions
 * 
 * @param data - Form data object
 * @returns FormData object for file uploads
 */
export function createFormData(data: Record<string, any>): FormData {
  const formData = new FormData();
  
  Object.entries(data).forEach(([key, value]) => {
    // Handle arrays
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (item instanceof File) {
          formData.append(`${key}[${index}]`, item);
        } else if (typeof item === 'object' && item !== null) {
          formData.append(`${key}[${index}]`, JSON.stringify(item));
        } else {
          formData.append(`${key}[${index}]`, String(item));
        }
      });
    }
    // Handle File objects
    else if (value instanceof File) {
      formData.append(key, value);
    }
    // Handle null or undefined
    else if (value === null || value === undefined) {
      formData.append(key, '');
    }
    // Handle Date objects
    else if (value instanceof Date) {
      formData.append(key, value.toISOString());
    }
    // Handle objects
    else if (typeof value === 'object') {
      formData.append(key, JSON.stringify(value));
    }
    // Handle primitives
    else {
      formData.append(key, String(value));
    }
  });
  
  return formData;
}

/**
 * Extracts values from a form element into a structured object
 * 
 * @param form - HTML form element
 * @returns Extracted form values as an object
 */
export function extractFormValues(form: HTMLFormElement): Record<string, any> {
  const formData = new FormData(form);
  const values: Record<string, any> = {};
  
  formData.forEach((value, key) => {
    // Handle array fields with syntax like "items[0]" or "items[]"
    const arrayMatch = key.match(/^([^\[]+)\[(\d*)\]$/);
    
    if (arrayMatch) {
      const [, arrayName, indexStr] = arrayMatch;
      
      if (!values[arrayName]) {
        values[arrayName] = [];
      }
      
      const index = indexStr ? parseInt(indexStr, 10) : values[arrayName].length;
      
      // Ensure the array is large enough
      while (values[arrayName].length <= index) {
        values[arrayName].push(undefined);
      }
      
      values[arrayName][index] = value;
    }
    // Handle nested objects with syntax like "address.street"
    else if (key.includes('.')) {
      const parts = key.split('.');
      let current = values;
      
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!current[part]) {
          current[part] = {};
        }
        current = current[part];
      }
      
      current[parts[parts.length - 1]] = value;
    }
    // Handle regular fields
    else {
      values[key] = value;
    }
  });
  
  // Convert values to appropriate types
  Object.keys(values).forEach((key) => {
    const value = values[key];
    
    // Convert "true" and "false" strings to booleans
    if (value === 'true') {
      values[key] = true;
    } else if (value === 'false') {
      values[key] = false;
    }
    // Convert numeric strings to numbers
    else if (typeof value === 'string' && !isNaN(Number(value)) && !isNaN(parseFloat(value))) {
      values[key] = parseFloat(value);
    }
  });
  
  return values;
}