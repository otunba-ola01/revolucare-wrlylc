import { ServicesPlanService } from '../../../src/services/services-plans.service';
import { ServicesPlanRepository, NeedsAssessmentRepository } from '../../../src/repositories/services-plan.repository';
import { ProviderMatchingService } from '../../../src/services/ai/provider-matching.service';
import { CarePlanService } from '../../../src/services/care-plans.service';
import { PaymentProcessingService } from '../../../src/services/payment/payment-processing.service';
import { OpenAIService } from '../../../src/integrations/openai';
import { PlanStatus } from '../../../src/constants/plan-statuses';
import { ServiceType } from '../../../src/constants/service-types';
import { AIModelType } from '../../../src/types/ai.types';
import { errorFactory } from '../../../src/utils/error-handler';
import { ServicesPlan, NeedsAssessment, CreateNeedsAssessmentDTO, CreateServicesPlanDTO, UpdateServicesPlanDTO, ServicesPlanFilterParams } from '../../../src/types/services-plan.types';
import { mockServicesPlans, mockNeedsAssessments, mockServiceItems, mockFundingSources, generateMockCreateNeedsAssessmentDTO, generateMockCreateServicesPlanDTO, generateMockUpdateServicesPlanDTO } from '../../fixtures/services-plans.fixture';
import { mockCarePlans } from '../../fixtures/care-plans.fixture';

/**
 * Creates mock repositories and services for testing
 * @returns Object containing mocked repositories and services
 */
const createMockRepositories = () => {
  // Create mock ServicesPlanRepository with jest.fn() for all methods
  const mockServicesPlanRepository: jest.Mocked<ServicesPlanRepository> = {
    findById: jest.fn(),
    findByClientId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findAll: jest.fn(),
    calculateTotalCost: jest.fn(),
    addServiceItem: jest.fn(),
    updateServiceItem: jest.fn(),
    removeServiceItem: jest.fn(),
    addFundingSource: jest.fn(),
    updateFundingSource: jest.fn(),
    removeFundingSource: jest.fn(),
    updateStatus: jest.fn(),
    approve: jest.fn(),
  } as any;

  // Create mock NeedsAssessmentRepository with jest.fn() for all methods
  const mockNeedsAssessmentRepository: jest.Mocked<NeedsAssessmentRepository> = {
    findById: jest.fn(),
    findByClientId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  } as any;

  // Create mock ProviderMatchingService with jest.fn() for matchProviders method
  const mockProviderMatchingService: jest.Mocked<ProviderMatchingService> = {
    matchProviders: jest.fn(),
    calculateCompatibilityScore: jest.fn(),
    getMatchFactors: jest.fn(),
    enhanceMatchingWithAI: jest.fn(),
  } as any;

  // Create mock CarePlanService with jest.fn() for getCarePlanById method
  const mockCarePlanService: jest.Mocked<CarePlanService> = {
    createCarePlan: jest.fn(),
    getCarePlanById: jest.fn(),
    getCarePlans: jest.fn(),
    updateCarePlan: jest.fn(),
    approveCarePlan: jest.fn(),
    deleteCarePlan: jest.fn(),
    getCarePlanHistory: jest.fn(),
    generateCarePlanOptions: jest.fn(),
    updateCarePlanStatus: jest.fn(),
    validateCarePlanAccess: jest.fn(),
  } as any;

  // Create mock PaymentProcessingService with jest.fn() for calculateServiceCost method
  const mockPaymentProcessingService: jest.Mocked<PaymentProcessingService> = {
    createPaymentIntent: jest.fn(),
    processPayment: jest.fn(),
    getPaymentStatus: jest.fn(),
    cancelPayment: jest.fn(),
    refundPayment: jest.fn(),
    handleWebhook: jest.fn(),
  } as any;

  // Create mock OpenAIService with jest.fn() for createChatCompletion method
  const mockOpenAIService: jest.Mocked<OpenAIService> = {
    initialize: jest.fn(),
    createChatCompletion: jest.fn(),
    createEmbedding: jest.fn(),
    validateWebhook: jest.fn(),
    getStatus: jest.fn(),
    request: jest.fn(),
  } as any;

  return {
    mockServicesPlanRepository,
    mockNeedsAssessmentRepository,
    mockProviderMatchingService,
    mockCarePlanService,
    mockPaymentProcessingService,
    mockOpenAIService,
  };
};

describe('ServicesPlanService', () => {
  let servicesPlanService: ServicesPlanService;
  let mockServicesPlanRepository: jest.Mocked<ServicesPlanRepository>;
  let mockNeedsAssessmentRepository: jest.Mocked<NeedsAssessmentRepository>;
  let mockProviderMatchingService: jest.Mocked<ProviderMatchingService>;
  let mockCarePlanService: jest.Mocked<CarePlanService>;
  let mockPaymentProcessingService: jest.Mocked<PaymentProcessingService>;
  let mockOpenAIService: jest.Mocked<OpenAIService>;

  beforeEach(() => {
    const {
      mockServicesPlanRepository: servicesPlanRepo,
      mockNeedsAssessmentRepository: needsAssessmentRepo,
      mockProviderMatchingService: providerMatchingSvc,
      mockCarePlanService: carePlanSvc,
      mockPaymentProcessingService: paymentProcessingSvc,
      mockOpenAIService: openAISvc,
    } = createMockRepositories();

    mockServicesPlanRepository = servicesPlanRepo;
    mockNeedsAssessmentRepository = needsAssessmentRepo;
    mockProviderMatchingService = providerMatchingSvc;
    mockCarePlanService = carePlanSvc;
    mockPaymentProcessingService = paymentProcessingSvc;
    mockOpenAIService = openAISvc;

    servicesPlanService = new ServicesPlanService(
      mockServicesPlanRepository,
      mockNeedsAssessmentRepository,
      mockProviderMatchingService,
      mockCarePlanService,
      mockPaymentProcessingService,
      mockOpenAIService
    );
  });

  it('should create a needs assessment', async () => {
    const mockCreateNeedsAssessmentDTO = generateMockCreateNeedsAssessmentDTO();
    const mockCreatedNeedsAssessment = mockNeedsAssessments[0];
    mockNeedsAssessmentRepository.create.mockResolvedValue(mockCreatedNeedsAssessment);

    const createdNeedsAssessment = await servicesPlanService.createNeedsAssessment(mockCreateNeedsAssessmentDTO, 'user-id');

    expect(mockNeedsAssessmentRepository.create).toHaveBeenCalledWith(mockCreateNeedsAssessmentDTO, 'user-id');
    expect(createdNeedsAssessment).toEqual(mockCreatedNeedsAssessment);
  });

  it('should get a needs assessment by ID', async () => {
    const mockNeedsAssessment = mockNeedsAssessments[0];
    mockNeedsAssessmentRepository.findById.mockResolvedValue(mockNeedsAssessment);

    const needsAssessment = await servicesPlanService.getNeedsAssessment('assessment-id');

    expect(mockNeedsAssessmentRepository.findById).toHaveBeenCalledWith('assessment-id');
    expect(needsAssessment).toEqual(mockNeedsAssessment);
  });

  it('should throw an error if needs assessment is not found', async () => {
    mockNeedsAssessmentRepository.findById.mockResolvedValue(null);

    await expect(servicesPlanService.getNeedsAssessment('assessment-id'))
      .rejects.toEqual(errorFactory.createNotFoundError('Needs assessment not found', { needsAssessmentId: 'assessment-id' }));
  });

  it('should get all needs assessments for a client', async () => {
    mockNeedsAssessmentRepository.findByClientId.mockResolvedValue(mockNeedsAssessments);

    const needsAssessments = await servicesPlanService.getNeedsAssessmentsByClientId('client-id');

    expect(mockNeedsAssessmentRepository.findByClientId).toHaveBeenCalledWith('client-id');
    expect(needsAssessments).toEqual(mockNeedsAssessments);
  });

  it('should create a services plan', async () => {
    const mockCreateServicesPlanDTO = generateMockCreateServicesPlanDTO();
    const mockCreatedServicesPlan = mockServicesPlans[0];
    mockServicesPlanRepository.create.mockResolvedValue(mockCreatedServicesPlan);
    mockNeedsAssessmentRepository.findById.mockResolvedValue(mockNeedsAssessments[0]);
    mockCarePlanService.getCarePlanById.mockResolvedValue(mockCarePlans[0]);
    mockServicesPlanRepository.calculateTotalCost.mockResolvedValue(mockCreatedServicesPlan.estimatedCost);

    const createdServicesPlan = await servicesPlanService.createServicesPlan(mockCreateServicesPlanDTO, 'user-id');

    expect(mockServicesPlanRepository.create).toHaveBeenCalledWith(mockCreateServicesPlanDTO, 'user-id');
    expect(createdServicesPlan).toEqual(mockCreatedServicesPlan);
  });

  it('should get a services plan by ID', async () => {
    const mockServicesPlan = mockServicesPlans[0];
    mockServicesPlanRepository.findById.mockResolvedValue(mockServicesPlan);

    const servicesPlan = await servicesPlanService.getServicesPlanById('plan-id');

    expect(mockServicesPlanRepository.findById).toHaveBeenCalledWith('plan-id');
    expect(servicesPlan).toEqual(mockServicesPlan);
  });

  it('should throw an error if services plan is not found', async () => {
    mockServicesPlanRepository.findById.mockResolvedValue(null);

    await expect(servicesPlanService.getServicesPlanById('plan-id'))
      .rejects.toEqual(errorFactory.createNotFoundError('Services plan not found', { servicesPlanId: 'plan-id' }));
  });

  it('should get services plans based on filter parameters', async () => {
    const mockServicesPlanFilterParams: ServicesPlanFilterParams = { clientId: 'client-id' };
    mockServicesPlanRepository.findAll.mockResolvedValue(mockServicesPlans);

    const servicesPlans = await servicesPlanService.getServicesPlans(mockServicesPlanFilterParams);

    expect(mockServicesPlanRepository.findAll).toHaveBeenCalledWith(mockServicesPlanFilterParams);
    expect(servicesPlans).toEqual(mockServicesPlans);
  });

  it('should update a services plan', async () => {
    const mockUpdateServicesPlanDTO = generateMockUpdateServicesPlanDTO();
    const mockUpdatedServicesPlan = mockServicesPlans[0];
    mockServicesPlanRepository.findById.mockResolvedValue(mockUpdatedServicesPlan);
    mockServicesPlanRepository.update.mockResolvedValue(mockUpdatedServicesPlan);

    const updatedServicesPlan = await servicesPlanService.updateServicesPlan('plan-id', mockUpdateServicesPlanDTO);

    expect(mockServicesPlanRepository.update).toHaveBeenCalledWith('plan-id', mockUpdateServicesPlanDTO);
    expect(updatedServicesPlan).toEqual(mockUpdatedServicesPlan);
  });

  it('should approve a services plan', async () => {
    const mockApproveServicesPlanDTO = { notes: 'Approved' };
    const mockApprovedServicesPlan = mockServicesPlans[0];
    mockServicesPlanRepository.findById.mockResolvedValue(mockApprovedServicesPlan);
    mockServicesPlanRepository.approve.mockResolvedValue(mockApprovedServicesPlan);

    const approvedServicesPlan = await servicesPlanService.approveServicesPlan('plan-id', 'user-id', mockApproveServicesPlanDTO);

    expect(mockServicesPlanRepository.approve).toHaveBeenCalledWith('plan-id', 'user-id', mockApproveServicesPlanDTO.notes);
    expect(approvedServicesPlan).toEqual(mockApprovedServicesPlan);
  });

  it('should delete a services plan', async () => {
    mockServicesPlanRepository.findById.mockResolvedValue(mockServicesPlans[0]);
    mockServicesPlanRepository.delete.mockResolvedValue(true);

    const result = await servicesPlanService.deleteServicesPlan('plan-id');

    expect(mockServicesPlanRepository.delete).toHaveBeenCalledWith('plan-id');
    expect(result).toBe(true);
  });
});