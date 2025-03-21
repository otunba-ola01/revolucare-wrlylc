import { PlanStatus } from '../constants/plan-statuses';
import { ServiceType } from '../constants/service-types';
import { ServiceItem, FundingSource } from '../types/services-plan.types';

/**
 * Model class representing a services plan in the Revolucare platform.
 * 
 * A services plan outlines specific services to be provided to a client,
 * including service items and funding sources. It provides methods for
 * creating, retrieving, and manipulating service plan data.
 */
export class ServicesPlan {
  id: string;
  clientId: string;
  carePlanId: string | null;
  createdById: string;
  title: string;
  description: string;
  needsAssessmentId: string;
  status: PlanStatus;
  estimatedCost: number;
  approvedById: string | null;
  approvedAt: Date | null;
  serviceItems: ServiceItem[];
  fundingSources: FundingSource[];
  createdAt: Date;
  updatedAt: Date;

  /**
   * Creates a new ServicesPlan instance.
   * 
   * @param data - The data to initialize the ServicesPlan with
   */
  constructor(data: Partial<ServicesPlan>) {
    this.id = data.id || '';
    this.clientId = data.clientId || '';
    this.carePlanId = data.carePlanId || null;
    this.createdById = data.createdById || '';
    this.title = data.title || '';
    this.description = data.description || '';
    this.needsAssessmentId = data.needsAssessmentId || '';
    this.status = data.status || PlanStatus.DRAFT;
    this.estimatedCost = data.estimatedCost || 0;
    this.approvedById = data.approvedById || null;
    this.approvedAt = data.approvedAt ? new Date(data.approvedAt) : null;
    this.serviceItems = data.serviceItems || [];
    this.fundingSources = data.fundingSources || [];
    this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
    this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
  }

  /**
   * Converts the ServicesPlan instance to a plain JSON object.
   * 
   * @returns A plain JavaScript object representation of the ServicesPlan
   */
  toJSON(): Record<string, any> {
    return {
      id: this.id,
      clientId: this.clientId,
      carePlanId: this.carePlanId,
      createdById: this.createdById,
      title: this.title,
      description: this.description,
      needsAssessmentId: this.needsAssessmentId,
      status: this.status,
      estimatedCost: this.estimatedCost,
      approvedById: this.approvedById,
      approvedAt: this.approvedAt ? this.approvedAt.toISOString() : null,
      serviceItems: this.serviceItems,
      fundingSources: this.fundingSources,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString()
    };
  }

  /**
   * Checks if the services plan is approved.
   * 
   * @returns True if the plan is approved, false otherwise
   */
  isApproved(): boolean {
    return this.status === PlanStatus.APPROVED;
  }

  /**
   * Checks if the services plan is active.
   * 
   * @returns True if the plan is active, false otherwise
   */
  isActive(): boolean {
    return this.status === PlanStatus.ACTIVE;
  }

  /**
   * Checks if the services plan is completed.
   * 
   * @returns True if the plan is completed, false otherwise
   */
  isCompleted(): boolean {
    return this.status === PlanStatus.COMPLETED;
  }

  /**
   * Checks if the services plan can be approved.
   * 
   * @returns True if the plan can be approved, false otherwise
   */
  canBeApproved(): boolean {
    return this.status === PlanStatus.DRAFT || this.status === PlanStatus.IN_REVIEW;
  }

  /**
   * Checks if the services plan can be activated.
   * 
   * @returns True if the plan can be activated, false otherwise
   */
  canBeActivated(): boolean {
    return this.status === PlanStatus.APPROVED;
  }

  /**
   * Calculates the total estimated cost of all service items.
   * 
   * @returns The total estimated cost
   */
  calculateTotalCost(): number {
    return this.serviceItems.reduce((total, item) => total + item.estimatedCost, 0);
  }

  /**
   * Updates the status of the services plan.
   * 
   * @param newStatus - The new status to set
   */
  updateStatus(newStatus: PlanStatus): void {
    // Validate status transition
    if (newStatus === PlanStatus.ACTIVE && !this.canBeActivated()) {
      throw new Error('Cannot activate plan that is not approved');
    }
    
    if (newStatus === PlanStatus.APPROVED && !this.canBeApproved()) {
      throw new Error('Cannot approve plan that is not in draft or review status');
    }

    this.status = newStatus;
    this.updatedAt = new Date();
  }

  /**
   * Approves the services plan.
   * 
   * @param approvedById - ID of the user approving the plan
   * @param notes - Optional approval notes
   */
  approve(approvedById: string, notes: string): void {
    if (!this.canBeApproved()) {
      throw new Error('Cannot approve plan that is not in draft or review status');
    }

    this.status = PlanStatus.APPROVED;
    this.approvedById = approvedById;
    this.approvedAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Activates the services plan.
   */
  activate(): void {
    if (!this.canBeActivated()) {
      throw new Error('Cannot activate plan that is not approved');
    }

    this.status = PlanStatus.ACTIVE;
    this.updatedAt = new Date();
  }

  /**
   * Marks the services plan as completed.
   */
  complete(): void {
    if (!this.isActive()) {
      throw new Error('Cannot complete plan that is not active');
    }

    this.status = PlanStatus.COMPLETED;
    this.updatedAt = new Date();
  }

  /**
   * Adds a service item to the services plan.
   * 
   * @param serviceItem - The service item to add
   */
  addServiceItem(serviceItem: ServiceItem): void {
    this.serviceItems.push(serviceItem);
    this.estimatedCost = this.calculateTotalCost();
    this.updatedAt = new Date();
  }

  /**
   * Removes a service item from the services plan.
   * 
   * @param serviceItemId - ID of the service item to remove
   * @returns True if the item was removed, false if not found
   */
  removeServiceItem(serviceItemId: string): boolean {
    const index = this.serviceItems.findIndex(item => item.id === serviceItemId);
    if (index !== -1) {
      this.serviceItems.splice(index, 1);
      this.estimatedCost = this.calculateTotalCost();
      this.updatedAt = new Date();
      return true;
    }
    return false;
  }

  /**
   * Adds a funding source to the services plan.
   * 
   * @param fundingSource - The funding source to add
   */
  addFundingSource(fundingSource: FundingSource): void {
    this.fundingSources.push(fundingSource);
    this.updatedAt = new Date();
  }

  /**
   * Removes a funding source from the services plan.
   * 
   * @param fundingSourceId - ID of the funding source to remove
   * @returns True if the source was removed, false if not found
   */
  removeFundingSource(fundingSourceId: string): boolean {
    const index = this.fundingSources.findIndex(source => source.id === fundingSourceId);
    if (index !== -1) {
      this.fundingSources.splice(index, 1);
      this.updatedAt = new Date();
      return true;
    }
    return false;
  }

  /**
   * Gets service items of a specific type.
   * 
   * @param serviceType - The service type to filter by
   * @returns Array of service items matching the type
   */
  getServiceItemsByType(serviceType: ServiceType): ServiceItem[] {
    return this.serviceItems.filter(item => item.serviceType === serviceType);
  }

  /**
   * Calculates the total coverage amount from all funding sources.
   * 
   * @returns The total coverage amount
   */
  getTotalCoverageAmount(): number {
    return this.fundingSources.reduce((total, source) => total + source.coverageAmount, 0);
  }

  /**
   * Calculates the out-of-pocket cost after funding source coverage.
   * 
   * @returns The out-of-pocket cost
   */
  getOutOfPocketCost(): number {
    const totalCost = this.calculateTotalCost();
    const totalCoverage = this.getTotalCoverageAmount();
    return Math.max(0, totalCost - totalCoverage);
  }
}

/**
 * Model class representing a service item within a services plan.
 * 
 * Service items define specific services to be provided, their frequency,
 * duration, and estimated cost.
 */
export class ServiceItemModel {
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
   * Creates a new ServiceItemModel instance.
   * 
   * @param data - The data to initialize the ServiceItemModel with
   */
  constructor(data: Partial<ServiceItemModel>) {
    this.id = data.id || '';
    this.servicesPlanId = data.servicesPlanId || '';
    this.serviceType = data.serviceType || ServiceType.PHYSICAL_THERAPY;
    this.providerId = data.providerId || null;
    this.description = data.description || '';
    this.frequency = data.frequency || '';
    this.duration = data.duration || '';
    this.estimatedCost = data.estimatedCost || 0;
    this.status = data.status || 'pending';
    this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
    this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
  }

  /**
   * Converts the ServiceItemModel instance to a plain JSON object.
   * 
   * @returns A plain JavaScript object representation of the ServiceItemModel
   */
  toJSON(): Record<string, any> {
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
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString()
    };
  }

  /**
   * Updates the status of the service item.
   * 
   * @param newStatus - The new status to set
   */
  updateStatus(newStatus: string): void {
    this.status = newStatus;
    this.updatedAt = new Date();
  }
}

/**
 * Model class representing a funding source for a services plan.
 * 
 * Funding sources define how services will be paid for, including
 * insurance, government programs, or private payment.
 */
export class FundingSourceModel {
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
   * @param data - The data to initialize the FundingSourceModel with
   */
  constructor(data: Partial<FundingSourceModel>) {
    this.id = data.id || '';
    this.servicesPlanId = data.servicesPlanId || '';
    this.name = data.name || '';
    this.type = data.type || '';
    this.coveragePercentage = data.coveragePercentage || 0;
    this.coverageAmount = data.coverageAmount || 0;
    this.verificationStatus = data.verificationStatus || 'pending';
    this.details = data.details || null;
    this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
    this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
  }

  /**
   * Converts the FundingSourceModel instance to a plain JSON object.
   * 
   * @returns A plain JavaScript object representation of the FundingSourceModel
   */
  toJSON(): Record<string, any> {
    return {
      id: this.id,
      servicesPlanId: this.servicesPlanId,
      name: this.name,
      type: this.type,
      coveragePercentage: this.coveragePercentage,
      coverageAmount: this.coverageAmount,
      verificationStatus: this.verificationStatus,
      details: this.details,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString()
    };
  }

  /**
   * Updates the verification status of the funding source.
   * 
   * @param newStatus - The new status to set
   */
  updateVerificationStatus(newStatus: string): void {
    this.verificationStatus = newStatus;
    this.updatedAt = new Date();
  }

  /**
   * Calculates the coverage amount based on the total cost and coverage percentage.
   * 
   * @param totalCost - The total cost to calculate coverage for
   * @returns The calculated coverage amount
   */
  calculateCoverageAmount(totalCost: number): number {
    return totalCost * (this.coveragePercentage / 100);
  }
}