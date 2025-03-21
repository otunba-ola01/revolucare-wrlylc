/**
 * Provider-related type definitions for the Revolucare platform
 * 
 * This file defines TypeScript interfaces and types for provider-related data structures 
 * used throughout the Revolucare platform. It centralizes provider type definitions to ensure 
 * consistency across all services and components that handle provider data, including profiles, 
 * availability, reviews, and matching.
 */

import { ServiceType } from '../constants/service-types';
import { Roles } from '../constants/roles';
import { Address } from '../types/user.types';

/**
 * Represents a provider profile in the system with comprehensive information
 * about the provider's credentials, services, and performance metrics.
 */
export interface ProviderProfile {
  id: string;
  userId: string;
  organizationName: string;
  licenseNumber: string | null;
  licenseExpiration: Date | null;
  serviceTypes: ServiceType[];
  bio: string | null;
  specializations: string[];
  insuranceAccepted: string[];
  address: Address | null;
  phone: string | null;
  averageRating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Data transfer object for updating provider profile information.
 * Contains only fields that can be modified by the provider.
 */
export interface ProviderProfileUpdateDTO {
  organizationName: string;
  licenseNumber: string | null;
  licenseExpiration: Date | null;
  serviceTypes: ServiceType[];
  bio: string | null;
  specializations: string[];
  insuranceAccepted: string[];
  address: Address | null;
  phone: string | null;
}

/**
 * Represents a geographic location with coordinates and address information
 * used for provider service areas and location-based matching.
 */
export interface GeoLocation {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

/**
 * Defines a geographic service area for a provider with location and radius.
 * Used for determining the range in which providers can offer services.
 */
export interface ServiceArea {
  id: string;
  providerId: string;
  location: GeoLocation;
  radius: number;
  zipCodes: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Enum representing days of the week for recurring schedules
 */
export enum DayOfWeek {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY'
}

/**
 * Represents a specific time slot in a provider's availability
 */
export interface TimeSlot {
  id: string;
  providerId: string;
  startTime: Date;
  endTime: Date;
  serviceType: ServiceType;
  isBooked: boolean;
  bookingId: string | null;
}

/**
 * Defines a recurring schedule pattern for provider availability
 */
export interface RecurringSchedule {
  id: string;
  providerId: string;
  dayOfWeek: DayOfWeek;
  startTime: string; // Format: "HH:MM" in 24-hour format
  endTime: string; // Format: "HH:MM" in 24-hour format
  serviceTypes: ServiceType[];
}

/**
 * Represents an exception to the regular availability schedule
 * Used for handling holidays, time off, or other special cases
 */
export interface AvailabilityException {
  id: string;
  providerId: string;
  date: Date;
  isAvailable: boolean;
  reason: string | null;
  alternativeSlots: TimeSlot[] | null;
}

/**
 * Represents the complete availability data for a provider
 * Combines specific time slots, recurring schedules, and exceptions
 */
export interface Availability {
  providerId: string;
  slots: TimeSlot[];
  recurringSchedule: RecurringSchedule[];
  exceptions: AvailabilityException[];
  lastUpdated: Date;
}

/**
 * Data transfer object for updating provider availability
 */
export interface ProviderAvailabilityUpdateDTO {
  slots: Partial<TimeSlot>[];
  recurringSchedule: Partial<RecurringSchedule>[];
  exceptions: Partial<AvailabilityException>[];
}

/**
 * Represents a date range for availability queries
 */
export interface DateRange {
  startDate: Date;
  endDate: Date;
}

/**
 * Represents a review submitted by a client for a provider
 */
export interface ProviderReview {
  id: string;
  providerId: string;
  clientId: string;
  rating: number;
  comment: string;
  serviceType: ServiceType;
  serviceDate: Date;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Data transfer object for submitting a new provider review
 */
export interface ReviewSubmissionDTO {
  providerId: string;
  clientId: string;
  rating: number;
  comment: string;
  serviceType: ServiceType;
  serviceDate: Date;
}

/**
 * Criteria for searching providers with various filters
 */
export interface ProviderSearchCriteria {
  serviceTypes: ServiceType[];
  location: GeoLocation | null;
  distance: number | null;
  zipCode: string | null;
  availability: DateRange | null;
  insurance: string | null;
  minRating: number | null;
  specializations: string[] | null;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

/**
 * Criteria for AI-powered provider matching with client preferences
 */
export interface ProviderMatchingCriteria {
  clientId: string;
  serviceTypes: ServiceType[];
  location: GeoLocation | null;
  distance: number | null;
  availability: DateRange | null;
  insurance: string | null;
  genderPreference: string | null;
  languagePreference: string[] | null;
  experienceLevel: string | null;
  additionalPreferences: Record<string, string>;
}

/**
 * Represents a factor in the provider matching algorithm with its score and weight
 */
export interface MatchFactor {
  name: string;
  score: number;
  weight: number;
  description: string;
}

/**
 * Result of the provider matching algorithm with compatibility score and details
 */
export interface ProviderMatch {
  provider: ProviderProfile;
  compatibilityScore: number;
  matchFactors: MatchFactor[];
  availableSlots: TimeSlot[] | null;
  distance: number | null;
}