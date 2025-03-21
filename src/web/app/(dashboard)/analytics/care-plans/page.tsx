# src/web/app/(dashboard)/analytics/care-plans/page.tsx
```tsx
import React, { useState, useEffect, useMemo } from 'react'; // react ^18.2.0
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '../../../../components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../../../components/ui/tabs';
import {
  PageContainer,
} from '../../../../components/layout/page-container';
import Breadcrumbs from '../../../../components/layout/breadcrumbs';
import Chart from '../../../../components/analytics/chart';
import DataTable from '../../../../components/analytics/data-table';
import MetricsDisplay from '../../../../components/analytics/metrics-display';
import DateRangePicker from '../../../../components/analytics/date-range-picker';
import ExportButton from '../../../../components/analytics/export-button';
import {
  useMetricsByCategory,
  useFilteredMetrics,
} from '../../../../hooks/use-analytics';
import { cn } from '../../../../lib/utils/color';

/**
 * Defines the columns configuration for the care plans data table
 * @returns Array of column definitions for the DataTable component
 */
const getCarePlanTableColumns = () => {
  // Define columns for care plan ID, title, client name, status
  // Define columns for confidence score, creation date, completion rate
  // Configure sorting and filtering options for each column
  // Set appropriate formatting for date and numeric values
  // Return the complete column configuration array
  return [
    {
      id: 'id',
      header: 'Care Plan ID',
      accessor: 'id',
      sortable: true,
      filterable: true,
    },
    {
      id: 'title',
      header: 'Title',
      accessor: 'title',
      sortable: true,
      filterable: true,
    },
    {
      id: 'client',
      header: 'Client Name',
      accessor: (row: any) => `${row.client.firstName} ${row.client.lastName}`,
      sortable: true,
      filterable: true,
    },
    {
      id: 'status',
      header: 'Status',
      accessor: 'status',
      sortable: true,
      filterable: true,
    },
    {
      id: 'confidenceScore',
      header: 'Confidence Score',
      accessor: 'confidenceScore',
      type: 'number',
      sortable: true,
    },
    {
      id: 'createdAt',
      header: 'Creation Date',
      accessor: 'createdAt',
      type: 'date',
      sortable: true,
    },
    {
      id: 'completionRate',
      header: 'Completion Rate',
      accessor: 'completionRate',
      type: 'number',
      sortable: true,
    },
  ];
};

/**
 * Formats a date range for display in the UI
 * @param startDate Date
 * @param endDate Date
 * @returns Formatted date range string
 */
const formatDateRange = (startDate: Date, endDate: Date) => {
  // Format start date in readable format
  // Format end date in readable format
  // Combine formatted dates with separator
  // Return the formatted date range string
  const start = startDate.toLocaleDateString();
  const end = endDate.toLocaleDateString();
  return `${start} - ${end}`;
};

/**
 * The main component for the Care Plans Analytics page
 * @returns Rendered Care Plans Analytics page
 */
const CarePlansAnalyticsPage: React.FC = () => {
  // Initialize state for date range with default values (last 30 days)
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  });

  // Initialize state for selected tab with default value ('overview')
  const [selectedTab, setSelectedTab] = useState('overview');

  // Use useMetricsByCategory hook to fetch care plan metrics
  const { data: overviewMetrics, isLoading: isOverviewLoading, error: overviewError } =
    useMetricsByCategory('care_plan', {
      startDate: dateRange.from,
      endDate: dateRange.to,
    });

  // Use useFilteredMetrics hook for detailed care plan data with filtering
  const {
    data: detailedMetrics,
    isLoading: isDetailedLoading,
    error: detailedError,
    updateFilters,
  } = useFilteredMetrics({
    category: 'care_plan',
    startDate: dateRange.from,
    endDate: dateRange.to,
    types: ['care_plan_completion', 'care_plan_generation'],
  });

  // Define handleDateRangeChange function to update date filters
  const handleDateRangeChange = (range: { from: Date; to: Date }) => {
    setDateRange(range);
    updateFilters({ startDate: range.from, endDate: range.to });
  };

  // Define handleTabChange function to track selected tab
  const handleTabChange = (tab: string) => {
    setSelectedTab(tab);
  };

  // Use useMemo to prepare chart data from metrics
  const chartData = useMemo(() => {
    return overviewMetrics?.metrics.map((metric) => ({
      date: metric.lastUpdated,
      value: metric.value,
    })) || [];
  }, [overviewMetrics]);

  // Use useMemo to prepare table data from metrics
  const tableData = useMemo(() => {
    return detailedMetrics?.metrics.map((metric) => ({
      id: metric.id,
      title: metric.name,
      client: { firstName: 'John', lastName: 'Doe' }, // Replace with actual client data
      status: 'Active', // Replace with actual status
      confidenceScore: 95, // Replace with actual confidence score
      createdAt: new Date().toISOString(), // Replace with actual creation date
      completionRate: 75, // Replace with actual completion rate
    })) || [];
  }, [detailedMetrics]);

  // Render page container with breadcrumbs for navigation context
  // Render page title and description
  // Render date range picker for filtering by date
  // Render tabs for organizing different analytics views (Overview, Trends, Details)
  // In Overview tab, render MetricsDisplay with key care plan metrics
  // In Overview tab, render charts for care plan creation trends and completion rates
  // In Trends tab, render time-series charts for care plan metrics over time
  // In Details tab, render DataTable with detailed care plan information
  // Include export functionality for analytics data
  // Handle loading states with appropriate loading indicators
  // Handle error states with error messages
  // Return the complete page component
  return (
    <PageContainer>
      <Breadcrumbs />
      <div className="md:flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Care Plans Analytics</h1>
          <p className="text-muted-foreground">
            Insights into care plan creation, completion rates, and effectiveness.
          </p>
        </div>
        <DateRangePicker
          dateRange={dateRange}
          onDateRangeChange={handleDateRangeChange}
        />
      </div>

      <Tabs defaultValue="overview" className="mt-4" onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <MetricsDisplay
            metrics={overviewMetrics?.metrics || []}
            loading={isOverviewLoading}
            error={overviewError?.message}
            title="Key Metrics"
            description="Overview of key performance indicators for care plans."
          />
          <Card>
            <CardHeader>
              <CardTitle>Care Plan Trends</CardTitle>
              <CardDescription>
                Trends in care plan creation and completion rates over time.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {chartData && chartData.length > 0 ? (
                <Chart
                  data={chartData}
                  type="line"
                  title="Care Plan Trends"
                  xAxisLabel="Date"
                  yAxisLabel="Value"
                />
              ) : (
                <div>No chart data available.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="trends" className="space-y-4">
          <div>Trends content</div>
        </TabsContent>
        <TabsContent value="details" className="space-y-4">
          <DataTable
            data={tableData || []}
            columns={getCarePlanTableColumns()}
            title="Detailed Care Plan Data"
            description="Comprehensive data on individual care plans."
            loading={isDetailedLoading}
            error={detailedError?.message}
            showSearch
            showFilters
            showExport
            exportOptions={{ filename: 'care-plans', dataType: 'care_plans' }}
          />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
};

export default CarePlansAnalyticsPage;