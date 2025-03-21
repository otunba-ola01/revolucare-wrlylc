# src/web/app/(dashboard)/care-plans/page.tsx
```tsx
import React, { useState, useEffect, useCallback } from 'react'; // React v18.2.0
import { Metadata } from 'next'; // Next.js v14.0.0
import { useRouter, useSearchParams } from 'next/navigation'; // Next.js v14.0.0
import { Plus, Filter, FileText } from 'lucide-react'; // lucide-react ^0.284.0

import { Breadcrumbs } from '../../../components/layout/breadcrumbs';
import { Button } from '../../../components/ui/button';
import CarePlanCard from '../../../components/care-plans/care-plan-card';
import { FilterBar, FilterConfig, FilterOption } from '../../../components/common/filter-bar';
import Pagination from '../../../components/common/pagination';
import EmptyState from '../../../components/common/empty-state';
import LoadingSpinner from '../../../components/common/loading-spinner';
import { useCarePlans } from '../../../hooks/use-care-plans';
import useAuth from '../../../hooks/use-auth';
import { PlanStatus } from '../../../backend/src/constants/plan-statuses';
import { Roles } from '../../../config/roles';
import { ROUTES } from '../../../config/constants';

/**
 * Metadata for the care plans page
 * @returns Page metadata object
 */
export const metadata: Metadata = {
  title: 'Care Plans | Revolucare',
  description: 'Manage and view care plans for clients',
};

/**
 * Helper function to get status filter options from PlanStatus enum
 * @returns Array of status options for filter dropdown
 */
const getStatusOptions = (): FilterOption[] => {
  return Object.values(PlanStatus).map(status => ({
    value: status,
    label: status.replace(/_/g, ' ') // Format status labels for display
  }));
};

/**
 * Helper function to get filter configuration based on user role
 * @param role 
 * @returns 
 */
const getFilterConfig = (role: string): FilterConfig[] => {
  const baseFilters: FilterConfig[] = [
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: getStatusOptions(),
      placeholder: 'Select status',
    },
    {
      id: 'dateRange',
      label: 'Date Range',
      type: 'date-range',
      placeholder: 'Select date range',
    },
  ];

  let roleSpecificFilters: FilterConfig[] = [];

  if (role === Roles.ADMINISTRATOR || role === Roles.CASE_MANAGER) {
    roleSpecificFilters.push({
      id: 'clientId',
      label: 'Client',
      type: 'text',
      placeholder: 'Search by client ID',
    });
  } else if (role === Roles.CLIENT) {
    // For CLIENT, filter by their own client ID (assuming it's available in the user object)
    // This might require fetching the client ID from the user profile
  } else if (role === Roles.PROVIDER) {
    // For PROVIDER, filter by assigned care plans (requires backend implementation)
  }

  return [...baseFilters, ...roleSpecificFilters];
};

/**
 * The main care plans page component that displays a list of care plans with filtering and pagination
 * @returns Rendered care plans page
 */
const CarePlansPage: React.FC = () => {
  // Get the router for navigation
  const router = useRouter();

  // Get search parameters from URL
  const searchParams = useSearchParams();

  // Get user information and permissions from useAuth hook
  const { user, hasPermission } = useAuth();

  // Set up state for filter parameters
  const [filterParams, setFilterParams] = useState<Record<string, string>>({});

  // Initialize filter parameters from URL search params
  useEffect(() => {
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    setFilterParams(params);
  }, [searchParams]);

  // Define filter configuration based on user role
  const filterConfig = React.useMemo(() => {
    return getFilterConfig(user?.role || '');
  }, [user?.role]);

  // Use the useCarePlans hook to fetch care plans with current filters
  const { data, isLoading, error, refetch } = useCarePlans({
    ...filterParams,
    page: filterParams.page ? parseInt(filterParams.page) : 1,
    limit: filterParams.limit ? parseInt(filterParams.limit) : 10,
  }, { enabled: !!user });

  // Handle filter changes by updating state and URL
  const handleFilterChange = useCallback((newFilters: Record<string, string>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(newFilters).forEach(([key, value]) => {
      newParams.set(key, value);
    });
    router.push(`${ROUTES.CARE_PLANS}?${newParams.toString()}`);
  }, [router, searchParams]);

  // Handle pagination changes by updating page parameter
  const handlePageChange = useCallback((page: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', page.toString());
    router.push(`${ROUTES.CARE_PLANS}?${newParams.toString()}`);
  }, [router, searchParams]);

  // Handle care plan deletion and refresh the list
  const handleCarePlanDeleted = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <div>
      {/* Render the page layout with breadcrumbs */}
      <Breadcrumbs />

      {/* Render page header with title and create button (if user has permission) */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Care Plans</h1>
        {hasPermission('create:care-plan') && (
          <Button onClick={() => router.push(`${ROUTES.CARE_PLANS}/new`)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Care Plan
          </Button>
        )}
      </div>

      {/* Render filter bar with configured filters */}
      <FilterBar
        initialFilters={filterParams}
        onFilterChange={handleFilterChange}
        filterConfig={filterConfig}
      />

      {/* Show loading spinner while data is loading */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <LoadingSpinner text="Loading care plans..." />
        </div>
      )}

      {/* Show empty state when no care plans are found */}
      {!isLoading && data?.data.length === 0 && (
        <EmptyState
          title="No Care Plans Found"
          description="There are no care plans matching the current criteria."
          icon={<FileText size={48} />}
        />
      )}

      {/* Render grid of care plan cards when data is available */}
      {data?.data && data.data.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 py-4">
          {data.data.map((carePlan) => (
            <CarePlanCard
              key={carePlan.id}
              carePlan={carePlan}
              onDelete={handleCarePlanDeleted}
            />
          ))}
        </div>
      )}

      {/* Render pagination controls at the bottom */}
      {data?.pagination && (
        <Pagination
          pagination={data.pagination}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
};

export default CarePlansPage;