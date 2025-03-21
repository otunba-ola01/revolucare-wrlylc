/**
 * Implements Redis-based event subscribers for document-related events in the Revolucare platform.
 * This file sets up listeners for document lifecycle events such as uploads, analysis completion, and status changes,
 * and routes them to the appropriate handlers.
 */

import { redisClient } from '../../config/redis'; // ioredis@5.3.2
import { logger } from '../../utils/logger';
import {
  handleDocumentUploaded,
  handleDocumentAnalyzed,
  handleDocumentStatusChanged,
} from '../handlers/document.handler';
import {
  DocumentUploadedEvent,
  DocumentAnalyzedEvent,
  DocumentStatusChangedEvent,
} from '../../types/document.types';

// Define document event type constants
export const DOCUMENT_EVENTS = {
  DOCUMENT_UPLOADED: 'document.uploaded',
  DOCUMENT_ANALYZED: 'document.analyzed',
  DOCUMENT_STATUS_CHANGED: 'document.status.changed',
};

/**
 * Subscribes to Redis channels for document-related events
 */
async function subscribeToDocumentEvents(): Promise<void> {
  try {
    // Subscribe to the document.uploaded channel
    await redisClient.subscribe(DOCUMENT_EVENTS.DOCUMENT_UPLOADED);

    // Subscribe to the document.analyzed channel
    await redisClient.subscribe(DOCUMENT_EVENTS.DOCUMENT_ANALYZED);

    // Subscribe to the document.status.changed channel
    await redisClient.subscribe(DOCUMENT_EVENTS.DOCUMENT_STATUS_CHANGED);

    // Log successful subscription to document events
    logger.info('Subscribed to document events');

    // Set up message handler for document events
    redisClient.on('message', handleDocumentEvent);
  } catch (error: any) {
    // Log any errors during subscription
    logger.error('Error subscribing to document events', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Processes incoming document events from Redis and routes to appropriate handlers
 * @param channel
 * @param message
 */
async function handleDocumentEvent(channel: string, message: string): Promise<void> {
  try {
    // Log receipt of document event on channel
    logger.info(`Received document event on channel ${channel}`, { channel, message });

    // Parse the message JSON into an event payload
    const payload = JSON.parse(message);

    // Determine the event type based on the channel
    switch (channel) {
      case DOCUMENT_EVENTS.DOCUMENT_UPLOADED:
        // For document.uploaded events, call handleDocumentUploaded with the payload
        await handleDocumentUploaded(payload as DocumentUploadedEvent);
        break;
      case DOCUMENT_EVENTS.DOCUMENT_ANALYZED:
        // For document.analyzed events, call handleDocumentAnalyzed with the payload
        await handleDocumentAnalyzed(payload as DocumentAnalyzedEvent);
        break;
      case DOCUMENT_EVENTS.DOCUMENT_STATUS_CHANGED:
        // For document.status.changed events, call handleDocumentStatusChanged with the payload
        await handleDocumentStatusChanged(payload as DocumentStatusChangedEvent);
        break;
      default:
        // For unknown event types, log a warning
        logger.warn(`Unknown document event type on channel ${channel}`, { channel });
    }
  } catch (error: any) {
    // Catch and log any errors during event processing
    logger.error(`Error processing document event on channel ${channel}`, {
      error: error instanceof Error ? error.message : String(error),
      channel,
      message,
    });
  }
}

/**
 * Initializes all document event subscribers
 */
async function initializeDocumentSubscribers(): Promise<void> {
  try {
    // Call subscribeToDocumentEvents to set up all document event subscriptions
    await subscribeToDocumentEvents();

    // Log successful initialization of document subscribers
    logger.info('Document subscribers initialized successfully');
  } catch (error: any) {
    // Log any errors during initialization
    logger.error('Document subscribers initialization failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

// Export function to initialize document event subscribers during application startup
export { initializeDocumentSubscribers };

// Export document event type constants for use in publishers
export { DOCUMENT_EVENTS };