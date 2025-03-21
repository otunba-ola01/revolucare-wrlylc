/**
 * Implements event subscribers for services plan related events in the Revolucare platform.
 * This file sets up Redis subscribers that listen for services plan events and trigger appropriate handlers when events occur,
 * enabling event-driven communication between services.
 */

import { redisClient } from '../../config/redis'; // ioredis@5.3.2
import { logger } from '../../utils/logger';
import {
  handleServicesPlanCreated,
  handleServicesPlanUpdated,
  handleServicesPlanApproved,
  handleServicesPlanStatusChanged,
} from '../handlers/services-plan.handler';

/**
 * Initializes subscribers for services plan related events
 */
export async function initializeServicesPlanSubscribers(): Promise<void> {
  try {
    // Subscribe to 'services-plan.created' event channel
    await redisClient.subscribe('services-plan.created', (message, channel) => {
      handleServicesPlanMessage(channel, message);
    });

    // Subscribe to 'services-plan.updated' event channel
    await redisClient.subscribe('services-plan.updated', (message, channel) => {
      handleServicesPlanMessage(channel, message);
    });

    // Subscribe to 'services-plan.approved' event channel
    await redisClient.subscribe('services-plan.approved', (message, channel) => {
      handleServicesPlanMessage(channel, message);
    });

    // Subscribe to 'services-plan.status-changed' event channel
    await redisClient.subscribe('services-plan.status-changed', (message, channel) => {
      handleServicesPlanMessage(channel, message);
    });

    // Set up message handler for services plan events
    redisClient.on('message', (channel, message) => {
      handleServicesPlanMessage(channel, message);
    });

    // Log successful initialization of services plan subscribers
    logger.info('Services plan event subscribers initialized successfully');
  } catch (error) {
    // Handle and log any errors during initialization
    logger.error('Failed to initialize services plan event subscribers', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Handles incoming services plan event messages and routes to appropriate handlers
 * @param channel The Redis channel the message was received on
 * @param message The message payload
 */
async function handleServicesPlanMessage(channel: string, message: string): Promise<void> {
  try {
    // Parse the message JSON to extract event data
    const event = JSON.parse(message);

    // Log the received event with channel and basic info
    logger.info('Received services plan event', { channel, event });

    // Route to appropriate handler based on channel name
    switch (channel) {
      case 'services-plan.created':
        // For 'services-plan.created' events, call handleServicesPlanCreated
        await handleServicesPlanCreated(event);
        break;
      case 'services-plan.updated':
        // For 'services-plan.updated' events, call handleServicesPlanUpdated
        await handleServicesPlanUpdated(event);
        break;
      case 'services-plan.approved':
        // For 'services-plan.approved' events, call handleServicesPlanApproved
        await handleServicesPlanApproved(event);
        break;
      case 'services-plan.status-changed':
        // For 'services-plan.status-changed' events, call handleServicesPlanStatusChanged
        await handleServicesPlanStatusChanged(event);
        break;
      default:
        logger.warn('Received unknown services plan event', { channel });
    }
  } catch (error) {
    // Handle and log any errors during message processing
    logger.error('Error handling services plan event', {
      error: error instanceof Error ? error.message : String(error),
      channel,
      message,
    });
  }
}