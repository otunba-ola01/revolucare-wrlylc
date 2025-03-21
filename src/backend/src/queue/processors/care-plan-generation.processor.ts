import { container } from 'tsyringe'; // tsyringe@^4.7.0
import { Job } from 'bull'; // bull@^4.10.0
import { GenerateCarePlanDTO } from '../../types/care-plan.types';
import { CarePlanGeneratorService } from '../../services/ai/care-plan-generator.service';
import { CarePlansService } from '../../services/care-plans.service';
import { logger } from '../../utils/logger';
import { errorFactory } from '../../utils/error-handler';
import { carePlanGenerationJob } from '../jobs/care-plan-generation.job';

// Define error codes for this module
const ERROR_CODES = {
  PROCESSOR_INITIALIZATION_FAILED: 'care_plan_processor_initialization_failed',
  PROCESSING_FAILED: 'care_plan_processing_failed',
  INVALID_JOB_DATA: 'invalid_care_plan_job_data'
};

/**
 * Processes a care plan generation job from the queue
 * @param job - The Bull job object containing the care plan generation data
 * @returns Promise<void> - Promise that resolves when processing is complete
 */
export const processCarePlanGeneration = async (job: Job<GenerateCarePlanDTO>): Promise<void> => {
  // Log the start of care plan generation processing
  logger.info(`Starting care plan generation processing for job ${job.id}`, { jobId: job.id });

  try {
    // Extract job data (clientId, documentIds, additionalContext)
    const { clientId, documentIds, additionalContext } = job.data;

    // Validate job data for required fields
    if (!validateJobData(job.data)) {
      throw errorFactory.createError(
        'Invalid job data: Missing required fields',
        ERROR_CODES.INVALID_JOB_DATA,
        { jobId: job.id, data: job.data }
      );
    }

    // Resolve the CarePlanGeneratorService from the dependency container
    const carePlanGeneratorService = container.resolve(CarePlanGeneratorService);

    // Call the service to generate care plan options
    const carePlanOptions = await carePlanGeneratorService.generateOptions({
      clientId,
      documentIds,
      additionalContext
    });

    // Log successful care plan generation
    logger.info(`Care plan generated successfully for client ${clientId}`, {
      jobId: job.id,
      clientId,
      optionCount: carePlanOptions.options.length
    });

    // Return the generated care plan options
    return carePlanOptions;
  } catch (error: any) {
    // Handle and log any errors during processing
    logger.error(`Care plan generation failed for job ${job.id}`, {
      jobId: job.id,
      error: error instanceof Error ? error.message : String(error)
    });
    throw errorFactory.createError(
      'Care plan generation failed',
      ERROR_CODES.PROCESSING_FAILED,
      { jobId: job.id },
      error instanceof Error ? error : new Error(String(error))
    );
  }
};

/**
 * Validates that the job data contains all required fields
 * @param data - The job data to validate
 * @returns boolean - True if data is valid, throws error otherwise
 */
const validateJobData = (data: GenerateCarePlanDTO): boolean => {
  // Check if clientId is present and is a string
  if (!data.clientId || typeof data.clientId !== 'string') {
    return false;
  }

  // Check if documentIds is present and is an array
  if (!data.documentIds || !Array.isArray(data.documentIds)) {
    return false;
  }

  // Check if documentIds array is not empty
  if (data.documentIds.length === 0) {
    return false;
  }

  // Return true if all validations pass
  return true;
};

// Export the processCarePlanGeneration function for use as a queue processor
export { processCarePlanGeneration };