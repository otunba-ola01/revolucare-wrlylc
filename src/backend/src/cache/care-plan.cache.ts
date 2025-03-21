/**
 * Implements caching functionality for care plans in the Revolucare platform.
 * This module provides methods for caching and retrieving care plans, client
 * care plan lists, and care plan options to improve performance and reduce
 * database load.
 */

import { redisClient, getCacheKey, DEFAULT_CACHE_TTL } from '../config/redis';
import { logger } from '../utils/logger';
import { CarePlan, CarePlanOptionsResponse } from '../types/care-plan.types';

// Cache namespaces for different types of care plan data
const CARE_PLAN_CACHE_NAMESPACE = 'care-plan';
const CLIENT_CARE_PLANS_CACHE_NAMESPACE = 'client-care-plans';
const CARE_PLAN_OPTIONS_CACHE_NAMESPACE = 'care-plan-options';

// Default TTL for care plan cache items (1 hour in seconds)
const CARE_PLAN_CACHE_TTL = 3600;

/**
 * Generates a cache key for a specific care plan
 * 
 * @param carePlanId - The ID of the care plan
 * @returns Formatted cache key for the care plan
 */
export function getCarePlanCacheKey(carePlanId: string): string {
  return getCacheKey(CARE_PLAN_CACHE_NAMESPACE, carePlanId);
}

/**
 * Generates a cache key for a client's list of care plans
 * 
 * @param clientId - The ID of the client
 * @returns Formatted cache key for the client's care plans list
 */
export function getClientCarePlansListCacheKey(clientId: string): string {
  return getCacheKey(CLIENT_CARE_PLANS_CACHE_NAMESPACE, clientId);
}

/**
 * Generates a cache key for care plan options generated for a client
 * 
 * @param clientId - The ID of the client
 * @returns Formatted cache key for the care plan options
 */
export function getCarePlanOptionsCacheKey(clientId: string): string {
  return getCacheKey(CARE_PLAN_OPTIONS_CACHE_NAMESPACE, clientId);
}

/**
 * Caches a care plan with the specified TTL
 * 
 * @param carePlan - The care plan to cache
 * @param ttl - Time to live in seconds (defaults to CARE_PLAN_CACHE_TTL)
 * @returns Promise that resolves when caching is complete
 */
export async function cacheCarePlan(carePlan: CarePlan, ttl: number = CARE_PLAN_CACHE_TTL): Promise<void> {
  try {
    const cacheKey = getCarePlanCacheKey(carePlan.id);
    await redisClient.set(cacheKey, JSON.stringify(carePlan), 'EX', ttl);
    logger.debug('Care plan cached successfully', { carePlanId: carePlan.id, ttl });
  } catch (error) {
    logger.error('Failed to cache care plan', { 
      error: error instanceof Error ? error.message : String(error),
      carePlanId: carePlan.id
    });
  }
}

/**
 * Retrieves a cached care plan by ID
 * 
 * @param carePlanId - The ID of the care plan to retrieve
 * @returns The cached care plan or null if not found
 */
export async function getCachedCarePlan(carePlanId: string): Promise<CarePlan | null> {
  try {
    const cacheKey = getCarePlanCacheKey(carePlanId);
    const cachedData = await redisClient.get(cacheKey);
    
    if (cachedData) {
      logger.debug('Care plan cache hit', { carePlanId });
      return JSON.parse(cachedData) as CarePlan;
    }
    
    logger.debug('Care plan cache miss', { carePlanId });
    return null;
  } catch (error) {
    logger.error('Failed to retrieve cached care plan', { 
      error: error instanceof Error ? error.message : String(error),
      carePlanId
    });
    return null;
  }
}

/**
 * Caches a list of care plans for a specific client
 * 
 * @param clientId - The ID of the client
 * @param carePlans - Array of care plans to cache
 * @param ttl - Time to live in seconds (defaults to CARE_PLAN_CACHE_TTL)
 * @returns Promise that resolves when caching is complete
 */
export async function cacheClientCarePlans(
  clientId: string, 
  carePlans: CarePlan[], 
  ttl: number = CARE_PLAN_CACHE_TTL
): Promise<void> {
  try {
    const cacheKey = getClientCarePlansListCacheKey(clientId);
    await redisClient.set(cacheKey, JSON.stringify(carePlans), 'EX', ttl);
    logger.debug('Client care plans cached successfully', { 
      clientId, 
      count: carePlans.length,
      ttl 
    });
  } catch (error) {
    logger.error('Failed to cache client care plans', { 
      error: error instanceof Error ? error.message : String(error),
      clientId
    });
  }
}

/**
 * Retrieves cached care plans for a specific client
 * 
 * @param clientId - The ID of the client
 * @returns Array of cached care plans or null if not found
 */
export async function getCachedClientCarePlans(clientId: string): Promise<CarePlan[] | null> {
  try {
    const cacheKey = getClientCarePlansListCacheKey(clientId);
    const cachedData = await redisClient.get(cacheKey);
    
    if (cachedData) {
      logger.debug('Client care plans cache hit', { clientId });
      return JSON.parse(cachedData) as CarePlan[];
    }
    
    logger.debug('Client care plans cache miss', { clientId });
    return null;
  } catch (error) {
    logger.error('Failed to retrieve cached client care plans', { 
      error: error instanceof Error ? error.message : String(error),
      clientId
    });
    return null;
  }
}

/**
 * Caches care plan options generated for a client
 * 
 * @param clientId - The ID of the client
 * @param options - Care plan options to cache
 * @param ttl - Time to live in seconds (defaults to CARE_PLAN_CACHE_TTL)
 * @returns Promise that resolves when caching is complete
 */
export async function cacheCarePlanOptions(
  clientId: string, 
  options: CarePlanOptionsResponse, 
  ttl: number = CARE_PLAN_CACHE_TTL
): Promise<void> {
  try {
    const cacheKey = getCarePlanOptionsCacheKey(clientId);
    await redisClient.set(cacheKey, JSON.stringify(options), 'EX', ttl);
    logger.debug('Care plan options cached successfully', { 
      clientId, 
      optionsCount: options.options.length,
      ttl 
    });
  } catch (error) {
    logger.error('Failed to cache care plan options', { 
      error: error instanceof Error ? error.message : String(error),
      clientId
    });
  }
}

/**
 * Retrieves cached care plan options for a client
 * 
 * @param clientId - The ID of the client
 * @returns Cached care plan options or null if not found
 */
export async function getCachedCarePlanOptions(clientId: string): Promise<CarePlanOptionsResponse | null> {
  try {
    const cacheKey = getCarePlanOptionsCacheKey(clientId);
    const cachedData = await redisClient.get(cacheKey);
    
    if (cachedData) {
      logger.debug('Care plan options cache hit', { clientId });
      return JSON.parse(cachedData) as CarePlanOptionsResponse;
    }
    
    logger.debug('Care plan options cache miss', { clientId });
    return null;
  } catch (error) {
    logger.error('Failed to retrieve cached care plan options', { 
      error: error instanceof Error ? error.message : String(error),
      clientId
    });
    return null;
  }
}

/**
 * Invalidates the cache for a specific care plan
 * 
 * @param carePlanId - The ID of the care plan to invalidate
 * @returns Promise that resolves when invalidation is complete
 */
export async function invalidateCarePlanCache(carePlanId: string): Promise<void> {
  try {
    const cacheKey = getCarePlanCacheKey(carePlanId);
    await redisClient.del(cacheKey);
    logger.debug('Care plan cache invalidated', { carePlanId });
  } catch (error) {
    logger.error('Failed to invalidate care plan cache', { 
      error: error instanceof Error ? error.message : String(error),
      carePlanId
    });
  }
}

/**
 * Invalidates the cache for a client's care plans list
 * 
 * @param clientId - The ID of the client
 * @returns Promise that resolves when invalidation is complete
 */
export async function invalidateClientCarePlansCache(clientId: string): Promise<void> {
  try {
    const cacheKey = getClientCarePlansListCacheKey(clientId);
    await redisClient.del(cacheKey);
    logger.debug('Client care plans cache invalidated', { clientId });
  } catch (error) {
    logger.error('Failed to invalidate client care plans cache', { 
      error: error instanceof Error ? error.message : String(error),
      clientId
    });
  }
}

/**
 * Invalidates the cache for a client's care plan options
 * 
 * @param clientId - The ID of the client
 * @returns Promise that resolves when invalidation is complete
 */
export async function invalidateCarePlanOptionsCache(clientId: string): Promise<void> {
  try {
    const cacheKey = getCarePlanOptionsCacheKey(clientId);
    await redisClient.del(cacheKey);
    logger.debug('Care plan options cache invalidated', { clientId });
  } catch (error) {
    logger.error('Failed to invalidate care plan options cache', { 
      error: error instanceof Error ? error.message : String(error),
      clientId
    });
  }
}