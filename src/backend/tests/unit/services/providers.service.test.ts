import { ProvidersService } from '../../../src/services/providers.service';
import { ProviderProfileRepository } from '../../../src/repositories/provider-profile.repository';
import { ProviderAvailabilityRepository } from '../../../src/repositories/provider-availability.repository';
import { ProviderMatchingService } from '../../../src/services/ai/provider-matching.service';
import { CalendarIntegrationService } from '../../../src/services/calendar/calendar-integration.service';
import { ServiceType } from '../../../src/constants/service-types';
import { errorFactory } from '../../../src/utils/error-handler';
import { validateReviewSubmission } from '../../../src/utils/validation';
import { mockProviderProfiles, mockAvailabilities, mockServiceAreas, mockProviderReviews, mockTimeSlots, generateMockProviderProfile, generateMockAvailability } from '../../fixtures/providers.fixture';

// Mock the validation module
jest.mock('../../../src/utils/validation', () => ({
  validateReviewSubmission: jest.fn()
}));

// Mock the error handler module
jest.mock('../../../src/utils/error-handler', () => ({
  errorFactory: {
    createNotFoundError: jest.fn(),
    createValidationError: jest.fn(),
    createServiceError: jest.fn()
  }
}));

// Mock the logger module
jest.mock('../../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}));

describe('ProvidersService', () => {
  let providerRepository: ProviderProfileRepository;
  let availabilityRepository: ProviderAvailabilityRepository;
  let providerMatchingService: ProviderMatchingService;
  let calendarService: CalendarIntegrationService;
  let providersService: ProvidersService;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Create mock repositories and services
    providerRepository = {
      findById: jest.fn(),
      findByUserId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      search: jest.fn(),
      updateRating: jest.fn(),
      findProvidersWithServiceType: jest.fn(),
      findProvidersInArea: jest.fn(),
      findProvidersWithInsurance: jest.fn(),
      invalidateCache: jest.fn(),
      getProviderReviews: jest.fn(),
      submitReview: jest.fn(),
      getServiceAreas: jest.fn(),
      updateServiceAreas: jest.fn()
    } as unknown as ProviderProfileRepository;

    availabilityRepository = {
      findByProviderId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findAvailableTimeSlots: jest.fn(),
      checkAvailability: jest.fn(),
      bookTimeSlot: jest.fn(),
      unbookTimeSlot: jest.fn(),
      findProvidersByAvailability: jest.fn(),
      deleteByProviderId: jest.fn(),
      invalidateCache: jest.fn()
    } as unknown as ProviderAvailabilityRepository;

    providerMatchingService = {
      matchProviders: jest.fn(),
      calculateCompatibilityScore: jest.fn(),
      getMatchFactors: jest.fn()
    } as unknown as ProviderMatchingService;

    calendarService = {
      getAuthUrl: jest.fn(),
      getTokenFromCode: jest.fn(),
      setCredentials: jest.fn(),
      listCalendars: jest.fn(),
      createCalendar: jest.fn(),
      getCalendarEvents: jest.fn(),
      createEvent: jest.fn(),
      updateEvent: jest.fn(),
      deleteEvent: jest.fn(),
      syncProviderAvailability: jest.fn(),
      setupWebhookNotifications: jest.fn(),
      stopWebhookNotifications: jest.fn(),
      validateWebhook: jest.fn(),
      getProviderStatus: jest.fn(),
      getAllProvidersStatus: jest.fn(),
      initialize: jest.fn()
    } as unknown as CalendarIntegrationService;

    // Create a new instance of ProvidersService with mocked dependencies
    providersService = new ProvidersService(
      providerRepository,
      availabilityRepository,
      providerMatchingService,
      calendarService
    );
  });

  describe('getProviderProfile', () => {
    it('should return provider profile when found', async () => {
      const mockProfile = generateMockProviderProfile();
      (providerRepository.findById as jest.Mock).mockResolvedValue(mockProfile);

      const profile = await providersService.getProviderProfile('provider-123');

      expect(profile).toEqual(mockProfile);
      expect(providerRepository.findById).toHaveBeenCalledWith('provider-123');
    });

    it('should throw NotFoundError when provider not found', async () => {
      (providerRepository.findById as jest.Mock).mockResolvedValue(null);
      (errorFactory.createNotFoundError as jest.Mock).mockImplementation(() => new Error('Provider not found'));

      await expect(providersService.getProviderProfile('provider-123'))
        .rejects
        .toThrow('Provider not found');

      expect(providerRepository.findById).toHaveBeenCalledWith('provider-123');
      expect(errorFactory.createNotFoundError).toHaveBeenCalledWith('Provider profile not found with ID: provider-123');
    });
  });

  describe('updateProviderProfile', () => {
    // Add test cases for updateProviderProfile method
  });

  describe('getAvailability', () => {
    // Add test cases for getAvailability method
  });

  describe('updateAvailability', () => {
    // Add test cases for updateAvailability method
  });

  describe('searchProviders', () => {
    // Add test cases for searchProviders method
  });

  describe('matchProviders', () => {
    // Add test cases for matchProviders method
  });

  describe('getProviderReviews', () => {
    // Add test cases for getProviderReviews method
  });

  describe('submitReview', () => {
    // Add test cases for submitReview method
  });

  describe('getServiceAreas', () => {
    // Add test cases for getServiceAreas method
  });

  describe('updateServiceAreas', () => {
    // Add test cases for updateServiceAreas method
  });

  describe('syncCalendar', () => {
    // Add test cases for syncCalendar method
  });

  describe('checkAvailabilityForBooking', () => {
    // Add test cases for checkAvailabilityForBooking method
  });

  describe('findProvidersByAvailability', () => {
    // Add test cases for findProvidersByAvailability method
  });
});