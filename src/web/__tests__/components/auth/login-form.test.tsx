import {
  render,
  screen,
  fireEvent,
  waitFor,
} from '@testing-library/react'; // @testing-library/react: ^14.0.0
import userEvent from '@testing-library/user-event'; // @testing-library/user-event: ^14.0.0
import {
  vi,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} from 'vitest'; // vitest: ^0.34.0
import { LoginForm } from '../../../components/auth/login-form'; // LoginForm
import { AuthContextType } from '../../../types/auth'; // AuthContextType
import { useRouter } from 'next/navigation'; // useRouter

// Mock the useAuth hook
vi.mock('../../../hooks/use-auth', () => ({
  useAuth: vi.fn(),
}));

// Mock the useRouter hook
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

/**
 * Mock implementation of the useAuth hook for testing
 * @returns Mocked useAuth hook with login function and isLoading state
 */
const mockUseAuth = () => {
  const login = vi.fn().mockResolvedValue(undefined);
  const isLoading = false;
  const error = null;
  const hasRole = vi.fn().mockReturnValue(true);
  const hasPermission = vi.fn().mockReturnValue(true);

  (vi.mocked(require('../../../hooks/use-auth').useAuth) as any).mockImplementation(
    () => ({
      user: null,
      isAuthenticated: false,
      isLoading,
      error,
      login,
      register: vi.fn(),
      logout: vi.fn(),
      resetPassword: vi.fn(),
      confirmPasswordReset: vi.fn(),
      changePassword: vi.fn(),
      verifyEmail: vi.fn(),
      resendVerificationEmail: vi.fn(),
      checkAuthStatus: vi.fn(),
      hasRole,
      hasPermission,
    })
  );

  return { login, isLoading, error };
};

/**
 * Helper function to render the LoginForm component with test providers
 * @param props Optional props to pass to the LoginForm component
 * @returns Rendered component and utilities from React Testing Library
 */
const renderLoginForm = (props = {}) => {
  return render(<LoginForm {...props} />);
};

describe('LoginForm', () => {
  beforeEach(() => {
    mockUseAuth();
    (useRouter as vi.Mock).mockReturnValue({
      push: vi.fn(),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the login form correctly', () => {
    renderLoginForm();

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Remember me')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
    expect(screen.getByText('Forgot password?')).toBeInTheDocument();
    expect(screen.getByText("Don't have an account? Register")).toBeInTheDocument();
  });

  it('validates form inputs correctly', async () => {
    renderLoginForm();

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign In' });

    await fireEvent.click(submitButton);

    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();

    await fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    await fireEvent.click(submitButton);

    expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();

    await fireEvent.change(passwordInput, { target: { value: 'short' } });
    await fireEvent.click(submitButton);

    expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
  });

  it('toggles password visibility', async () => {
    renderLoginForm();

    const passwordInput = screen.getByLabelText('Password');
    const toggleButton = screen.getByRole('button', { name: /Show password/i });

    expect(passwordInput).toHaveAttribute('type', 'password');

    await fireEvent.click(toggleButton);

    expect(passwordInput).toHaveAttribute('type', 'text');

    await fireEvent.click(toggleButton);

    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('submits the form with valid data', async () => {
    const { login } = mockUseAuth();
    renderLoginForm();

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const rememberCheckbox = screen.getByLabelText('Remember me');
    const submitButton = screen.getByRole('button', { name: 'Sign In' });

    await fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    await fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
    await fireEvent.click(rememberCheckbox);
    await fireEvent.click(submitButton);

    expect(login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'Password123!',
      remember: true,
    });

    expect(screen.getByRole('button', { name: 'Signing in...' })).toBeInTheDocument();
  });

  it('displays error message on login failure', async () => {
    mockUseAuth();
    (vi.mocked(require('../../../hooks/use-auth').useAuth) as any).mockImplementation(() => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: 'Invalid email or password',
      login: vi.fn().mockRejectedValue(new Error('Invalid email or password')),
      register: vi.fn(),
      logout: vi.fn(),
      resetPassword: vi.fn(),
      confirmPasswordReset: vi.fn(),
      changePassword: vi.fn(),
      verifyEmail: vi.fn(),
      resendVerificationEmail: vi.fn(),
      checkAuthStatus: vi.fn(),
      hasRole: vi.fn().mockReturnValue(true),
      hasPermission: vi.fn().mockReturnValue(true),
    }));
    renderLoginForm();

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign In' });

    await fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    await fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
    await fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });
  });

  it('redirects to specified URL after successful login', async () => {
    mockUseAuth();
    const pushMock = vi.fn();
    (useRouter as vi.Mock).mockReturnValue({
      push: pushMock,
    });
    renderLoginForm({ redirectTo: '/profile' });

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign In' });

    await fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    await fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
    await fireEvent.click(submitButton);

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/profile');
    });
  });

  it('redirects to dashboard if no redirectTo is specified', async () => {
    mockUseAuth();
    const pushMock = vi.fn();
    (useRouter as vi.Mock).mockReturnValue({
      push: pushMock,
    });
    renderLoginForm();

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign In' });

    await fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    await fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
    await fireEvent.click(submitButton);

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/dashboard');
    });
  });
});