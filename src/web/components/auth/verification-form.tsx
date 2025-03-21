import React, { useState } from 'react'; // v18.0+
import { useForm } from 'react-hook-form'; // v7.43.9
import { zodResolver } from '@hookform/resolvers/zod'; // v3.1.0
import { useRouter } from 'next/navigation'; // v13.4.1
import { KeyRound, Mail } from 'lucide-react'; // v0.284.0

import { Button } from '../ui/button';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';
import { ErrorMessage } from '../common/error-message';
import { emailVerificationSchema, resendVerificationSchema } from '../../lib/schemas/auth';
import useAuth from '../../hooks/use-auth';

/**
 * A form component for email verification with token input
 */
export const VerificationForm: React.FC<{
  token?: string;
  email?: string;
  redirectTo?: string;
  className?: string;
}> = ({ token, email, redirectTo, className }) => {
  // Initialize router for navigation after successful verification
  const router = useRouter();

  // Initialize authentication hook for verification functionality
  const { verifyEmail, resendVerificationEmail, error: authError, isLoading } = useAuth();

  // Set up form state management with useForm and zodResolver for validation
  const form = useForm({
    defaultValues: {
      token: token || '',
    },
    resolver: zodResolver(emailVerificationSchema),
  });

  // Set up state for tracking if resend verification is in progress
  const [isResendVerificationLoading, setIsResendVerificationLoading] = useState(false);

  /**
   * Handle form submission with onSubmit function
   * Attempt to verify email with token from form
   * Navigate to redirectTo or dashboard on success
   * Handle and display errors on failure
   */
  const onSubmit = async (values: { token: string }) => {
    try {
      await verifyEmail({ token: values.token });
      router.push(redirectTo || '/dashboard');
    } catch (error: any) {
      form.setError('token', {
        type: 'manual',
        message: error?.message || 'Verification failed. Please check your token.',
      });
    }
  };

  /**
   * Handle resend verification with handleResendVerification function
   * Attempt to resend verification email
   * Display success or error message
   */
  const handleResendVerification = async () => {
    setIsResendVerificationLoading(true);
    try {
      await resendVerificationEmail({ email: email || '' });
      form.reset();
      form.setValue('token', '');
      form.trigger();
      alert('Verification email resent successfully! Please check your inbox.');
    } catch (error: any) {
      form.setError('token', {
        type: 'manual',
        message: error?.message || 'Failed to resend verification email.',
      });
    } finally {
      setIsResendVerificationLoading(false);
    }
  };

  return (
    <div className={className}>
      {authError && (
        <ErrorMessage error={authError} showIcon />
      )}
      {/* Render form with token input field */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col space-y-4">
          <FormField
            control={form.control}
            name="token"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Verification Token</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter verification token from your email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Display verification errors with ErrorMessage component */}
          {form.formState.errors.token && (
            <ErrorMessage error={form.formState.errors.token.message} showIcon />
          )}
          {/* Include option to resend verification email */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loadingText="Verifying..."
            isLoading={isLoading}
          >
            Verify Email
          </Button>
        </form>
      </Form>
      <div className="mt-4 text-sm">
        Didn't receive the email?{' '}
        <Button
          variant="link"
          size="sm"
          disabled={isResendVerificationLoading}
          onClick={handleResendVerification}
        >
          Resend Verification Email
        </Button>
      </div>
    </div>
  );
};

/**
 * A form component for requesting a new verification email
 */
export const ResendVerificationForm: React.FC<{
  email?: string;
  onSuccess?: () => void;
  className?: string;
}> = ({ email, onSuccess, className }) => {
  // Initialize authentication hook for resend verification functionality
  const { resendVerificationEmail, error: authError, isLoading } = useAuth();

  // Set up form state management with useForm and zodResolver for validation
  const form = useForm({
    defaultValues: {
      email: email || '',
    },
    resolver: zodResolver(resendVerificationSchema),
  });

  /**
   * Handle form submission with onSubmit function
   * Attempt to resend verification email with email from form
   * Call onSuccess callback if provided
   * Handle and display errors on failure
   */
  const onSubmit = async (values: { email: string }) => {
    try {
      await resendVerificationEmail({ email: values.email });
      onSuccess?.();
    } catch (error: any) {
      form.setError('email', {
        type: 'manual',
        message: error?.message || 'Failed to resend verification email.',
      });
    }
  };

  return (
    <div className={className}>
      {authError && (
        <ErrorMessage error={authError} showIcon />
      )}
      {/* Render form with email input field */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter your email address"
                    type="email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Display resend verification errors with ErrorMessage component */}
          {form.formState.errors.email && (
            <ErrorMessage error={form.formState.errors.email.message} showIcon />
          )}
          {/* Render submit button with loading state during resend process */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loadingText="Sending..."
            isLoading={isLoading}
          >
            Resend Verification Email
          </Button>
        </form>
      </Form>
    </div>
  );
};

export { VerificationForm };