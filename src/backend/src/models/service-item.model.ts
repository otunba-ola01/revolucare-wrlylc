import { ServiceType, ServiceTypeLabels, DefaultServiceDurations } from '../constants/service-types';
import { ServiceItem, CreateServiceItemDTO, UpdateServiceItemDTO } from '../types/services-plan.types';

/**
 * Model class for service items that provides methods for creating, validating, 
 * and manipulating service items within a services plan.
 */
export class ServiceItemModel implements ServiceItem {
  id: string;
  servicesPlanId: string;
  serviceType: ServiceType;
  providerId: string | null;
  description: string;
  frequency: string;
  duration: string;
  estimatedCost: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;

  /**
   * Creates a new ServiceItemModel instance
   * @param data Service item data (entity or DTO)
   */
  constructor(data: ServiceItem | CreateServiceItemDTO) {
    // Initialize with provided data or defaults
    this.id = 'id' in data ? data.id : '';
    this.servicesPlanId = 'servicesPlanId' in data ? data.servicesPlanId : '';
    this.serviceType = data.serviceType;
    this.providerId = data.providerId;
    this.description = data.description;
    this.frequency = data.frequency;
    this.duration = data.duration;
    this.estimatedCost = data.estimatedCost;
    this.status = 'status' in data ? data.status : 'pending';
    this.createdAt = 'createdAt' in data ? data.createdAt : new Date();
    this.updatedAt = 'updatedAt' in data ? data.updatedAt : new Date();
  }

  /**
   * Converts the model to a plain JavaScript object
   * @returns Plain object representation of the service item
   */
  toJSON(): ServiceItem {
    return {
      id: this.id,
      servicesPlanId: this.servicesPlanId,
      serviceType: this.serviceType,
      providerId: this.providerId,
      description: this.description,
      frequency: this.frequency,
      duration: this.duration,
      estimatedCost: this.estimatedCost,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Gets the human-readable label for the service type
   * @returns Human-readable service type label
   */
  getServiceTypeLabel(): string {
    return ServiceTypeLabels[this.serviceType] || this.serviceType;
  }

  /**
   * Gets the default duration for the service type in minutes
   * @returns Default duration in minutes
   */
  getDefaultDuration(): number {
    return DefaultServiceDurations[this.serviceType] || 60; // 60 minutes as fallback
  }

  /**
   * Calculates the estimated cost based on service type and duration
   * @param ratesByType Hourly rates by service type
   * @returns Calculated estimated cost
   */
  calculateEstimatedCost(ratesByType: Record<ServiceType, number>): number {
    const rate = ratesByType[this.serviceType] || 0;
    
    // Parse duration to extract numeric value
    // Expected formats may vary, but we'll try to extract a numeric value
    let durationValue = 1;
    const durationMatch = this.duration.match(/(\d+)/);
    if (durationMatch && durationMatch[1]) {
      durationValue = parseInt(durationMatch[1], 10);
    }
    
    // Calculate cost based on rate and duration
    this.estimatedCost = rate * durationValue;
    
    return this.estimatedCost;
  }

  /**
   * Updates the service item with new data
   * @param data Update data
   * @returns Updated service item model
   */
  update(data: UpdateServiceItemDTO): ServiceItemModel {
    if (data.serviceType !== undefined) this.serviceType = data.serviceType;
    if (data.providerId !== undefined) this.providerId = data.providerId;
    if (data.description !== undefined) this.description = data.description;
    if (data.frequency !== undefined) this.frequency = data.frequency;
    if (data.duration !== undefined) this.duration = data.duration;
    if (data.estimatedCost !== undefined) this.estimatedCost = data.estimatedCost;
    if (data.status !== undefined) this.status = data.status;
    
    this.updatedAt = new Date();
    this.validate();
    
    return this;
  }

  /**
   * Validates the service item data
   * @returns True if valid, throws an error if invalid
   * @throws Error if validation fails
   */
  validate(): boolean {
    // Check required fields
    if (!this.serviceType) {
      throw new Error('Service type is required');
    }
    
    if (!this.description) {
      throw new Error('Description is required');
    }
    
    if (!this.frequency) {
      throw new Error('Frequency is required');
    }
    
    if (!this.duration) {
      throw new Error('Duration is required');
    }
    
    // Validate service type is a valid enum value
    if (!Object.values(ServiceType).includes(this.serviceType)) {
      throw new Error(`Invalid service type: ${this.serviceType}`);
    }
    
    // Validate frequency format - ensure it's not empty
    if (this.frequency && !this.frequency.trim()) {
      throw new Error('Frequency cannot be empty');
    }
    
    // Validate duration format - ensure it's not empty
    if (this.duration && !this.duration.trim()) {
      throw new Error('Duration cannot be empty');
    }
    
    // Validate estimated cost is a positive number
    if (this.estimatedCost < 0) {
      throw new Error('Estimated cost cannot be negative');
    }
    
    // Validate status is a valid value if provided
    const validStatuses = ['pending', 'scheduled', 'active', 'completed', 'discontinued'];
    if (this.status && !validStatuses.includes(this.status)) {
      throw new Error(`Invalid status: ${this.status}`);
    }
    
    return true;
  }

  /**
   * Creates a new ServiceItemModel from a DTO
   * @param dto Service item DTO
   * @param servicesPlanId ID of the services plan
   * @returns New service item model instance
   */
  static fromDTO(dto: CreateServiceItemDTO, servicesPlanId: string): ServiceItemModel {
    const model = new ServiceItemModel({
      ...dto,
      id: '', // Will be assigned by database
      servicesPlanId,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    } as ServiceItem);
    
    model.validate();
    return model;
  }

  /**
   * Creates a new ServiceItemModel from a database entity
   * @param entity Service item entity from database
   * @returns New service item model instance
   */
  static fromEntity(entity: ServiceItem): ServiceItemModel {
    const model = new ServiceItemModel(entity);
    return model;
  }
}

export default ServiceItemModel;