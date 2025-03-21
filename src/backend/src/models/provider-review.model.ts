import { ProviderReview } from '../types/provider.types';
import { ServiceType } from '../constants/service-types';
import { errorFactory } from '../utils/error-handler';

/**
 * Model class representing a provider review in the system with methods for validation and data transformation
 */
export class ProviderReviewModel {
  id: string;
  providerId: string;
  clientId: string;
  rating: number;
  comment: string | null;
  serviceType: ServiceType;
  serviceDate: Date | null;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;

  /**
   * Creates a new ProviderReviewModel instance with the provided review data
   * 
   * @param reviewData - Partial provider review data
   */
  constructor(reviewData: Partial<ProviderReview> = {}) {
    this.id = reviewData.id || '';
    this.providerId = reviewData.providerId || '';
    this.clientId = reviewData.clientId || '';
    this.rating = reviewData.rating !== undefined ? reviewData.rating : 0;
    this.comment = reviewData.comment || null;
    this.serviceType = reviewData.serviceType || ServiceType.INITIAL_ASSESSMENT;
    
    // Convert string dates to Date objects if needed
    if (reviewData.serviceDate) {
      this.serviceDate = reviewData.serviceDate instanceof Date 
        ? reviewData.serviceDate 
        : new Date(reviewData.serviceDate);
    } else {
      this.serviceDate = null;
    }
    
    this.isVerified = reviewData.isVerified !== undefined ? reviewData.isVerified : false;
    
    this.createdAt = reviewData.createdAt instanceof Date 
      ? reviewData.createdAt 
      : reviewData.createdAt 
        ? new Date(reviewData.createdAt) 
        : new Date();
        
    this.updatedAt = reviewData.updatedAt instanceof Date 
      ? reviewData.updatedAt 
      : reviewData.updatedAt 
        ? new Date(reviewData.updatedAt) 
        : new Date();
  }

  /**
   * Validates the provider review data to ensure it meets all requirements
   * 
   * @returns True if the provider review data is valid, otherwise throws an error
   */
  validate(): boolean {
    // Check required fields
    if (!this.providerId) {
      throw errorFactory.createValidationError('Provider ID is required for a review');
    }

    if (!this.clientId) {
      throw errorFactory.createValidationError('Client ID is required for a review');
    }

    if (this.rating < 1 || this.rating > 5) {
      throw errorFactory.createValidationError('Rating must be between 1 and 5');
    }

    if (!this.serviceType) {
      throw errorFactory.createValidationError('Service type is required for a review');
    }

    // Validate serviceDate if provided
    if (this.serviceDate) {
      const isValidDate = this.serviceDate instanceof Date && !isNaN(this.serviceDate.getTime());
      if (!isValidDate) {
        throw errorFactory.createValidationError('Invalid service date');
      }

      // Service date should not be in the future
      const now = new Date();
      if (this.serviceDate > now) {
        throw errorFactory.createValidationError('Service date cannot be in the future');
      }
    }

    return true;
  }

  /**
   * Converts the provider review model to a plain JSON object
   * 
   * @returns Provider review object ready for serialization
   */
  toJSON(): ProviderReview {
    return {
      id: this.id,
      providerId: this.providerId,
      clientId: this.clientId,
      rating: this.rating,
      comment: this.comment || '',
      serviceType: this.serviceType,
      serviceDate: this.serviceDate || new Date(),
      isVerified: this.isVerified,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Creates a provider review model from a plain JSON object
   * 
   * @param json - JSON object to convert
   * @returns A new provider review model instance
   */
  static fromJSON(json: object): ProviderReviewModel {
    const data = json as Partial<ProviderReview>;
    
    // Convert date strings to Date objects
    if (typeof data.serviceDate === 'string') {
      data.serviceDate = new Date(data.serviceDate);
    }
    
    if (typeof data.createdAt === 'string') {
      data.createdAt = new Date(data.createdAt);
    }
    
    if (typeof data.updatedAt === 'string') {
      data.updatedAt = new Date(data.updatedAt);
    }
    
    return new ProviderReviewModel(data);
  }

  /**
   * Checks if the review is valid based on business rules
   * 
   * @returns Returns true if the review is valid, false otherwise
   */
  isValid(): boolean {
    try {
      // Run validation
      return this.validate();
    } catch (error) {
      return false;
    }
  }

  /**
   * Marks the review as verified after validation
   */
  verify(): void {
    this.isVerified = true;
    this.updatedAt = new Date();
  }

  /**
   * Updates the rating value of the review
   * 
   * @param newRating - New rating value
   * @returns Returns true if the rating was updated, false if invalid
   */
  updateRating(newRating: number): boolean {
    if (newRating < 1 || newRating > 5) {
      return false;
    }
    
    this.rating = newRating;
    this.updatedAt = new Date();
    return true;
  }

  /**
   * Updates the comment text of the review
   * 
   * @param newComment - New comment text
   */
  updateComment(newComment: string): void {
    this.comment = newComment;
    this.updatedAt = new Date();
  }

  /**
   * Checks if the review belongs to a specific client
   * 
   * @param clientId - Client ID to check
   * @returns Returns true if the review belongs to the client, false otherwise
   */
  belongsToClient(clientId: string): boolean {
    return this.clientId === clientId;
  }

  /**
   * Checks if the review is for a specific provider
   * 
   * @param providerId - Provider ID to check
   * @returns Returns true if the review is for the provider, false otherwise
   */
  belongsToProvider(providerId: string): boolean {
    return this.providerId === providerId;
  }
}