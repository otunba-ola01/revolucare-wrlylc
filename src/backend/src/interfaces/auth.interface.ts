/**
 * Authentication interfaces for the Revolucare platform
 * 
 * This file defines TypeScript interfaces for authentication and authorization,
 * including request/response types, token structures, and service contracts.
 * These interfaces support the platform's multi-role user authentication system
 * with JWT-based tokens, password management, and session handling.
 */

import { User, UserWithoutPassword } from '../types/user.types';
import { Roles } from '../constants/roles';
import { Request } from 'express';

/**
 * Authentication service interface - defines all methods for user authentication
 */
export interface IAuthService {
  /**
   * Registers a new user in the system
   * @param userData Registration data containing email, password and basic profile info
   * @returns The created user object and authentication tokens
   */
  register(userData: RegisterRequest): Promise<AuthResponse>;
  
  /**
   * Authenticates a user with email and password
   * @param credentials Email and password credentials
   * @returns Authentication tokens and user data
   */
  login(credentials: LoginRequest): Promise<AuthResponse>;
  
  /**
   * Refreshes the authentication tokens using a valid refresh token
   * @param refreshTokenData The current refresh token
   * @returns New authentication tokens
   */
  refreshToken(refreshTokenData: RefreshTokenRequest): Promise<AuthResponse>;
  
  /**
   * Logs out a user by invalidating their refresh token
   * @param refreshToken The refresh token to invalidate
   * @returns Success indication
   */
  logout(refreshToken: string): Promise<boolean>;
  
  /**
   * Verifies a user's email address using a verification token
   * @param verificationData The email verification token
   * @returns Success indication
   */
  verifyEmail(verificationData: VerifyEmailRequest): Promise<boolean>;
  
  /**
   * Initiates a password reset process by sending a reset email
   * @param resetData User's email address
   * @returns Success indication
   */
  requestPasswordReset(resetData: PasswordResetRequest): Promise<boolean>;
  
  /**
   * Resets a user's password using a valid reset token
   * @param resetData Reset token and new password
   * @returns Success indication
   */
  resetPassword(resetData: PasswordResetConfirmRequest): Promise<boolean>;
  
  /**
   * Changes a user's password when already authenticated
   * @param userId The authenticated user's ID
   * @param passwordData Current and new password
   * @returns Success indication
   */
  changePassword(userId: string, passwordData: ChangePasswordRequest): Promise<boolean>;
  
  /**
   * Validates a JWT token and extracts its payload
   * @param token The JWT token to validate
   * @returns Token validation result with payload if valid
   */
  validateToken(token: string): Promise<TokenVerificationResult>;
  
  /**
   * Resends the email verification link to a user
   * @param email The user's email address
   * @returns Success indication
   */
  resendVerificationEmail(email: string): Promise<boolean>;
  
  /**
   * Extracts user data from a valid JWT token
   * @param token The JWT token
   * @returns User context data if the token is valid
   */
  getUserFromToken(token: string): Promise<UserContext | null>;
}

/**
 * User registration request data structure
 */
export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: Roles;
}

/**
 * User login request data structure
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Authentication response containing tokens and user data
 */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // Token expiration time in seconds
  user: UserWithoutPassword;
}

/**
 * Token refresh request data structure
 */
export interface RefreshTokenRequest {
  refreshToken: string;
}

/**
 * Email verification request data structure
 */
export interface VerifyEmailRequest {
  token: string;
}

/**
 * Password reset request data structure
 */
export interface PasswordResetRequest {
  email: string;
}

/**
 * Password reset confirmation request data structure
 */
export interface PasswordResetConfirmRequest {
  token: string;
  password: string;
}

/**
 * Password change request data structure for authenticated users
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/**
 * JWT token payload structure
 */
export interface TokenPayload {
  userId: string;
  email: string;
  role: Roles;
  isVerified: boolean;
  iat: number; // Issued at timestamp
  exp: number; // Expiration timestamp
}

/**
 * Authentication tokens structure
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // Token expiration time in seconds
}

/**
 * Token verification result structure
 */
export interface TokenVerificationResult {
  isValid: boolean;
  payload: TokenPayload | null;
  error: string | null;
}

/**
 * Refresh token data structure for database storage
 */
export interface RefreshTokenData {
  token: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
  isRevoked: boolean;
}

/**
 * User context data extracted from authentication token
 */
export interface UserContext {
  userId: string;
  email: string;
  role: Roles;
  isVerified: boolean;
  permissions: string[]; // User's permissions based on role
}

/**
 * Express Request interface extended with authenticated user context
 */
export interface AuthenticatedRequest extends Request {
  user: UserContext;
}