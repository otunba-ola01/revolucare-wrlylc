/**
 * Provider-related caching utilities for the Revolucare platform.
 * 
 * This module provides functions to cache and retrieve provider data to improve
 * performance and reduce database load for frequently accessed provider information.
 * It implements caching for provider profiles, search results, and provider lists
 * organized by service type.
 * 
 * @version 1.0.0
 */

import { redisClient, getCacheKey, DEFAULT_CACHE_TTL, getOrSetCache } from '../config/redis';
import { debug } from '../utils/logger';
import { ProviderProfile, ProviderSearchCriteria } from '../types/provider.types';
import { ServiceType } from '../constants/service-types';
import { PaginatedResponse } from '../types/response.types';

// Cache TTLs in seconds
const PROVIDER_CACHE_TTL = 3600; // 1 hour
const PROVIDER_SEARCH_CACHE_TTL = 1800; // 30 minutes
const SERVICE_TYPE_CACHE_TTL = 3600; // 1 hour

/**
 * Generates a cache key for a provider profile
 * 
 * @param providerId - The provider's unique identifier
 * @returns Formatted cache key
 */
export function getProviderCacheKey(providerId: string): string {
  return getCacheKey('provider', providerId);
}

/**
 * Generates a cache key for provider search results based on search criteria
 * 
 * @param criteria - The search criteria used
 * @returns Formatted cache key
 */
export function getProviderSearchCacheKey(criteria: ProviderSearchCriteria): string {
  // Create a normalized representation of the search criteria
  const normalizedCriteria: Record<string, any> = {};
  
  // Handle arrays - sort them for consistent ordering
  if (criteria.serviceTypes) {
    normalizedCriteria.serviceTypes = [...criteria.serviceTypes].sort();
  }
  
  if (criteria.specializations) {
    normalizedCriteria.specializations = [...criteria.specializations].sort();
  }
  
  // Include other criteria fields
  normalizedCriteria.location = criteria.location;
  normalizedCriteria.distance = criteria.distance;
  normalizedCriteria.zipCode = criteria.zipCode;
  normalizedCriteria.availability = criteria.availability;
  normalizedCriteria.insurance = criteria.insurance;
  normalizedCriteria.minRating = criteria.minRating;
  normalizedCriteria.page = criteria.page;
  normalizedCriteria.limit = criteria.limit;
  normalizedCriteria.sortBy = criteria.sortBy;
  normalizedCriteria.sortOrder = criteria.sortOrder;
  
  // Generate a consistent string representation
  const criteriaString = JSON.stringify(normalizedCriteria);
  
  return getCacheKey('provider-search', criteriaString);
}

/**
 * Generates a cache key for providers by service type
 * 
 * @param serviceType - The service type
 * @returns Formatted cache key
 */
export function getServiceTypeCacheKey(serviceType: ServiceType): string {
  return getCacheKey('provider-service-type', serviceType);
}

/**
 * Caches a provider profile
 * 
 * @param providerId - The provider's unique identifier
 * @param profile - The provider profile to cache
 * @param ttl - Optional TTL in seconds (defaults to PROVIDER_CACHE_TTL)
 * @returns Promise that resolves when caching is complete
 */
export async function cacheProviderProfile(
  providerId: string,
  profile: ProviderProfile,
  ttl: number = PROVIDER_CACHE_TTL
): Promise<void> {
  try {
    const cacheKey = getProviderCacheKey(providerId);
    await redisClient.set(cacheKey, JSON.stringify(profile), 'EX', ttl);
    debug('Cached provider profile', { providerId, ttl });
  } catch (error) {
    debug('Error caching provider profile', { 
      providerId, 
      error: error instanceof Error ? error.message : String(error) 
    });
    // Continue execution - caching errors shouldn't break the application
  }
}

/**
 * Retrieves a cached provider profile
 * 
 * @param providerId - The provider's unique identifier
 * @returns Cached provider profile or null if not found
 */
export async function getCachedProviderProfile(providerId: string): Promise<ProviderProfile | null> {
  try {
    const cacheKey = getProviderCacheKey(providerId);
    const cachedData = await redisClient.get(cacheKey);
    
    if (cachedData) {
      debug('Cache hit: provider profile', { providerId });
      return JSON.parse(cachedData) as ProviderProfile;
    }
    
    debug('Cache miss: provider profile', { providerId });
    return null;
  } catch (error) {
    debug('Error retrieving cached provider profile', {
      providerId,
      error: error instanceof Error ? error.message : String(error)
    });
    return null;
  }
}

/**
 * Caches provider search results
 * 
 * @param criteria - The search criteria used
 * @param results - The search results to cache
 * @param ttl - Optional TTL in seconds (defaults to PROVIDER_SEARCH_CACHE_TTL)
 * @returns Promise that resolves when caching is complete
 */
export async function cacheProviderSearchResults(
  criteria: ProviderSearchCriteria,
  results: PaginatedResponse<ProviderProfile>,
  ttl: number = PROVIDER_SEARCH_CACHE_TTL
): Promise<void> {
  try {
    const cacheKey = getProviderSearchCacheKey(criteria);
    await redisClient.set(cacheKey, JSON.stringify(results), 'EX', ttl);
    debug('Cached provider search results', { criteria, ttl });
  } catch (error) {
    debug('Error caching provider search results', {
      error: error instanceof Error ? error.message : String(error)
    });
    // Continue execution - caching errors shouldn't break the application
  }
}

/**
 * Retrieves cached provider search results
 * 
 * @param criteria - The search criteria
 * @returns Cached search results or null if not found
 */
export async function getCachedProviderSearchResults(
  criteria: ProviderSearchCriteria
): Promise<PaginatedResponse<ProviderProfile> | null> {
  try {
    const cacheKey = getProviderSearchCacheKey(criteria);
    const cachedData = await redisClient.get(cacheKey);
    
    if (cachedData) {
      debug('Cache hit: provider search results', { criteria });
      return JSON.parse(cachedData) as PaginatedResponse<ProviderProfile>;
    }
    
    debug('Cache miss: provider search results', { criteria });
    return null;
  } catch (error) {
    debug('Error retrieving cached provider search results', {
      error: error instanceof Error ? error.message : String(error)
    });
    return null;
  }
}

/**
 * Caches a list of providers by service type
 * 
 * @param serviceType - The service type
 * @param providers - The list of providers to cache
 * @param ttl - Optional TTL in seconds (defaults to SERVICE_TYPE_CACHE_TTL)
 * @returns Promise that resolves when caching is complete
 */
export async function cacheProvidersByServiceType(
  serviceType: ServiceType,
  providers: ProviderProfile[],
  ttl: number = SERVICE_TYPE_CACHE_TTL
): Promise<void> {
  try {
    const cacheKey = getServiceTypeCacheKey(serviceType);
    await redisClient.set(cacheKey, JSON.stringify(providers), 'EX', ttl);
    debug('Cached providers by service type', { serviceType, count: providers.length, ttl });
  } catch (error) {
    debug('Error caching providers by service type', {
      serviceType,
      error: error instanceof Error ? error.message : String(error)
    });
    // Continue execution - caching errors shouldn't break the application
  }
}

/**
 * Retrieves cached providers by service type
 * 
 * @param serviceType - The service type
 * @returns Cached provider list or null if not found
 */
export async function getCachedProvidersByServiceType(
  serviceType: ServiceType
): Promise<ProviderProfile[] | null> {
  try {
    const cacheKey = getServiceTypeCacheKey(serviceType);
    const cachedData = await redisClient.get(cacheKey);
    
    if (cachedData) {
      debug('Cache hit: providers by service type', { serviceType });
      return JSON.parse(cachedData) as ProviderProfile[];
    }
    
    debug('Cache miss: providers by service type', { serviceType });
    return null;
  } catch (error) {
    debug('Error retrieving cached providers by service type', {
      serviceType,
      error: error instanceof Error ? error.message : String(error)
    });
    return null;
  }
}

/**
 * Invalidates cache for a specific provider
 * 
 * @param providerId - The provider's unique identifier
 * @returns Promise that resolves when cache is invalidated
 */
export async function invalidateProviderCache(providerId: string): Promise<void> {
  try {
    const cacheKey = getProviderCacheKey(providerId);
    await redisClient.del(cacheKey);
    debug('Invalidated provider cache', { providerId });
  } catch (error) {
    debug('Error invalidating provider cache', {
      providerId,
      error: error instanceof Error ? error.message : String(error)
    });
    // Continue execution - caching errors shouldn't break the application
  }
}

/**
 * Invalidates all provider search caches
 * This should be called when provider data changes that would affect search results
 * 
 * @returns Promise that resolves when cache is invalidated
 */
export async function invalidateProviderSearchCache(): Promise<void> {
  try {
    // Use pattern matching to find all provider search keys
    const pattern = getCacheKey('provider-search', '*');
    
    // Get all keys matching the pattern
    // Note: In a production environment with large number of keys, 
    // we would use SCAN with iteration to handle large datasets efficiently
    const keys = await redisClient.keys(pattern);
    
    if (keys.length > 0) {
      await redisClient.del(...keys);
      debug('Invalidated provider search cache', { count: keys.length });
    } else {
      debug('No provider search cache keys to invalidate');
    }
  } catch (error) {
    debug('Error invalidating provider search cache', {
      error: error instanceof Error ? error.message : String(error)
    });
    // Continue execution - caching errors shouldn't break the application
  }
}

/**
 * Invalidates cache for providers by service type
 * 
 * @param serviceType - The service type
 * @returns Promise that resolves when cache is invalidated
 */
export async function invalidateServiceTypeCache(serviceType: ServiceType): Promise<void> {
  try {
    const cacheKey = getServiceTypeCacheKey(serviceType);
    await redisClient.del(cacheKey);
    debug('Invalidated service type cache', { serviceType });
  } catch (error) {
    debug('Error invalidating service type cache', {
      serviceType,
      error: error instanceof Error ? error.message : String(error)
    });
    // Continue execution - caching errors shouldn't break the application
  }
}