import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { expect, describe, it, beforeEach, jest } from '@jest/globals';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../hooks/use-auth';
import { AuthProvider } from '../../../lib/state/auth-provider';
import { Roles } from '../../../config/roles';

// Mock useRouter
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}));

// Mock the AuthContext module
jest.mock('../../../lib/state/auth-provider', () => {
  const actual = jest.requireActual('../../../lib/state/auth-provider');
  
  return {
    ...actual,
    useAuthContext: jest.fn()
  };
});

describe('useAuth hook', () => {
  // Set up mocks
  const mockPush = jest.fn();
  const { useAuthContext } = require('../../../lib/state/auth-provider');
  
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush
    });
  });
  
  it('should return authentication context', () => {
    // Setup mock auth context
    useAuthContext.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      resetPassword: jest.fn(),
      confirmPasswordReset: jest.fn(),
      changePassword: jest.fn(),
      verifyEmail: jest.fn(),
      resendVerificationEmail: jest.fn(),
      checkAuthStatus: jest.fn(),
      hasRole: jest.fn(),
      hasPermission: jest.fn()
    });
    
    // Render the hook
    const { result } = renderHook(() => useAuth());
    
    // Check all expected properties are returned
    expect(result.current).toHaveProperty('user');
    expect(result.current).toHaveProperty('isAuthenticated');
    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('error');
    expect(result.current).toHaveProperty('login');
    expect(result.current).toHaveProperty('register');
    expect(result.current).toHaveProperty('logout');
    expect(result.current).toHaveProperty('resetPassword');
    expect(result.current).toHaveProperty('confirmPasswordReset');
    expect(result.current).toHaveProperty('changePassword');
    expect(result.current).toHaveProperty('verifyEmail');
    expect(result.current).toHaveProperty('resendVerificationEmail');
    expect(result.current).toHaveProperty('checkAuthStatus');
    expect(result.current).toHaveProperty('hasRole');
    expect(result.current).toHaveProperty('hasPermission');
    
    // Check additional helper functions
    expect(result.current).toHaveProperty('isAdmin');
    expect(result.current).toHaveProperty('isProvider');
    expect(result.current).toHaveProperty('isClient');
    expect(result.current).toHaveProperty('isCaseManager');
    expect(result.current).toHaveProperty('requireAuth');
  });
  
  it('should provide role-based helper functions', () => {
    // Setup mock auth context with an admin user
    const mockHasRole = jest.fn(role => role === Roles.ADMINISTRATOR);
    
    useAuthContext.mockReturnValue({
      user: {
        id: '1',
        email: 'admin@example.com',
        role: Roles.ADMINISTRATOR
      },
      isAuthenticated: true,
      isLoading: false,
      error: null,
      hasRole: mockHasRole,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      resetPassword: jest.fn(),
      confirmPasswordReset: jest.fn(),
      changePassword: jest.fn(),
      verifyEmail: jest.fn(),
      resendVerificationEmail: jest.fn(),
      checkAuthStatus: jest.fn(),
      hasPermission: jest.fn()
    });
    
    // Render the hook
    const { result } = renderHook(() => useAuth());
    
    // Check that role-based helper functions return correct values
    expect(result.current.isAdmin).toBe(true);
    expect(result.current.isProvider).toBe(false);
    expect(result.current.isClient).toBe(false);
    expect(result.current.isCaseManager).toBe(false);
  });
  
  it('should correctly determine user roles', () => {
    // Test with administrator role
    useAuthContext.mockReturnValue({
      user: { role: Roles.ADMINISTRATOR },
      isAuthenticated: true,
      isLoading: false,
      error: null,
      hasRole: (role) => role === Roles.ADMINISTRATOR,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      resetPassword: jest.fn(),
      confirmPasswordReset: jest.fn(),
      changePassword: jest.fn(),
      verifyEmail: jest.fn(),
      resendVerificationEmail: jest.fn(),
      checkAuthStatus: jest.fn(),
      hasPermission: jest.fn()
    });
    
    const { result: adminResult } = renderHook(() => useAuth());
    expect(adminResult.current.isAdmin).toBe(true);
    expect(adminResult.current.isProvider).toBe(false);
    expect(adminResult.current.isClient).toBe(false);
    expect(adminResult.current.isCaseManager).toBe(false);
    
    // Test with provider role
    useAuthContext.mockReturnValue({
      user: { role: Roles.PROVIDER },
      isAuthenticated: true,
      isLoading: false,
      error: null,
      hasRole: (role) => role === Roles.PROVIDER,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      resetPassword: jest.fn(),
      confirmPasswordReset: jest.fn(),
      changePassword: jest.fn(),
      verifyEmail: jest.fn(),
      resendVerificationEmail: jest.fn(),
      checkAuthStatus: jest.fn(),
      hasPermission: jest.fn()
    });
    
    const { result: providerResult } = renderHook(() => useAuth());
    expect(providerResult.current.isAdmin).toBe(false);
    expect(providerResult.current.isProvider).toBe(true);
    expect(providerResult.current.isClient).toBe(false);
    expect(providerResult.current.isCaseManager).toBe(false);
    
    // Test with client role
    useAuthContext.mockReturnValue({
      user: { role: Roles.CLIENT },
      isAuthenticated: true,
      isLoading: false,
      error: null,
      hasRole: (role) => role === Roles.CLIENT,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      resetPassword: jest.fn(),
      confirmPasswordReset: jest.fn(),
      changePassword: jest.fn(),
      verifyEmail: jest.fn(),
      resendVerificationEmail: jest.fn(),
      checkAuthStatus: jest.fn(),
      hasPermission: jest.fn()
    });
    
    const { result: clientResult } = renderHook(() => useAuth());
    expect(clientResult.current.isAdmin).toBe(false);
    expect(clientResult.current.isProvider).toBe(false);
    expect(clientResult.current.isClient).toBe(true);
    expect(clientResult.current.isCaseManager).toBe(false);
    
    // Test with case manager role
    useAuthContext.mockReturnValue({
      user: { role: Roles.CASE_MANAGER },
      isAuthenticated: true,
      isLoading: false,
      error: null,
      hasRole: (role) => role === Roles.CASE_MANAGER,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      resetPassword: jest.fn(),
      confirmPasswordReset: jest.fn(),
      changePassword: jest.fn(),
      verifyEmail: jest.fn(),
      resendVerificationEmail: jest.fn(),
      checkAuthStatus: jest.fn(),
      hasPermission: jest.fn()
    });
    
    const { result: caseManagerResult } = renderHook(() => useAuth());
    expect(caseManagerResult.current.isAdmin).toBe(false);
    expect(caseManagerResult.current.isProvider).toBe(false);
    expect(caseManagerResult.current.isClient).toBe(false);
    expect(caseManagerResult.current.isCaseManager).toBe(true);
  });
  
  it('should handle requireAuth correctly when authenticated', () => {
    // Setup mock auth context with authenticated user
    useAuthContext.mockReturnValue({
      user: { id: '1', email: 'user@example.com' },
      isAuthenticated: true,
      isLoading: false,
      error: null,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      resetPassword: jest.fn(),
      confirmPasswordReset: jest.fn(),
      changePassword: jest.fn(),
      verifyEmail: jest.fn(),
      resendVerificationEmail: jest.fn(),
      checkAuthStatus: jest.fn(),
      hasRole: jest.fn(),
      hasPermission: jest.fn()
    });
    
    const { result } = renderHook(() => useAuth());
    
    const isAuth = result.current.requireAuth();
    
    expect(isAuth).toBe(true);
    expect(mockPush).not.toHaveBeenCalled();
  });
  
  it('should handle requireAuth correctly when not authenticated', () => {
    // Setup mock auth context with unauthenticated user
    useAuthContext.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      resetPassword: jest.fn(),
      confirmPasswordReset: jest.fn(),
      changePassword: jest.fn(),
      verifyEmail: jest.fn(),
      resendVerificationEmail: jest.fn(),
      checkAuthStatus: jest.fn(),
      hasRole: jest.fn(),
      hasPermission: jest.fn()
    });
    
    const { result } = renderHook(() => useAuth());
    
    const redirectPath = '/login';
    const isAuth = result.current.requireAuth(redirectPath);
    
    expect(isAuth).toBe(false);
    // The hook doesn't handle redirection, it returns false
    expect(mockPush).not.toHaveBeenCalled();
  });
  
  it('should memoize helper functions', async () => {
    // Setup mock auth context with authenticated user
    useAuthContext.mockReturnValue({
      user: { id: '1', email: 'user@example.com' },
      isAuthenticated: true,
      isLoading: false,
      error: null,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      resetPassword: jest.fn(),
      confirmPasswordReset: jest.fn(),
      changePassword: jest.fn(),
      verifyEmail: jest.fn(),
      resendVerificationEmail: jest.fn(),
      checkAuthStatus: jest.fn(),
      hasRole: jest.fn(),
      hasPermission: jest.fn()
    });
    
    const { result, rerender } = renderHook(() => useAuth());
    
    // Store references to the helper functions
    const requireAuthBefore = result.current.requireAuth;
    const isAdminBefore = result.current.isAdmin;
    const isProviderBefore = result.current.isProvider;
    const isClientBefore = result.current.isClient;
    const isCaseManagerBefore = result.current.isCaseManager;
    
    // Re-render the hook
    rerender();
    
    // Check that the function references remain the same
    expect(result.current.requireAuth).toBe(requireAuthBefore);
    expect(result.current.isAdmin).toBe(isAdminBefore);
    expect(result.current.isProvider).toBe(isProviderBefore);
    expect(result.current.isClient).toBe(isClientBefore);
    expect(result.current.isCaseManager).toBe(isCaseManagerBefore);
  });
});