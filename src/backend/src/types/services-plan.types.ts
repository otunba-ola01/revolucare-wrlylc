import { PlanStatus } from '../constants/plan-statuses';
import { ServiceType } from '../constants/service-types';

/**
 * Interface representing a complete services plan that outlines
 * specific services to be provided to a client.
 */
export interface ServicesPlan {
  id: string;
  clientId: string;
  carePlanId: string | null; // Optional link to a care plan
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
}

/**
 * Interface representing a needs assessment that identifies
 * client needs for service planning.
 */
export interface NeedsAssessment {
  id: string;
  clientId: string;
  createdById: string;
  assessmentData: Record<string, any>; // Structured assessment data
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface representing an individual service included 
 * in a services plan.
 */
export interface ServiceItem {
  id: string;
  servicesPlanId: string;
  serviceType: ServiceType;
  providerId: string | null; // May be null if provider not yet assigned
  description: string;
  frequency: string; // e.g., "3x weekly", "daily", etc.
  duration: string; // e.g., "8 weeks", "ongoing", etc.
  estimatedCost: number;
  status: string; // e.g., "pending", "scheduled", "active", "completed", "discontinued"
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface representing a funding source for services in a services plan.
 */
export interface FundingSource {
  id: string;
  servicesPlanId: string;
  name: string;
  type: string; // e.g., "insurance", "medicaid", "medicare", "private_pay", "grant", "other"
  coveragePercentage: number;
  coverageAmount: number;
  verificationStatus: string; // e.g., "pending", "verified", "denied"
  details: Record<string, any> | null; // Additional details about the funding source
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Data transfer object for creating a new needs assessment.
 */
export interface CreateNeedsAssessmentDTO {
  clientId: string;
  assessmentData: Record<string, any>;
  notes: string;
}

/**
 * Data transfer object for creating a new services plan.
 */
export interface CreateServicesPlanDTO {
  clientId: string;
  carePlanId: string | null;
  title: string;
  description: string;
  needsAssessmentId: string;
  serviceItems: CreateServiceItemDTO[];
  fundingSources: CreateFundingSourceDTO[];
}

/**
 * Data transfer object for creating a new service item.
 */
export interface CreateServiceItemDTO {
  serviceType: ServiceType;
  providerId: string | null;
  description: string;
  frequency: string;
  duration: string;
  estimatedCost: number;
}

/**
 * Data transfer object for creating a new funding source.
 */
export interface CreateFundingSourceDTO {
  name: string;
  type: string;
  coveragePercentage: number;
  coverageAmount: number;
  details: Record<string, any> | null;
}

/**
 * Data transfer object for updating an existing services plan.
 */
export interface UpdateServicesPlanDTO {
  title: string;
  description: string;
  status: PlanStatus;
  serviceItems: UpdateServiceItemDTO[];
  fundingSources: UpdateFundingSourceDTO[];
}

/**
 * Data transfer object for updating an existing service item.
 */
export interface UpdateServiceItemDTO {
  id: string;
  serviceType: ServiceType;
  providerId: string | null;
  description: string;
  frequency: string;
  duration: string;
  estimatedCost: number;
  status: string;
}

/**
 * Data transfer object for updating an existing funding source.
 */
export interface UpdateFundingSourceDTO {
  id: string;
  name: string;
  type: string;
  coveragePercentage: number;
  coverageAmount: number;
  verificationStatus: string;
  details: Record<string, any> | null;
}

/**
 * Data transfer object for approving a services plan.
 */
export interface ApproveServicesPlanDTO {
  notes: string;
}

/**
 * Data transfer object for generating AI-powered services plan options.
 */
export interface GenerateServicesPlanDTO {
  clientId: string;
  carePlanId: string | null;
  needsAssessmentId: string;
  preferences: Record<string, any>; // Client preferences for service options
}

/**
 * Response structure for services plan generation with multiple options.
 */
export interface ServicesPlanOptionsResponse {
  options: ServicesPlan[];
  confidenceScores: Record<string, number>; // Maps plan ID to confidence score
  analysisResults: Record<string, any>; // Additional analysis information
}

/**
 * Response structure for cost estimation of a services plan.
 */
export interface CostEstimateResponse {
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
 * Response structure for funding sources identification.
 */
export interface FundingSourcesResponse {
  availableSources: {
    id: string;
    name: string;
    type: string;
    eligibility: boolean;
    estimatedCoverage: number;
    requirements: string[];
  }[];
  recommendedSources: {
    id: string;
    name: string;
    type: string;
    estimatedCoverage: number;
    reason: string;
  }[];
  clientInsuranceInfo: Record<string, any>;
}

/**
 * Filter parameters for querying services plans.
 */
export interface ServicesPlanFilterParams {
  clientId?: string;
  status?: PlanStatus;
  createdById?: string;
  approvedById?: string;
  serviceType?: ServiceType;
  providerId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
}