/**
 * Twilio Integration Service
 * 
 * This module provides a client for interacting with the Twilio SMS API.
 * It implements the ExternalServiceInterface for standardized integration
 * with the notification system of the Revolucare platform.
 * 
 * @module integrations/twilio
 */

import twilio from 'twilio'; // twilio@4.11.0
import { smsConfig } from '../config/sms';
import { 
  ExternalServiceInterface, 
  ExternalServiceType, 
  ServiceStatus, 
  WebhookPayload, 
  ServiceStatusResponse 
} from '../interfaces/external-service.interface';
import { logger } from '../utils/logger';
import { errorFactory } from '../utils/error-handler';

/**
 * Formats a message template by replacing placeholders with actual values
 * 
 * @param template Template string with {{variable}} placeholders
 * @param variables Object containing variable values to insert into template
 * @returns Formatted message with variables replaced
 */
function formatTemplateMessage(template: string, variables: Record<string, string>): string {
  // Return template as-is if no variables or template is missing
  if (!template || !variables || Object.keys(variables).length === 0) {
    return template;
  }
  
  // Replace each {{variable}} with its value
  return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    return variables[key] !== undefined ? variables[key] : match;
  });
}

/**
 * Service class that implements the ExternalServiceInterface for Twilio SMS integration
 */
class TwilioService implements ExternalServiceInterface {
  private client: any | null = null;
  private initialized: boolean = false;
  private lastStatusCheck: Date | null = null;
  
  /**
   * Creates a new instance of the TwilioService
   */
  constructor() {
    this.client = null;
    this.initialized = false;
    this.lastStatusCheck = null;
  }

  /**
   * Initializes the Twilio client with credentials from configuration
   */
  async initialize(): Promise<void> {
    // Check if SMS service is enabled
    if (!smsConfig.enabled) {
      logger.info('SMS service is disabled in configuration');
      return;
    }
    
    try {
      // Create a new Twilio client with credentials from config
      const { accountSid, authToken } = smsConfig;
      this.client = twilio(accountSid, authToken);
      this.initialized = true;
      
      logger.info('Twilio SMS service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Twilio SMS service', { error });
      throw errorFactory.createError(
        'Failed to initialize SMS service', 
        'EXTERNAL_SERVICE_ERROR', 
        { service: 'twilio' }, 
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
  
  /**
   * Implements the request method from ExternalServiceInterface
   * For Twilio, this method sends an SMS message
   * 
   * @param params Parameters for the SMS message including to, body, from, and mediaUrl
   * @returns Promise resolving with the Twilio API response
   */
  async request<T>({ to, body, from, mediaUrl }: { 
    to: string; 
    body: string; 
    from?: string; 
    mediaUrl?: string[] 
  }): Promise<T> {
    // Check if service is initialized
    if (!this.initialized || !this.client) {
      throw errorFactory.createError(
        'SMS service not initialized', 
        'EXTERNAL_SERVICE_ERROR', 
        { service: 'twilio' }
      );
    }
    
    // Validate required parameters
    if (!to || !body) {
      throw errorFactory.createValidationError(
        'Missing required parameters for SMS message', 
        { 
          required: ['to', 'body'],
          provided: { to: Boolean(to), body: Boolean(body) }
        }
      );
    }
    
    try {
      // Format phone number if needed
      const formattedTo = this.formatPhoneNumber(to);
      
      // Set the from number to the configured phone number if not provided
      const fromNumber = from || smsConfig.phoneNumber;
      
      // Send the message
      const response = await this.client.messages.create({
        to: formattedTo,
        from: fromNumber,
        body,
        mediaUrl
      });
      
      logger.info('SMS message sent successfully', { 
        to: formattedTo, 
        from: fromNumber, 
        sid: response.sid 
      });
      
      return response as T;
    } catch (error) {
      logger.error('Failed to send SMS message', { 
        error, 
        to 
      });
      
      throw errorFactory.createError(
        'Failed to send SMS message', 
        'NOTIFICATION_ERROR', 
        { service: 'twilio' }, 
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
  
  /**
   * Sends an SMS using a predefined template with variable substitution
   * 
   * @param to Recipient phone number
   * @param templateName Name of the template to use
   * @param variables Variables to substitute in the template
   * @param options Additional SMS options like from and mediaUrl
   * @returns Promise resolving with the Twilio API response
   */
  async sendTemplatedMessage(
    to: string,
    templateName: string,
    variables: Record<string, string>,
    options: { from?: string; mediaUrl?: string[] } = {}
  ): Promise<{ sid: string; status: string; [key: string]: any }> {
    // Check if service is initialized
    if (!this.initialized || !this.client) {
      throw errorFactory.createError(
        'SMS service not initialized', 
        'EXTERNAL_SERVICE_ERROR', 
        { service: 'twilio' }
      );
    }
    
    // Validate that the template exists
    if (!smsConfig.templates[templateName]) {
      throw errorFactory.createValidationError(
        `SMS template "${templateName}" not found`, 
        { 
          availableTemplates: Object.keys(smsConfig.templates) 
        }
      );
    }
    
    try {
      // Get the template and format it with variables
      const template = smsConfig.templates[templateName];
      const formattedMessage = formatTemplateMessage(template, variables);
      
      // Send the message
      return await this.request({
        to,
        body: formattedMessage,
        from: options.from,
        mediaUrl: options.mediaUrl
      });
    } catch (error) {
      logger.error('Failed to send templated SMS message', { 
        error, 
        templateName, 
        to 
      });
      
      throw errorFactory.createError(
        `Failed to send templated SMS message: ${templateName}`, 
        'NOTIFICATION_ERROR', 
        { service: 'twilio', templateName }, 
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
  
  /**
   * Validates that a webhook request is authentic and from Twilio
   * 
   * @param payload Webhook payload containing headers and body
   * @returns Promise resolving to true if the webhook is valid
   */
  async validateWebhook(payload: WebhookPayload): Promise<boolean> {
    // Check if service is initialized
    if (!this.initialized || !this.client) {
      throw errorFactory.createError(
        'SMS service not initialized', 
        'EXTERNAL_SERVICE_ERROR', 
        { service: 'twilio' }
      );
    }
    
    try {
      // Extract the Twilio signature from headers
      const twilioSignature = payload.headers['x-twilio-signature'];
      
      if (!twilioSignature) {
        logger.warn('Missing Twilio signature in webhook request');
        return false;
      }
      
      // Get the webhook URL from the host and path in headers
      const webhookUrl = `https://${payload.headers.host}${payload.headers['x-original-url'] || ''}`;
      
      // Use Twilio's validator to check the signature
      const { validateRequest } = require('twilio').webhook;
      
      // Check if the request is valid
      const isValid = validateRequest(
        smsConfig.authToken,
        twilioSignature,
        webhookUrl,
        payload.body
      );
      
      if (!isValid) {
        logger.warn('Invalid Twilio webhook signature', { 
          twilioSignature, 
          webhookUrl 
        });
      }
      
      return isValid;
    } catch (error) {
      logger.error('Error validating Twilio webhook', { error });
      throw errorFactory.createError(
        'Failed to validate Twilio webhook', 
        'EXTERNAL_SERVICE_ERROR', 
        { service: 'twilio' }, 
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
  
  /**
   * Checks the current status of the Twilio service
   * 
   * @returns Promise resolving with the current service status
   */
  async getStatus(): Promise<ServiceStatusResponse> {
    // If service is not initialized, return unavailable status
    if (!this.initialized || !this.client) {
      return {
        status: 'unavailable' as ServiceStatus,
        details: { reason: 'Service not initialized' },
        lastChecked: new Date()
      };
    }
    
    try {
      // Make a test API call to verify connectivity
      // We'll just fetch the account info as a lightweight check
      await this.client.api.accounts(smsConfig.accountSid).fetch();
      
      // If successful, service is available
      this.lastStatusCheck = new Date();
      
      return {
        status: 'available' as ServiceStatus,
        details: { 
          accountSid: smsConfig.accountSid 
        },
        lastChecked: this.lastStatusCheck
      };
    } catch (error) {
      logger.error('Twilio service status check failed', { error });
      
      this.lastStatusCheck = new Date();
      
      return {
        status: 'unavailable' as ServiceStatus,
        details: { 
          error: error instanceof Error ? error.message : String(error),
          accountSid: smsConfig.accountSid
        },
        lastChecked: this.lastStatusCheck
      };
    }
  }
  
  /**
   * Formats a phone number to ensure it has the correct format for Twilio
   * 
   * @param phoneNumber Phone number to format
   * @returns Formatted phone number
   */
  private formatPhoneNumber(phoneNumber: string): string {
    // Remove any non-digit characters except for leading +
    let formatted = phoneNumber.replace(/^(\+)|[^\d+]/g, '$1');
    
    // If doesn't start with +, add +1 (assuming US number)
    if (!formatted.startsWith('+')) {
      formatted = `+1${formatted}`;
    }
    
    return formatted;
  }
}

// Create a singleton instance for use throughout the application
export const twilioService = new TwilioService();