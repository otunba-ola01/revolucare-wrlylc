import { ICarePlanRepository } from '../interfaces/care-plan.interface';
import { 
  CarePlan, 
  CreateCarePlanDTO, 
  UpdateCarePlanDTO, 
  CarePlanFilterParams 
} from '../types/care-plan.types';
import { PlanStatus } from '../constants/plan-statuses';
import { prisma, executeWithTransaction } from '../config/database';
import { errorFactory } from '../utils/error-handler';
import { logger } from '../utils/logger';

/**
 * Repository implementation for care plan data access operations.
 * 
 * This class provides methods for creating, retrieving, updating, and deleting care plans
 * in the database, as well as managing care plan versions, approvals, and status changes.
 */
export class CarePlanRepository implements ICarePlanRepository {
  private prisma;

  /**
   * Initializes a new instance of the CarePlanRepository class.
   */
  constructor() {
    this.prisma = prisma;
  }

  /**
   * Creates a new care plan in the database.
   * 
   * @param data - The data for the care plan to create
   * @param createdById - ID of the user creating the care plan
   * @returns The created care plan with all associated data
   */
  async create(data: CreateCarePlanDTO, createdById: string): Promise<CarePlan> {
    logger.info('Creating new care plan', { clientId: data.clientId, createdById });

    // Validate that required data is provided
    if (!data.clientId || !createdById) {
      throw errorFactory.createValidationError('Client ID and creator ID are required');
    }

    try {
      return await executeWithTransaction(async (tx) => {
        // Create the care plan with initial status as DRAFT
        const carePlan = await tx.carePlan.create({
          data: {
            title: data.title,
            description: data.description,
            clientId: data.clientId,
            createdById,
            status: PlanStatus.DRAFT,
            confidenceScore: 0, // Default score, will be updated later if AI-generated
            version: 1 // Initial version
          }
        });

        // Create associated goals if provided
        if (data.goals && data.goals.length > 0) {
          await Promise.all(data.goals.map(goal => 
            tx.carePlanGoal.create({
              data: {
                carePlanId: carePlan.id,
                description: goal.description,
                targetDate: goal.targetDate,
                status: goal.status || 'pending',
                measures: goal.measures
              }
            })
          ));
        }

        // Create associated interventions if provided
        if (data.interventions && data.interventions.length > 0) {
          await Promise.all(data.interventions.map(intervention => 
            tx.carePlanIntervention.create({
              data: {
                carePlanId: carePlan.id,
                description: intervention.description,
                frequency: intervention.frequency,
                duration: intervention.duration,
                responsibleParty: intervention.responsibleParty,
                status: intervention.status || 'pending'
              }
            })
          ));
        }

        // Fetch the complete care plan with goals and interventions
        const completePlan = await tx.carePlan.findUnique({
          where: { id: carePlan.id },
          include: {
            goals: true,
            interventions: true
          }
        });

        if (!completePlan) {
          throw errorFactory.createNotFoundError('Failed to retrieve created care plan');
        }

        logger.info('Care plan created successfully', { carePlanId: completePlan.id });
        return completePlan as CarePlan;
      });
    } catch (error) {
      logger.error('Failed to create care plan', { error, clientId: data.clientId });
      throw error;
    }
  }

  /**
   * Retrieves a care plan by its ID.
   * 
   * @param id - The ID of the care plan to retrieve
   * @param includeGoals - Whether to include goals in the response (default: true)
   * @param includeInterventions - Whether to include interventions in the response (default: true)
   * @returns The care plan if found, null otherwise
   */
  async findById(id: string, includeGoals = true, includeInterventions = true): Promise<CarePlan | null> {
    logger.info('Finding care plan by ID', { carePlanId: id });

    try {
      // Build the include object based on parameters
      const include: any = {};
      if (includeGoals) include.goals = true;
      if (includeInterventions) include.interventions = true;

      const carePlan = await this.prisma.carePlan.findUnique({
        where: { id },
        include
      });

      if (!carePlan) {
        logger.info('Care plan not found', { carePlanId: id });
        return null;
      }

      logger.info('Care plan found', { carePlanId: id });
      return carePlan as CarePlan;
    } catch (error) {
      logger.error('Error finding care plan by ID', { error, carePlanId: id });
      throw error;
    }
  }

  /**
   * Retrieves all care plans for a specific client.
   * 
   * @param clientId - The ID of the client
   * @param includeGoals - Whether to include goals in the response (default: false)
   * @param includeInterventions - Whether to include interventions in the response (default: false)
   * @returns Array of care plans associated with the client
   */
  async findByClientId(clientId: string, includeGoals = false, includeInterventions = false): Promise<CarePlan[]> {
    logger.info('Finding care plans by client ID', { clientId });

    try {
      // Build the include object based on parameters
      const include: any = {};
      if (includeGoals) include.goals = true;
      if (includeInterventions) include.interventions = true;

      const carePlans = await this.prisma.carePlan.findMany({
        where: { clientId },
        include,
        orderBy: { updatedAt: 'desc' }
      });

      logger.info('Found care plans for client', { clientId, count: carePlans.length });
      return carePlans as CarePlan[];
    } catch (error) {
      logger.error('Error finding care plans by client ID', { error, clientId });
      throw error;
    }
  }

  /**
   * Retrieves care plans based on filter parameters.
   * 
   * @param filters - Parameters for filtering, sorting, and pagination
   * @returns Object containing filtered care plans and total count
   */
  async findAll(filters: CarePlanFilterParams): Promise<{ carePlans: CarePlan[]; total: number; }> {
    logger.info('Finding care plans with filters', { filters });

    try {
      // Extract pagination parameters with defaults
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const skip = (page - 1) * limit;

      // Build the where conditions based on filter parameters
      const where: any = {};

      if (filters.clientId) where.clientId = filters.clientId;
      if (filters.status) where.status = filters.status;
      if (filters.createdById) where.createdById = filters.createdById;
      if (filters.approvedById) where.approvedById = filters.approvedById;

      // Date range filtering
      if (filters.fromDate || filters.toDate) {
        where.createdAt = {};
        if (filters.fromDate) where.createdAt.gte = filters.fromDate;
        if (filters.toDate) where.createdAt.lte = filters.toDate;
      }

      // Text search across title and description
      if (filters.search) {
        where.OR = [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } }
        ];
      }

      // Count total matching records for pagination
      const total = await this.prisma.carePlan.count({ where });

      // Sort options
      const orderBy: any = {};
      if (filters.sortBy) {
        orderBy[filters.sortBy] = filters.sortOrder || 'desc';
      } else {
        orderBy.updatedAt = 'desc'; // Default sorting
      }

      // Execute the paginated query with all filters
      const carePlans = await this.prisma.carePlan.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          goals: true,
          interventions: true
        }
      });

      logger.info('Found care plans', { count: carePlans.length, total });
      return { carePlans: carePlans as CarePlan[], total };
    } catch (error) {
      logger.error('Error finding care plans with filters', { error, filters });
      throw error;
    }
  }

  /**
   * Updates an existing care plan.
   * 
   * @param id - The ID of the care plan to update
   * @param data - The updated care plan data
   * @returns The updated care plan
   */
  async update(id: string, data: UpdateCarePlanDTO): Promise<CarePlan> {
    logger.info('Updating care plan', { carePlanId: id });

    // Find the care plan to ensure it exists
    const existingCarePlan = await this.findById(id);
    if (!existingCarePlan) {
      throw errorFactory.createNotFoundError(`Care plan with ID ${id} not found`);
    }

    try {
      return await executeWithTransaction(async (tx) => {
        // Update the care plan basic details
        const updatedCarePlan = await tx.carePlan.update({
          where: { id },
          data: {
            title: data.title,
            description: data.description,
            status: data.status,
            // Don't update other fields like createdById, clientId, etc.
          }
        });

        // Handle goals updates if provided
        if (data.goals) {
          // Get existing goals
          const existingGoals = await tx.carePlanGoal.findMany({
            where: { carePlanId: id }
          });
          
          // Create a map of existing goals by ID for easy lookup
          const existingGoalsMap = new Map(
            existingGoals.map(goal => [goal.id, goal])
          );

          // Track goals to keep (either updated or new)
          const goalIdsToKeep = new Set<string>();

          // Process each goal in the update
          await Promise.all(data.goals.map(async (goal) => {
            if (goal.id) {
              // Update existing goal
              if (existingGoalsMap.has(goal.id)) {
                await tx.carePlanGoal.update({
                  where: { id: goal.id },
                  data: {
                    description: goal.description,
                    targetDate: goal.targetDate,
                    status: goal.status,
                    measures: goal.measures
                  }
                });
                goalIdsToKeep.add(goal.id);
              }
            } else {
              // Create new goal
              const newGoal = await tx.carePlanGoal.create({
                data: {
                  carePlanId: id,
                  description: goal.description,
                  targetDate: goal.targetDate,
                  status: goal.status || 'pending',
                  measures: goal.measures
                }
              });
              goalIdsToKeep.add(newGoal.id);
            }
          }));

          // Delete goals that were removed
          const goalIdsToDelete = existingGoals
            .filter(goal => !goalIdsToKeep.has(goal.id))
            .map(goal => goal.id);

          if (goalIdsToDelete.length > 0) {
            await tx.carePlanGoal.deleteMany({
              where: { id: { in: goalIdsToDelete } }
            });
          }
        }

        // Handle interventions updates if provided
        if (data.interventions) {
          // Get existing interventions
          const existingInterventions = await tx.carePlanIntervention.findMany({
            where: { carePlanId: id }
          });
          
          // Create a map of existing interventions by ID for easy lookup
          const existingInterventionsMap = new Map(
            existingInterventions.map(intervention => [intervention.id, intervention])
          );

          // Track interventions to keep (either updated or new)
          const interventionIdsToKeep = new Set<string>();

          // Process each intervention in the update
          await Promise.all(data.interventions.map(async (intervention) => {
            if (intervention.id) {
              // Update existing intervention
              if (existingInterventionsMap.has(intervention.id)) {
                await tx.carePlanIntervention.update({
                  where: { id: intervention.id },
                  data: {
                    description: intervention.description,
                    frequency: intervention.frequency,
                    duration: intervention.duration,
                    responsibleParty: intervention.responsibleParty,
                    status: intervention.status
                  }
                });
                interventionIdsToKeep.add(intervention.id);
              }
            } else {
              // Create new intervention
              const newIntervention = await tx.carePlanIntervention.create({
                data: {
                  carePlanId: id,
                  description: intervention.description,
                  frequency: intervention.frequency,
                  duration: intervention.duration,
                  responsibleParty: intervention.responsibleParty,
                  status: intervention.status || 'pending'
                }
              });
              interventionIdsToKeep.add(newIntervention.id);
            }
          }));

          // Delete interventions that were removed
          const interventionIdsToDelete = existingInterventions
            .filter(intervention => !interventionIdsToKeep.has(intervention.id))
            .map(intervention => intervention.id);

          if (interventionIdsToDelete.length > 0) {
            await tx.carePlanIntervention.deleteMany({
              where: { id: { in: interventionIdsToDelete } }
            });
          }
        }

        // Fetch the complete updated care plan with goals and interventions
        const completePlan = await tx.carePlan.findUnique({
          where: { id },
          include: {
            goals: true,
            interventions: true
          }
        });

        if (!completePlan) {
          throw errorFactory.createNotFoundError('Failed to retrieve updated care plan');
        }

        logger.info('Care plan updated successfully', { carePlanId: id });
        return completePlan as CarePlan;
      });
    } catch (error) {
      logger.error('Failed to update care plan', { error, carePlanId: id });
      throw error;
    }
  }

  /**
   * Updates the status of a care plan.
   * 
   * @param id - The ID of the care plan
   * @param status - The new status
   * @returns The updated care plan
   */
  async updateStatus(id: string, status: PlanStatus): Promise<CarePlan> {
    logger.info('Updating care plan status', { carePlanId: id, newStatus: status });

    const carePlan = await this.findById(id);
    if (!carePlan) {
      throw errorFactory.createNotFoundError(`Care plan with ID ${id} not found`);
    }

    // Validate status transition
    if (!this.validateStatusTransition(carePlan.status, status)) {
      throw errorFactory.createValidationError(`Invalid status transition from ${carePlan.status} to ${status}`);
    }

    try {
      const updatedCarePlan = await this.prisma.carePlan.update({
        where: { id },
        data: { status },
        include: {
          goals: true,
          interventions: true
        }
      });

      logger.info('Care plan status updated successfully', { 
        carePlanId: id, 
        oldStatus: carePlan.status, 
        newStatus: status 
      });
      
      return updatedCarePlan as CarePlan;
    } catch (error) {
      logger.error('Failed to update care plan status', { error, carePlanId: id, status });
      throw error;
    }
  }

  /**
   * Approves a care plan, changing its status to APPROVED.
   * 
   * @param id - The ID of the care plan
   * @param approvedById - ID of the user approving the care plan
   * @param approvalNotes - Notes provided during approval
   * @returns The approved care plan
   */
  async approve(id: string, approvedById: string, approvalNotes = ''): Promise<CarePlan> {
    logger.info('Approving care plan', { carePlanId: id, approvedById });

    const carePlan = await this.findById(id);
    if (!carePlan) {
      throw errorFactory.createNotFoundError(`Care plan with ID ${id} not found`);
    }

    // Verify that the care plan is in a status that can be approved
    if (carePlan.status !== PlanStatus.DRAFT && carePlan.status !== PlanStatus.IN_REVIEW) {
      throw errorFactory.createValidationError(
        `Care plan cannot be approved. Current status: ${carePlan.status}`
      );
    }

    try {
      const approvedCarePlan = await this.prisma.carePlan.update({
        where: { id },
        data: {
          status: PlanStatus.APPROVED,
          approvedById,
          approvedAt: new Date(),
          approvalNotes
        },
        include: {
          goals: true,
          interventions: true
        }
      });

      logger.info('Care plan approved successfully', { 
        carePlanId: id, 
        approvedById, 
        previousStatus: carePlan.status 
      });
      
      return approvedCarePlan as CarePlan;
    } catch (error) {
      logger.error('Failed to approve care plan', { error, carePlanId: id, approvedById });
      throw error;
    }
  }

  /**
   * Creates a new version of an existing care plan.
   * 
   * @param carePlanId - The ID of the care plan
   * @param changes - Record of changes made in this version
   * @returns The updated care plan and version ID
   */
  async createVersion(carePlanId: string, changes: Record<string, any>): Promise<{ carePlan: CarePlan; versionId: string; }> {
    logger.info('Creating new version of care plan', { carePlanId });

    const carePlan = await this.findById(carePlanId, true, true);
    if (!carePlan) {
      throw errorFactory.createNotFoundError(`Care plan with ID ${carePlanId} not found`);
    }

    try {
      return await executeWithTransaction(async (tx) => {
        // Create a version record with the current state
        const versionRecord = await tx.carePlanVersion.create({
          data: {
            carePlanId,
            version: carePlan.version,
            changes: changes,
            createdById: changes.createdById || carePlan.createdById
          }
        });

        // Increment the version number on the care plan
        const updatedCarePlan = await tx.carePlan.update({
          where: { id: carePlanId },
          data: {
            version: carePlan.version + 1,
            // If there are other changes to the care plan, apply them here
            ...changes
          },
          include: {
            goals: true,
            interventions: true
          }
        });

        logger.info('New version created for care plan', { 
          carePlanId, 
          oldVersion: carePlan.version, 
          newVersion: updatedCarePlan.version,
          versionId: versionRecord.id
        });

        return { 
          carePlan: updatedCarePlan as CarePlan, 
          versionId: versionRecord.id 
        };
      });
    } catch (error) {
      logger.error('Failed to create new version of care plan', { error, carePlanId });
      throw error;
    }
  }

  /**
   * Retrieves the version history of a care plan.
   * 
   * @param carePlanId - The ID of the care plan
   * @returns Object containing the care plan ID, current version, and version history
   */
  async getVersionHistory(carePlanId: string): Promise<{ carePlanId: string; currentVersion: number; versions: any[]; }> {
    logger.info('Getting version history for care plan', { carePlanId });

    try {
      // Get the current care plan to determine current version
      const carePlan = await this.prisma.carePlan.findUnique({
        where: { id: carePlanId },
        select: { id: true, version: true }
      });

      if (!carePlan) {
        throw errorFactory.createNotFoundError(`Care plan with ID ${carePlanId} not found`);
      }

      // Get all versions of this care plan
      const versions = await this.prisma.carePlanVersion.findMany({
        where: { carePlanId },
        orderBy: { version: 'desc' }
      });

      logger.info('Retrieved version history for care plan', { 
        carePlanId, 
        currentVersion: carePlan.version,
        versionCount: versions.length
      });

      return {
        carePlanId,
        currentVersion: carePlan.version,
        versions
      };
    } catch (error) {
      logger.error('Failed to get version history for care plan', { error, carePlanId });
      throw error;
    }
  }

  /**
   * Deletes a care plan and its associated goals and interventions.
   * 
   * @param id - The ID of the care plan to delete
   * @returns True if the care plan was deleted, false otherwise
   */
  async delete(id: string): Promise<boolean> {
    logger.info('Deleting care plan', { carePlanId: id });

    try {
      return await executeWithTransaction(async (tx) => {
        // Delete associated goals
        await tx.carePlanGoal.deleteMany({
          where: { carePlanId: id }
        });

        // Delete associated interventions
        await tx.carePlanIntervention.deleteMany({
          where: { carePlanId: id }
        });

        // Delete version history
        await tx.carePlanVersion.deleteMany({
          where: { carePlanId: id }
        });

        // Delete the care plan
        await tx.carePlan.delete({
          where: { id }
        });

        logger.info('Care plan deleted successfully', { carePlanId: id });
        return true;
      });
    } catch (error) {
      logger.error('Failed to delete care plan', { error, carePlanId: id });
      
      // If the care plan doesn't exist, consider it a success
      if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
        return false;
      }
      
      throw error;
    }
  }

  /**
   * Validates if a status transition is allowed.
   * 
   * @param currentStatus - The current status of the care plan
   * @param newStatus - The proposed new status
   * @returns True if the transition is allowed, false otherwise
   */
  private validateStatusTransition(currentStatus: PlanStatus, newStatus: PlanStatus): boolean {
    // Define allowed transitions for each status
    const allowedTransitions: Record<PlanStatus, PlanStatus[]> = {
      [PlanStatus.DRAFT]: [PlanStatus.IN_REVIEW, PlanStatus.CANCELLED],
      [PlanStatus.IN_REVIEW]: [PlanStatus.DRAFT, PlanStatus.APPROVED, PlanStatus.REJECTED],
      [PlanStatus.REJECTED]: [PlanStatus.DRAFT, PlanStatus.CANCELLED],
      [PlanStatus.APPROVED]: [PlanStatus.ACTIVE, PlanStatus.SUPERSEDED],
      [PlanStatus.ACTIVE]: [PlanStatus.UNDER_REVIEW, PlanStatus.ON_HOLD, PlanStatus.COMPLETED],
      [PlanStatus.UNDER_REVIEW]: [PlanStatus.ACTIVE, PlanStatus.REVISED],
      [PlanStatus.REVISED]: [PlanStatus.ACTIVE],
      [PlanStatus.ON_HOLD]: [PlanStatus.ACTIVE, PlanStatus.TERMINATED],
      [PlanStatus.COMPLETED]: [], // Terminal state
      [PlanStatus.CANCELLED]: [], // Terminal state
      [PlanStatus.TERMINATED]: [], // Terminal state
      [PlanStatus.SUPERSEDED]: []  // Terminal state
    };

    // If the status isn't changing, it's always valid
    if (currentStatus === newStatus) {
      return true;
    }

    // Check if the new status is in the allowed transitions for the current status
    return allowedTransitions[currentStatus]?.includes(newStatus) || false;
  }
}