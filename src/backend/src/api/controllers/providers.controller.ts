# src/backend/src/api/controllers/providers.controller.ts
import { Request, Response, NextFunction } from 'express'; // express@^4.18.2
import { ProvidersService } from '../../services/providers.service';
import {
  ProviderProfile,
  ProviderProfileUpdateDTO,
  Availability,
  ProviderAvailabilityUpdateDTO,
  ProviderSearchCriteria,
  ProviderMatchingCriteria,
  ProviderMatch,
  ServiceArea,
  ProviderReview,
  ReviewSubmissionDTO,
  TimeSlot,
  DateRange
} from '../../types/provider.types';
import {
  ProviderSearchParams,
  ProviderMatchingDTO,
  UpdateProviderProfileDTO,
  UpdateAvailabilityDTO,
  CreateProviderReviewDTO
} from '../../types/request.types';
import {
  ApiResponse,
  PaginatedResponse,
  ProviderResponse,
  ProviderDTO,
  AvailabilityResponse,
  AvailabilityDTO,
  ProviderMatchResponse,
  ProviderMatchDTO,
  ProviderReviewResponse,
  ProviderReviewDTO
} from '../../types/response.types';
import {
  ProviderServiceOptions,
  AvailabilityOptions,
  ReviewOptions,
  CalendarSyncResult
} from '../../interfaces/provider.interface';
import { ServiceType } from '../../constants/service-types';
import { errorFactory } from '../../utils/error-handler';
import { logger } from '../../utils/logger';

/**
 * Controller for handling provider-related API requests
 */
export default class ProvidersController {
  private providersService: ProvidersService;

  /**
   * Creates a new ProvidersController instance
   * @param providersService
   */
  constructor(providersService: ProvidersService) {
    this.providersService = providersService;
  }

  /**
   * Retrieves a provider's profile by ID
   * @param req
   * @param res
   * @param next
   */
  async getProviderProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract providerId from request parameters
      const { providerId } = req.params;

      // Extract query parameters for options (includeServiceAreas, includeReviews, includeAvailability)
      const includeServiceAreas = req.query.includeServiceAreas === 'true';
      const includeReviews = req.query.includeReviews === 'true';
      const includeAvailability = req.query.includeAvailability === 'true';

      // Create ProviderServiceOptions object from query parameters
      const options: ProviderServiceOptions = {
        includeServiceAreas,
        includeReviews,
        includeAvailability
      };

      // Call providersService.getProviderProfile with providerId and options
      const providerProfile: ProviderProfile = await this.providersService.getProviderProfile(providerId, options);

      // Format the provider profile as a ProviderResponse
      const response: ProviderResponse = {
        success: true,
        message: 'Provider profile retrieved successfully',
        data: providerProfile as any
      };

      // Send the formatted response to the client
      res.status(200).json(response);
    } catch (error) {
      // Catch and forward any errors to the error handling middleware
      next(error);
    }
  }

  /**
   * Updates a provider's profile information
   * @param req
   * @param res
   * @param next
   */
  async updateProviderProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract providerId from request parameters
      const { providerId } = req.params;

      // Extract update data from request body
      const updateData: UpdateProviderProfileDTO = req.body;

      // Call providersService.updateProviderProfile with providerId and update data
      const updatedProviderProfile: ProviderProfile = await this.providersService.updateProviderProfile(providerId, updateData);

      // Format the updated provider profile as a ProviderResponse
      const response: ProviderResponse = {
        success: true,
        message: 'Provider profile updated successfully',
        data: updatedProviderProfile as any
      };

      // Send the formatted response to the client
      res.status(200).json(response);
    } catch (error) {
      // Catch and forward any errors to the error handling middleware
      next(error);
    }
  }

  /**
   * Retrieves a provider's availability information
   * @param req
   * @param res
   * @param next
   */
  async getAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract providerId from request parameters
      const { providerId } = req.params;

      // Extract query parameters for options (startDate, endDate, serviceType)
      const startDateString = req.query.startDate as string | undefined;
      const endDateString = req.query.endDate as string | undefined;
      const serviceType = req.query.serviceType as ServiceType | undefined;

      // Parse date strings to Date objects if provided
      const startDate = startDateString ? new Date(startDateString) : undefined;
      const endDate = endDateString ? new Date(endDateString) : undefined;

      // Create AvailabilityOptions object from query parameters
      const options: AvailabilityOptions = {
        startDate,
        endDate,
        serviceType
      };

      // Call providersService.getAvailability with providerId and options
      const availability: Availability = await this.providersService.getAvailability(providerId, options);

      // Format the availability data as an AvailabilityResponse
      const response: AvailabilityResponse = {
        success: true,
        message: 'Provider availability retrieved successfully',
        data: availability as AvailabilityDTO
      };

      // Send the formatted response to the client
      res.status(200).json(response);
    } catch (error) {
      // Catch and forward any errors to the error handling middleware
      next(error);
    }
  }

  /**
   * Updates a provider's availability information
   * @param req
   * @param res
   * @param next
   */
  async updateAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract providerId from request parameters
      const { providerId } = req.params;

      // Extract update data from request body
      const updateData: UpdateAvailabilityDTO = req.body;

      // Call providersService.updateAvailability with providerId and update data
      const updatedAvailability: Availability = await this.providersService.updateAvailability(providerId, updateData);

      // Format the updated availability data as an AvailabilityResponse
      const response: AvailabilityResponse = {
        success: true,
        message: 'Provider availability updated successfully',
        data: updatedAvailability as AvailabilityDTO
      };

      // Send the formatted response to the client
      res.status(200).json(response);
    } catch (error) {
      // Catch and forward any errors to the error handling middleware
      next(error);
    }
  }

  /**
   * Searches for providers based on specified criteria
   * @param req
   * @param res
   * @param next
   */
  async searchProviders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract search criteria from request query parameters
      const {
        serviceTypes,
        location,
        radius,
        zipCode,
        availability,
        insurance,
        minRating,
        specializations,
        page,
        limit,
        sortBy,
        sortOrder
      } = req.query;

      // Parse and validate search parameters (serviceTypes, location, radius, etc.)
      const serviceTypesArray = (serviceTypes as string)?.split(',') as ServiceType[];
      const latitude = location ? parseFloat((location as string).split(',')[0]) : undefined;
      const longitude = location ? parseFloat((location as string).split(',')[1]) : undefined;
      const radiusNumber = radius ? parseFloat(radius as string) : undefined;
      const minRatingNumber = minRating ? parseFloat(minRating as string) : undefined;
      const specializationsArray = (specializations as string)?.split(',') as string[];
      const pageNumber = page ? parseInt(page as string, 10) : 1;
      const limitNumber = limit ? parseInt(limit as string, 10) : 10;

      // Convert string parameters to appropriate types (numbers, arrays, dates)
      const searchCriteria: ProviderSearchCriteria = {
        serviceTypes: serviceTypesArray,
        location: latitude && longitude ? { latitude, longitude, address: '', city: '', state: '', zipCode: '' } : null,
        distance: radiusNumber || null,
        zipCode: zipCode as string || null,
        availability: availability ? { startDate: new Date(), endDate: new Date() } : null, // TODO: Implement date parsing
        insurance: insurance as string || null,
        minRating: minRatingNumber || null,
        specializations: specializationsArray || null,
        page: pageNumber,
        limit: limitNumber,
        sortBy: sortBy as string || 'createdAt',
        sortOrder: sortOrder as 'asc' | 'desc' || 'desc'
      };

      // Call providersService.searchProviders with the search criteria
      const searchResults: PaginatedResponse<ProviderProfile> = await this.providersService.searchProviders(searchCriteria);

      // Format the search results as a PaginatedResponse<ProviderDTO>
      const response: PaginatedResponse<ProviderDTO> = {
        success: true,
        message: 'Providers retrieved successfully',
        data: searchResults.data as ProviderDTO[],
        pagination: searchResults.pagination
      };

      // Send the formatted response to the client
      res.status(200).json(response);
    } catch (error) {
      // Catch and forward any errors to the error handling middleware
      next(error);
    }
  }

  /**
   * Matches providers to a client based on specified criteria using AI
   * @param req
   * @param res
   * @param next
   */
  async matchProviders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract matching criteria from request body
      const matchingCriteria: ProviderMatchingDTO = req.body;

      // Validate required fields (clientId, serviceTypes)
      if (!matchingCriteria.clientId || !matchingCriteria.serviceTypes) {
        throw errorFactory.createValidationError('clientId and serviceTypes are required');
      }

      // Create ProviderMatchingCriteria object from request data
      const criteria: ProviderMatchingCriteria = {
        clientId: matchingCriteria.clientId,
        serviceTypes: matchingCriteria.serviceTypes,
        location: matchingCriteria.location,
        distance: matchingCriteria.distance,
        availability: matchingCriteria.requiredAvailability,
        insurance: matchingCriteria.insuranceAccepted,
        genderPreference: matchingCriteria.clientPreferences?.genderPreference,
        languagePreference: matchingCriteria.clientPreferences?.languagePreference,
        experienceLevel: matchingCriteria.clientPreferences?.experienceLevel,
        additionalPreferences: matchingCriteria.clientPreferences?.additionalPreferences || {}
      };

      // Call providersService.matchProviders with the matching criteria
      const providerMatches: ProviderMatch[] = await this.providersService.matchProviders(criteria);

      // Format the matching results as a ProviderMatchResponse
      const response: ProviderMatchResponse = {
        success: true,
        message: 'Providers matched successfully',
        data: {
          matches: providerMatches as ProviderMatchDTO[],
          totalMatches: providerMatches.length
        }
      };

      // Send the formatted response to the client
      res.status(200).json(response);
    } catch (error) {
      // Catch and forward any errors to the error handling middleware
      next(error);
    }
  }

  /**
   * Retrieves reviews for a specific provider
   * @param req
   * @param res
   * @param next
   */
  async getProviderReviews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract providerId from request parameters
      const { providerId } = req.params;

      // Extract query parameters for options (page, limit, sortBy, sortOrder, minRating, serviceType)
      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const sortBy = req.query.sortBy as string | undefined;
      const sortOrder = req.query.sortOrder as 'asc' | 'desc' | undefined;
      const minRating = req.query.minRating ? parseFloat(req.query.minRating as string) : undefined;
      const serviceType = req.query.serviceType as ServiceType | undefined;

      // Create ReviewOptions object from query parameters
      const options: ReviewOptions = {
        page,
        limit,
        sortBy,
        sortOrder,
        minRating,
        serviceType
      };

      // Call providersService.getProviderReviews with providerId and options
      const reviews: PaginatedResponse<ProviderReview> = await this.providersService.getProviderReviews(providerId, options);

      // Format the reviews as a PaginatedResponse<ProviderReviewDTO>
      const response: PaginatedResponse<ProviderReviewDTO> = {
        success: true,
        message: 'Provider reviews retrieved successfully',
        data: reviews.data as ProviderReviewDTO[],
        pagination: reviews.pagination
      };

      // Send the formatted response to the client
      res.status(200).json(response);
    } catch (error) {
      // Catch and forward any errors to the error handling middleware
      next(error);
    }
  }

  /**
   * Submits a new review for a provider
   * @param req
   * @param res
   * @param next
   */
  async submitReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract review data from request body
      const reviewData: CreateProviderReviewDTO = req.body;

      // Get clientId from authenticated user in request
      const clientId = 'user-123'; // TODO: Replace with actual user ID from authentication

      // Create ReviewSubmissionDTO with clientId and review data
      const reviewSubmission: ReviewSubmissionDTO = {
        providerId: reviewData.providerId,
        clientId: clientId,
        rating: reviewData.rating,
        comment: reviewData.comment,
        serviceDate: reviewData.serviceDate,
        serviceType: reviewData.serviceType
      };

      // Call providersService.submitReview with the review data
      const newReview: ProviderReview = await this.providersService.submitReview(reviewSubmission);

      // Format the submitted review as a ProviderReviewResponse
      const response: ProviderReviewResponse = {
        success: true,
        message: 'Review submitted successfully',
        data: newReview as ProviderReviewDTO
      };

      // Send the formatted response to the client
      res.status(201).json(response);
    } catch (error) {
      // Catch and forward any errors to the error handling middleware
      next(error);
    }
  }

  /**
   * Retrieves service areas for a specific provider
   * @param req
   * @param res
   * @param next
   */
  async getServiceAreas(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract providerId from request parameters
      const { providerId } = req.params;

      // Call providersService.getServiceAreas with providerId
      const serviceAreas: ServiceArea[] = await this.providersService.getServiceAreas(providerId);

      // Format the service areas as an ApiResponse
      const response: ApiResponse<ServiceArea[]> = {
        success: true,
        message: 'Service areas retrieved successfully',
        data: serviceAreas
      };

      // Send the formatted response to the client
      res.status(200).json(response);
    } catch (error) {
      // Catch and forward any errors to the error handling middleware
      next(error);
    }
  }

  /**
   * Updates service areas for a specific provider
   * @param req
   * @param res
   * @param next
   */
  async updateServiceAreas(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract providerId from request parameters
      const { providerId } = req.params;

      // Extract service areas data from request body
      const serviceAreas: ServiceArea[] = req.body;

      // Call providersService.updateServiceAreas with providerId and service areas data
      const updatedServiceAreas: ServiceArea[] = await this.providersService.updateServiceAreas(providerId, serviceAreas);

      // Format the updated service areas as an ApiResponse
      const response: ApiResponse<ServiceArea[]> = {
        success: true,
        message: 'Service areas updated successfully',
        data: updatedServiceAreas
      };

      // Send the formatted response to the client
      res.status(200).json(response);
    } catch (error) {
      // Catch and forward any errors to the error handling middleware
      next(error);
    }
  }

  /**
   * Synchronizes a provider's availability with their external calendar
   * @param req
   * @param res
   * @param next
   */
  async syncCalendar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract providerId from request parameters
      const { providerId } = req.params;

      // Extract calendar provider and calendar ID from request body
      const { calendarProvider, calendarId } = req.body;

      // Call providersService.syncCalendar with providerId, calendar provider, and calendar ID
      const syncResult: CalendarSyncResult = await this.providersService.syncCalendar(providerId, calendarProvider, calendarId);

      // Format the synchronization result as an ApiResponse
      const response: ApiResponse<CalendarSyncResult> = {
        success: true,
        message: 'Calendar synchronized successfully',
        data: syncResult
      };

      // Send the formatted response to the client
      res.status(200).json(response);
    } catch (error) {
      // Catch and forward any errors to the error handling middleware
      next(error);
    }
  }

  /**
   * Checks if a provider is available for a specific time slot
   * @param req
   * @param res
   * @param next
   */
  async checkAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract providerId from request parameters
      const { providerId } = req.params;

      // Extract startTime, endTime, and serviceType from request query
      const { startTime, endTime, serviceType } = req.query;

      // Parse date strings to Date objects
      const parsedStartTime = new Date(startTime as string);
      const parsedEndTime = new Date(endTime as string);

      // Call providersService.checkAvailabilityForBooking with providerId, startTime, endTime, and serviceType
      const isAvailable: boolean = await this.providersService.checkAvailabilityForBooking(
        providerId,
        parsedStartTime,
        parsedEndTime,
        serviceType as ServiceType
      );

      // Format the availability check result as an ApiResponse
      const response: ApiResponse<boolean> = {
        success: true,
        message: 'Availability check completed',
        data: isAvailable
      };

      // Send the formatted response to the client
      res.status(200).json(response);
    } catch (error) {
      // Catch and forward any errors to the error handling middleware
      next(error);
    }
  }

  /**
   * Finds providers that have availability within a specified date range
   * @param req
   * @param res
   * @param next
   */
  async findAvailableProviders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract startDate, endDate, and serviceType from request query
      const { startDate, endDate, serviceType } = req.query;

      // Parse date strings to Date objects
      const parsedStartDate = new Date(startDate as string);
      const parsedEndDate = new Date(endDate as string);

      // Create DateRange object from startDate and endDate
      const dateRange: DateRange = {
        startDate: parsedStartDate,
        endDate: parsedEndDate
      };

      // Call providersService.findProvidersByAvailability with dateRange and serviceType
      const availableProviders: ProviderProfile[] = await this.providersService.findProvidersByAvailability(
        dateRange,
        serviceType as ServiceType
      );

      // Format the available providers list as an ApiResponse
      const response: ApiResponse<ProviderProfile[]> = {
        success: true,
        message: 'Available providers retrieved successfully',
        data: availableProviders
      };

      // Send the formatted response to the client
      res.status(200).json(response);
    } catch (error) {
      // Catch and forward any errors to the error handling middleware
      next(error);
    }
  }
}