import { Address } from './user';
import { ServiceType } from '../config/constants';

/**
 * Core provider interface representing a service provider in the system
 */
export interface Provider {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  organizationName: string;
  licenseNumber: string | null;
  licenseExpiration: string | null;
  serviceTypes: ServiceType[];
  bio: string | null;
  specializations: string[];
  insuranceAccepted: string[];
  address: Address | null;
  phone: string | null;
  profileImageUrl: string | null;
  averageRating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Data transfer object for updating provider profile information
 */
export interface ProviderProfileUpdateDTO {
  organizationName: string;
  licenseNumber: string | null;
  licenseExpiration: string | null;
  serviceTypes: ServiceType[];
  bio: string | null;
  specializations: string[];
  insuranceAccepted: string[];
  address: Address | null;
  phone: string | null;
  profileImageUrl: string | null;
}

/**
 * Geographic location information with coordinates and address details
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
 * A defined service area for a provider with location and radius
 */
export interface ServiceArea {
  id: string;
  providerId: string;
  location: GeoLocation;
  radius: number;
  zipCodes: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Enum for days of the week
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
 * A time slot in a provider's schedule
 */
export interface TimeSlot {
  id: string;
  providerId: string;
  startTime: string;
  endTime: string;
  serviceType: ServiceType;
  isBooked: boolean;
  bookingId: string | null;
}

/**
 * A recurring schedule pattern for provider availability
 */
export interface RecurringSchedule {
  id: string;
  providerId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  serviceTypes: ServiceType[];
}

/**
 * An exception to the regular availability schedule
 */
export interface AvailabilityException {
  id: string;
  providerId: string;
  date: string;
  isAvailable: boolean;
  reason: string | null;
  alternativeSlots: TimeSlot[] | null;
}

/**
 * Complete availability information for a provider
 */
export interface ProviderAvailability {
  providerId: string;
  slots: TimeSlot[];
  recurringSchedule: RecurringSchedule[];
  exceptions: AvailabilityException[];
  lastUpdated: string;
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
 * A date range for availability queries
 */
export interface DateRange {
  startDate: string;
  endDate: string;
}

/**
 * A review submitted by a client for a provider
 */
export interface ProviderReview {
  id: string;
  providerId: string;
  clientId: string;
  clientName: string;
  rating: number;
  comment: string;
  serviceType: ServiceType;
  serviceDate: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Data transfer object for submitting a new provider review
 */
export interface ReviewSubmissionDTO {
  providerId: string;
  rating: number;
  comment: string;
  serviceType: ServiceType;
  serviceDate: string;
}

/**
 * Search criteria for finding providers
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
 * Criteria for AI-powered provider matching
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
 * A factor in the provider matching algorithm
 */
export interface MatchFactor {
  name: string;
  score: number;
  weight: number;
  description: string;
}

/**
 * Result of the provider matching algorithm
 */
export interface ProviderMatch {
  provider: Provider;
  compatibilityScore: number;
  matchFactors: MatchFactor[];
  availableSlots: TimeSlot[] | null;
  distance: number | null;
}

/**
 * Request for syncing provider calendar with external services
 */
export interface CalendarSyncRequest {
  providerId: string;
  calendarType: 'google' | 'microsoft' | 'apple';
  syncDirection: 'import' | 'export' | 'both';
  dateRange: DateRange;
}

/**
 * Response from calendar synchronization operation
 */
export interface CalendarSyncResponse {
  success: boolean;
  message: string;
  syncedEvents: number;
  conflictingEvents: number;
  lastSyncedAt: string;
}