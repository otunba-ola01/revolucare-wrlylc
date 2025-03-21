import { UserRole } from './user';

/**
 * Extends NextAuth.js types with custom properties needed for Revolucare platform
 */
declare module "next-auth" {
  /**
   * Extended Session interface with custom properties for token handling and user data
   */
  interface Session {
    /** Extended user object with role and profile information */
    user: User;
    /** JWT access token for API requests */
    accessToken: string;
    /** Refresh token for obtaining new access tokens */
    refreshToken: string;
    /** Timestamp when the access token expires */
    expiresAt: number;
    /** Error message if session has an error state */
    error: string | null;
  }

  /**
   * Extended User interface with custom properties for role-based access control
   */
  interface User {
    /** Unique identifier for the user */
    id: string;
    /** User's email address */
    email: string;
    /** User's first name */
    firstName: string;
    /** User's last name */
    lastName: string;
    /** User's role in the system */
    role: UserRole;
    /** Whether the user's email is verified */
    isVerified: boolean;
    /** Whether the user has completed their profile */
    profileComplete: boolean;
    /** List of permissions granted to the user */
    permissions: string[];
    /** Timestamp when the user was created */
    createdAt: string;
    /** Timestamp when the user was last updated */
    updatedAt: string;
  }
}

/**
 * Extends NextAuth.js JWT types with custom properties for token management
 */
declare module "next-auth/jwt" {
  /**
   * Extended JWT interface with custom properties for secure token handling
   */
  interface JWT {
    /** User ID stored in the token */
    id: string;
    /** User's email address */
    email: string;
    /** User's first name */
    firstName: string;
    /** User's last name */
    lastName: string;
    /** User's role in the system */
    role: UserRole;
    /** Whether the user's email is verified */
    isVerified: boolean;
    /** Whether the user has completed their profile */
    profileComplete: boolean;
    /** List of permissions granted to the user */
    permissions: string[];
    /** JWT access token for API requests */
    accessToken: string;
    /** Refresh token for obtaining new access tokens */
    refreshToken: string;
    /** Timestamp when the access token expires */
    accessTokenExpires: number;
    /** Error message if token has an error state */
    error: string | null;
  }
}