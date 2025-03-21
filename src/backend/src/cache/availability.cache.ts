/**
 * Implements caching functionality for provider availability data in the Revolucare platform.
 * This module provides methods for caching, retrieving, and invalidating provider availability
 * information and time slots to improve system performance and reduce database load for
 * frequently accessed availability data.
 */

import { redisClient, getCacheKey, DEFAULT_CACHE_TTL } from '../config/redis';
import { Availability, TimeSlot, DateRange } from '../types/provider.types';
import { formatDate } from '../utils/date-time';
import { logger } from '../utils/logger';

// Cache TTL constants
const AVAILABILITY_CACHE_TTL = 3600; // 1 hour in seconds
const TIME_SLOTS_CACHE_TTL = 1800; // 30 minutes in seconds

/**
 * Generates a cache key for provider availability data
 * 
 * @param providerId - The provider's ID
 * @returns Formatted cache key for the provider's availability
 */
export function getAvailabilityCacheKey(providerId: string): string {
  return getCacheKey('availability', providerId);
}

/**
 * Generates a cache key for provider time slots within a date range
 * 
 * @param providerId - The provider's ID
 * @param dateRange - Date range for the time slots
 * @param serviceType - Optional service type filter
 * @returns Formatted cache key for the provider's time slots
 */
export function getTimeSlotsCacheKey(providerId: string, dateRange: DateRange, serviceType: string): string {
  const formattedStartDate = formatDate(dateRange.startDate, 'yyyy-MM-dd');
  const formattedEndDate = formatDate(dateRange.endDate, 'yyyy-MM-dd');
  const dateKey = `${formattedStartDate}_to_${formattedEndDate}`;
  return getCacheKey('timeslots', `${providerId}:${dateKey}:${serviceType || 'all'}`);
}

/**
 * Caches provider availability data in Redis
 * 
 * @param providerId - The provider's ID
 * @param availability - The availability data to cache
 * @param ttl - Optional TTL in seconds (defaults to AVAILABILITY_CACHE_TTL)
 * @returns Promise that resolves when caching is complete
 */
export async function cacheAvailability(
  providerId: string,
  availability: Availability,
  ttl: number = AVAILABILITY_CACHE_TTL
): Promise<void> {
  try {
    const key = getAvailabilityCacheKey(providerId);
    const value = JSON.stringify(availability);
    
    await redisClient.set(key, value, 'EX', ttl);
    logger.debug('Cached provider availability', { providerId });
  } catch (error) {
    logger.error('Failed to cache provider availability', { 
      providerId,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Retrieves cached provider availability data from Redis
 * 
 * @param providerId - The provider's ID
 * @returns Cached availability data or null if not found
 */
export async function getCachedAvailability(providerId: string): Promise<Availability | null> {
  try {
    const key = getAvailabilityCacheKey(providerId);
    const cachedData = await redisClient.get(key);
    
    if (cachedData) {
      logger.debug('Cache hit: provider availability', { providerId });
      return JSON.parse(cachedData) as Availability;
    }
    
    logger.debug('Cache miss: provider availability', { providerId });
    return null;
  } catch (error) {
    logger.error('Failed to retrieve cached provider availability', {
      providerId,
      error: error instanceof Error ? error.message : String(error)
    });
    return null;
  }
}

/**
 * Caches provider time slots for a specific date range and service type
 * 
 * @param providerId - The provider's ID
 * @param dateRange - Date range for the time slots
 * @param serviceType - Service type filter
 * @param timeSlots - Time slots data to cache
 * @param ttl - Optional TTL in seconds (defaults to TIME_SLOTS_CACHE_TTL)
 * @returns Promise that resolves when caching is complete
 */
export async function cacheTimeSlots(
  providerId: string,
  dateRange: DateRange,
  serviceType: string,
  timeSlots: TimeSlot[],
  ttl: number = TIME_SLOTS_CACHE_TTL
): Promise<void> {
  try {
    const key = getTimeSlotsCacheKey(providerId, dateRange, serviceType);
    const value = JSON.stringify(timeSlots);
    
    await redisClient.set(key, value, 'EX', ttl);
    logger.debug('Cached provider time slots', { 
      providerId, 
      startDate: formatDate(dateRange.startDate, 'yyyy-MM-dd'),
      endDate: formatDate(dateRange.endDate, 'yyyy-MM-dd'),
      serviceType,
      slotCount: timeSlots.length
    });
  } catch (error) {
    logger.error('Failed to cache provider time slots', {
      providerId,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Retrieves cached provider time slots for a specific date range and service type
 * 
 * @param providerId - The provider's ID
 * @param dateRange - Date range for the time slots
 * @param serviceType - Service type filter
 * @returns Cached time slots or null if not found
 */
export async function getCachedTimeSlots(
  providerId: string,
  dateRange: DateRange,
  serviceType: string
): Promise<TimeSlot[] | null> {
  try {
    const key = getTimeSlotsCacheKey(providerId, dateRange, serviceType);
    const cachedData = await redisClient.get(key);
    
    if (cachedData) {
      logger.debug('Cache hit: provider time slots', { 
        providerId,
        startDate: formatDate(dateRange.startDate, 'yyyy-MM-dd'),
        endDate: formatDate(dateRange.endDate, 'yyyy-MM-dd'),
        serviceType
      });
      return JSON.parse(cachedData) as TimeSlot[];
    }
    
    logger.debug('Cache miss: provider time slots', { 
      providerId,
      startDate: formatDate(dateRange.startDate, 'yyyy-MM-dd'),
      endDate: formatDate(dateRange.endDate, 'yyyy-MM-dd'),
      serviceType
    });
    return null;
  } catch (error) {
    logger.error('Failed to retrieve cached provider time slots', {
      providerId,
      error: error instanceof Error ? error.message : String(error)
    });
    return null;
  }
}

/**
 * Invalidates cached availability data for a provider
 * 
 * @param providerId - The provider's ID
 * @returns Promise that resolves when invalidation is complete
 */
export async function invalidateAvailabilityCache(providerId: string): Promise<void> {
  try {
    const key = getAvailabilityCacheKey(providerId);
    await redisClient.del(key);
    logger.debug('Invalidated provider availability cache', { providerId });
  } catch (error) {
    logger.error('Failed to invalidate provider availability cache', {
      providerId,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Invalidates all cached time slots for a provider
 * 
 * @param providerId - The provider's ID
 * @returns Promise that resolves when invalidation is complete
 */
export async function invalidateTimeSlotsCache(providerId: string): Promise<void> {
  try {
    // Use pattern matching to delete all time slot cache keys for this provider
    const pattern = getCacheKey('timeslots', `${providerId}:*`);
    
    // Get keys matching the pattern
    const keys = await redisClient.keys(pattern);
    
    if (keys.length > 0) {
      // Delete all matching keys
      await redisClient.del(...keys);
      
      logger.debug('Invalidated provider time slots cache', { 
        providerId, 
        keysInvalidated: keys.length 
      });
    } else {
      logger.debug('No time slots cache to invalidate', { providerId });
    }
  } catch (error) {
    logger.error('Failed to invalidate provider time slots cache', {
      providerId,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}