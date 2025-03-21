/**
 * Email Service Configuration
 * 
 * This module defines the email service settings including API keys, sender information,
 * and email templates used throughout the application for notifications, verifications, and alerts.
 * The Revolucare platform uses SendGrid (v4.0.1) for reliable email delivery.
 */

import { ExternalServiceType, EmailServiceConfig, RetryConfig } from '../interfaces/external-service.interface';

/**
 * Default timeout in milliseconds for email service requests
 */
export const DEFAULT_EMAIL_TIMEOUT = 30000;

/**
 * Map of template names to SendGrid template IDs
 * These template IDs correspond to pre-designed email templates in SendGrid
 */
export const EMAIL_TEMPLATES = {
  welcome: 'd-xxxxxxxxxxxx',
  passwordReset: 'd-xxxxxxxxxxxx',
  verification: 'd-xxxxxxxxxxxx',
  appointmentConfirmation: 'd-xxxxxxxxxxxx',
  appointmentReminder: 'd-xxxxxxxxxxxx',
  carePlanUpdate: 'd-xxxxxxxxxxxx',
  servicesPlanUpdate: 'd-xxxxxxxxxxxx',
  providerMatch: 'd-xxxxxxxxxxxx',
  documentUploaded: 'd-xxxxxxxxxxxx',
};

/**
 * Email service configuration object implementing EmailServiceConfig interface
 * Contains all settings needed for the email service to function properly
 */
export const emailConfig: EmailServiceConfig = {
  serviceType: ExternalServiceType.EMAIL,
  apiKey: process.env.SENDGRID_API_KEY || '',
  fromEmail: process.env.EMAIL_FROM || 'notifications@revolucare.com',
  fromName: process.env.EMAIL_FROM_NAME || 'Revolucare',
  templates: EMAIL_TEMPLATES,
  timeout: parseInt(process.env.EMAIL_TIMEOUT || DEFAULT_EMAIL_TIMEOUT.toString(), 10),
  retryConfig: {
    maxRetries: parseInt(process.env.EMAIL_MAX_RETRIES || '3', 10),
    initialDelay: parseInt(process.env.EMAIL_INITIAL_RETRY_DELAY || '1000', 10),
    maxDelay: parseInt(process.env.EMAIL_MAX_RETRY_DELAY || '10000', 10),
    backoffFactor: parseFloat(process.env.EMAIL_RETRY_BACKOFF_FACTOR || '2'),
    retryableStatusCodes: [408, 429, 500, 502, 503, 504]
  },
  enabled: process.env.EMAIL_ENABLED !== 'false'
};

/**
 * Retrieves email configuration with environment-specific settings
 * This function allows for different configurations based on the environment (development, staging, production)
 * 
 * @returns EmailServiceConfig with environment-specific settings
 */
export function getEmailConfig(): EmailServiceConfig {
  // Get environment
  const env = process.env.NODE_ENV || 'development';
  
  // Clone the base configuration to avoid modifying the original
  const config: EmailServiceConfig = {
    ...emailConfig
  };
  
  // Environment-specific adjustments
  switch (env) {
    case 'production':
      // Use production settings as is
      break;
      
    case 'staging':
      // Modify sender name for clarity in staging
      config.fromName = `${config.fromName} (Staging)`;
      // Use staging-specific API key if provided
      if (process.env.SENDGRID_STAGING_API_KEY) {
        config.apiKey = process.env.SENDGRID_STAGING_API_KEY;
      }
      break;
      
    case 'test':
      // Disable actual sending in test environment
      config.enabled = false;
      config.apiKey = 'test-api-key';
      break;
      
    case 'development':
    default:
      // Modify sender name for clarity in development
      config.fromName = `${config.fromName} (Dev)`;
      // Use development-specific API key if provided
      if (process.env.SENDGRID_DEV_API_KEY) {
        config.apiKey = process.env.SENDGRID_DEV_API_KEY;
      }
      break;
  }
  
  return config;
}