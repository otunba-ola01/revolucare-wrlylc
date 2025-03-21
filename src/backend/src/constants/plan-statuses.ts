/**
 * Plan Status Constants
 * 
 * This file defines the enum for plan statuses used throughout the Revolucare platform.
 * These statuses represent the possible states that care plans and service plans can have
 * during their lifecycle, from creation to completion.
 * 
 * The statuses follow the workflow defined in the Care Plan Lifecycle and 
 * Service Request State Transitions documentation.
 */

/**
 * Enum representing the possible statuses for care plans and service plans.
 * 
 * These statuses are used for tracking the progress of both care plans and service plans
 * throughout their lifecycle from creation to completion. The status transitions follow
 * the defined workflows in the system architecture.
 */
export enum PlanStatus {
  /**
   * Initial creation state, editable by creator before submission.
   * In this state, the plan can be freely modified and is not visible to approvers.
   */
  DRAFT = 'draft',
  
  /**
   * Plan has been submitted and is awaiting approval from authorized personnel.
   * No further editing is allowed unless the plan is returned to DRAFT status.
   */
  IN_REVIEW = 'in_review',
  
  /**
   * Plan has been reviewed and approved but not yet implemented.
   * This is an intermediate state before the plan becomes ACTIVE.
   */
  APPROVED = 'approved',
  
  /**
   * Plan is currently being implemented and interventions are in progress.
   * Regular updates and monitoring occur during this status.
   */
  ACTIVE = 'active',
  
  /**
   * Active plan that is undergoing periodic review to assess effectiveness.
   * The plan remains active during this review process.
   */
  UNDER_REVIEW = 'under_review',
  
  /**
   * Plan has been updated following a review with modifications to goals or interventions.
   * Typically transitions back to ACTIVE status after revision.
   */
  REVISED = 'revised',
  
  /**
   * Plan implementation is temporarily paused due to client circumstances,
   * provider availability, or other factors. Can return to ACTIVE when resolved.
   */
  ON_HOLD = 'on_hold',
  
  /**
   * Plan goals have been achieved and the plan is finished successfully.
   * This is a terminal state indicating successful completion.
   */
  COMPLETED = 'completed',
  
  /**
   * Plan was abandoned before approval or implementation.
   * This is a terminal state for plans that were never implemented.
   */
  CANCELLED = 'cancelled',
  
  /**
   * Plan was reviewed and deemed unsuitable or inappropriate.
   * This is a terminal state for plans that did not meet approval criteria.
   */
  REJECTED = 'rejected',
  
  /**
   * Plan was ended early before completion of all goals and interventions.
   * This is a terminal state for plans that were actively implemented but discontinued.
   */
  TERMINATED = 'terminated',
  
  /**
   * Plan has been replaced by a newer version with significant changes.
   * This is a terminal state for plans that have been upgraded or replaced.
   */
  SUPERSEDED = 'superseded'
}