import React from 'react'; // react ^18.2.0
import { useState, useEffect } from 'react'; // react ^18.2.0
import { format } from 'date-fns'; // date-fns ^2.30.0
import { Calendar, Star, Filter } from 'lucide-react'; // lucide-react ^0.284.0

import { useProviderReviews } from '../../hooks/use-providers';
import { ProviderReview, ServiceType } from '../../types/provider';
import { SERVICE_TYPE_LABELS } from '../../config/constants';
import { RatingStars } from './rating-stars';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Pagination } from '../common/pagination';
import { EmptyState } from '../common/empty-state';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { cn } from '../../lib/utils/color';

/**
 * Props for the ReviewList component
 */
interface ReviewListProps {
  /** The ID of the provider to display reviews for */
  providerId: string;
  /** Additional CSS class names */
  className?: string;
  /** Whether to show the filter controls */
  showFilters?: boolean;
  /** Initial page number */
  initialPage?: number;
  /** Initial page limit */
  initialLimit?: number;
  /** Initial minimum rating filter */
  initialMinRating?: number;
  /** Initial service type filter */
  initialServiceType?: string;
}

/**
 * A component that displays a single review card
 */
interface ReviewCardProps {
  /** The review data to display */
  review: ProviderReview;
  /** Additional CSS class names */
  className?: string;
}

/**
 * A component that provides filtering controls for reviews
 */
interface ReviewFiltersProps {
  /** The current minimum rating filter */
  minRating: number;
  /** The current service type filter */
  serviceType: string | null;
  /** Callback function for when the minimum rating changes */
  onMinRatingChange: (rating: number) => void;
  /** Callback function for when the service type changes */
  onServiceTypeChange: (type: string | null) => void;
  /** Additional CSS class names */
  className?: string;
}

/**
 * A loading skeleton for reviews while data is being fetched
 */
interface ReviewSkeletonProps {
  /** The number of skeleton items to display */
  count?: number;
  /** Additional CSS class names */
  className?: string;
}

/**
 * A component that displays a single review card
 * @param review - The review data to display
 * @param className - Additional CSS class names
 * @returns Rendered review card component
 */
const ReviewCard: React.FC<ReviewCardProps> = ({ review, className }) => {
  // Destructure review properties
  const { rating, comment, clientName, serviceDate, serviceType, createdAt } = review;

  // Format dates
  const formattedServiceDate = format(new Date(serviceDate), 'MMM dd, yyyy');
  const formattedCreatedAt = format(new Date(createdAt), 'MMM dd, yyyy');

  return (
    <Card className={cn("w-full", className)} aria-label={`Review by ${clientName} on ${formattedCreatedAt}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex flex-col">
          <CardTitle className="text-sm font-medium">
            <RatingStars rating={rating} size="sm" showCount={false} />
          </CardTitle>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {clientName} - {formattedCreatedAt}
          </div>
        </div>
        <Badge variant="outline">{SERVICE_TYPE_LABELS[serviceType]}</Badge>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {comment}
        </p>
      </CardContent>
    </Card>
  );
};

/**
 * A component that provides filtering controls for reviews
 * @param minRating - The current minimum rating filter
 * @param serviceType - The current service type filter
 * @param onMinRatingChange - Callback function for when the minimum rating changes
 * @param onServiceTypeChange - Callback function for when the service type changes
 * @param className - Additional CSS class names
 * @returns Rendered review filters component
 */
const ReviewFilters: React.FC<ReviewFiltersProps> = ({
  minRating,
  serviceType,
  onMinRatingChange,
  onServiceTypeChange,
  className,
}) => {
  return (
    <div className={cn("flex items-center space-x-4", className)} aria-label="Review Filters">
      {/* Minimum Rating Filter */}
      <div>
        <label htmlFor="min-rating" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Minimum Rating:
        </label>
        <Select value={minRating.toString()} onValueChange={(value) => onMinRatingChange(Number(value))}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 Star</SelectItem>
            <SelectItem value="2">2 Stars</SelectItem>
            <SelectItem value="3">3 Stars</SelectItem>
            <SelectItem value="4">4 Stars</SelectItem>
            <SelectItem value="5">5 Stars</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Service Type Filter */}
      <div>
        <label htmlFor="service-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Service Type:
        </label>
        <Select value={serviceType || ""} onValueChange={onServiceTypeChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Services" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Services</SelectItem>
            {Object.entries(SERVICE_TYPE_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

/**
 * A loading skeleton for reviews while data is being fetched
 * @param count - The number of skeleton items to display
 * @param className - Additional CSS class names
 * @returns Rendered skeleton loader component
 */
const ReviewSkeleton: React.FC<ReviewSkeletonProps> = ({ count = 3, className }) => {
  const skeletonArray = Array(count).fill(null);

  return (
    <div className={cn("space-y-4", className)}>
      {skeletonArray.map((_, index) => (
        <Card key={index} className="animate-pulse">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </CardHeader>
          <CardContent>
            <div className="h-2 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
            <div className="h-2 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

/**
 * A component that displays a paginated list of reviews for a provider
 * @param providerId - The ID of the provider to display reviews for
 * @param className - Additional CSS class names
 * @param showFilters - Whether to show the filter controls
 * @param initialPage - Initial page number
 * @param initialLimit - Initial page limit
 * @param initialMinRating - Initial minimum rating filter
 * @param initialServiceType - Initial service type filter
 * @returns Rendered review list component
 */
const ReviewList: React.FC<ReviewListProps> = ({
  providerId,
  className,
  showFilters = true,
  initialPage = 1,
  initialLimit = 5,
  initialMinRating = 1,
  initialServiceType = '',
}) => {
  // State for filters
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [minRating, setMinRating] = useState(initialMinRating);
  const [serviceType, setServiceType] = useState<string | null>(initialServiceType || null);

  // Fetch reviews using the useProviderReviews hook
  const { reviews, total, isLoading, error } = useProviderReviews(providerId, {
    page,
    limit,
    minRating,
    serviceType,
  });

  // Handlers for page change and filter changes
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleMinRatingChange = (rating: number) => {
    setMinRating(rating);
    setPage(1); // Reset to first page when changing filters
  };

  const handleServiceTypeChange = (type: string | null) => {
    setServiceType(type);
    setPage(1); // Reset to first page when changing filters
  };

  return (
    <div className={cn("space-y-4", className)} aria-label="Provider Reviews">
      {/* Filter Controls */}
      {showFilters && (
        <ReviewFilters
          minRating={minRating}
          serviceType={serviceType}
          onMinRatingChange={handleMinRatingChange}
          onServiceTypeChange={handleServiceTypeChange}
        />
      )}

      {/* Review List */}
      {isLoading ? (
        <ReviewSkeleton count={3} />
      ) : error ? (
        <EmptyState
          title="Error Loading Reviews"
          description="There was an error retrieving the reviews. Please try again later."
          variant="error"
        />
      ) : reviews.length === 0 ? (
        <EmptyState
          title="No Reviews Yet"
          description="This provider does not have any reviews yet."
          icon={<Star size={48} />}
        />
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {!isLoading && !error && reviews.length > 0 && (
        <Pagination
          pagination={{
            page,
            limit,
            totalItems: total,
            totalPages: Math.ceil(total / limit),
            hasNextPage: page < Math.ceil(total / limit),
            hasPreviousPage: page > 1,
          }}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
};

export default ReviewList;