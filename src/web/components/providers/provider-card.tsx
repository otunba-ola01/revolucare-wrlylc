import React from "react";
import { useRouter } from "next/navigation"; // v13.4.1
import { MapPinIcon, CalendarIcon } from "lucide-react"; // v0.284.0
import { cn } from "../../lib/utils/color";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { RatingStars } from "./rating-stars";
import { CompatibilityScore } from "./compatibility-score";
import { Provider, ProviderMatch, MatchFactor } from "../../types/provider";

/**
 * Extracts initials from provider name for avatar fallback
 * @param firstName First name of the provider
 * @param lastName Last name of the provider
 * @returns Initials (1-2 characters)
 */
function getInitials(firstName: string, lastName: string): string {
  const firstInitial = firstName ? firstName.charAt(0) : "";
  const lastInitial = lastName ? lastName.charAt(0) : "";
  return (firstInitial + lastInitial).toUpperCase() || "P";
}

/**
 * Formats distance value with appropriate unit
 * @param distance Distance value to format
 * @returns Formatted distance string or null if no distance
 */
function formatDistance(distance: number | null | undefined): string | null {
  if (distance === null || distance === undefined || isNaN(distance)) {
    return null;
  }
  return `${distance.toFixed(1)} miles`;
}

/**
 * Formats availability information into a readable string
 * @param nextAvailable Next available date/time
 * @returns Formatted availability string
 */
function formatAvailability(nextAvailable: string | Date | null | undefined): string {
  if (!nextAvailable) {
    return "Not available";
  }

  const date = new Date(nextAvailable);
  const today = new Date();
  
  // Set hours, minutes, seconds and milliseconds to 0 for date comparison
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  // Create tomorrow date for comparison
  const tomorrowDate = new Date(todayDate);
  tomorrowDate.setDate(todayDate.getDate() + 1);
  
  // Compare dates without time
  const availableDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  if (availableDate.getTime() === todayDate.getTime()) {
    return "Today";
  } else if (availableDate.getTime() === tomorrowDate.getTime()) {
    return "Tomorrow";
  }
  
  // If within a week, show day of week
  const daysDiff = Math.floor((availableDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
  if (daysDiff < 7) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[availableDate.getDay()];
  }
  
  // Otherwise show date in format "May 17"
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[availableDate.getMonth()]} ${availableDate.getDate()}`;
}

/**
 * A component that displays provider information in a card format
 */
export const ProviderCard: React.FC<{
  provider: Provider | ProviderMatch;
  showCompatibility?: boolean;
  showDistance?: boolean;
  showAvailability?: boolean;
  onViewProfile?: (provider: Provider | ProviderMatch) => void;
  onSchedule?: (provider: Provider | ProviderMatch) => void;
  className?: string;
}> = ({
  provider,
  showCompatibility = false,
  showDistance = true,
  showAvailability = true,
  onViewProfile,
  onSchedule,
  className,
}) => {
  const router = useRouter();
  
  // Check if provider is a ProviderMatch (has compatibility score)
  const isMatch = 'compatibilityScore' in provider;
  
  // Extract provider and match data
  const providerData = provider as Provider;
  const matchData = isMatch ? (provider as ProviderMatch) : null;
  
  // Format distance if available
  const distance = showDistance && matchData?.distance 
    ? formatDistance(matchData.distance) 
    : null;
    
  // Format next availability if available
  const availability = showAvailability && matchData?.availableSlots?.length 
    ? formatAvailability(matchData.availableSlots[0].startTime) 
    : null;
  
  // Get initials for avatar fallback
  const initials = getInitials(providerData.firstName, providerData.lastName);
  
  // Default handlers if none provided
  const handleViewProfile = () => {
    if (onViewProfile) {
      onViewProfile(provider);
    } else {
      router.push(`/providers/${providerData.id}`);
    }
  };
  
  const handleSchedule = () => {
    if (onSchedule) {
      onSchedule(provider);
    } else {
      router.push(`/providers/${providerData.id}/schedule`);
    }
  };
  
  return (
    <Card className={cn("overflow-hidden", className)} data-testid="provider-card">
      <CardHeader className="space-y-2">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage 
              src={providerData.profileImageUrl || ""} 
              alt={`${providerData.firstName} ${providerData.lastName}`} 
            />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {`${providerData.firstName} ${providerData.lastName}`}
              </h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {providerData.organizationName}
            </p>
            <div className="flex items-center">
              <RatingStars 
                rating={providerData.averageRating} 
                reviewCount={providerData.reviewCount} 
                size="sm"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 pt-0">
        {/* Specializations */}
        <div className="flex flex-wrap gap-1.5">
          {providerData.specializations.slice(0, 3).map((specialization, index) => (
            <Badge key={index} variant="secondary" size="sm">
              {specialization}
            </Badge>
          ))}
          {providerData.specializations.length > 3 && (
            <Badge variant="outline" size="sm">
              +{providerData.specializations.length - 3} more
            </Badge>
          )}
        </div>
        
        {/* Location and Availability */}
        <div className="space-y-2 text-sm">
          {distance && (
            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
              <MapPinIcon className="h-4 w-4" aria-hidden="true" />
              <span>{distance}</span>
            </div>
          )}
          
          {availability && (
            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
              <CalendarIcon className="h-4 w-4" aria-hidden="true" />
              <span>Next available: {availability}</span>
            </div>
          )}
        </div>
        
        {/* Compatibility Score */}
        {showCompatibility && matchData?.compatibilityScore && matchData?.matchFactors && (
          <div className="mt-4">
            <CompatibilityScore 
              score={matchData.compatibilityScore} 
              factors={matchData.matchFactors} 
              size="sm"
            />
          </div>
        )}
      </CardContent>
      
      <CardFooter className="gap-2">
        <Button 
          variant="outline" 
          onClick={handleViewProfile}
          className="flex-1"
          aria-label={`View profile of ${providerData.firstName} ${providerData.lastName}`}
        >
          View Profile
        </Button>
        <Button 
          onClick={handleSchedule}
          className="flex-1"
          aria-label={`Schedule with ${providerData.firstName} ${providerData.lastName}`}
        >
          Schedule
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProviderCard;