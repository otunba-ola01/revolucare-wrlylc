/**
 * Provider-related interfaces for the Revolucare platform
 * 
 * This file defines interfaces for provider-related operations including service methods,
 * repository operations, and data transformation functions. These interfaces establish
 * the contracts that provider service and repository implementations must adhere to.
 */

import { 
  ProviderProfile, 
  Availability, 
  ProviderReview, 
  ServiceArea, 
  ProviderSearchCriteria, 
  ProviderMatchingCriteria,
  ProviderMatch,
  ProviderProfileUpdateDTO,
  ProviderAvailabilityUpdateDTO,
  ReviewSubmissionDTO
} from '../types/provider.types';
import { PaginatedResponse } from '../types/response.types';
import { ServiceType } from '../constants/service-types';

/**
 * Interface defining the contract for the provider service
 * with methods for all provider management operations
 */
export interface IProviderService {
  /**
   * Gets a provider profile by ID
   * 
   * @param providerId - The ID of the provider to retrieve
   * @param options - Options for controlling what data to include
   * @returns Promise with the provider profile
   */
  getProviderProfile(providerId: string, options?: ProviderServiceOptions): Promise<ProviderProfile>;

  /**
   * Updates a provider profile
   * 
   * @param providerId - The ID of the provider to update
   * @param profileData - The updated profile information
   * @returns Promise with the updated provider profile
   */
  updateProviderProfile(providerId: string, profileData: ProviderProfileUpdateDTO): Promise<ProviderProfile>;

  /**
   * Gets provider availability
   * 
   * @param providerId - The ID of the provider
   * @param options - Options for filtering availability data
   * @returns Promise with the provider's availability
   */
  getAvailability(providerId: string, options?: AvailabilityOptions): Promise<Availability>;

  /**
   * Updates provider availability
   * 
   * @param providerId - The ID of the provider
   * @param availabilityData - The availability data to update
   * @returns Promise with the updated availability
   */
  updateAvailability(providerId: string, availabilityData: ProviderAvailabilityUpdateDTO): Promise<Availability>;

  /**
   * Searches providers based on criteria
   * 
   * @param criteria - The search criteria
   * @returns Promise with paginated provider results
   */
  searchProviders(criteria: ProviderSearchCriteria): Promise<PaginatedResponse<ProviderProfile>>;

  /**
   * Matches providers to client needs using AI algorithms
   * 
   * @param criteria - The matching criteria including client preferences
   * @returns Promise with matched providers and compatibility scores
   */
  matchProviders(criteria: ProviderMatchingCriteria): Promise<ProviderMatch[]>;

  /**
   * Gets reviews for a provider
   * 
   * @param providerId - The ID of the provider
   * @param options - Options for filtering and pagination
   * @returns Promise with paginated review results
   */
  getProviderReviews(providerId: string, options?: ReviewOptions): Promise<PaginatedResponse<ProviderReview>>;

  /**
   * Submits a new review for a provider
   * 
   * @param review - The review submission data
   * @returns Promise with the created review
   */
  submitReview(review: ReviewSubmissionDTO): Promise<ProviderReview>;

  /**
   * Gets service areas for a provider
   * 
   * @param providerId - The ID of the provider
   * @returns Promise with the provider's service areas
   */
  getServiceAreas(providerId: string): Promise<ServiceArea[]>;

  /**
   * Updates service areas for a provider
   * 
   * @param providerId - The ID of the provider
   * @param serviceAreas - The updated service areas
   * @returns Promise with the updated service areas
   */
  updateServiceAreas(providerId: string, serviceAreas: ServiceArea[]): Promise<ServiceArea[]>;

  /**
   * Synchronizes provider availability with external calendar
   * 
   * @param providerId - The ID of the provider
   * @param calendarType - The type of calendar to sync with (e.g., 'google', 'outlook')
   * @returns Promise with the sync result
   */
  syncCalendar(providerId: string, calendarType: string): Promise<CalendarSyncResult>;

  /**
   * Checks if a provider is available for a specific booking time
   * 
   * @param providerId - The ID of the provider
   * @param startTime - The start time of the booking
   * @param endTime - The end time of the booking
   * @param serviceType - The type of service for the booking
   * @returns Promise with availability status
   */
  checkAvailabilityForBooking(
    providerId: string, 
    startTime: Date, 
    endTime: Date, 
    serviceType: ServiceType
  ): Promise<boolean>;

  /**
   * Finds providers with availability in a specified time range
   * 
   * @param serviceType - The type of service
   * @param startTime - The start time of the availability window
   * @param endTime - The end time of the availability window
   * @param locationFilter - Optional location filter criteria
   * @returns Promise with available providers
   */
  findProvidersByAvailability(
    serviceType: ServiceType,
    startTime: Date,
    endTime: Date,
    locationFilter?: any
  ): Promise<ProviderProfile[]>;
}

/**
 * Interface defining the contract for the provider repository
 * with methods for database operations on provider data
 */
export interface IProviderRepository {
  /**
   * Finds a provider by ID
   * 
   * @param id - The provider ID
   * @returns Promise with the provider or null if not found
   */
  findById(id: string): Promise<ProviderProfile | null>;

  /**
   * Finds a provider by user ID
   * 
   * @param userId - The user ID associated with the provider
   * @returns Promise with the provider or null if not found
   */
  findByUserId(userId: string): Promise<ProviderProfile | null>;

  /**
   * Creates a new provider profile
   * 
   * @param providerData - The provider data to create
   * @returns Promise with the created provider
   */
  create(providerData: Partial<ProviderProfile>): Promise<ProviderProfile>;

  /**
   * Updates an existing provider profile
   * 
   * @param id - The provider ID
   * @param providerData - The provider data to update
   * @returns Promise with the updated provider
   */
  update(id: string, providerData: Partial<ProviderProfile>): Promise<ProviderProfile>;

  /**
   * Deletes a provider profile
   * 
   * @param id - The provider ID
   * @returns Promise with boolean indicating success
   */
  delete(id: string): Promise<boolean>;

  /**
   * Searches providers based on criteria
   * 
   * @param criteria - The search criteria
   * @returns Promise with paginated provider results
   */
  search(criteria: ProviderSearchCriteria): Promise<PaginatedResponse<ProviderProfile>>;

  /**
   * Updates the rating for a provider based on new reviews
   * 
   * @param id - The provider ID
   * @returns Promise with the updated provider
   */
  updateRating(id: string): Promise<ProviderProfile>;

  /**
   * Finds providers that offer a specific service type
   * 
   * @param serviceType - The service type to search for
   * @returns Promise with matching providers
   */
  findProvidersWithServiceType(serviceType: ServiceType): Promise<ProviderProfile[]>;

  /**
   * Finds providers in a specific geographic area
   * 
   * @param location - The location to search in (latitude, longitude)
   * @param radius - The radius in kilometers
   * @returns Promise with providers in the area
   */
  findProvidersInArea(location: { latitude: number; longitude: number }, radius: number): Promise<ProviderProfile[]>;

  /**
   * Finds providers that accept a specific insurance
   * 
   * @param insuranceName - The insurance name
   * @returns Promise with providers accepting the insurance
   */
  findProvidersWithInsurance(insuranceName: string): Promise<ProviderProfile[]>;

  /**
   * Invalidates cache for provider data
   * 
   * @param id - The provider ID or pattern to invalidate
   * @returns Promise indicating success
   */
  invalidateCache(id?: string): Promise<void>;
}

/**
 * Interface defining the contract for the provider availability repository
 * with methods for managing availability data
 */
export interface IProviderAvailabilityRepository {
  /**
   * Finds availability for a provider
   * 
   * @param providerId - The ID of the provider
   * @param options - Options for filtering availability data
   * @returns Promise with the provider's availability
   */
  findByProviderId(providerId: string, options?: AvailabilityOptions): Promise<Availability>;

  /**
   * Creates initial availability for a provider
   * 
   * @param providerId - The ID of the provider
   * @param availability - The availability data to create
   * @returns Promise with the created availability
   */
  create(providerId: string, availability: Partial<Availability>): Promise<Availability>;

  /**
   * Updates availability for a provider
   * 
   * @param providerId - The ID of the provider
   * @param availability - The availability data to update
   * @returns Promise with the updated availability
   */
  update(providerId: string, availability: Partial<Availability>): Promise<Availability>;

  /**
   * Finds available time slots for a provider
   * 
   * @param providerId - The ID of the provider
   * @param startDate - The start date for the search
   * @param endDate - The end date for the search
   * @param serviceType - Optional service type filter
   * @returns Promise with available time slots
   */
  findAvailableTimeSlots(
    providerId: string,
    startDate: Date,
    endDate: Date,
    serviceType?: ServiceType
  ): Promise<Array<{ startTime: Date; endTime: Date; serviceType: ServiceType }>>;

  /**
   * Checks if a provider is available at a specific time
   * 
   * @param providerId - The ID of the provider
   * @param startTime - The start time to check
   * @param endTime - The end time to check
   * @param serviceType - The service type
   * @returns Promise with availability status
   */
  checkAvailability(
    providerId: string,
    startTime: Date,
    endTime: Date,
    serviceType: ServiceType
  ): Promise<boolean>;
}

/**
 * Interface defining the contract for the AI-powered provider matching service
 */
export interface IProviderMatchingService {
  /**
   * Matches providers to client needs using AI algorithms
   * 
   * @param criteria - The matching criteria including client preferences
   * @returns Promise with matched providers and compatibility scores
   */
  matchProviders(criteria: ProviderMatchingCriteria): Promise<ProviderMatch[]>;

  /**
   * Calculates compatibility score between a client and provider
   * 
   * @param clientId - The ID of the client
   * @param providerId - The ID of the provider
   * @param serviceType - The service type
   * @returns Promise with the compatibility score and factors
   */
  calculateCompatibilityScore(
    clientId: string,
    providerId: string,
    serviceType: ServiceType
  ): Promise<{ score: number; factors: Record<string, number> }>;

  /**
   * Gets the factors used in provider matching algorithm
   * 
   * @returns Promise with the match factors and their weights
   */
  getMatchFactors(): Promise<Record<string, { description: string; weight: number }>>;
}

/**
 * Options for provider service operations to control included data
 */
export interface ProviderServiceOptions {
  /**
   * Whether to include service areas in the response
   */
  includeServiceAreas?: boolean;

  /**
   * Whether to include reviews in the response
   */
  includeReviews?: boolean;

  /**
   * Whether to include availability in the response
   */
  includeAvailability?: boolean;
}

/**
 * Options for filtering provider availability data
 */
export interface AvailabilityOptions {
  /**
   * Start date for the availability window
   */
  startDate?: Date;

  /**
   * End date for the availability window
   */
  endDate?: Date;

  /**
   * Filter by service type
   */
  serviceType?: ServiceType;
}

/**
 * Options for retrieving and filtering provider reviews
 */
export interface ReviewOptions {
  /**
   * Page number for pagination
   */
  page?: number;

  /**
   * Number of items per page
   */
  limit?: number;

  /**
   * Field to sort by
   */
  sortBy?: string;

  /**
   * Sort order (ascending or descending)
   */
  sortOrder?: 'asc' | 'desc';

  /**
   * Minimum rating filter
   */
  minRating?: number;

  /**
   * Filter by service type
   */
  serviceType?: ServiceType;
}

/**
 * Result structure for calendar synchronization operations
 */
export interface CalendarSyncResult {
  /**
   * Whether the sync was successful
   */
  success: boolean;

  /**
   * Message describing the result
   */
  message: string;

  /**
   * Additional details about the sync operation
   */
  details?: any;
}