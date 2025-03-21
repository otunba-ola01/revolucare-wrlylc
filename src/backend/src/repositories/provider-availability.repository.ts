import { v4 as uuidv4 } from 'uuid'; // uuid@^9.0.0
import { prisma } from '../config/database';
import { redisClient, getCacheKey } from '../config/redis';
import { 
  Availability, 
  TimeSlot, 
  RecurringSchedule, 
  AvailabilityException,
  DateRange,
  ProviderAvailabilityUpdateDTO
} from '../types/provider.types';
import { IProviderAvailabilityRepository } from '../interfaces/provider.interface';
import { 
  ProviderAvailabilityModel, 
  TimeSlotModel, 
  generateTimeSlots 
} from '../models/provider-availability.model';
import { ServiceType } from '../constants/service-types';
import { logger } from '../utils/logger';

/**
 * Generates a cache key for provider availability data
 * 
 * @param providerId - The ID of the provider
 * @returns Formatted cache key for the provider's availability
 */
function getAvailabilityCacheKey(providerId: string): string {
  return getCacheKey('availability', providerId);
}

/**
 * Repository class for managing provider availability data in the database
 */
export class ProviderAvailabilityRepository implements IProviderAvailabilityRepository {
  /**
   * Finds availability data for a specific provider
   * 
   * @param providerId - The ID of the provider
   * @returns Promise resolving to the provider's availability data if found, null otherwise
   */
  async findByProviderId(providerId: string): Promise<Availability | null> {
    try {
      // Try to get from cache first
      const cacheKey = getAvailabilityCacheKey(providerId);
      const cachedData = await redisClient.get(cacheKey);
      
      if (cachedData) {
        logger.debug('Provider availability cache hit', { providerId });
        return JSON.parse(cachedData) as Availability;
      }
      
      // Cache miss, get from database
      logger.debug('Provider availability cache miss', { providerId });
      
      // Get the main availability record
      const availabilityRecord = await prisma.providerAvailability.findUnique({
        where: { providerId },
        include: {
          timeSlots: true,
          recurringSchedules: true,
          exceptions: {
            include: {
              alternativeSlots: true
            }
          }
        }
      });
      
      if (!availabilityRecord) {
        return null;
      }
      
      // Transform database record to domain model
      const availability: Availability = {
        providerId: availabilityRecord.providerId,
        slots: availabilityRecord.timeSlots.map(slot => ({
          id: slot.id,
          providerId: slot.providerId,
          startTime: slot.startTime,
          endTime: slot.endTime,
          serviceType: slot.serviceType as ServiceType,
          isBooked: slot.isBooked,
          bookingId: slot.bookingId
        })),
        recurringSchedule: availabilityRecord.recurringSchedules.map(schedule => ({
          id: schedule.id,
          providerId: schedule.providerId,
          dayOfWeek: schedule.dayOfWeek,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          serviceTypes: schedule.serviceTypes as ServiceType[]
        })),
        exceptions: availabilityRecord.exceptions.map(exception => ({
          id: exception.id,
          providerId: exception.providerId,
          date: exception.date,
          isAvailable: exception.isAvailable,
          reason: exception.reason,
          alternativeSlots: exception.alternativeSlots.map(slot => ({
            id: slot.id,
            providerId: slot.providerId,
            startTime: slot.startTime,
            endTime: slot.endTime,
            serviceType: slot.serviceType as ServiceType,
            isBooked: slot.isBooked,
            bookingId: slot.bookingId
          }))
        })),
        lastUpdated: availabilityRecord.lastUpdated
      };
      
      // Cache the result with TTL of 15 minutes
      await redisClient.set(
        cacheKey,
        JSON.stringify(availability),
        'EX',
        900
      );
      
      return availability;
    } catch (error) {
      logger.error('Error finding provider availability', {
        providerId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
  
  /**
   * Creates a new availability record for a provider
   * 
   * @param data - The availability data to create
   * @returns Promise resolving to the created availability record
   */
  async create(data: Partial<Availability>): Promise<Availability> {
    try {
      // Create model and validate
      const availabilityModel = new ProviderAvailabilityModel(data);
      
      if (!availabilityModel.validate()) {
        throw new Error('Invalid availability data');
      }
      
      // Start a transaction
      return await prisma.$transaction(async (tx) => {
        // Create the main availability record
        const createdAvailability = await tx.providerAvailability.create({
          data: {
            providerId: availabilityModel.providerId,
            lastUpdated: availabilityModel.lastUpdated
          }
        });
        
        // Create time slots
        const createdSlots = await Promise.all(
          availabilityModel.slots.map(slot => 
            tx.timeSlot.create({
              data: {
                id: slot.id || uuidv4(),
                providerId: availabilityModel.providerId,
                startTime: slot.startTime,
                endTime: slot.endTime,
                serviceType: slot.serviceType,
                isBooked: slot.isBooked,
                bookingId: slot.bookingId,
                providerAvailabilityId: createdAvailability.id
              }
            })
          )
        );
        
        // Create recurring schedules
        const createdSchedules = await Promise.all(
          availabilityModel.recurringSchedule.map(schedule => 
            tx.recurringSchedule.create({
              data: {
                id: schedule.id || uuidv4(),
                providerId: availabilityModel.providerId,
                dayOfWeek: schedule.dayOfWeek,
                startTime: schedule.startTime,
                endTime: schedule.endTime,
                serviceTypes: schedule.serviceTypes,
                providerAvailabilityId: createdAvailability.id
              }
            })
          )
        );
        
        // Create exceptions
        const createdExceptions = await Promise.all(
          availabilityModel.exceptions.map(async (exception) => {
            const createdException = await tx.availabilityException.create({
              data: {
                id: exception.id || uuidv4(),
                providerId: availabilityModel.providerId,
                date: exception.date,
                isAvailable: exception.isAvailable,
                reason: exception.reason,
                providerAvailabilityId: createdAvailability.id
              }
            });
            
            // Create alternative slots if any
            if (exception.alternativeSlots && exception.alternativeSlots.length > 0) {
              await Promise.all(
                exception.alternativeSlots.map(slot => 
                  tx.alternativeTimeSlot.create({
                    data: {
                      id: slot.id || uuidv4(),
                      providerId: availabilityModel.providerId,
                      startTime: slot.startTime,
                      endTime: slot.endTime,
                      serviceType: slot.serviceType,
                      isBooked: slot.isBooked,
                      bookingId: slot.bookingId,
                      exceptionId: createdException.id
                    }
                  })
                )
              );
            }
            
            return createdException;
          })
        );
        
        // Construct the complete availability object
        const completedAvailability: Availability = {
          providerId: createdAvailability.providerId,
          slots: createdSlots.map(slot => ({
            id: slot.id,
            providerId: slot.providerId,
            startTime: slot.startTime,
            endTime: slot.endTime,
            serviceType: slot.serviceType as ServiceType,
            isBooked: slot.isBooked,
            bookingId: slot.bookingId
          })),
          recurringSchedule: createdSchedules.map(schedule => ({
            id: schedule.id,
            providerId: schedule.providerId,
            dayOfWeek: schedule.dayOfWeek,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            serviceTypes: schedule.serviceTypes as ServiceType[]
          })),
          exceptions: availabilityModel.exceptions.map(exception => ({
            id: exception.id || '',
            providerId: exception.providerId,
            date: exception.date,
            isAvailable: exception.isAvailable,
            reason: exception.reason,
            alternativeSlots: exception.alternativeSlots || null
          })),
          lastUpdated: createdAvailability.lastUpdated
        };
        
        // Invalidate any existing cache
        await this.invalidateCache(availabilityModel.providerId);
        
        return completedAvailability;
      });
    } catch (error) {
      logger.error('Error creating provider availability', {
        providerId: data.providerId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
  
  /**
   * Updates an existing availability record for a provider
   * 
   * @param providerId - The ID of the provider
   * @param data - The availability data to update
   * @returns Promise resolving to the updated availability record
   */
  async update(providerId: string, data: ProviderAvailabilityUpdateDTO): Promise<Availability> {
    try {
      // Check if availability record exists
      const existingAvailability = await this.findByProviderId(providerId);
      
      if (!existingAvailability) {
        throw new Error(`Provider availability not found for provider: ${providerId}`);
      }
      
      // Create model with updated data
      const updatedModel = new ProviderAvailabilityModel({
        ...existingAvailability,
        slots: data.slots || existingAvailability.slots,
        recurringSchedule: data.recurringSchedule || existingAvailability.recurringSchedule,
        exceptions: data.exceptions || existingAvailability.exceptions,
        lastUpdated: new Date()
      });
      
      if (!updatedModel.validate()) {
        throw new Error('Invalid availability data');
      }
      
      // Start a transaction
      return await prisma.$transaction(async (tx) => {
        // Get the provider availability record
        const availabilityRecord = await tx.providerAvailability.findUnique({
          where: { providerId }
        });
        
        if (!availabilityRecord) {
          throw new Error(`Provider availability record not found for provider: ${providerId}`);
        }
        
        // Update the main availability record
        await tx.providerAvailability.update({
          where: { providerId },
          data: {
            lastUpdated: updatedModel.lastUpdated
          }
        });
        
        // Handle time slots updates
        if (data.slots) {
          // Delete existing slots
          await tx.timeSlot.deleteMany({
            where: { providerId }
          });
          
          // Create new slots
          await Promise.all(
            updatedModel.slots.map(slot => 
              tx.timeSlot.create({
                data: {
                  id: slot.id || uuidv4(),
                  providerId,
                  startTime: slot.startTime,
                  endTime: slot.endTime,
                  serviceType: slot.serviceType,
                  isBooked: slot.isBooked,
                  bookingId: slot.bookingId,
                  providerAvailabilityId: availabilityRecord.id
                }
              })
            )
          );
        }
        
        // Handle recurring schedule updates
        if (data.recurringSchedule) {
          // Delete existing schedules
          await tx.recurringSchedule.deleteMany({
            where: { providerId }
          });
          
          // Create new schedules
          await Promise.all(
            updatedModel.recurringSchedule.map(schedule => 
              tx.recurringSchedule.create({
                data: {
                  id: schedule.id || uuidv4(),
                  providerId,
                  dayOfWeek: schedule.dayOfWeek,
                  startTime: schedule.startTime,
                  endTime: schedule.endTime,
                  serviceTypes: schedule.serviceTypes,
                  providerAvailabilityId: availabilityRecord.id
                }
              })
            )
          );
        }
        
        // Handle exception updates
        if (data.exceptions) {
          // Get existing exceptions to handle alternative slots
          const existingExceptions = await tx.availabilityException.findMany({
            where: { providerId },
            include: { alternativeSlots: true }
          });
          
          // Delete alternative slots for existing exceptions
          for (const exception of existingExceptions) {
            if (exception.alternativeSlots.length > 0) {
              await tx.alternativeTimeSlot.deleteMany({
                where: { exceptionId: exception.id }
              });
            }
          }
          
          // Delete existing exceptions
          await tx.availabilityException.deleteMany({
            where: { providerId }
          });
          
          // Create new exceptions
          await Promise.all(
            updatedModel.exceptions.map(async (exception) => {
              const createdException = await tx.availabilityException.create({
                data: {
                  id: exception.id || uuidv4(),
                  providerId,
                  date: exception.date,
                  isAvailable: exception.isAvailable,
                  reason: exception.reason,
                  providerAvailabilityId: availabilityRecord.id
                }
              });
              
              // Create alternative slots if any
              if (exception.alternativeSlots && exception.alternativeSlots.length > 0) {
                await Promise.all(
                  exception.alternativeSlots.map(slot => 
                    tx.alternativeTimeSlot.create({
                      data: {
                        id: slot.id || uuidv4(),
                        providerId,
                        startTime: slot.startTime,
                        endTime: slot.endTime,
                        serviceType: slot.serviceType,
                        isBooked: slot.isBooked,
                        bookingId: slot.bookingId,
                        exceptionId: createdException.id
                      }
                    })
                  )
                );
              }
              
              return createdException;
            })
          );
        }
        
        // Invalidate cache
        await this.invalidateCache(providerId);
        
        // Retrieve the updated availability
        const updatedAvailability = await this.findByProviderId(providerId);
        if (!updatedAvailability) {
          throw new Error('Failed to retrieve updated availability');
        }
        
        return updatedAvailability;
      });
    } catch (error) {
      logger.error('Error updating provider availability', {
        providerId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
  
  /**
   * Finds available time slots for a provider within a date range
   * 
   * @param providerId - The ID of the provider
   * @param dateRange - Date range to search within
   * @param serviceType - Optional service type to filter by
   * @returns Promise resolving to an array of available time slots
   */
  async findAvailableTimeSlots(
    providerId: string,
    dateRange: DateRange,
    serviceType?: ServiceType
  ): Promise<TimeSlot[]> {
    try {
      // Get provider availability
      const availability = await this.findByProviderId(providerId);
      
      if (!availability) {
        return [];
      }
      
      // Create availability model
      const availabilityModel = new ProviderAvailabilityModel(availability);
      
      // Get available time slots
      let availableSlots = availabilityModel.getAvailableTimeSlots(dateRange, serviceType);
      
      // Filter out any booked slots
      availableSlots = availableSlots.filter(slot => !slot.isBooked);
      
      // Sort by start time
      availableSlots.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
      
      return availableSlots;
    } catch (error) {
      logger.error('Error finding available time slots', {
        providerId,
        dateRange,
        serviceType,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
  
  /**
   * Checks if a provider is available for a specific time slot
   * 
   * @param providerId - The ID of the provider
   * @param startTime - Start time of the slot
   * @param endTime - End time of the slot
   * @param serviceType - Service type for the slot
   * @returns Promise resolving to a boolean indicating availability
   */
  async checkAvailability(
    providerId: string,
    startTime: Date,
    endTime: Date,
    serviceType: ServiceType
  ): Promise<boolean> {
    try {
      // Get provider availability
      const availability = await this.findByProviderId(providerId);
      
      if (!availability) {
        return false;
      }
      
      // Create availability model
      const availabilityModel = new ProviderAvailabilityModel(availability);
      
      // Check availability
      return availabilityModel.isAvailable(startTime, endTime, serviceType);
    } catch (error) {
      logger.error('Error checking provider availability', {
        providerId,
        startTime,
        endTime,
        serviceType,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
  
  /**
   * Marks a time slot as booked for a provider
   * 
   * @param providerId - The ID of the provider
   * @param timeSlotId - The ID of the time slot
   * @param bookingId - The ID of the booking
   * @returns Promise resolving to a boolean indicating success
   */
  async bookTimeSlot(
    providerId: string,
    timeSlotId: string,
    bookingId: string
  ): Promise<boolean> {
    try {
      // Start a transaction
      return await prisma.$transaction(async (tx) => {
        // Find the time slot
        const timeSlot = await tx.timeSlot.findFirst({
          where: {
            id: timeSlotId,
            providerId
          }
        });
        
        if (!timeSlot) {
          logger.warn('Time slot not found for booking', { providerId, timeSlotId });
          return false;
        }
        
        // Check if already booked
        if (timeSlot.isBooked) {
          logger.warn('Time slot already booked', { providerId, timeSlotId, existingBookingId: timeSlot.bookingId });
          return false;
        }
        
        // Update the time slot
        await tx.timeSlot.update({
          where: { id: timeSlotId },
          data: {
            isBooked: true,
            bookingId
          }
        });
        
        // Update lastUpdated timestamp
        await tx.providerAvailability.update({
          where: { providerId },
          data: {
            lastUpdated: new Date()
          }
        });
        
        // Invalidate cache
        await this.invalidateCache(providerId);
        
        return true;
      });
    } catch (error) {
      logger.error('Error booking time slot', {
        providerId,
        timeSlotId,
        bookingId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
  
  /**
   * Marks a time slot as not booked for a provider
   * 
   * @param providerId - The ID of the provider
   * @param timeSlotId - The ID of the time slot
   * @returns Promise resolving to a boolean indicating success
   */
  async unbookTimeSlot(
    providerId: string,
    timeSlotId: string
  ): Promise<boolean> {
    try {
      // Start a transaction
      return await prisma.$transaction(async (tx) => {
        // Find the time slot
        const timeSlot = await tx.timeSlot.findFirst({
          where: {
            id: timeSlotId,
            providerId
          }
        });
        
        if (!timeSlot) {
          logger.warn('Time slot not found for unbooking', { providerId, timeSlotId });
          return false;
        }
        
        // Check if not booked
        if (!timeSlot.isBooked) {
          logger.warn('Time slot not currently booked', { providerId, timeSlotId });
          return false;
        }
        
        // Update the time slot
        await tx.timeSlot.update({
          where: { id: timeSlotId },
          data: {
            isBooked: false,
            bookingId: null
          }
        });
        
        // Update lastUpdated timestamp
        await tx.providerAvailability.update({
          where: { providerId },
          data: {
            lastUpdated: new Date()
          }
        });
        
        // Invalidate cache
        await this.invalidateCache(providerId);
        
        return true;
      });
    } catch (error) {
      logger.error('Error unbooking time slot', {
        providerId,
        timeSlotId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
  
  /**
   * Finds providers that have availability within a specified date range and service type
   * 
   * @param dateRange - Date range to check availability within
   * @param serviceType - Service type to check availability for
   * @returns Promise resolving to an array of provider IDs with availability
   */
  async findProvidersByAvailability(
    dateRange: DateRange,
    serviceType: ServiceType
  ): Promise<string[]> {
    try {
      // Find providers with recurring schedules that match the service type
      const providers = await prisma.providerProfile.findMany({
        where: {
          serviceTypes: {
            has: serviceType
          },
          availability: {
            recurringSchedules: {
              some: {
                serviceTypes: {
                  has: serviceType
                }
              }
            }
          }
        },
        select: {
          userId: true
        }
      });
      
      const providerIds = providers.map(p => p.userId);
      
      // Filter providers by checking availability in the date range
      const availableProviderIds: string[] = [];
      
      for (const providerId of providerIds) {
        // Check if the provider has any available slots in the date range
        const availableSlots = await this.findAvailableTimeSlots(
          providerId,
          dateRange,
          serviceType
        );
        
        if (availableSlots.length > 0) {
          availableProviderIds.push(providerId);
        }
      }
      
      return availableProviderIds;
    } catch (error) {
      logger.error('Error finding providers by availability', {
        dateRange,
        serviceType,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
  
  /**
   * Deletes all availability data for a provider
   * 
   * @param providerId - The ID of the provider
   * @returns Promise resolving to a boolean indicating success
   */
  async deleteByProviderId(providerId: string): Promise<boolean> {
    try {
      // Start a transaction
      return await prisma.$transaction(async (tx) => {
        // Delete time slots
        await tx.timeSlot.deleteMany({
          where: { providerId }
        });
        
        // Delete recurring schedules
        await tx.recurringSchedule.deleteMany({
          where: { providerId }
        });
        
        // Get existing exceptions to handle alternative slots
        const exceptions = await tx.availabilityException.findMany({
          where: { providerId },
          include: { alternativeSlots: true }
        });
        
        // Delete alternative slots for each exception
        for (const exception of exceptions) {
          if (exception.alternativeSlots.length > 0) {
            await tx.alternativeTimeSlot.deleteMany({
              where: { exceptionId: exception.id }
            });
          }
        }
        
        // Delete exceptions
        await tx.availabilityException.deleteMany({
          where: { providerId }
        });
        
        // Delete the main availability record
        await tx.providerAvailability.delete({
          where: { providerId }
        });
        
        // Invalidate cache
        await this.invalidateCache(providerId);
        
        return true;
      });
    } catch (error) {
      logger.error('Error deleting provider availability', {
        providerId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
  
  /**
   * Invalidates cache entries for a provider's availability
   * 
   * @param providerId - The ID of the provider
   * @returns Promise that resolves when cache is invalidated
   */
  async invalidateCache(providerId: string): Promise<void> {
    try {
      const cacheKey = getAvailabilityCacheKey(providerId);
      await redisClient.del(cacheKey);
      logger.debug('Invalidated provider availability cache', { providerId });
    } catch (error) {
      logger.error('Error invalidating provider availability cache', {
        providerId,
        error: error instanceof Error ? error.message : String(error)
      });
      // Don't throw the error, just log it
    }
  }
}

export { getAvailabilityCacheKey };