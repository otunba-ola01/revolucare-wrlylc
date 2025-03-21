/**
 * API client module for analytics-related functionality in the Revolucare platform.
 * Provides functions to interact with the analytics API endpoints for fetching metrics,
 * dashboards, generating reports, exporting data, and tracking events.
 */

import { get, post, formatQueryParams } from './client';
import {
  MetricsRequestParams,
  MetricsResponse,
  DashboardRequestParams,
  DashboardResponse,
  ReportRequestParams,
  ReportResponse,
  ExportRequestParams,
  ExportResponse,
  AnalyticsEventData
} from '../../types/analytics';

/**
 * Fetches analytics metrics based on the provided parameters
 * 
 * @param params - Parameters for the metrics request
 * @returns Promise resolving to metrics data
 */
export async function getMetrics(params: MetricsRequestParams): Promise<MetricsResponse> {
  const endpoint = '/api/analytics/metrics';
  return get<MetricsResponse>(endpoint, params);
}

/**
 * Fetches a dashboard configuration and its associated metrics
 * 
 * @param params - Parameters for the dashboard request
 * @returns Promise resolving to dashboard data
 */
export async function getDashboard(params: DashboardRequestParams): Promise<DashboardResponse> {
  const endpoint = '/api/analytics/dashboard';
  return get<DashboardResponse>(endpoint, params);
}

/**
 * Generates a custom report based on the provided parameters
 * 
 * @param params - Parameters for the report generation
 * @returns Promise resolving to report generation result
 */
export async function generateReport(params: ReportRequestParams): Promise<ReportResponse> {
  const endpoint = '/api/analytics/reports';
  return post<ReportResponse>(endpoint, params);
}

/**
 * Exports data in the requested format
 * 
 * @param params - Parameters for the data export
 * @returns Promise resolving to export result
 */
export async function exportData(params: ExportRequestParams): Promise<ExportResponse> {
  const endpoint = '/api/analytics/export';
  return post<ExportResponse>(endpoint, params);
}

/**
 * Tracks an analytics event
 * 
 * @param eventData - Data describing the event to track
 * @returns Promise resolving when the event is tracked
 */
export async function trackEvent(eventData: AnalyticsEventData): Promise<void> {
  const endpoint = '/api/analytics/events';
  return post<void>(endpoint, eventData);
}