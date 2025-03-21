import React, { useState, useEffect } from 'react'; // react ^18.2.0
import { useParams, useRouter } from 'next/navigation'; // next/navigation ^13.4.1
import {
  MapPin,
  Phone,
  Mail,
  Calendar,
  Star,
  Award,
  Clock,
  Users,
  Briefcase,
  Shield,
  Heart,
} from 'lucide-react'; // lucide-react ^0.284.0

import { cn } from '../../lib/utils/color'; // Utility for conditionally joining class names
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../ui/tabs'; // Tabs for organizing provider information sections
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '../ui/card'; // Card components for structured layout of provider information
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '../ui/avatar'; // Avatar component for provider profile image
import { Badge } from '../ui/badge'; // Badge component for displaying service types and specializations
import { Button } from '../ui/button'; // Button component for actions like scheduling and submitting reviews
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog'; // Dialog components for review submission and scheduling
import RatingStars from './rating-stars'; // Component for displaying provider ratings as stars
import ReviewList from './review-list'; // Component for displaying provider reviews
import ReviewForm from './review-form'; // Component for submitting provider reviews
import CompatibilityScore from './compatibility-score'; // Component for displaying provider compatibility score
import ServiceAreaMap from './service-area-map'; // Component for displaying provider service areas on a map
import AvailabilityCalendar from './availability-calendar'; // Component for displaying provider availability calendar
import { LoadingSpinner } from '../common/loading-spinner'; // Component for displaying loading state
import { EmptyState } from '../common/empty-state'; // Component for displaying when no data is available
import {
  useProvider,
  useProviderReviews,
  useServiceAreas,
} from '../../hooks/use-providers'; // Hooks for fetching provider data, reviews, and service areas
import { useAuth } from '../../hooks/use-auth'; // Hook for authentication state and user role
import {
  Provider,
  ProviderMatch,
  ServiceArea,
} from '../../types/provider'; // Type definitions for provider data
import { ServiceTypeLabels } from '../../../backend/src/constants/service-types'; // Labels for service types

/**
 * Extracts initials from provider name for avatar fallback
 * @param firstName - First name
 * @param lastName - Last name
 * @returns Initials (1-2 characters)
 */
const getInitials = (firstName: string, lastName: string): string => {
  const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
  const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
  return firstInitial + lastInitial;
};

/**
 * Formats address information into a readable string
 * @param address - Address object
 * @returns Formatted address string or null if no address
 */
const formatAddress = (address: {
  street: string;
  city: string;
  state: string;
  zipCode: string;
} | null): string | null => {
  if (!address) {
    return null;
  }
  return `${address.street}, ${address.city}, ${address.state} ${address.zipCode}`;
};

/**
 * Formats a phone number into a readable format
 * @param phone - Phone number
 * @returns Formatted phone number or null if no phone
 */
const formatPhoneNumber = (phone: string | null): string | null => {
  if (!phone) {
    return null;
  }
  return `(XXX) XXX-XXXX`;
};

interface ProviderProfileProps {
  providerId?: string;
  providerData?: Provider | ProviderMatch | undefined;
  showCompatibility?: boolean;
  className?: string;
}

/**
 * A component that displays detailed information about a provider
 * @param providerId - The ID of the provider to display
 * @param providerData - Optional provider data to display
 * @param showCompatibility - Whether to show the compatibility score
 * @param className - Optional CSS class name
 * @returns Rendered provider profile component
 */
export const ProviderProfile: React.FC<ProviderProfileProps> = ({
  providerId,
  providerData,
  showCompatibility = false,
  className,
}) => {
  // Get the current user from useAuth hook to determine user role
  const { user } = useAuth();

  // Get URL parameters using useParams hook if providerId is not provided in props
  const params = useParams();
  const router = useRouter();

  // Set up state for active tab and review dialog open state
  const [activeTab, setActiveTab] = useState('overview');
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);

  // Fetch provider data using useProvider hook if not provided in props
  const { provider, isLoading, error } = useProvider(
    providerId || (params?.providerId as string)
  );

  // Fetch service areas using useServiceAreas hook
  const { serviceAreas, isLoading: isLoadingServiceAreas, error: serviceAreasError } = useServiceAreas(
    providerId || (params?.providerId as string)
  );

  // Determine if provider is a ProviderMatch by checking for compatibilityScore property
  const isProviderMatch =
    providerData && 'compatibilityScore' in providerData;

  // Extract provider data and match data if available
  const providerInfo = (providerData || provider) as Provider;
  const matchData = providerData as ProviderMatch;

  // Generate initials for avatar fallback using getInitials function
  const initials =
    providerInfo &&
    getInitials(providerInfo.firstName || '', providerInfo.lastName || '');

  // Format address and phone number using utility functions
  const formattedAddress = providerInfo && formatAddress(providerInfo.address);
  const formattedPhoneNumber =
    providerInfo && formatPhoneNumber(providerInfo.phone);

  // Handle loading state with LoadingSpinner component
  if (isLoading || isLoadingServiceAreas) {
    return (
      <Card className={className}>
        <CardContent>
          <LoadingSpinner text="Loading provider information..." />
        </CardContent>
      </Card>
    );
  }

  // Handle error state with appropriate error message
  if (error || serviceAreasError) {
    return (
      <Card className={className}>
        <CardContent>
          <EmptyState
            title="Error Loading Provider"
            description="There was an error retrieving the provider's information. Please try again later."
            variant="error"
          />
        </CardContent>
      </Card>
    );
  }

  // Render a Card component with provider profile information
  return (
    <Card className={className}>
      <CardHeader className="space-y-2">
        <div className="flex items-center space-x-4">
          {/* Render provider avatar with fallback initials */}
          <Avatar>
            <AvatarImage src={providerInfo?.profileImageUrl || ''} alt={providerInfo?.organizationName || 'Provider'} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          {/* Render provider name and organization */}
          <div className="space-y-1">
            <CardTitle>{providerInfo?.organizationName}</CardTitle>
            <CardDescription>
              {providerInfo?.firstName} {providerInfo?.lastName}
            </CardDescription>
          </div>
        </div>
        {/* Render provider rating with RatingStars component */}
        {providerInfo?.averageRating && (
          <RatingStars
            rating={providerInfo.averageRating}
            reviewCount={providerInfo.reviewCount}
          />
        )}
      </CardHeader>
      <CardContent>
        {/* Render Tabs component with different sections of provider information */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="availability">Availability</TabsTrigger>
            <TabsTrigger value="service-areas">Service Areas</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            {/* Render provider bio, contact information, and services offered */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">About</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {providerInfo?.bio || 'No bio available.'}
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Contact Information</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {formattedAddress && (
                  <>
                    <MapPin className="mr-2 h-4 w-4 inline-block" />
                    {formattedAddress}
                    <br />
                  </>
                )}
                {formattedPhoneNumber && (
                  <>
                    <Phone className="mr-2 h-4 w-4 inline-block" />
                    {formattedPhoneNumber}
                    <br />
                  </>
                )}
                {providerInfo?.userId && (
                  <>
                    <Mail className="mr-2 h-4 w-4 inline-block" />
                    {providerInfo.userId}
                  </>
                )}
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Services Offered</h4>
              <div className="flex flex-wrap gap-2">
                {providerInfo?.serviceTypes?.map((serviceType) => (
                  <Badge key={serviceType}>{ServiceTypeLabels[serviceType]}</Badge>
                ))}
              </div>
            </div>
          </TabsContent>
          <TabsContent value="reviews">
            {/* Render ReviewList component with provider ID */}
            <ReviewList providerId={providerId || (params?.providerId as string)} />
          </TabsContent>
          <TabsContent value="availability">
            {/* Render AvailabilityCalendar component with provider ID */}
            <AvailabilityCalendar providerId={providerId || (params?.providerId as string)} initialView="calendar" />
          </TabsContent>
          <TabsContent value="service-areas">
            {/* Render ServiceAreaMap component with provider ID and service areas */}
            <ServiceAreaMap providerId={providerId || (params?.providerId as string)} serviceAreas={serviceAreas} />
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        {/* If showCompatibility and match data is available, render CompatibilityScore component */}
        {showCompatibility && isProviderMatch && matchData && (
          <CompatibilityScore score={matchData.compatibilityScore / 100} />
        )}
        <div className="space-x-2">
          {/* Implement Dialog for review submission with ReviewForm component */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Submit Review</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Submit a Review</DialogTitle>
              </DialogHeader>
              <ReviewForm
                providerId={providerId || (params?.providerId as string)}
                onSuccess={() => setReviewDialogOpen(false)}
                onCancel={() => setReviewDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
          {/* Action button for scheduling services */}
          <Button>Schedule</Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ProviderProfile;