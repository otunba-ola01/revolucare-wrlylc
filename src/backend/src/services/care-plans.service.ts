import { ICarePlanService, ICarePlanRepository } from '../interfaces/care-plan.interface';
import { 
  CarePlan, 
  CreateCarePlanDTO, 
  UpdateCarePlanDTO, 
  ApproveCarePlanDTO,
  GenerateCarePlanDTO,
  CarePlanFilterParams,
  CarePlanOptionsResponse,
  CarePlanHistoryResponse,
} from '../types/care-plan.types';
import { PlanStatus } from '../constants/plan-statuses';
import { NOTIFICATION_TYPES } from '../constants/notification-types';
import { CarePlanRepository } from '../repositories/care-plan.repository';
import { CarePlanGeneratorService } from './ai/care-plan-generator.service';
import { NotificationService } from './notifications.service';
import { errorFactory } from '../utils/error-handler';
import { logger } from '../utils/logger';
import { carePlanCache } from '../cache/care-plan.cache';
import { redisPublisher } from '../config/redis';

/**
 * Service that implements the ICarePlanService interface to manage care plans
 */
export class CarePlansService implements ICarePlanService {
  /**
   * Creates a new CarePlansService instance with required dependencies
   * @param carePlanRepository 
   * @param carePlanGenerator 
   * @param notificationService 
   * @param eventPublisher 
   */
  constructor(
    private carePlanRepository: ICarePlanRepository = new CarePlanRepository(),
    private carePlanGenerator: CarePlanGeneratorService = new CarePlanGeneratorService(),
    private notificationService: NotificationService = new NotificationService(),
    private redisPublisher: typeof redisPublisher = redisPublisher
  ) {
    // Store the provided care plan repository
    this.carePlanRepository = carePlanRepository;
    // Store the provided care plan generator service
    this.carePlanGenerator = carePlanGenerator;
    // Store the provided notification service
    this.notificationService = notificationService;
    // Store the provided event publisher or use default Redis publisher
    this.redisPublisher = redisPublisher;
  }

  /**
   * Creates a new care plan
   * @param data 
   * @param createdById 
   * @returns The created care plan
   */
  async createCarePlan(data: CreateCarePlanDTO, createdById: string): Promise<CarePlan> {
    try {
      // Log the attempt to create a new care plan
      logger.info('Attempting to create a new care plan', { data, createdById });

      // Validate the care plan data
      this.validateCarePlanData(data);

      // Create the care plan using the repository
      const carePlan = await this.carePlanRepository.create(data, createdById);

      // Emit care plan created event
      this.emitCarePlanEvent(NOTIFICATION_TYPES.CARE_PLAN_CREATED, { carePlanId: carePlan.id, clientId: data.clientId, createdById });

      // Cache the new care plan
      await carePlanCache.cacheCarePlan(carePlan);

      // Log the successful creation of the care plan
      logger.info('Care plan created successfully', { carePlanId: carePlan.id });

      // Return the created care plan
      return carePlan;
    } catch (error) {
      // Handle and log any errors during creation
      logger.error('Error creating care plan', { error, data, createdById });
      throw error;
    }
  }

  /**
   * Retrieves a care plan by its ID
   * @param id 
   * @param userId 
   * @param userRole 
   * @returns The requested care plan
   */
  async getCarePlanById(id: string, userId: string, userRole: string): Promise<CarePlan> {
    try {
      // Log the attempt to retrieve a care plan by ID
      logger.info('Attempting to retrieve care plan by ID', { carePlanId: id, userId, userRole });

      // Check cache for the care plan
      let carePlan = await carePlanCache.getCachedCarePlan(id);

      // If not in cache, retrieve from repository
      if (!carePlan) {
        logger.debug('Care plan not found in cache, retrieving from repository', { carePlanId: id });
        carePlan = await this.carePlanRepository.findById(id);
      }

      // Throw NotFoundError if care plan doesn't exist
      if (!carePlan) {
        throw errorFactory.createNotFoundError('Care plan not found', { carePlanId: id });
      }

      // Validate user access to the care plan
      if (!this.validateCarePlanAccess(carePlan, userId, userRole)) {
        throw errorFactory.createUnauthorizedError('User not authorized to access this care plan', { carePlanId: id, userId, userRole });
      }

      // Cache the care plan if retrieved from repository
      if (!carePlanCache.getCachedCarePlan(id)) {
        await carePlanCache.cacheCarePlan(carePlan);
      }

      // Log the successful retrieval of the care plan
      logger.info('Care plan retrieved successfully', { carePlanId: id });

      // Return the care plan
      return carePlan;
    } catch (error) {
      // Handle and log any errors during retrieval
      logger.error('Error retrieving care plan by ID', { error, carePlanId: id, userId, userRole });
      throw error;
    }
  }

  /**
   * Retrieves care plans based on filter parameters
   * @param filters 
   * @param userId 
   * @param userRole 
   * @returns Paginated care plans and total count
   */
  async getCarePlans(filters: CarePlanFilterParams, userId: string, userRole: string): Promise<{ carePlans: CarePlan[]; total: number; }> {
    try {
      // Log the attempt to retrieve care plans with filters
      logger.info('Attempting to retrieve care plans with filters', { filters, userId, userRole });

      // Apply access control to filter parameters based on user role
      // TODO: Implement access control logic based on user role and permissions

      // Query the repository with the filtered parameters
      const { carePlans, total } = await this.carePlanRepository.findAll(filters);

      // Log the successful retrieval of care plans
      logger.info('Care plans retrieved successfully', { count: carePlans.length, total });

      // Return the care plans and total count
      return { carePlans, total };
    } catch (error) {
      // Handle and log any errors during retrieval
      logger.error('Error retrieving care plans with filters', { error, filters, userId, userRole });
      throw error;
    }
  }

  /**
   * Updates an existing care plan
   * @param id 
   * @param data 
   * @param userId 
   * @param userRole 
   * @returns The updated care plan
   */
  async updateCarePlan(id: string, data: UpdateCarePlanDTO, userId: string, userRole: string): Promise<CarePlan> {
    try {
      // Log the attempt to update a care plan
      logger.info('Attempting to update care plan', { carePlanId: id, data, userId, userRole });

      // Retrieve the current care plan
      const carePlan = await this.getCarePlanById(id, userId, userRole);

      // Validate user access to the care plan
      if (!this.validateCarePlanAccess(carePlan, userId, userRole)) {
        throw errorFactory.createUnauthorizedError('User not authorized to update this care plan', { carePlanId: id, userId, userRole });
      }

      // Validate the update data
      this.validateCarePlanData(data);

      // Create a new version of the care plan
      const { carePlan: updatedCarePlan } = await this.carePlanRepository.createVersion(id, data);

      // Emit care plan updated event
      this.emitCarePlanEvent(NOTIFICATION_TYPES.CARE_PLAN_UPDATED, { carePlanId: id, clientId: carePlan.clientId, updatedById: userId });

      // Invalidate cache for the updated care plan
      await carePlanCache.invalidateCarePlanCache(id);

      // Log the successful update of the care plan
      logger.info('Care plan updated successfully', { carePlanId: id });

      // Return the updated care plan
      return updatedCarePlan;
    } catch (error) {
      // Handle and log any errors during update
      logger.error('Error updating care plan', { error, carePlanId: id, data, userId, userRole });
      throw error;
    }
  }

  /**
   * Approves a care plan, changing its status to APPROVED
   * @param id 
   * @param data 
   * @param approvedById 
   * @param userRole 
   * @returns The approved care plan
   */
  async approveCarePlan(id: string, data: ApproveCarePlanDTO, approvedById: string, userRole: string): Promise<CarePlan> {
    try {
      // Log the attempt to approve a care plan
      logger.info('Attempting to approve care plan', { carePlanId: id, data, approvedById, userRole });

      // Validate that the user has permission to approve care plans
      // TODO: Implement permission check based on user role and permissions

      // Retrieve the current care plan
      const carePlan = await this.getCarePlanById(id, approvedById, userRole);

      // Validate that the care plan is in a status that can be approved
      if (carePlan.status !== PlanStatus.DRAFT && carePlan.status !== PlanStatus.IN_REVIEW) {
        throw errorFactory.createValidationError(`Care plan cannot be approved. Current status: ${carePlan.status}`);
      }

      // Approve the care plan using the repository
      const approvedCarePlan = await this.carePlanRepository.approve(id, approvedById, data.approvalNotes);

      // Emit care plan approved event
      this.emitCarePlanEvent(NOTIFICATION_TYPES.CARE_PLAN_APPROVED, { carePlanId: id, clientId: carePlan.clientId, approvedById });

      // Invalidate cache for the approved care plan
      await carePlanCache.invalidateCarePlanCache(id);

      // Log the successful approval of the care plan
      logger.info('Care plan approved successfully', { carePlanId: id });

      // Return the approved care plan
      return approvedCarePlan;
    } catch (error) {
      // Handle and log any errors during approval
      logger.error('Error approving care plan', { error, carePlanId: id, data, approvedById, userRole });
      throw error;
    }
  }

  /**
   * Deletes a care plan
   * @param id 
   * @param userId 
   * @param userRole 
   * @returns True if the care plan was deleted
   */
  async deleteCarePlan(id: string, userId: string, userRole: string): Promise<boolean> {
    try {
      // Log the attempt to delete a care plan
      logger.info('Attempting to delete care plan', { carePlanId: id, userId, userRole });

      // Retrieve the current care plan
      const carePlan = await this.getCarePlanById(id, userId, userRole);

      // Validate user access to the care plan
      if (!this.validateCarePlanAccess(carePlan, userId, userRole)) {
        throw errorFactory.createUnauthorizedError('User not authorized to delete this care plan', { carePlanId: id, userId, userRole });
      }

      // Delete the care plan using the repository
      const result = await this.carePlanRepository.delete(id);

      // Invalidate cache for the deleted care plan
      await carePlanCache.invalidateCarePlanCache(id);

      // Log the successful deletion of the care plan
      logger.info('Care plan deleted successfully', { carePlanId: id });

      // Return true if deletion was successful
      return result;
    } catch (error) {
      // Handle and log any errors during deletion
      logger.error('Error deleting care plan', { error, carePlanId: id, userId, userRole });
      throw error;
    }
  }

  /**
   * Retrieves the version history of a care plan
   * @param carePlanId 
   * @param userId 
   * @param userRole 
   * @returns Version history data
   */
  async getCarePlanHistory(carePlanId: string, userId: string, userRole: string): Promise<CarePlanHistoryResponse> {
    try {
      // Log the attempt to retrieve care plan history
      logger.info('Attempting to retrieve care plan history', { carePlanId, userId, userRole });

      // Retrieve the current care plan
      const carePlan = await this.getCarePlanById(carePlanId, userId, userRole);

      // Validate user access to the care plan
      if (!this.validateCarePlanAccess(carePlan, userId, userRole)) {
        throw errorFactory.createUnauthorizedError('User not authorized to access this care plan history', { carePlanId, userId, userRole });
      }

      // Get version history from the repository
      const versionHistory = await this.carePlanRepository.getVersionHistory(carePlanId);

      // Log the successful retrieval of care plan history
      logger.info('Care plan history retrieved successfully', { carePlanId, versionCount: versionHistory.versions.length });

      // Return the formatted version history response
      return versionHistory;
    } catch (error) {
      // Handle and log any errors during retrieval
      logger.error('Error retrieving care plan history', { error, carePlanId, userId, userRole });
      throw error;
    }
  }

  /**
   * Generates care plan options using AI based on client information and documents
   * @param data 
   * @param userId 
   * @param userRole 
   * @returns Generated care plan options
   */
  async generateCarePlanOptions(data: GenerateCarePlanDTO, userId: string, userRole: string): Promise<CarePlanOptionsResponse> {
    try {
      // Log the attempt to generate care plan options
      logger.info('Attempting to generate care plan options', { data, userId, userRole });

      // Validate that the user has permission to generate care plans
      // TODO: Implement permission check based on user role and permissions

      // Validate the generation request data
      if (!data.clientId || !data.documentIds) {
        throw errorFactory.createValidationError('Client ID and document IDs are required', { data });
      }

      // Call the care plan generator service to generate options
      const carePlanOptions = await this.carePlanGenerator.generateOptions(data);

      // Log the successful generation of care plan options
      logger.info('Care plan options generated successfully', { clientId: data.clientId, optionCount: carePlanOptions.options.length });

      // Return the generated care plan options
      return carePlanOptions;
    } catch (error) {
      // Handle and log any errors during generation
      logger.error('Error generating care plan options', { error, data, userId, userRole });
      throw error;
    }
  }

  /**
   * Updates the status of a care plan
   * @param id 
   * @param status 
   * @param userId 
   * @param userRole 
   * @returns The updated care plan
   */
  async updateCarePlanStatus(id: string, status: PlanStatus, userId: string, userRole: string): Promise<CarePlan> {
    try {
      // Log the attempt to update care plan status
      logger.info('Attempting to update care plan status', { carePlanId: id, status, userId, userRole });

      // Retrieve the current care plan
      const carePlan = await this.getCarePlanById(id, userId, userRole);

      // Validate user access to the care plan
      if (!this.validateCarePlanAccess(carePlan, userId, userRole)) {
        throw errorFactory.createUnauthorizedError('User not authorized to update this care plan status', { carePlanId: id, userId, userRole });
      }

      // Validate the status transition
      // TODO: Implement status transition validation logic

      // Update the care plan status using the repository
      const updatedCarePlan = await this.carePlanRepository.updateStatus(id, status);

      // Emit care plan status changed event
      this.emitCarePlanEvent(NOTIFICATION_TYPES.CARE_PLAN_STATUS_CHANGED, { carePlanId: id, clientId: carePlan.clientId, status });

      // Invalidate cache for the updated care plan
      await carePlanCache.invalidateCarePlanCache(id);

      // Log the successful update of the care plan status
      logger.info('Care plan status updated successfully', { carePlanId: id, status });

      // Return the updated care plan
      return updatedCarePlan;
    } catch (error) {
      // Handle and log any errors during status update
      logger.error('Error updating care plan status', { error, carePlanId: id, status, userId, userRole });
      throw error;
    }
  }

  /**
   * Validates if a user has access to a care plan
   * @param carePlan 
   * @param userId 
   * @param userRole 
   * @returns True if the user has access to the care plan
   */
  validateCarePlanAccess(carePlan: CarePlan, userId: string, userRole: string): boolean {
    try {
      // Log the attempt to validate care plan access
      logger.debug('Validating care plan access', { carePlanId: carePlan.id, userId, userRole });

      // Check if user is an administrator (full access)
      if (userRole === 'administrator') {
        logger.debug('User is an administrator, granting access');
        return true;
      }

      // Check if user is a case manager (access to assigned clients)
      if (userRole === 'case_manager') {
        // TODO: Implement case manager access control logic
        logger.warn('Case manager access control not yet implemented');
        return true;
      }

      // Check if user is the client who owns the care plan
      if (carePlan.clientId === userId) {
        logger.debug('User is the client, granting access');
        return true;
      }

      // Check if user is the creator of the care plan
      if (carePlan.createdById === userId) {
        logger.debug('User is the creator, granting access');
        return true;
      }

      // Log that no access condition was met
      logger.warn('No access condition met, denying access');

      // Return false if no access condition is met
      return false;
    } catch (error) {
      // Handle and log any errors during access validation
      logger.error('Error validating care plan access', { error, carePlanId: carePlan.id, userId, userRole });
      throw error;
    }
  }

  /**
   * Validates care plan data for creation or update
   * @param data 
   */
  private validateCarePlanData(data: CreateCarePlanDTO | UpdateCarePlanDTO): void {
    // Check required fields based on operation type
    if (!data.title || !data.description || !data.clientId) {
      throw errorFactory.createValidationError('Missing required fields in care plan data', { data });
    }

    // Validate goals structure if provided
    if (data.goals && !Array.isArray(data.goals)) {
      throw errorFactory.createValidationError('Goals must be an array', { goals: data.goals });
    }

    // Validate interventions structure if provided
    if (data.interventions && !Array.isArray(data.interventions)) {
      throw errorFactory.createValidationError('Interventions must be an array', { interventions: data.interventions });
    }
  }

  /**
   * Emits an event for care plan operations
   * @param eventType 
   * @param payload 
   */
  private emitCarePlanEvent(eventType: string, payload: Record<string, any>): void {
    try {
      // Create event object with type and payload
      const event = { type: eventType, payload };

      // Use Redis publisher to publish the event
      this.redisPublisher.publish('care-plan-events', JSON.stringify(event));

      // Log the emitted event
      logger.info('Emitted care plan event', { eventType, payload });
    } catch (error) {
      // Handle any errors during event publishing
      logger.error('Error emitting care plan event', { error, eventType, payload });
    }
  }
}

// Export the CarePlansService class for dependency injection
export { CarePlansService };

// Factory function to create a configured CarePlansService instance with required dependencies
export const createCarePlansService = (): CarePlansService => {
  return new CarePlansService(
    new CarePlanRepository(),
    new CarePlanGeneratorService(),
    new NotificationService(),
    redisPublisher
  );
};