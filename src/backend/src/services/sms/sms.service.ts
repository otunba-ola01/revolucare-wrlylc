/**
 * SMS Service module for the Revolucare platform.
 * 
 * This service provides a high-level interface for sending SMS notifications,
 * handling templating, error management, and integration with Twilio.
 * It supports both direct message sending and template-based notifications.
 * 
 * @module services/sms
 */

import { twilioService } from '../../integrations/twilio';
import { smsConfig } from '../../config/sms';
import { logger } from '../../utils/logger';
import { errorFactory } from '../../utils/error-handler';
import { NOTIFICATION_TYPES } from '../../constants/notification-types';

/**
 * Formats SMS content to ensure it meets length requirements and includes necessary disclaimers
 * 
 * @param content - The message content to format
 * @returns Formatted SMS content with appropriate length and disclaimers
 */
function formatSMSContent(content: string): string {
  // Trim the content to remove extra whitespace
  let formattedContent = content.trim();
  
  // Standard disclaimer for SMS messages (regulatory requirement)
  const disclaimer = 'Reply HELP for help or STOP to unsubscribe.';
  
  // Check if content already includes the disclaimer
  if (!formattedContent.includes(disclaimer)) {
    // SMS standard length is 160 characters for a single message
    // Reserve space for disclaimer and separator
    const maxContentLength = 160 - disclaimer.length - 3; // 3 chars for separator " - "
    
    // If content is too long, truncate and add ellipsis
    if (formattedContent.length > maxContentLength) {
      formattedContent = formattedContent.substring(0, maxContentLength - 3) + '...';
    }
    
    // Append disclaimer
    formattedContent = `${formattedContent} - ${disclaimer}`;
  }
  
  return formattedContent;
}

/**
 * Service class that provides methods for sending SMS notifications
 */
class SMSService {
  private initialized: boolean = false;
  
  /**
   * Creates a new SMSService instance
   */
  constructor() {
    this.initialized = false;
    this.initialize();
  }
  
  /**
   * Initializes the SMS service by setting up the Twilio integration
   * 
   * @returns Promise that resolves when initialization is complete
   */
  async initialize(): Promise<void> {
    // Check if SMS service is enabled in configuration
    if (!smsConfig.enabled) {
      logger.info('SMS service is disabled in configuration');
      return;
    }
    
    try {
      // Initialize the Twilio service
      await twilioService.initialize();
      this.initialized = true;
      
      logger.info('SMS service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize SMS service', { error });
      // Don't throw here to avoid breaking application startup
      // Service will remain in uninitialized state and return errors when used
    }
  }
  
  /**
   * Checks if the SMS service is initialized
   * 
   * @returns True if the service is initialized, false otherwise
   */
  isInitialized(): boolean {
    return this.initialized;
  }
  
  /**
   * Gets the current status of the SMS service
   * 
   * @returns Status object indicating if the service is available
   */
  async getStatus(): Promise<{ available: boolean; message: string }> {
    if (!this.initialized) {
      return { available: false, message: 'SMS service not initialized' };
    }
    
    try {
      const status = await twilioService.getStatus();
      return {
        available: status.status === 'available',
        message: status.status === 'available' 
          ? 'SMS service is available'
          : `SMS service is unavailable: ${status.details?.error || 'Unknown error'}`
      };
    } catch (error) {
      logger.error('Error checking SMS service status', { error });
      return { 
        available: false, 
        message: 'Error checking SMS service status' 
      };
    }
  }
  
  /**
   * Sends an SMS message to a specified phone number
   * 
   * @param to - Recipient phone number
   * @param message - Message content
   * @param options - Additional options like media URLs
   * @returns Result of the SMS sending operation
   */
  async sendSMS(
    to: string,
    message: string,
    options: { mediaUrl?: string[] } = {}
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // Check if service is initialized
    if (!this.initialized) {
      const error = errorFactory.createError(
        'SMS service not initialized',
        'NOTIFICATION_ERROR',
        { service: 'sms' }
      );
      
      throw error;
    }
    
    // Validate required parameters
    if (!to || !message) {
      const error = errorFactory.createValidationError(
        'Missing required parameters for SMS message',
        {
          required: ['to', 'message'],
          provided: { to: Boolean(to), message: Boolean(message) }
        }
      );
      
      throw error;
    }
    
    // Format the message
    const formattedMessage = formatSMSContent(message);
    
    try {
      // Send the message using Twilio service
      const response = await twilioService.request({
        to,
        body: formattedMessage,
        mediaUrl: options.mediaUrl
      });
      
      logger.info('SMS message sent successfully', {
        to,
        messageId: response.sid
      });
      
      return {
        success: true,
        messageId: response.sid
      };
    } catch (error) {
      logger.error('Failed to send SMS message', { error, to });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Sends an SMS using a predefined template with variable substitution
   * 
   * @param to - Recipient phone number
   * @param templateName - Name of the template to use
   * @param variables - Variables to substitute in the template
   * @param options - Additional options like media URLs
   * @returns Result of the SMS sending operation
   */
  async sendTemplatedSMS(
    to: string,
    templateName: string,
    variables: Record<string, string>,
    options: { mediaUrl?: string[] } = {}
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // Check if service is initialized
    if (!this.initialized) {
      const error = errorFactory.createError(
        'SMS service not initialized',
        'NOTIFICATION_ERROR',
        { service: 'sms' }
      );
      
      throw error;
    }
    
    // Validate that the template exists
    if (!smsConfig.templates[templateName]) {
      const error = errorFactory.createValidationError(
        `SMS template "${templateName}" not found`,
        {
          availableTemplates: Object.keys(smsConfig.templates)
        }
      );
      
      throw error;
    }
    
    try {
      // Use the Twilio service to send a templated message
      const response = await twilioService.sendTemplatedMessage(
        to,
        templateName,
        variables,
        options
      );
      
      logger.info('Templated SMS message sent successfully', {
        to,
        templateName,
        messageId: response.sid
      });
      
      return {
        success: true,
        messageId: response.sid
      };
    } catch (error) {
      logger.error('Failed to send templated SMS message', {
        error,
        to,
        templateName
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Sends an SMS notification based on notification type and data
   * 
   * @param to - Recipient phone number
   * @param notificationType - Type of notification to send
   * @param data - Data to include in the notification
   * @returns Result of the notification sending operation
   */
  async sendNotification(
    to: string,
    notificationType: string,
    data: Record<string, string>
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // Check if service is initialized
    if (!this.initialized) {
      const error = errorFactory.createError(
        'SMS service not initialized',
        'NOTIFICATION_ERROR',
        { service: 'sms' }
      );
      
      throw error;
    }
    
    // Map notification type to appropriate template
    let templateName: string;
    
    // Determine which template to use based on notification type
    switch (notificationType) {
      case NOTIFICATION_TYPES.APPOINTMENT_REMINDER:
      case NOTIFICATION_TYPES.CARE_PLAN_APPROVED:
      case NOTIFICATION_TYPES.SERVICE_PLAN_APPROVED:
      case NOTIFICATION_TYPES.PROVIDER_MATCHED:
      case NOTIFICATION_TYPES.PAYMENT_PROCESSED:
      case NOTIFICATION_TYPES.PAYMENT_FAILED:
        templateName = notificationType;
        break;
      default:
        const error = errorFactory.createValidationError(
          `Unsupported notification type for SMS: ${notificationType}`,
          {
            supportedTypes: [
              NOTIFICATION_TYPES.APPOINTMENT_REMINDER,
              NOTIFICATION_TYPES.CARE_PLAN_APPROVED,
              NOTIFICATION_TYPES.SERVICE_PLAN_APPROVED,
              NOTIFICATION_TYPES.PROVIDER_MATCHED,
              NOTIFICATION_TYPES.PAYMENT_PROCESSED,
              NOTIFICATION_TYPES.PAYMENT_FAILED
            ]
          }
        );
        
        throw error;
    }
    
    // Send using the templated message functionality
    return this.sendTemplatedSMS(to, templateName, data);
  }
}

// Create singleton instance for use throughout the application
export const smsService = new SMSService();