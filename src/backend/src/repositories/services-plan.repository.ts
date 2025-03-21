import { 
  IServicesPlanRepository, 
  INeedsAssessmentRepository 
} from '../interfaces/services-plan.interface';
import { 
  ServicesPlan, 
  NeedsAssessment, 
  CreateNeedsAssessmentDTO, 
  CreateServicesPlanDTO, 
  UpdateServicesPlanDTO,
  ServicesPlanFilterParams,
  ServiceItem,
  FundingSource
} from '../types/services-plan.types';
import { PlanStatus } from '../constants/plan-statuses';
import { ServiceType } from '../constants/service-types';
import { prisma, executeWithTransaction } from '../config/database';
import { errorFactory } from '../utils/error-handler';
import { logger } from '../utils/logger';

/**
 * Repository implementation for services plan data access operations
 */
export class ServicesPlanRepository implements IServicesPlanRepository {
  private prisma;

  /**
   * Initializes a new instance of the ServicesPlanRepository class
   */
  constructor() {
    this.prisma = prisma;
  }

  /**
   * Creates a new services plan in the database
   * @param data The data for the new services plan
   * @param createdById The ID of the user creating the plan
   * @returns The created services plan
   */
  async create(data: CreateServicesPlanDTO, createdById: string): Promise<ServicesPlan> {
    try {
      logger.info('Creating new services plan', { clientId: data.clientId });

      // Use transaction to ensure atomicity
      return await executeWithTransaction(async (tx) => {
        // Create the services plan record
        const servicesPlan = await tx.servicesPlan.create({
          data: {
            clientId: data.clientId,
            carePlanId: data.carePlanId,
            title: data.title,
            description: data.description,
            needsAssessmentId: data.needsAssessmentId,
            status: PlanStatus.DRAFT,
            estimatedCost: 0, // Will be calculated from service items
            createdById,
          },
        });

        // Create service items if provided
        if (data.serviceItems && data.serviceItems.length > 0) {
          await Promise.all(
            data.serviceItems.map((item) =>
              tx.serviceItem.create({
                data: {
                  servicesPlanId: servicesPlan.id,
                  serviceType: item.serviceType,
                  providerId: item.providerId,
                  description: item.description,
                  frequency: item.frequency,
                  duration: item.duration,
                  estimatedCost: item.estimatedCost,
                  status: 'pending',
                },
              })
            )
          );
        }

        // Create funding sources if provided
        if (data.fundingSources && data.fundingSources.length > 0) {
          await Promise.all(
            data.fundingSources.map((source) =>
              tx.fundingSource.create({
                data: {
                  servicesPlanId: servicesPlan.id,
                  name: source.name,
                  type: source.type,
                  coveragePercentage: source.coveragePercentage,
                  coverageAmount: source.coverageAmount,
                  details: source.details,
                  verificationStatus: 'pending',
                },
              })
            )
          );
        }

        // Calculate the total estimated cost
        const totalCost = await this.calculateTotalCost(servicesPlan.id, tx);

        // Update the services plan with the calculated cost
        const updatedPlan = await tx.servicesPlan.update({
          where: { id: servicesPlan.id },
          data: { estimatedCost: totalCost },
          include: {
            serviceItems: true,
            fundingSources: true,
          },
        });

        logger.info('Services plan created successfully', { servicesPlanId: updatedPlan.id });
        return updatedPlan as unknown as ServicesPlan;
      });
    } catch (error) {
      logger.error('Error creating services plan', { error, data });
      throw error;
    }
  }

  /**
   * Retrieves a services plan by its ID
   * @param id The ID of the services plan to find
   * @param includeServiceItems Whether to include service items in the result
   * @param includeFundingSources Whether to include funding sources in the result
   * @returns The services plan if found, null otherwise
   */
  async findById(id: string, includeServiceItems = true, includeFundingSources = true): Promise<ServicesPlan | null> {
    try {
      logger.debug('Finding services plan by ID', { id });

      const servicesPlan = await this.prisma.servicesPlan.findUnique({
        where: { id },
        include: {
          serviceItems: includeServiceItems,
          fundingSources: includeFundingSources,
        },
      });

      return servicesPlan as unknown as ServicesPlan;
    } catch (error) {
      logger.error('Error finding services plan', { error, id });
      throw error;
    }
  }

  /**
   * Retrieves all services plans for a specific client
   * @param clientId The ID of the client
   * @param includeServiceItems Whether to include service items in the result
   * @param includeFundingSources Whether to include funding sources in the result
   * @returns Array of services plans associated with the client
   */
  async findByClientId(
    clientId: string, 
    includeServiceItems = false, 
    includeFundingSources = false
  ): Promise<ServicesPlan[]> {
    try {
      logger.debug('Finding services plans by client ID', { clientId });

      const servicesPlans = await this.prisma.servicesPlan.findMany({
        where: { clientId },
        include: {
          serviceItems: includeServiceItems,
          fundingSources: includeFundingSources,
        },
        orderBy: { createdAt: 'desc' },
      });

      return servicesPlans as unknown as ServicesPlan[];
    } catch (error) {
      logger.error('Error finding services plans by client ID', { error, clientId });
      throw error;
    }
  }

  /**
   * Retrieves services plans based on filter parameters
   * @param filters The filter parameters for querying services plans
   * @returns Paginated services plans and total count
   */
  async findAll(filters: ServicesPlanFilterParams): Promise<{ servicesPlans: ServicesPlan[]; total: number; }> {
    try {
      logger.debug('Finding services plans with filters', { filters });

      // Extract pagination parameters
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const skip = (page - 1) * limit;

      // Build where conditions based on filter parameters
      const where: any = {};

      if (filters.clientId) where.clientId = filters.clientId;
      if (filters.status) where.status = filters.status;
      if (filters.createdById) where.createdById = filters.createdById;
      if (filters.approvedById) where.approvedById = filters.approvedById;
      
      if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        if (filters.startDate) where.createdAt.gte = filters.startDate;
        if (filters.endDate) where.createdAt.lte = filters.endDate;
      }

      // For service type filtering, we need to join with service items
      if (filters.serviceType) {
        where.serviceItems = {
          some: {
            serviceType: filters.serviceType
          }
        };
      }

      // For provider filtering, we need to join with service items
      if (filters.providerId) {
        where.serviceItems = {
          some: {
            providerId: filters.providerId
          }
        };
      }

      // Handle search parameter
      if (filters.search) {
        where.OR = [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      // Get total count of matching records
      const total = await this.prisma.servicesPlan.count({ where });

      // Set up sort options
      const orderBy: any = {};
      if (filters.sortBy) {
        orderBy[filters.sortBy] = filters.sortOrder?.toLowerCase() === 'asc' ? 'asc' : 'desc';
      } else {
        orderBy.createdAt = 'desc';
      }

      // Execute paginated query
      const servicesPlans = await this.prisma.servicesPlan.findMany({
        where,
        include: {
          serviceItems: true,
          fundingSources: true,
        },
        orderBy,
        skip,
        take: limit,
      });

      return {
        servicesPlans: servicesPlans as unknown as ServicesPlan[],
        total,
      };
    } catch (error) {
      logger.error('Error finding services plans with filters', { error, filters });
      throw error;
    }
  }

  /**
   * Updates an existing services plan
   * @param id The ID of the services plan to update
   * @param data The new data for the services plan
   * @returns The updated services plan
   */
  async update(id: string, data: UpdateServicesPlanDTO): Promise<ServicesPlan> {
    try {
      logger.info('Updating services plan', { servicesPlanId: id });

      // Verify the services plan exists
      const existingPlan = await this.findById(id);
      if (!existingPlan) {
        throw errorFactory.createNotFoundError(`Services plan with ID ${id} not found`);
      }

      // Use transaction to ensure atomicity
      return await executeWithTransaction(async (tx) => {
        // Update the services plan record
        const updatedPlan = await tx.servicesPlan.update({
          where: { id },
          data: {
            title: data.title,
            description: data.description,
            status: data.status,
          },
        });

        // Handle service items updates
        if (data.serviceItems) {
          // Get existing service items
          const existingItems = await tx.serviceItem.findMany({
            where: { servicesPlanId: id },
          });

          // Create a map of existing items by ID for quick lookup
          const existingItemMap = new Map(
            existingItems.map(item => [item.id, item])
          );

          // Create a map of new items by ID for quick lookup
          const newItemMap = new Map(
            data.serviceItems.map(item => [item.id, item])
          );

          // Items to create (those without an ID)
          const itemsToCreate = data.serviceItems.filter(item => !item.id);

          // Items to update (those with an ID that exists in both lists)
          const itemsToUpdate = data.serviceItems.filter(item => 
            item.id && existingItemMap.has(item.id)
          );

          // Items to delete (those in existing but not in new)
          const itemsToDelete = existingItems.filter(item => 
            !newItemMap.has(item.id)
          );

          // Create new items
          if (itemsToCreate.length > 0) {
            await Promise.all(
              itemsToCreate.map(item =>
                tx.serviceItem.create({
                  data: {
                    servicesPlanId: id,
                    serviceType: item.serviceType,
                    providerId: item.providerId,
                    description: item.description,
                    frequency: item.frequency,
                    duration: item.duration,
                    estimatedCost: item.estimatedCost,
                    status: item.status,
                  },
                })
              )
            );
          }

          // Update existing items
          if (itemsToUpdate.length > 0) {
            await Promise.all(
              itemsToUpdate.map(item =>
                tx.serviceItem.update({
                  where: { id: item.id },
                  data: {
                    serviceType: item.serviceType,
                    providerId: item.providerId,
                    description: item.description,
                    frequency: item.frequency,
                    duration: item.duration,
                    estimatedCost: item.estimatedCost,
                    status: item.status,
                  },
                })
              )
            );
          }

          // Delete removed items
          if (itemsToDelete.length > 0) {
            await Promise.all(
              itemsToDelete.map(item =>
                tx.serviceItem.delete({
                  where: { id: item.id },
                })
              )
            );
          }
        }

        // Handle funding sources updates
        if (data.fundingSources) {
          // Get existing funding sources
          const existingSources = await tx.fundingSource.findMany({
            where: { servicesPlanId: id },
          });

          // Create a map of existing sources by ID for quick lookup
          const existingSourceMap = new Map(
            existingSources.map(source => [source.id, source])
          );

          // Create a map of new sources by ID for quick lookup
          const newSourceMap = new Map(
            data.fundingSources.map(source => [source.id, source])
          );

          // Sources to create (those without an ID)
          const sourcesToCreate = data.fundingSources.filter(source => !source.id);

          // Sources to update (those with an ID that exists in both lists)
          const sourcesToUpdate = data.fundingSources.filter(source => 
            source.id && existingSourceMap.has(source.id)
          );

          // Sources to delete (those in existing but not in new)
          const sourcesToDelete = existingSources.filter(source => 
            !newSourceMap.has(source.id)
          );

          // Create new sources
          if (sourcesToCreate.length > 0) {
            await Promise.all(
              sourcesToCreate.map(source =>
                tx.fundingSource.create({
                  data: {
                    servicesPlanId: id,
                    name: source.name,
                    type: source.type,
                    coveragePercentage: source.coveragePercentage,
                    coverageAmount: source.coverageAmount,
                    verificationStatus: source.verificationStatus,
                    details: source.details,
                  },
                })
              )
            );
          }

          // Update existing sources
          if (sourcesToUpdate.length > 0) {
            await Promise.all(
              sourcesToUpdate.map(source =>
                tx.fundingSource.update({
                  where: { id: source.id },
                  data: {
                    name: source.name,
                    type: source.type,
                    coveragePercentage: source.coveragePercentage,
                    coverageAmount: source.coverageAmount,
                    verificationStatus: source.verificationStatus,
                    details: source.details,
                  },
                })
              )
            );
          }

          // Delete removed sources
          if (sourcesToDelete.length > 0) {
            await Promise.all(
              sourcesToDelete.map(source =>
                tx.fundingSource.delete({
                  where: { id: source.id },
                })
              )
            );
          }
        }

        // Recalculate the total estimated cost
        const totalCost = await this.calculateTotalCost(id, tx);

        // Update the services plan with the calculated cost
        const finalPlan = await tx.servicesPlan.update({
          where: { id },
          data: { estimatedCost: totalCost },
          include: {
            serviceItems: true,
            fundingSources: true,
          },
        });

        logger.info('Services plan updated successfully', { servicesPlanId: id });
        return finalPlan as unknown as ServicesPlan;
      });
    } catch (error) {
      logger.error('Error updating services plan', { error, id });
      throw error;
    }
  }

  /**
   * Updates the status of a services plan
   * @param id The ID of the services plan to update
   * @param status The new status for the services plan
   * @returns The updated services plan
   */
  async updateStatus(id: string, status: PlanStatus): Promise<ServicesPlan> {
    try {
      logger.info('Updating services plan status', { servicesPlanId: id, status });

      // Find the current services plan
      const servicesPlan = await this.findById(id);
      if (!servicesPlan) {
        throw errorFactory.createNotFoundError(`Services plan with ID ${id} not found`);
      }

      // Validate the status transition
      if (!this.validateStatusTransition(servicesPlan.status, status)) {
        throw errorFactory.createValidationError(
          `Invalid status transition from ${servicesPlan.status} to ${status}`,
          { currentStatus: servicesPlan.status, newStatus: status }
        );
      }

      // Update the status
      const updatedPlan = await this.prisma.servicesPlan.update({
        where: { id },
        data: { status },
        include: {
          serviceItems: true,
          fundingSources: true,
        },
      });

      logger.info('Services plan status updated successfully', { 
        servicesPlanId: id, 
        previousStatus: servicesPlan.status, 
        newStatus: status 
      });

      return updatedPlan as unknown as ServicesPlan;
    } catch (error) {
      logger.error('Error updating services plan status', { error, id, status });
      throw error;
    }
  }

  /**
   * Approves a services plan, changing its status to APPROVED
   * @param id The ID of the services plan to approve
   * @param approvedById The ID of the user approving the plan
   * @param notes Optional notes about the approval
   * @returns The approved services plan
   */
  async approve(id: string, approvedById: string, notes = ''): Promise<ServicesPlan> {
    try {
      logger.info('Approving services plan', { servicesPlanId: id, approvedById });

      // Find the current services plan
      const servicesPlan = await this.findById(id);
      if (!servicesPlan) {
        throw errorFactory.createNotFoundError(`Services plan with ID ${id} not found`);
      }

      // Verify the plan is in a status that can be approved
      if (servicesPlan.status !== PlanStatus.DRAFT && servicesPlan.status !== PlanStatus.IN_REVIEW) {
        throw errorFactory.createValidationError(
          `Services plan cannot be approved from ${servicesPlan.status} status`,
          { currentStatus: servicesPlan.status }
        );
      }

      // Update the plan with approval information
      const approvedPlan = await this.prisma.servicesPlan.update({
        where: { id },
        data: {
          status: PlanStatus.APPROVED,
          approvedById,
          approvedAt: new Date(),
          // Store approval notes if needed
        },
        include: {
          serviceItems: true,
          fundingSources: true,
        },
      });

      logger.info('Services plan approved successfully', { servicesPlanId: id, approvedById });
      return approvedPlan as unknown as ServicesPlan;
    } catch (error) {
      logger.error('Error approving services plan', { error, id, approvedById });
      throw error;
    }
  }

  /**
   * Activates a services plan, changing its status to ACTIVE
   * @param id The ID of the services plan to activate
   * @returns The activated services plan
   */
  async activate(id: string): Promise<ServicesPlan> {
    try {
      logger.info('Activating services plan', { servicesPlanId: id });

      // Find the current services plan
      const servicesPlan = await this.findById(id);
      if (!servicesPlan) {
        throw errorFactory.createNotFoundError(`Services plan with ID ${id} not found`);
      }

      // Verify the plan is in APPROVED status
      if (servicesPlan.status !== PlanStatus.APPROVED) {
        throw errorFactory.createValidationError(
          `Services plan must be in APPROVED status to activate, current status: ${servicesPlan.status}`,
          { currentStatus: servicesPlan.status }
        );
      }

      // Update the plan to ACTIVE status
      const activatedPlan = await this.prisma.servicesPlan.update({
        where: { id },
        data: { status: PlanStatus.ACTIVE },
        include: {
          serviceItems: true,
          fundingSources: true,
        },
      });

      logger.info('Services plan activated successfully', { servicesPlanId: id });
      return activatedPlan as unknown as ServicesPlan;
    } catch (error) {
      logger.error('Error activating services plan', { error, id });
      throw error;
    }
  }

  /**
   * Marks a services plan as completed
   * @param id The ID of the services plan to complete
   * @returns The completed services plan
   */
  async complete(id: string): Promise<ServicesPlan> {
    try {
      logger.info('Completing services plan', { servicesPlanId: id });

      // Find the current services plan
      const servicesPlan = await this.findById(id);
      if (!servicesPlan) {
        throw errorFactory.createNotFoundError(`Services plan with ID ${id} not found`);
      }

      // Verify the plan is in ACTIVE status
      if (servicesPlan.status !== PlanStatus.ACTIVE) {
        throw errorFactory.createValidationError(
          `Services plan must be in ACTIVE status to complete, current status: ${servicesPlan.status}`,
          { currentStatus: servicesPlan.status }
        );
      }

      // Update the plan to COMPLETED status
      const completedPlan = await this.prisma.servicesPlan.update({
        where: { id },
        data: { status: PlanStatus.COMPLETED },
        include: {
          serviceItems: true,
          fundingSources: true,
        },
      });

      logger.info('Services plan completed successfully', { servicesPlanId: id });
      return completedPlan as unknown as ServicesPlan;
    } catch (error) {
      logger.error('Error completing services plan', { error, id });
      throw error;
    }
  }

  /**
   * Deletes a services plan and its associated service items and funding sources
   * @param id The ID of the services plan to delete
   * @returns True if the services plan was deleted, false otherwise
   */
  async delete(id: string): Promise<boolean> {
    try {
      logger.info('Deleting services plan', { servicesPlanId: id });

      // Use transaction to ensure atomicity
      return await executeWithTransaction(async (tx) => {
        // Delete associated service items
        await tx.serviceItem.deleteMany({
          where: { servicesPlanId: id },
        });

        // Delete associated funding sources
        await tx.fundingSource.deleteMany({
          where: { servicesPlanId: id },
        });

        // Delete the services plan
        await tx.servicesPlan.delete({
          where: { id },
        });

        logger.info('Services plan deleted successfully', { servicesPlanId: id });
        return true;
      });
    } catch (error) {
      logger.error('Error deleting services plan', { error, id });
      
      // If the error is a "Record not found" error, return false instead of throwing
      if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
        return false;
      }
      
      throw error;
    }
  }

  /**
   * Adds a service item to a services plan
   * @param servicesPlanId The ID of the services plan
   * @param serviceItem The service item to add
   * @returns The created service item
   */
  async addServiceItem(servicesPlanId: string, serviceItem: ServiceItem): Promise<ServiceItem> {
    try {
      logger.info('Adding service item to services plan', { servicesPlanId });

      // Validate the services plan exists
      const servicesPlan = await this.findById(servicesPlanId);
      if (!servicesPlan) {
        throw errorFactory.createNotFoundError(`Services plan with ID ${servicesPlanId} not found`);
      }

      // Create the service item
      const createdItem = await this.prisma.serviceItem.create({
        data: {
          servicesPlanId,
          serviceType: serviceItem.serviceType,
          providerId: serviceItem.providerId,
          description: serviceItem.description,
          frequency: serviceItem.frequency,
          duration: serviceItem.duration,
          estimatedCost: serviceItem.estimatedCost,
          status: serviceItem.status || 'pending',
        },
      });

      // Update the total estimated cost of the services plan
      await this.calculateTotalCost(servicesPlanId);

      logger.info('Service item added successfully', { 
        servicesPlanId, 
        serviceItemId: createdItem.id 
      });

      return createdItem as unknown as ServiceItem;
    } catch (error) {
      logger.error('Error adding service item', { error, servicesPlanId });
      throw error;
    }
  }

  /**
   * Updates an existing service item
   * @param serviceItemId The ID of the service item to update
   * @param data The new data for the service item
   * @returns The updated service item
   */
  async updateServiceItem(serviceItemId: string, data: Partial<ServiceItem>): Promise<ServiceItem> {
    try {
      logger.info('Updating service item', { serviceItemId });

      // Validate the service item exists
      const existingItem = await this.prisma.serviceItem.findUnique({
        where: { id: serviceItemId },
      });

      if (!existingItem) {
        throw errorFactory.createNotFoundError(`Service item with ID ${serviceItemId} not found`);
      }

      // Update the service item
      const updatedItem = await this.prisma.serviceItem.update({
        where: { id: serviceItemId },
        data: {
          serviceType: data.serviceType,
          providerId: data.providerId,
          description: data.description,
          frequency: data.frequency,
          duration: data.duration,
          estimatedCost: data.estimatedCost,
          status: data.status,
        },
      });

      // If the cost changed, update the total estimated cost of the services plan
      if (data.estimatedCost !== undefined && data.estimatedCost !== existingItem.estimatedCost) {
        await this.calculateTotalCost(existingItem.servicesPlanId);
      }

      logger.info('Service item updated successfully', { 
        serviceItemId, 
        servicesPlanId: existingItem.servicesPlanId 
      });

      return updatedItem as unknown as ServiceItem;
    } catch (error) {
      logger.error('Error updating service item', { error, serviceItemId });
      throw error;
    }
  }

  /**
   * Removes a service item from a services plan
   * @param serviceItemId The ID of the service item to remove
   * @returns True if the service item was removed, false otherwise
   */
  async removeServiceItem(serviceItemId: string): Promise<boolean> {
    try {
      logger.info('Removing service item', { serviceItemId });

      // Validate the service item exists
      const existingItem = await this.prisma.serviceItem.findUnique({
        where: { id: serviceItemId },
      });

      if (!existingItem) {
        throw errorFactory.createNotFoundError(`Service item with ID ${serviceItemId} not found`);
      }

      // Store the services plan ID for later use
      const servicesPlanId = existingItem.servicesPlanId;

      // Delete the service item
      await this.prisma.serviceItem.delete({
        where: { id: serviceItemId },
      });

      // Update the total estimated cost of the services plan
      await this.calculateTotalCost(servicesPlanId);

      logger.info('Service item removed successfully', { 
        serviceItemId, 
        servicesPlanId 
      });

      return true;
    } catch (error) {
      logger.error('Error removing service item', { error, serviceItemId });
      
      // If the error is a "Record not found" error, return false instead of throwing
      if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
        return false;
      }
      
      throw error;
    }
  }

  /**
   * Adds a funding source to a services plan
   * @param servicesPlanId The ID of the services plan
   * @param fundingSource The funding source to add
   * @returns The created funding source
   */
  async addFundingSource(servicesPlanId: string, fundingSource: FundingSource): Promise<FundingSource> {
    try {
      logger.info('Adding funding source to services plan', { servicesPlanId });

      // Validate the services plan exists
      const servicesPlan = await this.findById(servicesPlanId);
      if (!servicesPlan) {
        throw errorFactory.createNotFoundError(`Services plan with ID ${servicesPlanId} not found`);
      }

      // Create the funding source
      const createdSource = await this.prisma.fundingSource.create({
        data: {
          servicesPlanId,
          name: fundingSource.name,
          type: fundingSource.type,
          coveragePercentage: fundingSource.coveragePercentage,
          coverageAmount: fundingSource.coverageAmount,
          verificationStatus: fundingSource.verificationStatus || 'pending',
          details: fundingSource.details,
        },
      });

      logger.info('Funding source added successfully', { 
        servicesPlanId, 
        fundingSourceId: createdSource.id 
      });

      return createdSource as unknown as FundingSource;
    } catch (error) {
      logger.error('Error adding funding source', { error, servicesPlanId });
      throw error;
    }
  }

  /**
   * Updates an existing funding source
   * @param fundingSourceId The ID of the funding source to update
   * @param data The new data for the funding source
   * @returns The updated funding source
   */
  async updateFundingSource(fundingSourceId: string, data: Partial<FundingSource>): Promise<FundingSource> {
    try {
      logger.info('Updating funding source', { fundingSourceId });

      // Validate the funding source exists
      const existingSource = await this.prisma.fundingSource.findUnique({
        where: { id: fundingSourceId },
      });

      if (!existingSource) {
        throw errorFactory.createNotFoundError(`Funding source with ID ${fundingSourceId} not found`);
      }

      // Update the funding source
      const updatedSource = await this.prisma.fundingSource.update({
        where: { id: fundingSourceId },
        data: {
          name: data.name,
          type: data.type,
          coveragePercentage: data.coveragePercentage,
          coverageAmount: data.coverageAmount,
          verificationStatus: data.verificationStatus,
          details: data.details,
        },
      });

      logger.info('Funding source updated successfully', { 
        fundingSourceId, 
        servicesPlanId: existingSource.servicesPlanId 
      });

      return updatedSource as unknown as FundingSource;
    } catch (error) {
      logger.error('Error updating funding source', { error, fundingSourceId });
      throw error;
    }
  }

  /**
   * Removes a funding source from a services plan
   * @param fundingSourceId The ID of the funding source to remove
   * @returns True if the funding source was removed, false otherwise
   */
  async removeFundingSource(fundingSourceId: string): Promise<boolean> {
    try {
      logger.info('Removing funding source', { fundingSourceId });

      // Validate the funding source exists
      const existingSource = await this.prisma.fundingSource.findUnique({
        where: { id: fundingSourceId },
      });

      if (!existingSource) {
        throw errorFactory.createNotFoundError(`Funding source with ID ${fundingSourceId} not found`);
      }

      // Delete the funding source
      await this.prisma.fundingSource.delete({
        where: { id: fundingSourceId },
      });

      logger.info('Funding source removed successfully', { 
        fundingSourceId, 
        servicesPlanId: existingSource.servicesPlanId 
      });

      return true;
    } catch (error) {
      logger.error('Error removing funding source', { error, fundingSourceId });
      
      // If the error is a "Record not found" error, return false instead of throwing
      if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
        return false;
      }
      
      throw error;
    }
  }

  /**
   * Calculates the total estimated cost of a services plan
   * @param servicesPlanId The ID of the services plan
   * @param prismaClient Optional Prisma client for transaction context
   * @returns The total estimated cost
   */
  async calculateTotalCost(servicesPlanId: string, prismaClient?: any): Promise<number> {
    try {
      logger.debug('Calculating total cost for services plan', { servicesPlanId });
      
      // Use provided client or default
      const client = prismaClient || this.prisma;

      // Get all service items for the services plan
      const serviceItems = await client.serviceItem.findMany({
        where: { servicesPlanId },
        select: { estimatedCost: true },
      });

      // Calculate the total cost
      const totalCost = serviceItems.reduce(
        (sum, item) => sum + (item.estimatedCost || 0),
        0
      );

      // Update the services plan with the calculated cost if not in a transaction
      if (!prismaClient) {
        await client.servicesPlan.update({
          where: { id: servicesPlanId },
          data: { estimatedCost: totalCost },
        });
      }

      logger.debug('Total cost calculated', { servicesPlanId, totalCost });
      return totalCost;
    } catch (error) {
      logger.error('Error calculating total cost', { error, servicesPlanId });
      throw error;
    }
  }

  /**
   * Validates if a status transition is allowed
   * @param currentStatus The current status of the services plan
   * @param newStatus The new status to transition to
   * @returns True if the transition is allowed, false otherwise
   */
  validateStatusTransition(currentStatus: PlanStatus, newStatus: PlanStatus): boolean {
    // Define allowed transitions for each status
    const allowedTransitions: Record<PlanStatus, PlanStatus[]> = {
      [PlanStatus.DRAFT]: [
        PlanStatus.IN_REVIEW,
        PlanStatus.CANCELLED,
      ],
      [PlanStatus.IN_REVIEW]: [
        PlanStatus.DRAFT,
        PlanStatus.APPROVED,
        PlanStatus.REJECTED,
      ],
      [PlanStatus.APPROVED]: [
        PlanStatus.ACTIVE,
        PlanStatus.SUPERSEDED,
      ],
      [PlanStatus.ACTIVE]: [
        PlanStatus.UNDER_REVIEW,
        PlanStatus.ON_HOLD,
        PlanStatus.COMPLETED,
      ],
      [PlanStatus.UNDER_REVIEW]: [
        PlanStatus.ACTIVE,
        PlanStatus.REVISED,
      ],
      [PlanStatus.REVISED]: [
        PlanStatus.ACTIVE,
      ],
      [PlanStatus.ON_HOLD]: [
        PlanStatus.ACTIVE,
        PlanStatus.TERMINATED,
      ],
      [PlanStatus.COMPLETED]: [], // Terminal state
      [PlanStatus.CANCELLED]: [], // Terminal state
      [PlanStatus.REJECTED]: [
        PlanStatus.DRAFT,
        PlanStatus.CANCELLED,
      ],
      [PlanStatus.TERMINATED]: [], // Terminal state
      [PlanStatus.SUPERSEDED]: [], // Terminal state
    };

    // Check if the transition is allowed
    return allowedTransitions[currentStatus]?.includes(newStatus) || false;
  }
}

/**
 * Repository implementation for needs assessment data access operations
 */
export class NeedsAssessmentRepository implements INeedsAssessmentRepository {
  private prisma;

  /**
   * Initializes a new instance of the NeedsAssessmentRepository class
   */
  constructor() {
    this.prisma = prisma;
  }

  /**
   * Creates a new needs assessment in the database
   * @param data The data for the new needs assessment
   * @param createdById The ID of the user creating the assessment
   * @returns The created needs assessment
   */
  async create(data: CreateNeedsAssessmentDTO, createdById: string): Promise<NeedsAssessment> {
    try {
      logger.info('Creating new needs assessment', { clientId: data.clientId });

      const needsAssessment = await this.prisma.needsAssessment.create({
        data: {
          clientId: data.clientId,
          createdById,
          assessmentData: data.assessmentData,
          notes: data.notes,
        },
      });

      logger.info('Needs assessment created successfully', { 
        needsAssessmentId: needsAssessment.id 
      });

      return needsAssessment as unknown as NeedsAssessment;
    } catch (error) {
      logger.error('Error creating needs assessment', { error, data });
      throw error;
    }
  }

  /**
   * Retrieves a needs assessment by its ID
   * @param id The ID of the needs assessment to find
   * @returns The needs assessment if found, null otherwise
   */
  async findById(id: string): Promise<NeedsAssessment | null> {
    try {
      logger.debug('Finding needs assessment by ID', { id });

      const needsAssessment = await this.prisma.needsAssessment.findUnique({
        where: { id },
      });

      return needsAssessment as unknown as NeedsAssessment;
    } catch (error) {
      logger.error('Error finding needs assessment', { error, id });
      throw error;
    }
  }

  /**
   * Retrieves all needs assessments for a specific client
   * @param clientId The ID of the client
   * @returns Array of needs assessments associated with the client
   */
  async findByClientId(clientId: string): Promise<NeedsAssessment[]> {
    try {
      logger.debug('Finding needs assessments by client ID', { clientId });

      const needsAssessments = await this.prisma.needsAssessment.findMany({
        where: { clientId },
        orderBy: { createdAt: 'desc' },
      });

      return needsAssessments as unknown as NeedsAssessment[];
    } catch (error) {
      logger.error('Error finding needs assessments by client ID', { error, clientId });
      throw error;
    }
  }

  /**
   * Updates an existing needs assessment
   * @param id The ID of the needs assessment to update
   * @param data The new data for the needs assessment
   * @returns The updated needs assessment
   */
  async update(id: string, data: Partial<NeedsAssessment>): Promise<NeedsAssessment> {
    try {
      logger.info('Updating needs assessment', { needsAssessmentId: id });

      // Validate the needs assessment exists
      const existingAssessment = await this.findById(id);
      if (!existingAssessment) {
        throw errorFactory.createNotFoundError(`Needs assessment with ID ${id} not found`);
      }

      // Update the needs assessment
      const updatedAssessment = await this.prisma.needsAssessment.update({
        where: { id },
        data: {
          assessmentData: data.assessmentData,
          notes: data.notes,
        },
      });

      logger.info('Needs assessment updated successfully', { needsAssessmentId: id });
      return updatedAssessment as unknown as NeedsAssessment;
    } catch (error) {
      logger.error('Error updating needs assessment', { error, id });
      throw error;
    }
  }

  /**
   * Deletes a needs assessment
   * @param id The ID of the needs assessment to delete
   * @returns True if the needs assessment was deleted, false otherwise
   */
  async delete(id: string): Promise<boolean> {
    try {
      logger.info('Deleting needs assessment', { needsAssessmentId: id });

      await this.prisma.needsAssessment.delete({
        where: { id },
      });

      logger.info('Needs assessment deleted successfully', { needsAssessmentId: id });
      return true;
    } catch (error) {
      logger.error('Error deleting needs assessment', { error, id });
      
      // If the error is a "Record not found" error, return false instead of throwing
      if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
        return false;
      }
      
      throw error;
    }
  }
}