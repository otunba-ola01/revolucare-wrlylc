/**
 * analytics.interface.ts
 * 
 * Defines interfaces for analytics-related services, repositories, and caching in the 
 * Revolucare platform. These interfaces establish contracts for components that handle 
 * metrics, dashboards, reports, and analytics events, ensuring consistent implementation 
 * across the system.
 */

import {
  MetricsRequestDTO,
  MetricsResponse,
  DashboardRequestDTO,
  DashboardResponse,
  ReportRequestDTO,
  ReportResponse,
  ExportRequestDTO,
  ExportResponse,
  AnalyticsEventDTO,
  Dashboard,
  Metric
} from '../types/analytics.types';

/**
 * Interface for the analytics service responsible for providing metrics,
 * dashboards, reports, and event tracking functionality.
 */
export interface IAnalyticsService {
  /**
   * Retrieves metrics based on provided criteria
   * @param request The metrics request parameters
   * @returns Promise resolving to metrics response
   */
  getMetrics(request: MetricsRequestDTO): Promise<MetricsResponse>;
  
  /**
   * Retrieves a dashboard for a specific user and role
   * @param request The dashboard request parameters
   * @returns Promise resolving to dashboard response
   */
  getDashboard(request: DashboardRequestDTO): Promise<DashboardResponse>;
  
  /**
   * Generates a custom report based on provided criteria
   * @param request The report generation request parameters
   * @returns Promise resolving to report response
   */
  generateReport(request: ReportRequestDTO): Promise<ReportResponse>;
  
  /**
   * Exports data in a specified format
   * @param request The data export request parameters
   * @returns Promise resolving to export response
   */
  exportData(request: ExportRequestDTO): Promise<ExportResponse>;
  
  /**
   * Tracks an analytics event in the system
   * @param event The analytics event data
   * @returns Promise resolving when event is tracked
   */
  trackEvent(event: AnalyticsEventDTO): Promise<void>;
}

/**
 * Interface for the analytics repository responsible for data access operations
 * related to analytics data.
 */
export interface IAnalyticsRepository {
  /**
   * Retrieves metrics from the data store
   * @param request The metrics request parameters
   * @returns Promise resolving to metrics response
   */
  getMetrics(request: MetricsRequestDTO): Promise<MetricsResponse>;
  
  /**
   * Retrieves a dashboard from the data store
   * @param userId The user ID
   * @param dashboardId The dashboard ID (optional, returns default if not provided)
   * @returns Promise resolving to dashboard or null if not found
   */
  getDashboard(userId: string, dashboardId?: string): Promise<Dashboard | null>;
  
  /**
   * Saves a dashboard to the data store
   * @param dashboard The dashboard to save
   * @returns Promise resolving to the saved dashboard
   */
  saveDashboard(dashboard: Dashboard): Promise<Dashboard>;
  
  /**
   * Saves a metric to the data store
   * @param metric The metric to save
   * @returns Promise resolving to the saved metric
   */
  saveMetric(metric: Metric): Promise<Metric>;
  
  /**
   * Saves an analytics event to the data store
   * @param event The event to save
   * @returns Promise resolving when event is saved
   */
  saveEvent(event: AnalyticsEventDTO): Promise<void>;
  
  /**
   * Retrieves historical data for a specific metric
   * @param metricId The metric ID
   * @param startDate The start date for the history
   * @param endDate The end date for the history
   * @returns Promise resolving to an array of metric history points
   */
  getMetricHistory(metricId: string, startDate: Date, endDate: Date): Promise<{ date: Date; value: number }[]>;
}

/**
 * Interface for the analytics cache responsible for caching metrics and dashboards
 * to improve performance.
 */
export interface IAnalyticsCache {
  /**
   * Retrieves metrics from the cache
   * @param request The metrics request parameters
   * @returns Promise resolving to cached metrics or null if not found
   */
  getMetrics(request: MetricsRequestDTO): Promise<MetricsResponse | null>;
  
  /**
   * Stores metrics in the cache
   * @param request The metrics request parameters (used as cache key)
   * @param response The metrics response to cache
   * @param ttl Time-to-live in seconds (optional)
   * @returns Promise resolving when metrics are cached
   */
  setMetrics(request: MetricsRequestDTO, response: MetricsResponse, ttl?: number): Promise<void>;
  
  /**
   * Retrieves a dashboard from the cache
   * @param userId The user ID
   * @param dashboardId The dashboard ID (optional)
   * @returns Promise resolving to cached dashboard or null if not found
   */
  getDashboard(userId: string, dashboardId?: string): Promise<Dashboard | null>;
  
  /**
   * Stores a dashboard in the cache
   * @param dashboard The dashboard to cache
   * @param ttl Time-to-live in seconds (optional)
   * @returns Promise resolving when dashboard is cached
   */
  setDashboard(dashboard: Dashboard, ttl?: number): Promise<void>;
  
  /**
   * Invalidates cached metrics based on a pattern
   * @param pattern Pattern to match for invalidation
   * @returns Promise resolving when cache invalidation is complete
   */
  invalidateMetrics(pattern: string): Promise<void>;
  
  /**
   * Invalidates cached dashboards for a specific user
   * @param userId The user ID whose dashboards should be invalidated
   * @returns Promise resolving when cache invalidation is complete
   */
  invalidateDashboard(userId: string): Promise<void>;
}