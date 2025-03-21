import { InterventionStatus, CarePlanIntervention } from '../types/care-plan.types';
import { prisma } from '../config/database';

/**
 * Model class for managing care plan interventions in the database
 */
export class CarePlanInterventionModel {
  private prisma;
  
  /**
   * Initializes a new instance of the CarePlanInterventionModel class
   */
  constructor() {
    this.prisma = prisma;
  }

  /**
   * Creates a new care plan intervention in the database
   * 
   * @param data The intervention data to create
   * @returns The created care plan intervention
   */
  async create(data: Omit<CarePlanIntervention, 'id' | 'createdAt' | 'updatedAt'>): Promise<CarePlanIntervention> {
    // Validate the input data
    if (!data.carePlanId) {
      throw new Error('Care plan ID is required');
    }

    if (!data.description) {
      throw new Error('Description is required');
    }

    if (!data.frequency) {
      throw new Error('Frequency is required');
    }

    if (!data.duration) {
      throw new Error('Duration is required');
    }

    if (!data.responsibleParty) {
      throw new Error('Responsible party is required');
    }

    // Set default status if not provided
    const status = data.status || InterventionStatus.PENDING;

    // Create the intervention in the database
    const intervention = await this.prisma.carePlanIntervention.create({
      data: {
        ...data,
        status
      }
    });

    return intervention;
  }

  /**
   * Creates multiple care plan interventions in the database
   * 
   * @param carePlanId The ID of the care plan these interventions belong to
   * @param interventions Array of intervention data to create
   * @returns The created care plan interventions
   */
  async createMany(
    carePlanId: string,
    interventions: Array<Omit<CarePlanIntervention, 'id' | 'carePlanId' | 'createdAt' | 'updatedAt'>>
  ): Promise<CarePlanIntervention[]> {
    // Validate the input data
    if (!carePlanId) {
      throw new Error('Care plan ID is required');
    }

    if (!interventions || !Array.isArray(interventions) || interventions.length === 0) {
      throw new Error('At least one intervention is required');
    }

    // Create all interventions using createMany for better performance
    await this.prisma.carePlanIntervention.createMany({
      data: interventions.map(intervention => ({
        ...intervention,
        carePlanId,
        status: intervention.status || InterventionStatus.PENDING
      }))
    });

    // Fetch and return the created interventions
    return this.findByCarePlanId(carePlanId);
  }

  /**
   * Retrieves a care plan intervention by its ID
   * 
   * @param id The ID of the intervention to retrieve
   * @returns The care plan intervention if found, null otherwise
   */
  async findById(id: string): Promise<CarePlanIntervention | null> {
    if (!id) {
      throw new Error('Intervention ID is required');
    }

    const intervention = await this.prisma.carePlanIntervention.findUnique({
      where: { id }
    });

    return intervention;
  }

  /**
   * Retrieves all interventions for a specific care plan
   * 
   * @param carePlanId The ID of the care plan
   * @returns Array of care plan interventions associated with the care plan
   */
  async findByCarePlanId(carePlanId: string): Promise<CarePlanIntervention[]> {
    if (!carePlanId) {
      throw new Error('Care plan ID is required');
    }

    const interventions = await this.prisma.carePlanIntervention.findMany({
      where: { carePlanId },
      orderBy: { createdAt: 'asc' }
    });

    return interventions;
  }

  /**
   * Updates an existing care plan intervention
   * 
   * @param id The ID of the intervention to update
   * @param data The updated intervention data
   * @returns The updated care plan intervention
   */
  async update(
    id: string,
    data: Partial<Omit<CarePlanIntervention, 'id' | 'carePlanId' | 'createdAt' | 'updatedAt'>>
  ): Promise<CarePlanIntervention> {
    if (!id) {
      throw new Error('Intervention ID is required');
    }

    // First check if intervention exists
    const existingIntervention = await this.findById(id);
    
    if (!existingIntervention) {
      throw new Error(`Intervention with ID ${id} not found`);
    }

    // Update the intervention
    const updatedIntervention = await this.prisma.carePlanIntervention.update({
      where: { id },
      data
    });

    return updatedIntervention;
  }

  /**
   * Updates the status of a care plan intervention
   * 
   * @param id The ID of the intervention to update
   * @param status The new status
   * @returns The updated care plan intervention
   */
  async updateStatus(id: string, status: InterventionStatus): Promise<CarePlanIntervention> {
    if (!id) {
      throw new Error('Intervention ID is required');
    }

    if (!Object.values(InterventionStatus).includes(status)) {
      throw new Error(`Invalid status: ${status}`);
    }

    // Update the intervention status
    try {
      const updatedIntervention = await this.prisma.carePlanIntervention.update({
        where: { id },
        data: { status }
      });

      return updatedIntervention;
    } catch (error) {
      if (error.code === 'P2025') {
        // Prisma error for record not found
        throw new Error(`Intervention with ID ${id} not found`);
      }
      throw error;
    }
  }

  /**
   * Deletes a care plan intervention
   * 
   * @param id The ID of the intervention to delete
   * @returns True if the intervention was deleted, false otherwise
   */
  async delete(id: string): Promise<boolean> {
    if (!id) {
      throw new Error('Intervention ID is required');
    }

    try {
      await this.prisma.carePlanIntervention.delete({
        where: { id }
      });
      
      return true;
    } catch (error) {
      // If deletion fails (e.g., intervention not found), return false
      return false;
    }
  }

  /**
   * Deletes all interventions associated with a care plan
   * 
   * @param carePlanId The ID of the care plan
   * @returns The number of interventions deleted
   */
  async deleteByCarePlanId(carePlanId: string): Promise<number> {
    if (!carePlanId) {
      throw new Error('Care plan ID is required');
    }

    const result = await this.prisma.carePlanIntervention.deleteMany({
      where: { carePlanId }
    });

    return result.count;
  }

  /**
   * Synchronizes interventions for a care plan by adding, updating, and removing interventions as needed
   * 
   * @param carePlanId The ID of the care plan
   * @param interventions The desired list of interventions
   * @returns The updated list of care plan interventions
   */
  async syncInterventions(
    carePlanId: string,
    interventions: Array<{
      id?: string;
      description: string;
      frequency: string;
      duration: string;
      responsibleParty: string;
      status?: InterventionStatus;
    }>
  ): Promise<CarePlanIntervention[]> {
    if (!carePlanId) {
      throw new Error('Care plan ID is required');
    }

    if (!interventions || !Array.isArray(interventions)) {
      throw new Error('Interventions array is required');
    }

    // Validate all intervention data
    for (const intervention of interventions) {
      if (!intervention.description) {
        throw new Error('Description is required for all interventions');
      }
      if (!intervention.frequency) {
        throw new Error('Frequency is required for all interventions');
      }
      if (!intervention.duration) {
        throw new Error('Duration is required for all interventions');
      }
      if (!intervention.responsibleParty) {
        throw new Error('Responsible party is required for all interventions');
      }
      if (intervention.status && !Object.values(InterventionStatus).includes(intervention.status)) {
        throw new Error(`Invalid status: ${intervention.status}`);
      }
    }

    // Retrieve existing interventions
    const existingInterventions = await this.findByCarePlanId(carePlanId);
    
    // Create sets of IDs for quick lookup
    const existingIds = new Set(existingInterventions.map(i => i.id));
    const newIds = new Set(interventions.filter(i => i.id).map(i => i.id));
    
    // Determine interventions to add, update, and delete
    const toCreate = interventions.filter(i => !i.id);
    const toUpdate = interventions.filter(i => i.id && existingIds.has(i.id as string));
    const toDelete = existingInterventions.filter(i => !newIds.has(i.id));
    
    // Process in a transaction to ensure consistency
    await this.prisma.$transaction(async (tx) => {
      // Delete interventions that are no longer needed
      if (toDelete.length > 0) {
        await tx.carePlanIntervention.deleteMany({
          where: {
            id: {
              in: toDelete.map(i => i.id)
            }
          }
        });
      }
      
      // Update existing interventions
      for (const intervention of toUpdate) {
        await tx.carePlanIntervention.update({
          where: { id: intervention.id },
          data: {
            description: intervention.description,
            frequency: intervention.frequency,
            duration: intervention.duration,
            responsibleParty: intervention.responsibleParty,
            status: intervention.status || InterventionStatus.PENDING
          }
        });
      }
      
      // Create new interventions
      if (toCreate.length > 0) {
        await tx.carePlanIntervention.createMany({
          data: toCreate.map(intervention => ({
            carePlanId,
            description: intervention.description,
            frequency: intervention.frequency,
            duration: intervention.duration,
            responsibleParty: intervention.responsibleParty,
            status: intervention.status || InterventionStatus.PENDING
          }))
        });
      }
    });
    
    // Return the updated list of interventions
    return this.findByCarePlanId(carePlanId);
  }
}