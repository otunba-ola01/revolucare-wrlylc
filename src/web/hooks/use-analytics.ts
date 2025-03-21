import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { useCallback, useState, useEffect } from 'react';
import * as analyticsApi from '../lib/api/analytics';
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
} from '../types/analytics';
import { useAuth } from './use-auth';
import { useDebounce } from './use-debounce';

/**
 * Custom hook that provides analytics metrics based on specified parameters
 * 
 * @param params Parameters for the metrics request
 * @param options Optional React Query options
 * @returns Object containing metrics data, loading state, and error state
 */
export function useMetrics(
  params: MetricsRequestParams,
  options?: UseQueryOptions<MetricsResponse>
) {
  return useQuery<MetricsResponse, Error, MetricsResponse>(
    ['metrics', params],
    () => analyticsApi.getMetrics(params),
    {
      ...options,
      keepPreviousData: true,
    }
  );
}

/**
 * Custom hook that provides an analytics dashboard for the current user
 * 
 * @param params Optional override parameters for the dashboard request
 * @param options Optional React Query options
 * @returns Object containing dashboard data, loading state, and error state
 */
export function useDashboard(
  params?: Partial<DashboardRequestParams>,
  options?: UseQueryOptions<DashboardResponse>
) {
  const { user } = useAuth();
  
  const dashboardParams: DashboardRequestParams = {
    userId: user?.id || '',
    role: user?.role || 'client',
    ...params
  };
  
  return useQuery<DashboardResponse, Error, DashboardResponse>(
    ['dashboard', dashboardParams],
    () => analyticsApi.getDashboard(dashboardParams),
    {
      ...options,
      // Only fetch if we have a user
      enabled: !!user && (options?.enabled !== false),
    }
  );
}

/**
 * Custom hook that provides functionality to generate custom analytics reports
 * 
 * @returns Object containing mutation function, loading state, and error state
 */
export function useGenerateReport() {
  return useMutation<ReportResponse, Error, ReportRequestParams>(
    (params) => analyticsApi.generateReport(params)
  );
}

/**
 * Custom hook that provides functionality to export analytics data
 * 
 * @returns Object containing mutation function, loading state, and error state
 */
export function useExportData() {
  return useMutation<ExportResponse, Error, ExportRequestParams>(
    (params) => analyticsApi.exportData(params)
  );
}

/**
 * Custom hook that provides functionality to track analytics events
 * 
 * @returns Function to track an analytics event
 */
export function useTrackEvent() {
  const mutation = useMutation<void, Error, AnalyticsEventData>(
    (eventData) => analyticsApi.trackEvent(eventData)
  );
  
  const trackEvent = useCallback(
    (eventData: AnalyticsEventData) => {
      mutation.mutate(eventData);
    },
    [mutation]
  );
  
  return trackEvent;
}

/**
 * Custom hook that provides metrics grouped by category
 * 
 * @param category Category to filter metrics by
 * @param params Optional additional parameters for the metrics request
 * @returns Object containing metrics data for the specified category
 */
export function useMetricsByCategory(
  category: string,
  params?: Omit<MetricsRequestParams, 'category'>
) {
  const metricsParams: MetricsRequestParams = {
    category,
    ...params
  };
  
  return useMetrics(metricsParams);
}

/**
 * Custom hook that provides metrics with debounced filtering
 * 
 * @param initialParams Initial parameters for the metrics request
 * @returns Object containing metrics data, loading state, error state, and filter update function
 */
export function useFilteredMetrics(initialParams: MetricsRequestParams) {
  const [filterParams, setFilterParams] = useState<MetricsRequestParams>(initialParams);
  const debouncedParams = useDebounce(filterParams, 500);
  
  const updateFilters = useCallback((params: Partial<MetricsRequestParams>) => {
    setFilterParams(prev => ({ ...prev, ...params }));
  }, []);
  
  const queryResult = useMetrics(debouncedParams);
  
  return {
    ...queryResult,
    updateFilters,
  };
}