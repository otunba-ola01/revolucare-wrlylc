import { get, post, put, delete as deleteRequest } from './client';
import { formatQueryParams } from './client';
import {
  Provider,
  ProviderProfileUpdateDTO,
  ProviderAvailability,
  ProviderAvailabilityUpdateDTO,
  ProviderSearchCriteria,
  ProviderMatchingCriteria,
  ProviderMatch,
  ServiceArea,
  ProviderReview,
  ReviewSubmissionDTO,
  TimeSlot,
  DateRange,
  GeoLocation,
  CalendarSyncRequest,
  CalendarSyncResponse
} from '../../types/provider';

/**
 * Fetches a provider's profile by ID with optional related data
 * 
 * @param id Provider ID to fetch
 * @param options Options to include related data (service areas, reviews, availability)
 * @returns Promise resolving to the provider profile
 */
export async function getProviderProfile(
  id: string,
  options: { 
    includeServiceAreas?: boolean, 
    includeReviews?: boolean,
    includeAvailability?: boolean 
  } = {}
): Promise<Provider> {
  const params = formatQueryParams(options);
  return get<Provider>(`/api/providers/${id}${params}`);
}

/**
 * Updates a provider's profile information
 * 
 * @param id Provider ID to update
 * @param data Provider profile data to update
 * @returns Promise resolving to the updated provider profile
 */
export async function updateProviderProfile(
  id: string,
  data: ProviderProfileUpdateDTO
): Promise<Provider> {
  return put<Provider>(`/api/providers/${id}`, data);
}

/**
 * Fetches a provider's availability information with optional date range and service type filters
 * 
 * @param id Provider ID to fetch availability for
 * @param options Options to filter availability by date range and service type
 * @returns Promise resolving to the provider availability data
 */
export async function getAvailability(
  id: string,
  options: { 
    startDate?: Date | string, 
    endDate?: Date | string,
    serviceType?: string 
  } = {}
): Promise<ProviderAvailability> {
  const formattedOptions = { ...options };
  
  // Convert Date objects to ISO strings if needed
  if (formattedOptions.startDate instanceof Date) {
    formattedOptions.startDate = formattedOptions.startDate.toISOString();
  }
  if (formattedOptions.endDate instanceof Date) {
    formattedOptions.endDate = formattedOptions.endDate.toISOString();
  }
  
  const params = formatQueryParams(formattedOptions);
  return get<ProviderAvailability>(`/api/providers/${id}/availability${params}`);
}

/**
 * Updates a provider's availability information
 * 
 * @param id Provider ID to update availability for
 * @param data Availability data to update
 * @returns Promise resolving to the updated availability data
 */
export async function updateAvailability(
  id: string,
  data: ProviderAvailabilityUpdateDTO
): Promise<ProviderAvailability> {
  return put<ProviderAvailability>(`/api/providers/${id}/availability`, data);
}

/**
 * Searches for providers based on specified criteria
 * 
 * @param criteria Search criteria for providers
 * @returns Promise resolving to paginated provider search results
 */
export async function searchProviders(
  criteria: ProviderSearchCriteria
): Promise<{ providers: Provider[], total: number, page: number, limit: number }> {
  const params = formatQueryParams(criteria);
  return get<{ providers: Provider[], total: number, page: number, limit: number }>(`/api/providers/search${params}`);
}

/**
 * Matches providers to a client based on specified criteria using AI
 * 
 * @param criteria Matching criteria for AI-driven provider matching
 * @returns Promise resolving to provider matching results
 */
export async function matchProviders(
  criteria: ProviderMatchingCriteria
): Promise<{ matches: ProviderMatch[], total: number }> {
  return post<{ matches: ProviderMatch[], total: number }>('/api/providers/match', criteria);
}

/**
 * Fetches reviews for a specific provider with optional filtering and pagination
 * 
 * @param id Provider ID to fetch reviews for
 * @param options Options for filtering and paginating reviews
 * @returns Promise resolving to paginated provider reviews
 */
export async function getProviderReviews(
  id: string,
  options: { 
    page?: number, 
    limit?: number, 
    sortBy?: string, 
    sortOrder?: 'asc' | 'desc',
    minRating?: number,
    serviceType?: string
  } = {}
): Promise<{ reviews: ProviderReview[], total: number, page: number, limit: number }> {
  const params = formatQueryParams(options);
  return get<{ reviews: ProviderReview[], total: number, page: number, limit: number }>(`/api/providers/${id}/reviews${params}`);
}

/**
 * Submits a new review for a provider
 * 
 * @param data Review data to submit
 * @returns Promise resolving to the submitted review
 */
export async function submitReview(
  data: ReviewSubmissionDTO
): Promise<ProviderReview> {
  return post<ProviderReview>(`/api/providers/${data.providerId}/reviews`, data);
}

/**
 * Fetches service areas for a specific provider
 * 
 * @param id Provider ID to fetch service areas for
 * @returns Promise resolving to the provider's service areas
 */
export async function getServiceAreas(
  id: string
): Promise<ServiceArea[]> {
  return get<ServiceArea[]>(`/api/providers/${id}/service-areas`);
}

/**
 * Updates service areas for a specific provider
 * 
 * @param id Provider ID to update service areas for
 * @param data Service areas data to update
 * @returns Promise resolving to the updated service areas
 */
export async function updateServiceAreas(
  id: string,
  data: ServiceArea[]
): Promise<ServiceArea[]> {
  return put<ServiceArea[]>(`/api/providers/${id}/service-areas`, data);
}

/**
 * Synchronizes a provider's availability with their external calendar
 * 
 * @param id Provider ID to sync calendar for
 * @param data Calendar sync request data
 * @returns Promise resolving to the synchronization result
 */
export async function syncCalendar(
  id: string,
  data: CalendarSyncRequest
): Promise<CalendarSyncResponse> {
  return post<CalendarSyncResponse>(`/api/providers/${id}/sync-calendar`, data);
}

/**
 * Checks if a provider is available for a specific time slot
 * 
 * @param id Provider ID to check availability for
 * @param params Time slot parameters to check
 * @returns Promise resolving to availability check result
 */
export async function checkAvailability(
  id: string,
  params: { 
    startTime: Date | string, 
    endTime: Date | string,
    serviceType: string 
  }
): Promise<{ available: boolean, conflictingBookings?: TimeSlot[] }> {
  const formattedParams = { ...params };
  
  // Convert Date objects to ISO strings if needed
  if (formattedParams.startTime instanceof Date) {
    formattedParams.startTime = formattedParams.startTime.toISOString();
  }
  if (formattedParams.endTime instanceof Date) {
    formattedParams.endTime = formattedParams.endTime.toISOString();
  }
  
  const queryParams = formatQueryParams(formattedParams);
  return get<{ available: boolean, conflictingBookings?: TimeSlot[] }>(`/api/providers/${id}/check-availability${queryParams}`);
}

/**
 * Finds providers that have availability within a specified date range
 * 
 * @param params Date range and optional service type to find available providers
 * @returns Promise resolving to list of available providers
 */
export async function findAvailableProviders(
  params: { 
    startDate: Date | string, 
    endDate: Date | string,
    serviceType?: string 
  }
): Promise<Provider[]> {
  const formattedParams = { ...params };
  
  // Convert Date objects to ISO strings if needed
  if (formattedParams.startDate instanceof Date) {
    formattedParams.startDate = formattedParams.startDate.toISOString();
  }
  if (formattedParams.endDate instanceof Date) {
    formattedParams.endDate = formattedParams.endDate.toISOString();
  }
  
  const queryParams = formatQueryParams(formattedParams);
  return get<Provider[]>(`/api/providers/available${queryParams}`);
}

export {
  getProviderProfile,
  updateProviderProfile,
  getAvailability,
  updateAvailability,
  searchProviders,
  matchProviders,
  getProviderReviews,
  submitReview,
  getServiceAreas,
  updateServiceAreas,
  syncCalendar,
  checkAvailability,
  findAvailableProviders
};