import { GoalStatus, CarePlanGoal } from '../types/care-plan.types';
import { prisma } from '../config/database';

/**
 * Model class for managing care plan goals in the database
 */
export class CarePlanGoalModel {
  private prisma: any;

  /**
   * Initializes a new instance of the CarePlanGoalModel class
   */
  constructor() {
    this.prisma = prisma;
  }

  /**
   * Creates a new care plan goal in the database
   * @param data The care plan goal data to create
   * @returns The created care plan goal
   */
  async create(data: Omit<CarePlanGoal, 'id' | 'createdAt' | 'updatedAt'>): Promise<CarePlanGoal> {
    // Validate required fields
    if (!data.carePlanId) {
      throw new Error('Care plan ID is required');
    }

    if (!data.description || data.description.trim() === '') {
      throw new Error('Goal description is required');
    }

    // Set default status if not provided
    if (!data.status) {
      data.status = GoalStatus.PENDING;
    } else if (!Object.values(GoalStatus).includes(data.status)) {
      throw new Error(`Invalid goal status: ${data.status}`);
    }

    // Initialize measures as empty array if not provided
    const measures = Array.isArray(data.measures) ? data.measures : [];

    try {
      // Create the goal in the database
      const goal = await this.prisma.carePlanGoal.create({
        data: {
          carePlanId: data.carePlanId,
          description: data.description.trim(),
          targetDate: data.targetDate || null,
          status: data.status,
          measures: measures
        }
      });

      return goal;
    } catch (error) {
      // Handle database errors
      if (error.code === 'P2003') {
        throw new Error(`Care plan with ID ${data.carePlanId} does not exist`);
      }
      throw error;
    }
  }

  /**
   * Creates multiple care plan goals in the database
   * @param carePlanId The ID of the care plan
   * @param goals The care plan goals to create
   * @returns The created care plan goals
   */
  async createMany(
    carePlanId: string, 
    goals: Array<Omit<CarePlanGoal, 'id' | 'carePlanId' | 'createdAt' | 'updatedAt'>>
  ): Promise<CarePlanGoal[]> {
    if (!carePlanId) {
      throw new Error('Care plan ID is required');
    }

    if (!goals || !Array.isArray(goals) || goals.length === 0) {
      throw new Error('At least one goal is required');
    }

    try {
      // Use a transaction to ensure all goals are created or none
      return await this.prisma.$transaction(async (tx: any) => {
        const createdGoals = [];
        
        for (const goal of goals) {
          const createdGoal = await tx.carePlanGoal.create({
            data: {
              carePlanId,
              description: goal.description.trim(),
              targetDate: goal.targetDate || null,
              status: goal.status || GoalStatus.PENDING,
              measures: Array.isArray(goal.measures) ? goal.measures : []
            }
          });
          
          createdGoals.push(createdGoal);
        }
        
        return createdGoals;
      });
    } catch (error) {
      // Handle database errors
      if (error.code === 'P2003') {
        throw new Error(`Care plan with ID ${carePlanId} does not exist`);
      }
      throw error;
    }
  }

  /**
   * Retrieves a care plan goal by its ID
   * @param id The ID of the care plan goal to retrieve
   * @returns The care plan goal if found, null otherwise
   */
  async findById(id: string): Promise<CarePlanGoal | null> {
    if (!id) {
      throw new Error('Goal ID is required');
    }

    try {
      const goal = await this.prisma.carePlanGoal.findUnique({
        where: { id }
      });

      return goal;
    } catch (error) {
      // Handle potential database errors
      throw error;
    }
  }

  /**
   * Retrieves all goals for a specific care plan
   * @param carePlanId The ID of the care plan
   * @returns Array of care plan goals associated with the care plan
   */
  async findByCarePlanId(carePlanId: string): Promise<CarePlanGoal[]> {
    if (!carePlanId) {
      throw new Error('Care plan ID is required');
    }

    try {
      const goals = await this.prisma.carePlanGoal.findMany({
        where: { carePlanId },
        orderBy: { createdAt: 'asc' }
      });

      return goals;
    } catch (error) {
      // Handle potential database errors
      throw error;
    }
  }

  /**
   * Updates an existing care plan goal
   * @param id The ID of the care plan goal to update
   * @param data The data to update
   * @returns The updated care plan goal
   */
  async update(
    id: string, 
    data: Partial<Omit<CarePlanGoal, 'id' | 'carePlanId' | 'createdAt' | 'updatedAt'>>
  ): Promise<CarePlanGoal> {
    if (!id) {
      throw new Error('Goal ID is required');
    }

    if (Object.keys(data).length === 0) {
      throw new Error('No update data provided');
    }

    // Validate the data
    if (data.description !== undefined && data.description.trim() === '') {
      throw new Error('Goal description cannot be empty');
    }

    if (data.status !== undefined && !Object.values(GoalStatus).includes(data.status)) {
      throw new Error(`Invalid goal status: ${data.status}`);
    }

    // Prepare the update data
    const updateData: any = {};
    
    if (data.description !== undefined) {
      updateData.description = data.description.trim();
    }
    
    if (data.targetDate !== undefined) {
      updateData.targetDate = data.targetDate;
    }
    
    if (data.status !== undefined) {
      updateData.status = data.status;
    }
    
    if (data.measures !== undefined) {
      updateData.measures = Array.isArray(data.measures) ? data.measures : [];
    }

    try {
      // Update the goal in the database
      const updatedGoal = await this.prisma.carePlanGoal.update({
        where: { id },
        data: updateData
      });

      return updatedGoal;
    } catch (error) {
      // Handle database errors
      if (error.code === 'P2025') {
        throw new Error(`Goal with ID ${id} not found`);
      }
      throw error;
    }
  }

  /**
   * Updates the status of a care plan goal
   * @param id The ID of the care plan goal to update
   * @param status The new status
   * @returns The updated care plan goal
   */
  async updateStatus(id: string, status: GoalStatus): Promise<CarePlanGoal> {
    if (!id) {
      throw new Error('Goal ID is required');
    }

    if (!status) {
      throw new Error('Status is required');
    }

    if (!Object.values(GoalStatus).includes(status)) {
      throw new Error(`Invalid goal status: ${status}`);
    }

    try {
      // Update the status in the database
      const updatedGoal = await this.prisma.carePlanGoal.update({
        where: { id },
        data: { status }
      });

      return updatedGoal;
    } catch (error) {
      // Handle database errors
      if (error.code === 'P2025') {
        throw new Error(`Goal with ID ${id} not found`);
      }
      throw error;
    }
  }

  /**
   * Updates the progress of a care plan goal with measures
   * @param id The ID of the care plan goal to update
   * @param measures The updated measures
   * @param status The updated status (optional)
   * @returns The updated care plan goal
   */
  async updateProgress(
    id: string, 
    measures: string[], 
    status?: GoalStatus
  ): Promise<CarePlanGoal> {
    if (!id) {
      throw new Error('Goal ID is required');
    }

    if (!measures || !Array.isArray(measures)) {
      throw new Error('Measures must be an array');
    }

    // Prepare update data
    const updateData: any = { measures };
    
    // Include status in update if provided
    if (status) {
      if (!Object.values(GoalStatus).includes(status)) {
        throw new Error(`Invalid goal status: ${status}`);
      }
      updateData.status = status;
    }

    try {
      // Update the goal in the database
      const updatedGoal = await this.prisma.carePlanGoal.update({
        where: { id },
        data: updateData
      });

      return updatedGoal;
    } catch (error) {
      // Handle database errors
      if (error.code === 'P2025') {
        throw new Error(`Goal with ID ${id} not found`);
      }
      throw error;
    }
  }

  /**
   * Deletes a care plan goal
   * @param id The ID of the care plan goal to delete
   * @returns True if the goal was deleted, false otherwise
   */
  async delete(id: string): Promise<boolean> {
    if (!id) {
      throw new Error('Goal ID is required');
    }

    try {
      await this.prisma.carePlanGoal.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      // Handle case where goal doesn't exist
      if (error.code === 'P2025') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Deletes all goals associated with a care plan
   * @param carePlanId The ID of the care plan
   * @returns The number of goals deleted
   */
  async deleteByCarePlanId(carePlanId: string): Promise<number> {
    if (!carePlanId) {
      throw new Error('Care plan ID is required');
    }

    try {
      const result = await this.prisma.carePlanGoal.deleteMany({
        where: { carePlanId }
      });

      return result.count;
    } catch (error) {
      // Handle potential database errors
      throw error;
    }
  }

  /**
   * Synchronizes goals for a care plan by adding, updating, and removing goals as needed
   * @param carePlanId The ID of the care plan
   * @param goals The goals to synchronize
   * @returns The updated list of care plan goals
   */
  async syncGoals(
    carePlanId: string,
    goals: Array<{
      id?: string;
      description: string;
      targetDate?: Date;
      status?: GoalStatus;
      measures: string[];
    }>
  ): Promise<CarePlanGoal[]> {
    if (!carePlanId) {
      throw new Error('Care plan ID is required');
    }

    if (!goals || !Array.isArray(goals)) {
      throw new Error('Goals must be an array');
    }
    
    // Validate all goal data
    for (const goal of goals) {
      if (!goal.description || goal.description.trim() === '') {
        throw new Error('All goals must have a description');
      }
      
      if (goal.status && !Object.values(GoalStatus).includes(goal.status)) {
        throw new Error(`Invalid goal status: ${goal.status}`);
      }
      
      if (!Array.isArray(goal.measures)) {
        throw new Error('Measures must be an array for all goals');
      }
    }
    
    try {
      // Use a transaction to ensure atomicity of the sync operation
      return await this.prisma.$transaction(async (tx: any) => {
        // Get existing goals for the care plan
        const existingGoals = await tx.carePlanGoal.findMany({
          where: { carePlanId }
        });
        
        const existingGoalMap = new Map(
          existingGoals.map(goal => [goal.id, goal])
        );
        
        // Track which existing goals should be kept
        const goalIdsToKeep = new Set<string>();
        
        // Process updates and additions
        const processedGoals = [];
        
        for (const goal of goals) {
          if (goal.id && existingGoalMap.has(goal.id)) {
            // Update existing goal
            goalIdsToKeep.add(goal.id);
            
            const updatedGoal = await tx.carePlanGoal.update({
              where: { id: goal.id },
              data: {
                description: goal.description.trim(),
                targetDate: goal.targetDate,
                status: goal.status || existingGoalMap.get(goal.id)!.status,
                measures: goal.measures
              }
            });
            
            processedGoals.push(updatedGoal);
          } else {
            // Create new goal
            const newGoal = await tx.carePlanGoal.create({
              data: {
                carePlanId,
                description: goal.description.trim(),
                targetDate: goal.targetDate || null,
                status: goal.status || GoalStatus.PENDING,
                measures: goal.measures
              }
            });
            
            processedGoals.push(newGoal);
          }
        }
        
        // Delete goals that weren't in the input
        const goalIdsToDelete = existingGoals
          .filter(goal => !goalIdsToKeep.has(goal.id))
          .map(goal => goal.id);
        
        if (goalIdsToDelete.length > 0) {
          await tx.carePlanGoal.deleteMany({
            where: {
              id: { in: goalIdsToDelete }
            }
          });
        }
        
        // Return processed goals sorted by creation date
        return processedGoals.sort((a, b) => 
          a.createdAt.getTime() - b.createdAt.getTime()
        );
      });
    } catch (error) {
      // Handle database errors
      if (error.code === 'P2003') {
        throw new Error(`Care plan with ID ${carePlanId} does not exist`);
      }
      throw error;
    }
  }
}