# src/web/app/(dashboard)/providers/reviews/page.tsx
```tsx
import React, { useState, useEffect, useCallback } from 'react'; // react ^18.2.0
import { useSearchParams, useRouter } from 'next/navigation'; // next/navigation ^14.0.0
import { Star, MessageSquare, Filter, Plus } from 'lucide-react'; // lucide-react ^0.284.0

import { PageContainer } from '../../../../components/layout/page-container';
import ReviewList from '../../../../components/providers/review-list';
import ReviewForm from '../../../../components/providers/review-form';
import { useAuth } from '../../../../hooks/use-auth';
import { FilterBar } from '../../../../components/common/filter-bar';
import { LoadingSpinner } from '../../../../components/common/loading-spinner';
import { EmptyState } from '../../../../components/common/empty-state';
import { Button } from '../../../../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs';
import { SERVICE_TYPE_LABELS } from '../../../../config/constants';

/**
 * Generates filter configuration for the FilterBar component
 * @returns Array of filter configurations for service type and rating filters
 */
const getFilterConfig = () => {
  // 1. Create an array of filter configurations
  const filterConfig = [
    // 2. Add service type filter with options from SERVICE_TYPE_LABELS
    {
      id: 'serviceType',
      label: 'Service Type',
      type: 'select',
      options: Object.entries(SERVICE_TYPE_LABELS).map(([key, label]) => ({
        value: key,
        label: label,
      })),
      placeholder: 'All Services',
    },
    // 3. Add minimum rating filter with options for 1-5 stars
    {
      id: 'minRating',
      label: 'Minimum Rating',
      type: 'select',
      options: [
        { value: 1, label: '1 Star' },
        { value: 2, label: '2 Stars' },
        { value: 3, label: '3 Stars' },
        { value: 4, label: '4 Stars' },
        { value: 5, label: '5 Stars' },
      ],
      placeholder: 'Any',
    },
  ];
  // 4. Return the filter configuration array
  return filterConfig;
};

/**
 * Page component for provider reviews management
 * @param object - { params, searchParams }
 * @returns Rendered provider reviews page
 */
const ProviderReviewsPage: React.FC<{ params: any; searchParams: { [key: string]: string | string[] | undefined } }> = ({ params, searchParams }) => {
  // 1. Extract providerId from searchParams or use a default value
  const providerId = (searchParams?.providerId as string) || 'default-provider-id';
  // 2. Get user authentication state and role using useAuth hook
  const { user, isAuthenticated, isLoading: authLoading, error: authError } = useAuth();
  // 3. Set up state for current tab (reviews or add-review)
  const [currentTab, setCurrentTab] = useState<'reviews' | 'add-review'>('reviews');
  // 4. Set up state for filter values (minRating, serviceType)
  const [minRating, setMinRating] = useState<number | undefined>(undefined);
  const [serviceType, setServiceType] = useState<string | undefined>(undefined);
  // 5. Set up state for pagination (page, limit)
  const [page, setPage] = useState(1);
  const limit = 10;
  // 6. Use useProviderReviews hook to fetch reviews with current filters
  // 7. Create a handleFilterChange function to update filters and reset pagination
  // 8. Create a handleTabChange function to switch between tabs
  const handleTabChange = (tab: 'reviews' | 'add-review') => {
    setCurrentTab(tab);
  };
  // 9. Create a handleReviewSubmitted function to refresh reviews and switch to reviews tab
  const handleReviewSubmitted = () => {
    setCurrentTab('reviews');
  };
  // 10. Create a handlePageChange function to update pagination

  // 11. Render PageContainer with appropriate title and description
  return (
    <PageContainer title="Provider Reviews" description="View and manage reviews for this provider.">
      {/* 12. Render Tabs component with Reviews and Add Review tabs */}
      <Tabs value={currentTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          {isAuthenticated && user?.role === 'client' && (
            <TabsTrigger value="add-review">Add Review</TabsTrigger>
          )}
        </TabsList>
        {/* 13. In Reviews tab, render FilterBar and ReviewList components */}
        <TabsContent value="reviews">
          <ReviewList providerId={providerId} />
        </TabsContent>
        {/* 14. In Add Review tab, render ReviewForm component */}
        <TabsContent value="add-review">
          {isAuthenticated && user?.role === 'client' ? (
            <ReviewForm providerId={providerId} onSuccess={handleReviewSubmitted} onCancel={() => setCurrentTab('reviews')} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Authentication Required</CardTitle>
                <CardDescription>You must be logged in as a client to submit a review.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => console.log('Redirect to login')}>Login</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
};

export default ProviderReviewsPage;