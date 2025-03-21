import React, { useState, useEffect, useMemo } from 'react'; // React, { useState, useEffect, useMemo } v18.2.0
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'; // UI components for card-based layout ^1.0.0
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'; // UI components for tabbed interface ^1.0.0
import { PageContainer } from '../../../../components/layout/page-container'; // Container component for consistent page layout
import Breadcrumbs from '../../../../components/layout/breadcrumbs'; // Navigation breadcrumbs for page context
import Chart from '../../../../components/analytics/chart'; // Chart component for visualizing analytics data
import DataTable from '../../../../components/analytics/data-table'; // Table component for displaying detailed analytics data
import MetricsDisplay from '../../../../components/analytics/metrics-display'; // Component for displaying analytics metrics
import {
  useMetricsByCategory,
  useFilteredMetrics,
} from '../../../../hooks/use-analytics'; // Hooks for fetching and filtering analytics data
import { useAuth } from '../../../../hooks/use-auth'; // Hook for accessing authentication state and user role
import { DateRangePicker } from '@/components/analytics/date-range-picker'; // Component for selecting date ranges for analytics

/**
 * Generates data table columns configuration for user metrics
 * @returns Array of column configurations for the DataTable component
 */
const getUserMetricsColumns = () => {
  // Define columns for user metrics table
  const columns = [
    {
      id: 'name',
      header: 'Metric',
      accessor: 'name',
      sortable: true,
      filterable: true,
    },
    {
      id: 'value',
      header: 'Value',
      accessor: 'value',
      type: 'number',
      sortable: true,
    },
    {
      id: 'trend',
      header: 'Trend',
      accessor: 'trend',
      sortable: true,
    },
    {
      id: 'changePercentage',
      header: 'Change (%)',
      accessor: 'changePercentage',
      type: 'number',
      sortable: true,
    },
  ];
  // Return the column configuration array
  return columns;
};

/**
 * Main component for the user analytics page
 * @returns Rendered user analytics page
 */
const UserAnalyticsPage: React.FC = () => {
  // Get authentication state and user role using useAuth hook
  const { user } = useAuth();

  // Initialize state for date range filter
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | null>(null);

  // Initialize state for selected tab
  const [selectedTab, setSelectedTab] = useState('overview');

  // Fetch user metrics using useMetricsByCategory hook with 'user' category
  const { data: userMetricsData, isLoading, error } = useMetricsByCategory('user', {
    startDate: dateRange?.from,
    endDate: dateRange?.to,
  });

  // Fetch filtered metrics using useFilteredMetrics hook with appropriate filters
  const { data: filteredMetricsData, isLoading: isFilteredMetricsLoading, error: filteredMetricsError, updateFilters } = useFilteredMetrics({
    category: 'user',
    startDate: dateRange?.from,
    endDate: dateRange?.to,
  });

  // Use useMemo to prepare data for charts and tables
  const userMetrics = useMemo(() => {
    return filteredMetricsData?.metrics || [];
  }, [filteredMetricsData]);

  // Handle date range change to update metrics
  const handleDateRangeChange = (range: { from: Date; to: Date }) => {
    setDateRange(range);
    updateFilters({ startDate: range.from, endDate: range.to });
  };

  // Use useMemo to generate data table columns configuration for user metrics
  const columns = useMemo(() => getUserMetricsColumns(), []);

  // Render page container with breadcrumbs for navigation context
  return (
    <PageContainer>
      <Breadcrumbs />

      {/* Render page header with title and date range picker */}
      <div className="md:flex items-center justify-between space-y-2 md:space-y-0">
        <div>
          <h1 className="text-2xl font-semibold">User Analytics</h1>
          <p className="text-gray-500">Insights on user engagement and activity.</p>
        </div>
        <DateRangePicker dateRange={dateRange} onDateRangeChange={handleDateRangeChange} />
      </div>

      {/* Render tabs for different metric views (Overview, Engagement, Activity, Outcomes) */}
      <Tabs defaultValue="overview" className="mt-4" value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="outcomes">Outcomes</TabsTrigger>
        </TabsList>

        {/* Render MetricsDisplay component for each tab with appropriate metrics */}
        <TabsContent value="overview" className="pt-4">
          <MetricsDisplay
            metrics={userMetrics.filter(metric => ['active_users', 'session_duration', 'new_registrations'].includes(metric.id))}
            loading={isLoading}
            error={error}
            title="Overview Metrics"
            description="Key metrics related to user activity and engagement."
          />
        </TabsContent>

        <TabsContent value="engagement" className="pt-4">
          <MetricsDisplay
            metrics={userMetrics.filter(metric => ['session_duration', 'page_views', 'feature_usage'].includes(metric.id))}
            loading={isLoading}
            error={error}
            title="Engagement Metrics"
            description="Metrics related to user engagement with the platform."
          />
        </TabsContent>

        <TabsContent value="activity" className="pt-4">
          <MetricsDisplay
            metrics={userMetrics.filter(metric => ['logins', 'signups', 'profile_updates'].includes(metric.id))}
            loading={isLoading}
            error={error}
            title="Activity Metrics"
            description="Metrics related to user activity on the platform."
          />
        </TabsContent>

        <TabsContent value="outcomes" className="pt-4">
          <MetricsDisplay
            metrics={userMetrics.filter(metric => ['care_plan_completion', 'service_requests', 'provider_ratings'].includes(metric.id))}
            loading={isLoading}
            error={error}
            title="Outcome Metrics"
            description="Metrics related to user outcomes and satisfaction."
          />
        </TabsContent>
      </Tabs>

      {/* Render DataTable component for detailed metrics view */}
      <div className="mt-6">
        <DataTable
          title="Detailed User Metrics"
          description="A detailed view of all user-related metrics."
          columns={columns}
          data={userMetrics}
          loading={isFilteredMetricsLoading}
          error={filteredMetricsError?.message || null}
        />
      </div>
    </PageContainer>
  );
};

export default UserAnalyticsPage;