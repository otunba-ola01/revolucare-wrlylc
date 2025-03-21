import { z } from 'zod';
import { UserRole } from '../../types/user';

/**
 * Regular expression for password validation
 * Requires minimum 8 characters, at least one uppercase letter, 
 * one lowercase letter, one number and one special character
 */
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

/**
 * Regular expression for email validation
 */
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Validation schema for login form
 */
export const loginSchema = z.object({
  email: z.string()
    .required('Email is required')
    .email('Please enter a valid email address')
    .max(255, 'Email cannot exceed 255 characters'),
  password: z.string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters'),
  remember: z.boolean()
    .optional()
    .default(false)
});

/**
 * Validation schema for user registration form
 */
export const registerSchema = z.object({
  email: z.string()
    .required('Email is required')
    .email('Please enter a valid email address')
    .max(255, 'Email cannot exceed 255 characters'),
  password: z.string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .regex(passwordRegex, 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'),
  confirmPassword: z.string()
    .required('Please confirm your password'),
  firstName: z.string()
    .required('First name is required')
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name cannot exceed 50 characters'),
  lastName: z.string()
    .required('Last name is required')
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name cannot exceed 50 characters'),
  role: z.nativeEnum(UserRole, {
    errorMap: () => ({ message: 'Please select a valid role' })
  }).required('Please select a role'),
  termsAccepted: z.boolean()
    .required('You must accept the terms and conditions')
    .refine(val => val === true, 'You must accept the terms and conditions')
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

/**
 * Validation schema for password reset request form
 */
export const passwordResetRequestSchema = z.object({
  email: z.string()
    .required('Email is required')
    .email('Please enter a valid email address')
    .max(255, 'Email cannot exceed 255 characters')
});

/**
 * Validation schema for password reset confirmation form
 */
export const passwordResetConfirmationSchema = z.object({
  token: z.string()
    .required('Token is required'),
  password: z.string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .regex(passwordRegex, 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'),
  confirmPassword: z.string()
    .required('Please confirm your password')
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

/**
 * Validation schema for password change form (when user is already logged in)
 */
export const passwordChangeSchema = z.object({
  currentPassword: z.string()
    .required('Current password is required'),
  newPassword: z.string()
    .required('New password is required')
    .min(8, 'Password must be at least 8 characters')
    .regex(passwordRegex, 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'),
  confirmPassword: z.string()
    .required('Please confirm your password')
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
}).refine(data => data.currentPassword !== data.newPassword, {
  message: 'New password must be different from current password',
  path: ['newPassword']
});

/**
 * Validation schema for email verification form
 */
export const emailVerificationSchema = z.object({
  token: z.string()
    .required('Verification token is required')
});

/**
 * Validation schema for resending email verification
 */
export const resendVerificationSchema = z.object({
  email: z.string()
    .required('Email is required')
    .email('Please enter a valid email address')
    .max(255, 'Email cannot exceed 255 characters')
});