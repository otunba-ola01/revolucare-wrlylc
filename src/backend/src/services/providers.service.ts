import {
  IProviderService,
  ProviderServiceOptions,
  AvailabilityOptions,
  ReviewOptions,
  CalendarSyncResult,
} from '../interfaces/provider.interface';
import { ProviderProfileRepository } from '../repositories/provider-profile.repository';
import { ProviderAvailabilityRepository } from '../repositories/provider-availability.repository';
import { ProviderMatchingService } from './ai/provider-matching.service';
import { CalendarIntegrationService } from './calendar/calendar-integration.service';
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
  ReviewSubmissionDTO,
  TimeSlot,
  DateRange,
} from '../types/provider.types';
import { PaginatedResponse } from '../types/response.types';
import { ServiceType } from '../constants/service-types';
import { ProviderServiceOptions, AvailabilityOptions, ReviewOptions, CalendarSyncResult } from '../interfaces/provider.interface'; // Ensure these are correctly imported
import { errorFactory } from '../utils/error-handler';
import { logger } from '../utils/logger';
import { validateReviewSubmission } from '../utils/validation'; // Ensure this is correctly imported

/**
 * Service implementation for managing provider-related functionality in the Revolucare platform
 */
export class ProvidersService implements IProviderService {
  /**
   * Creates a new ProvidersService instance
   * @param providerRepository
   * @param availabilityRepository
   * @param providerMatchingService
   * @param calendarService
   */
  constructor(
    private providerRepository: ProviderProfileRepository,
    private availabilityRepository: ProviderAvailabilityRepository,
    private providerMatchingService: ProviderMatchingService,
    private calendarService: CalendarIntegrationService
  ) {
    // Store the provided repositories and services as instance properties
    this.providerRepository = providerRepository;
    this.availabilityRepository = availabilityRepository;
    this.providerMatchingService = providerMatchingService;
    this.calendarService = calendarService;
    // Initialize the service with dependencies
  }

  /**
   * Retrieves a provider's profile by ID
   * @param providerId - The ID of the provider to retrieve
   * @param options - Options for controlling what data to include
   * @returns The provider profile
   */
  async getProviderProfile(providerId: string, options?: ProviderServiceOptions): Promise<ProviderProfile> {
    logger.info(`Retrieving provider profile with ID: ${providerId}`);

    // Call providerRepository.findById to get the provider profile
    const providerProfile = await this.providerRepository.findById(providerId);

    // If provider not found, throw a NotFoundError
    if (!providerProfile) {
      throw errorFactory.createNotFoundError(`Provider profile not found with ID: ${providerId}`);
    }

    return providerProfile;
  }

  /**
   * Updates a provider's profile information
   * @param providerId - The ID of the provider to update
   * @param updateData - The updated profile information
   * @returns The updated provider profile
   */
  async updateProviderProfile(providerId: string, updateData: ProviderProfileUpdateDTO): Promise<ProviderProfile> {
    logger.info(`Updating provider profile with ID: ${providerId}`);

    // Call providerRepository.update with the validated update data
    const updatedProviderProfile = await this.providerRepository.update(providerId, updateData);

    // Return the updated provider profile
    return updatedProviderProfile;
  }

  /**
   * Retrieves a provider's availability information
   * @param providerId - The ID of the provider
   * @param options - Options for filtering availability data
   * @returns The provider's availability data
   */
  async getAvailability(providerId: string, options?: AvailabilityOptions): Promise<Availability> {
    logger.info(`Retrieving availability for provider with ID: ${providerId}`);

    // Call availabilityRepository.findByProviderId to get availability data
    const availability = await this.availabilityRepository.findByProviderId(providerId);

    // If no availability record exists, create a default availability record
    if (!availability) {
      throw errorFactory.createNotFoundError(`Availability not found for provider with ID: ${providerId}`);
    }

    return availability;
  }

  /**
   * Updates a provider's availability information
   * @param providerId - The ID of the provider
   * @param updateData - The availability data to update
   * @returns The updated availability data
   */
  async updateAvailability(providerId: string, updateData: ProviderAvailabilityUpdateDTO): Promise<Availability> {
    logger.info(`Updating availability for provider with ID: ${providerId}`);

    // Call availabilityRepository.update with the validated update data
    const updatedAvailability = await this.availabilityRepository.update(providerId, updateData);

    // Return the updated availability data
    return updatedAvailability;
  }

  /**
   * Searches for providers based on specified criteria
   * @param criteria - The search criteria
   * @returns Paginated list of matching providers
   */
  async searchProviders(criteria: ProviderSearchCriteria): Promise<PaginatedResponse<ProviderProfile>> {
    logger.info(`Searching providers with criteria: ${JSON.stringify(criteria)}`);

    // Call providerRepository.search with the validated criteria
    const searchResults = await this.providerRepository.search(criteria);

    // Return the paginated response with matching providers
    return searchResults;
  }

  /**
   * Matches providers to a client based on specified criteria using AI
   * @param criteria - The matching criteria
   * @returns Array of matched providers with compatibility scores
   */
  async matchProviders(criteria: ProviderMatchingCriteria): Promise<ProviderMatch[]> {
    logger.info(`Matching providers with criteria: ${JSON.stringify(criteria)}`);

    // Call providerMatchingService.matchProviders with the validated criteria
    const providerMatches = await this.providerMatchingService.matchProviders(criteria);

    // Return the array of provider matches with compatibility scores and available slots
    return providerMatches;
  }

  /**
   * Retrieves reviews for a specific provider
   * @param providerId - The ID of the provider
   * @param options - Options for filtering and pagination
   * @returns Paginated list of provider reviews
   */
  async getProviderReviews(providerId: string, options?: ReviewOptions): Promise<PaginatedResponse<ProviderReview>> {
    logger.info(`Retrieving reviews for provider with ID: ${providerId}`);

    // Query the database for reviews matching the provider ID and options
    const reviews = await this.providerRepository.getProviderReviews(providerId, options);

    // Return the paginated response with matching reviews
    return reviews;
  }

  /**
   * Submits a new review for a provider
   * @param reviewData - The review submission data
   * @returns The submitted review
   */
  async submitReview(reviewData: ReviewSubmissionDTO): Promise<ProviderReview> {
    logger.info(`Submitting review for provider with ID: ${reviewData.providerId}`);

    // Create the review record in the database
    const newReview = await this.providerRepository.submitReview(reviewData);

    // Return the created review
    return newReview;
  }

  /**
   * Retrieves service areas for a specific provider
   * @param providerId - The ID of the provider
   * @returns Array of provider service areas
   */
  async getServiceAreas(providerId: string): Promise<ServiceArea[]> {
    logger.info(`Retrieving service areas for provider with ID: ${providerId}`);

    // Query the database for service areas matching the provider ID
    const serviceAreas = await this.providerRepository.getServiceAreas(providerId);

    // Return the array of service areas
    return serviceAreas;
  }

  /**
   * Updates service areas for a specific provider
   * @param providerId - The ID of the provider
   * @param serviceAreas - The updated service areas
   * @returns The updated service areas
   */
  async updateServiceAreas(providerId: string, serviceAreas: ServiceArea[]): Promise<ServiceArea[]> {
    logger.info(`Updating service areas for provider with ID: ${providerId}`);

    // Create new service areas with the provided data
    const updatedServiceAreas = await this.providerRepository.updateServiceAreas(providerId, serviceAreas);

    // Return the updated service areas
    return updatedServiceAreas;
  }

  /**
   * Synchronizes a provider's availability with their external calendar
   * @param providerId - The ID of the provider
   * @param calendarProvider - The type of calendar to sync with (e.g., 'google', 'outlook')
   * @param calendarId - The calendar ID to sync with
   * @returns Result of the calendar synchronization
   */
  async syncCalendar(providerId: string, calendarProvider: string, calendarId: string): Promise<CalendarSyncResult> {
    logger.info(`Synchronizing calendar for provider with ID: ${providerId}`);

    // Call calendarService.syncProviderAvailability with the availability data
    const syncResult = await this.calendarService.syncProviderAvailability(providerId, calendarProvider, calendarId);

    // Return the synchronization result
    return syncResult;
  }

  /**
   * Checks if a provider is available for a specific time slot
   * @param providerId - The ID of the provider
   * @param startTime - The start time of the booking
   * @param endTime - The end time of the booking
   * @param serviceType - The type of service for the booking
   * @returns True if the provider is available, false otherwise
   */
  async checkAvailabilityForBooking(providerId: string, startTime: Date, endTime: Date, serviceType: ServiceType): Promise<boolean> {
    logger.info(`Checking availability for provider with ID: ${providerId}`);

    // Call availabilityRepository.checkAvailability with the parameters
    const isAvailable = await this.availabilityRepository.checkAvailability(providerId, startTime, endTime, serviceType);

    // Return the availability status (true/false)
    return isAvailable;
  }

  /**
   * Finds providers that have availability within a specified date range
   * @param dateRange - Date range to check availability within
   * @param serviceType - Service type to check availability for
   * @returns Array of provider IDs that have availability
   */
  async findProvidersByAvailability(dateRange: DateRange, serviceType: ServiceType): Promise<ProviderProfile[]> {
    logger.info(`Finding providers by availability for service type: ${serviceType}`);

    // Call availabilityRepository.findProvidersByAvailability with the parameters
    const providerIds = await this.availabilityRepository.findProvidersByAvailability(dateRange, serviceType);

    // Return the array of provider IDs that have availability
    return providerIds;
  }

  /**
   * Validates that a provider exists in the system
   * @param providerId - The ID of the provider
   * @returns The provider profile if found
   */
  private async validateProviderExists(providerId: string): Promise<ProviderProfile> {
    logger.debug(`Validating provider existence with ID: ${providerId}`);

    // Call providerRepository.findById to check if provider exists
    const provider = await this.providerRepository.findById(providerId);

    // If provider not found, throw a NotFoundError
    if (!provider) {
      throw errorFactory.createNotFoundError(`Provider profile not found with ID: ${providerId}`);
    }

    // Return the provider profile
    return provider;
  }
}