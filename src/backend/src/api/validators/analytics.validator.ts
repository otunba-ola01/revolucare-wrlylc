/**
 * Defines Zod validation schemas for analytics-related API requests in the Revolucare platform.
 * These schemas ensure that incoming requests contain valid data structure and types.
 */

import { z } from 'zod'; // v3.21.4
import { 
  METRIC_CATEGORIES, 
  TIME_PERIODS, 
  DASHBOARD_WIDGET_TYPES, 
  REPORT_FORMATS 
} from '../../constants/metrics';
import { Roles } from '../../constants/roles';

/**
 * Validation schema for metrics request parameters
 * Used to validate requests for fetching specific metrics or metric sets
 */
export const metricsRequestSchema = z.object({
  category: z.enum(METRIC_CATEGORIES as [string, ...string[]]).optional(),
  types: z.array(z.string()).optional(),
  period: z.enum(TIME_PERIODS as [string, ...string[]]).optional().default('daily'),
  startDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  endDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  filters: z.record(z.any()).optional()
});

/**
 * Validation schema for dashboard request parameters
 * Used to validate requests for role-specific analytics dashboards
 */
export const dashboardRequestSchema = z.object({
  userId: z.string().uuid().optional(),
  role: z.nativeEnum(Roles).optional(),
  period: z.enum(TIME_PERIODS as [string, ...string[]]).optional().default('daily'),
  startDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  endDate: z.string().optional().transform(val => val ? new Date(val) : undefined)
});

/**
 * Validation schema for report generation request parameters
 * Used to validate requests for generating custom analytics reports
 */
export const reportRequestSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  categories: z.array(z.enum(METRIC_CATEGORIES as [string, ...string[]])),
  metrics: z.array(z.string()).min(1),
  period: z.enum(TIME_PERIODS as [string, ...string[]]).default('monthly'),
  startDate: z.string().transform(val => new Date(val)),
  endDate: z.string().transform(val => new Date(val)),
  format: z.enum(REPORT_FORMATS as [string, ...string[]]).default('pdf'),
  filters: z.record(z.any()).optional()
});

/**
 * Validation schema for data export request parameters
 * Used to validate requests for exporting analytics data
 */
export const exportRequestSchema = z.object({
  dataType: z.string().min(1),
  filters: z.record(z.any()).optional(),
  format: z.enum(REPORT_FORMATS as [string, ...string[]]).default('csv')
});

/**
 * Validation schema for analytics event tracking parameters
 * Used to validate events being tracked for analytics purposes
 */
export const analyticsEventSchema = z.object({
  eventType: z.string().min(1).max(100),
  eventData: z.record(z.any()),
  timestamp: z.date().optional().default(() => new Date())
});