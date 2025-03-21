import React, { useState, useEffect } from 'react'; // react ^18.2.0
import { useRouter } from 'next/navigation'; // next/navigation
import { zodResolver } from '@hookform/resolvers/zod'; // @hookform/resolvers/zod
import { Link } from 'next/link'; // next/link

import { useForm } from '../../hooks/use-form'; // Custom form hook with enhanced functionality for validation and submission
import useAuth from '../../hooks/use-auth'; // Custom hook for authentication functionality
import { useToast } from '../../hooks/use-toast'; // Custom hook for displaying toast notifications
import { registerSchema } from '../../lib/schemas/auth'; // Zod validation schema for registration form
import { RegisterCredentials } from '../../types/auth'; // Type definition for registration form data
import { UserRole, Roles, RoleLabels } from '../../config/roles'; // User role definitions and labels for role selection
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormSection,
  FormActions,
} from '../ui/form'; // Form components from the design system
import { Button } from '../ui/button'; // Button component from the design system
import { Input } from '../ui/input'; // Input component from the design system
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'; // Select components from the design system for role selection
import { Checkbox } from '../ui/checkbox'; // Checkbox component from the design system for terms acceptance
import { Progress } from '../ui/progress'; // Progress component from the design system for multi-step form
import { Alert, AlertTitle, AlertDescription } from '../ui/alert'; // Alert components from the design system for error messages

interface RegisterFormProps {
  defaultRole?: UserRole;
  redirectUrl?: string;
  onSuccess?: () => void;
}

/**
 * A form component for user registration with validation and submission handling
 */
const RegisterForm: React.FC<RegisterFormProps> = ({
  defaultRole,
  redirectUrl,
  onSuccess,
}) => {
  // 1. Initialize form state using useForm hook with registerSchema for validation
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    control,
  } = useForm<RegisterCredentials>({
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      role: defaultRole || Roles.CLIENT,
      termsAccepted: false,
    },
    validationSchema: registerSchema,
  });

  // 2. Get authentication functions from useAuth hook
  const { register: authRegister } = useAuth();

  // 3. Get toast notification functions from useToast hook
  const { toast } = useToast();

  // 4. Get router for navigation after successful registration
  const router = useRouter();

  // 5. Set up state for form submission status and multi-step form navigation
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // 6. Handle form submission with validation and error handling
  const onSubmit = async (data: RegisterCredentials) => {
    setSubmissionError(null);
    try {
      await authRegister(data);
      toast({
        title: 'Registration Successful',
        description: 'Your account has been created. Please check your email for verification.',
      });
      onSuccess?.();
      router.push(redirectUrl || '/dashboard');
    } catch (error: any) {
      console.error('Registration failed:', error);
      setSubmissionError(error.message || 'Registration failed. Please try again.');
    }
  };

  // Function to advance to the next step in the form
  const nextStep = () => {
    setCurrentStep((step) => Math.min(step + 1, totalSteps));
  };

  // Function to return to the previous step in the form
  const prevStep = () => {
    setCurrentStep((step) => Math.max(step - 1, 1));
  };

  // Calculate the progress percentage
  const getStepProgress = () => {
    return (currentStep / totalSteps) * 100;
  };

  // 7. Render the registration form with appropriate fields based on current step
  return (
    <Form {...{ form: { register, handleSubmit, formState: { errors }, control }, onSubmit: handleSubmit(onSubmit) }}>
      <FormSection>
        <FormLabel>Registration Progress</FormLabel>
        <Progress value={getStepProgress()} showValue />
      </FormSection>

      {submissionError && (
        <Alert variant="error">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{submissionError}</AlertDescription>
        </Alert>
      )}

      {/* Step 1: Account Information */}
      {currentStep === 1 && (
        <FormSection title="Account Information">
          <FormField
            control={control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your email" {...field} />
                </FormControl>
                <FormMessage>{errors.email?.message}</FormMessage>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Enter your password" {...field} />
                </FormControl>
                <FormDescription>
                  Must be at least 8 characters with one uppercase, one lowercase, one number, and one special character.
                </FormDescription>
                <FormMessage>{errors.password?.message}</FormMessage>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Confirm your password" {...field} />
                </FormControl>
                <FormMessage>{errors.confirmPassword?.message}</FormMessage>
              </FormItem>
            )}
          />
        </FormSection>
      )}

      {/* Step 2: Personal Information */}
      {currentStep === 2 && (
        <FormSection title="Personal Information">
          <FormField
            control={control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your first name" {...field} />
                </FormControl>
                <FormMessage>{errors.firstName?.message}</FormMessage>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your last name" {...field} />
                </FormControl>
                <FormMessage>{errors.lastName?.message}</FormMessage>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(RoleLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage>{errors.role?.message}</FormMessage>
              </FormItem>
            )}
          />
        </FormSection>
      )}

      {/* Step 3: Terms and Conditions */}
      {currentStep === 3 && (
        <FormSection title="Terms and Conditions">
          <FormField
            control={control}
            name="termsAccepted"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <div className="space-y-1 leading-tight">
                  <FormLabel>
                    I agree to the <Link href="/terms" className="underline underline-offset-4">Terms and Conditions</Link> and <Link href="/privacy" className="underline underline-offset-4">Privacy Policy</Link>
                  </FormLabel>
                  <FormMessage>{errors.termsAccepted?.message}</FormMessage>
                </div>
              </FormItem>
            )}
          />
        </FormSection>
      )}

      {/* 8. Include navigation buttons for multi-step form */}
      <FormActions>
        {currentStep > 1 && (
          <Button variant="secondary" onClick={prevStep} disabled={isSubmitting}>
            Previous
          </Button>
        )}
        {currentStep < totalSteps ? (
          <Button onClick={nextStep} disabled={isSubmitting}>
            Next
          </Button>
        ) : (
          <Button type="submit" isLoading={isSubmitting}>
            Submit
          </Button>
        )}
      </FormActions>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account? <Link href="/login" className="underline underline-offset-4">Log in</Link>
      </p>
    </Form>
  );
};

export default RegisterForm;