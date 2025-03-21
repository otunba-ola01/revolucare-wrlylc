import { v4 as uuidv4 } from 'uuid'; // uuid@^9.0.0
import { prisma } from '../config/database';
import { redisClient, getCacheKey } from '../config/redis';
import {
  Booking,
  BookingStatus,
  CreateBookingDTO,
  UpdateBookingDTO,
  BookingFilterParams,
  BookingResponse,
  BookingListResponse,
  CancellationInfo,
  RescheduleInfo
} from '../models/booking.model';
import { TimeSlot, DateRange } from '../types/provider.types';
import { ProviderAvailabilityRepository } from './provider-availability.repository';
import { errorFactory } from '../utils/error-handler';
import { logger } from '../utils/logger';
import { isOverlapping, calculateDuration } from '../utils/date-time';

/**
 * Generates a cache key for a specific booking
 * @param bookingId - The ID of the booking
 * @returns Formatted cache key for the booking
 */
function getBookingCacheKey(bookingId: string): string {
  // Use getCacheKey utility to generate a standardized cache key
  // Format with 'booking' namespace and bookingId
  return getCacheKey('booking', bookingId);
}

/**
 * Generates a cache key for a filtered list of bookings
 * @param filterParams - BookingFilterParams
 * @returns Formatted cache key for the filtered bookings list
 */
function getBookingsListCacheKey(filterParams: BookingFilterParams): string {
  // Use getCacheKey utility to generate a standardized cache key
  // Format with 'bookings' namespace and serialized filter parameters
  return getCacheKey('bookings', JSON.stringify(filterParams));
}

/**
 * Repository class for managing booking data in the database
 */
export class BookingRepository {
  private providerAvailabilityRepository: ProviderAvailabilityRepository;

  /**
   * Initializes a new instance of the BookingRepository
   * @param providerAvailabilityRepository - ProviderAvailabilityRepository
   */
  constructor(providerAvailabilityRepository: ProviderAvailabilityRepository) {
    // Initialize the repository with database connection
    // Store the provider availability repository for availability checks
    this.providerAvailabilityRepository = providerAvailabilityRepository;
  }

  /**
   * Retrieves a booking by its ID
   * @param bookingId - The ID of the booking
   * @returns The booking if found, null otherwise
   */
  async findById(bookingId: string): Promise<Booking | null> {
    try {
      // Check cache for booking data
      const cacheKey = getBookingCacheKey(bookingId);
      const cachedBooking = await redisClient.get(cacheKey);

      if (cachedBooking) {
        logger.debug('Booking cache hit', { bookingId });
        return JSON.parse(cachedBooking) as Booking;
      }

      // If not found in cache, query the database for the booking
      logger.debug('Booking cache miss', { bookingId });
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId }
      });

      if (booking) {
        // If found in database, cache the result with appropriate TTL
        await redisClient.set(cacheKey, JSON.stringify(booking), 'EX', 3600); // Cache for 1 hour
        return booking;
      }

      // Return the booking data or null if not found
      return null;
    } catch (error) {
      logger.error('Error finding booking by ID', { bookingId, error });
      throw errorFactory.createInternalServerError('Failed to find booking', { bookingId }, error as Error);
    }
  }

  /**
   * Retrieves a booking with detailed client and provider information
   * @param bookingId - The ID of the booking
   * @returns The booking with detailed information if found, null otherwise
   */
  async findDetailedById(bookingId: string): Promise<BookingResponse | null> {
    try {
      // Query the database for the booking with related client and provider data
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          provider: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              organizationName: true
            }
          },
          serviceItem: {
            select: {
              id: true,
              serviceType: true,
              description: true
            }
          }
        }
      });

      // If booking not found, return null
      if (!booking) {
        return null;
      }

      // Format the response with booking, client, provider, and service item details
      const bookingResponse: BookingResponse = {
        booking: {
          id: booking.id,
          clientId: booking.clientId,
          providerId: booking.providerId,
          serviceItemId: booking.serviceItemId,
          startTime: booking.startTime,
          endTime: booking.endTime,
          status: booking.status as BookingStatus,
          notes: booking.notes,
          cancellationReason: booking.cancellationReason,
          cancelledBy: booking.cancelledBy,
          location: booking.location,
          rescheduledToId: booking.rescheduledToId,
          createdAt: booking.createdAt,
          updatedAt: booking.updatedAt
        },
        client: {
          id: booking.client.id,
          firstName: booking.client.firstName,
          lastName: booking.client.lastName,
          email: booking.client.email
        },
        provider: {
          id: booking.provider.id,
          firstName: booking.provider.firstName,
          lastName: booking.provider.lastName,
          organizationName: booking.provider.organizationName
        },
        serviceItem: booking.serviceItem ? {
          id: booking.serviceItem.id,
          serviceType: booking.serviceItem.serviceType,
          description: booking.serviceItem.description
        } : null
      };

      // Return the formatted booking response
      return bookingResponse;
    } catch (error) {
      logger.error('Error finding detailed booking by ID', { bookingId, error });
      throw errorFactory.createInternalServerError('Failed to find detailed booking', { bookingId }, error as Error);
    }
  }

  /**
   * Retrieves a paginated list of bookings with optional filtering
   * @param filterParams - BookingFilterParams
   * @returns Paginated list of bookings matching the filter criteria
   */
  async findAll(filterParams: BookingFilterParams): Promise<BookingListResponse> {
    try {
      // Check cache for filtered bookings list
      const cacheKey = getBookingsListCacheKey(filterParams);
      const cachedBookings = await redisClient.get(cacheKey);

      if (cachedBookings) {
        logger.debug('Bookings list cache hit', { filterParams });
        return JSON.parse(cachedBookings) as BookingListResponse;
      }

      // Build database query based on filter parameters
      const whereClause: any = {};
      if (filterParams.clientId) {
        whereClause.clientId = filterParams.clientId;
      }
      if (filterParams.providerId) {
        whereClause.providerId = filterParams.providerId;
      }
      if (filterParams.serviceItemId) {
        whereClause.serviceItemId = filterParams.serviceItemId;
      }
      if (filterParams.status) {
        whereClause.status = filterParams.status;
      }
      if (filterParams.startDate && filterParams.endDate) {
        whereClause.startTime = {
          gte: filterParams.startDate,
          lte: filterParams.endDate
        };
      }

      // Apply pagination parameters (page, limit)
      const page = filterParams.page || 1;
      const limit = filterParams.limit || 10;
      const skip = (page - 1) * limit;

      // Apply sorting parameters (sortBy, sortOrder)
      const sortBy = filterParams.sortBy || 'startTime';
      const sortOrder = filterParams.sortOrder || 'asc';
      const orderBy: any = {};
      orderBy[sortBy] = sortOrder;

      // Execute query to get bookings and total count
      const [bookings, total] = await prisma.$transaction([
        prisma.booking.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy
        }),
        prisma.booking.count({ where: whereClause })
      ]);

      // Calculate total pages based on total count and limit
      const totalPages = Math.ceil(total / limit);

      // Cache the result with appropriate TTL
      const bookingListResponse: BookingListResponse = {
        bookings,
        total,
        page,
        limit,
        totalPages
      };
      await redisClient.set(cacheKey, JSON.stringify(bookingListResponse), 'EX', 3600); // Cache for 1 hour

      // Return the paginated booking list response
      return bookingListResponse;
    } catch (error) {
      logger.error('Error finding all bookings', { filterParams, error });
      throw errorFactory.createInternalServerError('Failed to find bookings', { filterParams }, error as Error);
    }
  }

  /**
   * Retrieves bookings for a specific client
   * @param clientId - The ID of the client
   * @param filterParams - BookingFilterParams
   * @returns Paginated list of bookings for the client
   */
  async findByClientId(clientId: string, filterParams: BookingFilterParams): Promise<BookingListResponse> {
    // Set clientId in filter parameters
    const updatedFilterParams = { ...filterParams, clientId };

    // Call findAll method with updated filter parameters
    return this.findAll(updatedFilterParams);
  }

  /**
   * Retrieves bookings for a specific provider
   * @param providerId - The ID of the provider
   * @param filterParams - BookingFilterParams
   * @returns Paginated list of bookings for the provider
   */
  async findByProviderId(providerId: string, filterParams: BookingFilterParams): Promise<BookingListResponse> {
    // Set providerId in filter parameters
    const updatedFilterParams = { ...filterParams, providerId };

    // Call findAll method with updated filter parameters
    return this.findAll(updatedFilterParams);
  }

  /**
   * Retrieves bookings within a specific date range
   * @param dateRange - DateRange
   * @param filterParams - BookingFilterParams
   * @returns Paginated list of bookings within the date range
   */
  async findByDateRange(dateRange: DateRange, filterParams: BookingFilterParams): Promise<BookingListResponse> {
    // Set startDate and endDate in filter parameters
    const updatedFilterParams = { ...filterParams, startDate: dateRange.startDate, endDate: dateRange.endDate };

    // Call findAll method with updated filter parameters
    return this.findAll(updatedFilterParams);
  }

  /**
   * Creates a new booking
   * @param bookingData - CreateBookingDTO
   * @returns The newly created booking
   */
  async create(bookingData: CreateBookingDTO): Promise<Booking> {
    try {
      // Validate the booking data
      if (!bookingData.clientId || !bookingData.providerId || !bookingData.startTime || !bookingData.endTime) {
        throw errorFactory.createValidationError('Missing required fields for booking creation');
      }

      // Check provider availability for the requested time slot
      const isAvailable = await this.providerAvailabilityRepository.checkAvailability(
        bookingData.providerId,
        bookingData.startTime,
        bookingData.endTime,
        'physical_therapy' // TODO: Replace with actual service type from bookingData
      );

      if (!isAvailable) {
        throw errorFactory.createValidationError('Provider is not available at the requested time');
      }

      // Generate a unique ID for the booking
      const bookingId = uuidv4();

      // Set initial status to SCHEDULED
      const initialStatus = BookingStatus.SCHEDULED;

      // Create the booking record in the database
      const booking = await prisma.booking.create({
        data: {
          id: bookingId,
          clientId: bookingData.clientId,
          providerId: bookingData.providerId,
          serviceItemId: bookingData.serviceItemId,
          startTime: bookingData.startTime,
          endTime: bookingData.endTime,
          status: initialStatus,
          notes: bookingData.notes,
          location: bookingData.location
        }
      });

      // Update provider availability to mark the time slot as booked
      await this.providerAvailabilityRepository.bookTimeSlot(
        bookingData.providerId,
        bookingId,
        bookingId // TODO: Replace with actual timeSlotId
      );

      // Invalidate related cache entries
      await this.invalidateCache(bookingId, bookingData.clientId, bookingData.providerId);

      // Return the created booking
      return booking;
    } catch (error) {
      logger.error('Error creating booking', { bookingData, error });
      throw errorFactory.createInternalServerError('Failed to create booking', { bookingData }, error as Error);
    }
  }

  /**
   * Updates an existing booking
   * @param bookingId - The ID of the booking
   * @param updateData - UpdateBookingDTO
   * @returns The updated booking
   */
  async update(bookingId: string, updateData: UpdateBookingDTO): Promise<Booking> {
    try {
      // Validate the booking ID and update data
      if (!bookingId || !updateData) {
        throw errorFactory.createValidationError('Missing required parameters for booking update');
      }

      // Check if the booking exists
      const existingBooking = await this.findById(bookingId);
      if (!existingBooking) {
        throw errorFactory.createNotFoundError('Booking not found', { bookingId });
      }

      // If updating time, check provider availability for the new time slot
      if (updateData.startTime && updateData.endTime) {
        const isAvailable = await this.providerAvailabilityRepository.checkAvailability(
          existingBooking.providerId,
          updateData.startTime,
          updateData.endTime,
          'physical_therapy' // TODO: Replace with actual service type from bookingData
        );

        if (!isAvailable) {
          throw errorFactory.createValidationError('Provider is not available at the requested time');
        }
      }

      // Update the booking record in the database
      const updatedBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: updateData
      });

      // If time was updated, update provider availability accordingly
      if (updateData.startTime || updateData.endTime) {
        // TODO: Update provider availability
      }

      // Invalidate related cache entries
      await this.invalidateCache(bookingId, existingBooking.clientId, existingBooking.providerId);

      // Return the updated booking
      return updatedBooking;
    } catch (error) {
      logger.error('Error updating booking', { bookingId, updateData, error });
      throw errorFactory.createInternalServerError('Failed to update booking', { bookingId, updateData }, error as Error);
    }
  }

  /**
   * Updates the status of a booking
   * @param bookingId - The ID of the booking
   * @param status - BookingStatus
   * @returns The booking with updated status
   */
  async updateStatus(bookingId: string, status: BookingStatus): Promise<Booking> {
    try {
      // Validate the booking ID and status
      if (!bookingId || !status) {
        throw errorFactory.createValidationError('Missing required parameters for booking status update');
      }

      // Check if the booking exists
      const existingBooking = await this.findById(bookingId);
      if (!existingBooking) {
        throw errorFactory.createNotFoundError('Booking not found', { bookingId });
      }

      // Update the booking status in the database
      const updatedBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: { status }
      });

      // Invalidate related cache entries
      await this.invalidateCache(bookingId, existingBooking.clientId, existingBooking.providerId);

      // Return the updated booking
      return updatedBooking;
    } catch (error) {
      logger.error('Error updating booking status', { bookingId, status, error });
      throw errorFactory.createInternalServerError('Failed to update booking status', { bookingId, status }, error as Error);
    }
  }

  /**
   * Cancels a booking with a reason
   * @param bookingId - The ID of the booking
   * @param cancellationInfo - CancellationInfo
   * @returns The cancelled booking
   */
  async cancel(bookingId: string, cancellationInfo: CancellationInfo): Promise<Booking> {
    try {
      // Validate the booking ID and cancellation info
      if (!bookingId || !cancellationInfo) {
        throw errorFactory.createValidationError('Missing required parameters for booking cancellation');
      }

      // Check if the booking exists
      const existingBooking = await this.findById(bookingId);
      if (!existingBooking) {
        throw errorFactory.createNotFoundError('Booking not found', { bookingId });
      }

      // Update the booking status to CANCELLED
      // Set cancellation reason and cancelled by fields
      const cancelledBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.CANCELLED,
          cancellationReason: cancellationInfo.reason,
          cancelledBy: cancellationInfo.cancelledBy
        }
      });

      // Update provider availability to free up the time slot
      await this.providerAvailabilityRepository.unbookTimeSlot(
        existingBooking.providerId,
        bookingId // TODO: Replace with actual timeSlotId
      );

      // Invalidate related cache entries
      await this.invalidateCache(bookingId, existingBooking.clientId, existingBooking.providerId);

      // Return the cancelled booking
      return cancelledBooking;
    } catch (error) {
      logger.error('Error cancelling booking', { bookingId, cancellationInfo, error });
      throw errorFactory.createInternalServerError('Failed to cancel booking', { bookingId, cancellationInfo }, error as Error);
    }
  }

  /**
   * Reschedules a booking to a new time slot
   * @param bookingId - The ID of the booking
   * @param newBookingData - CreateBookingDTO
   * @param reason - string
   * @returns Information about the rescheduled booking
   */
  async reschedule(bookingId: string, newBookingData: CreateBookingDTO, reason: string): Promise<RescheduleInfo> {
    try {
      // Validate the booking ID and new booking data
      if (!bookingId || !newBookingData) {
        throw errorFactory.createValidationError('Missing required parameters for booking rescheduling');
      }

      // Check if the original booking exists
      const originalBooking = await this.findById(bookingId);
      if (!originalBooking) {
        throw errorFactory.createNotFoundError('Original booking not found', { bookingId });
      }

      // Begin a database transaction
      return await prisma.$transaction(async (tx) => {
        // Create a new booking with the provided data
        const newBookingId = uuidv4();
        const newBooking = await tx.booking.create({
          data: {
            id: newBookingId,
            clientId: newBookingData.clientId,
            providerId: newBookingData.providerId,
            serviceItemId: newBookingData.serviceItemId,
            startTime: newBookingData.startTime,
            endTime: newBookingData.endTime,
            status: BookingStatus.SCHEDULED,
            notes: newBookingData.notes,
            location: newBookingData.location
          }
        });

        // Update the original booking status to RESCHEDULED
        await tx.booking.update({
          where: { id: bookingId },
          data: {
            status: BookingStatus.RESCHEDULED,
            rescheduledToId: newBookingId,
            cancellationReason: reason
          }
        });

        // Update provider availability for both time slots
        await this.providerAvailabilityRepository.bookTimeSlot(
          newBookingData.providerId,
          newBookingId,
          newBookingId // TODO: Replace with actual timeSlotId
        );
        await this.providerAvailabilityRepository.unbookTimeSlot(
          originalBooking.providerId,
          bookingId // TODO: Replace with actual timeSlotId
        );

        // Commit the transaction

        // Invalidate related cache entries
        await this.invalidateCache(bookingId, originalBooking.clientId, originalBooking.providerId);
        await this.invalidateCache(newBookingId, newBookingData.clientId, newBookingData.providerId);

        // Return the reschedule information with new booking ID
        const rescheduleInfo: RescheduleInfo = {
          newBookingId: newBooking.id,
          reason: reason
        };
        return rescheduleInfo;
      });
    } catch (error) {
      logger.error('Error rescheduling booking', { bookingId, newBookingData, reason, error });
      throw errorFactory.createInternalServerError('Failed to reschedule booking', { bookingId, newBookingData, reason }, error as Error);
    }
  }

  /**
   * Deletes a booking (soft delete)
   * @param bookingId - The ID of the booking
   * @returns True if the booking was deleted, false otherwise
   */
  async delete(bookingId: string): Promise<boolean> {
    try {
      // Validate the booking ID
      if (!bookingId) {
        throw errorFactory.createValidationError('Missing booking ID for deletion');
      }

      // Check if the booking exists
      const existingBooking = await this.findById(bookingId);
      if (!existingBooking) {
        throw errorFactory.createNotFoundError('Booking not found', { bookingId });
      }

      // Soft delete the booking by updating its status and adding deletion timestamp
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.CANCELLED,
          cancellationReason: 'Deleted by system' // TODO: Add a proper reason
        }
      });

      // Update provider availability to free up the time slot
      await this.providerAvailabilityRepository.unbookTimeSlot(
        existingBooking.providerId,
        bookingId // TODO: Replace with actual timeSlotId
      );

      // Invalidate related cache entries
      await this.invalidateCache(bookingId, existingBooking.clientId, existingBooking.providerId);

      // Return true if deletion was successful
      return true;
    } catch (error) {
      logger.error('Error deleting booking', { bookingId, error });
      throw errorFactory.createInternalServerError('Failed to delete booking', { bookingId }, error as Error);
    }
  }

  /**
   * Checks if a proposed booking conflicts with existing bookings
   * @param providerId - The ID of the provider
   * @param startTime - Date
   * @param endTime - Date
   * @param excludeBookingId - string
   * @returns True if conflicts exist, false otherwise
   */
  async checkForConflicts(providerId: string, startTime: Date, endTime: Date, excludeBookingId?: string): Promise<boolean> {
    try {
      // Query the database for bookings that overlap with the proposed time slot
      const overlappingBookings = await prisma.booking.findMany({
        where: {
          providerId: providerId,
          startTime: { lt: endTime },
          endTime: { gt: startTime },
          id: excludeBookingId ? { not: excludeBookingId } : undefined,
          status: { in: [BookingStatus.SCHEDULED, BookingStatus.IN_PROGRESS] }
        }
      });

      // Return true if any conflicting bookings are found, false otherwise
      return overlappingBookings.length > 0;
    } catch (error) {
      logger.error('Error checking for booking conflicts', { providerId, startTime, endTime, excludeBookingId, error });
      throw errorFactory.createInternalServerError('Failed to check for booking conflicts', { providerId, startTime, endTime, excludeBookingId }, error as Error);
    }
  }

  /**
   * Retrieves upcoming bookings for a client or provider
   * @param userId - The ID of the user
   * @param userRole - The role of the user
   * @param limit - number
   * @returns List of upcoming bookings
   */
  async getUpcomingBookings(userId: string, userRole: string, limit: number): Promise<BookingListResponse> {
    try {
      // Determine if user is a client or provider based on role
      let filterParams: BookingFilterParams = {
        page: 1,
        limit: limit,
        sortBy: 'startTime',
        sortOrder: 'asc'
      };

      if (userRole === 'client') {
        filterParams.clientId = userId;
      } else if (userRole === 'provider') {
        filterParams.providerId = userId;
      } else {
        throw errorFactory.createValidationError('Invalid user role for upcoming bookings');
      }

      // Set date range to start from current date
      filterParams.startDate = new Date();
      filterParams.endDate = new Date(new Date().setDate(new Date().getDate() + 30)); // Next 30 days

      // Set status filter to include only active bookings
      filterParams.status = BookingStatus.SCHEDULED;

      // Call findAll method with the filter parameters
      return await this.findAll(filterParams);
    } catch (error) {
      logger.error('Error getting upcoming bookings', { userId, userRole, limit, error });
      throw errorFactory.createInternalServerError('Failed to get upcoming bookings', { userId, userRole, limit }, error as Error);
    }
  }

  /**
   * Invalidates cache entries related to bookings
   * @param bookingId - The ID of the booking
   * @param clientId - The ID of the client
   * @param providerId - The ID of the provider
   */
  async invalidateCache(bookingId: string, clientId: string, providerId: string): Promise<void> {
    try {
      // Generate the booking cache key for the specific booking
      const bookingCacheKey = getBookingCacheKey(bookingId);

      // Delete the cache entry for the booking
      await redisClient.del(bookingCacheKey);

      // Delete cache entries for client's bookings list
      const clientBookingsListCacheKey = getBookingsListCacheKey({ clientId: clientId, page: 1, limit: 10, sortBy: 'startTime', sortOrder: 'asc' });
      await redisClient.del(clientBookingsListCacheKey);

      // Delete cache entries for provider's bookings list
      const providerBookingsListCacheKey = getBookingsListCacheKey({ providerId: providerId, page: 1, limit: 10, sortBy: 'startTime', sortOrder: 'asc' });
      await redisClient.del(providerBookingsListCacheKey);

      // Invalidate provider availability cache
      await this.providerAvailabilityRepository.invalidateCache(providerId);

      logger.debug('Invalidated booking cache', { bookingId, clientId, providerId });
    } catch (error) {
      logger.error('Error invalidating booking cache', { bookingId, clientId, providerId, error });
      // Don't throw the error, just log it
    }
  }
}

export { getBookingCacheKey, getBookingsListCacheKey };