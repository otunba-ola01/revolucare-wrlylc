import { redisClient } from '../../config/redis'; // ioredis@5.3.2
import { logger } from '../../utils/logger';
import { handleCarePlanCreated, handleCarePlanUpdated, handleCarePlanApproved, handleCarePlanStatusChanged } from '../handlers/care-plan.handler';

/**
 * Initializes subscribers for care plan related events
 */
export async function initializeCarePlanSubscribers(): Promise<void> {
  try {
    // Subscribe to 'care-plan.created' event channel
    await redisClient.subscribe('care-plan.created', (err, count) => {
      if (err) {
        logger.error('Failed to subscribe to care-plan.created channel', { error: err.message });
      } else {
        logger.info(`Subscribed to care-plan.created channel. Number of subscribers: ${count}`);
      }
    });

    // Subscribe to 'care-plan.updated' event channel
    await redisClient.subscribe('care-plan.updated', (err, count) => {
      if (err) {
        logger.error('Failed to subscribe to care-plan.updated channel', { error: err.message });
      } else {
        logger.info(`Subscribed to care-plan.updated channel. Number of subscribers: ${count}`);
      }
    });

    // Subscribe to 'care-plan.approved' event channel
    await redisClient.subscribe('care-plan.approved', (err, count) => {
      if (err) {
        logger.error('Failed to subscribe to care-plan.approved channel', { error: err.message });
      } else {
        logger.info(`Subscribed to care-plan.approved channel. Number of subscribers: ${count}`);
      }
    });

    // Subscribe to 'care-plan.status-changed' event channel
    await redisClient.subscribe('care-plan.status-changed', (err, count) => {
      if (err) {
        logger.error('Failed to subscribe to care-plan.status-changed channel', { error: err.message });
      } else {
        logger.info(`Subscribed to care-plan.status-changed channel. Number of subscribers: ${count}`);
      }
    });

    // Set up message handler for care plan events
    redisClient.on('message', async (channel: string, message: string) => {
      await handleCarePlanMessage(channel, message);
    });

    // Log successful initialization of care plan subscribers
    logger.info('Care plan subscribers initialized successfully');
  } catch (error: any) {
    // Handle and log any errors during initialization
    logger.error('Error initializing care plan subscribers', { error: error.message });
  }
}

/**
 * Handles incoming care plan event messages and routes to appropriate handlers
 * @param channel - The event channel
 * @param message - The message payload
 */
async function handleCarePlanMessage(channel: string, message: string): Promise<void> {
  try {
    // Parse the message JSON to extract event data
    const eventData = JSON.parse(message);

    // Log the received event with channel and basic info
    logger.info('Received care plan event', { channel, eventType: eventData.type });

    // Route to appropriate handler based on channel name
    switch (channel) {
      case 'care-plan.created':
        // For 'care-plan.created' events, call handleCarePlanCreated
        await handleCarePlanCreated(eventData.payload);
        break;
      case 'care-plan.updated':
        // For 'care-plan.updated' events, call handleCarePlanUpdated
        await handleCarePlanUpdated(eventData.payload);
        break;
      case 'care-plan.approved':
        // For 'care-plan.approved' events, call handleCarePlanApproved
        await handleCarePlanApproved(eventData.payload);
        break;
      case 'care-plan.status-changed':
        // For 'care-plan.status-changed' events, call handleCarePlanStatusChanged
        await handleCarePlanStatusChanged(eventData.payload);
        break;
      default:
        logger.warn('Received message on unknown channel', { channel });
    }
  } catch (error: any) {
    // Handle and log any errors during message processing
    logger.error('Error handling care plan message', { error: error.message, channel, message });
  }
}