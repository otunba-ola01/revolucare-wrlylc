/**
 * Care Plan Generation Job
 * 
 * This file defines the background job configuration for asynchronous care plan generation.
 * Care plan generation is a computationally intensive process that involves analyzing
 * medical records and client information to generate personalized care plans with 
 * multiple options and confidence scores.
 */

import { JobOptions } from 'bull'; // v4.10.0
import { GenerateCarePlanDTO } from '../../types/care-plan.types';
import { AIServiceType } from '../../types/ai.types';

/**
 * Unique name identifier for the care plan generation job.
 * This name is used for job registration and tracking in the queue system.
 */
export const JOB_NAME = 'care-plan-generation';

/**
 * Configuration object for care plan generation background jobs.
 * 
 * This defines how care plan generation jobs are processed in the queue system,
 * including priorities, timeouts, and retry strategies.
 */
export const carePlanGenerationJob = {
  /**
   * Job name for identification in the queue system
   */
  name: JOB_NAME,
  
  /**
   * Job options for the Bull queue processor
   */
  options: {
    /**
     * Priority level of the job (lower number = higher priority)
     * Care plan generation is an important user-facing task, so it gets higher priority.
     */
    priority: 10,
    
    /**
     * Number of attempts to retry the job if it fails
     * We retry several times to ensure the job completes even with transient issues.
     */
    attempts: 3,
    
    /**
     * Backoff strategy for retries
     * Uses exponential backoff to handle temporary issues with external services.
     */
    backoff: {
      type: 'exponential',
      delay: 5000, // 5 seconds initial delay
    },
    
    /**
     * Timeout for job processing in milliseconds
     * Based on the performance requirement to generate plans in < 30 seconds,
     * we set a slightly higher timeout to account for edge cases.
     */
    timeout: 60000, // 60 seconds
    
    /**
     * Whether to remove the job when it's completed
     * Completed jobs are removed to keep the queue clean and efficient.
     */
    removeOnComplete: true,
    
    /**
     * Whether to remove the job when it fails all retry attempts
     * Failed jobs are kept for troubleshooting and manual intervention.
     */
    removeOnFail: false,
  } as JobOptions,
  
  /**
   * Job data structure
   * This is a placeholder for the expected data structure.
   * Actual data will be provided when jobs are added to the queue.
   */
  data: {} as GenerateCarePlanDTO,
};