/**
 * Caching module for user-related data in the Revolucare platform.
 * Implements Redis-based caching for user profiles, preferences, and search results
 * to improve application performance and reduce database load.
 */

import { redisClient, getCacheKey, DEFAULT_CACHE_TTL } from '../config/redis';
import { logger } from '../utils/logger';
import { User, UserWithProfile, UserPreferences, UserWithoutPassword } from '../types/user.types';
import { UserSearchParams, UserSearchResult } from '../interfaces/user.interface';

// Cache namespaces for different user-related data
const USER_CACHE_NAMESPACE = 'user';
const USER_SEARCH_CACHE_NAMESPACE = 'user:search';
const USER_EMAIL_CACHE_NAMESPACE = 'user:email';
const USER_PROFILE_CACHE_NAMESPACE = 'user:profile';
const USER_PREFERENCES_CACHE_NAMESPACE = 'user:preferences';

// TTL values in seconds
const USER_CACHE_TTL = 3600; // 1 hour
const USER_SEARCH_CACHE_TTL = 1800; // 30 minutes

/**
 * Generates a cache key for a user by ID
 * @param userId - The user's unique identifier
 * @returns Formatted cache key for the user
 */
export function getUserCacheKey(userId: string): string {
  if (!userId) {
    throw new Error('userId is required for cache key generation');
  }
  return getCacheKey(USER_CACHE_NAMESPACE, userId);
}

/**
 * Generates a cache key for user search results based on search parameters
 * @param params - Search parameters including filters, pagination, and sorting
 * @returns Formatted cache key for the search results
 */
export function getUserSearchCacheKey(params: UserSearchParams): string {
  if (!params) {
    throw new Error('Search parameters are required for cache key generation');
  }
  
  // Create a deterministic string representation of search parameters
  const paramString = JSON.stringify({
    query: params.query || '',
    role: params.role || '',
    isVerified: params.isVerified,
    page: params.page,
    limit: params.limit,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder
  });
  
  // Hash or use the string directly
  return getCacheKey(USER_SEARCH_CACHE_NAMESPACE, paramString);
}

/**
 * Generates a cache key for looking up a user by email
 * @param email - The user's email address
 * @returns Formatted cache key for the email lookup
 */
export function getUserEmailCacheKey(email: string): string {
  if (!email) {
    throw new Error('Email is required for cache key generation');
  }
  // Convert to lowercase for case-insensitive lookups
  return getCacheKey(USER_EMAIL_CACHE_NAMESPACE, email.toLowerCase());
}

/**
 * Generates a cache key for a user's profile data
 * @param userId - The user's unique identifier
 * @returns Formatted cache key for the user profile
 */
export function getUserProfileCacheKey(userId: string): string {
  if (!userId) {
    throw new Error('userId is required for cache key generation');
  }
  return getCacheKey(USER_PROFILE_CACHE_NAMESPACE, userId);
}

/**
 * Generates a cache key for a user's preferences
 * @param userId - The user's unique identifier
 * @returns Formatted cache key for the user preferences
 */
export function getUserPreferencesCacheKey(userId: string): string {
  if (!userId) {
    throw new Error('userId is required for cache key generation');
  }
  return getCacheKey(USER_PREFERENCES_CACHE_NAMESPACE, userId);
}

/**
 * Caches a user object by ID
 * @param user - The user object to cache
 * @param ttl - Optional cache TTL in seconds (defaults to USER_CACHE_TTL)
 */
export async function cacheUser(user: User, ttl: number = USER_CACHE_TTL): Promise<void> {
  if (!user || !user.id) {
    throw new Error('Valid user object with ID is required for caching');
  }
  
  try {
    const key = getUserCacheKey(user.id);
    const jsonValue = JSON.stringify(user);
    
    await redisClient.set(key, jsonValue, 'EX', ttl);
    logger.debug('User cached successfully', { userId: user.id, ttl });
  } catch (error) {
    logger.error('Failed to cache user', { 
      userId: user.id, 
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

/**
 * Retrieves a cached user by ID
 * @param userId - The user's unique identifier
 * @returns Cached user or null if not found
 */
export async function getCachedUser(userId: string): Promise<User | null> {
  if (!userId) {
    throw new Error('userId is required to retrieve cached user');
  }
  
  try {
    const key = getUserCacheKey(userId);
    const data = await redisClient.get(key);
    
    if (!data) {
      logger.debug('Cache miss for user', { userId });
      return null;
    }
    
    logger.debug('Cache hit for user', { userId });
    return JSON.parse(data) as User;
  } catch (error) {
    logger.error('Failed to retrieve cached user', { 
      userId, 
      error: error instanceof Error ? error.message : String(error)
    });
    return null;
  }
}

/**
 * Caches a user's ID by email for quick lookups
 * @param email - The user's email address
 * @param userId - The user's unique identifier
 * @param ttl - Optional cache TTL in seconds (defaults to USER_CACHE_TTL)
 */
export async function cacheUserByEmail(email: string, userId: string, ttl: number = USER_CACHE_TTL): Promise<void> {
  if (!email || !userId) {
    throw new Error('Both email and userId are required for caching');
  }
  
  try {
    const key = getUserEmailCacheKey(email);
    await redisClient.set(key, userId, 'EX', ttl);
    logger.debug('User ID cached by email', { email, userId, ttl });
  } catch (error) {
    logger.error('Failed to cache user ID by email', { 
      email, 
      userId, 
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

/**
 * Retrieves a cached user ID by email
 * @param email - The user's email address
 * @returns Cached user ID or null if not found
 */
export async function getCachedUserIdByEmail(email: string): Promise<string | null> {
  if (!email) {
    throw new Error('Email is required to retrieve cached user ID');
  }
  
  try {
    const key = getUserEmailCacheKey(email);
    const userId = await redisClient.get(key);
    
    if (!userId) {
      logger.debug('Cache miss for user ID by email', { email });
      return null;
    }
    
    logger.debug('Cache hit for user ID by email', { email });
    return userId;
  } catch (error) {
    logger.error('Failed to retrieve cached user ID by email', { 
      email, 
      error: error instanceof Error ? error.message : String(error)
    });
    return null;
  }
}

/**
 * Caches a user with their role-specific profile
 * @param userWithProfile - The user with profile data
 * @param ttl - Optional cache TTL in seconds (defaults to USER_CACHE_TTL)
 */
export async function cacheUserWithProfile(userWithProfile: UserWithProfile, ttl: number = USER_CACHE_TTL): Promise<void> {
  if (!userWithProfile || !userWithProfile.user || !userWithProfile.user.id) {
    throw new Error('Valid user with profile object is required for caching');
  }
  
  try {
    const key = getUserProfileCacheKey(userWithProfile.user.id);
    const jsonValue = JSON.stringify(userWithProfile);
    
    await redisClient.set(key, jsonValue, 'EX', ttl);
    logger.debug('User with profile cached successfully', { userId: userWithProfile.user.id, ttl });
  } catch (error) {
    logger.error('Failed to cache user with profile', { 
      userId: userWithProfile.user.id, 
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

/**
 * Retrieves a cached user with their role-specific profile
 * @param userId - The user's unique identifier
 * @returns Cached user with profile or null if not found
 */
export async function getCachedUserWithProfile(userId: string): Promise<UserWithProfile | null> {
  if (!userId) {
    throw new Error('userId is required to retrieve cached user with profile');
  }
  
  try {
    const key = getUserProfileCacheKey(userId);
    const data = await redisClient.get(key);
    
    if (!data) {
      logger.debug('Cache miss for user with profile', { userId });
      return null;
    }
    
    logger.debug('Cache hit for user with profile', { userId });
    return JSON.parse(data) as UserWithProfile;
  } catch (error) {
    logger.error('Failed to retrieve cached user with profile', { 
      userId, 
      error: error instanceof Error ? error.message : String(error)
    });
    return null;
  }
}

/**
 * Caches a user's preferences
 * @param userId - The user's unique identifier
 * @param preferences - The user preferences to cache
 * @param ttl - Optional cache TTL in seconds (defaults to USER_CACHE_TTL)
 */
export async function cacheUserPreferences(
  userId: string, 
  preferences: UserPreferences, 
  ttl: number = USER_CACHE_TTL
): Promise<void> {
  if (!userId || !preferences) {
    throw new Error('Both userId and preferences are required for caching');
  }
  
  try {
    const key = getUserPreferencesCacheKey(userId);
    const jsonValue = JSON.stringify(preferences);
    
    await redisClient.set(key, jsonValue, 'EX', ttl);
    logger.debug('User preferences cached successfully', { userId, ttl });
  } catch (error) {
    logger.error('Failed to cache user preferences', { 
      userId, 
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

/**
 * Retrieves cached user preferences
 * @param userId - The user's unique identifier
 * @returns Cached user preferences or null if not found
 */
export async function getCachedUserPreferences(userId: string): Promise<UserPreferences | null> {
  if (!userId) {
    throw new Error('userId is required to retrieve cached preferences');
  }
  
  try {
    const key = getUserPreferencesCacheKey(userId);
    const data = await redisClient.get(key);
    
    if (!data) {
      logger.debug('Cache miss for user preferences', { userId });
      return null;
    }
    
    logger.debug('Cache hit for user preferences', { userId });
    return JSON.parse(data) as UserPreferences;
  } catch (error) {
    logger.error('Failed to retrieve cached user preferences', { 
      userId, 
      error: error instanceof Error ? error.message : String(error)
    });
    return null;
  }
}

/**
 * Caches user search results
 * @param params - Search parameters that produced the results
 * @param results - The search results to cache
 * @param ttl - Optional cache TTL in seconds (defaults to USER_SEARCH_CACHE_TTL)
 */
export async function cacheUserSearchResults(
  params: UserSearchParams, 
  results: UserSearchResult, 
  ttl: number = USER_SEARCH_CACHE_TTL
): Promise<void> {
  if (!params || !results) {
    throw new Error('Both search parameters and results are required for caching');
  }
  
  try {
    const key = getUserSearchCacheKey(params);
    const jsonValue = JSON.stringify(results);
    
    await redisClient.set(key, jsonValue, 'EX', ttl);
    logger.debug('User search results cached successfully', { 
      params: {
        query: params.query,
        role: params.role,
        page: params.page,
        limit: params.limit
      }, 
      resultCount: results.users.length,
      ttl 
    });
  } catch (error) {
    logger.error('Failed to cache user search results', { 
      params: {
        query: params.query,
        role: params.role,
        page: params.page,
        limit: params.limit
      },
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

/**
 * Retrieves cached user search results
 * @param params - Search parameters to lookup
 * @returns Cached search results or null if not found
 */
export async function getCachedUserSearchResults(params: UserSearchParams): Promise<UserSearchResult | null> {
  if (!params) {
    throw new Error('Search parameters are required to retrieve cached results');
  }
  
  try {
    const key = getUserSearchCacheKey(params);
    const data = await redisClient.get(key);
    
    if (!data) {
      logger.debug('Cache miss for user search results', { 
        params: {
          query: params.query,
          role: params.role,
          page: params.page,
          limit: params.limit
        }
      });
      return null;
    }
    
    logger.debug('Cache hit for user search results', { 
      params: {
        query: params.query,
        role: params.role,
        page: params.page,
        limit: params.limit
      }
    });
    return JSON.parse(data) as UserSearchResult;
  } catch (error) {
    logger.error('Failed to retrieve cached user search results', { 
      params: {
        query: params.query,
        role: params.role,
        page: params.page,
        limit: params.limit
      },
      error: error instanceof Error ? error.message : String(error)
    });
    return null;
  }
}

/**
 * Invalidates all cache entries for a specific user
 * @param userId - The user's unique identifier
 */
export async function invalidateUserCache(userId: string): Promise<void> {
  if (!userId) {
    throw new Error('userId is required to invalidate user cache');
  }
  
  try {
    const userKey = getUserCacheKey(userId);
    const profileKey = getUserProfileCacheKey(userId);
    const preferencesKey = getUserPreferencesCacheKey(userId);
    
    // Delete all related cache entries
    await Promise.all([
      redisClient.del(userKey),
      redisClient.del(profileKey),
      redisClient.del(preferencesKey)
    ]);
    
    logger.debug('User cache invalidated successfully', { userId });
  } catch (error) {
    logger.error('Failed to invalidate user cache', { 
      userId, 
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

/**
 * Invalidates user search cache entries
 */
export async function invalidateUserSearchCache(): Promise<void> {
  try {
    // Delete cache entries with the search namespace pattern
    const pattern = `${USER_SEARCH_CACHE_NAMESPACE}:*`;
    const keys = await redisClient.keys(pattern);
    
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
    
    logger.debug('User search cache invalidated successfully', { keysRemoved: keys.length });
  } catch (error) {
    logger.error('Failed to invalidate user search cache', { 
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

/**
 * Invalidates email-to-userId cache for a specific email
 * @param email - The email address to invalidate
 */
export async function invalidateUserEmailCache(email: string): Promise<void> {
  if (!email) {
    throw new Error('Email is required to invalidate user email cache');
  }
  
  try {
    const key = getUserEmailCacheKey(email);
    await redisClient.del(key);
    
    logger.debug('User email cache invalidated successfully', { email });
  } catch (error) {
    logger.error('Failed to invalidate user email cache', { 
      email, 
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}