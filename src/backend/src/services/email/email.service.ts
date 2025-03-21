/**
 * Email Service
 * 
 * This service implements the INotificationDeliveryService interface for email channel delivery,
 * using SendGrid as the underlying email provider. It handles template-based emails, attachments,
 * and provides robust error handling and logging.
 */

import { emailConfig } from '../../config/email';
import { logger } from '../../utils/logger';
import { errorFactory } from '../../utils/error-handler';
import { INotificationDeliveryService } from '../../interfaces/notification.interface';
import { NotificationDeliveryResult, NotificationChannel } from '../../types/notification.types';
import { NOTIFICATION_CHANNELS } from '../../constants/notification-types';
import { SendGridService } from '../../integrations/sendgrid';

/**
 * Interface for email delivery options
 */
interface EmailDeliveryOptions {
  recipient?: string | string[];
  templateId?: string;
  templateData?: Record<string, any>;
  attachments?: Array<{ 
    content: string; 
    filename: string; 
    type: string; 
    disposition: string; 
  }>;
  cc?: string | string[];
  bcc?: string | string[];
}

/**
 * Service class that implements the INotificationDeliveryService interface for email delivery
 */
export class EmailService implements INotificationDeliveryService {
  private sendGridService: SendGridService;
  private initialized: boolean;
  private deliveryStatus: { available: boolean; details?: Record<string, any> } | null;

  /**
   * Initializes a new instance of the EmailService
   */
  constructor() {
    this.sendGridService = new SendGridService();
    this.initialized = false;
    this.deliveryStatus = null;
  }

  /**
   * Initializes the email service and underlying SendGrid service
   * @returns Promise that resolves when initialization is complete
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      logger.debug('Email service already initialized');
      return;
    }

    try {
      await this.sendGridService.initialize();
      this.initialized = true;
      logger.info('Email service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize email service', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      throw errorFactory.createError(
        'Failed to initialize email service',
        'EXTERNAL_SERVICE_ERROR',
        { service: 'email' },
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Delivers a notification through the email channel
   * @param notification The notification to deliver
   * @param options Additional delivery options
   * @returns Delivery results for each attempted channel
   */
  async deliverNotification(
    notification: any, 
    options: Record<string, any> = {}
  ): Promise<NotificationDeliveryResult[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    const emailChannel = NOTIFICATION_CHANNELS.EMAIL;

    try {
      // Validate notification
      if (!notification.userId || !notification.title || !notification.message) {
        throw new Error('Invalid notification: Missing required fields');
      }

      // Check if email channel is included in notification channels
      if (!notification.channels.includes(emailChannel)) {
        logger.debug('Email channel not requested for this notification', {
          notificationId: notification.id,
          channels: notification.channels
        });
        return [];
      }

      // Extract recipient from options or notification data
      const recipient = options.recipient || notification.data?.email || notification.data?.recipient;
      if (!recipient) {
        throw new Error('Email recipient not specified in notification data or options');
      }

      // Determine if we should use a template
      const templateId = options.templateId || this.getTemplateId(notification.type);
      
      // Send the email
      let success = false;
      if (templateId) {
        // Send template email
        success = await this.sendGridService.sendTemplateEmail({
          to: recipient,
          templateId: templateId,
          dynamicTemplateData: {
            ...notification.data,
            subject: notification.title,
            message: notification.message,
            // Add any additional template data
            ...options.templateData
          },
          attachments: options.attachments,
          cc: options.cc,
          bcc: options.bcc
        });
      } else {
        // Send regular email
        const emailContent = this.formatEmailContent(notification);
        success = await this.sendGridService.sendEmail({
          to: recipient,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
          attachments: options.attachments,
          cc: options.cc,
          bcc: options.bcc
        });
      }

      logger.info('Email notification delivered successfully', {
        notificationId: notification.id,
        recipient: typeof recipient === 'string' ? recipient : 'multiple recipients',
        useTemplate: !!templateId
      });

      return [{
        success: success,
        channel: emailChannel,
        error: null,
        metadata: {
          recipient,
          sentAt: new Date().toISOString(),
          useTemplate: !!templateId
        }
      }];
    } catch (error) {
      logger.error('Failed to deliver email notification', {
        notificationId: notification.id,
        error: error instanceof Error ? error.message : String(error)
      });

      return [{
        success: false,
        channel: emailChannel,
        error: error instanceof Error ? error.message : String(error),
        metadata: {
          attemptedAt: new Date().toISOString()
        }
      }];
    }
  }

  /**
   * Gets the current status of the email delivery service
   * @returns Status of the email delivery service
   */
  async getDeliveryStatus(): Promise<{ available: boolean; details?: Record<string, any> }> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const status = await this.sendGridService.getStatus();
      this.deliveryStatus = {
        available: status.status === 'available',
        details: {
          provider: 'SendGrid',
          service: 'email',
          lastChecked: status.lastChecked,
          ...status.details
        }
      };
      return this.deliveryStatus;
    } catch (error) {
      logger.error('Failed to get email service status', {
        error: error instanceof Error ? error.message : String(error)
      });
      
      this.deliveryStatus = {
        available: false,
        details: {
          provider: 'SendGrid',
          service: 'email',
          error: error instanceof Error ? error.message : String(error),
          checkedAt: new Date().toISOString()
        }
      };
      
      return this.deliveryStatus;
    }
  }

  /**
   * Gets the template ID for a given notification type
   * @param type The notification type
   * @returns Template ID if found, undefined otherwise
   */
  private getTemplateId(type: string): string | undefined {
    if (emailConfig.templates && type in emailConfig.templates) {
      return emailConfig.templates[type];
    }
    return undefined;
  }

  /**
   * Formats the email content from notification data
   * @param notification The notification to format
   * @returns Formatted email content with subject, html, and text
   */
  private formatEmailContent(notification: any): { subject: string; html?: string; text?: string } {
    const subject = notification.title;
    const html = notification.data?.html || `<div><h2>${notification.title}</h2><p>${notification.message}</p></div>`;
    const text = notification.message;

    return {
      subject,
      html,
      text
    };
  }
}