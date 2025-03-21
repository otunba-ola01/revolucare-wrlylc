import { JobOptions } from 'bull'; // v4.10.0
import { DocumentAnalysisParams, DocumentAnalysisType } from '../../interfaces/document.interface';

/**
 * Name of the document analysis job in the queue system
 */
export const JOB_NAME = 'document-analysis';

/**
 * Default job options for document analysis tasks
 * - attempts: Number of retry attempts for failed jobs
 * - backoff: Strategy for delaying retries (exponential with 60s base delay)
 * - removeOnComplete: Remove job from queue when complete
 * - removeOnFail: Keep failed jobs for troubleshooting
 */
export const DEFAULT_JOB_OPTIONS: JobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 60000 // 1 minute base delay
  },
  removeOnComplete: true,
  removeOnFail: false
};

/**
 * Generates job options based on the priority of the document analysis task
 * 
 * @param params Document analysis parameters
 * @returns Configured job options for the queue
 */
export function getJobOptions(params: DocumentAnalysisParams): JobOptions {
  const priority = params.priority || 'normal';
  const options: JobOptions = { ...DEFAULT_JOB_OPTIONS };

  // Adjust job options based on priority
  switch (priority) {
    case 'high':
      options.priority = 1; // Lower number = higher priority
      if (options.backoff && typeof options.backoff === 'object') {
        options.backoff.delay = 30000; // 30 seconds for high priority
      }
      break;
    case 'low':
      options.priority = 10; // Higher number = lower priority
      if (options.backoff && typeof options.backoff === 'object') {
        options.backoff.delay = 120000; // 2 minutes for low priority
      }
      break;
    default:
      options.priority = 5; // Normal priority
      break;
  }

  return options;
}

/**
 * Document analysis job configuration object
 * Defines how document analysis tasks are processed in the queue
 */
export const documentAnalysisJob = {
  /**
   * Unique name for the job type
   */
  name: JOB_NAME,
  
  /**
   * Default options for all document analysis jobs
   */
  defaultOptions: DEFAULT_JOB_OPTIONS,
  
  /**
   * Function to get customized options based on job parameters
   */
  getOptions: getJobOptions
};

/**
 * Default export of the document analysis job configuration
 */
export default documentAnalysisJob;