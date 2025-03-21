import React, { useState } from 'react'; // React, { useState } v18.0+
import { useForm } from 'react-hook-form'; // { useForm } v7.0+
import { zodResolver } from '@hookform/resolvers/zod'; // { zodResolver } v3.1.0+
import Link from 'next/link'; // Link v13.4.1+
import { useRouter } from 'next/navigation'; // { useRouter } v13.4.1+
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'; // { Mail, Lock, Eye, EyeOff } v0.284.0+

import { Button } from '../ui/button'; // { Button }
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '../ui/form'; // { Form, FormField, FormItem, FormLabel, FormControl, FormMessage }
import { Input } from '../ui/input'; // { Input }
import { Checkbox } from '../ui/checkbox'; // { Checkbox }
import { ErrorMessage } from '../common/error-message'; // { ErrorMessage }
import { loginSchema } from '../../lib/schemas/auth'; // { loginSchema }
import { useAuth } from '../../hooks/use-auth'; // { useAuth }

/**
 * A form component for user authentication with email and password
 * @param { redirectTo, className }: { redirectTo?: string; className?: string } - props
 * @returns Rendered login form component
 */
export const LoginForm: React.FC<{ redirectTo?: string; className?: string }> = ({
  redirectTo,
  className,
}) => {
  // Initialize router for navigation after successful login
  const router = useRouter();

  // Initialize authentication hook for login functionality
  const auth = useAuth();

  // Set up form state management with useForm and zodResolver for validation
  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      remember: false,
    },
  });

  // Manage password visibility state with useState
  const [showPassword, setShowPassword] = useState(false);

  // Handle form submission with onSubmit function
  const onSubmit = async (values: typeof loginSchema._type) => {
    try {
      // Attempt login with credentials from form
      await auth.login(values);

      // Navigate to redirectTo or dashboard on success
      router.push(redirectTo || '/dashboard');
    } catch (error: any) {
      // Handle and display errors on failure
      form.setError('root', { message: error.message });
    }
  };

  return (
    <Form {...{ ...form }} onSubmit={form.handleSubmit(onSubmit)} className={className}>
      {/* Display authentication errors with ErrorMessage component */}
      {form.formState.error && (
        <ErrorMessage
          message={form.formState.error.message}
          className="mb-4"
          showIcon
        />
      )}
      <div className="flex flex-col space-y-4">
        {/* Render form with email and password fields */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter your email"
                  type="email"
                  {...field}
                  error={form.formState.errors.email?.message}
                  icon={<Mail className="h-4 w-4" />}
                />
              </FormControl>
              <FormMessage>{form.formState.errors.email?.message}</FormMessage>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    placeholder="Enter your password"
                    type={showPassword ? 'text' : 'password'}
                    {...field}
                    error={form.formState.errors.password?.message}
                    icon={<Lock className="h-4 w-4" />}
                  />
                  {/* Include password visibility toggle */}
                  <span
                    className="absolute inset-y-0 right-3 flex items-center cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </span>
                </div>
              </FormControl>
              <FormMessage>{form.formState.errors.password?.message}</FormMessage>
            </FormItem>
          )}
        />
        {/* Add 'Remember me' checkbox */}
        <FormField
          control={form.control}
          name="remember"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus-ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground">
              <div className="space-y-0.5">
                <FormLabel className="text-sm">Remember me</FormLabel>
              </div>
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        {/* Include links to registration and password reset pages */}
        <Link
          href="/auth/forgot-password"
          className="text-sm text-indigo-600 hover:text-indigo-500"
        >
          Forgot password?
        </Link>
      </div>
      {/* Render submit button with loading state during authentication */}
      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting ? 'Signing in...' : 'Sign In'}
      </Button>
      <Link href="/auth/register" className="text-sm text-center mt-4">
        Don't have an account? Register
      </Link>
    </Form>
  );
};