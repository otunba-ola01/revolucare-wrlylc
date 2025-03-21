import { Queue, QueueOptions } from 'bull'; // bull@^4.10.0
import { redisClient } from '../config/redis';
import { logger } from '../utils/logger';
import {
  analyticsEventJob, calculateMetricsJob, updateDashboardsJob
} from './jobs/analytics.job';
import { carePlanGenerationJob } from './jobs/care-plan-generation.job';
import { documentAnalysisJob } from './jobs/document-analysis.job';
import { emailJob } from './jobs/email.job';
import { notificationJob } from './jobs/notification.job';
import {
  processAnalyticsEvent, calculateMetrics, updateDashboards
} from './processors/analytics.processor';
import { processCarePlanGeneration } from './processors/care-plan-generation.processor';
import { processDocumentAnalysis } from './processors/document-analysis.processor';
import { processEmail } from './processors/email.processor';
import { processNotification } from './processors/notification.processor';

// Define queue names for different job types
const QUEUE_NAMES = {
  ANALYTICS: 'analytics',
  CARE_PLAN: 'care-plan',
  DOCUMENT: 'document',
  EMAIL: 'email',
  NOTIFICATION: 'notification'
};

// Define default queue options for all queues
const DEFAULT_QUEUE_OPTIONS: QueueOptions = {
  redis: redisClient,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    },
    removeOnComplete: true,
    removeOnFail: false
  }
};

// Create queue instances for different job types
const analyticsQueue = new Queue(QUEUE_NAMES.ANALYTICS, DEFAULT_QUEUE_OPTIONS);
const carePlanQueue = new Queue(QUEUE_NAMES.CARE_PLAN, DEFAULT_QUEUE_OPTIONS);
const documentQueue = new Queue(QUEUE_NAMES.DOCUMENT, DEFAULT_QUEUE_OPTIONS);
const emailQueue = new Queue(QUEUE_NAMES.EMAIL, DEFAULT_QUEUE_OPTIONS);
const notificationQueue = new Queue(QUEUE_NAMES.NOTIFICATION, DEFAULT_QUEUE_OPTIONS);

/**
 * Creates and configures a Bull queue with standard options
 * @param name The name of the queue
 * @param options QueueOptions
 * @returns Configured Bull queue instance
 */
function createQueue(name: string, options?: QueueOptions): Queue {
  // Merge provided options with default queue options
  const mergedOptions = { ...DEFAULT_QUEUE_OPTIONS, ...options };

  // Create a new Bull queue with the specified name and options
  const queue = new Queue(name, mergedOptions);

  // Set up standard event handlers for the queue
  queue.on('completed', (job) => {
    logger.info(`Job completed: ${job.id} in queue ${name}`);
  });

  queue.on('failed', (job, err) => {
    logger.error(`Job failed: ${job.id} in queue ${name}`, { error: err instanceof Error ? err.message : String(err) });
  });

  queue.on('stalled', (jobId) => {
    logger.warn(`Job stalled: ${jobId} in queue ${name}`);
  });

  queue.on('error', (err) => {
    logger.error(`Queue error in queue ${name}`, { error: err instanceof Error ? err.message : String(err) });
  });

  // Return the configured queue instance
  return queue;
}

/**
 * Initializes all background job queues and registers their processors
 * @returns Promise<void> Promise that resolves when all queues are initialized
 */
async function initializeQueues(): Promise<void> {
  try {
    // Create and configure each queue with appropriate options
    // Register job processors for each queue
    analyticsQueue.process(analyticsEventJob.name, processAnalyticsEvent);
    analyticsQueue.process(calculateMetricsJob.name, calculateMetrics);
    analyticsQueue.process(updateDashboardsJob.name, updateDashboards);

    carePlanQueue.process(carePlanGenerationJob.name, processCarePlanGeneration);

    documentQueue.process(documentAnalysisJob.name, processDocumentAnalysis);

    emailQueue.process(emailJob.standard.name, processEmail);
    emailQueue.process(emailJob.template.name, processEmail);

    notificationQueue.process(notificationJob.name, processNotification);

    // Set up event handlers for queue events (completed, failed, etc.)
    // Log successful queue initialization
    logger.info('All queues initialized successfully');
  } catch (error) {
    // Handle and log any errors during initialization
    logger.error('Queue initialization failed', { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

/**
 * Gracefully shuts down all job queues
 * @returns Promise<void> Promise that resolves when all queues are closed
 */
async function shutdownQueues(): Promise<void> {
  try {
    // Close each queue with a graceful shutdown
    await analyticsQueue.close();
    await carePlanQueue.close();
    await documentQueue.close();
    await emailQueue.close();
    await notificationQueue.close();

    // Wait for all queues to complete processing current jobs
    // Log successful queue shutdown
    logger.info('All queues shut down gracefully');
  } catch (error) {
    // Handle and log any errors during shutdown
    logger.error('Queue shutdown failed', { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

// Export queue instances for use throughout the application
export {
  analyticsQueue,
  carePlanQueue,
  documentQueue,
  emailQueue,
  notificationQueue,
  initializeQueues,
  shutdownQueues,
  createQueue
};