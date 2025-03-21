import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signIn, signOut } from 'next-auth/react';
import { 
  AuthContextType, 
  LoginCredentials, 
  RegisterCredentials, 
  AuthState,
  PasswordResetRequest,
  PasswordResetConfirmation,
  PasswordChangeRequest,
  EmailVerificationRequest,
  ResendVerificationRequest
} from '../../types/auth';
import { User } from '../../types/user';
import { hasRole, hasPermission } from '../../config/roles';
import { 
  login as loginApi, 
  register as registerApi, 
  logout as logoutApi,
  requestPasswordReset,
  resetPassword as resetPasswordApi,
  changePassword as changePasswordApi,
  verifyEmail as verifyEmailApi,
  resendVerificationEmail as resendVerificationEmailApi,
  getAuthStatus as getAuthStatusApi
} from '../api/auth';

/**
 * React context for authentication state and methods
 */
const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Initial authentication state
 */
const initialAuthState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null
};

/**
 * Provider component that manages authentication state and provides it to children
 * 
 * This component handles all authentication-related operations including login, registration,
 * session management, and authorization checks.
 */
const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State to track authentication status
  const [authState, setAuthState] = useState<AuthState>(initialAuthState);
  
  // Next.js router for navigation
  const router = useRouter();
  
  // NextAuth session data
  const { data: session, status } = useSession();
  
  /**
   * Checks the current authentication status
   * Synchronizes between NextAuth session and our backend auth status
   */
  const checkAuthStatus = useCallback(async (): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // If NextAuth has a session, use that
      if (status === 'authenticated' && session?.user) {
        setAuthState({
          user: session.user as User,
          isAuthenticated: true,
          isLoading: false,
          error: null
        });
        return;
      }
      
      // If not loading but no session, check with our API
      if (status !== 'loading') {
        const authStatus = await getAuthStatusApi();
        
        setAuthState({
          user: authStatus.user,
          isAuthenticated: authStatus.isAuthenticated,
          isLoading: false,
          error: null
        });
      }
    } catch (error) {
      console.error('Failed to check authentication status:', error);
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to check authentication status'
      });
    }
  }, [session, status]);
  
  // Check authentication on component mount and when session changes
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);
  
  /**
   * Authenticates a user with email and password
   * Updates authentication state and session upon success
   */
  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Call the login API
      const authResponse = await loginApi(credentials);
      
      // Call NextAuth signIn for session management
      const result = await signIn('credentials', {
        redirect: false,
        email: credentials.email,
        password: credentials.password
      });
      
      if (result?.error) {
        throw new Error(result.error);
      }
      
      // Update auth state with user info
      setAuthState({
        user: authResponse.user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to login'
      }));
      throw error;
    }
  };
  
  /**
   * Registers a new user and automatically logs them in
   */
  const register = async (userData: RegisterCredentials): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Call the register API
      await registerApi(userData);
      
      // Automatically log in the user after registration
      await login({
        email: userData.email,
        password: userData.password
      });
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to register'
      }));
      throw error;
    }
  };
  
  /**
   * Logs out the current user
   * Clears session and authentication state
   */
  const logout = async (): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Call the logout API
      await logoutApi();
      
      // Call NextAuth signOut
      await signOut({ redirect: false });
      
      // Clear authentication state
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      });
      
      // Redirect to login page
      router.push('/login');
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to logout'
      }));
      throw error;
    }
  };
  
  /**
   * Initiates a password reset request for a user by email
   */
  const resetPassword = async (data: PasswordResetRequest): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      await requestPasswordReset(data);
      setAuthState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to request password reset'
      }));
      throw error;
    }
  };
  
  /**
   * Completes the password reset process with token and new password
   */
  const confirmPasswordReset = async (data: PasswordResetConfirmation): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      await resetPasswordApi(data);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      router.push('/login');
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to reset password'
      }));
      throw error;
    }
  };
  
  /**
   * Changes password for an authenticated user
   */
  const changePassword = async (data: PasswordChangeRequest): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      await changePasswordApi(data);
      setAuthState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to change password'
      }));
      throw error;
    }
  };
  
  /**
   * Verifies a user's email address with a verification token
   */
  const verifyEmail = async (data: EmailVerificationRequest): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      await verifyEmailApi(data);
      
      // Update user verification status if logged in
      if (authState.user) {
        setAuthState(prev => ({
          ...prev,
          user: prev.user ? { ...prev.user, isVerified: true } : null,
          isLoading: false
        }));
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to verify email'
      }));
      throw error;
    }
  };
  
  /**
   * Requests a new verification email for a user
   */
  const resendVerificationEmail = async (data: ResendVerificationRequest): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      await resendVerificationEmailApi(data);
      setAuthState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to resend verification email'
      }));
      throw error;
    }
  };
  
  /**
   * Checks if the current user has a specific role
   */
  const userHasRole = (requiredRole: string): boolean => {
    if (!authState.user) return false;
    return hasRole(authState.user.role, requiredRole);
  };
  
  /**
   * Checks if the current user has a specific permission
   */
  const userHasPermission = (permission: string): boolean => {
    if (!authState.user) return false;
    
    // Check role-based permissions
    if (hasPermission(authState.user.role, permission)) {
      return true;
    }
    
    // Check user-specific permissions from their profile
    return authState.user.permissions?.includes(permission) || false;
  };
  
  // Create context value with all authentication state and methods
  const contextValue: AuthContextType = {
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    error: authState.error,
    login,
    register,
    logout,
    resetPassword,
    confirmPasswordReset,
    changePassword,
    verifyEmail,
    resendVerificationEmail,
    checkAuthStatus,
    hasRole: userHasRole,
    hasPermission: userHasPermission
  };
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to access the authentication context
 * Must be used within an AuthProvider component
 */
const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { AuthContext, AuthProvider, useAuth };