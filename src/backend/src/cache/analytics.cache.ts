/**
 * Implements caching functionality for analytics data in the Revolucare platform.
 * This module provides methods for storing and retrieving metrics and dashboards 
 * from Redis cache, improving performance for frequently accessed analytics data
 * while reducing database load.
 */

import { redisClient, getCacheKey, DEFAULT_CACHE_TTL } from '../config/redis';
import { debug, error } from '../utils/logger';
import { IAnalyticsCache } from '../interfaces/analytics.interface';
import { MetricsResponse, DashboardResponse } from '../types/analytics.types';
import { DEFAULT_METRIC_TTL, DEFAULT_DASHBOARD_TTL } from '../constants/metrics';

/**
 * Generates a cache key for metrics based on request parameters
 * 
 * @param category - Metric category
 * @param period - Time period
 * @param startDate - Start date for metrics
 * @param endDate - End date for metrics
 * @returns Formatted cache key for metrics
 */
const getMetricsCacheKey = (
  category: string,
  period: string,
  startDate: Date,
  endDate: Date
): string => {
  const startDateStr = startDate.toISOString();
  const endDateStr = endDate.toISOString();
  return getCacheKey('metrics', `${category}:${period}:${startDateStr}:${endDateStr}`);
};

/**
 * Generates a cache key for dashboard based on user ID and role
 * 
 * @param userId - User ID
 * @param role - User role
 * @returns Formatted cache key for dashboard
 */
const getDashboardCacheKey = (userId: string, role: string): string => {
  return getCacheKey('dashboard', `${userId}:${role}`);
};

/**
 * Retrieves metrics from cache if available
 * 
 * @param category - Metric category
 * @param period - Time period
 * @param startDate - Start date for metrics
 * @param endDate - End date for metrics
 * @returns Cached metrics response or null if not found
 */
const getMetrics = async (
  category: string,
  period: string,
  startDate: Date,
  endDate: Date
): Promise<MetricsResponse | null> => {
  try {
    const cacheKey = getMetricsCacheKey(category, period, startDate, endDate);
    const cachedData = await redisClient.get(cacheKey);
    
    if (cachedData) {
      debug('Cache hit for metrics', { category, period });
      return JSON.parse(cachedData) as MetricsResponse;
    }
    
    debug('Cache miss for metrics', { category, period });
    return null;
  } catch (err) {
    error('Error retrieving metrics from cache', {
      error: err instanceof Error ? err.message : String(err),
      category,
      period
    });
    return null;
  }
};

/**
 * Stores metrics in cache with appropriate TTL
 * 
 * @param metrics - Metrics data to cache
 * @param category - Metric category
 * @param period - Time period
 * @param startDate - Start date for metrics
 * @param endDate - End date for metrics
 * @param ttl - Time-to-live in seconds (optional)
 */
const setMetrics = async (
  metrics: MetricsResponse,
  category: string,
  period: string,
  startDate: Date,
  endDate: Date,
  ttl?: number
): Promise<void> => {
  try {
    const cacheKey = getMetricsCacheKey(category, period, startDate, endDate);
    const cacheValue = JSON.stringify(metrics);
    const cacheTtl = ttl || DEFAULT_METRIC_TTL;
    
    await redisClient.set(cacheKey, cacheValue, 'EX', cacheTtl);
    debug('Metrics cached successfully', { category, period, ttl: cacheTtl });
  } catch (err) {
    error('Error caching metrics', {
      error: err instanceof Error ? err.message : String(err),
      category,
      period
    });
  }
};

/**
 * Retrieves dashboard configuration from cache if available
 * 
 * @param userId - User ID
 * @param role - User role
 * @returns Cached dashboard response or null if not found
 */
const getDashboard = async (
  userId: string,
  role: string
): Promise<DashboardResponse | null> => {
  try {
    const cacheKey = getDashboardCacheKey(userId, role);
    const cachedData = await redisClient.get(cacheKey);
    
    if (cachedData) {
      debug('Cache hit for dashboard', { userId, role });
      return JSON.parse(cachedData) as DashboardResponse;
    }
    
    debug('Cache miss for dashboard', { userId, role });
    return null;
  } catch (err) {
    error('Error retrieving dashboard from cache', {
      error: err instanceof Error ? err.message : String(err),
      userId,
      role
    });
    return null;
  }
};

/**
 * Stores dashboard configuration in cache with appropriate TTL
 * 
 * @param dashboard - Dashboard data to cache
 * @param userId - User ID
 * @param role - User role
 * @param ttl - Time-to-live in seconds (optional)
 */
const setDashboard = async (
  dashboard: DashboardResponse,
  userId: string,
  role: string,
  ttl?: number
): Promise<void> => {
  try {
    const cacheKey = getDashboardCacheKey(userId, role);
    const cacheValue = JSON.stringify(dashboard);
    const cacheTtl = ttl || DEFAULT_DASHBOARD_TTL;
    
    await redisClient.set(cacheKey, cacheValue, 'EX', cacheTtl);
    debug('Dashboard cached successfully', { userId, role, ttl: cacheTtl });
  } catch (err) {
    error('Error caching dashboard', {
      error: err instanceof Error ? err.message : String(err),
      userId,
      role
    });
  }
};

/**
 * Invalidates cached metrics for a specific category and period
 * 
 * @param category - Metric category
 * @param period - Time period
 * @param startDate - Start date for metrics
 * @param endDate - End date for metrics
 */
const invalidateMetrics = async (
  category: string,
  period: string,
  startDate: Date,
  endDate: Date
): Promise<void> => {
  try {
    const cacheKey = getMetricsCacheKey(category, period, startDate, endDate);
    await redisClient.del(cacheKey);
    debug('Invalidated metrics cache', { category, period });
  } catch (err) {
    error('Error invalidating metrics cache', {
      error: err instanceof Error ? err.message : String(err),
      category,
      period
    });
  }
};

/**
 * Invalidates cached dashboard for a specific user and role
 * 
 * @param userId - User ID
 * @param role - User role
 */
const invalidateDashboard = async (userId: string, role: string): Promise<void> => {
  try {
    const cacheKey = getDashboardCacheKey(userId, role);
    await redisClient.del(cacheKey);
    debug('Invalidated dashboard cache', { userId, role });
  } catch (err) {
    error('Error invalidating dashboard cache', {
      error: err instanceof Error ? err.message : String(err),
      userId,
      role
    });
  }
};

/**
 * Analytics cache implementation for the Revolucare platform
 */
export const analyticsCache = {
  getMetrics,
  setMetrics,
  getDashboard,
  setDashboard,
  invalidateMetrics,
  invalidateDashboard
};