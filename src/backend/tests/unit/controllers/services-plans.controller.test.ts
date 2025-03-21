import { Request, Response, NextFunction } from 'express'; // express@^4.18.2
import { ServicesPlanController } from '../../../src/api/controllers/services-plans.controller';
import { IServicesPlanService } from '../../../src/interfaces/services-plan.interface';
import { errorFactory } from '../../../src/utils/error-handler';
import {
  mockServicesPlans,
  mockNeedsAssessments,
  mockCreateServicesPlanDTOs,
  mockUpdateServicesPlanDTOs,
  mockCreateNeedsAssessmentDTOs
} from '../../fixtures/services-plans.fixture';
import { mockUsers } from '../../fixtures/users.fixture';

describe('ServicesPlanController', () => {
  let servicesPlanService: IServicesPlanService;
  let controller: ServicesPlanController;

  beforeEach(() => {
    servicesPlanService = createMockServicesPlanService();
    controller = new ServicesPlanController(servicesPlanService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createNeedsAssessment', () => {
    it('should create a needs assessment and return success response', async () => {
      const mockService = createMockServicesPlanService();
      const mockRequest = createMockRequest({ body: mockCreateNeedsAssessmentDTOs[0], user: { userId: mockUsers[0].id } });
      const mockResponse = createMockResponse();
      const next = jest.fn();
    
      (mockService.createNeedsAssessment as jest.Mock).mockResolvedValue(mockNeedsAssessments[0]);
    
      await controller.createNeedsAssessment(mockRequest as any, mockResponse as any, next);
    
      expect(mockService.createNeedsAssessment).toHaveBeenCalledWith(mockCreateNeedsAssessmentDTOs[0], mockUsers[0].id);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Needs assessment created successfully',
        data: mockNeedsAssessments[0],
      });
    });

    it('should pass errors to next function', async () => {
      const mockService = createMockServicesPlanService();
      const mockRequest = createMockRequest({ body: mockCreateNeedsAssessmentDTOs[0], user: { userId: mockUsers[0].id } });
      const mockResponse = createMockResponse();
      const next = jest.fn();
    
      const mockError = new Error('Test error');
      (mockService.createNeedsAssessment as jest.Mock).mockRejectedValue(mockError);
    
      await controller.createNeedsAssessment(mockRequest as any, mockResponse as any, next);
    
      expect(next).toHaveBeenCalledWith(mockError);
    });
  });

  describe('getNeedsAssessment', () => {
    it('should get a needs assessment by ID and return success response', async () => {
      const mockService = createMockServicesPlanService();
      const mockRequest = createMockRequest({ params: { id: mockNeedsAssessments[0].id } });
      const mockResponse = createMockResponse();
      const next = jest.fn();
    
      (mockService.getNeedsAssessment as jest.Mock).mockResolvedValue(mockNeedsAssessments[0]);
    
      await controller.getNeedsAssessment(mockRequest as any, mockResponse as any, next);
    
      expect(mockService.getNeedsAssessment).toHaveBeenCalledWith(mockNeedsAssessments[0].id);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Needs assessment retrieved successfully',
        data: mockNeedsAssessments[0],
      });
    });

    it('should pass errors to next function', async () => {
      const mockService = createMockServicesPlanService();
      const mockRequest = createMockRequest({ params: { id: mockNeedsAssessments[0].id } });
      const mockResponse = createMockResponse();
      const next = jest.fn();
    
      const mockError = new Error('Test error');
      (mockService.getNeedsAssessment as jest.Mock).mockRejectedValue(mockError);
    
      await controller.getNeedsAssessment(mockRequest as any, mockResponse as any, next);
    
      expect(next).toHaveBeenCalledWith(mockError);
    });
  });

  describe('getNeedsAssessmentsByClientId', () => {
    it('should get needs assessments by client ID and return success response', async () => {
      const mockService = createMockServicesPlanService();
      const mockRequest = createMockRequest({ params: { clientId: mockUsers[0].id } });
      const mockResponse = createMockResponse();
      const next = jest.fn();
    
      (mockService.getNeedsAssessmentsByClientId as jest.Mock).mockResolvedValue([mockNeedsAssessments[0]]);
    
      await controller.getNeedsAssessmentsByClientId(mockRequest as any, mockResponse as any, next);
    
      expect(mockService.getNeedsAssessmentsByClientId).toHaveBeenCalledWith(mockUsers[0].id);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Needs assessments retrieved successfully',
        data: [mockNeedsAssessments[0]],
      });
    });

    it('should pass errors to next function', async () => {
      const mockService = createMockServicesPlanService();
      const mockRequest = createMockRequest({ params: { clientId: mockUsers[0].id } });
      const mockResponse = createMockResponse();
      const next = jest.fn();
    
      const mockError = new Error('Test error');
      (mockService.getNeedsAssessmentsByClientId as jest.Mock).mockRejectedValue(mockError);
    
      await controller.getNeedsAssessmentsByClientId(mockRequest as any, mockResponse as any, next);
    
      expect(next).toHaveBeenCalledWith(mockError);
    });
  });

  describe('createServicesPlan', () => {
    it('should create a services plan and return success response', async () => {
      const mockService = createMockServicesPlanService();
      const mockRequest = createMockRequest({ body: mockCreateServicesPlanDTOs[0], user: { userId: mockUsers[0].id } });
      const mockResponse = createMockResponse();
      const next = jest.fn();
    
      (mockService.createServicesPlan as jest.Mock).mockResolvedValue(mockServicesPlans[0]);
    
      await controller.createServicesPlan(mockRequest as any, mockResponse as any, next);
    
      expect(mockService.createServicesPlan).toHaveBeenCalledWith(mockCreateServicesPlanDTOs[0], mockUsers[0].id);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Services plan created successfully',
        data: mockServicesPlans[0],
      });
    });

    it('should pass errors to next function', async () => {
      const mockService = createMockServicesPlanService();
      const mockRequest = createMockRequest({ body: mockCreateServicesPlanDTOs[0], user: { userId: mockUsers[0].id } });
      const mockResponse = createMockResponse();
      const next = jest.fn();
    
      const mockError = new Error('Test error');
      (mockService.createServicesPlan as jest.Mock).mockRejectedValue(mockError);
    
      await controller.createServicesPlan(mockRequest as any, mockResponse as any, next);
    
      expect(next).toHaveBeenCalledWith(mockError);
    });
  });

  describe('getServicesPlanById', () => {
    it('should get a services plan by ID and return success response', async () => {
      const mockService = createMockServicesPlanService();
      const mockRequest = createMockRequest({ params: { id: mockServicesPlans[0].id } });
      const mockResponse = createMockResponse();
      const next = jest.fn();
    
      (mockService.getServicesPlanById as jest.Mock).mockResolvedValue(mockServicesPlans[0]);
    
      await controller.getServicesPlanById(mockRequest as any, mockResponse as any, next);
    
      expect(mockService.getServicesPlanById).toHaveBeenCalledWith(mockServicesPlans[0].id);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Services plan retrieved successfully',
        data: mockServicesPlans[0],
      });
    });

    it('should pass errors to next function', async () => {
      const mockService = createMockServicesPlanService();
      const mockRequest = createMockRequest({ params: { id: mockServicesPlans[0].id } });
      const mockResponse = createMockResponse();
      const next = jest.fn();
    
      const mockError = new Error('Test error');
      (mockService.getServicesPlanById as jest.Mock).mockRejectedValue(mockError);
    
      await controller.getServicesPlanById(mockRequest as any, mockResponse as any, next);
    
      expect(next).toHaveBeenCalledWith(mockError);
    });
  });

  describe('getServicesPlans', () => {
    it('should get services plans with filters and return paginated response', async () => {
      const mockService = createMockServicesPlanService();
      const mockRequest = createMockRequest({ query: { clientId: mockUsers[0].id } });
      const mockResponse = createMockResponse();
      const next = jest.fn();
    
      (mockService.getServicesPlans as jest.Mock).mockResolvedValue([mockServicesPlans[0]]);
    
      await controller.getServicesPlans(mockRequest as any, mockResponse as any, next);
    
      expect(mockService.getServicesPlans).toHaveBeenCalledWith({ clientId: mockUsers[0].id });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Services plans retrieved successfully',
        data: [mockServicesPlans[0]],
      });
    });

    it('should pass errors to next function', async () => {
      const mockService = createMockServicesPlanService();
      const mockRequest = createMockRequest({ query: { clientId: mockUsers[0].id } });
      const mockResponse = createMockResponse();
      const next = jest.fn();
    
      const mockError = new Error('Test error');
      (mockService.getServicesPlans as jest.Mock).mockRejectedValue(mockError);
    
      await controller.getServicesPlans(mockRequest as any, mockResponse as any, next);
    
      expect(next).toHaveBeenCalledWith(mockError);
    });
  });

  describe('updateServicesPlan', () => {
    it('should update a services plan and return success response', async () => {
      const mockService = createMockServicesPlanService();
      const mockRequest = createMockRequest({ params: { id: mockServicesPlans[0].id }, body: mockUpdateServicesPlanDTOs[0] });
      const mockResponse = createMockResponse();
      const next = jest.fn();
    
      (mockService.updateServicesPlan as jest.Mock).mockResolvedValue(mockServicesPlans[0]);
    
      await controller.updateServicesPlan(mockRequest as any, mockResponse as any, next);
    
      expect(mockService.updateServicesPlan).toHaveBeenCalledWith(mockServicesPlans[0].id, mockUpdateServicesPlanDTOs[0]);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Services plan updated successfully',
        data: mockServicesPlans[0],
      });
    });

    it('should pass errors to next function', async () => {
      const mockService = createMockServicesPlanService();
      const mockRequest = createMockRequest({ params: { id: mockServicesPlans[0].id }, body: mockUpdateServicesPlanDTOs[0] });
      const mockResponse = createMockResponse();
      const next = jest.fn();
    
      const mockError = new Error('Test error');
      (mockService.updateServicesPlan as jest.Mock).mockRejectedValue(mockError);
    
      await controller.updateServicesPlan(mockRequest as any, mockResponse as any, next);
    
      expect(next).toHaveBeenCalledWith(mockError);
    });
  });

  describe('approveServicesPlan', () => {
    it('should approve a services plan and return success response', async () => {
      const mockService = createMockServicesPlanService();
      const mockRequest = createMockRequest({ params: { id: mockServicesPlans[0].id }, body: { approvalNotes: 'Approved' }, user: { userId: mockUsers[0].id } });
      const mockResponse = createMockResponse();
      const next = jest.fn();
    
      (mockService.approveServicesPlan as jest.Mock).mockResolvedValue(mockServicesPlans[0]);
    
      await controller.approveServicesPlan(mockRequest as any, mockResponse as any, next);
    
      expect(mockService.approveServicesPlan).toHaveBeenCalledWith(mockServicesPlans[0].id, { approvalNotes: 'Approved' }, mockUsers[0].id);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Services plan approved successfully',
        data: mockServicesPlans[0],
      });
    });

    it('should pass errors to next function', async () => {
      const mockService = createMockServicesPlanService();
      const mockRequest = createMockRequest({ params: { id: mockServicesPlans[0].id }, body: { approvalNotes: 'Approved' }, user: { userId: mockUsers[0].id } });
      const mockResponse = createMockResponse();
      const next = jest.fn();
    
      const mockError = new Error('Test error');
      (mockService.approveServicesPlan as jest.Mock).mockRejectedValue(mockError);
    
      await controller.approveServicesPlan(mockRequest as any, mockResponse as any, next);
    
      expect(next).toHaveBeenCalledWith(mockError);
    });
  });

  describe('deleteServicesPlan', () => {
    it('should delete a services plan and return success response', async () => {
      const mockService = createMockServicesPlanService();
      const mockRequest = createMockRequest({ params: { id: mockServicesPlans[0].id } });
      const mockResponse = createMockResponse();
      const next = jest.fn();
    
      (mockService.deleteServicesPlan as jest.Mock).mockResolvedValue(true);
    
      await controller.deleteServicesPlan(mockRequest as any, mockResponse as any, next);
    
      expect(mockService.deleteServicesPlan).toHaveBeenCalledWith(mockServicesPlans[0].id);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Services plan deleted successfully',
        data: { deleted: true },
      });
    });

    it('should pass errors to next function', async () => {
      const mockService = createMockServicesPlanService();
      const mockRequest = createMockRequest({ params: { id: mockServicesPlans[0].id } });
      const mockResponse = createMockResponse();
      const next = jest.fn();
    
      const mockError = new Error('Test error');
      (mockService.deleteServicesPlan as jest.Mock).mockRejectedValue(mockError);
    
      await controller.deleteServicesPlan(mockRequest as any, mockResponse as any, next);
    
      expect(next).toHaveBeenCalledWith(mockError);
    });
  });

  describe('generateServicesPlanOptions', () => {
    it('should generate services plan options and return success response', async () => {
      const mockService = createMockServicesPlanService();
      const mockRequest = createMockRequest({ body: { clientId: mockUsers[0].id, needsAssessmentId: mockNeedsAssessments[0].id }, user: { userId: mockUsers[0].id } });
      const mockResponse = createMockResponse();
      const next = jest.fn();
    
      (mockService.generateServicesPlanOptions as jest.Mock).mockResolvedValue({ options: [mockServicesPlans[0]], confidenceScores: { [mockServicesPlans[0].id]: 0.8 } });
    
      await controller.generateServicesPlanOptions(mockRequest as any, mockResponse as any, next);
    
      expect(mockService.generateServicesPlanOptions).toHaveBeenCalledWith({ clientId: mockUsers[0].id, needsAssessmentId: mockNeedsAssessments[0].id });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Services plan options generated successfully',
        data: { options: [mockServicesPlans[0]], confidenceScores: { [mockServicesPlans[0].id]: 0.8 } },
      });
    });

    it('should pass errors to next function', async () => {
      const mockService = createMockServicesPlanService();
      const mockRequest = createMockRequest({ body: { clientId: mockUsers[0].id, needsAssessmentId: mockNeedsAssessments[0].id }, user: { userId: mockUsers[0].id } });
      const mockResponse = createMockResponse();
      const next = jest.fn();
    
      const mockError = new Error('Test error');
      (mockService.generateServicesPlanOptions as jest.Mock).mockRejectedValue(mockError);
    
      await controller.generateServicesPlanOptions(mockRequest as any, mockResponse as any, next);
    
      expect(next).toHaveBeenCalledWith(mockError);
    });
  });

  describe('estimateCosts', () => {
    it('should estimate costs for a services plan and return success response', async () => {
      const mockService = createMockServicesPlanService();
      const mockRequest = createMockRequest({ params: { id: mockServicesPlans[0].id } });
      const mockResponse = createMockResponse();
      const next = jest.fn();
    
      (mockService.estimateCosts as jest.Mock).mockResolvedValue({ totalCost: 1000 });
    
      await controller.estimateCosts(mockRequest as any, mockResponse as any, next);
    
      expect(mockService.estimateCosts).toHaveBeenCalledWith(mockServicesPlans[0].id);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Cost estimate generated successfully',
        data: { totalCost: 1000 },
      });
    });

    it('should pass errors to next function', async () => {
      const mockService = createMockServicesPlanService();
      const mockRequest = createMockRequest({ params: { id: mockServicesPlans[0].id } });
      const mockResponse = createMockResponse();
      const next = jest.fn();
    
      const mockError = new Error('Test error');
      (mockService.estimateCosts as jest.Mock).mockRejectedValue(mockError);
    
      await controller.estimateCosts(mockRequest as any, mockResponse as any, next);
    
      expect(next).toHaveBeenCalledWith(mockError);
    });
  });

  describe('identifyFundingSources', () => {
    it('should identify funding sources and return success response', async () => {
      const mockService = createMockServicesPlanService();
      const mockRequest = createMockRequest({ params: { clientId: mockUsers[0].id, id: mockServicesPlans[0].id } });
      const mockResponse = createMockResponse();
      const next = jest.fn();
    
      (mockService.identifyFundingSources as jest.Mock).mockResolvedValue({ availableSources: [], recommendedSources: [] });
    
      await controller.identifyFundingSources(mockRequest as any, mockResponse as any, next);
    
      expect(mockService.identifyFundingSources).toHaveBeenCalledWith(mockUsers[0].id, mockServicesPlans[0].id);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Funding sources identified successfully',
        data: { availableSources: [], recommendedSources: [] },
      });
    });

    it('should pass errors to next function', async () => {
      const mockService = createMockServicesPlanService();
      const mockRequest = createMockRequest({ params: { clientId: mockUsers[0].id, id: mockServicesPlans[0].id } });
      const mockResponse = createMockResponse();
      const next = jest.fn();
    
      const mockError = new Error('Test error');
      (mockService.identifyFundingSources as jest.Mock).mockRejectedValue(mockError);
    
      await controller.identifyFundingSources(mockRequest as any, mockResponse as any, next);
    
      expect(next).toHaveBeenCalledWith(mockError);
    });
  });
});

// Helper function to create a mock ServicesPlanService
function createMockServicesPlanService(): IServicesPlanService {
  return {
    createNeedsAssessment: jest.fn(),
    getNeedsAssessment: jest.fn(),
    getNeedsAssessmentsByClientId: jest.fn(),
    createServicesPlan: jest.fn(),
    getServicesPlanById: jest.fn(),
    getServicesPlans: jest.fn(),
    updateServicesPlan: jest.fn(),
    approveServicesPlan: jest.fn(),
    deleteServicesPlan: jest.fn(),
    generateServicesPlanOptions: jest.fn(),
    estimateCosts: jest.fn(),
    identifyFundingSources: jest.fn(),
  };
}

// Helper function to create a mock Express request object with authentication
function createMockRequest({ body = {}, params = {}, query = {}, user = null }): Request {
  const req = {
    body: body,
    params: params,
    query: query,
  } as any;

  if (user) {
    req.user = user;
  }

  return req;
}

// Helper function to create a mock Express response object with jest spies
function createMockResponse(): Response {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res as Response;
}