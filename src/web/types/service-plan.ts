import { PlanStatus, ServiceType } from '../config/constants';

/**
 * Status options for service items within a service plan
 */
export enum ServiceItemStatus {
  PENDING = 'pending',
  SCHEDULED = 'scheduled',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  DISCONTINUED = 'discontinued'
}

/**
 * Types of funding sources for services
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
 * Verification status for funding sources
 */
export enum VerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  DENIED = 'denied'
}

/**
 * Represents an individual service included in a service plan
 */
export interface ServiceItem {
  id: string;
  serviceType: ServiceType;
  providerId: string | null;
  providerName: string | null;
  description: string;
  frequency: string;
  duration: string;
  estimatedCost: number;
  status: ServiceItemStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Represents a funding source for services in a service plan
 */
export interface FundingSource {
  id: string;
  name: string;
  type: FundingSourceType;
  coveragePercentage: number;
  coverageAmount: number;
  verificationStatus: VerificationStatus;
  details: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Represents a comprehensive service plan that outlines specific 
 * services to be provided to a client
 */
export interface ServicesPlan {
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
  services: ServiceItem[];
  fundingSources: FundingSource[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Extended service plan interface that includes client information
 * for display in lists
 */
export interface ServicesPlanWithClientInfo {
  id: string;
  clientId: string;
  clientName: string;
  title: string;
  status: PlanStatus;
  estimatedCost: number;
  serviceCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Represents a needs assessment that identifies client needs
 * for service planning
 */
export interface NeedsAssessment {
  id: string;
  clientId: string;
  createdById: string;
  assessmentData: Record<string, any>;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Form data for creating or updating a service item
 */
export interface ServiceItemFormData {
  id?: string;
  serviceType: ServiceType;
  providerId: string | null;
  description: string;
  frequency: string;
  duration: string;
  estimatedCost: number;
  status: ServiceItemStatus;
}

/**
 * Form data for creating or updating a funding source
 */
export interface FundingSourceFormData {
  id?: string;
  name: string;
  type: FundingSourceType;
  coveragePercentage: number;
  coverageAmount: number;
  verificationStatus: VerificationStatus;
  details: Record<string, any> | null;
}

/**
 * Form data for creating or updating a service plan
 */
export interface ServicesPlanFormData {
  clientId: string;
  carePlanId: string | null;
  title: string;
  description: string;
  needsAssessmentId: string;
  status: PlanStatus;
  services: ServiceItemFormData[];
  fundingSources: FundingSourceFormData[];
}

/**
 * Form data for creating or updating a needs assessment
 */
export interface NeedsAssessmentFormData {
  clientId: string;
  assessmentData: Record<string, any>;
  notes: string;
}

/**
 * Represents an AI-generated service plan option with confidence score
 * and analysis
 */
export interface ServicesPlanOption {
  plan: ServicesPlan;
  confidenceScore: number;
  analysisResults: Record<string, any>;
  expectedOutcomes: string[];
}

/**
 * Parameters for generating AI-powered service plan options
 */
export interface ServicesPlanGenerationParams {
  clientId: string;
  needsAssessmentId: string;
  carePlanId: string | null;
  additionalContext: Record<string, any>;
  optionsCount: number;
}

/**
 * Data for approving a service plan
 */
export interface ServicesPlanApprovalData {
  approvalNotes: string;
}

/**
 * Parameters for filtering and paginating service plans
 */
export interface ServicesPlanFilterParams {
  clientId?: string;
  status?: PlanStatus;
  createdById?: string;
  approvedById?: string;
  serviceType?: ServiceType;
  providerId?: string;
  fromDate?: Date;
  toDate?: Date;
  search?: string;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

/**
 * Structure for cost estimation of a service plan
 */
export interface CostEstimate {
  totalCost: number;
  coveredAmount: number;
  outOfPocketCost: number;
  serviceBreakdown: {
    serviceType: string;
    cost: number;
    covered: number;
    outOfPocket: number;
  }[];
  fundingBreakdown: {
    source: string;
    type: string;
    amount: number;
  }[];
}

/**
 * Information about a potential funding source for a client and service plan
 */
export interface FundingSourceInfo {
  id: string;
  name: string;
  type: FundingSourceType;
  eligibility: boolean;
  estimatedCoverage: number;
  requirements: string[];
  reason: string;
}