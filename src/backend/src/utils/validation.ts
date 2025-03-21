/**
 * Utility module that provides data validation functions and helpers for the Revolucare platform.
 * It implements a consistent approach to input validation across the application,
 * leveraging Zod for schema validation and providing custom validation utilities.
 * 
 * @module utils/validation
 */

import { z } from 'zod'; // zod@3.21.4
import { ValidationError } from '../interfaces/error.interface';
import { errorFactory } from './error-handler';
import { ErrorCodes } from '../constants/error-codes';

/**
 * Validates data against a Zod schema and returns the validated data or throws a validation error
 * 
 * @param schema - The Zod schema to validate against
 * @param data - The data to validate
 * @returns Validated and type-safe data if validation succeeds
 * @throws AppError with VALIDATION_ERROR code if validation fails
 */
export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    // Attempt to parse the data using the provided schema
    return schema.parse(data);
  } catch (error) {
    // If validation fails, transform Zod errors into ValidationError format
    if (error instanceof z.ZodError) {
      const validationErrors = formatValidationErrors(error);
      
      // Create and throw a validation error using errorFactory
      throw errorFactory.createValidationError(
        'Validation failed',
        { validationErrors },
        error
      );
    }
    
    // If it's not a ZodError, rethrow it
    throw error;
  }
}

/**
 * Validates request data against a schema and returns the validated data
 * 
 * @param schema - The Zod schema to validate against
 * @param requestData - The request data to validate
 * @returns Validated and type-safe request data
 * @throws AppError with VALIDATION_ERROR code if validation fails
 */
export function validateRequest<T>(schema: z.ZodSchema<T>, requestData: unknown): T {
  return validateSchema(schema, requestData);
}

/**
 * Validates query parameters against a schema and returns the validated data
 * 
 * @param schema - The Zod schema to validate against
 * @param queryParams - The query parameters to validate
 * @returns Validated and type-safe query parameters
 * @throws AppError with VALIDATION_ERROR code if validation fails
 */
export function validateQueryParams<T>(
  schema: z.ZodSchema<T>,
  queryParams: Record<string, any>
): T {
  // Transform query parameters (handle string to number/boolean conversions)
  const transformedParams = Object.entries(queryParams).reduce((acc, [key, value]) => {
    // Handle array values (query params can be string or string[])
    if (Array.isArray(value)) {
      acc[key] = value.map(item => {
        return transformQueryValue(item);
      });
    } else {
      acc[key] = transformQueryValue(value);
    }
    
    return acc;
  }, {} as Record<string, any>);
  
  return validateSchema(schema, transformedParams);
  
  // Helper function to transform a query parameter value to the appropriate type
  function transformQueryValue(value: any): any {
    // Handle boolean conversions
    if (value === 'true') {
      return true;
    }
    
    if (value === 'false') {
      return false;
    }
    
    // Handle number conversions
    if (
      !isNaN(value as any) && 
      !isNaN(parseFloat(value as string)) && 
      typeof value !== 'boolean'
    ) {
      return parseFloat(value as string);
    }
    
    // Keep the original value for other types
    return value;
  }
}

/**
 * Validates if a string is a valid UUID
 * 
 * @param id - The ID to validate
 * @returns True if the ID is a valid UUID, false otherwise
 */
export function validateId(id: string): boolean {
  if (typeof id !== 'string') {
    return false;
  }
  
  // Regular expression for UUID validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Validates if a string is a valid email address
 * 
 * @param email - The email to validate
 * @returns True if the email is valid, false otherwise
 */
export function validateEmail(email: string): boolean {
  if (typeof email !== 'string') {
    return false;
  }
  
  // Regular expression for email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates if a password meets the required strength criteria
 * 
 * @param password - The password to validate
 * @returns Validation result with reason if invalid
 */
export function validatePassword(password: string): { isValid: boolean; message: string } {
  if (typeof password !== 'string') {
    return { isValid: false, message: 'Password must be a string' };
  }
  
  // Check minimum length
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }
  
  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' };
  }
  
  // Check for at least one number
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }
  
  // Check for at least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one special character' };
  }
  
  return { isValid: true, message: 'Password meets strength requirements' };
}

/**
 * Validates if a string is a valid phone number
 * 
 * @param phoneNumber - The phone number to validate
 * @returns True if the phone number is valid, false otherwise
 */
export function validatePhoneNumber(phoneNumber: string): boolean {
  if (typeof phoneNumber !== 'string') {
    return false;
  }
  
  // Remove any non-digit characters
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  
  // Check if the resulting string has a valid length (10-15 digits)
  return digitsOnly.length >= 10 && digitsOnly.length <= 15;
}

/**
 * Formats Zod validation errors into a standardized ValidationError array
 * 
 * @param error - The Zod error to format
 * @returns Array of formatted validation errors
 */
export function formatValidationErrors(error: z.ZodError): ValidationError[] {
  return error.errors.map(issue => ({
    field: issue.path.join('.'),
    message: issue.message,
    value: issue.input
  }));
}

/**
 * Sanitizes input strings to prevent XSS and injection attacks
 * 
 * @param input - The input string to sanitize
 * @returns Sanitized input string
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Replace HTML special characters with their entity equivalents
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}