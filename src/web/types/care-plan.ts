import { PlanStatus } from '../../backend/src/constants/plan-statuses';
import { User } from './user';

/**
 * Enum for care plan goal statuses
 * Represents the possible states a goal can be in during its lifecycle
 */
export enum GoalStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  ACHIEVED = 'achieved',
  DISCONTINUED = 'discontinued'
}

/**
 * Enum for care plan intervention statuses
 * Represents the possible states an intervention can be in during implementation
 */
export enum InterventionStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  DISCONTINUED = 'discontinued'
}

/**
 * Interface for a care plan
 * Core data structure representing a personalized care plan for a client
 */
export interface CarePlan {
  id: string;
  clientId: string;
  createdById: string;
  title: string;
  description: string;
  status: PlanStatus;
  confidenceScore: number;
  version: number;
  previousVersionId: string | null;
  approvedById: string | null;
  approvedAt: string | null;
  approvalNotes: string | null;
  goals: CarePlanGoal[];
  interventions: CarePlanIntervention[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface for a care plan goal
 * Represents a specific goal to be achieved as part of the care plan
 */
export interface CarePlanGoal {
  id: string;
  carePlanId: string;
  description: string;
  targetDate: string | null;
  status: GoalStatus;
  measures: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface for a care plan intervention
 * Represents a specific action or treatment to be performed as part of the care plan
 */
export interface CarePlanIntervention {
  id: string;
  carePlanId: string;
  description: string;
  frequency: string;
  duration: string;
  responsibleParty: string;
  status: InterventionStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface for a care plan version
 * Used for tracking history and changes to care plans over time
 */
export interface CarePlanVersion {
  id: string;
  carePlanId: string;
  version: number;
  changes: Record<string, any>;
  createdById: string;
  createdAt: string;
}

/**
 * Interface for an AI-generated care plan option
 * Represents a suggested care plan created by the AI system
 */
export interface CarePlanOption {
  title: string;
  description: string;
  confidenceScore: number;
  goals: {
    description: string;
    targetDate?: string;
    measures: string[];
  }[];
  interventions: {
    description: string;
    frequency: string;
    duration: string;
    responsibleParty: string;
  }[];
  expectedOutcomes: string[];
}

/**
 * Interface for AI-generated care plan options response
 * Structure returned when requesting AI-generated care plan suggestions
 */
export interface CarePlanOptionsResponse {
  clientId: string;
  options: CarePlanOption[];
  analysisMetadata: Record<string, any>;
}

/**
 * Interface for care plan form data
 * Used when creating or updating a care plan through forms
 */
export interface CarePlanFormData {
  clientId: string;
  title: string;
  description: string;
  goals: {
    id?: string;
    description: string;
    targetDate?: string;
    status?: GoalStatus;
    measures: string[];
  }[];
  interventions: {
    id?: string;
    description: string;
    frequency: string;
    duration: string;
    responsibleParty: string;
    status?: InterventionStatus;
  }[];
  status: PlanStatus;
}

/**
 * Interface for care plan approval data
 * Used when submitting approval decisions for care plans
 */
export interface CarePlanApprovalData {
  approvalNotes: string;
  status: PlanStatus.APPROVED | PlanStatus.REJECTED;
}

/**
 * Interface for care plan generation parameters
 * Parameters used when requesting AI-generated care plans
 */
export interface CarePlanGenerationParams {
  clientId: string;
  documentIds: string[];
  additionalContext: Record<string, any>;
  includeOptions: boolean;
  optionsCount: number;
}

/**
 * Interface for care plan filtering parameters
 * Used when searching or filtering care plans in listings
 */
export interface CarePlanFilterParams {
  clientId: string;
  status: PlanStatus;
  createdById: string;
  approvedById: string;
  fromDate: string;
  toDate: string;
  search: string;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: string;
}

/**
 * Interface for care plan with client info
 * Enhanced care plan data with associated client and creator information
 * Used in list views and summaries
 */
export interface CarePlanWithClientInfo {
  id: string;
  title: string;
  description: string;
  status: PlanStatus;
  confidenceScore: number;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  approvedBy: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  goalsCount: number;
  interventionsCount: number;
}

/**
 * Interface for care plan version history data
 * Used to display the change history of a care plan
 */
export interface CarePlanHistoryData {
  carePlanId: string;
  currentVersion: number;
  versions: CarePlanVersion[];
}

/**
 * Interface for paginated care plans response
 * Structure returned when requesting paginated lists of care plans
 */
export interface PaginatedCarePlansResponse {
  data: CarePlanWithClientInfo[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}