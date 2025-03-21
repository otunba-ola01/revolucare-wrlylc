import {
  ServiceType,
  ServiceTypeLabels,
  ServiceTypeDescriptions,
  ServiceCategories,
  DefaultServiceDurations,
  getCategoryForServiceType
} from '../constants/service-types';

/**
 * Model class for service types in the Revolucare platform
 * 
 * This class provides methods for creating, validating, and managing service
 * types with their associated metadata such as labels, descriptions, categories,
 * and default durations.
 */
export class ServiceTypeModel {
  readonly code: ServiceType;
  readonly label: string;
  readonly description: string;
  readonly category: string;
  readonly defaultDuration: number;
  private isActive: boolean;

  /**
   * Creates a new ServiceTypeModel instance
   * 
   * @param serviceType - The service type enum value
   * @param isActive - Whether the service type is active (default: true)
   * @throws Error if the service type is invalid
   */
  constructor(serviceType: ServiceType, isActive = true) {
    if (!Object.values(ServiceType).includes(serviceType)) {
      throw new Error(`Invalid service type: ${serviceType}`);
    }

    this.code = serviceType;
    this.label = ServiceTypeLabels[serviceType];
    this.description = ServiceTypeDescriptions[serviceType];
    
    const category = getCategoryForServiceType(serviceType);
    if (!category) {
      throw new Error(`No category found for service type: ${serviceType}`);
    }
    this.category = category;
    
    this.defaultDuration = DefaultServiceDurations[serviceType];
    this.isActive = isActive;
  }

  /**
   * Validates that the service type is valid
   * 
   * @returns True if valid, throws Error otherwise
   */
  validate(): boolean {
    // Check if code is a valid ServiceType
    if (!Object.values(ServiceType).includes(this.code)) {
      throw new Error(`Invalid service type code: ${this.code}`);
    }

    // Verify label exists
    if (!this.label || typeof this.label !== 'string') {
      throw new Error(`Invalid label for service type: ${this.code}`);
    }

    // Verify description exists
    if (!this.description || typeof this.description !== 'string') {
      throw new Error(`Invalid description for service type: ${this.code}`);
    }

    // Verify category is valid
    if (!this.category || typeof this.category !== 'string' || 
        !Object.keys(ServiceCategories).includes(this.category)) {
      throw new Error(`Invalid category for service type: ${this.code}`);
    }

    // Verify default duration is a positive number
    if (!this.defaultDuration || typeof this.defaultDuration !== 'number' || this.defaultDuration <= 0) {
      throw new Error(`Invalid default duration for service type: ${this.code}`);
    }

    return true;
  }

  /**
   * Gets the human-readable label for the service type
   * 
   * @returns The service type label
   */
  getLabel(): string {
    return this.label;
  }

  /**
   * Gets the detailed description for the service type
   * 
   * @returns The service type description
   */
  getDescription(): string {
    return this.description;
  }

  /**
   * Gets the category that this service type belongs to
   * 
   * @returns The service type category
   */
  getCategory(): string {
    return this.category;
  }

  /**
   * Gets the default duration in minutes for this service type
   * 
   * @returns Default duration in minutes
   */
  getDefaultDuration(): number {
    return this.defaultDuration;
  }

  /**
   * Checks if this service type is currently active in the system
   * 
   * @returns True if the service type is active, false otherwise
   */
  isActiveService(): boolean {
    return this.isActive;
  }

  /**
   * Sets the active status of this service type
   * 
   * @param active - The new active status
   * @returns This instance for method chaining
   */
  setActive(active: boolean): ServiceTypeModel {
    this.isActive = active;
    return this;
  }

  /**
   * Converts the model to a plain JavaScript object
   * 
   * @returns Plain object representation of the service type
   */
  toJSON(): Record<string, any> {
    return {
      code: this.code,
      label: this.label,
      description: this.description,
      category: this.category,
      defaultDuration: this.defaultDuration,
      isActive: this.isActive
    };
  }

  /**
   * Creates a new ServiceTypeModel from a service type code
   * 
   * @param code - The service type code
   * @returns A new ServiceTypeModel instance
   */
  static fromCode(code: ServiceType): ServiceTypeModel {
    return new ServiceTypeModel(code);
  }

  /**
   * Gets all available service types as model instances
   * 
   * @returns Array of all service type models
   */
  static getAllServiceTypes(): ServiceTypeModel[] {
    return Object.values(ServiceType).map(type => new ServiceTypeModel(type));
  }

  /**
   * Gets all service types in a specific category
   * 
   * @param category - The category to filter by
   * @returns Array of service type models in the specified category
   */
  static getServiceTypesByCategory(category: string): ServiceTypeModel[] {
    return ServiceTypeModel.getAllServiceTypes()
      .filter(model => model.getCategory() === category);
  }
}

export default ServiceTypeModel;