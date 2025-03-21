/**
 * Configuration module for SMS services in the Revolucare platform.
 * Exports SMS configuration settings loaded from environment variables,
 * including Twilio credentials, phone number, and message templates
 * for different notification types.
 * 
 * @module config/sms
 */

import dotenv from 'dotenv'; // dotenv@16.0.3
import { NOTIFICATION_TYPES } from '../constants/notification-types';
import { SMSServiceConfig } from '../interfaces/external-service.interface';
import { logger } from '../utils/logger';

/**
 * Loads SMS configuration from environment variables
 * @returns SMS service configuration object
 */
const loadSMSConfig = (): SMSServiceConfig => {
  // Load environment variables if not already loaded
  if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
  }

  // Extract SMS-related environment variables
  const accountSid = process.env.TWILIO_ACCOUNT_SID || '';
  const authToken = process.env.TWILIO_AUTH_TOKEN || '';
  const phoneNumber = process.env.TWILIO_PHONE_NUMBER || '';
  const smsEnabled = process.env.SMS_ENABLED === 'true' || false;

  // Log configuration status
  if (smsEnabled) {
    logger.info('SMS notifications enabled with Twilio configuration');
  } else {
    logger.warn('SMS notifications are disabled');
  }

  // SMS templates for different notification types
  const templates: Record<string, string> = {
    [NOTIFICATION_TYPES.APPOINTMENT_REMINDER]: 'Revolucare: Reminder for your appointment on {{date}} at {{time}} with {{provider}}. Reply HELP for help or STOP to unsubscribe.',
    [NOTIFICATION_TYPES.CARE_PLAN_APPROVED]: 'Revolucare: Your care plan has been approved. Please log in to view the details. Reply HELP for help or STOP to unsubscribe.',
    [NOTIFICATION_TYPES.SERVICE_PLAN_APPROVED]: 'Revolucare: Your service plan has been approved. Please log in to view the details. Reply HELP for help or STOP to unsubscribe.',
    [NOTIFICATION_TYPES.PROVIDER_MATCHED]: 'Revolucare: We\'ve found a provider match for your needs. Please log in to view the details. Reply HELP for help or STOP to unsubscribe.',
    [NOTIFICATION_TYPES.PAYMENT_PROCESSED]: 'Revolucare: Your payment of {{amount}} has been processed successfully. Reference: {{reference}}. Reply HELP for help or STOP to unsubscribe.',
    [NOTIFICATION_TYPES.PAYMENT_FAILED]: 'Revolucare: Your payment of {{amount}} has failed. Please log in to update your payment information. Reply HELP for help or STOP to unsubscribe.'
  };

  // Create and return SMS configuration object
  return {
    serviceType: 'sms' as const,
    accountSid,
    authToken,
    phoneNumber,
    templates,
    enabled: smsEnabled,
    timeout: 30000, // Default timeout of 30 seconds
    retryConfig: {
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 10000,
      backoffFactor: 2,
      retryableStatusCodes: [408, 429, 500, 502, 503, 504]
    }
  } as SMSServiceConfig; // Type assertion to ensure compatibility
};

// Load and export SMS configuration
export const smsConfig = loadSMSConfig();