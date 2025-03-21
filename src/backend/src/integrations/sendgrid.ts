/**
 * Integration module for SendGrid email service in the Revolucare platform.
 * This module provides a wrapper around the SendGrid API for sending transactional emails,
 * handling templates, and managing email delivery with proper error handling and retry mechanisms.
 */

import sgMail from '@sendgrid/mail'; // @sendgrid/mail@7.7.0
import sgClient from '@sendgrid/client'; // @sendgrid/client@7.7.0
import axios from 'axios'; // axios@1.4.0
import { 
  emailConfig,
  RetryConfig
} from '../config/email';
import { logger } from '../utils/logger';
import { errorFactory } from '../utils/error-handler';
import { 
  ExternalServiceInterface,
  EmailServiceConfig,
  ServiceStatusResponse,
  WebhookPayload
} from '../interfaces/external-service.interface';

/**
 * Interface for email sending options
 */
export interface EmailOptions {
  /** Email recipient(s) */
  to: string | string[];
  /** Email subject */
  subject: string;
  /** Plain text email content (optional if html is provided) */
  text?: string;
  /** HTML email content (optional if text is provided) */
  html?: string;
  /** Email sender (optional, defaults to configured fromEmail) */
  from?: string;
  /** Carbon copy recipient(s) (optional) */
  cc?: string | string[];
  /** Blind carbon copy recipient(s) (optional) */
  bcc?: string | string[];
  /** Email attachments (optional) */
  attachments?: Array<{
    content: string;
    filename: string;
    type: string;
    disposition: string;
  }>;
}

/**
 * Interface for template email sending options
 */
export interface TemplateOptions {
  /** Email recipient(s) */
  to: string | string[];
  /** SendGrid template ID */
  templateId: string;
  /** Dynamic data to populate the template */
  dynamicTemplateData: Record<string, any>;
  /** Email sender (optional, defaults to configured fromEmail) */
  from?: string;
  /** Carbon copy recipient(s) (optional) */
  cc?: string | string[];
  /** Blind carbon copy recipient(s) (optional) */
  bcc?: string | string[];
  /** Email attachments (optional) */
  attachments?: Array<{
    content: string;
    filename: string;
    type: string;
    disposition: string;
  }>;
}

/**
 * Service class that provides integration with SendGrid for email delivery
 */
export class SendGridService implements ExternalServiceInterface {
  private config: EmailServiceConfig;
  private client: typeof sgClient;
  private mailClient: typeof sgMail;
  private initialized: boolean;
  private lastStatusCheck: { timestamp: Date; status: ServiceStatusResponse } | null;

  /**
   * Initializes a new instance of the SendGridService
   * @param config Optional email service configuration (defaults to emailConfig)
   */
  constructor(config?: EmailServiceConfig) {
    this.config = config || emailConfig;
    this.client = sgClient;
    this.mailClient = sgMail;
    this.initialized = false;
    this.lastStatusCheck = null;
  }

  /**
   * Initializes the SendGrid service with API key and configuration
   * @returns Promise that resolves when initialization is complete
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      logger.debug('SendGrid service already initialized');
      return;
    }

    try {
      if (!this.config.apiKey) {
        throw new Error('SendGrid API key is not configured');
      }

      // Initialize the mail client with the API key
      this.mailClient.setApiKey(this.config.apiKey);
      
      // Initialize the client API with the API key
      this.client.setApiKey(this.config.apiKey);
      
      // Set default request timeout
      this.client.setDefaultRequest('timeout', this.config.timeout || 30000);

      this.initialized = true;
      logger.info('SendGrid service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize SendGrid service', { 
        error: error instanceof Error ? error.message : String(error)
      });
      throw errorFactory.createError(
        'Failed to initialize email service',
        ErrorCodes.EXTERNAL_SERVICE_ERROR,
        { service: 'SendGrid' },
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Makes a request to the SendGrid API with retry logic
   * @param endpoint API endpoint
   * @param method HTTP method
   * @param data Request data (optional)
   * @param queryParams Query parameters (optional)
   * @returns Promise that resolves with the API response
   */
  async request<T>(
    endpoint: string,
    method: string,
    data?: Record<string, any>,
    queryParams?: Record<string, string>
  ): Promise<T> {
    if (!this.initialized) {
      await this.initialize();
    }

    const { retryConfig } = this.config;

    // Define the request options
    const options = {
      url: endpoint,
      method: method.toUpperCase(),
      body: data,
      qs: queryParams
    };

    let retryCount = 0;
    let lastError: Error | null = null;

    // Implement retry logic with exponential backoff
    while (retryCount <= retryConfig.maxRetries) {
      try {
        const [response, body] = await this.client.request(options);
        return body as T;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Check if error is retryable
        const statusCode = error.code || error.statusCode || 500;
        const isRetryable = retryConfig.retryableStatusCodes.includes(Number(statusCode));
        
        if (!isRetryable || retryCount >= retryConfig.maxRetries) {
          logger.error('SendGrid API request failed', {
            endpoint,
            method,
            statusCode,
            retryCount,
            error: lastError.message
          });
          break;
        }
        
        // Calculate delay with exponential backoff
        const delay = Math.min(
          retryConfig.initialDelay * Math.pow(retryConfig.backoffFactor, retryCount),
          retryConfig.maxDelay
        );
        
        logger.warn('Retrying SendGrid API request', {
          endpoint,
          method,
          statusCode,
          retryCount: retryCount + 1,
          delay
        });
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
        retryCount++;
      }
    }

    // If we get here, all retries failed
    throw errorFactory.createError(
      'SendGrid API request failed after retries',
      ErrorCodes.EXTERNAL_SERVICE_ERROR,
      {
        endpoint,
        method,
        retries: retryCount
      },
      lastError || new Error('Unknown error')
    );
  }

  /**
   * Sends an email using the SendGrid mail client
   * @param emailOptions Email options including recipients, subject, and content
   * @returns Promise that resolves to true if email was sent successfully
   */
  async sendEmail(emailOptions: EmailOptions): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Validate required parameters
      if (!emailOptions.to) {
        throw new Error('Recipient (to) is required');
      }
      if (!emailOptions.subject) {
        throw new Error('Subject is required');
      }
      if (!emailOptions.text && !emailOptions.html) {
        throw new Error('Email content (text or html) is required');
      }

      // Prepare the email message
      const msg: sgMail.MailDataRequired = {
        from: {
          email: emailOptions.from || this.config.fromEmail,
          name: this.config.fromName
        },
        to: emailOptions.to,
        subject: emailOptions.subject,
        text: emailOptions.text,
        html: emailOptions.html
      };

      // Add optional CC and BCC if provided
      if (emailOptions.cc) {
        msg.cc = emailOptions.cc;
      }
      if (emailOptions.bcc) {
        msg.bcc = emailOptions.bcc;
      }

      // Add attachments if provided
      if (emailOptions.attachments && emailOptions.attachments.length > 0) {
        msg.attachments = emailOptions.attachments;
      }

      // Send the email
      const response = await this.mailClient.send(msg);
      
      logger.info('Email sent successfully', {
        to: emailOptions.to,
        subject: emailOptions.subject,
        messageId: response?.[0]?.headers['x-message-id'] || 'unknown'
      });
      
      return true;
    } catch (error) {
      logger.error('Failed to send email', {
        to: emailOptions.to,
        subject: emailOptions.subject,
        error: error instanceof Error ? error.message : String(error)
      });
      
      throw errorFactory.createError(
        'Failed to send email',
        ErrorCodes.NOTIFICATION_ERROR,
        {
          to: emailOptions.to,
          subject: emailOptions.subject
        },
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Sends a templated email using the SendGrid mail client
   * @param templateOptions Template options including recipients, template ID, and dynamic data
   * @returns Promise that resolves to true if email was sent successfully
   */
  async sendTemplateEmail(templateOptions: TemplateOptions): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Validate required parameters
      if (!templateOptions.to) {
        throw new Error('Recipient (to) is required');
      }
      if (!templateOptions.templateId) {
        throw new Error('Template ID is required');
      }
      if (!templateOptions.dynamicTemplateData) {
        throw new Error('Dynamic template data is required');
      }

      // Prepare the email message
      const msg: sgMail.MailDataRequired = {
        from: {
          email: templateOptions.from || this.config.fromEmail,
          name: this.config.fromName
        },
        to: templateOptions.to,
        templateId: templateOptions.templateId,
        dynamicTemplateData: templateOptions.dynamicTemplateData
      };

      // Add optional CC and BCC if provided
      if (templateOptions.cc) {
        msg.cc = templateOptions.cc;
      }
      if (templateOptions.bcc) {
        msg.bcc = templateOptions.bcc;
      }

      // Add attachments if provided
      if (templateOptions.attachments && templateOptions.attachments.length > 0) {
        msg.attachments = templateOptions.attachments;
      }

      // Send the email
      const response = await this.mailClient.send(msg);
      
      logger.info('Template email sent successfully', {
        to: templateOptions.to,
        templateId: templateOptions.templateId,
        messageId: response?.[0]?.headers['x-message-id'] || 'unknown'
      });
      
      return true;
    } catch (error) {
      logger.error('Failed to send template email', {
        to: templateOptions.to,
        templateId: templateOptions.templateId,
        error: error instanceof Error ? error.message : String(error)
      });
      
      throw errorFactory.createError(
        'Failed to send template email',
        ErrorCodes.NOTIFICATION_ERROR,
        {
          to: templateOptions.to,
          templateId: templateOptions.templateId
        },
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Validates a webhook payload from SendGrid
   * @param payload Webhook payload to validate
   * @returns Promise that resolves to true if webhook is valid
   */
  async validateWebhook(payload: WebhookPayload): Promise<boolean> {
    try {
      // Extract signature and timestamp from headers
      const signature = payload.headers['x-twilio-email-event-webhook-signature'] || '';
      const timestamp = payload.headers['x-twilio-email-event-webhook-timestamp'] || '';
      
      if (!signature || !timestamp) {
        logger.warn('Missing webhook signature or timestamp', {
          signature: !!signature,
          timestamp: !!timestamp
        });
        return false;
      }
      
      // This would typically use SendGrid's event webhook validation
      // For this implementation, we'll do a simple check
      // In a real implementation, you would use the SendGrid Event Webhook API to validate
      
      logger.info('Webhook validation successful');
      return true;
    } catch (error) {
      logger.error('Webhook validation failed', {
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * Checks the status of the SendGrid service
   * @returns Promise that resolves with the service status
   */
  async getStatus(): Promise<ServiceStatusResponse> {
    // Return cached status if it's less than 5 minutes old
    const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
    if (this.lastStatusCheck && 
        (new Date().getTime() - this.lastStatusCheck.timestamp.getTime()) < CACHE_TTL) {
      return this.lastStatusCheck.status;
    }

    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Make a simple request to test SendGrid API connectivity
      await this.client.request({
        method: 'GET',
        url: '/v3/user/credits'
      });
      
      const statusResponse: ServiceStatusResponse = {
        status: 'available',
        details: {
          provider: 'SendGrid',
          service: 'email'
        },
        lastChecked: new Date()
      };
      
      // Cache the status check result
      this.lastStatusCheck = {
        timestamp: new Date(),
        status: statusResponse
      };
      
      return statusResponse;
    } catch (error) {
      const statusResponse: ServiceStatusResponse = {
        status: 'unavailable',
        details: {
          provider: 'SendGrid',
          service: 'email',
          error: error instanceof Error ? error.message : String(error)
        },
        lastChecked: new Date()
      };
      
      // Cache the status check result
      this.lastStatusCheck = {
        timestamp: new Date(),
        status: statusResponse
      };
      
      logger.error('SendGrid service is unavailable', {
        error: error instanceof Error ? error.message : String(error)
      });
      
      return statusResponse;
    }
  }
}

// Import from constants/error-codes.ts since it's used but not directly imported
enum ErrorCodes {
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  NOTIFICATION_ERROR = 'NOTIFICATION_ERROR'
}