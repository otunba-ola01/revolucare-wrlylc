import { ProviderProfile } from '../types/provider.types';
import { ServiceType } from '../constants/service-types';
import { Roles } from '../constants/roles';
import { Address } from '../types/user.types';

/**
 * Model class representing a provider profile in the Revolucare platform
 * 
 * This class provides methods for creating, validating, and transforming provider 
 * profile data, serving as a bridge between the database schema and application logic.
 */
export class ProviderProfileModel implements ProviderProfile {
  id: string;
  userId: string;
  organizationName: string;
  licenseNumber: string | null;
  licenseExpiration: Date | null;
  serviceTypes: ServiceType[];
  bio: string | null;
  specializations: string[];
  insuranceAccepted: string[];
  address: Address | null;
  phone: string | null;
  averageRating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;

  /**
   * Creates a new ProviderProfileModel instance with the provided provider data
   * 
   * @param providerData - Partial provider profile data to initialize the model
   */
  constructor(providerData: Partial<ProviderProfile> = {}) {
    this.id = providerData.id || '';
    this.userId = providerData.userId || '';
    this.organizationName = providerData.organizationName || '';
    this.licenseNumber = providerData.licenseNumber || null;
    this.licenseExpiration = providerData.licenseExpiration ? new Date(providerData.licenseExpiration) : null;
    this.serviceTypes = providerData.serviceTypes || [];
    this.bio = providerData.bio || null;
    this.specializations = providerData.specializations || [];
    this.insuranceAccepted = providerData.insuranceAccepted || [];
    this.address = providerData.address || null;
    this.phone = providerData.phone || null;
    this.averageRating = providerData.averageRating || 0;
    this.reviewCount = providerData.reviewCount || 0;
    this.createdAt = providerData.createdAt ? new Date(providerData.createdAt) : new Date();
    this.updatedAt = providerData.updatedAt ? new Date(providerData.updatedAt) : new Date();
  }

  /**
   * Validates the provider profile data to ensure it meets all requirements
   * 
   * @returns True if the provider profile data is valid, otherwise throws an error
   * @throws Error if validation fails
   */
  validate(): boolean {
    // Check required fields
    if (!this.userId) {
      throw new Error('Provider profile must have a user ID');
    }

    if (!this.organizationName) {
      throw new Error('Provider profile must have an organization name');
    }

    // Validate service types
    if (!this.validateServiceTypes(this.serviceTypes)) {
      throw new Error('Provider profile contains invalid service types');
    }

    // Validate license expiration date is in the future if provided
    if (this.licenseExpiration && this.licenseExpiration < new Date()) {
      throw new Error('License expiration date must be in the future');
    }

    // Validate phone number format if provided
    if (this.phone && !/^\+?[1-9]\d{1,14}$/.test(this.phone.replace(/\D/g, ''))) {
      throw new Error('Invalid phone number format');
    }

    // Validate address structure if provided
    if (this.address) {
      if (!this.address.street || !this.address.city || !this.address.state || !this.address.zipCode) {
        throw new Error('Address must include street, city, state, and zipCode');
      }
    }

    return true;
  }

  /**
   * Validates that all service types are valid enum values
   * 
   * @param serviceTypes - Array of service types to validate
   * @returns True if all service types are valid, otherwise false
   */
  validateServiceTypes(serviceTypes: ServiceType[]): boolean {
    if (!Array.isArray(serviceTypes)) {
      return false;
    }

    // Check if all service types are valid ServiceType enum values
    return serviceTypes.every(type => Object.values(ServiceType).includes(type));
  }

  /**
   * Converts the provider profile model to a plain JSON object
   * 
   * @returns Provider profile object ready for serialization
   */
  toJSON(): ProviderProfile {
    return {
      id: this.id,
      userId: this.userId,
      organizationName: this.organizationName,
      licenseNumber: this.licenseNumber,
      licenseExpiration: this.licenseExpiration,
      serviceTypes: this.serviceTypes,
      bio: this.bio,
      specializations: this.specializations,
      insuranceAccepted: this.insuranceAccepted,
      address: this.address,
      phone: this.phone,
      averageRating: this.averageRating,
      reviewCount: this.reviewCount,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Creates a provider profile model from a plain JSON object
   * 
   * @param json - JSON object containing provider profile data
   * @returns A new provider profile model instance
   */
  static fromJSON(json: object): ProviderProfileModel {
    const data = json as Partial<ProviderProfile>;
    
    // Convert string dates to Date objects if needed
    if (data.licenseExpiration && typeof data.licenseExpiration === 'string') {
      data.licenseExpiration = new Date(data.licenseExpiration);
    }
    
    if (data.createdAt && typeof data.createdAt === 'string') {
      data.createdAt = new Date(data.createdAt);
    }
    
    if (data.updatedAt && typeof data.updatedAt === 'string') {
      data.updatedAt = new Date(data.updatedAt);
    }
    
    return new ProviderProfileModel(data);
  }

  /**
   * Adds a service type to the provider's offered services
   * 
   * @param serviceType - The service type to add
   * @returns True if the service type was added, false if it already exists
   * @throws Error if the service type is invalid
   */
  addServiceType(serviceType: ServiceType): boolean {
    // Validate the service type
    if (!Object.values(ServiceType).includes(serviceType)) {
      throw new Error(`Invalid service type: ${serviceType}`);
    }
    
    // Check if the service type already exists
    if (this.serviceTypes.includes(serviceType)) {
      return false;
    }
    
    // Add the service type
    this.serviceTypes.push(serviceType);
    this.updatedAt = new Date();
    return true;
  }

  /**
   * Removes a service type from the provider's offered services
   * 
   * @param serviceType - The service type to remove
   * @returns True if the service type was removed, false if not found
   */
  removeServiceType(serviceType: ServiceType): boolean {
    const index = this.serviceTypes.indexOf(serviceType);
    
    if (index === -1) {
      return false;
    }
    
    this.serviceTypes.splice(index, 1);
    this.updatedAt = new Date();
    return true;
  }

  /**
   * Adds a specialization to the provider's profile
   * 
   * @param specialization - The specialization to add
   * @returns True if the specialization was added, false if it already exists
   * @throws Error if the specialization is invalid
   */
  addSpecialization(specialization: string): boolean {
    if (!specialization || typeof specialization !== 'string' || specialization.trim() === '') {
      throw new Error('Specialization must be a non-empty string');
    }
    
    const trimmedSpecialization = specialization.trim();
    
    // Check if the specialization already exists
    if (this.specializations.includes(trimmedSpecialization)) {
      return false;
    }
    
    // Add the specialization
    this.specializations.push(trimmedSpecialization);
    this.updatedAt = new Date();
    return true;
  }

  /**
   * Removes a specialization from the provider's profile
   * 
   * @param specialization - The specialization to remove
   * @returns True if the specialization was removed, false if not found
   */
  removeSpecialization(specialization: string): boolean {
    const index = this.specializations.indexOf(specialization);
    
    if (index === -1) {
      return false;
    }
    
    this.specializations.splice(index, 1);
    this.updatedAt = new Date();
    return true;
  }

  /**
   * Adds an insurance provider to the list of accepted insurance
   * 
   * @param insurance - The insurance provider to add
   * @returns True if the insurance was added, false if it already exists
   * @throws Error if the insurance is invalid
   */
  addInsurance(insurance: string): boolean {
    if (!insurance || typeof insurance !== 'string' || insurance.trim() === '') {
      throw new Error('Insurance must be a non-empty string');
    }
    
    const trimmedInsurance = insurance.trim();
    
    // Check if the insurance already exists
    if (this.insuranceAccepted.includes(trimmedInsurance)) {
      return false;
    }
    
    // Add the insurance
    this.insuranceAccepted.push(trimmedInsurance);
    this.updatedAt = new Date();
    return true;
  }

  /**
   * Removes an insurance provider from the list of accepted insurance
   * 
   * @param insurance - The insurance provider to remove
   * @returns True if the insurance was removed, false if not found
   */
  removeInsurance(insurance: string): boolean {
    const index = this.insuranceAccepted.indexOf(insurance);
    
    if (index === -1) {
      return false;
    }
    
    this.insuranceAccepted.splice(index, 1);
    this.updatedAt = new Date();
    return true;
  }

  /**
   * Updates the provider's average rating and review count
   * 
   * @param newRating - The new average rating (0-5)
   * @param newReviewCount - The new review count
   * @throws Error if the rating or review count is invalid
   */
  updateRating(newRating: number, newReviewCount: number): void {
    if (newRating < 0 || newRating > 5) {
      throw new Error('Rating must be between 0 and 5');
    }
    
    if (newReviewCount < 0 || !Number.isInteger(newReviewCount)) {
      throw new Error('Review count must be a non-negative integer');
    }
    
    this.averageRating = newRating;
    this.reviewCount = newReviewCount;
    this.updatedAt = new Date();
  }

  /**
   * Checks if the provider's license is valid (not expired)
   * 
   * @returns True if the license is valid or not required, false if expired
   */
  isLicenseValid(): boolean {
    // If no license number is provided, assume it's not required
    if (!this.licenseNumber) {
      return true;
    }
    
    // If no expiration date is provided, assume it doesn't expire
    if (!this.licenseExpiration) {
      return true;
    }
    
    // Check if the license is expired
    return this.licenseExpiration > new Date();
  }

  /**
   * Gets the provider's service types as an array of strings
   * 
   * @returns Array of service type strings
   */
  getServiceTypesAsStrings(): string[] {
    return this.serviceTypes.map(type => type.toString());
  }

  /**
   * Checks if the provider offers a specific service type
   * 
   * @param serviceType - The service type to check
   * @returns True if the provider offers the service type, false otherwise
   */
  supportsServiceType(serviceType: ServiceType): boolean {
    return this.serviceTypes.includes(serviceType);
  }

  /**
   * Checks if the provider accepts a specific insurance provider
   * 
   * @param insurance - The insurance provider to check
   * @returns True if the provider accepts the insurance, false otherwise
   */
  acceptsInsurance(insurance: string): boolean {
    return this.insuranceAccepted.includes(insurance);
  }
}