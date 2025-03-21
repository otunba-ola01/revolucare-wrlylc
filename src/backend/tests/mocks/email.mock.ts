import { INotificationDeliveryService } from '../../src/interfaces/notification.interface';
import { NotificationDeliveryResult } from '../../src/types/notification.types';
import { NOTIFICATION_CHANNELS } from '../../src/constants/notification-types';

/**
 * Configuration options for the mock email service
 */
interface MockEmailOptions {
  shouldSucceed?: boolean;
  errorMessage?: string;
  deliveryStatus?: { available: boolean; details?: Record<string, any> };
}

/**
 * Structure of a sent email record for testing verification
 */
interface SentEmailRecord {
  recipient: string;
  subject: string;
  content: string;
  notification: any;
  timestamp: Date;
  templateId?: string;
  templateData?: Record<string, any>;
}

/**
 * Mock implementation of the EmailService for testing purposes
 */
export class MockEmailService implements INotificationDeliveryService {
  private initialized: boolean = false;
  private deliveryStatus: { available: boolean; details?: Record<string, any> } = { available: true, details: {} };
  private sentEmails: SentEmailRecord[] = [];
  private shouldSucceed: boolean;
  private errorMessage: string;

  /**
   * Initializes a new instance of the MockEmailService
   * 
   * @param shouldSucceed Whether email delivery should succeed (default: true)
   * @param errorMessage Error message to return when delivery fails
   */
  constructor(shouldSucceed = true, errorMessage = 'Email delivery failed') {
    this.shouldSucceed = shouldSucceed;
    this.errorMessage = errorMessage;
  }

  /**
   * Initializes the mock email service
   * 
   * @returns Promise that resolves when initialization is complete
   */
  async initialize(): Promise<void> {
    this.initialized = true;
    return Promise.resolve();
  }

  /**
   * Simulates delivering a notification through the email channel
   * 
   * @param notification The notification to deliver
   * @param options Optional delivery options
   * @returns Result of the simulated email delivery attempt
   */
  async deliverNotification(
    notification: any,
    options?: any
  ): Promise<NotificationDeliveryResult[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Extract recipient email from notification or options
    const recipient = options?.recipient || notification.userId || 'test@example.com';
    const subject = notification.title || 'Test Notification';
    const content = notification.message || 'This is a test notification message';
    
    // Create a record of the email
    const emailRecord: SentEmailRecord = {
      recipient,
      subject,
      content,
      notification,
      timestamp: new Date(),
      templateId: options?.templateId,
      templateData: options?.templateData
    };
    
    // Store the sent email for later verification
    this.sentEmails.push(emailRecord);

    // Return success or failure based on configuration
    if (this.shouldSucceed) {
      return [
        {
          success: true,
          channel: NOTIFICATION_CHANNELS.EMAIL,
          error: null,
          metadata: { 
            messageId: `mock-email-${Date.now()}`,
            recipient,
            sentAt: new Date().toISOString()
          }
        }
      ];
    } else {
      return [
        {
          success: false,
          channel: NOTIFICATION_CHANNELS.EMAIL,
          error: this.errorMessage,
          metadata: null
        }
      ];
    }
  }

  /**
   * Gets the current status of the mock email delivery service
   * 
   * @returns Status of the mock email delivery service
   */
  async getDeliveryStatus(): Promise<{ available: boolean; details?: Record<string, any> }> {
    return this.deliveryStatus;
  }

  /**
   * Returns all emails sent through this mock service
   * 
   * @returns Array of sent email records
   */
  getSentEmails(): SentEmailRecord[] {
    return [...this.sentEmails];
  }

  /**
   * Clears the record of sent emails
   */
  clearSentEmails(): void {
    this.sentEmails = [];
  }

  /**
   * Sets the delivery status for testing different scenarios
   * 
   * @param available Whether the service is available
   * @param details Additional status details
   */
  setDeliveryStatus(available: boolean, details: Record<string, any> = {}): void {
    this.deliveryStatus = { available, details };
  }

  /**
   * Sets whether email delivery should succeed or fail
   * 
   * @param shouldSucceed Whether email delivery should succeed
   */
  setShouldSucceed(shouldSucceed: boolean): void {
    this.shouldSucceed = shouldSucceed;
  }

  /**
   * Sets the error message for failed deliveries
   * 
   * @param errorMessage Error message to return when delivery fails
   */
  setErrorMessage(errorMessage: string): void {
    this.errorMessage = errorMessage;
  }
}

/**
 * Factory function to create a configured MockEmailService instance
 * 
 * @param options Configuration options
 * @returns Configured MockEmailService instance
 */
export function createMockEmailService(options?: MockEmailOptions): MockEmailService {
  const mockService = new MockEmailService(
    options?.shouldSucceed !== undefined ? options.shouldSucceed : true,
    options?.errorMessage || 'Email delivery failed'
  );
  
  if (options?.deliveryStatus) {
    mockService.setDeliveryStatus(
      options.deliveryStatus.available,
      options.deliveryStatus.details
    );
  }
  
  return mockService;
}