import { UserRole } from './user';

/**
 * Type alias for UserRole to maintain backward compatibility
 */
export type Role = UserRole;

/**
 * Interface for user login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
}

/**
 * Interface for user registration data
 */
export interface RegisterCredentials {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  termsAccepted: boolean;
}

/**
 * Interface for authentication response containing tokens and user data
 */
export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Interface for password reset request
 */
export interface PasswordResetRequest {
  email: string;
}

/**
 * Interface for confirming password reset with token
 */
export interface PasswordResetConfirmation {
  token: string;
  password: string;
  confirmPassword: string;
}

/**
 * Interface for changing password when authenticated
 */
export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Interface for email verification request
 */
export interface EmailVerificationRequest {
  token: string;
}

/**
 * Interface for requesting a new verification email
 */
export interface ResendVerificationRequest {
  email: string;
}

/**
 * Interface for authentication state in the application
 */
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Interface for authentication context provider
 */
export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (data: PasswordResetRequest) => Promise<void>;
  confirmPasswordReset: (data: PasswordResetConfirmation) => Promise<void>;
  changePassword: (data: PasswordChangeRequest) => Promise<void>;
  verifyEmail: (data: EmailVerificationRequest) => Promise<void>;
  resendVerificationEmail: (data: ResendVerificationRequest) => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  hasRole: (requiredRole: string) => boolean;
  hasPermission: (permission: string) => boolean;
}

/**
 * Interface for session validation options
 */
export interface SessionValidationOptions {
  requireVerified?: boolean;
  requiredRole?: string;
  requireCompleteProfile?: boolean;
}

/**
 * Interface for session validation result
 */
export interface SessionValidationResult {
  valid: boolean;
  reason?: string;
  session?: Session;
}

/**
 * Interface for JWT token payload structure
 */
export interface JWTPayload {
  id: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
  permissions: string[];
  iat: number;
  exp: number;
}