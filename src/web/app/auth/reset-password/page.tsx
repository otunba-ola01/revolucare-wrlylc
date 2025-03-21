import React, { useState, useEffect } from 'react'; // v18.0+
import { useSearchParams, useRouter } from 'next/navigation'; // ^14.0.0
import Link from 'next/link'; // ^14.0.0

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '../../../components/ui/form';
import { Input } from '../../../components/ui/input';
import { Alert, AlertTitle, AlertDescription } from '../../../components/ui/alert';
import { passwordResetConfirmationSchema } from '../../../lib/schemas/auth';
import { resetPassword } from '../../../lib/api/auth';
import { useForm } from '../../../hooks/use-form';
import { useToast } from '../../../hooks/use-toast';
import { PasswordResetConfirmation } from '../../../types/auth';

/**
 * @file A Next.js page component that handles password reset confirmation in the Revolucare platform.
 * This page extracts the reset token from the URL query parameters and allows users to set a new password.
 */

/**
 * A page component that allows users to reset their password using a token from the URL
 * @returns Rendered reset password page component
 */
const ResetPasswordPage: React.FC = () => {
  // Initialize state for loading, success, error, and token validity
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  
  // Extract token from URL search parameters
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Initialize toast hook for displaying notifications
  const { toast } = useToast();

  // Initialize form with validation schema and submission handler
  const form = useForm<PasswordResetConfirmation>({
    defaultValues: {
      token: '',
      password: '',
      confirmPassword: '',
    },
    validationSchema: passwordResetConfirmationSchema,
    onSubmit: async (data: PasswordResetConfirmation) => {
      await handlePasswordReset(data);
    },
  });

  /**
   * Handles the password reset confirmation submission
   * @param data PasswordResetConfirmation
   * @returns Promise that resolves when the password reset is processed
   */
  const handlePasswordReset = async (data: PasswordResetConfirmation) => {
    // Set loading state to true
    setLoading(true);
    try {
      // Try to submit the password reset confirmation using the API
      await resetPassword(data);

      // Display success toast notification if reset is successful
      toast({
        title: 'Password Reset Successful',
        description: 'Your password has been reset successfully. You can now log in with your new password.',
        variant: 'success',
      });

      // Set success state to true
      setSuccess(true);
    } catch (error: any) {
      console.error('Password reset failed:', error);

      // Display error toast notification if reset fails
      toast({
        title: 'Password Reset Failed',
        description: error?.message || 'Failed to reset password. Please try again.',
        variant: 'error',
      });
    } finally {
      // Finally, set loading state back to false
      setLoading(false);
    }
  };

  // Check token presence and validity on component mount
  useEffect(() => {
    const urlToken = searchParams.get('token');
    if (urlToken) {
      setToken(urlToken);
      form.setValue('token', urlToken);
      setTokenValid(true);
    } else {
      setTokenValid(false);
    }
  }, [searchParams, form]);

  return (
    <div className="container flex items-center justify-center min-h-screen">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Reset Password</CardTitle>
          <CardDescription>Enter your new password.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* If token is missing, display error message and link to request password reset */}
          {!tokenValid && (
            <Alert variant="error">
              <AlertTitle>Invalid or missing token</AlertTitle>
              <AlertDescription>
                Please request a new password reset link. <Link href="/auth/request-password-reset">Request Password Reset</Link>
              </AlertDescription>
            </Alert>
          )}

          {/* If token is present, render password reset form with password and confirm password fields */}
          {tokenValid && !success && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handlePasswordReset)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input placeholder="New Password" type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <Input placeholder="Confirm New Password" type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Show loading state on button during submission */}
                <Button type="submit" disabled={form.formState.isSubmitting} isLoading={loading}>
                  {loading ? 'Submitting...' : 'Reset Password'}
                </Button>
              </form>
            </Form>
          )}

          {/* Display success message after successful password reset with link to login */}
          {success && (
            <Alert variant="success">
              <AlertTitle>Password reset successful</AlertTitle>
              <AlertDescription>
                Your password has been reset. <Link href="/login">Click here to login</Link>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPasswordPage;