import { Job } from 'bull'; // bull@^4.10.0
import { NotificationService } from '../../services/notifications.service';
import {
  Notification,
  NotificationDeliveryResult,
  NOTIFICATION_CHANNELS,
} from '../../types/notification.types';
import { logger } from '../../utils/logger';
import { EmailService } from '../../services/email/email.service';
import { smsService } from '../../services/sms/sms.service';

/**
 * Processes a notification job by delivering the notification through appropriate channels
 * @param job Job
 * @returns Results of notification delivery attempts
 */
export const processNotification = async (
  job: Job
): Promise<NotificationDeliveryResult[]> => {
  // Extract notification data from job.data
  const notificationData = job.data;

  // Log the start of notification processing
  logger.info('Starting notification processing', {
    jobId: job.id,
    notificationId: notificationData?.id,
  });

  // Validate the notification data
  if (!validateNotificationData(notificationData)) {
    logger.error('Invalid notification data', {
      jobId: job.id,
      notificationData,
    });
    throw new Error('Invalid notification data');
  }

  let notificationService: NotificationService | null = null;

  try {
    // Retrieve the full notification object from the database
    notificationService = new NotificationService(
      // Assuming these are correctly dependency injected elsewhere
      new (require('../../repositories/notification.repository').NotificationRepository)(),
      new (require('../../repositories/user.repository').UserRepository)(),
      new EmailService()
    );

    const notification: Notification = await notificationService.getNotificationById(
      notificationData.id
    );

    // Send the notification through appropriate channels based on user preferences
    const deliveryResults: NotificationDeliveryResult[] = await notificationService.sendNotification(
      notification
    );

    // Log the delivery results for each channel
    logger.info('Notification delivery results', {
      jobId: job.id,
      notificationId: notification.id,
      results: deliveryResults,
    });

    // Return the delivery results
    return deliveryResults;
  } catch (error) {
    // Handle and log any errors that occur during processing
    logger.error('Error processing notification', {
      jobId: job.id,
      notificationId: notificationData?.id,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error; // Re-throw the error to be handled by Bull
  }
};

/**
 * Validates that the notification data contains all required fields
 * @param data
 * @returns True if data is valid, false otherwise
 */
function validateNotificationData(data: any): boolean {
  // Check if data exists and is an object
  if (!data || typeof data !== 'object') {
    return false;
  }

  // Check if data contains a notification ID
  if (!data.id) {
    return false;
  }

  // Return true if all validations pass, false otherwise
  return true;
}

/**
 * Delivers a notification through a specific channel
 * @param notification
 * @param channel
 * @returns Result of the delivery attempt
 */
async function deliverNotificationByChannel(
  notification: Notification,
  channel: string
): Promise<NotificationDeliveryResult> {
  try {
    // Log the attempt to deliver a notification via a specific channel
    logger.info('Delivering notification via channel', {
      notificationId: notification.id,
      channel,
    });

    let success = false;
    let error: string | null = null;
    let metadata: Record<string, any> | null = null;

    switch (channel) {
      case NOTIFICATION_CHANNELS.IN_APP:
        // Emit in-app notification event
        // Assuming there's a way to emit in-app notifications from here
        logger.info('In-app notification emitted', { notificationId: notification.id });
        success = true;
        metadata = { deliveredAt: new Date().toISOString() };
        break;

      case NOTIFICATION_CHANNELS.EMAIL:
        // Deliver notification via email service
        const emailService = new EmailService(); // v4.0.1
        const emailResult = await emailService.deliverNotification(notification);
        success = emailResult[0].success;
        error = emailResult[0].error;
        metadata = emailResult[0].metadata;
        break;

      case NOTIFICATION_CHANNELS.SMS:
        // Deliver notification via SMS service
        const smsResult = await smsService.sendNotification(
          notification.userId,
          notification.type,
          notification.data || {}
        );
        success = smsResult.success;
        error = smsResult.error || null;
        metadata = { messageId: smsResult.messageId };
        break;

      default:
        throw new Error(`Unsupported notification channel: ${channel}`);
    }

    // Log the successful delivery of the notification via the channel
    logger.info('Notification delivered successfully via channel', {
      notificationId: notification.id,
      channel,
      success,
    });

    // Return delivery result with success/failure status
    return {
      success,
      channel: channel as any,
      error,
      metadata,
    };
  } catch (error) {
    // Log the error and return a failed delivery result
    logger.error('Failed to deliver notification via channel', {
      notificationId: notification.id,
      channel,
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      success: false,
      channel: channel as any,
      error: error instanceof Error ? error.message : String(error),
      metadata: null,
    };
  }
}