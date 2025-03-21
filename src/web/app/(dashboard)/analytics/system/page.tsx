# src/web/app/(dashboard)/analytics/system/page.tsx
```tsx
import React, { useState, useEffect } from 'react'; // react v18.2.0
import { subDays } from 'date-fns'; // date-fns v2.30.0
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '../../../../components/ui/card';
import {
  PageContainer
} from '../../../../components/layout/page-container';
import Chart from '../../../../components/analytics/chart';
import MetricsDisplay from '../../../../components/analytics/metrics-display';
import DataTable from '../../../../components/analytics/data-table';
import DateRangePicker from '../../../../components/analytics/date-range-picker';
import ExportButton from '../../../../components/analytics/export-button';
import { useMetrics } from '../../../../hooks/use-analytics';
import { DateRange } from '../../../../components/ui/calendar';

/**
 * Defines the columns configuration for the system metrics data table
 * @returns Array of column definitions for the DataTable component
 */
const getSystemMetricsColumns = () => {
  // Define columns for metric name, value, trend, and last updated
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
      filterable: false,
    },
    {
      id: 'trend',
      header: 'Trend',
      accessor: 'trend',
      sortable: true,
      filterable: true,
    },
    {
      id: 'lastUpdated',
      header: 'Last Updated',
      accessor: 'lastUpdated',
      type: 'date',
      sortable: true,
      filterable: false,
    },
  ];

  return columns;
};

/**
 * Main page component for the system analytics dashboard
 * @returns Rendered system analytics page
 */
const SystemAnalyticsPage: React.FC = () => {
  // Initialize state for date range with default of last 30 days
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  // Initialize state for selected metrics category
  const [selectedCategory, setSelectedCategory] = useState<string>('system');

  // Use useMetrics hook to fetch system metrics based on date range and category
  const { data: metricsData, isLoading, error } = useMetrics({
    category: selectedCategory,
    startDate: dateRange.from,
    endDate: dateRange.to,
    period: 'daily',
  });

  // Handle date range change by updating state
  const handleDateRangeChange = (newDateRange: DateRange) => {
    setDateRange(newDateRange);
  };

  // Handle metrics category selection
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
  };

  // Organize metrics into different sections (performance, resources, availability, errors)
  const performanceMetrics = metricsData?.metrics.filter(
    (metric) => metric.category === 'performance'
  ) || [];
  const resourceMetrics = metricsData?.metrics.filter(
    (metric) => metric.category === 'resources'
  ) || [];
  const availabilityMetrics = metricsData?.metrics.filter(
    (metric) => metric.category === 'availability'
  ) || [];
  const errorMetrics = metricsData?.metrics.filter(
    (metric) => metric.category === 'errors'
  ) || [];

  // Define columns for the data table
  const columns = React.useMemo(() => getSystemMetricsColumns(), []);

  return (
    <PageContainer>
      <Card>
        <CardHeader>
          <CardTitle>System Analytics Dashboard</CardTitle>
          <CardDescription>
            Comprehensive insights into system health, performance metrics, and
            operational statistics.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <DateRangePicker
              dateRange={dateRange}
              onDateRangeChange={handleDateRangeChange}
            />
            <ExportButton dataType="system_metrics" />
          </div>

          <section>
            <h2 className="text-xl font-semibold mb-4">System Health Overview</h2>
            <MetricsDisplay
              metrics={metricsData?.metrics || []}
              loading={isLoading}
              error={error?.message}
              columns={4}
              compact
            />
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Performance Metrics</h2>
            <Chart
              data={performanceMetrics.map((metric) => ({
                date: metric.lastUpdated,
                value: metric.value,
              }))}
              type="line"
              title="API Response Time"
              xAxisLabel="Time"
              yAxisLabel="Milliseconds"
            />
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Resource Utilization</h2>
            <Chart
              data={resourceMetrics.map((metric) => ({
                date: metric.lastUpdated,
                value: metric.value,
              }))}
              type="bar"
              title="CPU Utilization"
              xAxisLabel="Time"
              yAxisLabel="Percentage"
            />
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Availability Metrics</h2>
            <MetricsDisplay
              metrics={availabilityMetrics}
              loading={isLoading}
              error={error?.message}
              columns={2}
              compact
            />
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Error Metrics</h2>
            <MetricsDisplay
              metrics={errorMetrics}
              loading={isLoading}
              error={error?.message}
              columns={2}
              compact
            />
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Detailed Metrics Table</h2>
            <DataTable
              data={metricsData?.metrics || []}
              columns={columns}
              title="System Metrics"
              description="Detailed view of all system metrics"
              loading={isLoading}
              error={error?.message}
            />
          </section>
        </CardContent>
      </Card>
    </PageContainer>
  );
};

export default SystemAnalyticsPage;