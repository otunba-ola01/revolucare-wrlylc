/**
 * Provider Validators for the Revolucare platform
 * This file contains Zod schemas to validate provider-related API requests
 * including profile management, availability tracking, and provider matching.
 * 
 * @module validators/providers
 * @version 1.0.0
 */

import { z } from 'zod'; // zod version 3.21.4
import { ServiceType } from '../../constants/service-types';
import { addressSchema } from './users.validator';

// Regular expression patterns for validation
const PHONE_REGEX = /^\+?[1-9]\d{1,14}$/; // E.164 format
const LICENSE_NUMBER_REGEX = /^[A-Z0-9]{5,20}$/; // License numbers are alphanumeric, 5-20 chars
const LATITUDE_REGEX = /^-?([1-8]?[0-9]\.{1}\d{1,6}|90\.{1}0{1,6})$/;
const LONGITUDE_REGEX = /^-?((1?[0-7]?|[0-9]?)[0-9]\.{1}\d{1,6}|180\.{1}0{1,6})$/;

/**
 * Custom validator function for time slot validation
 * Ensures that start time is before end time and the duration is reasonable
 */
const validateTimeSlot = (timeSlot: any): boolean => {
  if (!timeSlot.startTime || !timeSlot.endTime) return false;
  
  const startTime = new Date(timeSlot.startTime);
  const endTime = new Date(timeSlot.endTime);
  
  if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) return false;
  
  // Start time must be before end time
  if (startTime >= endTime) return false;
  
  // Check for reasonable duration (not too short, not too long)
  const durationMs = endTime.getTime() - startTime.getTime();
  const durationMinutes = durationMs / (1000 * 60);
  
  // Minimum 15 minutes, maximum 12 hours
  return durationMinutes >= 15 && durationMinutes <= 720;
};

/**
 * Schema for geographic location data (latitude/longitude)
 */
export const geoLocationSchema = z.object({
  latitude: z.string().regex(LATITUDE_REGEX, 'Invalid latitude format'),
  longitude: z.string().regex(LONGITUDE_REGEX, 'Invalid longitude format')
}).strict();

/**
 * Schema for time slots (appointment blocks)
 */
export const timeSlotSchema = z.object({
  startTime: z.string().datetime('Invalid start time format'),
  endTime: z.string().datetime('Invalid end time format')
}).refine(
  validateTimeSlot,
  {
    message: 'Invalid time slot: start time must be before end time and duration must be between 15 minutes and 12 hours'
  }
);

/**
 * Schema for recurring schedule (weekly availability)
 */
export const recurringScheduleSchema = z.object({
  dayOfWeek: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'], {
    errorMap: () => ({ message: 'Invalid day of week' })
  }),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Start time must be in HH:MM 24-hour format'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'End time must be in HH:MM 24-hour format'),
  isAvailable: z.boolean().default(true)
}).refine(
  (data) => {
    // Validate start time is before end time
    const [startHour, startMinute] = data.startTime.split(':').map(Number);
    const [endHour, endMinute] = data.endTime.split(':').map(Number);
    
    if (startHour > endHour) return false;
    if (startHour === endHour && startMinute >= endMinute) return false;
    
    return true;
  },
  {
    message: 'Start time must be before end time'
  }
);

/**
 * Schema for availability exceptions (overrides to regular schedule)
 */
export const availabilityExceptionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  isAvailable: z.boolean(),
  startTime: z.string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Start time must be in HH:MM 24-hour format')
    .optional(),
  endTime: z.string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'End time must be in HH:MM 24-hour format')
    .optional(),
  reason: z.string().max(200, 'Reason is too long').optional()
}).refine(
  (data) => {
    // If available, both start and end times must be provided
    if (data.isAvailable) {
      if (!data.startTime || !data.endTime) return false;
      
      // Validate start time is before end time
      const [startHour, startMinute] = data.startTime.split(':').map(Number);
      const [endHour, endMinute] = data.endTime.split(':').map(Number);
      
      if (startHour > endHour) return false;
      if (startHour === endHour && startMinute >= endMinute) return false;
    }
    
    return true;
  },
  {
    message: 'Available exceptions must include start and end times, and start time must be before end time'
  }
);

/**
 * Schema for service area (geographic region where services are offered)
 */
export const serviceAreaSchema = z.object({
  location: geoLocationSchema,
  radius: z.number().int().positive().max(100, 'Service radius cannot exceed 100 miles'),
  name: z.string().min(1, 'Service area name is required').max(100, 'Service area name is too long'),
  description: z.string().max(200, 'Description is too long').optional(),
  isActive: z.boolean().default(true)
}).strict();

/**
 * Schema for service area updates
 */
export const serviceAreaUpdateSchema = serviceAreaSchema.partial().strict();

/**
 * Schema for provider profile data
 */
export const providerProfileSchema = z.object({
  organizationName: z.string().min(1, 'Organization name is required').max(100, 'Organization name is too long'),
  licenseNumber: z.string().regex(LICENSE_NUMBER_REGEX, 'Invalid license number format'),
  licenseExpiration: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'License expiration must be in YYYY-MM-DD format'),
  insuranceAccepted: z.array(z.string()).min(1, 'At least one insurance type must be specified'),
  serviceTypes: z.array(
    z.enum(Object.values(ServiceType) as [string, ...string[]], {
      errorMap: () => ({ message: 'Invalid service type' })
    })
  ).min(1, 'At least one service type is required'),
  serviceAreas: z.array(serviceAreaSchema).min(1, 'At least one service area is required'),
  bio: z.string().max(1000, 'Bio is too long').optional(),
  specializations: z.array(z.string()).default([]),
  address: addressSchema,
  phone: z.string().regex(PHONE_REGEX, 'Invalid phone number format'),
  email: z.string().email('Invalid email format'),
  website: z.string().url('Invalid website URL').optional(),
  yearsOfExperience: z.number().int().nonnegative().optional()
}).strict();

/**
 * Schema for provider profile updates
 */
export const providerProfileUpdateSchema = providerProfileSchema.partial().strict();

/**
 * Schema for provider availability updates
 */
export const availabilityUpdateSchema = z.object({
  recurringSchedule: z.array(recurringScheduleSchema).optional(),
  exceptions: z.array(availabilityExceptionSchema).optional(),
  defaultAppointmentDuration: z.number().int().min(15, 'Minimum duration is 15 minutes').max(240, 'Maximum duration is 240 minutes').optional(),
  bufferBetweenAppointments: z.number().int().min(0, 'Buffer cannot be negative').max(60, 'Maximum buffer is 60 minutes').optional(),
  maxDailyAppointments: z.number().int().positive().max(50, 'Maximum appointments per day cannot exceed 50').optional()
}).strict();

/**
 * Schema for provider search parameters
 */
export const providerSearchSchema = z.object({
  query: z.string().optional(),
  serviceType: z.enum(Object.values(ServiceType) as [string, ...string[]]).optional(),
  location: z.object({
    latitude: z.string().regex(LATITUDE_REGEX, 'Invalid latitude format'),
    longitude: z.string().regex(LONGITUDE_REGEX, 'Invalid longitude format'),
    radius: z.number().positive().max(100, 'Search radius cannot exceed 100 miles')
  }).optional(),
  availability: z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format').optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format').optional(),
    dayOfWeek: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']).optional()
  }).optional(),
  insurance: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
  yearsOfExperience: z.number().int().nonnegative().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
  sortBy: z.string().default('rating'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
}).strict();

/**
 * Schema for provider matching criteria
 */
export const providerMatchingSchema = z.object({
  clientId: z.string().uuid('Invalid client ID format'),
  serviceTypes: z.array(
    z.enum(Object.values(ServiceType) as [string, ...string[]], {
      errorMap: () => ({ message: 'Invalid service type' })
    })
  ).min(1, 'At least one service type is required'),
  location: z.object({
    latitude: z.string().regex(LATITUDE_REGEX, 'Invalid latitude format'),
    longitude: z.string().regex(LONGITUDE_REGEX, 'Invalid longitude format'),
    maxDistance: z.number().positive().max(100, 'Maximum distance cannot exceed 100 miles')
  }),
  availability: z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format').optional(),
    preferredDays: z.array(
      z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
    ).optional(),
    preferredTimeRanges: z.array(
      z.object({
        startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Start time must be in HH:MM 24-hour format'),
        endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'End time must be in HH:MM 24-hour format')
      })
    ).optional()
  }).optional(),
  insurance: z.array(z.string()).optional(),
  preferredGender: z.string().optional(),
  preferredLanguages: z.array(z.string()).optional(),
  specializations: z.array(z.string()).optional(),
  minExperience: z.number().int().nonnegative().optional(),
  maxResults: z.number().int().positive().max(50).default(10)
}).strict();

/**
 * Schema for provider review submission
 */
export const reviewSubmissionSchema = z.object({
  providerId: z.string().uuid('Invalid provider ID format'),
  rating: z.number().min(1, 'Minimum rating is 1').max(5, 'Maximum rating is 5'),
  comment: z.string().max(1000, 'Comment is too long').optional(),
  serviceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Service date must be in YYYY-MM-DD format'),
  serviceType: z.enum(Object.values(ServiceType) as [string, ...string[]], {
    errorMap: () => ({ message: 'Invalid service type' })
  }),
  anonymous: z.boolean().default(false)
}).strict();

/**
 * Schema for review filtering parameters
 */
export const reviewFilterSchema = z.object({
  providerId: z.string().uuid('Invalid provider ID format'),
  minRating: z.number().min(1).max(5).optional(),
  maxRating: z.number().min(1).max(5).optional(),
  serviceType: z.enum(Object.values(ServiceType) as [string, ...string[]]).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format').optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
}).strict();

/**
 * Schema for calendar synchronization parameters
 */
export const calendarSyncSchema = z.object({
  providerId: z.string().uuid('Invalid provider ID format'),
  calendarType: z.enum(['google', 'microsoft', 'apple']),
  syncToken: z.string().optional(),
  authCode: z.string().optional(),
  refreshToken: z.string().optional()
}).strict();

/**
 * Schema for validating provider ID parameters
 */
export const providerIdSchema = z.object({
  providerId: z.string().uuid('Invalid provider ID format')
}).strict();

/**
 * Schema for checking provider availability
 */
export const availabilityCheckSchema = z.object({
  providerId: z.string().uuid('Invalid provider ID format'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format').optional(),
  serviceType: z.enum(Object.values(ServiceType) as [string, ...string[]], {
    errorMap: () => ({ message: 'Invalid service type' })
  }).optional()
}).strict();

/**
 * Schema for querying provider availability
 */
export const availabilityQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format').optional(),
  providerId: z.string().uuid('Invalid provider ID format')
}).strict();

/**
 * Schema for finding available providers
 */
export const findAvailableProvidersSchema = z.object({
  serviceType: z.enum(Object.values(ServiceType) as [string, ...string[]], {
    errorMap: () => ({ message: 'Invalid service type' })
  }),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Start time must be in HH:MM 24-hour format').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format').optional(),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'End time must be in HH:MM 24-hour format').optional(),
  location: z.object({
    latitude: z.string().regex(LATITUDE_REGEX, 'Invalid latitude format'),
    longitude: z.string().regex(LONGITUDE_REGEX, 'Invalid longitude format'),
    radius: z.number().positive().max(100, 'Search radius cannot exceed 100 miles')
  }).optional(),
  insurance: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10)
}).strict();