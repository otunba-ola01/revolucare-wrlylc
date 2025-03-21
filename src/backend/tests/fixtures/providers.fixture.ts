/**
 * Provider test fixture data for Revolucare platform
 * 
 * This file provides mock provider data for unit and integration tests,
 * including provider profiles, availability, service areas, and reviews.
 * The data structure matches the interfaces defined in provider.types.ts.
 */

import { ServiceType } from '../../src/constants/service-types';
import { Roles } from '../../src/constants/roles';
import { 
  ProviderProfile, 
  Availability,
  TimeSlot,
  RecurringSchedule,
  AvailabilityException,
  DayOfWeek,
  ServiceArea,
  GeoLocation,
  ProviderReview
} from '../../src/types/provider.types';
import { Address } from '../../src/types/user.types';

/**
 * Generates a mock address for testing
 * @param overrides - Optional properties to override default values
 * @returns A mock address with default values overridden by provided values
 */
export const generateMockAddress = (overrides: Partial<Address> = {}): Address => {
  return {
    street: '123 Main Street',
    city: 'Springfield',
    state: 'IL',
    zipCode: '62704',
    country: 'USA',
    ...overrides
  };
};

/**
 * Generates a mock geographic location for testing
 * @param overrides - Optional properties to override default values
 * @returns A mock geographic location with default values overridden by provided values
 */
export const generateMockGeoLocation = (overrides: Partial<GeoLocation> = {}): GeoLocation => {
  return {
    latitude: 39.781721,
    longitude: -89.650148,
    address: '123 Main Street',
    city: 'Springfield',
    state: 'IL',
    zipCode: '62704',
    ...overrides
  };
};

/**
 * Generates a mock service area for testing
 * @param overrides - Optional properties to override default values
 * @returns A mock service area with default values overridden by provided values
 */
export const generateMockServiceArea = (overrides: Partial<ServiceArea> = {}): ServiceArea => {
  return {
    id: 'service-area-123',
    providerId: 'provider-123',
    location: generateMockGeoLocation(),
    radius: 25, // miles
    zipCodes: ['62704', '62703', '62701', '62702', '62705'],
    createdAt: new Date('2023-01-15T10:30:00Z'),
    updatedAt: new Date('2023-05-20T14:35:00Z'),
    ...overrides
  };
};

/**
 * Generates a mock time slot for testing
 * @param overrides - Optional properties to override default values
 * @returns A mock time slot with default values overridden by provided values
 */
export const generateMockTimeSlot = (overrides: Partial<TimeSlot> = {}): TimeSlot => {
  return {
    id: 'timeslot-123',
    providerId: 'provider-123',
    startTime: new Date('2023-05-15T09:00:00Z'),
    endTime: new Date('2023-05-15T10:00:00Z'),
    serviceType: ServiceType.PHYSICAL_THERAPY,
    isBooked: false,
    bookingId: null,
    ...overrides
  };
};

/**
 * Generates a mock recurring schedule for testing
 * @param overrides - Optional properties to override default values
 * @returns A mock recurring schedule with default values overridden by provided values
 */
export const generateMockRecurringSchedule = (overrides: Partial<RecurringSchedule> = {}): RecurringSchedule => {
  return {
    id: 'recur-123',
    providerId: 'provider-123',
    dayOfWeek: DayOfWeek.TUESDAY,
    startTime: '09:00',
    endTime: '17:00',
    serviceTypes: [ServiceType.PHYSICAL_THERAPY, ServiceType.OCCUPATIONAL_THERAPY],
    ...overrides
  };
};

/**
 * Generates a mock availability exception for testing
 * @param overrides - Optional properties to override default values
 * @returns A mock availability exception with default values overridden by provided values
 */
export const generateMockAvailabilityException = (overrides: Partial<AvailabilityException> = {}): AvailabilityException => {
  return {
    id: 'exception-123',
    providerId: 'provider-123',
    date: new Date('2023-05-18T00:00:00Z'),
    isAvailable: false,
    reason: 'Public Holiday - Office Closed',
    alternativeSlots: null,
    ...overrides
  };
};

/**
 * Generates mock availability data for testing
 * @param overrides - Optional properties to override default values
 * @returns Mock availability data with default values overridden by provided values
 */
export const generateMockAvailability = (overrides: Partial<Availability> = {}): Availability => {
  return {
    providerId: 'provider-123',
    slots: [
      generateMockTimeSlot({ id: 'slot-1' }),
      generateMockTimeSlot({ 
        id: 'slot-2', 
        startTime: new Date('2023-05-16T10:00:00Z'), 
        endTime: new Date('2023-05-16T11:00:00Z')
      }),
      generateMockTimeSlot({ 
        id: 'slot-3', 
        startTime: new Date('2023-05-16T13:00:00Z'), 
        endTime: new Date('2023-05-16T14:00:00Z')
      })
    ],
    recurringSchedule: [
      generateMockRecurringSchedule({ id: 'rs-1', dayOfWeek: DayOfWeek.MONDAY }),
      generateMockRecurringSchedule({ id: 'rs-2', dayOfWeek: DayOfWeek.WEDNESDAY }),
      generateMockRecurringSchedule({ id: 'rs-3', dayOfWeek: DayOfWeek.FRIDAY })
    ],
    exceptions: [
      generateMockAvailabilityException({ id: 'exc-1' })
    ],
    lastUpdated: new Date('2023-05-20T14:40:00Z'),
    ...overrides
  };
};

/**
 * Generates a mock provider profile for testing
 * @param overrides - Optional properties to override default values
 * @returns A mock provider profile with default values overridden by provided values
 */
export const generateMockProviderProfile = (overrides: Partial<ProviderProfile> = {}): ProviderProfile => {
  return {
    id: 'provider-123',
    userId: 'user-123',
    organizationName: 'Revolucare Wellness Center',
    licenseNumber: 'PT12345',
    licenseExpiration: new Date('2025-12-31'),
    serviceTypes: [ServiceType.PHYSICAL_THERAPY, ServiceType.OCCUPATIONAL_THERAPY],
    bio: 'Experienced healthcare provider specializing in physical and occupational therapy',
    specializations: ['Neurological Rehabilitation', 'Sports Injuries', 'Mobility Training'],
    insuranceAccepted: ['Medicare', 'Blue Cross', 'Aetna', 'Cigna'],
    address: generateMockAddress(),
    phone: '(555) 123-4567',
    averageRating: 4.8,
    reviewCount: 42,
    createdAt: new Date('2023-01-15T10:00:00Z'),
    updatedAt: new Date('2023-05-20T14:30:00Z'),
    ...overrides
  };
};

/**
 * Generates a mock provider review for testing
 * @param overrides - Optional properties to override default values
 * @returns A mock provider review with default values overridden by provided values
 */
export const generateMockProviderReview = (overrides: Partial<ProviderReview> = {}): ProviderReview => {
  return {
    id: 'review-123',
    providerId: 'provider-123',
    clientId: 'client-123',
    rating: 5,
    comment: 'Excellent therapist! Very knowledgeable and caring. Helped me regain mobility after my surgery.',
    serviceType: ServiceType.PHYSICAL_THERAPY,
    serviceDate: new Date('2023-04-15T10:00:00Z'),
    isVerified: true,
    createdAt: new Date('2023-04-18T14:30:00Z'),
    updatedAt: new Date('2023-04-18T14:30:00Z'),
    ...overrides
  };
};

/**
 * Array of pre-defined mock provider profiles for testing
 */
export const mockProviderProfiles: ProviderProfile[] = [
  generateMockProviderProfile({
    id: 'provider-1',
    userId: 'user-1',
    organizationName: 'Revolucare Physical Therapy Center',
    specializations: ['Neurological Rehabilitation', 'Sports Injuries']
  }),
  generateMockProviderProfile({
    id: 'provider-2',
    userId: 'user-2',
    organizationName: 'Springfield Wellness Clinic',
    serviceTypes: [ServiceType.SPEECH_THERAPY, ServiceType.BEHAVIORAL_THERAPY],
    specializations: ['Speech Development', 'Cognitive Therapy'],
    averageRating: 4.6,
    reviewCount: 28
  }),
  generateMockProviderProfile({
    id: 'provider-3',
    userId: 'user-3',
    organizationName: 'Mobility First Rehabilitation',
    serviceTypes: [ServiceType.PHYSICAL_THERAPY, ServiceType.HOME_HEALTH_AIDE],
    specializations: ['Elderly Care', 'Post-Surgery Rehabilitation'],
    averageRating: 4.9,
    reviewCount: 56
  })
];

/**
 * Array of pre-defined mock service areas for testing
 */
export const mockServiceAreas: ServiceArea[] = [
  generateMockServiceArea({
    id: 'service-area-1',
    providerId: 'provider-1',
    radius: 20
  }),
  generateMockServiceArea({
    id: 'service-area-2',
    providerId: 'provider-2',
    location: generateMockGeoLocation({
      latitude: 39.763908,
      longitude: -89.667106,
      city: 'Springfield',
      zipCode: '62702'
    }),
    radius: 15
  }),
  generateMockServiceArea({
    id: 'service-area-3',
    providerId: 'provider-3',
    location: generateMockGeoLocation({
      latitude: 39.801505,
      longitude: -89.644072,
      city: 'Springfield',
      zipCode: '62703'
    }),
    radius: 30
  })
];

/**
 * Array of pre-defined mock geographic locations for testing
 */
export const mockGeoLocations: GeoLocation[] = [
  generateMockGeoLocation({
    latitude: 39.781721,
    longitude: -89.650148,
    zipCode: '62704'
  }),
  generateMockGeoLocation({
    latitude: 39.763908,
    longitude: -89.667106,
    zipCode: '62702'
  }),
  generateMockGeoLocation({
    latitude: 39.801505,
    longitude: -89.644072,
    zipCode: '62703'
  })
];

/**
 * Array of pre-defined mock time slots for testing
 */
export const mockTimeSlots: TimeSlot[] = [
  generateMockTimeSlot({
    id: 'timeslot-1',
    providerId: 'provider-1',
    startTime: new Date('2023-05-15T09:00:00Z'),
    endTime: new Date('2023-05-15T10:00:00Z')
  }),
  generateMockTimeSlot({
    id: 'timeslot-2',
    providerId: 'provider-1',
    startTime: new Date('2023-05-15T10:30:00Z'),
    endTime: new Date('2023-05-15T11:30:00Z'),
    isBooked: true,
    bookingId: 'booking-123'
  }),
  generateMockTimeSlot({
    id: 'timeslot-3',
    providerId: 'provider-2',
    startTime: new Date('2023-05-16T13:00:00Z'),
    endTime: new Date('2023-05-16T14:00:00Z'),
    serviceType: ServiceType.SPEECH_THERAPY
  })
];

/**
 * Array of pre-defined mock recurring schedules for testing
 */
export const mockRecurringSchedules: RecurringSchedule[] = [
  generateMockRecurringSchedule({
    id: 'recur-1',
    providerId: 'provider-1',
    dayOfWeek: DayOfWeek.MONDAY
  }),
  generateMockRecurringSchedule({
    id: 'recur-2',
    providerId: 'provider-1',
    dayOfWeek: DayOfWeek.WEDNESDAY
  }),
  generateMockRecurringSchedule({
    id: 'recur-3',
    providerId: 'provider-2',
    dayOfWeek: DayOfWeek.TUESDAY,
    serviceTypes: [ServiceType.SPEECH_THERAPY]
  })
];

/**
 * Array of pre-defined mock availability exceptions for testing
 */
export const mockAvailabilityExceptions: AvailabilityException[] = [
  generateMockAvailabilityException({
    id: 'exception-1',
    providerId: 'provider-1',
    date: new Date('2023-05-29T00:00:00Z'),
    reason: 'Memorial Day - Office Closed'
  }),
  generateMockAvailabilityException({
    id: 'exception-2',
    providerId: 'provider-2',
    date: new Date('2023-05-22T00:00:00Z'),
    isAvailable: false,
    reason: 'Staff Training Day'
  }),
  generateMockAvailabilityException({
    id: 'exception-3',
    providerId: 'provider-3',
    date: new Date('2023-05-19T00:00:00Z'),
    isAvailable: false,
    reason: 'Personal Leave'
  })
];

/**
 * Array of pre-defined mock availability data for testing
 */
export const mockAvailabilities: Availability[] = [
  generateMockAvailability({
    providerId: 'provider-1',
    slots: mockTimeSlots.filter(slot => slot.providerId === 'provider-1'),
    recurringSchedule: mockRecurringSchedules.filter(schedule => schedule.providerId === 'provider-1'),
    exceptions: mockAvailabilityExceptions.filter(exception => exception.providerId === 'provider-1')
  }),
  generateMockAvailability({
    providerId: 'provider-2',
    slots: mockTimeSlots.filter(slot => slot.providerId === 'provider-2'),
    recurringSchedule: mockRecurringSchedules.filter(schedule => schedule.providerId === 'provider-2'),
    exceptions: mockAvailabilityExceptions.filter(exception => exception.providerId === 'provider-2')
  })
];

/**
 * Array of pre-defined mock provider reviews for testing
 */
export const mockProviderReviews: ProviderReview[] = [
  generateMockProviderReview({
    id: 'review-1',
    providerId: 'provider-1',
    clientId: 'client-1',
    rating: 5,
    comment: 'Excellent therapist! Very knowledgeable and caring.'
  }),
  generateMockProviderReview({
    id: 'review-2',
    providerId: 'provider-1',
    clientId: 'client-2',
    rating: 4,
    comment: 'Good experience overall. Helped with my rehabilitation.',
    serviceType: ServiceType.OCCUPATIONAL_THERAPY
  }),
  generateMockProviderReview({
    id: 'review-3',
    providerId: 'provider-2',
    clientId: 'client-3',
    rating: 5,
    comment: 'Fantastic speech therapist. My child has shown great improvement.',
    serviceType: ServiceType.SPEECH_THERAPY
  })
];

/**
 * Array of pre-defined mock addresses for testing
 */
export const mockAddresses: Address[] = [
  generateMockAddress({
    street: '123 Main Street',
    city: 'Springfield',
    state: 'IL',
    zipCode: '62704'
  }),
  generateMockAddress({
    street: '456 Oak Avenue',
    city: 'Springfield',
    state: 'IL',
    zipCode: '62702'
  }),
  generateMockAddress({
    street: '789 Maple Boulevard',
    city: 'Springfield',
    state: 'IL',
    zipCode: '62703'
  })
];