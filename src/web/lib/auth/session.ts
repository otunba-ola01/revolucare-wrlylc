/**
 * session.ts
 * 
 * Provides session management utilities for the Revolucare platform, including
 * functions to retrieve, validate, and check permissions for user sessions.
 * This file serves as a bridge between NextAuth.js sessions and the application's
 * authentication requirements.
 */

import { getServerSession } from 'next-auth/next'; // next-auth/next: ^4.22.1
import { getSession as getClientSession } from 'next-auth/react'; // next-auth/react: ^4.22.1
import { Session } from 'next-auth'; // next-auth: ^4.22.1
import { cookies } from 'next/headers'; // next/headers: ^13.4.1
import { Roles, hasRole, hasPermission } from '../../config/roles';
import { SessionValidationOptions, SessionValidationResult } from '../../types/auth';
import { User } from '../../types/user';

/**
 * Retrieves the current user session from NextAuth
 * 
 * @returns Promise<Session | null> The current session or null if not authenticated
 */
export async function getSession(): Promise<Session | null> {
  // Check if running on server or client side
  if (typeof window === 'undefined') {
    // Server-side
    try {
      // Need to import dynamically to avoid circular dependencies
      const { authOptions } = await import('../../config/auth');
      return await getServerSession(authOptions);
    } catch (error) {
      console.error('Error getting server session:', error);
      return null;
    }
  } else {
    // Client-side
    return await getClientSession();
  }
}

/**
 * Validates a session against specified requirements
 * 
 * @param session The session to validate
 * @param options Validation options including required role, verification check, etc.
 * @returns SessionValidationResult with status and reason
 */
export function validateSession(
  session: Session | null, 
  options: SessionValidationOptions
): SessionValidationResult {
  // Check if session exists
  if (!session) {
    return { valid: false, reason: 'No active session' };
  }

  // Check if verified email is required
  if (options.requireVerified && !session.user.isVerified) {
    return { 
      valid: false, 
      reason: 'Email verification required',
      session 
    };
  }

  // Check if user has required role
  if (options.requiredRole && !hasRequiredRole(session, options.requiredRole)) {
    return { 
      valid: false, 
      reason: `Required role: ${options.requiredRole}`,
      session 
    };
  }

  // Check if profile completion is required
  if (options.requireCompleteProfile && !session.user.profileComplete) {
    return { 
      valid: false, 
      reason: 'Profile completion required',
      session 
    };
  }

  // All checks passed
  return { valid: true, session };
}

/**
 * Checks if a session has a specific role
 * 
 * @param session The session to check
 * @param requiredRole The role required for access
 * @returns True if session has the required role, false otherwise
 */
export function hasRequiredRole(session: Session | null, requiredRole: string): boolean {
  if (!session) return false;
  
  const userRole = session.user?.role;
  if (!userRole) return false;
  
  return hasRole(userRole, requiredRole);
}

/**
 * Checks if a session has a specific permission
 * 
 * @param session The session to check
 * @param permission The permission to check for
 * @returns True if session has the permission, false otherwise
 */
export function hasSessionPermission(session: Session | null, permission: string): boolean {
  if (!session) return false;
  
  const userRole = session.user?.role;
  if (!userRole) return false;
  
  // Check if permission is granted by the user's role
  if (hasPermission(userRole, permission)) {
    return true;
  }
  
  // Check if user has explicit permissions in the session
  const userPermissions = session.user?.permissions || [];
  if (userPermissions.includes(permission)) {
    return true;
  }
  
  return false;
}

/**
 * Extracts the user object from a session
 * 
 * @param session The session to extract from
 * @returns User object from session or null if not authenticated
 */
export function getSessionUser(session: Session | null): User | null {
  if (!session) return null;
  return session.user as User;
}