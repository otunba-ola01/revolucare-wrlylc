/**
 * analytics.ts
 *
 * Defines TypeScript interfaces and types for analytics-related data structures
 * used throughout the Revolucare web application. This file centralizes analytics
 * type definitions to ensure consistency across components, hooks, and API calls
 * that handle analytics data.
 */

import { Roles } from '../config/roles';

/**
 * Type alias for metric types (e.g., 'active_users', 'care_plan_completion', etc.)
 */
export type MetricType = string;

/**
 * Type alias for metric categories (e.g., 'user', 'care_plan', 'provider', etc.)
 */
export type MetricCategory = string;

/**
 * Type alias for time periods (e.g., 'daily', 'weekly', 'monthly', etc.)
 */
export type TimePeriod = string;

/**
 * Type alias for widget types (e.g., 'line_chart', 'bar_chart', 'stat_card', etc.)
 */
export type WidgetType = string;

/**
 * Type alias for report formats (e.g., 'pdf', 'csv', 'excel', etc.)
 */
export type ReportFormat = string;

/**
 * Type alias for metric trend directions
 */
export type MetricTrend = 'up' | 'down' | 'stable';

/**
 * Interface for time-series data points used in charts and graphs
 */
export interface DataPoint {
  date: string;
  value: number;
  label?: string;
}

/**
 * Interface for metric threshold values used for alerts and visual indicators
 */
export interface MetricThresholds {
  warning: number;
  critical: number;
}

/**
 * Interface for metric data structure used in analytics displays
 */
export interface Metric {
  id: string;
  name: string;
  description: string;
  category: MetricCategory;
  value: number;
  unit: string;
  trend: MetricTrend;
  changePercentage: number;
  period: TimePeriod;
  thresholds?: MetricThresholds;
  historicalData?: DataPoint[];
  lastUpdated: string;
}

/**
 * Interface for dashboard widget configuration
 */
export interface DashboardWidget {
  id: string;
  title: string;
  type: WidgetType;
  metrics: string[]; // Array of metric IDs
  config: Record<string, any>;
  position: { x: number; y: number; w: number; h: number };
}

/**
 * Interface for dashboard layout configuration
 */
export interface DashboardLayout {
  columns: number;
  rowHeight: number;
  padding: number;
  config: Record<string, any>;
}

/**
 * Interface for dashboard data structure used in analytics displays
 */
export interface Dashboard {
  id: string;
  userId: string;
  role: Roles;
  title: string;
  description: string;
  widgets: DashboardWidget[];
  layout: DashboardLayout;
  isDefault: boolean;
  lastViewed: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Parameters for requesting analytics metrics from the API
 */
export interface MetricsRequestParams {
  category?: MetricCategory;
  types?: MetricType[];
  period: TimePeriod;
  startDate?: Date | string;
  endDate?: Date | string;
  filters?: Record<string, any>;
}

/**
 * Response structure for metrics API requests
 */
export interface MetricsResponse {
  metrics: Metric[];
  period: TimePeriod;
  startDate: string;
  endDate: string;
}

/**
 * Parameters for requesting an analytics dashboard from the API
 */
export interface DashboardRequestParams {
  userId: string;
  role: Roles;
  period?: TimePeriod;
  startDate?: Date | string;
  endDate?: Date | string;
}

/**
 * Response structure for dashboard API requests
 */
export interface DashboardResponse {
  dashboard: Dashboard;
  metrics: Metric[];
  period: TimePeriod;
  startDate: string;
  endDate: string;
}

/**
 * Parameters for requesting a custom analytics report from the API
 */
export interface ReportRequestParams {
  name: string;
  description: string;
  categories?: MetricCategory[];
  metrics: MetricType[];
  period: TimePeriod;
  startDate?: Date | string;
  endDate?: Date | string;
  format: ReportFormat;
  filters?: Record<string, any>;
}

/**
 * Response structure for report generation API requests
 */
export interface ReportResponse {
  id: string;
  name: string;
  format: ReportFormat;
  url: string;
  expiresAt: string;
  createdAt: string;
}

/**
 * Parameters for requesting data export from the API
 */
export interface ExportRequestParams {
  dataType: string;
  filters?: Record<string, any>;
  format: ReportFormat;
}

/**
 * Response structure for data export API requests
 */
export interface ExportResponse {
  exportUrl: string;
  expiresAt: string;
}

/**
 * Structure for tracking analytics events in the frontend
 */
export interface AnalyticsEventData {
  eventType: string;
  eventData: Record<string, any>;
}

/**
 * Props interface for the MetricsDisplay component
 */
export interface MetricsDisplayProps {
  metrics: Metric[];
  loading?: boolean;
  error?: boolean | string;
  title?: string;
  description?: string;
  className?: string;
  groupByCategory?: boolean;
  columns?: number;
  showCharts?: boolean;
  compact?: boolean;
  onMetricClick?: (metric: Metric) => void;
}

/**
 * Props interface for the Chart component used in analytics displays
 */
export interface ChartProps {
  data: DataPoint[];
  type: 'line' | 'bar' | 'area' | 'pie';
  height?: number;
  width?: number;
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  className?: string;
  thresholds?: MetricThresholds;
}