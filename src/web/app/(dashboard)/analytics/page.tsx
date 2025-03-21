import React, { useState, useEffect } from 'react'; // React ^18.2.0
import { Metadata } from 'next'; // next: ^13.4.0
import { BarChart, Activity, Users, FileText } from 'lucide-react'; // lucide-react: ^0.284.0
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '../../../components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../../components/ui/tabs';
import MetricsDisplay from '../../../components/analytics/metrics-display';
import Chart from '../../../components/analytics/chart';
import DateRangePicker, { DateRange } from '../../../components/analytics/date-range-picker';
import ExportButton from '../../../components/analytics/export-button';
import LoadingSpinner from '../../../components/common/loading-spinner';
import ErrorMessage from '../../../components/common/error-message';
import { useDashboard } from '../../../hooks/use-analytics';
import { useAuth } from '../../../hooks/use-auth';
import { Roles } from '../../../config/roles';
import { getDateRangeForPeriod } from '../../../lib/utils/date';

/**
 * Generates metadata for the analytics page
 * @returns Page metadata including title and description for the analytics page
 */
export const generateMetadata = (): Metadata => {
  return {
    title: 'Analytics Dashboard - Revolucare',
    description: 'Comprehensive analytics dashboard for Revolucare platform',
  };
};

/**
 * Main component for the analytics dashboard page
 * @returns Rendered analytics dashboard page
 */
const AnalyticsPage: React.FC = () => {
  // Get user information from useAuth hook
  const { user } = useAuth();

  // Initialize state for date range with last 30 days as default
  const [dateRange, setDateRange] = useState<DateRange>(getDateRangeForPeriod(new Date(), 'month'));

  // Initialize state for active tab with 'overview' as default
  const [activeTab, setActiveTab] = useState('overview');

  // Use useDashboard hook to fetch dashboard data based on user role and date range
  const { data: dashboardData, isLoading, error } = useDashboard({
    userId: user?.id,
    role: user?.role,
    startDate: dateRange.from,
    endDate: dateRange.to,
  });

  // Handle loading state with LoadingSpinner component
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner text="Loading analytics data..." />
      </div>
    );
  }

  // Handle error state with ErrorMessage component
  if (error) {
    return <ErrorMessage error="Failed to load analytics dashboard" />;
  }

  // Implement date range change handler
  const handleDateRangeChange = (newDateRange: DateRange) => {
    setDateRange(newDateRange);
  };

  // Implement tab change handler
  const handleTabChange = (tabValue: string) => {
    setActiveTab(tabValue);
  };

  return (
    <div className="container mx-auto py-10">
      {/* Page header with title and description */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Insights on service utilization, outcomes, and performance metrics.
          </p>
        </div>

        {/* Date range picker and export button in the header */}
        <div className="flex items-center space-x-4">
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
          />
          <ExportButton dataType="analytics" filters={{
            startDate: dateRange.from,
            endDate: dateRange.to,
            role: user?.role
          }} />
        </div>
      </div>

      {/* Tabs for different analytics views (Overview, Users, Care Plans, Services) */}
      <Tabs defaultValue="overview" className="w-full" onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="care-plans">Care Plans</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
        </TabsList>

        {/* Tab content based on active tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Overview tab content */}
          <MetricsDisplay
            metrics={dashboardData?.metrics || []}
            title="System Overview"
            description="Key metrics for the Revolucare platform"
          />
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          {/* Users tab content */}
          <MetricsDisplay
            metrics={dashboardData?.metrics || []}
            title="User Engagement"
            description="Metrics related to user activity and engagement"
          />
        </TabsContent>

        <TabsContent value="care-plans" className="space-y-4">
          {/* Care Plans tab content */}
          <MetricsDisplay
            metrics={dashboardData?.metrics || []}
            title="Care Plan Performance"
            description="Metrics related to care plan creation and outcomes"
          />
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          {/* Services tab content */}
          <MetricsDisplay
            metrics={dashboardData?.metrics || []}
            title="Service Utilization"
            description="Metrics related to service delivery and utilization"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsPage;