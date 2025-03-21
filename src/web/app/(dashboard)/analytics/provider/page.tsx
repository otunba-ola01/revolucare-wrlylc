import React, { useState, useEffect } from 'react'; // React ^18.2.0
import { Users, Star, Calendar, Activity, BarChart3, Percent } from 'lucide-react'; // lucide-react ^0.284.0
import { Metadata } from 'next'; // next ^13.4.0

import { useDashboard } from '../../../../hooks/use-analytics'; // src/web/hooks/use-analytics.ts
import useAuth from '../../../../hooks/use-auth'; // src/web/hooks/use-auth.ts
import { DateRange } from '../../../../components/ui/calendar'; // src/web/components/ui/calendar.tsx
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '../../../../components/ui/card'; // src/web/components/ui/card.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs'; // src/web/components/ui/tabs.tsx
import MetricsDisplay from '../../../../components/analytics/metrics-display'; // src/web/components/analytics/metrics-display.tsx
import Chart from '../../../../components/analytics/chart'; // src/web/components/analytics/chart.tsx
import DateRangePicker from '../../../../components/analytics/date-range-picker'; // src/web/components/analytics/date-range-picker.tsx
import ExportButton from '../../../../components/analytics/export-button'; // src/web/components/analytics/export-button.tsx
import LoadingSpinner from '../../../../components/common/loading-spinner'; // src/web/components/common/loading-spinner.tsx
import ErrorMessage from '../../../../components/common/error-message'; // src/web/components/common/error-message.tsx
import { Roles } from '../../../../config/roles'; // src/web/config/roles.ts
import { getDateRangeForPeriod } from '../../../../lib/utils/date'; // src/web/lib/utils/date.ts

/**
 * Generates metadata for the provider analytics page
 * @returns Page metadata including title and description
 */
export const generateMetadata = (): Metadata => {
  return {
    title: 'Provider Analytics',
    description: 'Track your performance metrics and service delivery statistics',
  };
};

/**
 * Main component for the provider analytics dashboard page
 * @returns Rendered provider analytics dashboard page
 */
const ProviderAnalyticsPage: React.FC = () => {
  // Get user information from useAuth hook
  const { user } = useAuth();

  // Initialize state for date range with last 30 days as default
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    return getDateRangeForPeriod(new Date(), 'last 30 days');
  });

  // Initialize state for active tab with 'overview' as default
  const [activeTab, setActiveTab] = useState('overview');

  // Use useDashboard hook to fetch dashboard data based on user role and date range
  const { data: dashboardData, isLoading, error, refetch } = useDashboard({
    role: Roles.PROVIDER,
    startDate: dateRange.from?.toISOString(),
    endDate: dateRange.to?.toISOString(),
  });

  // Handle loading state with LoadingSpinner component
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner text="Loading provider analytics..." />
      </div>
    );
  }

  // Handle error state with ErrorMessage component
  if (error) {
    return <ErrorMessage error="Failed to load provider analytics" />;
  }

  // Implement date range change handler
  const handleDateRangeChange = (newDateRange: DateRange) => {
    setDateRange(newDateRange);
    refetch(); // Refresh data when date range changes
  };

  // Implement tab change handler
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <div className="container mx-auto py-10">
      {/* Render page header with title and description */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Provider Analytics</h1>
          <p className="text-gray-500">
            Track your performance metrics and service delivery statistics.
          </p>
        </div>

        {/* Render date range picker and export button in the header */}
        <div className="flex items-center space-x-4">
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
          />
          <ExportButton dataType="provider_analytics" />
        </div>
      </div>

      {/* Render tabs for different provider analytics views (Overview, Performance, Clients, Services) */}
      <Tabs defaultValue="overview" className="w-full" onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* Render tab content based on active tab */}
        <TabsContent value="overview" className="mt-6">
          {/* For Overview tab, render key provider metrics and charts from dashboard data */}
          <MetricsDisplay
            metrics={dashboardData?.metrics || []}
            loading={isLoading}
            error={error}
            title="Key Metrics"
            description="Overview of your performance"
            groupByCategory={false}
            columns={3}
            showCharts={true}
          />
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          {/* For Performance tab, render detailed performance metrics and trends */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>Detailed view of your performance metrics and trends.</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Placeholder for detailed performance metrics and trends */}
              <p>Detailed performance metrics and trends will be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProviderAnalyticsPage;