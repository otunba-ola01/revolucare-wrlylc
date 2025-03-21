/**
 * Constants for metrics used throughout the Revolucare platform.
 * These metrics are used for analytics, reporting, and monitoring purposes.
 */

/**
 * Categories of metrics used in the system
 */
export const METRIC_CATEGORIES = [
  'user',
  'care_plan',
  'provider',
  'service',
  'system',
  'business'
] as const;

/**
 * Metrics related to user activity and engagement
 */
export const USER_METRICS = [
  'active_users',        // Number of active users in a given period
  'new_registrations',   // Number of new user registrations
  'session_duration',    // Average session duration in minutes
  'retention_rate',      // Percentage of users who return after initial use
  'conversion_rate',     // Percentage of users who complete key workflows
  'profile_completion'   // Average percentage of user profile completion
] as const;

/**
 * Metrics related to care plan creation and effectiveness
 */
export const CARE_PLAN_METRICS = [
  'plans_created',             // Number of care plans created
  'completion_rate',           // Percentage of care plans completed
  'goal_achievement',          // Percentage of care plan goals achieved
  'intervention_effectiveness', // Effectiveness rating of interventions
  'confidence_score_avg',      // Average confidence score of AI-generated plans
  'time_to_create'             // Average time to create a care plan
] as const;

/**
 * Metrics related to provider performance and availability
 */
export const PROVIDER_METRICS = [
  'provider_count',      // Total number of active providers
  'availability_rate',   // Percentage of time providers are available
  'booking_rate',        // Percentage of available slots that are booked
  'response_time',       // Average time for providers to respond to requests
  'rating_avg',          // Average provider rating
  'match_success_rate'   // Percentage of successful client-provider matches
] as const;

/**
 * Metrics related to service delivery and utilization
 */
export const SERVICE_METRICS = [
  'services_delivered',  // Total number of services delivered
  'service_utilization', // Utilization rate of available services
  'service_satisfaction', // Client satisfaction with services
  'service_completion',  // Percentage of services completed as scheduled
  'cost_per_service',    // Average cost per service delivered
  'time_to_service'      // Average time from request to service delivery
] as const;

/**
 * Metrics related to system performance and reliability
 */
export const SYSTEM_METRICS = [
  'api_response_time',     // Average API response time in milliseconds
  'error_rate',            // Percentage of requests resulting in errors
  'uptime',                // System uptime percentage
  'database_performance',  // Database query performance metrics
  'resource_utilization',  // Server resource utilization (CPU, memory, etc.)
  'request_count'          // Total number of API requests
] as const;

/**
 * Metrics related to business outcomes and financial performance
 */
export const BUSINESS_METRICS = [
  'revenue',               // Total revenue generated
  'cost_savings',          // Cost savings achieved through platform use
  'client_satisfaction',   // Overall client satisfaction rating
  'provider_satisfaction', // Overall provider satisfaction rating
  'outcome_improvement',   // Improvement in client outcomes
  'roi'                    // Return on investment metrics
] as const;

/**
 * Time periods for metric aggregation and reporting
 */
export const TIME_PERIODS = [
  'daily',
  'weekly',
  'monthly',
  'quarterly',
  'yearly'
] as const;

/**
 * Threshold levels for metric alerting and monitoring
 */
export const METRIC_THRESHOLDS = [
  'warning',  // Warning threshold level
  'critical'  // Critical threshold level
] as const;

/**
 * Types of widgets available for analytics dashboards
 */
export const DASHBOARD_WIDGET_TYPES = [
  'line_chart',  // Line chart for time series data
  'bar_chart',   // Bar chart for comparison data
  'pie_chart',   // Pie chart for distribution data
  'stat_card',   // Stat card for key metrics
  'table',       // Table for detailed data
  'gauge',       // Gauge for progress metrics
  'heatmap'      // Heatmap for density visualization
] as const;

/**
 * Available formats for exporting reports
 */
export const REPORT_FORMATS = [
  'pdf',    // PDF document format
  'csv',    // CSV spreadsheet format
  'excel',  // Excel spreadsheet format
  'json'    // JSON data format
] as const;

/**
 * Default time-to-live for cached metrics in seconds (1 hour)
 */
export const DEFAULT_METRIC_TTL = 3600;

/**
 * Default time-to-live for cached dashboards in seconds (30 minutes)
 */
export const DEFAULT_DASHBOARD_TTL = 1800;