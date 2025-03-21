/**
 * Central module for the event system in the Revolucare platform.
 * This file exports the initialization function for all event subscribers and
 * consolidates event type constants from various domains, enabling a unified
 * event-driven architecture across the application.
 *
 * @module events/index
 */

import { logger } from '../utils/logger';
import { initializeAuthSubscribers, AUTH_EVENTS } from './subscribers/auth.subscriber';
import { initializeCarePlanSubscribers } from './subscribers/care-plan.subscriber';
import { initializeDocumentSubscribers } from './subscribers/document.subscriber';
import { initializeNotificationSubscribers } from './subscribers/notification.subscriber';
import { initializeProviderSubscribers, PROVIDER_EVENTS } from './subscribers/provider.subscriber';
import { initializeServicesPlanSubscribers } from './subscribers/services-plan.subscriber';

/**
 * @global
 * Consolidated event type constants for use throughout the application
 */
export const EVENTS = {
  AUTH: AUTH_EVENTS,
  PROVIDER: PROVIDER_EVENTS,
  CARE_PLAN: {
    CARE_PLAN_CREATED: 'care-plan.created',
    CARE_PLAN_UPDATED: 'care-plan.updated',
    CARE_PLAN_APPROVED: 'care-plan.approved',
    CARE_PLAN_STATUS_CHANGED: 'care-plan.status-changed',
  },
  DOCUMENT: {
    DOCUMENT_UPLOADED: 'document.uploaded',
    DOCUMENT_ANALYZED: 'document.analyzed',
    DOCUMENT_STATUS_CHANGED: 'document.status.changed',
  },
  NOTIFICATION: {
    NOTIFICATION_CREATED: 'notification.created',
    NOTIFICATION_BULK_CREATED: 'notification.bulk.created',
    NOTIFICATION_DELIVERED: 'notification.delivered',
    NOTIFICATION_READ: 'notification.read',
  },
  SERVICES_PLAN: {
    SERVICES_PLAN_CREATED: 'services-plan.created',
    SERVICES_PLAN_UPDATED: 'services-plan.updated',
    SERVICES_PLAN_APPROVED: 'services-plan.approved',
    SERVICES_PLAN_STATUS_CHANGED: 'services-plan.status-changed',
  },
};

/**
 * Initializes all event subscribers across the application
 * @returns Promise<void> Promise that resolves when all event subscribers are initialized
 */
export async function initializeEventSystem(): Promise<void> {
  try {
    // Log the start of event system initialization
    logger.info('Initializing event system...');

    // Initialize authentication event subscribers
    await initializeAuthSubscribers();

    // Initialize care plan event subscribers
    await initializeCarePlanSubscribers();

    // Initialize document event subscribers
    await initializeDocumentSubscribers();

    // Initialize notification event subscribers
    await initializeNotificationSubscribers();

    // Initialize provider event subscribers
    await initializeProviderSubscribers();

    // Initialize services plan event subscribers
    await initializeServicesPlanSubscribers();

    // Log successful initialization of all event subscribers
    logger.info('Event system initialized successfully');
  } catch (error) {
    // Catch and log any errors during initialization
    logger.error('Error initializing event system', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}