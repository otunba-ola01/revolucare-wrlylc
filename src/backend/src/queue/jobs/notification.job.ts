import { Job } from 'bull'; // bull@^4.10.0
import { Notification } from '../../types/notification.types';
import { logger } from '../../utils/logger';
import { NOTIFICATION_TYPES } from '../../constants/notification-types';

/**
 * Notification job configuration for the background processing queue.
 * Handles asynchronous delivery of notifications across multiple channels
 * (in-app, email, SMS) based on user preferences.
 */
export const notificationJob = {
  /**
   * Name of the job type in the queue
   */
  name: 'notification',

  /**
   * Job processing options
   */
  options: {
    // Number of retry attempts if the job fails
    attempts: 3,
    
    // Backoff strategy for retries
    backoff: {
      type: 'exponential',
      delay: 5000, // Initial delay of 5 seconds
    },
    
    // Remove jobs from the queue once they are completed
    removeOnComplete: true,
    
    // Priority level (higher numbers = higher priority)
    priority: 2,
  },

  /**
   * Job handler function that processes notification delivery
   * @param job Bull job containing the notification data
   */
  handler: async (job: Job): Promise<void> => {
    try {
      // Extract notification data from the job
      const notification = job.data as Notification;
      
      // Log the start of notification processing
      logger.info('Processing notification job', {
        jobId: job.id,
        notificationId: notification.id,
        notificationType: notification.type,
        userId: notification.userId,
      });
      
      // Validate notification data
      if (!notification.id || !notification.userId || !notification.type) {
        throw new Error('Invalid notification data: missing required fields');
      }
      
      // Validate notification type
      if (!Object.values(NOTIFICATION_TYPES).includes(notification.type)) {
        logger.warn('Unknown notification type', {
          notificationType: notification.type,
          notificationId: notification.id,
        });
      }
      
      // In a real implementation, we would call a notification service to handle
      // the actual delivery across different channels based on the user's preferences.
      // For this example, we'll just log that the notification would be delivered.
      logger.info('Delivering notification', {
        notificationId: notification.id,
        userId: notification.userId,
        type: notification.type,
        channels: notification.channels,
      });
      
      // Different delivery strategies based on channels
      if (notification.channels) {
        for (const channel of notification.channels) {
          logger.debug(`Delivering notification through ${channel}`, {
            notificationId: notification.id,
            channel,
          });
          
          // Here we would call specific channel delivery services
          // e.g., emailService.send(), smsService.send(), etc.
        }
      }
      
      logger.info('Notification processing completed', {
        notificationId: notification.id,
        jobId: job.id,
      });
      
    } catch (error) {
      // Log any errors that occur during processing
      logger.error('Error processing notification job', {
        jobId: job.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      
      // Re-throw the error to let Bull know the job failed
      // This will trigger the retry mechanism based on our options
      throw error;
    }
  },
};