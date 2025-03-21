/**
 * Caching functionality for services plans in the Revolucare platform.
 * Provides methods for caching and retrieving services plans, needs assessments, 
 * and search results to improve performance and reduce database load.
 */

import { redisClient, getCacheKey, DEFAULT_CACHE_TTL } from '../config/redis';
import { logger } from '../utils/logger';
import { ServicesPlan, NeedsAssessment, ServicesPlanFilterParams } from '../types/services-plan.types';

// Cache namespaces
const SERVICES_PLAN_CACHE_NAMESPACE = 'services-plan';
const NEEDS_ASSESSMENT_CACHE_NAMESPACE = 'needs-assessment';
const CLIENT_SERVICES_PLANS_CACHE_NAMESPACE = 'client-services-plans';
const SERVICES_PLAN_SEARCH_CACHE_NAMESPACE = 'services-plan-search';

// Cache TTL (Time-To-Live) in seconds
const SERVICES_PLAN_CACHE_TTL = 3600; // 1 hour
const NEEDS_ASSESSMENT_CACHE_TTL = 3600; // 1 hour
const CLIENT_SERVICES_PLANS_CACHE_TTL = 1800; // 30 minutes
const SERVICES_PLAN_SEARCH_CACHE_TTL = 900; // 15 minutes

/**
 * Generates a cache key for a specific services plan
 * @param servicesPlanId - The ID of the services plan
 * @returns Formatted cache key for the services plan
 */
export function getServicesPlanCacheKey(servicesPlanId: string): string {
  return getCacheKey(SERVICES_PLAN_CACHE_NAMESPACE, servicesPlanId);
}

/**
 * Generates a cache key for services plan search results based on filter parameters
 * @param filters - The filter parameters used for searching
 * @returns Formatted cache key for the search results
 */
export function getServicesPlanFilterCacheKey(filters: ServicesPlanFilterParams): string {
  // Create a string representation of the filter parameters
  const filterString = JSON.stringify(filters);
  return getCacheKey(SERVICES_PLAN_SEARCH_CACHE_NAMESPACE, filterString);
}

/**
 * Generates a cache key for a specific needs assessment
 * @param assessmentId - The ID of the needs assessment
 * @returns Formatted cache key for the needs assessment
 */
export function getNeedsAssessmentCacheKey(assessmentId: string): string {
  return getCacheKey(NEEDS_ASSESSMENT_CACHE_NAMESPACE, assessmentId);
}

/**
 * Generates a cache key for a client's services plans list
 * @param clientId - The ID of the client
 * @returns Formatted cache key for the client's services plans
 */
export function getClientServicesPlansCacheKey(clientId: string): string {
  return getCacheKey(CLIENT_SERVICES_PLANS_CACHE_NAMESPACE, clientId);
}

/**
 * Caches a services plan object
 * @param servicesPlan - The services plan to cache
 * @param ttl - Optional time-to-live in seconds, defaults to SERVICES_PLAN_CACHE_TTL
 * @returns Promise that resolves when caching is complete
 */
export async function cacheServicesPlan(
  servicesPlan: ServicesPlan, 
  ttl: number = SERVICES_PLAN_CACHE_TTL
): Promise<void> {
  try {
    const cacheKey = getServicesPlanCacheKey(servicesPlan.id);
    await redisClient.set(cacheKey, JSON.stringify(servicesPlan), 'EX', ttl);
    logger.debug('Services plan cached', { id: servicesPlan.id, ttl });
  } catch (error) {
    logger.error('Failed to cache services plan', { 
      error: error instanceof Error ? error.message : String(error),
      planId: servicesPlan.id
    });
  }
}

/**
 * Retrieves a cached services plan by ID
 * @param servicesPlanId - The ID of the services plan to retrieve
 * @returns The cached services plan or null if not found
 */
export async function getCachedServicesPlan(servicesPlanId: string): Promise<ServicesPlan | null> {
  try {
    const cacheKey = getServicesPlanCacheKey(servicesPlanId);
    const cachedData = await redisClient.get(cacheKey);
    
    if (cachedData) {
      logger.debug('Services plan cache hit', { id: servicesPlanId });
      return JSON.parse(cachedData) as ServicesPlan;
    }
    
    logger.debug('Services plan cache miss', { id: servicesPlanId });
    return null;
  } catch (error) {
    logger.error('Error retrieving cached services plan', { 
      error: error instanceof Error ? error.message : String(error),
      planId: servicesPlanId
    });
    return null;
  }
}

/**
 * Caches a needs assessment object
 * @param assessment - The needs assessment to cache
 * @param ttl - Optional time-to-live in seconds, defaults to NEEDS_ASSESSMENT_CACHE_TTL
 * @returns Promise that resolves when caching is complete
 */
export async function cacheNeedsAssessment(
  assessment: NeedsAssessment, 
  ttl: number = NEEDS_ASSESSMENT_CACHE_TTL
): Promise<void> {
  try {
    const cacheKey = getNeedsAssessmentCacheKey(assessment.id);
    await redisClient.set(cacheKey, JSON.stringify(assessment), 'EX', ttl);
    logger.debug('Needs assessment cached', { id: assessment.id, ttl });
  } catch (error) {
    logger.error('Failed to cache needs assessment', { 
      error: error instanceof Error ? error.message : String(error),
      assessmentId: assessment.id
    });
  }
}

/**
 * Retrieves a cached needs assessment by ID
 * @param assessmentId - The ID of the needs assessment to retrieve
 * @returns The cached needs assessment or null if not found
 */
export async function getCachedNeedsAssessment(assessmentId: string): Promise<NeedsAssessment | null> {
  try {
    const cacheKey = getNeedsAssessmentCacheKey(assessmentId);
    const cachedData = await redisClient.get(cacheKey);
    
    if (cachedData) {
      logger.debug('Needs assessment cache hit', { id: assessmentId });
      return JSON.parse(cachedData) as NeedsAssessment;
    }
    
    logger.debug('Needs assessment cache miss', { id: assessmentId });
    return null;
  } catch (error) {
    logger.error('Error retrieving cached needs assessment', { 
      error: error instanceof Error ? error.message : String(error),
      assessmentId
    });
    return null;
  }
}

/**
 * Caches a list of services plans for a specific client
 * @param clientId - The ID of the client
 * @param servicesPlans - The list of services plans to cache
 * @param ttl - Optional time-to-live in seconds, defaults to CLIENT_SERVICES_PLANS_CACHE_TTL
 * @returns Promise that resolves when caching is complete
 */
export async function cacheClientServicesPlans(
  clientId: string, 
  servicesPlans: ServicesPlan[], 
  ttl: number = CLIENT_SERVICES_PLANS_CACHE_TTL
): Promise<void> {
  try {
    const cacheKey = getClientServicesPlansCacheKey(clientId);
    await redisClient.set(cacheKey, JSON.stringify(servicesPlans), 'EX', ttl);
    logger.debug('Client services plans cached', { 
      clientId, 
      count: servicesPlans.length, 
      ttl 
    });
  } catch (error) {
    logger.error('Failed to cache client services plans', { 
      error: error instanceof Error ? error.message : String(error),
      clientId
    });
  }
}

/**
 * Retrieves cached services plans for a specific client
 * @param clientId - The ID of the client
 * @returns The cached services plans array or null if not found
 */
export async function getCachedClientServicesPlans(clientId: string): Promise<ServicesPlan[] | null> {
  try {
    const cacheKey = getClientServicesPlansCacheKey(clientId);
    const cachedData = await redisClient.get(cacheKey);
    
    if (cachedData) {
      logger.debug('Client services plans cache hit', { clientId });
      return JSON.parse(cachedData) as ServicesPlan[];
    }
    
    logger.debug('Client services plans cache miss', { clientId });
    return null;
  } catch (error) {
    logger.error('Error retrieving cached client services plans', { 
      error: error instanceof Error ? error.message : String(error),
      clientId
    });
    return null;
  }
}

/**
 * Caches services plan search results for specific filter parameters
 * @param filters - The filter parameters used for searching
 * @param results - The search results to cache
 * @param ttl - Optional time-to-live in seconds, defaults to SERVICES_PLAN_SEARCH_CACHE_TTL
 * @returns Promise that resolves when caching is complete
 */
export async function cacheServicesPlanSearchResults(
  filters: ServicesPlanFilterParams, 
  results: object,
  ttl: number = SERVICES_PLAN_SEARCH_CACHE_TTL
): Promise<void> {
  try {
    const cacheKey = getServicesPlanFilterCacheKey(filters);
    await redisClient.set(cacheKey, JSON.stringify(results), 'EX', ttl);
    logger.debug('Services plan search results cached', { 
      filters,
      ttl 
    });
  } catch (error) {
    logger.error('Failed to cache services plan search results', { 
      error: error instanceof Error ? error.message : String(error),
      filters
    });
  }
}

/**
 * Retrieves cached services plan search results for specific filter parameters
 * @param filters - The filter parameters used for searching
 * @returns The cached search results or null if not found
 */
export async function getCachedServicesPlanSearchResults(
  filters: ServicesPlanFilterParams
): Promise<{ servicesPlans: ServicesPlan[]; total: number; } | null> {
  try {
    const cacheKey = getServicesPlanFilterCacheKey(filters);
    const cachedData = await redisClient.get(cacheKey);
    
    if (cachedData) {
      logger.debug('Services plan search results cache hit', { filters });
      return JSON.parse(cachedData) as { servicesPlans: ServicesPlan[]; total: number; };
    }
    
    logger.debug('Services plan search results cache miss', { filters });
    return null;
  } catch (error) {
    logger.error('Error retrieving cached services plan search results', { 
      error: error instanceof Error ? error.message : String(error),
      filters
    });
    return null;
  }
}

/**
 * Invalidates the cache for a specific services plan
 * @param servicesPlanId - The ID of the services plan
 * @returns Promise that resolves when invalidation is complete
 */
export async function invalidateServicesPlanCache(servicesPlanId: string): Promise<void> {
  try {
    const cacheKey = getServicesPlanCacheKey(servicesPlanId);
    await redisClient.del(cacheKey);
    logger.debug('Services plan cache invalidated', { id: servicesPlanId });
  } catch (error) {
    logger.error('Failed to invalidate services plan cache', { 
      error: error instanceof Error ? error.message : String(error),
      planId: servicesPlanId
    });
  }
}

/**
 * Invalidates the cache for a specific needs assessment
 * @param assessmentId - The ID of the needs assessment
 * @returns Promise that resolves when invalidation is complete
 */
export async function invalidateNeedsAssessmentCache(assessmentId: string): Promise<void> {
  try {
    const cacheKey = getNeedsAssessmentCacheKey(assessmentId);
    await redisClient.del(cacheKey);
    logger.debug('Needs assessment cache invalidated', { id: assessmentId });
  } catch (error) {
    logger.error('Failed to invalidate needs assessment cache', { 
      error: error instanceof Error ? error.message : String(error),
      assessmentId
    });
  }
}

/**
 * Invalidates the cache for a client's services plans
 * @param clientId - The ID of the client
 * @returns Promise that resolves when invalidation is complete
 */
export async function invalidateClientServicesPlanCache(clientId: string): Promise<void> {
  try {
    const cacheKey = getClientServicesPlansCacheKey(clientId);
    await redisClient.del(cacheKey);
    logger.debug('Client services plans cache invalidated', { clientId });
  } catch (error) {
    logger.error('Failed to invalidate client services plans cache', { 
      error: error instanceof Error ? error.message : String(error),
      clientId
    });
  }
}

/**
 * Invalidates all services plan search caches
 * @returns Promise that resolves when invalidation is complete
 */
export async function invalidateServicesPlanSearchCache(): Promise<void> {
  try {
    // Use Redis pattern matching to find all keys in the services plan search namespace
    const pattern = `${SERVICES_PLAN_SEARCH_CACHE_NAMESPACE}:*`;
    const keys = await redisClient.keys(pattern);
    
    if (keys.length > 0) {
      await redisClient.del(...keys);
      logger.debug('Services plan search cache invalidated', { keysRemoved: keys.length });
    }
  } catch (error) {
    logger.error('Failed to invalidate services plan search cache', { 
      error: error instanceof Error ? error.message : String(error)
    });
  }
}