import { Request, Response } from 'express'; // express@^4.18.2
import { CarePlansController } from '../../../src/api/controllers/care-plans.controller';
import { ICarePlanService } from '../../../src/interfaces/care-plan.interface';
import { errorHandler } from '../../../src/utils/error-handler';
import { logger } from '../../../src/utils/logger';
import { CreateCarePlanDTO, UpdateCarePlanDTO, ApproveCarePlanDTO, GenerateCarePlanDTO, CarePlanFilterParams, CarePlan } from '../../../src/types/care-plan.types';
import { PlanStatus } from '../../../src/constants/plan-statuses';
import { Roles } from '../../../src/constants/roles';
import { carePlanFixtures } from '../../fixtures/care-plans.fixture';

// Mock the logger functions
jest.mock('../../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock the error handler function
jest.mock('../../../src/utils/error-handler', () => ({
  errorHandler: jest.fn(),
}));

describe('CarePlansController', () => {
  let carePlansController: CarePlansController;
  let mockCarePlanService: jest.Mocked<ICarePlanService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockCarePlanService = {
      createCarePlan: jest.fn(),
      getCarePlanById: jest.fn(),
      getCarePlans: jest.fn(),
      updateCarePlan: jest.fn(),
      approveCarePlan: jest.fn(),
      deleteCarePlan: jest.fn(),
      getCarePlanHistory: jest.fn(),
      generateCarePlanOptions: jest.fn(),
      validateCarePlanAccess: jest.fn(),
    };

    mockRequest = {
      body: {},
      params: {},
      query: {},
      user: {
        userId: 'test-user-id',
        role: Roles.CASE_MANAGER,
        email: 'test@example.com',
        isVerified: true,
        permissions: [],
      },
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    carePlansController = new CarePlansController(mockCarePlanService);
  });

  describe('createCarePlan', () => {
    it('should create a care plan and return 201 response', async () => {
      const mockCarePlanData: CreateCarePlanDTO = {
        clientId: 'test-client-id',
        title: 'Test Care Plan',
        description: 'A test care plan',
        goals: [],
        interventions: [],
      };
      (mockRequest as any).body = mockCarePlanData;

      const mockCreatedCarePlan: CarePlan = {
        id: 'test-care-plan-id',
        clientId: 'test-client-id',
        createdById: 'test-user-id',
        title: 'Test Care Plan',
        description: 'A test care plan',
        status: PlanStatus.DRAFT,
        confidenceScore: 0,
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
      mockCarePlanService.createCarePlan.mockResolvedValue(mockCreatedCarePlan);

      await carePlansController.createCarePlan(
        mockRequest as any,
        mockResponse as any
      );

      expect(mockCarePlanService.createCarePlan).toHaveBeenCalledWith(
        mockCarePlanData,
        'test-user-id'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Care plan created successfully',
        data: { carePlan: mockCreatedCarePlan },
      });
      expect(logger.info).toHaveBeenCalledWith('Care plan created successfully', { carePlanId: 'test-care-plan-id' });
    });
  });
});