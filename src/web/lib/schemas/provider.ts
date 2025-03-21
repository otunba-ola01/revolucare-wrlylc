import { z } from 'zod';
import { addressSchema } from './profile';
import { timeSlotSchema, recurringScheduleSchema, availabilityExceptionSchema } from './availability';
import { SERVICE_TYPES, VALIDATION } from '../../config/constants';
import { DayOfWeek, ServiceType } from '../../types/provider';

/**
 * Validation schema for provider profile form
 * Validates required and optional fields for provider profiles
 */
export const providerProfileSchema = z.object({
  organizationName: z.string()
    .min(2, 'Organization name must be at least 2 characters')
    .max(100, 'Organization name cannot exceed 100 characters')
    .nonempty('Organization name is required'),
  licenseNumber: z.string()
    .min(5, 'License number must be at least 5 characters')
    .max(50, 'License number cannot exceed 50 characters')
    .optional()
    .nullable(),
  licenseExpiration: z.string()
    .refine((value) => !value || new Date(value) > new Date(), 'License expiration date must be in the future')
    .optional()
    .nullable(),
  serviceTypes: z.array(z.nativeEnum(ServiceType))
    .min(1, 'Please select at least one service type'),
  bio: z.string()
    .max(1000, 'Bio cannot exceed 1000 characters')
    .optional()
    .nullable(),
  specializations: z.array(z.string())
    .optional()
    .default([]),
  insuranceAccepted: z.array(z.string())
    .optional()
    .default([]),
  address: addressSchema
    .optional()
    .nullable(),
  phone: z.string()
    .regex(VALIDATION.PHONE_REGEX, 'Please enter a valid phone number')
    .optional()
    .nullable(),
  profileImageUrl: z.string()
    .url('Please enter a valid URL')
    .optional()
    .nullable(),
});

/**
 * Validation schema for updating provider profile information
 * Similar to providerProfileSchema but with all fields optional
 */
export const providerUpdateSchema = z.object({
  organizationName: z.string()
    .min(2, 'Organization name must be at least 2 characters')
    .max(100, 'Organization name cannot exceed 100 characters')
    .optional(),
  licenseNumber: z.string()
    .min(5, 'License number must be at least 5 characters')
    .max(50, 'License number cannot exceed 50 characters')
    .optional()
    .nullable(),
  licenseExpiration: z.string()
    .refine((value) => !value || new Date(value) > new Date(), 'License expiration date must be in the future')
    .optional()
    .nullable(),
  serviceTypes: z.array(z.nativeEnum(ServiceType))
    .min(1, 'Please select at least one service type')
    .optional(),
  bio: z.string()
    .max(1000, 'Bio cannot exceed 1000 characters')
    .optional()
    .nullable(),
  specializations: z.array(z.string())
    .optional(),
  insuranceAccepted: z.array(z.string())
    .optional(),
  address: addressSchema
    .optional()
    .nullable(),
  phone: z.string()
    .regex(VALIDATION.PHONE_REGEX, 'Please enter a valid phone number')
    .optional()
    .nullable(),
  profileImageUrl: z.string()
    .url('Please enter a valid URL')
    .optional()
    .nullable(),
});

/**
 * Validation schema for geographic location data
 * Used for provider service areas and location-based searches
 */
export const geoLocationSchema = z.object({
  latitude: z.number()
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90'),
  longitude: z.number()
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180'),
  address: z.string()
    .min(3, 'Address must be at least 3 characters')
    .max(200, 'Address cannot exceed 200 characters'),
  city: z.string()
    .min(2, 'City must be at least 2 characters')
    .max(100, 'City cannot exceed 100 characters'),
  state: z.string()
    .length(2, 'State must be a 2-letter code'),
  zipCode: z.string()
    .regex(VALIDATION.ZIP_CODE_REGEX, 'Please enter a valid ZIP code'),
});

/**
 * Validation schema for provider service area information
 * Defines geographic areas where a provider offers services
 */
export const serviceAreaSchema = z.object({
  location: geoLocationSchema
    .required('Location is required'),
  radius: z.number()
    .min(1, 'Radius must be at least 1 mile')
    .max(100, 'Radius cannot exceed 100 miles'),
  zipCodes: z.array(z.string().regex(VALIDATION.ZIP_CODE_REGEX, 'Please enter valid ZIP codes'))
    .optional()
    .default([]),
});

/**
 * Validation schema for complete provider availability
 * Combines time slots, recurring schedules, and exceptions
 */
export const providerAvailabilitySchema = z.object({
  slots: z.array(timeSlotSchema)
    .optional()
    .default([]),
  recurringSchedule: z.array(recurringScheduleSchema)
    .optional()
    .default([]),
  exceptions: z.array(availabilityExceptionSchema)
    .optional()
    .default([]),
});

/**
 * Validation schema for provider reviews
 * Ensures review data meets quality standards
 */
export const providerReviewSchema = z.object({
  rating: z.number()
    .min(1, 'Rating must be between 1 and 5')
    .max(5, 'Rating must be between 1 and 5'),
  comment: z.string()
    .min(10, 'Comment must be at least 10 characters')
    .max(1000, 'Comment cannot exceed 1000 characters'),
  serviceType: z.nativeEnum(ServiceType)
    .required('Service type is required'),
  serviceDate: z.string()
    .refine((value) => !isNaN(Date.parse(value)), 'Please enter a valid service date')
    .refine((value) => new Date(value) <= new Date(), 'Service date cannot be in the future'),
});

/**
 * Validation schema for submitting a new provider review
 * Includes provider ID and review content validation
 */
export const reviewSubmissionSchema = z.object({
  providerId: z.string().uuid('Please provide a valid provider ID'),
  rating: z.number()
    .min(1, 'Rating must be between 1 and 5')
    .max(5, 'Rating must be between 1 and 5'),
  comment: z.string()
    .min(10, 'Comment must be at least 10 characters')
    .max(1000, 'Comment cannot exceed 1000 characters'),
  serviceType: z.nativeEnum(ServiceType)
    .required('Service type is required'),
  serviceDate: z.string()
    .refine((value) => !isNaN(Date.parse(value)), 'Please enter a valid service date')
    .refine((value) => new Date(value) <= new Date(), 'Service date cannot be in the future'),
});

/**
 * Validation schema for provider search criteria
 * Used for filtering and searching providers
 */
export const providerSearchSchema = z.object({
  serviceTypes: z.array(z.nativeEnum(ServiceType))
    .optional(),
  location: geoLocationSchema
    .optional()
    .nullable(),
  distance: z.number()
    .min(1, 'Distance must be at least 1 mile')
    .max(100, 'Distance cannot exceed 100 miles')
    .optional()
    .nullable(),
  zipCode: z.string()
    .regex(VALIDATION.ZIP_CODE_REGEX, 'Please enter a valid ZIP code')
    .optional()
    .nullable(),
  availability: z.object({
    startDate: z.string(),
    endDate: z.string(),
  })
    .refine((value) => !value || new Date(value.endDate) >= new Date(value.startDate), 'End date must be after start date')
    .optional()
    .nullable(),
  insurance: z.string()
    .optional()
    .nullable(),
  minRating: z.number()
    .min(1, 'Rating must be between 1 and 5')
    .max(5, 'Rating must be between 1 and 5')
    .optional()
    .nullable(),
  specializations: z.array(z.string())
    .optional()
    .nullable(),
  page: z.number()
    .int('Page must be an integer')
    .min(1, 'Page must be at least 1')
    .optional()
    .default(1),
  limit: z.number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .optional()
    .default(10),
  sortBy: z.enum(['rating', 'distance', 'availability', 'relevance'])
    .optional()
    .default('relevance'),
  sortOrder: z.enum(['asc', 'desc'])
    .optional()
    .default('desc'),
});

/**
 * Validation schema for AI-powered provider matching criteria
 * Used for advanced matching based on client preferences
 */
export const providerMatchingSchema = z.object({
  clientId: z.string().uuid('Please provide a valid client ID'),
  serviceTypes: z.array(z.nativeEnum(ServiceType))
    .min(1, 'Please select at least one service type'),
  location: geoLocationSchema
    .optional()
    .nullable(),
  distance: z.number()
    .min(1, 'Distance must be at least 1 mile')
    .max(100, 'Distance cannot exceed 100 miles')
    .optional()
    .nullable(),
  availability: z.object({
    startDate: z.string(),
    endDate: z.string(),
  })
    .refine((value) => !value || new Date(value.endDate) >= new Date(value.startDate), 'End date must be after start date')
    .optional()
    .nullable(),
  insurance: z.string()
    .optional()
    .nullable(),
  genderPreference: z.enum(['male', 'female', 'non-binary', 'no-preference'])
    .optional()
    .nullable(),
  languagePreference: z.array(z.string())
    .optional()
    .nullable(),
  experienceLevel: z.enum(['entry', 'intermediate', 'senior', 'expert', 'any'])
    .optional()
    .nullable(),
  additionalPreferences: z.record(z.string())
    .optional()
    .default({}),
});