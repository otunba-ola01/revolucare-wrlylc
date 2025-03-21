import { PlanStatus } from '../constants/plan-statuses';
import { 
  CarePlan, 
  CreateCarePlanDTO, 
  UpdateCarePlanDTO, 
  CarePlanFilterParams 
} from '../types/care-plan.types';
import { prisma, executeWithTransaction } from '../config/database';
import { CarePlanGoalModel } from './care-plan-goal.model';
import { CarePlanInterventionModel } from './care-plan-intervention.model';
import { errorFactory } from '../utils/error-handler';

/**
 * Model class for managing care plans in the database
 */
export class CarePlanModel {
  private prisma: any;
  private goalModel: CarePlanGoalModel;
  private interventionModel: CarePlanInterventionModel;

  /**
   * Initializes a new instance of the CarePlanModel class
   */
  constructor() {
    this.prisma = prisma;
    this.goalModel = new CarePlanGoalModel();
    this.interventionModel = new CarePlanInterventionModel();
  }

  /**
   * Creates a new care plan in the database
   * @param data The care plan data to create
   * @param createdById The ID of the user creating the care plan
   * @returns The created care plan
   */
  async create(data: CreateCarePlanDTO, createdById: string): Promise<CarePlan> {
    // Validate the input data
    if (!data.clientId) {
      throw errorFactory.createValidationError('Client ID is required');
    }

    if (!data.title) {
      throw errorFactory.createValidationError('Title is required');
    }

    if (!data.description) {
      throw errorFactory.createValidationError('Description is required');
    }

    if (!createdById) {
      throw errorFactory.createValidationError('Creator ID is required');
    }

    // Use transaction to ensure atomicity
    return executeWithTransaction(async (tx) => {
      // Create the care plan with initial status DRAFT
      const carePlan = await tx.carePlan.create({
        data: {
          clientId: data.clientId,
          createdById,
          title: data.title,
          description: data.description,
          status: PlanStatus.DRAFT,
          confidenceScore: data.confidenceScore || 0,
          version: 1,
          previousVersionId: null
        }
      });

      // Create goals if provided
      let goals = [];
      if (data.goals && data.goals.length > 0) {
        goals = await Promise.all(
          data.goals.map(goal => 
            tx.carePlanGoal.create({
              data: {
                carePlanId: carePlan.id,
                description: goal.description,
                targetDate: goal.targetDate || null,
                status: goal.status || 'pending',
                measures: goal.measures || []
              }
            })
          )
        );
      }

      // Create interventions if provided
      let interventions = [];
      if (data.interventions && data.interventions.length > 0) {
        interventions = await Promise.all(
          data.interventions.map(intervention => 
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
          )
        );
      }

      // Return the complete care plan with goals and interventions
      return {
        ...carePlan,
        goals,
        interventions
      };
    });
  }

  /**
   * Retrieves a care plan by its ID
   * @param id The ID of the care plan to retrieve
   * @param includeGoals Whether to include goals in the result (default: true)
   * @param includeInterventions Whether to include interventions in the result (default: true)
   * @returns The care plan if found, null otherwise
   */
  async findById(
    id: string, 
    includeGoals: boolean = true, 
    includeInterventions: boolean = true
  ): Promise<CarePlan | null> {
    if (!id) {
      throw errorFactory.createValidationError('Care plan ID is required');
    }

    // Build query with optional includes
    const include: any = {};
    
    if (includeGoals) {
      include.goals = true;
    }
    
    if (includeInterventions) {
      include.interventions = true;
    }

    // Fetch the care plan
    const carePlan = await this.prisma.carePlan.findUnique({
      where: { id },
      include
    });

    return carePlan;
  }

  /**
   * Retrieves all care plans for a specific client
   * @param clientId The ID of the client
   * @param includeGoals Whether to include goals in the results (default: false)
   * @param includeInterventions Whether to include interventions in the results (default: false)
   * @returns Array of care plans associated with the client
   */
  async findByClientId(
    clientId: string, 
    includeGoals: boolean = false, 
    includeInterventions: boolean = false
  ): Promise<CarePlan[]> {
    if (!clientId) {
      throw errorFactory.createValidationError('Client ID is required');
    }

    // Build query with optional includes
    const include: any = {};
    
    if (includeGoals) {
      include.goals = true;
    }
    
    if (includeInterventions) {
      include.interventions = true;
    }

    // Fetch care plans for the client
    const carePlans = await this.prisma.carePlan.findMany({
      where: { clientId },
      include,
      orderBy: { updatedAt: 'desc' }
    });

    return carePlans;
  }

  /**
   * Retrieves care plans based on filter parameters
   * @param filters The filter parameters
   * @returns Paginated care plans and total count
   */
  async findAll(filters: CarePlanFilterParams): Promise<{ carePlans: CarePlan[]; total: number; }> {
    // Extract pagination parameters
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    // Build where conditions based on filter parameters
    const where: any = {};

    if (filters.clientId) {
      where.clientId = filters.clientId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.createdById) {
      where.createdById = filters.createdById;
    }

    if (filters.approvedById) {
      where.approvedById = filters.approvedById;
    }

    if (filters.fromDate && filters.toDate) {
      where.createdAt = {
        gte: new Date(filters.fromDate),
        lte: new Date(filters.toDate)
      };
    } else if (filters.fromDate) {
      where.createdAt = {
        gte: new Date(filters.fromDate)
      };
    } else if (filters.toDate) {
      where.createdAt = {
        lte: new Date(filters.toDate)
      };
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    // Build sort options
    const orderBy: any = {};
    if (filters.sortBy) {
      orderBy[filters.sortBy] = filters.sortOrder || 'desc';
    } else {
      orderBy.updatedAt = 'desc';
    }

    // Include options
    const include: any = {
      goals: true,
      interventions: true
    };

    // Get total count
    const total = await this.prisma.carePlan.count({ where });

    // Get paginated results
    const carePlans = await this.prisma.carePlan.findMany({
      where,
      include,
      orderBy,
      skip,
      take: limit
    });

    return { carePlans, total };
  }

  /**
   * Updates an existing care plan
   * @param id The ID of the care plan to update
   * @param data The updated care plan data
   * @returns The updated care plan
   */
  async update(id: string, data: UpdateCarePlanDTO): Promise<CarePlan> {
    if (!id) {
      throw errorFactory.createValidationError('Care plan ID is required');
    }

    // Check if care plan exists
    const existingCarePlan = await this.findById(id);
    if (!existingCarePlan) {
      throw errorFactory.createNotFoundError(`Care plan with ID ${id} not found`);
    }

    // Use transaction to ensure atomicity
    return executeWithTransaction(async (tx) => {
      // Update the care plan
      const updatedCarePlan = await tx.carePlan.update({
        where: { id },
        data: {
          title: data.title,
          description: data.description,
          status: data.status,
          updatedAt: new Date()
        }
      });

      // Sync goals if provided
      let goals = existingCarePlan.goals;
      if (data.goals) {
        goals = await this.goalModel.syncGoals(id, data.goals);
      }

      // Sync interventions if provided
      let interventions = existingCarePlan.interventions;
      if (data.interventions) {
        interventions = await this.interventionModel.syncInterventions(id, data.interventions);
      }

      // Return the updated care plan with goals and interventions
      return {
        ...updatedCarePlan,
        goals,
        interventions
      };
    });
  }

  /**
   * Updates the status of a care plan
   * @param id The ID of the care plan
   * @param status The new status
   * @returns The updated care plan
   */
  async updateStatus(id: string, status: PlanStatus): Promise<CarePlan> {
    if (!id) {
      throw errorFactory.createValidationError('Care plan ID is required');
    }

    if (!Object.values(PlanStatus).includes(status)) {
      throw errorFactory.createValidationError(`Invalid status: ${status}`);
    }

    // Find the current care plan
    const carePlan = await this.findById(id);
    if (!carePlan) {
      throw errorFactory.createNotFoundError(`Care plan with ID ${id} not found`);
    }

    // Validate the status transition
    this.validateStatusTransition(carePlan.status, status);

    // Update the status
    const updatedCarePlan = await this.prisma.carePlan.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date()
      },
      include: {
        goals: true,
        interventions: true
      }
    });

    return updatedCarePlan;
  }

  /**
   * Approves a care plan, changing its status to APPROVED
   * @param id The ID of the care plan to approve
   * @param approvedById The ID of the user approving the care plan
   * @param approvalNotes Notes provided during approval (optional)
   * @returns The approved care plan
   */
  async approve(id: string, approvedById: string, approvalNotes: string = ''): Promise<CarePlan> {
    if (!id) {
      throw errorFactory.createValidationError('Care plan ID is required');
    }

    if (!approvedById) {
      throw errorFactory.createValidationError('Approver ID is required');
    }

    // Find the current care plan
    const carePlan = await this.findById(id);
    if (!carePlan) {
      throw errorFactory.createNotFoundError(`Care plan with ID ${id} not found`);
    }

    // Verify the care plan is in a status that can be approved
    if (carePlan.status !== PlanStatus.IN_REVIEW) {
      throw errorFactory.createValidationError(
        `Care plan cannot be approved from ${carePlan.status} status. Must be in ${PlanStatus.IN_REVIEW} status.`
      );
    }

    // Update the care plan with APPROVED status
    const approvedCarePlan = await this.prisma.carePlan.update({
      where: { id },
      data: {
        status: PlanStatus.APPROVED,
        approvedById,
        approvedAt: new Date(),
        approvalNotes,
        updatedAt: new Date()
      },
      include: {
        goals: true,
        interventions: true
      }
    });

    return approvedCarePlan;
  }

  /**
   * Creates a new version of an existing care plan
   * @param carePlanId The ID of the care plan
   * @param changes The changes to apply to the new version
   * @returns The updated care plan and version ID
   */
  async createVersion(
    carePlanId: string, 
    changes: Record<string, any>
  ): Promise<{ carePlan: CarePlan; versionId: string; }> {
    if (!carePlanId) {
      throw errorFactory.createValidationError('Care plan ID is required');
    }

    // Find the current care plan
    const currentCarePlan = await this.findById(carePlanId, true, true);
    if (!currentCarePlan) {
      throw errorFactory.createNotFoundError(`Care plan with ID ${carePlanId} not found`);
    }

    // Use transaction to ensure atomicity
    return executeWithTransaction(async (tx) => {
      // Store the current version
      const versionRecord = await tx.carePlanVersion.create({
        data: {
          carePlanId,
          version: currentCarePlan.version,
          changes: {
            title: currentCarePlan.title,
            description: currentCarePlan.description,
            status: currentCarePlan.status,
            goals: currentCarePlan.goals,
            interventions: currentCarePlan.interventions
          },
          createdById: currentCarePlan.createdById
        }
      });

      // Increment version number and update with new data
      const updatedCarePlan = await tx.carePlan.update({
        where: { id: carePlanId },
        data: {
          ...changes,
          version: { increment: 1 },
          previousVersionId: versionRecord.id,
          updatedAt: new Date()
        },
        include: {
          goals: true,
          interventions: true
        }
      });

      return {
        carePlan: updatedCarePlan,
        versionId: versionRecord.id
      };
    });
  }

  /**
   * Retrieves the version history of a care plan
   * @param carePlanId The ID of the care plan
   * @returns Version history data
   */
  async getVersionHistory(carePlanId: string): Promise<{ carePlanId: string; currentVersion: number; versions: any[]; }> {
    if (!carePlanId) {
      throw errorFactory.createValidationError('Care plan ID is required');
    }

    // Find the current care plan to get current version
    const currentCarePlan = await this.prisma.carePlan.findUnique({
      where: { id: carePlanId },
      select: { version: true }
    });

    if (!currentCarePlan) {
      throw errorFactory.createNotFoundError(`Care plan with ID ${carePlanId} not found`);
    }

    // Get all versions of the care plan
    const versions = await this.prisma.carePlanVersion.findMany({
      where: { carePlanId },
      orderBy: { version: 'desc' }
    });

    return {
      carePlanId,
      currentVersion: currentCarePlan.version,
      versions
    };
  }

  /**
   * Deletes a care plan and its associated goals and interventions
   * @param id The ID of the care plan to delete
   * @returns True if the care plan was deleted, false otherwise
   */
  async delete(id: string): Promise<boolean> {
    if (!id) {
      throw errorFactory.createValidationError('Care plan ID is required');
    }

    // Use transaction to ensure atomicity
    return executeWithTransaction(async (tx) => {
      // Delete associated goals
      await this.goalModel.deleteByCarePlanId(id);

      // Delete associated interventions
      await this.interventionModel.deleteByCarePlanId(id);

      // Delete version history
      await tx.carePlanVersion.deleteMany({
        where: { carePlanId: id }
      });

      // Delete the care plan
      await tx.carePlan.delete({
        where: { id }
      });

      return true;
    }).catch(() => {
      return false;
    });
  }

  /**
   * Validates a status transition for a care plan
   * @param currentStatus The current status
   * @param newStatus The new status
   * @throws ValidationError if the transition is not allowed
   */
  private validateStatusTransition(currentStatus: PlanStatus, newStatus: PlanStatus): void {
    // Define valid status transitions
    const validTransitions: Record<PlanStatus, PlanStatus[]> = {
      [PlanStatus.DRAFT]: [PlanStatus.IN_REVIEW, PlanStatus.CANCELLED],
      [PlanStatus.IN_REVIEW]: [PlanStatus.DRAFT, PlanStatus.APPROVED, PlanStatus.REJECTED],
      [PlanStatus.APPROVED]: [PlanStatus.ACTIVE, PlanStatus.SUPERSEDED],
      [PlanStatus.ACTIVE]: [PlanStatus.UNDER_REVIEW, PlanStatus.ON_HOLD, PlanStatus.COMPLETED],
      [PlanStatus.UNDER_REVIEW]: [PlanStatus.ACTIVE, PlanStatus.REVISED],
      [PlanStatus.REVISED]: [PlanStatus.ACTIVE],
      [PlanStatus.ON_HOLD]: [PlanStatus.ACTIVE, PlanStatus.TERMINATED],
      [PlanStatus.COMPLETED]: [], // Terminal state
      [PlanStatus.CANCELLED]: [], // Terminal state
      [PlanStatus.REJECTED]: [PlanStatus.DRAFT], // Can revise and resubmit
      [PlanStatus.TERMINATED]: [], // Terminal state
      [PlanStatus.SUPERSEDED]: []  // Terminal state
    };

    // Check if the transition is valid
    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw errorFactory.createValidationError(
        `Invalid status transition from ${currentStatus} to ${newStatus}`
      );
    }
  }
}