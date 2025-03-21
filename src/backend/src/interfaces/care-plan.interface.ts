import { 
  CarePlan, 
  CreateCarePlanDTO, 
  UpdateCarePlanDTO, 
  ApproveCarePlanDTO,
  GenerateCarePlanDTO,
  CarePlanFilterParams,
  CarePlanOptionsResponse,
  CarePlanVersion
} from '../types/care-plan.types';
import { PlanStatus } from '../constants/plan-statuses';

/**
 * Interface defining the contract for the Care Plan Service.
 * 
 * This service is responsible for managing care plans throughout their lifecycle,
 * including creation, updates, approval, and AI-powered generation.
 */
export interface ICarePlanService {
  /**
   * Creates a new care plan with the given data.
   * 
   * @param userId - ID of the user creating the care plan (typically a case manager)
   * @param createCarePlanDTO - Data for the new care plan
   * @returns The newly created care plan
   */
  createCarePlan(userId: string, createCarePlanDTO: CreateCarePlanDTO): Promise<CarePlan>;

  /**
   * Retrieves a care plan by its unique identifier.
   * 
   * @param id - The care plan ID
   * @returns The care plan if found, null otherwise
   */
  getCarePlanById(id: string): Promise<CarePlan | null>;

  /**
   * Retrieves care plans based on filter parameters.
   * 
   * @param filterParams - Parameters for filtering, sorting, and pagination
   * @returns Object containing filtered care plans and total count
   */
  getCarePlans(filterParams: CarePlanFilterParams): Promise<{ carePlans: CarePlan[]; count: number }>;

  /**
   * Updates an existing care plan with new data.
   * 
   * @param id - The care plan ID
   * @param userId - ID of the user updating the care plan
   * @param updateCarePlanDTO - Updated care plan data
   * @returns The updated care plan
   */
  updateCarePlan(id: string, userId: string, updateCarePlanDTO: UpdateCarePlanDTO): Promise<CarePlan>;

  /**
   * Approves a care plan, changing its status to approved.
   * 
   * @param id - The care plan ID
   * @param userId - ID of the user approving the care plan
   * @param approveCarePlanDTO - Approval data including notes
   * @returns The approved care plan
   */
  approveCarePlan(id: string, userId: string, approveCarePlanDTO: ApproveCarePlanDTO): Promise<CarePlan>;

  /**
   * Deletes a care plan by ID.
   * 
   * @param id - The care plan ID
   * @param userId - ID of the user deleting the care plan
   * @returns True if successfully deleted
   */
  deleteCarePlan(id: string, userId: string): Promise<boolean>;

  /**
   * Retrieves the version history of a care plan.
   * 
   * @param id - The care plan ID
   * @returns Object containing the care plan ID, current version, and version history
   */
  getCarePlanHistory(id: string): Promise<{ carePlanId: string; currentVersion: number; versions: CarePlanVersion[] }>;

  /**
   * Generates AI-powered care plan options based on client data and documents.
   * 
   * @param userId - ID of the user requesting the generation
   * @param generateCarePlanDTO - Data for generating care plan options
   * @returns AI-generated care plan options with confidence scores
   */
  generateCarePlanOptions(userId: string, generateCarePlanDTO: GenerateCarePlanDTO): Promise<CarePlanOptionsResponse>;

  /**
   * Validates whether a user has access to a specific care plan.
   * 
   * @param carePlanId - The care plan ID
   * @param userId - The user ID
   * @param requiresWriteAccess - Whether write access is required
   * @returns True if the user has the required access
   */
  validateCarePlanAccess(carePlanId: string, userId: string, requiresWriteAccess: boolean): Promise<boolean>;
}

/**
 * Interface defining the contract for the Care Plan Repository.
 * 
 * This repository handles data access operations for care plans,
 * providing a persistence layer abstraction.
 */
export interface ICarePlanRepository {
  /**
   * Creates a new care plan in the database.
   * 
   * @param carePlan - The care plan data to create
   * @returns The created care plan with generated ID and timestamps
   */
  create(carePlan: Omit<CarePlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<CarePlan>;

  /**
   * Finds a care plan by its ID.
   * 
   * @param id - The care plan ID
   * @returns The care plan if found, null otherwise
   */
  findById(id: string): Promise<CarePlan | null>;

  /**
   * Finds all care plans for a specific client.
   * 
   * @param clientId - The client ID
   * @returns Array of care plans for the client
   */
  findByClientId(clientId: string): Promise<CarePlan[]>;

  /**
   * Finds all care plans based on filter parameters.
   * 
   * @param filterParams - Parameters for filtering, sorting, and pagination
   * @returns Object containing filtered care plans and total count
   */
  findAll(filterParams: CarePlanFilterParams): Promise<{ carePlans: CarePlan[]; count: number }>;

  /**
   * Updates an existing care plan.
   * 
   * @param id - The care plan ID
   * @param carePlanData - Updated care plan data
   * @returns The updated care plan
   */
  update(id: string, carePlanData: Partial<CarePlan>): Promise<CarePlan>;

  /**
   * Updates only the status of a care plan.
   * 
   * @param id - The care plan ID
   * @param status - The new status
   * @returns The updated care plan
   */
  updateStatus(id: string, status: PlanStatus): Promise<CarePlan>;

  /**
   * Approves a care plan, updating status and approval information.
   * 
   * @param id - The care plan ID
   * @param approverUserId - ID of the approving user
   * @param approvalNotes - Notes provided during approval
   * @returns The approved care plan
   */
  approve(id: string, approverUserId: string, approvalNotes: string): Promise<CarePlan>;

  /**
   * Creates a new version of a care plan for version history tracking.
   * 
   * @param carePlanId - The care plan ID
   * @param version - Version number
   * @param changes - Record of changes made in this version
   * @param userId - ID of the user creating the version
   * @returns The created version record
   */
  createVersion(carePlanId: string, version: number, changes: Record<string, any>, userId: string): Promise<CarePlanVersion>;

  /**
   * Retrieves the version history of a care plan.
   * 
   * @param carePlanId - The care plan ID
   * @returns Object containing the care plan ID, current version, and version history
   */
  getVersionHistory(carePlanId: string): Promise<{ carePlanId: string; currentVersion: number; versions: CarePlanVersion[] }>;

  /**
   * Deletes a care plan.
   * 
   * @param id - The care plan ID
   * @returns True if successfully deleted
   */
  delete(id: string): Promise<boolean>;
}

/**
 * Interface defining the contract for the AI-powered Care Plan Generator.
 * 
 * This component handles the analysis of medical documents and generation
 * of personalized care plan options using artificial intelligence.
 */
export interface ICarePlanGenerator {
  /**
   * Generates multiple care plan options based on client information and medical documents.
   * 
   * @param clientId - The client ID
   * @param documentIds - Array of document IDs to analyze
   * @param additionalContext - Additional context to guide generation
   * @returns AI-generated care plan options with confidence scores
   */
  generateOptions(clientId: string, documentIds: string[], additionalContext: Record<string, any>): Promise<CarePlanOptionsResponse>;

  /**
   * Analyzes medical documents to extract relevant information for care planning.
   * 
   * @param documentIds - Array of document IDs to analyze
   * @returns Analysis results with extracted medical information
   */
  analyzeDocuments(documentIds: string[]): Promise<Record<string, any>>;
}