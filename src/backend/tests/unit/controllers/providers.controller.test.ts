import { Request, Response, NextFunction } from 'express'; // jest-mock types
import { ProvidersController } from '../../../src/api/controllers/providers.controller';
import { ProvidersService } from '../../../src/services/providers.service';
import {
  mockProviderProfiles,
  mockServiceAreas,
  mockAvailabilities,
  mockProviderReviews,
  generateMockProviderProfile,
  generateMockAvailability,
  generateMockServiceArea,
  generateMockProviderReview
} from '../../fixtures/providers.fixture';
import { ServiceType } from '../../../src/constants/service-types';
import {
  ProviderProfile,
  Availability,
  ProviderMatch,
  ServiceArea,
  ProviderReview,
  TimeSlot,
  DateRange
} from '../../../src/types/provider.types';
import {
  ApiResponse,
  PaginatedResponse,
  ProviderResponse,
  ProviderDTO,
  AvailabilityResponse,
  ProviderMatchResponse,
  ProviderReviewResponse
} from '../../../src/types/response.types';

// Mock the ProvidersService
jest.mock('../../../src/services/providers.service');

// Utility function to create a mock Request object
const createMockRequest = (options: Partial<Request> = {}): Partial<Request> => {
  const req: Partial<Request> = {
    params: {},
    query: {},
    body: {},
    user: {},
    ...options,
  };

  return req;
};

// Utility function to create a mock Response object
const createMockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    send: jest.fn(),
  };
  return res;
};

describe('ProvidersController', () => {
  let providersController: ProvidersController;
  let providersService: jest.Mocked<ProvidersService>;
  let mockNext: NextFunction;

  beforeEach(() => {
    providersService = new ProvidersService(
      null as any,
      null as any,
      null as any,
      null as any
    ) as jest.Mocked<ProvidersService>;
    providersController = new ProvidersController(providersService);
    mockNext = jest.fn();
  });

  describe('getProviderProfile', () => {
    it('should return a provider profile when found', async () => {
      const mockProviderProfile = generateMockProviderProfile();
      (providersService.getProviderProfile as jest.Mock).mockResolvedValue(mockProviderProfile);

      const req = createMockRequest({ params: { providerId: 'provider-123' } });
      const res = createMockResponse();

      await providersController.getProviderProfile(req as Request, res as Response, mockNext);

      expect(providersService.getProviderProfile).toHaveBeenCalledWith('provider-123', {
        includeServiceAreas: false,
        includeReviews: false,
        includeAvailability: false
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Provider profile retrieved successfully',
        data: mockProviderProfile,
      });
    });

    it('should call next with an error when provider profile is not found', async () => {
      (providersService.getProviderProfile as jest.Mock).mockRejectedValue(new Error('Provider not found'));

      const req = createMockRequest({ params: { providerId: 'nonexistent-provider' } });
      const res = createMockResponse();

      await providersController.getProviderProfile(req as Request, res as Response, mockNext);

      expect(providersService.getProviderProfile).toHaveBeenCalledWith('nonexistent-provider', {
        includeServiceAreas: false,
        includeReviews: false,
        includeAvailability: false
      });
      expect(mockNext).toHaveBeenCalledWith(new Error('Provider not found'));
    });
  });

  describe('updateProviderProfile', () => {
    it('should update a provider profile successfully', async () => {
      const mockUpdatedProfile = generateMockProviderProfile({ organizationName: 'Updated Name' });
      (providersService.updateProviderProfile as jest.Mock).mockResolvedValue(mockUpdatedProfile);

      const req = createMockRequest({
        params: { providerId: 'provider-123' },
        body: { organizationName: 'Updated Name' },
      });
      const res = createMockResponse();

      await providersController.updateProviderProfile(req as Request, res as Response, mockNext);

      expect(providersService.updateProviderProfile).toHaveBeenCalledWith('provider-123', { organizationName: 'Updated Name' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Provider profile updated successfully',
        data: mockUpdatedProfile,
      });
    });

    it('should call next with an error when update fails', async () => {
      (providersService.updateProviderProfile as jest.Mock).mockRejectedValue(new Error('Update failed'));

      const req = createMockRequest({
        params: { providerId: 'provider-123' },
        body: { organizationName: 'Updated Name' },
      });
      const res = createMockResponse();

      await providersController.updateProviderProfile(req as Request, res as Response, mockNext);

      expect(providersService.updateProviderProfile).toHaveBeenCalledWith('provider-123', { organizationName: 'Updated Name' });
      expect(mockNext).toHaveBeenCalledWith(new Error('Update failed'));
    });
  });

  describe('getAvailability', () => {
    it('should return availability data successfully', async () => {
      const mockAvailability = generateMockAvailability();
      (providersService.getAvailability as jest.Mock).mockResolvedValue(mockAvailability);

      const req = createMockRequest({ params: { providerId: 'provider-123' } });
      const res = createMockResponse();

      await providersController.getAvailability(req as Request, res as Response, mockNext);

      expect(providersService.getAvailability).toHaveBeenCalledWith('provider-123', {
        startDate: undefined,
        endDate: undefined,
        serviceType: undefined
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Provider availability retrieved successfully',
        data: mockAvailability,
      });
    });

    it('should call next with an error when availability retrieval fails', async () => {
      (providersService.getAvailability as jest.Mock).mockRejectedValue(new Error('Availability retrieval failed'));

      const req = createMockRequest({ params: { providerId: 'provider-123' } });
      const res = createMockResponse();

      await providersController.getAvailability(req as Request, res as Response, mockNext);

      expect(providersService.getAvailability).toHaveBeenCalledWith('provider-123', {
        startDate: undefined,
        endDate: undefined,
        serviceType: undefined
      });
      expect(mockNext).toHaveBeenCalledWith(new Error('Availability retrieval failed'));
    });
  });

  describe('updateAvailability', () => {
    it('should update availability data successfully', async () => {
      const mockUpdatedAvailability = generateMockAvailability();
      (providersService.updateAvailability as jest.Mock).mockResolvedValue(mockUpdatedAvailability);

      const req = createMockRequest({
        params: { providerId: 'provider-123' },
        body: { slots: [] },
      });
      const res = createMockResponse();

      await providersController.updateAvailability(req as Request, res as Response, mockNext);

      expect(providersService.updateAvailability).toHaveBeenCalledWith('provider-123', { slots: [] });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Provider availability updated successfully',
        data: mockUpdatedAvailability,
      });
    });

    it('should call next with an error when availability update fails', async () => {
      (providersService.updateAvailability as jest.Mock).mockRejectedValue(new Error('Availability update failed'));

      const req = createMockRequest({
        params: { providerId: 'provider-123' },
        body: { slots: [] },
      });
      const res = createMockResponse();

      await providersController.updateAvailability(req as Request, res as Response, mockNext);

      expect(providersService.updateAvailability).toHaveBeenCalledWith('provider-123', { slots: [] });
      expect(mockNext).toHaveBeenCalledWith(new Error('Availability update failed'));
    });
  });
});