/**
 * auth.validator.ts
 * 
 * Defines Zod validation schemas for authentication-related requests
 * in the Revolucare platform, ensuring that all authentication operations
 * receive properly formatted and valid data before processing.
 */

import { z } from 'zod'; // zod@3.21.4
import { Roles } from '../../constants/roles';
import { validatePassword, validateEmail } from '../../utils/validation';

/**
 * Validation schema for user registration requests.
 * Ensures required fields are present and properly formatted according to 
 * platform requirements.
 */
export const registerSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .min(1, 'Email cannot be empty')
    .email('Please provide a valid email address')
    .refine(
      (value) => validateEmail(value),
      { message: 'Please provide a valid email address' }
    ),
  password: z
    .string({ required_error: 'Password is required' })
    .min(12, 'Password must be at least 12 characters long')
    .refine(
      (value) => validatePassword(value).isValid,
      {
        message: 'Password must include uppercase, lowercase, number, and special character'
      }
    ),
  firstName: z
    .string({ required_error: 'First name is required' })
    .trim()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must not exceed 50 characters'),
  lastName: z
    .string({ required_error: 'Last name is required' })
    .trim()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must not exceed 50 characters'),
  role: z.nativeEnum(Roles, {
    required_error: 'Role is required',
    invalid_type_error: 'Role must be one of: CLIENT, PROVIDER, CASE_MANAGER, ADMINISTRATOR'
  })
});

/**
 * Validation schema for user login requests.
 * Validates email and password fields.
 */
export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .min(1, 'Email cannot be empty')
    .email('Please provide a valid email address')
    .refine(
      (value) => validateEmail(value),
      { message: 'Please provide a valid email address' }
    ),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password cannot be empty')
});

/**
 * Validation schema for token refresh requests.
 * The refresh token may be provided in the request body or will be 
 * extracted from cookies by the authentication middleware.
 */
export const refreshTokenSchema = z.object({
  refreshToken: z.string().optional()
});

/**
 * Validation schema for email verification requests.
 * Verifies the presence of a token parameter.
 */
export const verifyEmailSchema = z.object({
  token: z
    .string({ required_error: 'Verification token is required' })
    .min(1, 'Verification token cannot be empty')
});

/**
 * Validation schema for password reset requests.
 * Validates the email address where the reset link will be sent.
 */
export const passwordResetRequestSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .min(1, 'Email cannot be empty')
    .email('Please provide a valid email address')
    .refine(
      (value) => validateEmail(value),
      { message: 'Please provide a valid email address' }
    )
});

/**
 * Validation schema for password reset confirmation requests.
 * Validates the reset token and new password.
 */
export const passwordResetConfirmSchema = z.object({
  token: z
    .string({ required_error: 'Reset token is required' })
    .min(1, 'Reset token cannot be empty'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(12, 'Password must be at least 12 characters long')
    .refine(
      (value) => validatePassword(value).isValid,
      {
        message: 'Password must include uppercase, lowercase, number, and special character'
      }
    )
});

/**
 * Validation schema for password change requests.
 * Validates the current password and new password.
 */
export const changePasswordSchema = z.object({
  currentPassword: z
    .string({ required_error: 'Current password is required' })
    .min(1, 'Current password cannot be empty'),
  newPassword: z
    .string({ required_error: 'New password is required' })
    .min(12, 'New password must be at least 12 characters long')
    .refine(
      (value) => validatePassword(value).isValid,
      {
        message: 'New password must include uppercase, lowercase, number, and special character'
      }
    )
});

/**
 * Validation schema for resend verification email requests.
 * Validates the email address where the verification link will be resent.
 */
export const resendVerificationEmailSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .min(1, 'Email cannot be empty')
    .email('Please provide a valid email address')
    .refine(
      (value) => validateEmail(value),
      { message: 'Please provide a valid email address' }
    )
});