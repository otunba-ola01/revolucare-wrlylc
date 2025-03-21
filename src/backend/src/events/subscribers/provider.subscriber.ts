/**
 * Implements provider event subscribers for the Revolucare platform.
 * This file sets up Redis pub/sub subscribers for provider-related events and connects them to the appropriate event handlers,
 * enabling decoupled processing of events like provider profile updates, availability changes, review submissions, and service area updates.
 */

import { redisClient } from '../../config/redis'; // ioredis@5.3.2
import { logger } from '../../utils/logger';
import { handleProviderProfileUpdated, handleAvailabilityUpdated, handleProviderReviewSubmitted, handleProviderServiceAreaUpdated } from '../handlers/provider.handler';

/**
 * @global
 * Provider event type constants for use throughout the application
 */
export const PROVIDER_EVENTS = {
  PROFILE_UPDATED: 'provider.profile.updated',
  AVAILABILITY_UPDATED: 'provider.availability.updated',
  REVIEW_SUBMITTED: 'provider.review.submitted',
  SERVICE_AREA_UPDATED: 'provider.service-area.updated'
};

/**
 * Subscribes to provider-related Redis channels
 * @returns Promise that resolves when all subscriptions are established
 */
async function subscribeToProviderEvents(): Promise<void> {
  try {
    // Subscribe to the provider.profile.updated channel
    await redisClient.subscribe(PROVIDER_EVENTS.PROFILE_UPDATED, (err) => {
      if (err) {
        logger.error(`Failed to subscribe to ${PROVIDER_EVENTS.PROFILE_UPDATED} channel: ${err.message}`);
      } else {
        logger.info(`Subscribed to ${PROVIDER_EVENTS.PROFILE_UPDATED} channel`);
      }
    });

    // Subscribe to the provider.availability.updated channel
    await redisClient.subscribe(PROVIDER_EVENTS.AVAILABILITY_UPDATED, (err) => {
      if (err) {
        logger.error(`Failed to subscribe to ${PROVIDER_EVENTS.AVAILABILITY_UPDATED} channel: ${err.message}`);
      } else {
        logger.info(`Subscribed to ${PROVIDER_EVENTS.AVAILABILITY_UPDATED} channel`);
      }
    });

    // Subscribe to the provider.review.submitted channel
    await redisClient.subscribe(PROVIDER_EVENTS.REVIEW_SUBMITTED, (err) => {
      if (err) {
        logger.error(`Failed to subscribe to ${PROVIDER_EVENTS.REVIEW_SUBMITTED} channel: ${err.message}`);
      } else {
        logger.info(`Subscribed to ${PROVIDER_EVENTS.REVIEW_SUBMITTED} channel`);
      }
    });

    // Subscribe to the provider.service-area.updated channel
    await redisClient.subscribe(PROVIDER_EVENTS.SERVICE_AREA_UPDATED, (err) => {
      if (err) {
        logger.error(`Failed to subscribe to ${PROVIDER_EVENTS.SERVICE_AREA_UPDATED} channel: ${err.message}`);
      } else {
        logger.info(`Subscribed to ${PROVIDER_EVENTS.SERVICE_AREA_UPDATED} channel`);
      }
    });

    // Log successful subscription to all provider events
    logger.info('Successfully subscribed to all provider events');
  } catch (error) {
    // Catch and log any errors during subscription
    logger.error('Error subscribing to provider events', {
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

/**
 * Sets up message listeners for provider events
 * @returns void No return value
 */
function setupProviderEventListeners(): void {
  // Set up message listener for Redis pub/sub messages
  redisClient.on('message', async (channel: string, message: string) => {
    try {
      // Parse the received message payload
      const payload = JSON.parse(message);

      // Determine the channel/event type
      switch (channel) {
        // For provider.profile.updated events, call handleProviderProfileUpdated
        case PROVIDER_EVENTS.PROFILE_UPDATED:
          await handleProviderProfileUpdated(payload);
          break;

        // For provider.availability.updated events, call handleAvailabilityUpdated
        case PROVIDER_EVENTS.AVAILABILITY_UPDATED:
          await handleAvailabilityUpdated(payload.providerId, payload.oldAvailability, payload.newAvailability);
          break;

        // For provider.review.submitted events, call handleProviderReviewSubmitted
        case PROVIDER_EVENTS.REVIEW_SUBMITTED:
          await handleProviderReviewSubmitted(payload);
          break;

        // For provider.service-area.updated events, call handleProviderServiceAreaUpdated
        case PROVIDER_EVENTS.SERVICE_AREA_UPDATED:
          await handleProviderServiceAreaUpdated(payload.providerId);
          break;

        // Log any unhandled event types
        default:
          logger.warn(`Unhandled event type: ${channel}`);
      }
    } catch (error) {
      // Catch and log any errors during event handling
      logger.error('Error handling provider event', {
        channel,
        message,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
}

/**
 * Initializes all provider event subscribers
 * @returns Promise that resolves when initialization is complete
 */
async function initializeProviderSubscribers(): Promise<void> {
  try {
    // Log the start of provider subscribers initialization
    logger.info('Initializing provider subscribers...');

    // Set up provider event listeners
    setupProviderEventListeners();

    // Subscribe to provider event channels
    await subscribeToProviderEvents();

    // Log successful initialization of provider subscribers
    logger.info('Successfully initialized provider subscribers');
  } catch (error) {
    // Catch and log any errors during initialization
    logger.error('Error initializing provider subscribers', {
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

// Export function to initialize provider event subscribers during application startup
export { initializeProviderSubscribers };

// Export provider event type constants for use throughout the application
export { PROVIDER_EVENTS };