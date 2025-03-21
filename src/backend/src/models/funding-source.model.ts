import { FundingSource } from '../types/services-plan.types';

/**
 * Enum representing the possible types of funding sources for services.
 */
export enum FundingSourceType {
  INSURANCE = 'insurance',
  MEDICAID = 'medicaid',
  MEDICARE = 'medicare',
  PRIVATE_PAY = 'private_pay',
  GRANT = 'grant',
  OTHER = 'other'
}

/**
 * Enum representing the possible verification statuses for funding sources.
 */
export enum FundingSourceVerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  DENIED = 'denied'
}

/**
 * Model class that represents a funding source for services in a services plan.
 * Maps to the FundingSource table in the database and provides methods for
 * creating, retrieving, and manipulating funding source data.
 */
export class FundingSourceModel implements FundingSource {
  id: string;
  servicesPlanId: string;
  name: string;
  type: string;
  coveragePercentage: number;
  coverageAmount: number;
  verificationStatus: string;
  details: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;

  /**
   * Creates a new FundingSourceModel instance.
   * 
   * @param data The funding source data
   */
  constructor(data: FundingSource) {
    this.id = data.id;
    this.servicesPlanId = data.servicesPlanId;
    this.name = data.name;
    this.type = data.type;
    this.coveragePercentage = data.coveragePercentage;
    this.coverageAmount = data.coverageAmount;
    this.verificationStatus = data.verificationStatus || FundingSourceVerificationStatus.PENDING;
    this.details = data.details || null;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  /**
   * Converts the model to a plain JavaScript object.
   * 
   * @returns A plain JavaScript object representing the funding source
   */
  toJSON(): FundingSource {
    return {
      id: this.id,
      servicesPlanId: this.servicesPlanId,
      name: this.name,
      type: this.type,
      coveragePercentage: this.coveragePercentage,
      coverageAmount: this.coverageAmount,
      verificationStatus: this.verificationStatus,
      details: this.details,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Calculates the coverage amount based on a total cost and the coverage percentage.
   * If coverageAmount is already set, returns that value; otherwise calculates based on percentage.
   * 
   * @param totalCost The total cost to calculate coverage for
   * @returns The calculated coverage amount
   */
  calculateCoverage(totalCost: number): number {
    // If coverageAmount is explicitly set, use that value
    if (this.coverageAmount > 0) {
      return this.coverageAmount;
    }
    
    // Ensure totalCost is valid
    if (totalCost <= 0) {
      return 0;
    }
    
    // Calculate coverage based on percentage
    return totalCost * (this.coveragePercentage / 100);
  }

  /**
   * Checks if the funding source has been verified.
   * 
   * @returns True if the funding source is verified, false otherwise
   */
  isVerified(): boolean {
    return this.verificationStatus === FundingSourceVerificationStatus.VERIFIED;
  }

  /**
   * Checks if the funding source verification is pending.
   * 
   * @returns True if the funding source verification is pending, false otherwise
   */
  isPending(): boolean {
    return this.verificationStatus === FundingSourceVerificationStatus.PENDING;
  }

  /**
   * Checks if the funding source verification has been denied.
   * 
   * @returns True if the funding source verification has been denied, false otherwise
   */
  isDenied(): boolean {
    return this.verificationStatus === FundingSourceVerificationStatus.DENIED;
  }

  /**
   * Updates the verification status of the funding source.
   * Validates that the status is one of the allowed values.
   * Updates the updatedAt timestamp to the current date.
   * 
   * @param status The new verification status
   * @throws Error if the status is not valid
   */
  updateVerificationStatus(status: string): void {
    const validStatuses = Object.values(FundingSourceVerificationStatus);
    
    // Validate the status
    if (!validStatuses.includes(status as FundingSourceVerificationStatus)) {
      throw new Error(`Invalid verification status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
    }
    
    // Skip update if status hasn't changed
    if (this.verificationStatus === status) {
      return;
    }
    
    this.verificationStatus = status;
    this.updatedAt = new Date();
  }
}