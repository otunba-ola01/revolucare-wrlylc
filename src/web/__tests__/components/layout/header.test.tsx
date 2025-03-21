import React from 'react'; // react ^18.2.0
import { render, screen, fireEvent, waitFor } from '@testing-library/react'; // @testing-library/react ^14.0.0
import { expect, describe, it, beforeEach, jest } from '@jest/globals'; // @jest/globals ^29.5.0
import { usePathname } from 'next/navigation'; // next/navigation ^14.0.0

import { Header } from '../../../components/layout/header';
import { useAuth } from '../../../hooks/use-auth';
import { useTheme } from '../../../lib/state/theme-provider';

// Mock the useAuth hook
jest.mock('../../../hooks/use-auth');
// Mock the useTheme hook
jest.mock('../../../lib/state/theme-provider');
// Mock the next/navigation hook
jest.mock('next/navigation');

describe('Header component', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Setup default mock implementations for hooks
    (useAuth as jest.Mock).mockReturnValue({
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
      hasPermission: jest.fn(),
      isAdmin: false,
      isProvider: false,
      isClient: false,
      isCaseManager: false,
      requireAuth: jest.fn(),
    });

    (useTheme as jest.Mock).mockReturnValue({
      theme: 'light',
      setTheme: jest.fn(),
      resolvedTheme: 'light',
    });

    (usePathname as jest.Mock).mockReturnValue('/');
  });

  it('renders correctly when user is not authenticated', () => {
    // Mock useAuth to return isAuthenticated: false
    (useAuth as jest.Mock).mockReturnValue({
      ...((useAuth as jest.Mock).getMockImplementation() as any),
      isAuthenticated: false,
    });

    // Render the Header component
    render(<Header />);

    // Verify that the logo is displayed
    expect(screen.getByAltText('Revolucare Logo')).toBeInTheDocument();

    // Verify that login and register buttons are displayed
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();

    // Verify that user menu and notification bell are not displayed
    expect(screen.queryByRole('button', { name: /user menu/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /notifications/i })).not.toBeInTheDocument();
  });

  it('renders correctly when user is authenticated', () => {
    // Mock useAuth to return isAuthenticated: true with user data
    (useAuth as jest.Mock).mockReturnValue({
      ...((useAuth as jest.Mock).getMockImplementation() as any),
      isAuthenticated: true,
      user: {
        id: '123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'client',
        isVerified: true,
        profileComplete: true,
        permissions: [],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    });

    // Render the Header component
    render(<Header />);

    // Verify that the logo is displayed
    expect(screen.getByAltText('Revolucare Logo')).toBeInTheDocument();

    // Verify that user menu and notification bell are displayed
    expect(screen.getByRole('button', { name: /user menu/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument();

    // Verify that login and register buttons are not displayed
    expect(screen.queryByText('Login')).not.toBeInTheDocument();
    expect(screen.queryByText('Register')).not.toBeInTheDocument();
  });

  it('toggles mobile menu when menu button is clicked', async () => {
    // Render the Header component
    render(<Header />);

    // Verify that the mobile menu is initially hidden
    const mobileMenu = screen.queryByRole('navigation', { name: /mobile/i });
    expect(mobileMenu).toBeNull();

    // Click the menu button
    const menuButton = screen.getByRole('button', { name: /toggle mobile menu/i });
    fireEvent.click(menuButton);

    // Verify that the mobile menu is displayed
    const mobileMenuOpen = screen.getByRole('navigation', { name: /mobile/i });
    expect(mobileMenuOpen).toBeVisible();

    // Click the menu button again
    fireEvent.click(menuButton);

    // Verify that the mobile menu is hidden again
    await waitFor(() => {
      const mobileMenuClosed = screen.queryByRole('navigation', { name: /mobile/i });
      expect(mobileMenuClosed).toBeNull();
    });
  });

  it('changes theme when theme toggle button is clicked', () => {
    // Create a mock setTheme function
    const mockSetTheme = jest.fn();

    // Mock useTheme to return theme: 'light' and the mock setTheme function
    (useTheme as jest.Mock).mockReturnValue({
      theme: 'light',
      setTheme: mockSetTheme,
      resolvedTheme: 'light',
    });

    // Render the Header component
    render(<Header />);

    // Click the theme toggle button
    const themeToggleButton = screen.getByRole('button', { name: /toggle theme/i });
    fireEvent.click(themeToggleButton);

    // Verify that setTheme was called with 'dark'
    expect(mockSetTheme).toHaveBeenCalledWith('dark');

    // Update the mock to return theme: 'dark'
    (useTheme as jest.Mock).mockReturnValue({
      theme: 'dark',
      setTheme: mockSetTheme,
      resolvedTheme: 'dark',
    });

    // Click the theme toggle button again
    fireEvent.click(themeToggleButton);

    // Verify that setTheme was called with 'system'
    expect(mockSetTheme).toHaveBeenCalledWith('system');

    // Update the mock to return theme: 'system'
    (useTheme as jest.Mock).mockReturnValue({
      theme: 'system',
      setTheme: mockSetTheme,
      resolvedTheme: 'system',
    });

    // Click the theme toggle button again
    fireEvent.click(themeToggleButton);

    // Verify that setTheme was called with 'light'
    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });

  it('displays correct navigation items based on user role', () => {
    // Mock useAuth to return isAuthenticated: true with admin role
    (useAuth as jest.Mock).mockReturnValue({
      ...((useAuth as jest.Mock).getMockImplementation() as any),
      isAuthenticated: true,
      user: {
        id: '123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'administrator',
        isVerified: true,
        profileComplete: true,
        permissions: [],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    });

    // Render the Header component
    render(<Header />);

    // Verify that admin-specific navigation items are displayed
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Care Plans')).toBeInTheDocument();

    // Update mock to return provider role
    (useAuth as jest.Mock).mockReturnValue({
      ...((useAuth as jest.Mock).getMockImplementation() as any),
      isAuthenticated: true,
      user: {
        id: '123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'provider',
        isVerified: true,
        profileComplete: true,
        permissions: [],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    });

    // Re-render the Header component
    render(<Header />);

    // Verify that provider-specific navigation items are displayed
    expect(screen.getByText('Providers')).toBeInTheDocument();

    // Update mock to return client role
    (useAuth as jest.Mock).mockReturnValue({
      ...((useAuth as jest.Mock).getMockImplementation() as any),
      isAuthenticated: true,
      user: {
        id: '123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'client',
        isVerified: true,
        profileComplete: true,
        permissions: [],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    });

    // Re-render the Header component
    render(<Header />);

    // Verify that client-specific navigation items are displayed
    expect(screen.getByText('Care Plans')).toBeInTheDocument();
  });

  it('highlights the active navigation item based on current path', () => {
    // Mock usePathname to return '/care-plans'
    (usePathname as jest.Mock).mockReturnValue('/care-plans');

    // Mock useAuth to return isAuthenticated: true
    (useAuth as jest.Mock).mockReturnValue({
      ...((useAuth as jest.Mock).getMockImplementation() as any),
      isAuthenticated: true,
      user: {
        id: '123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'client',
        isVerified: true,
        profileComplete: true,
        permissions: [],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    });

    // Render the Header component
    render(<Header />);

    // Verify that the 'Care Plans' navigation item has the active class
    const carePlansLink = screen.getByText('Care Plans');
    expect(carePlansLink).toHaveClass('text-indigo-700');

    // Update pathname mock to return '/providers'
    (usePathname as jest.Mock).mockReturnValue('/providers');

    // Re-render the Header component
    render(<Header />);

    // Verify that the 'Providers' navigation item has the active class
    const providersLink = screen.getByText('Providers');
    expect(providersLink).toHaveClass('text-indigo-700');
  });

  it('renders mobile navigation on small screens', () => {
    // Mock window.innerWidth to simulate small screen
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 320,
    });

    // Mock useAuth to return isAuthenticated: true
    (useAuth as jest.Mock).mockReturnValue({
      ...((useAuth as jest.Mock).getMockImplementation() as any),
      isAuthenticated: true,
      user: {
        id: '123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'client',
        isVerified: true,
        profileComplete: true,
        permissions: [],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    });

    // Render the Header component
    render(<Header />);

    // Verify that the MobileNav component is rendered
    const mobileNav = screen.getByRole('navigation', { name: /mobile/i });
    expect(mobileNav).toBeVisible();

    // Verify that the desktop Navigation component is not visible
    const desktopNav = screen.queryByRole('navigation', { name: /main/i });
    expect(desktopNav).not.toBeVisible();
  });
});