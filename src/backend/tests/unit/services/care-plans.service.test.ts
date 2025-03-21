import { CarePlansService } from '../../../src/services/care-plans.service';
import { ICarePlanRepository } from '../../../src/interfaces/care-plan.interface';
import { ICarePlanGenerator } from '../../../src/interfaces/care-plan.interface';
import { INotificationService } from '../../../src/interfaces/notification.interface';
import {
  CarePlan,
  CreateCarePlanDTO,
  UpdateCarePlanDTO,
  ApproveCarePlanDTO,
  GenerateCarePlanDTO,
  CarePlanFilterParams,
  CarePlanOptionsResponse,
} from '../../../src/types/care-plan.types';
import { PlanStatus } from '../../../src/constants/plan-statuses';
import { Roles } from '../../../src/constants/roles';
import { NOTIFICATION_TYPES } from '../../../src/constants/notification-types';
import { errorFactory } from '../../../src/utils/error-handler';
import { carePlanCache } from '../../../src/cache/care-plan.cache';

// Mock the CarePlanRepository
const mockCarePlanRepository: jest.mocked<ICarePlanRepository> = jest.mocked<ICarePlanRepository>({} as ICarePlanRepository, { shallow: true });

// Mock the CarePlanGenerator
const mockCarePlanGenerator: jest.mocked<ICarePlanGenerator> = jest.mocked<ICarePlanGenerator>({} as ICarePlanGenerator, { shallow: true });

// Mock the NotificationService
const mockNotificationService: jest.mocked<INotificationService> = jest.mocked<INotificationService>({} as INotificationService, { shallow: true });

// Mock Redis publisher
const mockRedisPublisher = { publish: jest.fn() };

// Create an instance of CarePlansService with mocked dependencies
const carePlansService = new CarePlansService(mockCarePlanRepository, mockCarePlanGenerator, mockNotificationService, mockRedisPublisher);

// Setup function that runs before each test to reset mocks
beforeEach(() => {
  // Reset all mock implementations and mock return values
  jest.clearAllMocks();

  // Reset mock call history
  jest.restoreAllMocks();

  // Mock the cache functions to prevent actual cache operations during tests
  jest.spyOn(carePlanCache, 'cacheCarePlan').mockImplementation(jest.fn());
  jest.spyOn(carePlanCache, 'getCachedCarePlan').mockImplementation(jest.fn());
  jest.spyOn(carePlanCache, 'invalidateCarePlanCache').mockImplementation(jest.fn());
});

// Cleanup function that runs after each test
afterEach(() => {
  // Perform any necessary cleanup after tests
});

// Helper function to create a mock care plan for testing
const createMockCarePlan = (overrides: Partial<CarePlan> = {}): CarePlan => {
  // Create a default care plan object with all required properties
  const defaultCarePlan: CarePlan = {
    id: 'mock-care-plan-id',
    clientId: 'mock-client-id',
    createdById: 'mock-user-id',
    title: 'Mock Care Plan',
    description: 'This is a mock care plan for testing purposes.',
    status: PlanStatus.DRAFT,
    confidenceScore: 90,
    version: 1,
    previousVersionId: null,
    approvedById: null,
    approvedAt: null,
    approvalNotes: null,
    goals: [],
    interventions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Override default values with any provided overrides
  return { ...defaultCarePlan, ...overrides };
};

describe('CarePlansService', () => {
  describe('createCarePlan', () => {
    it('should create a care plan successfully', async () => {
      // Mock repository create method to return a mock care plan
      const mockCarePlan = createMockCarePlan();
      mockCarePlanRepository.create.mockResolvedValue(mockCarePlan);

      // Call createCarePlan with valid data
      const createData: CreateCarePlanDTO = {
        clientId: 'mock-client-id',
        title: 'New Care Plan',
        description: 'Description of the new care plan',
        goals: [],
        interventions: [],
      };
      const createdById = 'mock-user-id';
      const carePlan = await carePlansService.createCarePlan(createData, createdById);

      // Verify repository create was called with correct parameters
      expect(mockCarePlanRepository.create).toHaveBeenCalledWith(createData, createdById);

      // Verify notification service was called to create notification
      expect(mockNotificationService.createNotification).toHaveBeenCalled();

      // Verify Redis publisher was called to emit event
      expect(mockRedisPublisher.publish).toHaveBeenCalled();

      // Verify cache was updated
      expect(carePlanCache.cacheCarePlan).toHaveBeenCalledWith(mockCarePlan);

      // Expect the returned care plan to match the mock
      expect(carePlan).toEqual(mockCarePlan);
    });

    it('should throw an error if validation fails', async () => {
      // Call createCarePlan with invalid data (missing required fields)
      const createData: CreateCarePlanDTO = {
        clientId: '', // Missing client ID
        title: 'New Care Plan',
        description: 'Description of the new care plan',
        goals: [],
        interventions: [],
      };
      const createdById = 'mock-user-id';

      // Expect an error to be thrown with appropriate error code
      await expect(carePlansService.createCarePlan(createData, createdById)).rejects.toThrowError();

      // Verify repository create was not called
      expect(mockCarePlanRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('getCarePlanById', () => {
    it('should return a care plan from cache if available', async () => {
      // Mock cache to return a cached care plan
      const mockCarePlan = createMockCarePlan();
      carePlanCache.getCachedCarePlan = jest.fn().mockResolvedValue(mockCarePlan);

      // Call getCarePlanById with a valid ID
      const carePlan = await carePlansService.getCarePlanById('mock-care-plan-id', 'mock-user-id', Roles.CASE_MANAGER);

      // Verify cache get function was called
      expect(carePlanCache.getCachedCarePlan).toHaveBeenCalledWith('mock-care-plan-id');

      // Verify repository findById was not called
      expect(mockCarePlanRepository.findById).not.toHaveBeenCalled();

      // Expect the returned care plan to match the cached plan
      expect(carePlan).toEqual(mockCarePlan);
    });

    it('should fetch from repository if not in cache', async () => {
      // Mock cache to return null (cache miss)
      carePlanCache.getCachedCarePlan = jest.fn().mockResolvedValue(null);

      // Mock repository findById to return a care plan
      const mockCarePlan = createMockCarePlan();
      mockCarePlanRepository.findById.mockResolvedValue(mockCarePlan);

      // Call getCarePlanById with a valid ID
      const carePlan = await carePlansService.getCarePlanById('mock-care-plan-id', 'mock-user-id', Roles.CASE_MANAGER);

      // Verify cache get function was called
      expect(carePlanCache.getCachedCarePlan).toHaveBeenCalledWith('mock-care-plan-id');

      // Verify repository findById was called with correct ID
      expect(mockCarePlanRepository.findById).toHaveBeenCalledWith('mock-care-plan-id');

      // Verify cache set function was called to update cache
      expect(carePlanCache.cacheCarePlan).toHaveBeenCalledWith(mockCarePlan);

      // Expect the returned care plan to match the repository result
      expect(carePlan).toEqual(mockCarePlan);
    });

    it('should throw an error if care plan not found', async () => {
      // Mock cache to return null (cache miss)
      carePlanCache.getCachedCarePlan = jest.fn().mockResolvedValue(null);

      // Mock repository findById to return null
      mockCarePlanRepository.findById.mockResolvedValue(null);

      // Call getCarePlanById with a non-existent ID
      await expect(carePlansService.getCarePlanById('non-existent-id', 'mock-user-id', Roles.CASE_MANAGER)).rejects.toThrowError();
    });

    it('should validate user access to the care plan', async () => {
      // Mock repository to return a care plan owned by a different user
      const mockCarePlan = createMockCarePlan({ clientId: 'different-client-id' });
      mockCarePlanRepository.findById.mockResolvedValue(mockCarePlan);

      // Call getCarePlanById with valid ID but unauthorized user
      await expect(carePlansService.getCarePlanById('mock-care-plan-id', 'mock-user-id', Roles.CLIENT)).rejects.toThrowError();
    });
  });

  describe('getCarePlans', () => {
    it('should return filtered care plans', async () => {
      // Mock repository findAll to return paginated care plans
      const mockCarePlans = [createMockCarePlan(), createMockCarePlan()];
      mockCarePlanRepository.findAll.mockResolvedValue({ carePlans: mockCarePlans, total: 2 });

      // Call getCarePlans with filter parameters
      const filters: CarePlanFilterParams = {
        clientId: 'mock-client-id',
        status: PlanStatus.DRAFT,
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };
      const { carePlans, total } = await carePlansService.getCarePlans(filters, 'mock-user-id', Roles.CASE_MANAGER);

      // Verify repository findAll was called with correct filters
      expect(mockCarePlanRepository.findAll).toHaveBeenCalledWith(filters);

      // Expect the returned result to match the repository result
      expect(carePlans).toEqual(mockCarePlans);
      expect(total).toBe(2);
    });

    it('should apply access control to filters based on user role', async () => {
      // Mock repository findAll to return paginated care plans
      const mockCarePlans = [createMockCarePlan(), createMockCarePlan()];
      mockCarePlanRepository.findAll.mockResolvedValue({ carePlans: mockCarePlans, total: 2 });

      // Call getCarePlans with client role and client ID
      const clientFilters: CarePlanFilterParams = {
        clientId: 'mock-client-id',
        status: PlanStatus.DRAFT,
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };
      await carePlansService.getCarePlans(clientFilters, 'mock-client-id', Roles.CLIENT);

      // Verify repository findAll was called with filters including client ID
      expect(mockCarePlanRepository.findAll).toHaveBeenCalledWith(clientFilters);

      // Call getCarePlans with administrator role
      const adminFilters: CarePlanFilterParams = {
        status: PlanStatus.DRAFT,
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };
      await carePlansService.getCarePlans(adminFilters, 'mock-admin-id', Roles.ADMINISTRATOR);

      // Verify repository findAll was called without client ID restriction
      expect(mockCarePlanRepository.findAll).toHaveBeenCalledWith(adminFilters);
    });
  });

  describe('updateCarePlan', () => {
    it('should update a care plan successfully', async () => {
      // Mock repository findById to return an existing care plan
      const mockCarePlan = createMockCarePlan();
      mockCarePlanRepository.findById.mockResolvedValue(mockCarePlan);

      // Mock repository update to return the updated care plan
      const updatedCarePlan = createMockCarePlan({ title: 'Updated Care Plan' });
      mockCarePlanRepository.update.mockResolvedValue(updatedCarePlan);

      // Call updateCarePlan with valid ID and update data
      const updateData: UpdateCarePlanDTO = {
        title: 'Updated Care Plan',
        description: 'Updated description',
        status: PlanStatus.ACTIVE,
        goals: [],
        interventions: [],
      };
      const carePlan = await carePlansService.updateCarePlan('mock-care-plan-id', updateData, 'mock-user-id', Roles.CASE_MANAGER);

      // Verify repository findById was called with correct ID
      expect(mockCarePlanRepository.findById).toHaveBeenCalledWith('mock-care-plan-id');

      // Verify repository update was called with correct data
      expect(mockCarePlanRepository.update).toHaveBeenCalledWith('mock-care-plan-id', updateData);

      // Verify notification service was called
      expect(mockNotificationService.createNotification).toHaveBeenCalled();

      // Verify Redis publisher was called to emit event
      expect(mockRedisPublisher.publish).toHaveBeenCalled();

      // Verify cache was invalidated
      expect(carePlanCache.invalidateCarePlanCache).toHaveBeenCalledWith('mock-care-plan-id');

      // Expect the returned care plan to match the updated plan
      expect(carePlan).toEqual(updatedCarePlan);
    });

    it('should throw an error if care plan not found', async () => {
      // Mock repository findById to return null
      mockCarePlanRepository.findById.mockResolvedValue(null);

      // Call updateCarePlan with non-existent ID
      const updateData: UpdateCarePlanDTO = {
        title: 'Updated Care Plan',
        description: 'Updated description',
        status: PlanStatus.ACTIVE,
        goals: [],
        interventions: [],
      };
      await expect(carePlansService.updateCarePlan('non-existent-id', updateData, 'mock-user-id', Roles.CASE_MANAGER)).rejects.toThrowError();

      // Verify repository update was not called
      expect(mockCarePlanRepository.update).not.toHaveBeenCalled();
    });

    it("should throw an error if user doesn't have access", async () => {
      // Mock repository findById to return a care plan owned by a different user
      const mockCarePlan = createMockCarePlan({ clientId: 'different-client-id' });
      mockCarePlanRepository.findById.mockResolvedValue(mockCarePlan);

      // Call updateCarePlan with valid ID but unauthorized user
      const updateData: UpdateCarePlanDTO = {
        title: 'Updated Care Plan',
        description: 'Updated description',
        status: PlanStatus.ACTIVE,
        goals: [],
        interventions: [],
      };
      await expect(carePlansService.updateCarePlan('mock-care-plan-id', updateData, 'mock-user-id', Roles.CLIENT)).rejects.toThrowError();

      // Verify repository update was not called
      expect(mockCarePlanRepository.update).not.toHaveBeenCalled();
    });

    it('should throw an error if validation fails', async () => {
      // Mock repository findById to return an existing care plan
      const mockCarePlan = createMockCarePlan();
      mockCarePlanRepository.findById.mockResolvedValue(mockCarePlan);

      // Call updateCarePlan with invalid update data
      const updateData: UpdateCarePlanDTO = {
        title: '', // Invalid title
        description: 'Updated description',
        status: PlanStatus.ACTIVE,
        goals: [],
        interventions: [],
      };
      await expect(carePlansService.updateCarePlan('mock-care-plan-id', updateData, 'mock-user-id', Roles.CASE_MANAGER)).rejects.toThrowError();

      // Verify repository update was not called
      expect(mockCarePlanRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('approveCarePlan', () => {
    it('should approve a care plan successfully', async () => {
      // Mock repository findById to return a care plan in DRAFT status
      const mockCarePlan = createMockCarePlan({ status: PlanStatus.DRAFT });
      mockCarePlanRepository.findById.mockResolvedValue(mockCarePlan);

      // Mock repository approve to return the approved care plan
      const approvedCarePlan = createMockCarePlan({ status: PlanStatus.APPROVED });
      mockCarePlanRepository.approve.mockResolvedValue(approvedCarePlan);

      // Call approveCarePlan with valid ID and approval data
      const approveData: ApproveCarePlanDTO = { approvalNotes: 'Approved' };
      const carePlan = await carePlansService.approveCarePlan('mock-care-plan-id', approveData, 'mock-user-id', Roles.CASE_MANAGER);

      // Verify repository findById was called with correct ID
      expect(mockCarePlanRepository.findById).toHaveBeenCalledWith('mock-care-plan-id');

      // Verify repository approve was called with correct parameters
      expect(mockCarePlanRepository.approve).toHaveBeenCalledWith('mock-care-plan-id', 'mock-user-id', 'Approved');

      // Verify notification service was called
      expect(mockNotificationService.createNotification).toHaveBeenCalled();

      // Verify Redis publisher was called to emit event
      expect(mockRedisPublisher.publish).toHaveBeenCalled();

      // Verify cache was invalidated
      expect(carePlanCache.invalidateCarePlanCache).toHaveBeenCalledWith('mock-care-plan-id');

      // Expect the returned care plan to have APPROVED status
      expect(carePlan.status).toBe(PlanStatus.APPROVED);
    });

    it("should throw an error if user doesn't have permission to approve", async () => {
      // Call approveCarePlan with client role (which cannot approve)
      const approveData: ApproveCarePlanDTO = { approvalNotes: 'Approved' };
      await expect(carePlansService.approveCarePlan('mock-care-plan-id', approveData, 'mock-client-id', Roles.CLIENT)).rejects.toThrowError();

      // Verify repository approve was not called
      expect(mockCarePlanRepository.approve).not.toHaveBeenCalled();
    });

    it('should throw an error if care plan is not in approvable status', async () => {
      // Mock repository findById to return a care plan in COMPLETED status
      const mockCarePlan = createMockCarePlan({ status: PlanStatus.COMPLETED });
      mockCarePlanRepository.findById.mockResolvedValue(mockCarePlan);

      // Call approveCarePlan with valid ID
      const approveData: ApproveCarePlanDTO = { approvalNotes: 'Approved' };
      await expect(carePlansService.approveCarePlan('mock-care-plan-id', approveData, 'mock-user-id', Roles.CASE_MANAGER)).rejects.toThrowError();

      // Verify repository approve was not called
      expect(mockCarePlanRepository.approve).not.toHaveBeenCalled();
    });
  });

  describe('deleteCarePlan', () => {
    it('should delete a care plan successfully', async () => {
      // Mock repository findById to return an existing care plan
      const mockCarePlan = createMockCarePlan();
      mockCarePlanRepository.findById.mockResolvedValue(mockCarePlan);

      // Mock repository delete to return true
      mockCarePlanRepository.delete.mockResolvedValue(true);

      // Call deleteCarePlan with valid ID
      const result = await carePlansService.deleteCarePlan('mock-care-plan-id', 'mock-user-id', Roles.CASE_MANAGER);

      // Verify repository findById was called with correct ID
      expect(mockCarePlanRepository.findById).toHaveBeenCalledWith('mock-care-plan-id');

      // Verify repository delete was called with correct ID
      expect(mockCarePlanRepository.delete).toHaveBeenCalledWith('mock-care-plan-id');

      // Verify cache was invalidated
      expect(carePlanCache.invalidateCarePlanCache).toHaveBeenCalledWith('mock-care-plan-id');

      // Expect the result to be true
      expect(result).toBe(true);
    });

    it('should throw an error if care plan not found', async () => {
      // Mock repository findById to return null
      mockCarePlanRepository.findById.mockResolvedValue(null);

      // Call deleteCarePlan with non-existent ID
      await expect(carePlansService.deleteCarePlan('non-existent-id', 'mock-user-id', Roles.CASE_MANAGER)).rejects.toThrowError();

      // Verify repository delete was not called
      expect(mockCarePlanRepository.delete).not.toHaveBeenCalled();
    });

    it("should throw an error if user doesn't have access", async () => {
      // Mock repository findById to return a care plan owned by a different user
      const mockCarePlan = createMockCarePlan({ clientId: 'different-client-id' });
      mockCarePlanRepository.findById.mockResolvedValue(mockCarePlan);

      // Call deleteCarePlan with valid ID but unauthorized user
      await expect(carePlansService.deleteCarePlan('mock-care-plan-id', 'mock-user-id', Roles.CLIENT)).rejects.toThrowError();

      // Verify repository delete was not called
      expect(mockCarePlanRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('getCarePlanHistory', () => {
    it('should return care plan version history', async () => {
      // Mock repository findById to return an existing care plan
      const mockCarePlan = createMockCarePlan();
      mockCarePlanRepository.findById.mockResolvedValue(mockCarePlan);

      // Mock repository getVersionHistory to return version history
      const mockVersionHistory = { carePlanId: 'mock-care-plan-id', currentVersion: 1, versions: [] };
      mockCarePlanRepository.getVersionHistory.mockResolvedValue(mockVersionHistory);

      // Call getCarePlanHistory with valid ID
      const versionHistory = await carePlansService.getCarePlanHistory('mock-care-plan-id', 'mock-user-id', Roles.CASE_MANAGER);

      // Verify repository findById was called with correct ID
      expect(mockCarePlanRepository.findById).toHaveBeenCalledWith('mock-care-plan-id');

      // Verify repository getVersionHistory was called with correct ID
      expect(mockCarePlanRepository.getVersionHistory).toHaveBeenCalledWith('mock-care-plan-id');

      // Expect the returned history to match the repository result
      expect(versionHistory).toEqual(mockVersionHistory);
    });

    it('should throw an error if care plan not found', async () => {
      // Mock repository findById to return null
      mockCarePlanRepository.findById.mockResolvedValue(null);

      // Call getCarePlanHistory with non-existent ID
      await expect(carePlansService.getCarePlanHistory('non-existent-id', 'mock-user-id', Roles.CASE_MANAGER)).rejects.toThrowError();

      // Verify repository getVersionHistory was not called
      expect(mockCarePlanRepository.getVersionHistory).not.toHaveBeenCalled();
    });

    it("should throw an error if user doesn't have access", async () => {
      // Mock repository findById to return a care plan owned by a different user
      const mockCarePlan = createMockCarePlan({ clientId: 'different-client-id' });
      mockCarePlanRepository.findById.mockResolvedValue(mockCarePlan);

      // Call getCarePlanHistory with valid ID but unauthorized user
      await expect(carePlansService.getCarePlanHistory('mock-care-plan-id', 'mock-user-id', Roles.CLIENT)).rejects.toThrowError();

      // Verify repository getVersionHistory was not called
      expect(mockCarePlanRepository.getVersionHistory).not.toHaveBeenCalled();
    });
  });

  describe('generateCarePlanOptions', () => {
    it('should generate care plan options successfully', async () => {
      // Mock care plan generator to return options with confidence scores
      const mockOptions: CarePlanOptionsResponse = {
        clientId: 'mock-client-id',
        options: [],
        analysisMetadata: {},
      };
      mockCarePlanGenerator.generateOptions.mockResolvedValue(mockOptions);

      // Call generateCarePlanOptions with valid data
      const generateData: GenerateCarePlanDTO = {
        clientId: 'mock-client-id',
        documentIds: ['doc1', 'doc2'],
        additionalContext: {},
      };
      const options = await carePlansService.generateCarePlanOptions(generateData, 'mock-user-id', Roles.CASE_MANAGER);

      // Verify generator generateOptions was called with correct parameters
      expect(mockCarePlanGenerator.generateOptions).toHaveBeenCalledWith(generateData);

      // Expect the returned options to match the generator result
      expect(options).toEqual(mockOptions);
    });

    it("should throw an error if user doesn't have permission", async () => {
      // Call generateCarePlanOptions with client role (which cannot generate)
      const generateData: GenerateCarePlanDTO = {
        clientId: 'mock-client-id',
        documentIds: ['doc1', 'doc2'],
        additionalContext: {},
      };
      await expect(carePlansService.generateCarePlanOptions(generateData, 'mock-client-id', Roles.CLIENT)).rejects.toThrowError();

      // Verify generator generateOptions was not called
      expect(mockCarePlanGenerator.generateOptions).not.toHaveBeenCalled();
    });

    it('should throw an error if validation fails', async () => {
      // Call generateCarePlanOptions with invalid data (missing required fields)
      const generateData: GenerateCarePlanDTO = {
        clientId: '', // Missing client ID
        documentIds: ['doc1', 'doc2'],
        additionalContext: {},
      };
      await expect(carePlansService.generateCarePlanOptions(generateData, 'mock-user-id', Roles.CASE_MANAGER)).rejects.toThrowError();

      // Verify generator generateOptions was not called
      expect(mockCarePlanGenerator.generateOptions).not.toHaveBeenCalled();
    });

    it('should handle generator errors properly', async () => {
      // Mock generator to throw an error
      mockCarePlanGenerator.generateOptions.mockRejectedValue(new Error('Generator failed'));

      // Call generateCarePlanOptions with valid data
      const generateData: GenerateCarePlanDTO = {
        clientId: 'mock-client-id',
        documentIds: ['doc1', 'doc2'],
        additionalContext: {},
      };
      await expect(carePlansService.generateCarePlanOptions(generateData, 'mock-user-id', Roles.CASE_MANAGER)).rejects.toThrowError();

      // Verify generator generateOptions was not called
      expect(mockCarePlanGenerator.generateOptions).toHaveBeenCalled();

      // Verify error is logged
      // TODO: Add a check to verify that the error was logged
    });
  });

  describe('updateCarePlanStatus', () => {
    it('should update care plan status successfully', async () => {
      // Mock repository findById to return an existing care plan
      const mockCarePlan = createMockCarePlan();
      mockCarePlanRepository.findById.mockResolvedValue(mockCarePlan);

      // Mock repository updateStatus to return the updated care plan
      const updatedCarePlan = createMockCarePlan({ status: PlanStatus.ACTIVE });
      mockCarePlanRepository.updateStatus.mockResolvedValue(updatedCarePlan);

      // Call updateCarePlanStatus with valid ID and new status
      const carePlan = await carePlansService.updateCarePlanStatus('mock-care-plan-id', PlanStatus.ACTIVE, 'mock-user-id', Roles.CASE_MANAGER);

      // Verify repository findById was called with correct ID
      expect(mockCarePlanRepository.findById).toHaveBeenCalledWith('mock-care-plan-id');

      // Verify repository updateStatus was called with correct parameters
      expect(mockCarePlanRepository.updateStatus).toHaveBeenCalledWith('mock-care-plan-id', PlanStatus.ACTIVE);

      // Verify notification service was called
      expect(mockNotificationService.createNotification).toHaveBeenCalled();

      // Verify Redis publisher was called to emit event
      expect(mockRedisPublisher.publish).toHaveBeenCalled();

      // Verify cache was invalidated
      expect(carePlanCache.invalidateCarePlanCache).toHaveBeenCalledWith('mock-care-plan-id');

      // Expect the returned care plan to have the new status
      expect(carePlan.status).toBe(PlanStatus.ACTIVE);
    });

    it('should throw an error if care plan not found', async () => {
      // Mock repository findById to return null
      mockCarePlanRepository.findById.mockResolvedValue(null);

      // Call updateCarePlanStatus with non-existent ID
      await expect(carePlansService.updateCarePlanStatus('non-existent-id', PlanStatus.ACTIVE, 'mock-user-id', Roles.CASE_MANAGER)).rejects.toThrowError();

      // Verify repository updateStatus was not called
      expect(mockCarePlanRepository.updateStatus).not.toHaveBeenCalled();
    });

    it("should throw an error if user doesn't have access", async () => {
      // Mock repository findById to return a care plan owned by a different user
      const mockCarePlan = createMockCarePlan({ clientId: 'different-client-id' });
      mockCarePlanRepository.findById.mockResolvedValue(mockCarePlan);

      // Call updateCarePlanStatus with valid ID but unauthorized user
      await expect(carePlansService.updateCarePlanStatus('mock-care-plan-id', PlanStatus.ACTIVE, 'mock-user-id', Roles.CLIENT)).rejects.toThrowError();

      // Verify repository updateStatus was not called
      expect(mockCarePlanRepository.updateStatus).not.toHaveBeenCalled();
    });

    it('should throw an error if status transition is invalid', async () => {
      // Mock repository findById to return a care plan in DRAFT status
      const mockCarePlan = createMockCarePlan({ status: PlanStatus.DRAFT });
      mockCarePlanRepository.findById.mockResolvedValue(mockCarePlan);

      // Mock repository updateStatus to throw an error for invalid transition
      mockCarePlanRepository.updateStatus.mockRejectedValue(new Error('Invalid status transition'));

      // Call updateCarePlanStatus with invalid new status
      await expect(carePlansService.updateCarePlanStatus('mock-care-plan-id', PlanStatus.COMPLETED, 'mock-user-id', Roles.CASE_MANAGER)).rejects.toThrowError();

      // Verify repository updateStatus was called but handled the error
      expect(mockCarePlanRepository.updateStatus).toHaveBeenCalled();
    });
  });

  describe('validateCarePlanAccess', () => {
    it('should return true for administrator role', () => {
      // Create a mock care plan
      const mockCarePlan = createMockCarePlan();

      // Call validateCarePlanAccess with administrator role
      const result = carePlansService.validateCarePlanAccess(mockCarePlan, 'mock-admin-id', Roles.ADMINISTRATOR);

      // Expect the result to be true regardless of ownership
      expect(result).toBe(true);
    });

    it('should return true for case manager role with assigned client', () => {
      // Create a mock care plan with specific client ID
      const mockCarePlan = createMockCarePlan({ clientId: 'mock-client-id' });

      // Call validateCarePlanAccess with case manager role
      const result = carePlansService.validateCarePlanAccess(mockCarePlan, 'mock-case-manager-id', Roles.CASE_MANAGER);

      // Expect the result to be true for assigned client
      expect(result).toBe(true);
    });

    it('should return true for client who owns the care plan', () => {
      // Create a mock care plan with specific client ID
      const mockCarePlan = createMockCarePlan({ clientId: 'mock-client-id' });

      // Call validateCarePlanAccess with client role and matching client ID
      const result = carePlansService.validateCarePlanAccess(mockCarePlan, 'mock-client-id', Roles.CLIENT);

      // Expect the result to be true
      expect(result).toBe(true);
    });

    it('should return true for provider who created the care plan', () => {
      // Create a mock care plan with specific created by ID
      const mockCarePlan = createMockCarePlan({ createdById: 'mock-provider-id' });

      // Call validateCarePlanAccess with provider role and matching created by ID
      const result = carePlansService.validateCarePlanAccess(mockCarePlan, 'mock-provider-id', Roles.PROVIDER);

      // Expect the result to be true
      expect(result).toBe(true);
    });

    it('should return false for unauthorized access', () => {
      // Create a mock care plan with specific client ID and created by ID
      const mockCarePlan = createMockCarePlan({ clientId: 'mock-client-id', createdById: 'mock-provider-id' });

      // Call validateCarePlanAccess with client role but non-matching client ID
      const result = carePlansService.validateCarePlanAccess(mockCarePlan, 'different-client-id', Roles.CLIENT);

      // Expect the result to be false
      expect(result).toBe(false);
    });
  });
});