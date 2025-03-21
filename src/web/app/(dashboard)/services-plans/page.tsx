import React, { useState, useEffect, useCallback } from 'react'; // react ^18.2.0
import { useRouter, useSearchParams } from 'next/navigation'; // next/navigation ^14.0.0
import { Plus, FileText, Filter, Trash2 } from 'lucide-react'; // lucide-react ^0.284.0

import {
  useServicesPlans,
  useDeleteServicesPlan,
} from '../../../hooks/use-services-plans';
import { ServicePlanCard } from '../../../components/services-plans/service-plan-card';
import { FilterBar } from '../../../components/common/filter-bar';
import Pagination from '../../../components/common/pagination';
import EmptyState from '../../../components/common/empty-state';
import { Button } from '../../../components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '../../../components/ui/card';
import { useToast } from '../../../hooks/use-toast';
import { useAuth } from '../../../hooks/use-auth';
import { ServicesPlanFilterParams } from '../../../types/service-plan';
import { PLAN_STATUSES, SERVICE_TYPES } from '../../../config/constants';

/**
 * Main component for the service plans listing page
 */
const ServicePlansPage: React.FC = () => {
  // Get authentication context using useAuth hook
  const auth = useAuth();

  // Get router for navigation using useRouter
  const router = useRouter();

  // Get search parameters from URL using useSearchParams
  const searchParams = useSearchParams();

  // Initialize filter state with default values and URL parameters
  const [filters, setFilters] = useState<ServicesPlanFilterParams>({
    page: Number(searchParams.get('page')) || 1,
    limit: Number(searchParams.get('limit')) || 10,
    sortBy: searchParams.get('sortBy') || 'createdAt',
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
    status: searchParams.get('status') || undefined,
    clientId: searchParams.get('clientId') || undefined,
    createdById: searchParams.get('createdById') || undefined,
    approvedById: searchParams.get('approvedById') || undefined,
    serviceType: searchParams.get('serviceType') || undefined,
    providerId: searchParams.get('providerId') || undefined,
    fromDate: searchParams.get('fromDate') || undefined,
    toDate: searchParams.get('toDate') || undefined,
    search: searchParams.get('search') || undefined,
  });

  // Set up pagination state with default values
  const [pagination, setPagination] = useState({
    page: Number(searchParams.get('page')) || 1,
    limit: Number(searchParams.get('limit')) || 10,
  });

  // Fetch service plans using useServicesPlans hook with filter parameters
  const { data, isLoading, isError, error, refetch } = useServicesPlans(filters);

  // Set up delete service plan mutation using useDeleteServicesPlan hook
  const { mutate: deleteServicePlan, isLoading: isDeleting } = useDeleteServicesPlan();

  // Get toast function for displaying notifications
  const { toast } = useToast();

  /**
   * Generates filter configuration for the FilterBar component
   */
  const getFilterConfig = useCallback(() => {
    return [
      {
        id: 'status',
        label: 'Status',
        type: 'select',
        options: Object.entries(PLAN_STATUSES).map(([key, value]) => ({
          value: value,
          label: key.replace(/_/g, ' '),
        })),
        placeholder: 'Select Status',
      },
      {
        id: 'serviceType',
        label: 'Service Type',
        type: 'select',
        options: Object.entries(SERVICE_TYPES).map(([key, value]) => ({
          value: value,
          label: key.replace(/_/g, ' '),
        })),
        placeholder: 'Select Service Type',
      },
      {
        id: 'dateRange',
        label: 'Date Range',
        type: 'date-range',
        placeholder: 'Select Date Range',
      },
    ];
  }, []);

  /**
   * Handles changes to filter parameters
   */
  const handleFilterChange = useCallback((newFilters: Partial<ServicesPlanFilterParams>) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      ...newFilters,
      page: 1, // Reset pagination to first page
    }));
    setPagination((prevPagination) => ({
      ...prevPagination,
      page: 1, // Reset pagination to first page
    }));
    const newParams = new URLSearchParams(searchParams.toString());
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, String(value));
      } else {
        newParams.delete(key);
      }
    });
    router.push(`/services-plans?${newParams.toString()}`);
    refetch(); // Trigger service plans refetch with new parameters
  }, [refetch, router, searchParams]);

  /**
   * Handles pagination page changes
   */
  const handlePageChange = useCallback((page: number) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      page: page,
    }));
    setPagination((prevPagination) => ({
      ...prevPagination,
      page: page,
    }));
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set('page', String(page));
    router.push(`/services-plans?${newParams.toString()}`);
    refetch(); // Trigger service plans refetch with new parameters
  }, [refetch, router, searchParams]);

  /**
   * Handles changes to the number of items per page
   */
  const handlePageSizeChange = useCallback((pageSize: number) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      limit: pageSize,
      page: 1, // Reset to first page
    }));
    setPagination((prevPagination) => ({
      ...prevPagination,
      limit: pageSize,
      page: 1, // Reset to first page
    }));
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set('limit', String(pageSize));
    newParams.set('page', '1'); // Reset to first page
    router.push(`/services-plans?${newParams.toString()}`);
    refetch(); // Trigger service plans refetch with new parameters
  }, [refetch, router, searchParams]);

  /**
   * Handles service plan actions (view, edit, delete)
   */
  const handleServicePlanActions = useCallback((action: string, id: string) => {
    if (action === 'view') {
      router.push(`/services-plans/${id}`);
    } else if (action === 'edit') {
      router.push(`/services-plans/${id}/edit`);
    } else if (action === 'delete') {
      deleteServicePlan(id, {
        onSuccess: () => {
          toast({
            title: 'Success',
            description: 'Service plan deleted successfully',
          });
        },
        onError: (error: any) => {
          toast({
            title: 'Error',
            description: `Failed to delete service plan: ${error.message}`,
            variant: 'error',
          });
        },
      });
    }
  }, [deleteServicePlan, router, toast]);

  // Define filter configuration for FilterBar component
  const filterConfig = useMemo(() => getFilterConfig(), [getFilterConfig]);

  // Render page header with title and create button
  return (
    <div>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Service Plans</CardTitle>
        {auth.hasRole('case_manager') && (
          <Button onClick={() => router.push('/services-plans/create')}>
            <Plus className="mr-2 h-4 w-4" />
            Create
          </Button>
        )}
      </CardHeader>

      <CardContent>
        {/* Render FilterBar component for filtering service plans */}
        <FilterBar
          initialFilters={filters}
          onFilterChange={handleFilterChange}
          filterConfig={filterConfig}
        />

        {/* Render service plans list with ServicePlanCard components */}
        {isLoading ? (
          <div>Loading service plans...</div>
        ) : isError ? (
          <div>Error: {error.message}</div>
        ) : data?.data?.length ? (
          <div>
            {data.data.map((plan) => (
              <ServicePlanCard
                key={plan.id}
                plan={plan}
                onView={() => handleServicePlanActions('view', plan.id)}
                onEdit={() => handleServicePlanActions('edit', plan.id)}
                onDelete={() => handleServicePlanActions('delete', plan.id)}
              />
            ))}
            {/* Render Pagination component for navigating through pages */}
            <Pagination
              pagination={{
                page: data.pagination.page,
                limit: data.pagination.limit,
                totalItems: data.pagination.totalItems,
                totalPages: data.pagination.totalPages,
                hasNextPage: data.pagination.hasNextPage,
                hasPreviousPage: data.pagination.hasPreviousPage,
              }}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              pageSizeOptions={[5, 10, 25, 50]}
            />
          </div>
        ) : (
          /* Render EmptyState component when no service plans are found */
          <EmptyState title="No Service Plans Found" description="Create a new service plan to get started." />
        )}
      </CardContent>
    </div>
  );
};

export default ServicePlansPage;