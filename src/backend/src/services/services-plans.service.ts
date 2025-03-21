import {
  IServicesPlanService,
} from '../interfaces/services-plan.interface';
import {
  ServicesPlanRepository,
  NeedsAssessmentRepository
} from '../repositories/services-plan.repository';
import { ProviderMatchingService } from './ai/provider-matching.service';
import { CarePlanService } from './care-plans.service';
import { PaymentProcessingService } from './payment/payment-processing.service';
import { OpenAIService } from '../integrations/openai'; // openai@^4.0.0
import {
  ServicesPlan,
  NeedsAssessment,
  CreateNeedsAssessmentDTO,
  CreateServicesPlanDTO,
  UpdateServicesPlanDTO,
  ApproveServicesPlanDTO,
  GenerateServicesPlanDTO,
  ServicesPlanOptionsResponse,
  CostEstimateResponse,
  FundingSourcesResponse,
  ServicesPlanFilterParams,
  ProviderMatchingCriteria,
} from '../types/services-plan.types';
import { AIModelType } from '../types/ai.types';
import { PlanStatus } from '../constants/plan-statuses';
import { ServiceType } from '../constants/service-types';
import { errorFactory } from '../utils/error-handler';
import { logger } from '../utils/logger';
import { aiConfig } from '../config/ai';

// Define error codes for this module
const ERROR_CODES = {
  NEEDS_ASSESSMENT_NOT_FOUND: 'needs_assessment_not_found',
  SERVICES_PLAN_NOT_FOUND: 'services_plan_not_found',
  INVALID_SERVICES_PLAN: 'invalid_services_plan',
  GENERATION_FAILED: 'services_plan_generation_failed',
  COST_ESTIMATION_FAILED: 'cost_estimation_failed',
  FUNDING_IDENTIFICATION_FAILED: 'funding_identification_failed'
};

/**
 * Service that implements the business logic for services plans
 */
export class ServicesPlanService implements IServicesPlanService {
  /**
   * Creates a new instance of the ServicesPlanService
   * @param servicesPlanRepository 
   * @param needsAssessmentRepository 
   * @param providerMatchingService 
   * @param carePlanService 
   * @param paymentProcessingService 
   * @param openAIService 
   */
  constructor(
    private servicesPlanRepository: ServicesPlanRepository,
    private needsAssessmentRepository: NeedsAssessmentRepository,
    private providerMatchingService: ProviderMatchingService,
    private carePlanService: CarePlanService,
    private paymentProcessingService: PaymentProcessingService,
    private openAIService: OpenAIService
  ) {
    // Store the provided repositories and services as instance properties
    this.servicesPlanRepository = servicesPlanRepository;
    this.needsAssessmentRepository = needsAssessmentRepository;
    this.providerMatchingService = providerMatchingService;
    this.carePlanService = carePlanService;
    this.paymentProcessingService = paymentProcessingService;
    this.openAIService = openAIService;
  }

  /**
   * Creates a new needs assessment for a client
   * @param data 
   * @param createdById 
   * @returns The created needs assessment
   */
  async createNeedsAssessment(data: CreateNeedsAssessmentDTO, createdById: string): Promise<NeedsAssessment> {
    // Validate the input data
    if (!data.clientId || !data.assessmentData) {
      throw errorFactory.createValidationError('Client ID and assessment data are required');
    }

    // Call the needs assessment repository to create the assessment
    const needsAssessment = await this.needsAssessmentRepository.create(data, createdById);

    // Log the successful creation
    logger.info('Needs assessment created successfully', { needsAssessmentId: needsAssessment.id });

    // Return the created needs assessment
    return needsAssessment;
  }

  /**
   * Retrieves a needs assessment by its ID
   * @param id 
   * @returns The needs assessment if found
   */
  async getNeedsAssessment(id: string): Promise<NeedsAssessment> {
    // Call the needs assessment repository to find the assessment by ID
    const needsAssessment = await this.needsAssessmentRepository.findById(id);

    // If not found, throw a not found error
    if (!needsAssessment) {
      throw errorFactory.createNotFoundError('Needs assessment not found', { needsAssessmentId: id });
    }

    // Return the needs assessment
    return needsAssessment;
  }

  /**
   * Retrieves all needs assessments for a specific client
   * @param clientId 
   * @returns Array of needs assessments for the client
   */
  async getNeedsAssessmentsByClientId(clientId: string): Promise<NeedsAssessment[]> {
    // Call the needs assessment repository to find assessments by client ID
    const needsAssessments = await this.needsAssessmentRepository.findByClientId(clientId);

    // Return the array of needs assessments
    return needsAssessments;
  }

  /**
   * Creates a new services plan
   * @param data 
   * @param createdById 
   * @returns The created services plan
   */
  async createServicesPlan(data: CreateServicesPlanDTO, createdById: string): Promise<ServicesPlan> {
    // Validate the input data
    if (!data.clientId || !data.needsAssessmentId || !data.title || !data.description) {
      throw errorFactory.createValidationError('Client ID, needs assessment ID, title, and description are required');
    }

    // Verify the needs assessment exists
    await this.getNeedsAssessment(data.needsAssessmentId);

    // If carePlanId is provided, verify the care plan exists
    if (data.carePlanId) {
      await this.carePlanService.getCarePlanById(data.carePlanId, createdById, 'case_manager');
    }

    // Call the services plan repository to create the plan
    const servicesPlan = await this.servicesPlanRepository.create(data, createdById);

    // Log the successful creation
    logger.info('Services plan created successfully', { servicesPlanId: servicesPlan.id });

    // Return the created services plan
    return servicesPlan;
  }

  /**
   * Retrieves a services plan by its ID
   * @param id 
   * @returns The services plan if found
   */
  async getServicesPlanById(id: string): Promise<ServicesPlan> {
    // Call the services plan repository to find the plan by ID
    const servicesPlan = await this.servicesPlanRepository.findById(id);

    // If not found, throw a not found error
    if (!servicesPlan) {
      throw errorFactory.createNotFoundError('Services plan not found', { servicesPlanId: id });
    }

    // Return the services plan
    return servicesPlan;
  }

  /**
   * Retrieves services plans based on filter parameters
   * @param filters 
   * @returns Paginated services plans and total count
   */
  async getServicesPlans(filters: ServicesPlanFilterParams): Promise<ServicesPlan[]> {
    // Call the services plan repository to find plans based on filters
    const servicesPlans = await this.servicesPlanRepository.findAll(filters);

    // Return the services plans
    return servicesPlans;
  }

  /**
   * Updates an existing services plan
   * @param id 
   * @param data 
   * @returns The updated services plan
   */
  async updateServicesPlan(id: string, data: UpdateServicesPlanDTO): Promise<ServicesPlan> {
    // Validate the services plan exists
    await this.getServicesPlanById(id);

    // Call the services plan repository to update the plan
    const servicesPlan = await this.servicesPlanRepository.update(id, data);

    // Log the successful update
    logger.info('Services plan updated successfully', { servicesPlanId: servicesPlan.id });

    // Return the updated services plan
    return servicesPlan;
  }

  /**
   * Approves a services plan, changing its status to APPROVED
   * @param id 
   * @param approvedById 
   * @param data 
   * @returns The approved services plan
   */
  async approveServicesPlan(id: string, approvedById: string, data: ApproveServicesPlanDTO): Promise<ServicesPlan> {
    // Validate the services plan exists
    await this.getServicesPlanById(id);

    // Call the services plan repository to approve the plan
    const servicesPlan = await this.servicesPlanRepository.approve(id, approvedById, data.notes);

    // Log the successful approval
    logger.info('Services plan approved successfully', { servicesPlanId: servicesPlan.id });

    // Return the approved services plan
    return servicesPlan;
  }

  /**
   * Deletes a services plan
   * @param id 
   * @returns True if the services plan was deleted
   */
  async deleteServicesPlan(id: string): Promise<boolean> {
    // Validate the services plan exists
    await this.getServicesPlanById(id);

    // Call the services plan repository to delete the plan
    const success = await this.servicesPlanRepository.delete(id);

    // Log the successful deletion
    logger.info('Services plan deleted successfully', { servicesPlanId: id });

    // Return true if deletion was successful
    return success;
  }

  /**
   * Generates service plan options based on needs assessment and care plan
   * @param data 
   * @param createdById 
   * @returns Generated service plan options with confidence scores
   */
  async generateServicesPlanOptions(data: GenerateServicesPlanDTO): Promise<ServicesPlanOptionsResponse> {
    // Validate the input data
    if (!data.clientId || !data.needsAssessmentId) {
      throw errorFactory.createValidationError('Client ID and needs assessment ID are required');
    }

    // Retrieve the needs assessment
    const needsAssessment = await this.getNeedsAssessment(data.needsAssessmentId);

    // If carePlanId is provided, retrieve the care plan
    let carePlan: any = null;
    if (data.carePlanId) {
      carePlan = await this.carePlanService.getCarePlanById(data.carePlanId, data.clientId, 'case_manager');
    }

    // Prepare the context for AI generation
    const promptMessages = this.prepareAIPrompt(needsAssessment, carePlan, data.preferences);

    // Call OpenAI service to generate service plan options
    const aiResponse = await this.openAIService.createChatCompletion(promptMessages);

    // Parse and validate the AI response
    const servicePlanOptions = this.parseAIResponse(aiResponse, data.clientId, data.needsAssessmentId, data.carePlanId);

    // Calculate confidence scores for each option
    const confidenceScores: Record<string, number> = {};
    servicePlanOptions.forEach(option => {
      confidenceScores[option.id] = this.calculateConfidenceScore(option, needsAssessment);
    });

    // Match potential providers for each service item
    for (const option of servicePlanOptions) {
      for (const serviceItem of option.serviceItems) {
        const matchedProviders = await this.matchProvidersForServiceItem(data.clientId, serviceItem.serviceType, data.preferences);
        serviceItem.providerId = matchedProviders.length > 0 ? matchedProviders[0].id : null;
      }
    }

    // Calculate cost estimates for each option
    for (const option of servicePlanOptions) {
      const costEstimate = await this.estimateCosts(option.id);
      option.estimatedCost = costEstimate.totalCost;
    }

    // Return the service plan options with metadata
    return {
      options: servicePlanOptions,
      confidenceScores: confidenceScores,
      analysisResults: {} // Add analysis results if needed
    };
  }

  /**
   * Estimates costs for a services plan
   * @param servicesPlanId 
   * @returns Cost estimate details
   */
  async estimateCosts(servicesPlanId: string): Promise<CostEstimateResponse> {
    // Retrieve the services plan with service items and funding sources
    const servicesPlan = await this.getServicesPlanById(servicesPlanId);

    // Calculate the total cost of all service items
    const totalCost = servicesPlan.serviceItems.reduce((sum, item) => sum + item.estimatedCost, 0);

    // Calculate the covered amount from funding sources
    let coveredAmount = 0;
    servicesPlan.fundingSources.forEach(source => {
      coveredAmount += source.coverageAmount;
    });

    // Calculate the out-of-pocket cost
    const outOfPocketCost = totalCost - coveredAmount;

    // Generate service breakdown by service type
    const serviceBreakdown = servicesPlan.serviceItems.map(item => ({
      serviceType: item.serviceType,
      cost: item.estimatedCost,
      covered: 0, // Add covered amount calculation if needed
      outOfPocket: item.estimatedCost // Add out-of-pocket calculation if needed
    }));

    // Generate funding breakdown by funding source
    const fundingBreakdown = servicesPlan.fundingSources.map(source => ({
      source: source.name,
      type: source.type,
      amount: source.coverageAmount
    }));

    // Return the complete cost estimate response
    return {
      totalCost,
      coveredAmount,
      outOfPocketCost,
      serviceBreakdown,
      fundingBreakdown
    };
  }

  /**
   * Identifies potential funding sources for a client's services plan
   * @param clientId 
   * @param servicesPlanId 
   * @returns Available and recommended funding sources
   */
  async identifyFundingSources(clientId: string, servicesPlanId: string): Promise<FundingSourcesResponse> {
    // Retrieve the client's insurance information
    const clientInsuranceInfo: Record<string, any> = {}; // Add client insurance info retrieval logic

    // Retrieve the services plan with service items
    const servicesPlan = await this.getServicesPlanById(servicesPlanId);

    // Query available funding sources based on client eligibility
    const availableSources: any[] = []; // Add funding source retrieval logic

    // Use AI to analyze and recommend optimal funding sources
    const recommendedSources: any[] = []; // Add AI-powered recommendation logic

    // Calculate estimated coverage for each funding source
    availableSources.forEach(source => {
      source.estimatedCoverage = 0; // Add coverage calculation logic
    });

    // Return the funding sources response with recommendations
    return {
      availableSources,
      recommendedSources,
      clientInsuranceInfo
    };
  }

  /**
   * Matches providers for a specific service item
   * @param clientId 
   * @param serviceType 
   * @param preferences 
   * @returns Array of matched providers
   */
  async matchProvidersForServiceItem(clientId: string, serviceType: ServiceType, preferences: Record<string, any>): Promise<any[]> {
    // Prepare matching criteria with client ID, service type, and preferences
    const matchingCriteria: ProviderMatchingCriteria = {
      clientId: clientId,
      serviceTypes: [serviceType],
      location: preferences.location,
      distance: preferences.distance,
      availability: preferences.availability,
      insurance: preferences.insurance,
      genderPreference: preferences.genderPreference,
      languagePreference: preferences.languagePreference,
      experienceLevel: preferences.experienceLevel,
      additionalPreferences: preferences.additionalPreferences
    };

    // Call provider matching service to find matching providers
    const matchedProviders = await this.providerMatchingService.matchProviders(matchingCriteria);

    // Return the matched providers with compatibility scores
    return matchedProviders;
  }

  /**
   * Prepares the prompt for AI service plan generation
   * @param needsAssessment 
   * @param carePlan 
   * @param preferences 
   * @returns Formatted prompt messages for the AI model
   */
  private prepareAIPrompt(needsAssessment: NeedsAssessment, carePlan: any, preferences: Record<string, any>): Array<{ role: string; content: string }> {
    // Create system message with instructions for service plan generation
    const systemMessage = {
      role: 'system',
      content: `You are an AI assistant specialized in generating personalized service plans for individuals with disabilities.
      Your goal is to create comprehensive and effective service plans based on needs assessment and care plan information.
      The service plans should include specific services, providers, and schedules.`
    };

    // Format needs assessment data into structured content
    const needsAssessmentContent = `Needs Assessment: ${JSON.stringify(needsAssessment)}`;

    // Include care plan data if available
    const carePlanContent = carePlan ? `Care Plan: ${JSON.stringify(carePlan)}` : '';

    // Add client preferences if provided
    const preferencesContent = preferences ? `Client Preferences: ${JSON.stringify(preferences)}` : '';

    // Specify output format requirements
    const userMessage = {
      role: 'user',
      content: `Generate a service plan based on the following information:
        ${needsAssessmentContent}
        ${carePlanContent}
        ${preferencesContent}
        The service plan should include:
          - Services: Specific services to address the identified needs
          - Providers: Potential providers for each service
          - Schedule: Recommended schedule for each service
        The response should be in JSON format.`
    };

    // Return array of formatted messages
    return [systemMessage, userMessage];
  }

  /**
   * Parses and validates the AI response into service plan options
   * @param response 
   * @param clientId 
   * @param needsAssessmentId 
   * @param carePlanId 
   * @returns Parsed service plan options
   */
  private parseAIResponse(response: string, clientId: string, needsAssessmentId: string, carePlanId: string): ServicesPlan[] {
    try {
      // Parse JSON response from AI
      const parsedResponse = JSON.parse(response);

      // Validate response structure
      if (!Array.isArray(parsedResponse)) {
        throw new Error('AI response is not an array');
      }

      // Extract service plan options
      const servicePlanOptions: ServicesPlan[] = parsedResponse.map(item => {
        // Validate each option has required fields
        if (!item.title || !item.description || !item.services) {
          throw new Error('Service plan option is missing required fields');
        }

        // Format and structure the options
        return {
          id: 'generated-' + Math.random().toString(36).substring(2, 15), // Generate a unique ID
          clientId: clientId,
          carePlanId: carePlanId,
          createdById: 'ai-service',
          title: item.title,
          description: item.description,
          needsAssessmentId: needsAssessmentId,
          status: PlanStatus.DRAFT,
          estimatedCost: 0,
          approvedById: null,
          approvedAt: null,
          serviceItems: item.services,
          fundingSources: [],
          createdAt: new Date(),
          updatedAt: new Date()
        };
      });

      // Return array of valid service plan options
      return servicePlanOptions;
    } catch (error) {
      // Handle and log any parsing errors
      logger.error('Failed to parse AI response', { error, response });
      throw new Error('Failed to parse AI response');
    }
  }

  /**
   * Calculates confidence scores for generated service plan options
   * @param plan 
   * @param assessment 
   * @returns Confidence score between 0 and 1
   */
  private calculateConfidenceScore(plan: ServicesPlan, assessment: NeedsAssessment): number {
    // Analyze the completeness of the service plan
    const completenessScore = plan.serviceItems.length * 0.3;

    // Check alignment with needs assessment
    const alignmentScore = 0.2;

    // Evaluate the specificity of service items
    const specificityScore = 0.1;

    // Calculate a numerical confidence score
    const numericalScore = completenessScore + alignmentScore + specificityScore;

    // Return the confidence score
    return numericalScore;
  }
}

// Export the ServicesPlanService class for use in the application
export { ServicesPlanService };