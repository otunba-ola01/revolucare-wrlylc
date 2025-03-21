import React, { useState, useEffect } from 'react'; // react ^18.2.0
import { useRouter } from 'next/navigation'; // next/navigation ^14.0.0
import { zodResolver } from '@hookform/resolvers/zod'; // @hookform/resolvers/zod ^3.1.1
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select';
import { Textarea } from '../../../../components/ui/textarea';
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
} from '../../../../components/ui/form';
import { Alert, AlertTitle, AlertDescription } from '../../../../components/ui/alert';
import { LoadingSpinner } from '../../../../components/common/loading-spinner';
import { useAuth } from '../../../../hooks/use-auth';
import { useForm } from '../../../../hooks/use-form';
import { useToast } from '../../../../hooks/use-toast';
import { profileUpdateSchema } from '../../../../lib/schemas/profile';
import { UserRole, ProfileUpdateRequest, ProfileResponse, UserWithProfile } from '../../../../types/user';
import { get, put } from '../../../../lib/api/client';
import { PageContainer } from '../../../../components/layout/page-container';

/**
 * Profile edit page component that allows users to update their profile information
 * @returns Rendered profile edit page
 */
const ProfileEditPage: React.FC = () => {
  // Get the authenticated user data using the useAuth hook
  const { user, isAuthenticated, isLoading: authLoading, checkAuthStatus } = useAuth();

  // Initialize state for profile data, loading state, and submission status
  const [profile, setProfile] = useState<UserWithProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submissionStatus, setSubmissionStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Initialize router for navigation
  const router = useRouter();

  // Initialize toast notifications
  const { toast } = useToast();

  // Set up form with profileUpdateSchema validation
  const form = useForm<ProfileUpdateRequest>({
    defaultValues: {
      firstName: '',
      lastName: '',
      profileData: {},
    },
    validationSchema: profileUpdateSchema,
    onSubmit: async (data: ProfileUpdateRequest) => {
      await handleSubmit(data);
    },
  });

  /**
   * Fetches the user's profile data from the API
   * @returns Promise that resolves when data is fetched
   */
  const fetchProfileData = async () => {
    setLoading(true);
    try {
      // Make API request to get profile data
      const profileData: ProfileResponse = await get('/api/users/profile');

      // Handle successful response by updating profile state and form default values
      setProfile({
        user: profileData.user,
        clientProfile: profileData.profile?.clientProfile || null,
        providerProfile: profileData.profile?.providerProfile || null,
        caseManagerProfile: profileData.profile?.caseManagerProfile || null,
        adminProfile: profileData.profile?.adminProfile || null,
      });

      form.reset({
        firstName: profileData.user.firstName,
        lastName: profileData.user.lastName,
        profileData: profileData.profile || {},
      });
    } catch (error: any) {
      // Handle errors with appropriate error handling
      console.error('Failed to fetch profile data', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch profile data',
        variant: 'error',
      });
    } finally {
      // Set loading state to false when complete
      setLoading(false);
    }
  };

  /**
   * Handles form submission for profile updates
   * @param data ProfileUpdateRequest
   * @returns Promise that resolves when submission is complete
   */
  const handleSubmit = async (data: ProfileUpdateRequest) => {
    form.setValue('firstName', data.firstName);
    form.setValue('lastName', data.lastName);
    form.setValue('profileData', data.profileData);
    form.clearErrors();
    setSubmissionStatus(null);

    try {
      // Set submitting state to true
      form.formState.isSubmitting = true;

      // Clear any previous submission status
      setSubmissionStatus(null);

      // Prepare the profile update request with form data
      const updateData = {
        firstName: data.firstName,
        lastName: data.lastName,
        profileData: data.profileData,
      };

      // Make API request to update profile
      const response: ProfileResponse = await put('/api/users/profile', updateData);

      // Handle successful response with success message and redirect
      setSubmissionStatus({ success: true, message: response.message });
      toast({
        title: 'Success',
        description: response.message || 'Profile updated successfully',
        variant: 'success',
      });
      router.push('/dashboard');
    } catch (error: any) {
      // Handle errors with appropriate error message
      console.error('Profile update failed', error);
      setSubmissionStatus({ success: false, message: error.message || 'Profile update failed' });
      toast({
        title: 'Error',
        description: error.message || 'Profile update failed',
        variant: 'error',
      });
    } finally {
      // Set submitting state to false
      form.formState.isSubmitting = false;
    }
  };

  // Fetch the user's profile data on component mount
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchProfileData();
    }
  }, [isAuthenticated, user]);

  // Handle unauthenticated state with a redirect to login
  if (!isAuthenticated && !authLoading) {
    router.push('/login');
    return null;
  }

  // Handle loading state with a loading spinner
  if (loading || authLoading) {
    return (
      <PageContainer>
        <Card>
          <CardHeader>
            <CardTitle>Loading Profile...</CardTitle>
            <CardDescription>Please wait while we fetch your profile information.</CardDescription>
          </CardHeader>
          <CardContent>
            <LoadingSpinner text="Loading..." />
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  /**
   * Renders form fields specific to client profiles
   * @returns Client-specific form fields
   */
  const renderClientProfileFields = () => (
    <>
      <FormField
        control={form.control}
        name="profileData.dateOfBirth"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Date of Birth</FormLabel>
            <FormControl>
              <Input type="date" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="profileData.gender"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Gender</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a gender" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="non-binary">Non-binary</SelectItem>
                <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );

  /**
   * Renders form fields specific to provider profiles
   * @returns Provider-specific form fields
   */
  const renderProviderProfileFields = () => (
    <>
      <FormField
        control={form.control}
        name="profileData.organizationName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Organization Name</FormLabel>
            <FormControl>
              <Input placeholder="Enter organization name" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="profileData.licenseNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel>License Number</FormLabel>
            <FormControl>
              <Input placeholder="Enter license number" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );

  /**
   * Renders form fields specific to case manager profiles
   * @returns Case manager-specific form fields
   */
  const renderCaseManagerProfileFields = () => (
    <>
      <FormField
        control={form.control}
        name="profileData.certification"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Certification</FormLabel>
            <FormControl>
              <Input placeholder="Enter certification" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="profileData.specialty"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Specialty</FormLabel>
            <FormControl>
              <Input placeholder="Enter specialty" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );

  /**
   * Renders form fields specific to administrator profiles
   * @returns Administrator-specific form fields
   */
  const renderAdminProfileFields = () => (
    <>
      <FormField
        control={form.control}
        name="profileData.department"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Department</FormLabel>
            <FormControl>
              <Input placeholder="Enter department" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );

  /**
   * Renders different form fields based on user role
   * @returns Role-specific form fields
   */
  const renderRoleSpecificFields = () => {
    switch (user?.role) {
      case UserRole.CLIENT:
        return renderClientProfileFields();
      case UserRole.PROVIDER:
        return renderProviderProfileFields();
      case UserRole.CASE_MANAGER:
        return renderCaseManagerProfileFields();
      case UserRole.ADMINISTRATOR:
        return renderAdminProfileFields();
      default:
        return null;
    }
  };

  // Render the profile edit form with appropriate fields based on user role
  return (
    <PageContainer>
      <Card>
        <CardHeader>
          <CardTitle>Edit Profile</CardTitle>
          <CardDescription>Update your profile information here.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
              <FormSection title="Basic Information">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your first name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your last name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </FormSection>

              <FormSection title="Profile Information">
                {renderRoleSpecificFields()}
              </FormSection>

              <FormActions>
                <Button variant="secondary" type="button" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Submitting...' : 'Save Changes'}
                </Button>
              </FormActions>
            </form>
          </Form>
        </CardContent>
        {submissionStatus && (
          <CardFooter>
            <Alert variant={submissionStatus.success ? 'success' : 'error'}>
              <AlertTitle>{submissionStatus.success ? 'Success' : 'Error'}</AlertTitle>
              <AlertDescription>{submissionStatus.message}</AlertDescription>
            </Alert>
          </CardFooter>
        )}
      </Card>
    </PageContainer>
  );
};

export default ProfileEditPage;