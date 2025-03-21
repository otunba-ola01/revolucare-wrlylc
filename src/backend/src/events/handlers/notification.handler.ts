/**
 * Implements event handlers for notification-related events in the Revolucare platform.
 * This file contains functions that process notification events from the Redis pub/sub system,
 * updating notification statuses and triggering appropriate actions when notifications are
 * created, delivered, or read.
 */

import { redisClient } from '../../config/redis'; // ioredis@5.3.2
import { NotificationService } from '../../services/notifications.service';
import { NotificationRepository } from '../../repositories/notification.repository';
import { NotificationModel } from '../../models/notification.model';
import { NOTIFICATION_STATUSES, NOTIFICATION_CHANNELS } from '../../constants/notification-types';
import { logger } from '../../utils/logger';

// Module-level cache for NotificationService instance
let notificationServiceInstance: NotificationService | null = null;

// Module-level cache for NotificationRepository instance
let notificationRepositoryInstance: NotificationRepository | null = null;

/**
 * Handles notification.created events by sending the notification through appropriate channels
 * @param payload Object containing the notification data
 */
export async function handleNotificationCreated(payload: { notification: NotificationModel }): Promise<void> {
  try {
    // LD1: Extract notification data from the event payload
    const { notification } = payload;

    // LD1: Log the notification creation event
    logger.info('Handling notification.created event', { notificationId: notification.id });

    // LD1: Get notification service instance
    const notificationService = getNotificationService();

    // LD1: Send the notification through appropriate channels based on user preferences
    await notificationService.sendNotification(notification);

    // LD1: Publish real-time notification event to Redis for WebSocket delivery
    await publishRealtimeNotification(notification.userId, notification);

    // LD1: Log successful notification delivery
    logger.info('Successfully processed notification.created event', { notificationId: notification.id });
  } catch (error) {
    // LD1: Catch and log any errors during the process
    logger.error('Error handling notification.created event', { error });
  }
}

/**
 * Handles notification.bulk.created events by processing multiple notifications at once
 * @param payload Object containing an array of notification data
 */
export async function handleBulkNotificationCreated(payload: { notifications: NotificationModel[] }): Promise<void> {
  try {
    // LD1: Extract notifications array from the event payload
    const { notifications } = payload;

    // LD1: Log the bulk notification creation event
    logger.info('Handling notification.bulk.created event', { count: notifications.length });

    // LD1: Get notification service instance
    const notificationService = getNotificationService();

    // LD1: Process each notification in the array
    for (const notification of notifications) {
      // LD1: Send each notification through appropriate channels
      await notificationService.sendNotification(notification);

      // LD1: Publish real-time notification events to Redis for WebSocket delivery
      await publishRealtimeNotification(notification.userId, notification);
    }

    // LD1: Log successful bulk notification processing
    logger.info('Successfully processed notification.bulk.created event', { count: notifications.length });
  } catch (error) {
    // LD1: Catch and log any errors during the process
    logger.error('Error handling notification.bulk.created event', { error });
  }
}

/**
 * Handles notification.delivered events by updating notification status to delivered
 * @param payload Object containing the notification ID and channel
 */
export async function handleNotificationDelivered(payload: { notificationId: string; channel: string }): Promise<void> {
  try {
    // LD1: Extract notification ID and channel from the event payload
    const { notificationId, channel } = payload;

    // LD1: Log the notification delivery event
    logger.info('Handling notification.delivered event', { notificationId, channel });

    // LD1: Get notification repository instance
    const notificationRepository = getNotificationRepository();

    // LD1: Retrieve the notification from the database
    const notification = await notificationRepository.findById(notificationId);

    // LD1: Check if notification exists
    if (!notification) {
      logger.warn('Notification not found', { notificationId });
      return;
    }

    // LD1: Update notification status to DELIVERED
    await notificationRepository.update(notificationId, { status: NOTIFICATION_STATUSES.DELIVERED });

    // LD1: Log successful status update
    logger.info('Notification status updated to DELIVERED', { notificationId, channel });
  } catch (error) {
    // LD1: Catch and log any errors during the process
    logger.error('Error handling notification.delivered event', { error });
  }
}

/**
 * Handles notification.read events by updating notification status to read
 * @param payload Object containing the notification ID
 */
export async function handleNotificationRead(payload: { notificationId: string }): Promise<void> {
  try {
    // LD1: Extract notification ID from the event payload
    const { notificationId } = payload;

    // LD1: Log the notification read event
    logger.info('Handling notification.read event', { notificationId });

    // LD1: Get notification repository instance
    const notificationRepository = getNotificationRepository();

    // LD1: Retrieve the notification from the database
    const notification = await notificationRepository.findById(notificationId);

    // LD1: Check if notification exists
    if (!notification) {
      logger.warn('Notification not found', { notificationId });
      return;
    }

    // LD1: Update notification status to READ and set readAt timestamp
    await notificationRepository.update(notificationId, { status: NOTIFICATION_STATUSES.READ, readAt: new Date() });

    // LD1: Publish notification.read.sync event to Redis for syncing across devices
    await publishNotificationEvent('notification.read.sync', { notificationId });

    // LD1: Log successful status update
    logger.info('Notification status updated to READ', { notificationId });
  } catch (error) {
    // LD1: Catch and log any errors during the process
    logger.error('Error handling notification.read event', { error });
  }
}

/**
 * Publishes a notification event to the Redis pub/sub system
 * @param channel The Redis channel to publish to
 * @param payload The event payload
 */
export async function publishNotificationEvent(channel: string, payload: any): Promise<void> {
  try {
    // LD1: Validate channel and payload parameters
    if (!channel) {
      throw new Error('Channel is required');
    }
    if (!payload) {
      throw new Error('Payload is required');
    }

    // LD1: Convert payload to JSON string
    const message = JSON.stringify(payload);

    // LD1: Publish the event to the specified Redis channel
    await redisClient.publish(channel, message);

    // LD1: Log successful event publication
    logger.info('Published notification event to Redis', { channel, message });
  } catch (error) {
    // LD1: Catch and log any errors during the process
    logger.error('Error publishing notification event to Redis', { error, channel, payload });
  }
}

/**
 * Publishes a notification to the real-time channel for WebSocket delivery
 * @param userId The user ID to send the notification to
 * @param notification The notification data
 */
export async function publishRealtimeNotification(userId: string, notification: NotificationModel): Promise<void> {
  try {
    // LD1: Create payload with userId and notification data
    const payload = {
      userId,
      notification: notification.toJSON(),
    };

    // LD1: Publish to notification.realtime Redis channel
    await publishNotificationEvent('notification.realtime', payload);

    // LD1: Log successful real-time notification publication
    logger.info('Published real-time notification to Redis', { userId, notificationId: notification.id });
  } catch (error) {
    // LD1: Catch and log any errors during the process
    logger.error('Error publishing real-time notification to Redis', { error, userId, notificationId: notification.id });
  }
}

/**
 * Gets or creates a notification service instance
 * @returns Notification service instance
 */
export function getNotificationService(): NotificationService {
  // LD1: Check if notification service instance exists in module cache
  if (!notificationServiceInstance) {
    // LD1: If not, create a new notification service instance
    notificationServiceInstance = new NotificationService(
      getNotificationRepository(),
      { findById: () => Promise.resolve(null) } as any, // TODO: Replace with actual UserRepository
      { deliverNotification: () => Promise.resolve([]) } as any // TODO: Replace with actual EmailService
    );
  }

  // LD1: Return the notification service instance
  return notificationServiceInstance;
}

/**
 * Gets or creates a notification repository instance
 * @returns Notification repository instance
 */
export function getNotificationRepository(): NotificationRepository {
  // LD1: Check if notification repository instance exists in module cache
  if (!notificationRepositoryInstance) {
    // LD1: If not, create a new notification repository instance
    notificationRepositoryInstance = new NotificationRepository();
  }

  // LD1: Return the notification repository instance
  return notificationRepositoryInstance;
}