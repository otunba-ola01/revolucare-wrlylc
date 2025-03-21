import { post, get, put, delete as deleteRequest } from './client';
import { ApiEndpoint } from '../../types/api';
import {
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
  PasswordResetRequest,
  PasswordResetConfirmation,
  PasswordChangeRequest,
  EmailVerificationRequest,
  ResendVerificationRequest
} from '../../types/auth';
import { User } from '../../types/user';

/**
 * Authenticates a user with email and password credentials
 * 
 * @param credentials User login credentials
 * @returns Promise resolving to authentication response with tokens and user data
 */
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const url = `${ApiEndpoint.AUTH}/login`;
  return post<AuthResponse>(url, credentials);
}

/**
 * Registers a new user with the provided information
 * 
 * @param userData User registration data
 * @returns Promise resolving to the created user and success message
 */
export async function register(userData: RegisterCredentials): Promise<{ user: User; message: string }> {
  const url = `${ApiEndpoint.AUTH}/register`;
  return post<{ user: User; message: string }>(url, userData);
}

/**
 * Logs out the current user by invalidating their session
 * 
 * @returns Promise resolving to success status and message
 */
export async function logout(): Promise<{ success: boolean; message: string }> {
  const url = `${ApiEndpoint.AUTH}/logout`;
  return post<{ success: boolean; message: string }>(url);
}

/**
 * Refreshes the authentication tokens using a refresh token
 * 
 * @param refreshToken The refresh token to use
 * @returns Promise resolving to new authentication tokens and user data
 */
export async function refreshToken(refreshToken: string): Promise<AuthResponse> {
  const url = `${ApiEndpoint.AUTH}/refresh`;
  return post<AuthResponse>(url, { refreshToken });
}

/**
 * Requests a password reset for a user by email
 * 
 * @param data Password reset request data containing email
 * @returns Promise resolving to success status and message
 */
export async function requestPasswordReset(data: PasswordResetRequest): Promise<{ success: boolean; message: string }> {
  const url = `${ApiEndpoint.AUTH}/password-reset`;
  return post<{ success: boolean; message: string }>(url, data);
}

/**
 * Resets a user's password using a reset token
 * 
 * @param data Password reset confirmation data with token and new password
 * @returns Promise resolving to success status and message
 */
export async function resetPassword(data: PasswordResetConfirmation): Promise<{ success: boolean; message: string }> {
  const url = `${ApiEndpoint.AUTH}/password-reset/confirm`;
  return post<{ success: boolean; message: string }>(url, data);
}

/**
 * Changes the password for an authenticated user
 * 
 * @param data Password change request with current and new password
 * @returns Promise resolving to success status and message
 */
export async function changePassword(data: PasswordChangeRequest): Promise<{ success: boolean; message: string }> {
  const url = `${ApiEndpoint.AUTH}/password`;
  return put<{ success: boolean; message: string }>(url, data);
}

/**
 * Verifies a user's email address using a verification token
 * 
 * @param data Email verification request with token
 * @returns Promise resolving to success status and message
 */
export async function verifyEmail(data: EmailVerificationRequest): Promise<{ success: boolean; message: string }> {
  const url = `${ApiEndpoint.AUTH}/verify-email`;
  return post<{ success: boolean; message: string }>(url, data);
}

/**
 * Requests a new verification email for a user
 * 
 * @param data Resend verification request with email
 * @returns Promise resolving to success status and message
 */
export async function resendVerificationEmail(data: ResendVerificationRequest): Promise<{ success: boolean; message: string }> {
  const url = `${ApiEndpoint.AUTH}/resend-verification`;
  return post<{ success: boolean; message: string }>(url, data);
}

/**
 * Checks the current authentication status
 * 
 * @returns Promise resolving to authentication status and user data if authenticated
 */
export async function getAuthStatus(): Promise<{ isAuthenticated: boolean; user: User | null }> {
  const url = `${ApiEndpoint.AUTH}/status`;
  return get<{ isAuthenticated: boolean; user: User | null }>(url);
}

export {
  login,
  register,
  logout,
  refreshToken,
  requestPasswordReset,
  resetPassword,
  changePassword,
  verifyEmail,
  resendVerificationEmail,
  getAuthStatus
};