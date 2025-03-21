import React, { useState, useEffect, useMemo, useCallback } from 'react'; // react ^18.2.0
import { FileDown, FileText, BarChart } from 'lucide-react'; // lucide-react ^0.284.0
import { zodResolver } from '@hookform/resolvers/zod'; // @hookform/resolvers/zod ^3.1.0
import { z } from 'zod'; // zod ^3.22.2

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../ui/card';
import { Button } from '../ui/button';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormSection,
  FormActions,
} from '../ui/form';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { DateRangePicker } from './date-range-picker';
import { MetricsDisplay } from './metrics-display';
import LoadingSpinner from '../common/loading-spinner';
import ErrorMessage from '../common/error-message';
import { cn } from '../../lib/utils/color';
import { useForm } from '../../hooks/use-form';
import { useGenerateReport, useMetrics } from '../../hooks/use-analytics';
import { useToast } from '../../hooks/use-toast';
import {
  ReportRequestParams,
  MetricCategory,
  MetricType,
  ReportFormat,
  TimePeriod,
  DateRange,
} from '../../types/analytics';

/**
 * Interface for the report generator form values
 */
interface ReportFormValues {
  name: string;
  description: string;
  categories: MetricCategory[];
  metrics: MetricType[];
  period: TimePeriod;
  dateRange: DateRange;
  format: ReportFormat;
  filters: Record<string, any>;
}

/**
 * Props interface for the ReportGenerator component
 */
interface ReportGeneratorProps {
  className?: string;
  onReportGenerated?: (reportUrl: string) => void;
  initialValues?: Partial<ReportFormValues>;
  showPreview?: boolean;
}

/**
 * Zod schema for report generator form validation
 */
const reportFormSchema = z.object({
  name: z.string().min(3, { message: 'Report name must be at least 3 characters.' }),
  description: z.string().max(255).optional(),
  categories: z.array(z.string()).optional(),
  metrics: z.array(z.string()).min(1, { message: 'Select at least one metric.' }),
  period: z.string().min(1, { message: 'Select a time period.' }),
  dateRange: z.object({
    from: z.date().optional(),
    to: z.date().optional(),
  }).optional(),
  format: z.string().min(1, { message: 'Select a report format.' }),
  filters: z.record(z.any()).optional(),
});

/**
 * Returns a list of available metric categories for selection
 */
const getMetricCategoryOptions = () => {
  return [
    { label: 'User Activity', value: 'user_activity' },
    { label: 'Care Plan Metrics', value: 'care_plan_metrics' },
    { label: 'Provider Performance', value: 'provider_performance' },
    { label: 'Service Utilization', value: 'service_utilization' },
    { label: 'Client Outcomes', value: 'client_outcomes' },
    { label: 'System Health', value: 'system_health' },
  ];
};

/**
 * Returns a list of available metric types for the selected categories
 */
const getMetricTypeOptions = (selectedCategories: MetricCategory[]) => {
  const allMetrics = [
    { label: 'Active Users', value: 'active_users', category: 'user_activity' },
    { label: 'New Registrations', value: 'new_registrations', category: 'user_activity' },
    { label: 'Care Plans Created', value: 'care_plans_created', category: 'care_plan_metrics' },
    { label: 'Care Plans Approved', value: 'care_plans_approved', category: 'care_plan_metrics' },
    { label: 'Average Provider Rating', value: 'avg_provider_rating', category: 'provider_performance' },
    { label: 'Service Utilization Rate', value: 'service_utilization_rate', category: 'service_utilization' },
    { label: 'Client Satisfaction Score', value: 'client_satisfaction_score', category: 'client_outcomes' },
    { label: 'API Response Time', value: 'api_response_time', category: 'system_health' },
  ];

  return allMetrics.filter((metric) => selectedCategories.includes(metric.category));
};

/**
 * Returns a list of available time period options
 */
const getTimePeriodOptions = () => {
  return [
    { label: 'Daily', value: 'daily' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
    { label: 'Quarterly', value: 'quarterly' },
    { label: 'Yearly', value: 'yearly' },
    { label: 'Custom Range', value: 'custom' },
  ];
};

/**
 * Returns a list of available report format options
 */
const getReportFormatOptions = () => {
  return [
    { label: 'PDF', value: 'pdf' },
    { label: 'CSV', value: 'csv' },
    { label: 'Excel', value: 'excel' },
  ];
};

/**
 * Component for generating custom analytics reports
 */
const ReportGenerator: React.FC<ReportGeneratorProps> = ({
  className,
  onReportGenerated,
  initialValues,
  showPreview = true,
}) => {
  // Define form schema using zod for validation
  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: initialValues,
  });

  // Initialize report generation mutation using useGenerateReport hook
  const { mutate: generateReport, isLoading: isGeneratingReport } = useGenerateReport();

  // Initialize toast notification using useToast hook
  const { toast } = useToast();

  // Set up state for preview metrics using useState
  const [previewMetrics, setPreviewMetrics] = useState<MetricType[]>([]);

  // Define metric category options using getMetricCategoryOptions
  const metricCategoryOptions = useMemo(() => getMetricCategoryOptions(), []);

  // Define time period options using getTimePeriodOptions
  const timePeriodOptions = useMemo(() => getTimePeriodOptions(), []);

  // Define report format options using getReportFormatOptions
  const reportFormatOptions = useMemo(() => getReportFormatOptions(), []);

  // Implement dynamic metric type options based on selected categories
  const metricTypeOptions = useMemo(() => {
    const selectedCategories = form.watch('categories') || [];
    return getMetricTypeOptions(selectedCategories);
  }, [form.watch('categories')]);

  // Implement form submission handler that calls the generateReport mutation
  const onSubmit = (values: ReportFormValues) => {
    const reportParams: ReportRequestParams = {
      name: values.name,
      description: values.description,
      categories: values.categories,
      metrics: values.metrics,
      period: values.period,
      startDate: values.dateRange?.from?.toISOString(),
      endDate: values.dateRange?.to?.toISOString(),
      format: values.format,
      filters: values.filters,
    };

    generateReport(reportParams, {
      onSuccess: (data) => {
        toast({
          title: 'Report Generated',
          description: 'Your report has been generated successfully.',
          variant: 'success',
        });
        onReportGenerated?.(data.url);
      },
      onError: (error: any) => {
        toast({
          title: 'Error Generating Report',
          description: error.message || 'Failed to generate report. Please try again.',
          variant: 'error',
        });
      },
    });
  };

  // Implement preview functionality that fetches sample metrics for selected criteria
  const { data: metricsData, isLoading: isMetricsLoading, error: metricsError } = useMetrics({
    types: previewMetrics,
    period: 'daily',
  });

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle>Generate Custom Report</CardTitle>
        <CardDescription>
          Create a custom analytics report by selecting metrics, time period, and export format.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormSection title="Report Details">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Report Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter report name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter report description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FormSection>

            <FormSection title="Metrics Selection">
              <FormField
                control={form.control}
                name="categories"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Metric Categories</FormLabel>
                    <Select
                      multiple
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select categories" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {metricCategoryOptions.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="metrics"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Metrics</FormLabel>
                    <Select
                      multiple
                      onValueChange={(value) => {
                        field.onChange(value);
                        setPreviewMetrics(value);
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select metrics" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {metricTypeOptions.map((metric) => (
                          <SelectItem key={metric.value} value={metric.value}>
                            {metric.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FormSection>

            <FormSection title="Time Period">
              <FormField
                control={form.control}
                name="period"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time Period</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select time period" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {timePeriodOptions.map((period) => (
                          <SelectItem key={period.value} value={period.value}>
                            {period.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {form.watch('period') === 'custom' && (
                <FormField
                  control={form.control}
                  name="dateRange"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custom Date Range</FormLabel>
                      <FormControl>
                        <DateRangePicker
                          dateRange={field.value}
                          onDateRangeChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </FormSection>

            <FormSection title="Format">
              <FormField
                control={form.control}
                name="format"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Report Format</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select report format" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {reportFormatOptions.map((format) => (
                          <SelectItem key={format.value} value={format.value}>
                            {format.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FormSection>

            {showPreview && (
              <FormSection title="Report Preview">
                {isMetricsLoading && <LoadingSpinner text="Loading preview metrics..." />}
                {metricsError && <ErrorMessage error={metricsError} />}
                {metricsData && metricsData.metrics && (
                  <MetricsDisplay metrics={metricsData.metrics} columns={2} compact showCharts={false} />
                )}
              </FormSection>
            )}

            <FormActions>
              <Button type="submit" disabled={isGeneratingReport}>
                {isGeneratingReport ? (
                  <>
                    <LoadingSpinner size="sm" color="white" />
                    Generating Report...
                  </>
                ) : (
                  <>
                    <FileDown className="mr-2 h-4 w-4" />
                    Generate Report
                  </>
                )}
              </Button>
            </FormActions>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ReportGenerator;