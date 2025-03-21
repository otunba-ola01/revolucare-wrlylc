import { PlanStatus } from '../constants/plan-statuses';

/**
 * Enum representing the possible statuses for care plan goals.
 * 
 * These statuses track the progress of individual goals within a care plan.
 */
export enum GoalStatus {
  /**
   * Goal has been defined but work has not yet started.
   */
  PENDING = 'pending',
  
  /**
   * Work toward achieving the goal is currently underway.
   */
  IN_PROGRESS = 'in_progress',
  
  /**
   * Goal has been successfully completed.
   */
  ACHIEVED = 'achieved',
  
  /**
   * Goal was abandoned or is no longer relevant.
   */
  DISCONTINUED = 'discontinued'
}

/**
 * Enum representing the possible statuses for care plan interventions.
 * 
 * These statuses track the implementation status of interventions within a care plan.
 */
export enum InterventionStatus {
  /**
   * Intervention has been defined but implementation has not yet started.
   */
  PENDING = 'pending',
  
  /**
   * Intervention is currently being implemented.
   */
  ACTIVE = 'active',
  
  /**
   * Intervention has been successfully completed.
   */
  COMPLETED = 'completed',
  
  /**
   * Intervention was abandoned or is no longer relevant.
   */
  DISCONTINUED = 'discontinued'
}

/**
 * Interface representing a care plan within the Revolucare platform.
 * 
 * A care plan is a comprehensive document that outlines the specific care needs,
 * goals, and interventions for an individual client.
 */
export interface CarePlan {
  /**
   * Unique identifier for the care plan.
   */
  id: string;
  
  /**
   * Identifier of the client for whom the care plan is created.
   */
  clientId: string;
  
  /**
   * Identifier of the user (typically a case manager) who created the care plan.
   */
  createdById: string;
  
  /**
   * Title or name of the care plan.
   */
  title: string;
  
  /**
   * Detailed description of the care plan's purpose and approach.
   */
  description: string;
  
  /**
   * Current status of the care plan in its lifecycle.
   */
  status: PlanStatus;
  
  /**
   * AI-generated confidence score for this care plan (0-100).
   * Higher scores indicate greater confidence in the plan's appropriateness.
   */
  confidenceScore: number;
  
  /**
   * Version number of the care plan, incremented with each major revision.
   */
  version: number;
  
  /**
   * Identifier of the previous version of this care plan, if any.
   */
  previousVersionId: string | null;
  
  /**
   * Identifier of the user who approved the care plan, if approved.
   */
  approvedById: string | null;
  
  /**
   * Date and time when the care plan was approved.
   */
  approvedAt: Date | null;
  
  /**
   * Notes provided during the approval process.
   */
  approvalNotes: string | null;
  
  /**
   * Array of goals defined within this care plan.
   */
  goals: CarePlanGoal[];
  
  /**
   * Array of interventions defined within this care plan.
   */
  interventions: CarePlanIntervention[];
  
  /**
   * Date and time when the care plan was created.
   */
  createdAt: Date;
  
  /**
   * Date and time when the care plan was last updated.
   */
  updatedAt: Date;
}

/**
 * Interface representing a goal within a care plan.
 * 
 * Goals define the specific objectives that the care plan aims to achieve
 * for the client.
 */
export interface CarePlanGoal {
  /**
   * Unique identifier for the goal.
   */
  id: string;
  
  /**
   * Identifier of the care plan this goal belongs to.
   */
  carePlanId: string;
  
  /**
   * Detailed description of the goal.
   */
  description: string;
  
  /**
   * Target date by which the goal should be achieved, if applicable.
   */
  targetDate: Date | null;
  
  /**
   * Current status of progress toward achieving the goal.
   */
  status: GoalStatus;
  
  /**
   * Array of specific measurable indicators to track progress toward the goal.
   */
  measures: string[];
  
  /**
   * Date and time when the goal was created.
   */
  createdAt: Date;
  
  /**
   * Date and time when the goal was last updated.
   */
  updatedAt: Date;
}

/**
 * Interface representing an intervention within a care plan.
 * 
 * Interventions are specific actions, services, or treatments that will be
 * implemented to help achieve the care plan's goals.
 */
export interface CarePlanIntervention {
  /**
   * Unique identifier for the intervention.
   */
  id: string;
  
  /**
   * Identifier of the care plan this intervention belongs to.
   */
  carePlanId: string;
  
  /**
   * Detailed description of the intervention.
   */
  description: string;
  
  /**
   * How often the intervention should be performed (e.g., "daily", "3x weekly").
   */
  frequency: string;
  
  /**
   * How long the intervention should continue (e.g., "4 weeks", "ongoing").
   */
  duration: string;
  
  /**
   * Person or role responsible for implementing the intervention.
   */
  responsibleParty: string;
  
  /**
   * Current status of the intervention implementation.
   */
  status: InterventionStatus;
  
  /**
   * Date and time when the intervention was created.
   */
  createdAt: Date;
  
  /**
   * Date and time when the intervention was last updated.
   */
  updatedAt: Date;
}

/**
 * Interface representing a historical version of a care plan.
 * 
 * This is used to track changes to care plans over time and maintain
 * a complete version history.
 */
export interface CarePlanVersion {
  /**
   * Unique identifier for the version record.
   */
  id: string;
  
  /**
   * Identifier of the care plan this version relates to.
   */
  carePlanId: string;
  
  /**
   * Sequential version number.
   */
  version: number;
  
  /**
   * Record of changes made in this version compared to the previous version.
   */
  changes: Record<string, any>;
  
  /**
   * Identifier of the user who created this version.
   */
  createdById: string;
  
  /**
   * Date and time when this version was created.
   */
  createdAt: Date;
}

/**
 * Interface representing an AI-generated care plan option.
 * 
 * These options are generated by the AI system based on the client's
 * medical records and needs assessment.
 */
export interface CarePlanOption {
  /**
   * Title or name of the care plan option.
   */
  title: string;
  
  /**
   * Detailed description of the care plan option's approach.
   */
  description: string;
  
  /**
   * AI-generated confidence score for this option (0-100).
   * Higher scores indicate greater confidence in the option's appropriateness.
   */
  confidenceScore: number;
  
  /**
   * Array of recommended goals for this care plan option.
   */
  goals: {
    description: string;
    targetDate?: Date;
    measures: string[];
  }[];
  
  /**
   * Array of recommended interventions for this care plan option.
   */
  interventions: {
    description: string;
    frequency: string;
    duration: string;
    responsibleParty: string;
  }[];
  
  /**
   * Array of expected outcomes if this care plan option is implemented.
   */
  expectedOutcomes: string[];
}

/**
 * Interface representing the response from the AI system when generating
 * care plan options.
 */
export interface CarePlanOptionsResponse {
  /**
   * Identifier of the client for whom the care plan options were generated.
   */
  clientId: string;
  
  /**
   * Array of care plan options generated by the AI system.
   */
  options: CarePlanOption[];
  
  /**
   * Metadata about the analysis process, including information about
   * the documents analyzed and algorithms used.
   */
  analysisMetadata: Record<string, any>;
}

/**
 * Data Transfer Object (DTO) for creating a new care plan.
 */
export interface CreateCarePlanDTO {
  /**
   * Identifier of the client for whom the care plan is being created.
   */
  clientId: string;
  
  /**
   * Title or name of the care plan.
   */
  title: string;
  
  /**
   * Detailed description of the care plan's purpose and approach.
   */
  description: string;
  
  /**
   * Array of goals to include in the care plan.
   */
  goals: {
    description: string;
    targetDate?: Date;
    status?: GoalStatus;
    measures: string[];
  }[];
  
  /**
   * Array of interventions to include in the care plan.
   */
  interventions: {
    description: string;
    frequency: string;
    duration: string;
    responsibleParty: string;
    status?: InterventionStatus;
  }[];
}

/**
 * Data Transfer Object (DTO) for updating an existing care plan.
 */
export interface UpdateCarePlanDTO {
  /**
   * Updated title of the care plan.
   */
  title: string;
  
  /**
   * Updated description of the care plan.
   */
  description: string;
  
  /**
   * Updated status of the care plan.
   */
  status: PlanStatus;
  
  /**
   * Updated array of goals for the care plan.
   * Existing goals can be updated by including their id.
   * New goals can be added by omitting the id.
   */
  goals: {
    id?: string;
    description: string;
    targetDate?: Date;
    status?: GoalStatus;
    measures: string[];
  }[];
  
  /**
   * Updated array of interventions for the care plan.
   * Existing interventions can be updated by including their id.
   * New interventions can be added by omitting the id.
   */
  interventions: {
    id?: string;
    description: string;
    frequency: string;
    duration: string;
    responsibleParty: string;
    status?: InterventionStatus;
  }[];
}

/**
 * Data Transfer Object (DTO) for approving a care plan.
 */
export interface ApproveCarePlanDTO {
  /**
   * Notes provided by the approver during the approval process.
   */
  approvalNotes: string;
}

/**
 * Data Transfer Object (DTO) for generating care plan options using AI.
 */
export interface GenerateCarePlanDTO {
  /**
   * Identifier of the client for whom to generate care plan options.
   */
  clientId: string;
  
  /**
   * Array of document identifiers to analyze for generating the care plan.
   */
  documentIds: string[];
  
  /**
   * Additional context or parameters to guide the AI generation process.
   */
  additionalContext: Record<string, any>;
}

/**
 * Interface for filtering and pagination parameters when querying care plans.
 */
export interface CarePlanFilterParams {
  /**
   * Filter by client ID.
   */
  clientId: string;
  
  /**
   * Filter by care plan status.
   */
  status: PlanStatus;
  
  /**
   * Filter by creator ID.
   */
  createdById: string;
  
  /**
   * Filter by approver ID.
   */
  approvedById: string;
  
  /**
   * Filter by created date range (start date).
   */
  fromDate: Date;
  
  /**
   * Filter by created date range (end date).
   */
  toDate: Date;
  
  /**
   * Text search query.
   */
  search: string;
  
  /**
   * Page number for pagination.
   */
  page: number;
  
  /**
   * Number of items per page.
   */
  limit: number;
  
  /**
   * Field to sort by.
   */
  sortBy: string;
  
  /**
   * Sort order (ascending or descending).
   */
  sortOrder: 'asc' | 'desc';
}

/**
 * Interface for the response when requesting care plan version history.
 */
export interface CarePlanHistoryResponse {
  /**
   * Identifier of the care plan.
   */
  carePlanId: string;
  
  /**
   * Current version number of the care plan.
   */
  currentVersion: number;
  
  /**
   * Array of version history records.
   */
  versions: CarePlanVersion[];
}