import React, { useState } from 'react'; // react ^18.2.0
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import {
  passwordResetRequestSchema,
} from '../../lib/schemas/auth';
import { requestPasswordReset } from '../../lib/api/auth';
import { useForm } from '../../hooks/use-form';
import { useToast } from '../../hooks/use-toast';
import { PasswordResetRequest } from '../../types/auth';

/**
 * A form component that allows users to request a password reset by entering their email address
 */
export const PasswordResetForm: React.FC = () => {
  // Initialize state for loading and success status
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Initialize toast hook for displaying notifications
  const { toast } = useToast();

  // Initialize form with validation schema and submission handler
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordResetRequest>({
    defaultValues: {
      email: '',
    },
    validationSchema: passwordResetRequestSchema,
    onSubmit: async (data: PasswordResetRequest) => {
      await handlePasswordResetRequest(data);
    },
  });

  /**
   * Handles the password reset request submission
   * @param {PasswordResetRequest} data - The email address to request a password reset for
   * @returns {Promise<void>} - A promise that resolves when the request is processed
   */
  const handlePasswordResetRequest = async (data: PasswordResetRequest): Promise<void> => {
    // Set loading state to true
    setIsLoading(true);
    try {
      // Try to submit the password reset request using the API
      await requestPasswordReset(data);

      // Display success toast notification if request is successful
      toast({
        title: 'Password Reset Request Sent',
        description: 'Check your email for a password reset link.',
      });

      // Set success state to true
      setSuccess(true);
    } catch (error: any) {
      // Catch and handle any errors that occur during submission
      console.error('Password reset request failed:', error);

      // Display error toast notification if request fails
      toast({
        title: 'Error',
        description:
          error?.message || 'Failed to request password reset. Please try again.',
        variant: 'error',
      });
    } finally {
      // Finally, set loading state back to false
      setIsLoading(false);
    }
  };

  // Render success message if request was successful
  if (success) {
    return (
      <div className="text-green-500">
        Password reset link has been sent to your email address. Please check
        your inbox.
      </div>
    );
  }

  // Render form with email input field and submit button
  return (
    <Form>
      <form onSubmit={handleSubmit(handlePasswordResetRequest)} className="space-y-4">
        <FormField
          control={useForm().control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="Enter your email" {...field} />
              </FormControl>
              <FormMessage>{errors.email?.message}</FormMessage>
            </FormItem>
          )}
        />
        <Button type="submit" isLoading={isLoading} disabled={isLoading}>
          {isLoading ? 'Requesting...' : 'Request Password Reset'}
        </Button>
      </form>
    </Form>
  );
};