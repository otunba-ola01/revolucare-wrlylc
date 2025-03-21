/**
 * Implements notification event subscribers for the Revolucare platform.
 * This file sets up Redis pub/sub subscribers for notification-related events,
 * connecting event channels to their appropriate handlers. It enables the system
 * to react to notification lifecycle events such as creation, delivery, and
 * read status updates.
 */

import { redisClient } from '../../config/redis'; // ioredis@5.3.2
import {
  handleNotificationCreated,
  handleBulkNotificationCreated,
  handleNotificationDelivered,
  handleNotificationRead,
} from '../handlers/notification.handler';
import { logger } from '../../utils/logger';

// Define notification channels as a global constant
const NOTIFICATION_CHANNELS = {
  NOTIFICATION_CREATED: 'notification.created',
  NOTIFICATION_BULK_CREATED: 'notification.bulk.created',
  NOTIFICATION_DELIVERED: 'notification.delivered',
  NOTIFICATION_READ: 'notification.read',
};

/**
 * Initializes all notification event subscribers
 */
export async function initializeNotificationSubscribers(): Promise<void> {
  try {
    // Log the start of notification subscribers initialization
    logger.info('Initializing notification event subscribers...');

    // Subscribe to notification.created channel
    await subscribeToChannel(NOTIFICATION_CHANNELS.NOTIFICATION_CREATED);

    // Subscribe to notification.bulk.created channel
    await subscribeToChannel(NOTIFICATION_CHANNELS.NOTIFICATION_BULK_CREATED);

    // Subscribe to notification.delivered channel
    await subscribeToChannel(NOTIFICATION_CHANNELS.NOTIFICATION_DELIVERED);

    // Subscribe to notification.read channel
    await subscribeToChannel(NOTIFICATION_CHANNELS.NOTIFICATION_READ);

    // Set up message handler for notification events
    redisClient.on('message', handleMessage);

    // Log successful initialization of notification subscribers
    logger.info('Successfully initialized notification event subscribers');
  } catch (error) {
    // Catch and log any errors during initialization
    logger.error('Error initializing notification event subscribers', { error });
  }
}

/**
 * Handles incoming messages from Redis pub/sub channels
 * @param channel The channel the message was received on
 * @param message The message payload
 */
async function handleMessage(channel: string, message: string): Promise<void> {
  try {
    // Log receipt of message on channel
    logger.info(`Received message on channel: ${channel}`, { message });

    // Parse the message JSON string to an object
    const payload = JSON.parse(message);

    // Determine the appropriate handler based on the channel
    switch (channel) {
      case NOTIFICATION_CHANNELS.NOTIFICATION_CREATED:
        await handleNotificationCreated(payload);
        break;
      case NOTIFICATION_CHANNELS.NOTIFICATION_BULK_CREATED:
        await handleBulkNotificationCreated(payload);
        break;
      case NOTIFICATION_CHANNELS.NOTIFICATION_DELIVERED:
        await handleNotificationDelivered(payload);
        break;
      case NOTIFICATION_CHANNELS.NOTIFICATION_READ:
        await handleNotificationRead(payload);
        break;
      default:
        logger.warn(`No handler registered for channel: ${channel}`);
    }
  } catch (error) {
    // Catch and log any errors during message handling
    logger.error(`Error handling message on channel: ${channel}`, { error, message });
  }
}

/**
 * Subscribes to a Redis pub/sub channel
 * @param channel The channel to subscribe to
 */
async function subscribeToChannel(channel: string): Promise<void> {
  try {
    // Subscribe to the specified Redis channel
    await redisClient.subscribe(channel);

    // Log successful subscription
    logger.info(`Subscribed to Redis channel: ${channel}`);
  } catch (error) {
    // Catch and log any errors during subscription
    logger.error(`Error subscribing to Redis channel: ${channel}`, { error });
  }
}