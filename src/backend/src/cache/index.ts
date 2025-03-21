/**
 * Main entry point for the caching system in the Revolucare platform.
 * This file exports all cache-related functionality from individual cache modules,
 * providing a centralized access point for caching operations across the application.
 */

// Import analytics caching functionality
import * as analyticsCacheModule from './analytics.cache'; // analytics.cache@1.0.0
// Import provider availability caching functionality
import * as availabilityCacheModule from './availability.cache'; // availability.cache@1.0.0
// Import care plan caching functionality
import * as carePlanCacheModule from './care-plan.cache'; // care-plan.cache@1.0.0
// Import provider caching functionality
import * as providerCacheModule from './provider.cache'; // provider.cache@1.0.0
// Import services plan caching functionality
import * as servicesPlanCacheModule from './services-plan.cache'; // services-plan.cache@1.0.0
// Import user caching functionality
import * as userCacheModule from './user.cache'; // user.cache@1.0.0

/**
 * Export analytics caching functionality for metrics and dashboards
 */
export const analyticsCache = {
  getMetrics: analyticsCacheModule.getMetrics,
  setMetrics: analyticsCacheModule.setMetrics,
  getDashboard: analyticsCacheModule.getDashboard,
  setDashboard: analyticsCacheModule.setDashboard,
  invalidateMetrics: analyticsCacheModule.invalidateMetrics,
  invalidateDashboard: analyticsCacheModule.invalidateDashboard
};

/**
 * Export function to generate availability cache keys
 */
export const getAvailabilityCacheKey = availabilityCacheModule.getAvailabilityCacheKey;

/**
 * Export function to generate time slots cache keys
 */
export const getTimeSlotsCacheKey = availabilityCacheModule.getTimeSlotsCacheKey;

/**
 * Export function to cache provider availability data
 */
export const cacheAvailability = availabilityCacheModule.cacheAvailability;

/**
 * Export function to retrieve cached provider availability data
 */
export const getCachedAvailability = availabilityCacheModule.getCachedAvailability;

/**
 * Export function to cache provider time slots
 */
export const cacheTimeSlots = availabilityCacheModule.cacheTimeSlots;

/**
 * Export function to retrieve cached provider time slots
 */
export const getCachedTimeSlots = availabilityCacheModule.getCachedTimeSlots;

/**
 * Export function to invalidate provider availability cache
 */
export const invalidateAvailabilityCache = availabilityCacheModule.invalidateAvailabilityCache;

/**
 * Export function to invalidate provider time slots cache
 */
export const invalidateTimeSlotsCache = availabilityCacheModule.invalidateTimeSlotsCache;

/**
 * Export function to generate care plan cache keys
 */
export const getCarePlanCacheKey = carePlanCacheModule.getCarePlanCacheKey;

/**
 * Export function to generate client care plans list cache keys
 */
export const getClientCarePlansListCacheKey = carePlanCacheModule.getClientCarePlansListCacheKey;

/**
 * Export function to generate care plan options cache keys
 */
export const getCarePlanOptionsCacheKey = carePlanCacheModule.getCarePlanOptionsCacheKey;

/**
 * Export function to cache a care plan
 */
export const cacheCarePlan = carePlanCacheModule.cacheCarePlan;

/**
 * Export function to retrieve a cached care plan
 */
export const getCachedCarePlan = carePlanCacheModule.getCachedCarePlan;

/**
 * Export function to cache a client's care plans list
 */
export const cacheClientCarePlans = carePlanCacheModule.cacheClientCarePlans;

/**
 * Export function to retrieve cached client care plans
 */
export const getCachedClientCarePlans = carePlanCacheModule.getCachedClientCarePlans;

/**
 * Export function to cache care plan options
 */
export const cacheCarePlanOptions = carePlanCacheModule.cacheCarePlanOptions;

/**
 * Export function to retrieve cached care plan options
 */
export const getCachedCarePlanOptions = carePlanCacheModule.getCachedCarePlanOptions;

/**
 * Export function to invalidate care plan cache
 */
export const invalidateCarePlanCache = carePlanCacheModule.invalidateCarePlanCache;

/**
 * Export function to invalidate client care plans cache
 */
export const invalidateClientCarePlansCache = carePlanCacheModule.invalidateClientCarePlansCache;

/**
 * Export function to invalidate care plan options cache
 */
export const invalidateCarePlanOptionsCache = carePlanCacheModule.invalidateCarePlanOptionsCache;

/**
 * Export function to generate provider cache keys
 */
export const getProviderCacheKey = providerCacheModule.getProviderCacheKey;

/**
 * Export function to generate provider search cache keys
 */
export const getProviderSearchCacheKey = providerCacheModule.getProviderSearchCacheKey;

/**
 * Export function to cache provider profiles
 */
export const cacheProviderProfile = providerCacheModule.cacheProviderProfile;

/**
 * Export function to retrieve cached provider profiles
 */
export const getCachedProviderProfile = providerCacheModule.getCachedProviderProfile;

/**
 * Export function to cache provider search results
 */
export const cacheProviderSearchResults = providerCacheModule.cacheProviderSearchResults;

/**
 * Export function to retrieve cached provider search results
 */
export const getCachedProviderSearchResults = providerCacheModule.getCachedProviderSearchResults;

/**
 * Export function to cache providers by service type
 */
export const cacheProvidersByServiceType = providerCacheModule.cacheProvidersByServiceType;

/**
 * Export function to retrieve cached providers by service type
 */
export const getCachedProvidersByServiceType = providerCacheModule.getCachedProvidersByServiceType;

/**
 * Export function to invalidate provider cache
 */
export const invalidateProviderCache = providerCacheModule.invalidateProviderCache;

/**
 * Export function to invalidate provider search cache
 */
export const invalidateProviderSearchCache = providerCacheModule.invalidateProviderSearchCache;

/**
 * Export function to invalidate service type cache
 */
export const invalidateServiceTypeCache = providerCacheModule.invalidateServiceTypeCache;

/**
 * Export function to generate services plan cache keys
 */
export const getServicesPlanCacheKey = servicesPlanCacheModule.getServicesPlanCacheKey;

/**
 * Export function to generate services plan search cache keys
 */
export const getServicesPlanFilterCacheKey = servicesPlanCacheModule.getServicesPlanFilterCacheKey;

/**
 * Export function to generate needs assessment cache keys
 */
export const getNeedsAssessmentCacheKey = servicesPlanCacheModule.getNeedsAssessmentCacheKey;

/**
 * Export function to generate client services plans cache keys
 */
export const getClientServicesPlansCacheKey = servicesPlanCacheModule.getClientServicesPlansCacheKey;

/**
 * Export function to cache services plan objects
 */
export const cacheServicesPlan = servicesPlanCacheModule.cacheServicesPlan;

/**
 * Export function to retrieve cached services plans
 */
export const getCachedServicesPlan = servicesPlanCacheModule.getCachedServicesPlan;

/**
 * Export function to cache needs assessment objects
 */
export const cacheNeedsAssessment = servicesPlanCacheModule.cacheNeedsAssessment;

/**
 * Export function to retrieve cached needs assessments
 */
export const getCachedNeedsAssessment = servicesPlanCacheModule.getCachedNeedsAssessment;

/**
 * Export function to cache client services plans lists
 */
export const cacheClientServicesPlans = servicesPlanCacheModule.cacheClientServicesPlans;

/**
 * Export function to retrieve cached client services plans
 */
export const getCachedClientServicesPlans = servicesPlanCacheModule.getCachedClientServicesPlans;

/**
 * Export function to cache services plan search results
 */
export const cacheServicesPlanSearchResults = servicesPlanCacheModule.cacheServicesPlanSearchResults;

/**
 * Export function to retrieve cached services plan search results
 */
export const getCachedServicesPlanSearchResults = servicesPlanCacheModule.getCachedServicesPlanSearchResults;

/**
 * Export function to invalidate services plan cache
 */
export const invalidateServicesPlanCache = servicesPlanCacheModule.invalidateServicesPlanCache;

/**
 * Export function to invalidate needs assessment cache
 */
export const invalidateNeedsAssessmentCache = servicesPlanCacheModule.invalidateNeedsAssessmentCache;

/**
 * Export function to invalidate client services plans cache
 */
export const invalidateClientServicesPlanCache = servicesPlanCacheModule.invalidateClientServicesPlanCache;

/**
 * Export function to invalidate services plan search cache
 */
export const invalidateServicesPlanSearchCache = servicesPlanCacheModule.invalidateServicesPlanSearchCache;

/**
 * Export function to generate user cache keys
 */
export const getUserCacheKey = userCacheModule.getUserCacheKey;

/**
 * Export function to generate user search cache keys
 */
export const getUserSearchCacheKey = userCacheModule.getUserSearchCacheKey;

/**
 * Export function to cache user data
 */
export const cacheUser = userCacheModule.cacheUser;

/**
 * Export function to retrieve cached user data
 */
export const getCachedUser = userCacheModule.getCachedUser;

/**
 * Export function to cache user ID by email
 */
export const cacheUserByEmail = userCacheModule.cacheUserByEmail;

/**
 * Export function to retrieve cached user ID by email
 */
export const getCachedUserIdByEmail = userCacheModule.getCachedUserIdByEmail;

/**
 * Export function to cache user with profile data
 */
export const cacheUserWithProfile = userCacheModule.cacheUserWithProfile;

/**
 * Export function to retrieve cached user with profile data
 */
export const getCachedUserWithProfile = userCacheModule.getCachedUserWithProfile;

/**
 * Export function to cache user preferences
 */
export const cacheUserPreferences = userCacheModule.cacheUserPreferences;

/**
 * Export function to retrieve cached user preferences
 */
export const getCachedUserPreferences = userCacheModule.getCachedUserPreferences;

/**
 * Export function to cache user search results
 */
export const cacheUserSearchResults = userCacheModule.cacheUserSearchResults;

/**
 * Export function to retrieve cached user search results
 */
export const getCachedUserSearchResults = userCacheModule.getCachedUserSearchResults;

/**
 * Export function to invalidate user cache entries
 */
export const invalidateUserCache = userCacheModule.invalidateUserCache;

/**
 * Export function to invalidate user search cache entries
 */
export const invalidateUserSearchCache = userCacheModule.invalidateUserSearchCache;

/**
 * Export function to invalidate user email cache entries
 */
export const invalidateUserEmailCache = userCacheModule.invalidateUserEmailCache;