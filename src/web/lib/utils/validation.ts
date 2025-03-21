/**
 * Utility functions for input validation, sanitization, and data formatting
 * in the Revolucare web application.
 * 
 * This file provides reusable validation functions used across the application
 * to ensure data integrity, prevent security vulnerabilities, and provide
 * consistent user feedback.
 */

import DOMPurify from 'dompurify'; // version 3.0.1
import validator from 'validator'; // version 13.9.0

/**
 * Sanitizes user input to prevent XSS attacks
 * 
 * @param input - The user input string to sanitize
 * @returns Sanitized input string
 */
export function sanitizeInput(input: string): string {
  if (input === undefined || input === null) {
    return '';
  }
  
  // Ensure the input is a string
  const stringInput = String(input);
  
  // Sanitize the input using DOMPurify
  return DOMPurify.sanitize(stringInput);
}

/**
 * Validates an email address format
 * 
 * @param email - The email address to validate
 * @returns True if email is valid, false otherwise
 */
export function validateEmail(email: string): boolean {
  if (email === undefined || email === null) {
    return false;
  }
  
  return validator.isEmail(email);
}

/**
 * Validates a password against strength requirements
 * 
 * @param password - The password to validate
 * @param options - Password validation options
 * @returns Validation result with error messages
 */
export function validatePassword(
  password: string,
  options?: {
    minLength?: number;
    requireUppercase?: boolean;
    requireLowercase?: boolean;
    requireNumbers?: boolean;
    requireSpecialChars?: boolean;
  }
): { isValid: boolean; errors: string[] } {
  // Default options
  const validationOptions = {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    ...options,
  };
  
  const errors: string[] = [];
  
  // Check minimum length
  if (password.length < validationOptions.minLength) {
    errors.push(`Password must be at least ${validationOptions.minLength} characters long`);
  }
  
  // Check for uppercase letters
  if (validationOptions.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  // Check for lowercase letters
  if (validationOptions.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  // Check for numbers
  if (validationOptions.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  // Check for special characters
  if (validationOptions.requireSpecialChars && !/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates a phone number format
 * 
 * @param phoneNumber - The phone number to validate
 * @param locale - The locale to validate against (default: 'en-US')
 * @returns True if phone number is valid, false otherwise
 */
export function validatePhoneNumber(phoneNumber: string, locale: string = 'en-US'): boolean {
  if (phoneNumber === undefined || phoneNumber === null) {
    return false;
  }
  
  return validator.isMobilePhone(phoneNumber, locale as validator.MobilePhoneLocale);
}

/**
 * Validates a URL format
 * 
 * @param url - The URL to validate
 * @returns True if URL is valid, false otherwise
 */
export function validateUrl(url: string): boolean {
  if (url === undefined || url === null) {
    return false;
  }
  
  return validator.isURL(url);
}

/**
 * Validates a date string format
 * 
 * @param dateString - The date string to validate
 * @param format - The expected date format (default: YYYY-MM-DD)
 * @returns True if date string is valid, false otherwise
 */
export function validateDate(dateString: string, format: string = 'YYYY-MM-DD'): boolean {
  if (dateString === undefined || dateString === null) {
    return false;
  }
  
  return validator.isDate(dateString, { format });
}

/**
 * Validates if a number is within a specified range
 * 
 * @param value - The number to validate
 * @param min - The minimum allowed value
 * @param max - The maximum allowed value
 * @returns True if number is within range, false otherwise
 */
export function validateNumericRange(value: number, min: number, max: number): boolean {
  if (typeof value !== 'number' || isNaN(value)) {
    return false;
  }
  
  return value >= min && value <= max;
}

/**
 * Validates that all required fields in an object have values
 * 
 * @param data - The data object to validate
 * @param requiredFields - Array of required field names
 * @returns Validation result with missing fields
 */
export function validateRequiredFields(
  data: Record<string, any>,
  requiredFields: string[]
): { isValid: boolean; missingFields: string[] } {
  const missingFields: string[] = [];
  
  for (const field of requiredFields) {
    // Check if the field exists and has a value
    if (
      data[field] === undefined ||
      data[field] === null ||
      (typeof data[field] === 'string' && data[field].trim() === '')
    ) {
      missingFields.push(field);
    }
  }
  
  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
}

/**
 * Calculates password strength score from 0-100
 * 
 * @param password - The password to evaluate
 * @returns Password strength score and feedback
 */
export function getPasswordStrength(password: string): { score: number; feedback: string } {
  if (!password) {
    return { score: 0, feedback: 'Password is required' };
  }
  
  let score = 0;
  
  // Add points for length (up to 40 points)
  const lengthPoints = Math.min(password.length * 2, 40);
  score += lengthPoints;
  
  // Add points for character variety (up to 40 points)
  if (/[A-Z]/.test(password)) score += 10; // uppercase
  if (/[a-z]/.test(password)) score += 10; // lowercase
  if (/\d/.test(password)) score += 10;    // numbers
  if (/[^A-Za-z0-9]/.test(password)) score += 10; // special characters
  
  // Add points for non-sequential characters (up to 20 points)
  let sequentialChars = 0;
  for (let i = 1; i < password.length; i++) {
    if (
      password.charCodeAt(i) === password.charCodeAt(i - 1) + 1 ||
      password.charCodeAt(i) === password.charCodeAt(i - 1) - 1 ||
      password.charCodeAt(i) === password.charCodeAt(i - 1)
    ) {
      sequentialChars++;
    }
  }
  const sequentialPoints = Math.max(0, 20 - (sequentialChars * 5));
  score += sequentialPoints;
  
  // Deduct points for common patterns (up to -30 points)
  if (/^123456|password|qwerty|111111|12345|abc123$/i.test(password)) {
    score -= 30;
  } else if (/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,}/.test(password)) {
    // Bonus for very strong passwords
    score += 10;
  }
  
  // Ensure score is between 0 and 100
  score = Math.max(0, Math.min(100, score));
  
  // Generate feedback based on score
  let feedback = '';
  if (score < 20) {
    feedback = 'Very weak - easy to guess';
  } else if (score < 40) {
    feedback = 'Weak - vulnerable to modern cracking techniques';
  } else if (score < 60) {
    feedback = 'Moderate - could be stronger';
  } else if (score < 80) {
    feedback = 'Strong - good password';
  } else {
    feedback = 'Very strong - excellent password';
  }
  
  return { score, feedback };
}

/**
 * Formats validation errors into a consistent structure
 * 
 * @param errors - Object containing arrays of error messages by field
 * @returns Formatted error objects by field name
 */
export function formatValidationErrors(
  errors: Record<string, string[]>
): Record<string, { message: string; type: string }> {
  const formattedErrors: Record<string, { message: string; type: string }> = {};
  
  for (const [fieldName, fieldErrors] of Object.entries(errors)) {
    if (fieldErrors && fieldErrors.length > 0) {
      formattedErrors[fieldName] = {
        message: fieldErrors[0], // Take the first error message
        type: 'validation'
      };
    }
  }
  
  return formattedErrors;
}

/**
 * Validates if a file is of an allowed type
 * 
 * @param file - The file to validate
 * @param allowedTypes - Array of allowed MIME types
 * @returns True if file type is allowed, false otherwise
 */
export function validateFileType(file: File, allowedTypes: string[]): boolean {
  if (!file || !allowedTypes || !allowedTypes.length) {
    return false;
  }
  
  return allowedTypes.includes(file.type);
}

/**
 * Validates if a file size is within the allowed limit
 * 
 * @param file - The file to validate
 * @param maxSizeInBytes - Maximum allowed file size in bytes
 * @returns True if file size is within limit, false otherwise
 */
export function validateFileSize(file: File, maxSizeInBytes: number): boolean {
  if (!file || typeof maxSizeInBytes !== 'number') {
    return false;
  }
  
  return file.size <= maxSizeInBytes;
}