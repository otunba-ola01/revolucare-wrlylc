import { useCallback } from 'react';
import { useAuthContext } from '../lib/state/auth-provider';
import { AuthContextType } from '../types/auth';

/**
 * Custom hook that provides access to authentication state and functions
 * with additional role-based helper methods.
 * 
 * This hook wraps the base authentication context and adds convenience
 * properties for role checking and authentication verification that
 * can be used throughout the application.
 * 
 * @returns Authentication context with additional helper functions
 */
const useAuth = (): AuthContextType & {
  isAdmin: boolean;
  isProvider: boolean;
  isClient: boolean;
  isCaseManager: boolean;
  requireAuth: (redirectTo?: string) => boolean;
} => {
  // Get the base authentication context
  const auth = useAuthContext();
  
  // Role-specific boolean flags
  const isAdmin = auth.hasRole('administrator');
  const isProvider = auth.hasRole('provider');
  const isClient = auth.hasRole('client');
  const isCaseManager = auth.hasRole('case_manager');
  
  /**
   * Checks if user is authenticated and returns appropriate status
   * Components can use this to protect routes or content
   * 
   * @param redirectTo Optional path to redirect to if not authenticated
   * @returns True if authenticated, false if authentication is required
   */
  const requireAuth = useCallback((redirectTo?: string) => {
    if (!auth.isAuthenticated && !auth.isLoading) {
      // Return false to indicate authentication is required
      // The component using this hook can handle redirection as needed
      return false;
    }
    return true;
  }, [auth.isAuthenticated, auth.isLoading]);
  
  // Return the original context plus our additional helpers
  return {
    ...auth,
    isAdmin,
    isProvider,
    isClient,
    isCaseManager,
    requireAuth
  };
};

export default useAuth;