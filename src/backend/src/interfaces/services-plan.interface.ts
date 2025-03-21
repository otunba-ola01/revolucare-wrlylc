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
  ServicesPlanFilterParams
} from '../types/services-plan.types';

/**
 * Interface for the Services Plan Repository
 * Defines data access operations for service plans
 */
export interface IServicesPlanRepository {
  /**
   * Find a service plan by its ID
   * @param id - The ID of the service plan to find
   * @returns Promise resolving to the service plan or null if not found
   */
  findById(id: string): Promise<ServicesPlan | null>;
  
  /**
   * Find all service plans for a specific client
   * @param clientId - The ID of the client
   * @param params - Optional filter parameters for the query
   * @returns Promise resolving to an array of service plans
   */
  findByClientId(clientId: string, params?: ServicesPlanFilterParams): Promise<ServicesPlan[]>;
  
  /**
   * Create a new service plan
   * @param servicesPlanData - The data for the new service plan
   * @returns Promise resolving to the created service plan
   */
  create(servicesPlanData: CreateServicesPlanDTO): Promise<ServicesPlan>;
  
  /**
   * Update an existing service plan
   * @param id - The ID of the service plan to update
   * @param servicesPlanData - The new data for the service plan
   * @returns Promise resolving to the updated service plan
   */
  update(id: string, servicesPlanData: UpdateServicesPlanDTO): Promise<ServicesPlan>;
  
  /**
   * Delete a service plan
   * @param id - The ID of the service plan to delete
   * @returns Promise resolving to a boolean indicating success
   */
  delete(id: string): Promise<boolean>;
  
  /**
   * Find all service plans matching the given filter parameters
   * @param params - Filter parameters for the query
   * @returns Promise resolving to an array of service plans
   */
  findAll(params: ServicesPlanFilterParams): Promise<ServicesPlan[]>;
}

/**
 * Interface for the Needs Assessment Repository
 * Defines data access operations for needs assessments
 */
export interface INeedsAssessmentRepository {
  /**
   * Find a needs assessment by its ID
   * @param id - The ID of the needs assessment to find
   * @returns Promise resolving to the needs assessment or null if not found
   */
  findById(id: string): Promise<NeedsAssessment | null>;
  
  /**
   * Find all needs assessments for a specific client
   * @param clientId - The ID of the client
   * @returns Promise resolving to an array of needs assessments
   */
  findByClientId(clientId: string): Promise<NeedsAssessment[]>;
  
  /**
   * Create a new needs assessment
   * @param needsAssessmentData - The data for the new needs assessment
   * @returns Promise resolving to the created needs assessment
   */
  create(needsAssessmentData: CreateNeedsAssessmentDTO): Promise<NeedsAssessment>;
  
  /**
   * Update an existing needs assessment
   * @param id - The ID of the needs assessment to update
   * @param needsAssessmentData - The new data for the needs assessment
   * @returns Promise resolving to the updated needs assessment
   */
  update(id: string, needsAssessmentData: Partial<NeedsAssessment>): Promise<NeedsAssessment>;
  
  /**
   * Delete a needs assessment
   * @param id - The ID of the needs assessment to delete
   * @returns Promise resolving to a boolean indicating success
   */
  delete(id: string): Promise<boolean>;
}

/**
 * Interface for the Services Plan Service
 * Defines business logic operations for service plans, needs assessments,
 * cost estimation, and funding sources identification
 */
export interface IServicesPlanService {
  /**
   * Create a new needs assessment for a client
   * @param data - The data for the new needs assessment
   * @param userId - The ID of the user creating the assessment
   * @returns Promise resolving to the created needs assessment
   */
  createNeedsAssessment(data: CreateNeedsAssessmentDTO, userId: string): Promise<NeedsAssessment>;
  
  /**
   * Get a needs assessment by its ID
   * @param id - The ID of the needs assessment to retrieve
   * @returns Promise resolving to the needs assessment
   */
  getNeedsAssessment(id: string): Promise<NeedsAssessment>;
  
  /**
   * Get all needs assessments for a specific client
   * @param clientId - The ID of the client
   * @returns Promise resolving to an array of needs assessments
   */
  getNeedsAssessmentsByClientId(clientId: string): Promise<NeedsAssessment[]>;
  
  /**
   * Create a new services plan
   * @param data - The data for the new services plan
   * @param userId - The ID of the user creating the plan
   * @returns Promise resolving to the created services plan
   */
  createServicesPlan(data: CreateServicesPlanDTO, userId: string): Promise<ServicesPlan>;
  
  /**
   * Get a services plan by its ID
   * @param id - The ID of the services plan to retrieve
   * @returns Promise resolving to the services plan
   */
  getServicesPlanById(id: string): Promise<ServicesPlan>;
  
  /**
   * Get services plans based on filter parameters
   * @param params - Filter parameters for the query
   * @returns Promise resolving to an array of services plans
   */
  getServicesPlans(params: ServicesPlanFilterParams): Promise<ServicesPlan[]>;
  
  /**
   * Update an existing services plan
   * @param id - The ID of the services plan to update
   * @param data - The new data for the services plan
   * @returns Promise resolving to the updated services plan
   */
  updateServicesPlan(id: string, data: UpdateServicesPlanDTO): Promise<ServicesPlan>;
  
  /**
   * Approve a services plan
   * @param id - The ID of the services plan to approve
   * @param data - Additional approval data (e.g., notes)
   * @param approverId - The ID of the user approving the plan
   * @returns Promise resolving to the approved services plan
   */
  approveServicesPlan(id: string, data: ApproveServicesPlanDTO, approverId: string): Promise<ServicesPlan>;
  
  /**
   * Delete a services plan
   * @param id - The ID of the services plan to delete
   * @returns Promise resolving to a boolean indicating success
   */
  deleteServicesPlan(id: string): Promise<boolean>;
  
  /**
   * Generate AI-powered services plan options based on client needs
   * @param data - The data for generating services plan options
   * @returns Promise resolving to multiple services plan options with confidence scores
   */
  generateServicesPlanOptions(data: GenerateServicesPlanDTO): Promise<ServicesPlanOptionsResponse>;
  
  /**
   * Estimate costs for a services plan
   * @param planId - The ID of the services plan to estimate costs for
   * @returns Promise resolving to cost estimation details
   */
  estimateCosts(planId: string): Promise<CostEstimateResponse>;
  
  /**
   * Identify potential funding sources for a client's services plan
   * @param clientId - The ID of the client
   * @param planId - The ID of the services plan
   * @returns Promise resolving to available funding sources information
   */
  identifyFundingSources(clientId: string, planId: string): Promise<FundingSourcesResponse>;
}