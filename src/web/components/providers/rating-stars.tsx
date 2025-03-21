import React from "react";
import { Star, StarHalf } from "lucide-react"; // ^0.284.0
import { cn } from "../../lib/utils/color";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "../ui/tooltip";
import { Badge } from "../ui/badge";

/**
 * Props for the RatingStars component
 */
interface RatingStarsProps {
  rating: number;
  reviewCount?: number;
  showTooltip?: boolean;
  showCount?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  maxStars?: number;
}

/**
 * Calculates the number of full, half, and empty stars based on the rating
 */
function calculateStars(rating: number, maxStars: number) {
  // Ensure rating is within 0-5 range by clamping the value
  const normalizedRating = Math.max(0, Math.min(maxStars, rating));
  
  // Calculate the number of full stars
  const fullStars = Math.floor(normalizedRating);
  
  // Determine if there should be a half star
  const hasHalfStar = normalizedRating - fullStars >= 0.5;
  const halfStars = hasHalfStar ? 1 : 0;
  
  // Calculate empty stars
  const emptyStars = maxStars - fullStars - halfStars;
  
  return {
    full: fullStars,
    half: halfStars,
    empty: emptyStars
  };
}

/**
 * A component that displays provider ratings as a series of stars.
 * It visualizes the average rating score with filled and unfilled stars,
 * and optionally shows the review count. The component supports different
 * sizes and can display tooltips with additional information.
 */
export const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  reviewCount,
  showTooltip = false,
  showCount = true,
  size = 'md',
  className,
  maxStars = 5
}) => {
  // Calculate star counts using calculateStars function
  const { full, half, empty } = calculateStars(rating, maxStars);
  
  // Determine star size based on size prop
  const starSize = {
    sm: 16,
    md: 20,
    lg: 24
  }[size];
  
  // Create arrays for rendering stars
  const fullStars = Array(full).fill(null);
  const halfStars = Array(half).fill(null);
  const emptyStars = Array(empty).fill(null);
  
  // Define colors for stars (using Revolucare design system)
  const filledColor = 'text-amber-400'; // Gold color for filled stars
  const emptyColor = 'text-gray-300';   // Gray color for empty stars
  
  // Generate accessible text for screen readers
  const accessibleText = `Rating: ${rating.toFixed(1)} out of ${maxStars}${
    reviewCount !== undefined ? `, based on ${reviewCount} reviews` : ''
  }`;
  
  // Content for stars container
  const starsContent = (
    <div className={cn("flex items-center", className)} aria-hidden="true">
      {/* Full stars */}
      {fullStars.map((_, i) => (
        <Star 
          key={`full-${i}`} 
          className={filledColor} 
          size={starSize} 
          fill="currentColor" 
        />
      ))}
      
      {/* Half stars */}
      {halfStars.map((_, i) => (
        <StarHalf 
          key={`half-${i}`} 
          className={filledColor} 
          size={starSize} 
          fill="currentColor" 
        />
      ))}
      
      {/* Empty stars */}
      {emptyStars.map((_, i) => (
        <Star 
          key={`empty-${i}`} 
          className={emptyColor} 
          size={starSize} 
        />
      ))}
      
      {/* Review count badge */}
      {showCount && reviewCount !== undefined && (
        <Badge 
          variant="outline" 
          size="sm" 
          className="ml-2"
        >
          {reviewCount}
        </Badge>
      )}
    </div>
  );
  
  // Container for both the visual stars and the accessible text
  const container = (
    <div className="inline-flex relative">
      {/* Visually hidden text for screen readers */}
      <span className="sr-only">{accessibleText}</span>
      {starsContent}
    </div>
  );
  
  // If showing tooltip, wrap in tooltip provider
  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {container}
          </TooltipTrigger>
          <TooltipContent>
            {accessibleText}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  // Otherwise just return the container
  return container;
};

export default RatingStars;