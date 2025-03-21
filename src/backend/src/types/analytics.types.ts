/**
 * analytics.types.ts
 * 
 * Defines TypeScript interfaces and types for analytics-related data structures used
 * throughout the Revolucare platform. This file centralizes analytics type definitions
 * to ensure consistency across all services and components that handle analytics data.
 */

import { Roles } from '../constants/roles';
import {
  METRIC_CATEGORIES,
  TIME_PERIODS,
  DASHBOARD_WIDGET_TYPES,
  REPORT_FORMATS
} from '../constants/metrics';

/**
 * Data transfer object for requesting analytics metrics
 */
export interface MetricsRequestDTO {
  /** The category of metrics to request */
  category: string;
  /** Specific metric types to include */
  types: string[];
  /** The time period for the metrics */
  period: string;
  /** Start date for the metrics data */
  startDate: Date;
  /** End date for the metrics data */
  endDate: Date;
  /** Additional filters to apply to the metrics */
  filters: Record<string, any>;
}

/**
 * Response structure for metrics requests
 */
export interface MetricsResponse {
  /** Array of metrics data */
  metrics: Metric[];
  /** The time period of the metrics */
  period: string;
  /** Start date of the metrics data */
  startDate: Date;
  /** End date of the metrics data */
  endDate: Date;
}

/**
 * Data transfer object for requesting an analytics dashboard
 */
export interface DashboardRequestDTO {
  /** The user ID for whom to generate the dashboard */
  userId: string;
  /** The role of the user */
  role: Roles;
  /** The time period for the dashboard data */
  period: string;
  /** Start date for the dashboard data */
  startDate: Date;
  /** End date for the dashboard data */
  endDate: Date;
}

/**
 * Response structure for dashboard requests
 */
export interface DashboardResponse {
  /** The dashboard configuration */
  dashboard: Dashboard;
  /** Array of metrics data for the dashboard */
  metrics: Metric[];
  /** The time period of the dashboard data */
  period: string;
  /** Start date of the dashboard data */
  startDate: Date;
  /** End date of the dashboard data */
  endDate: Date;
}

/**
 * Data transfer object for requesting a custom analytics report
 */
export interface ReportRequestDTO {
  /** Name of the report */
  name: string;
  /** Description of the report */
  description: string;
  /** Categories of metrics to include */
  categories: string[];
  /** Specific metrics to include */
  metrics: string[];
  /** The time period for the report */
  period: string;
  /** Start date for the report data */
  startDate: Date;
  /** End date for the report data */
  endDate: Date;
  /** Format of the report output */
  format: string;
  /** Additional filters to apply to the report */
  filters: Record<string, any>;
}

/**
 * Response structure for report generation requests
 */
export interface ReportResponse {
  /** Unique identifier for the report */
  id: string;
  /** Name of the report */
  name: string;
  /** Format of the report */
  format: string;
  /** URL to download the report */
  url: string;
  /** Expiration time of the report URL */
  expiresAt: Date;
  /** Creation time of the report */
  createdAt: Date;
}

/**
 * Data transfer object for requesting data export
 */
export interface ExportRequestDTO {
  /** Type of data to export */
  dataType: string;
  /** Filters to apply to the export data */
  filters: Record<string, any>;
  /** Format of the export output */
  format: string;
}

/**
 * Response structure for data export requests
 */
export interface ExportResponse {
  /** URL to download the exported data */
  exportUrl: string;
  /** Expiration time of the export URL */
  expiresAt: Date;
}

/**
 * Data transfer object for tracking analytics events
 */
export interface AnalyticsEventDTO {
  /** ID of the user who triggered the event */
  userId: string;
  /** Role of the user who triggered the event */
  userRole: Roles;
  /** Type of event */
  eventType: string;
  /** Additional data associated with the event */
  eventData: Record<string, any>;
  /** Timestamp when the event occurred */
  timestamp: Date;
}

/**
 * Interface for metric data structure
 */
export interface Metric {
  /** Unique identifier for the metric */
  id: string;
  /** Display name of the metric */
  name: string;
  /** Description of what the metric measures */
  description: string;
  /** Category the metric belongs to */
  category: string;
  /** Current value of the metric */
  value: number;
  /** Unit of measurement (e.g., count, percentage, time) */
  unit: string;
  /** Direction of change compared to previous period */
  trend: 'up' | 'down' | 'stable';
  /** Percentage change from previous period */
  changePercentage: number;
  /** Time period of the metric */
  period: string;
  /** Warning and critical thresholds for the metric */
  thresholds?: {
    warning?: number;
    critical?: number;
  };
  /** Historical data points for trend analysis */
  historicalData?: { date: Date; value: number }[];
  /** Last update time of the metric */
  lastUpdated: Date;
}

/**
 * Interface for dashboard data structure
 */
export interface Dashboard {
  /** Unique identifier for the dashboard */
  id: string;
  /** ID of the user who owns the dashboard */
  userId: string;
  /** Role associated with the dashboard */
  role: Roles;
  /** Title of the dashboard */
  title: string;
  /** Description of the dashboard */
  description: string;
  /** Widgets included in the dashboard */
  widgets: DashboardWidget[];
  /** Layout configuration for the dashboard */
  layout: DashboardLayout;
  /** Whether this is the default dashboard for the role */
  isDefault: boolean;
  /** Last time the dashboard was viewed */
  lastViewed: Date;
  /** Creation time of the dashboard */
  createdAt: Date;
  /** Last update time of the dashboard */
  updatedAt: Date;
}

/**
 * Interface for dashboard widget configuration
 */
export interface DashboardWidget {
  /** Unique identifier for the widget */
  id: string;
  /** Title of the widget */
  title: string;
  /** Type of widget (chart, table, etc.) */
  type: string;
  /** Metrics displayed in the widget */
  metrics: string[];
  /** Additional configuration for the widget */
  config: Record<string, any>;
  /** Position and size of the widget in the dashboard */
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
}

/**
 * Interface for dashboard layout configuration
 */
export interface DashboardLayout {
  /** Number of columns in the grid */
  columns: number;
  /** Height of each row in pixels */
  rowHeight: number;
  /** Padding between widgets in pixels */
  padding: number;
  /** Additional configuration for the layout */
  config: Record<string, any>;
}

/**
 * Type alias for metric types based on metric constants
 */
export type MetricType = typeof METRIC_CATEGORIES[number];

/**
 * Type alias for metric categories based on metric constants
 */
export type MetricCategory = typeof METRIC_CATEGORIES[number];

/**
 * Type alias for time periods based on metric constants
 */
export type TimePeriod = typeof TIME_PERIODS[number];

/**
 * Type alias for widget types based on metric constants
 */
export type WidgetType = typeof DASHBOARD_WIDGET_TYPES[number];

/**
 * Type alias for report formats based on metric constants
 */
export type ReportFormat = typeof REPORT_FORMATS[number];

/**
 * Type alias for metric trend directions
 */
export type MetricTrend = 'up' | 'down' | 'stable';

/**
 * Interface for time-series data points
 */
export interface DataPoint {
  /** Date of the data point */
  date: Date;
  /** Value of the data point */
  value: number;
  /** Optional label for the data point */
  label?: string;
}

/**
 * Interface for metric threshold values
 */
export interface MetricThresholds {
  /** Warning threshold value */
  warning?: number;
  /** Critical threshold value */
  critical?: number;
}