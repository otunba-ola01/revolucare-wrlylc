import { SMSServiceConfig } from '../../src/interfaces/external-service.interface';
import { NOTIFICATION_TYPES } from '../../src/constants/notification-types';
import jest from 'jest'; // jest version ^29.5.0

/**
 * Mock implementation of template formatting function
 * @param template String template with {{variable}} placeholders
 * @param variables Object with key-value pairs to replace in the template
 * @returns Formatted message with variables replaced
 */
export function formatTemplateMessage(
  template: string,
  variables: Record<string, string>
): string {
  if (!template) {
    return '';
  }

  if (!variables || Object.keys(variables).length === 0) {
    return template;
  }

  let formattedMessage = template;
  
  // Replace all {{variableName}} with corresponding values
  Object.entries(variables).forEach(([key, value]) => {
    formattedMessage = formattedMessage.replace(
      new RegExp(`{{${key}}}`, 'g'),
      value || ''
    );
  });

  return formattedMessage;
}

/**
 * Mock implementation of the Twilio service for testing
 */
class MockTwilioService {
  private initialized: boolean = false;
  private messages: Array<{ to: string; body: string; from?: string; mediaUrl?: string[] }> = [];
  private templates: Record<string, string>;
  private mockResponses: Record<string, any> = {};
  private mockStatus: { available: boolean; message: string } = { 
    available: true, 
    message: 'Service is available' 
  };

  constructor() {
    this.initialized = false;
    this.messages = [];
    // Set up default templates
    this.templates = {
      appointment_reminder: 'You have an appointment on {{date}} at {{time}} with {{provider}}.',
      care_plan_approved: 'Your care plan has been approved by {{approver}}.',
      service_plan_approved: 'Your service plan has been approved and is ready for implementation.',
      provider_matched: 'Good news! We\'ve matched you with {{providerName}} for your {{serviceType}} needs.',
      payment_processed: 'Your payment of {{amount}} has been successfully processed for {{service}}.',
      payment_failed: 'Your payment of {{amount}} for {{service}} could not be processed. Please update your payment information.'
    };
    
    this.mockResponses = {};
    this.mockStatus = { available: true, message: 'Service is available' };
  }

  /**
   * Mock implementation of Twilio service initialization
   * @returns Promise that resolves when initialization is complete
   */
  async initialize(): Promise<void> {
    this.initialized = true;
    return Promise.resolve();
  }

  /**
   * Mock implementation of sending an SMS message
   * @param params Message parameters (to, body, from, mediaUrl)
   * @returns Promise that resolves with a mock Twilio API response
   */
  async request(params: { 
    to: string; 
    body: string; 
    from?: string; 
    mediaUrl?: string[] 
  }): Promise<{ sid: string; status: string; [key: string]: any }> {
    if (!this.initialized) {
      throw new Error('Twilio service not initialized');
    }
    
    if (!params.to || !params.body) {
      throw new Error('Missing required parameters: to, body');
    }
    
    // Store the message for testing verification
    this.messages.push(params);
    
    // Check if we have a mock response/error for this method
    if (this.mockResponses['request']) {
      if (this.mockResponses['request'] instanceof Error) {
        throw this.mockResponses['request'];
      }
      return this.mockResponses['request'];
    }
    
    // Return a mock successful response
    return {
      sid: `SM${Math.random().toString(36).substring(2, 15)}`,
      status: 'sent',
      to: params.to,
      body: params.body,
      from: params.from || '+15551234567',
      dateCreated: new Date().toISOString()
    };
  }

  /**
   * Mock implementation of sending a templated SMS message
   * @param to Recipient phone number
   * @param templateName Name of the template to use
   * @param variables Variables to substitute in the template
   * @param options Additional options (from, mediaUrl)
   * @returns Promise that resolves with a mock Twilio API response
   */
  async sendTemplatedMessage(
    to: string,
    templateName: string,
    variables: Record<string, string>,
    options?: { from?: string; mediaUrl?: string[] }
  ): Promise<{ sid: string; status: string; [key: string]: any }> {
    if (!this.initialized) {
      throw new Error('Twilio service not initialized');
    }
    
    if (!this.templates[templateName]) {
      throw new Error(`Template not found: ${templateName}`);
    }
    
    const template = this.templates[templateName];
    const formattedMessage = formatTemplateMessage(template, variables);
    
    // Check if we have a mock response/error for this method
    if (this.mockResponses['sendTemplatedMessage']) {
      if (this.mockResponses['sendTemplatedMessage'] instanceof Error) {
        throw this.mockResponses['sendTemplatedMessage'];
      }
      return this.mockResponses['sendTemplatedMessage'];
    }
    
    // Use the request method to send the formatted message
    return this.request({
      to,
      body: formattedMessage,
      ...options
    });
  }

  /**
   * Mock implementation of webhook validation
   * @param payload Webhook payload (body, headers, timestamp)
   * @returns Promise that resolves to true if the webhook is valid
   */
  async validateWebhook(payload: { 
    body: Record<string, any>; 
    headers: Record<string, string>; 
    timestamp: number 
  }): Promise<boolean> {
    // For testing purposes, always return true
    return Promise.resolve(true);
  }

  /**
   * Mock implementation of getting service status
   * @returns Promise that resolves with the current mock service status
   */
  async getStatus(): Promise<{ status: string; details: Record<string, any>; lastChecked: Date }> {
    return {
      status: this.mockStatus.available ? 'available' : 'unavailable',
      details: {
        message: this.mockStatus.message,
        twilioStatus: this.mockStatus.available ? 'up' : 'down'
      },
      lastChecked: new Date()
    };
  }

  /**
   * Test helper to set the mock service status
   * @param status Status object with available flag and message
   */
  setMockStatus(status: { available: boolean; message: string }): void {
    this.mockStatus = status;
  }

  /**
   * Test helper to set a mock response or error
   * @param method Method name to mock ('request', 'sendTemplatedMessage', etc.)
   * @param response Response object or Error to return
   */
  setMockResponse(method: string, response: any): void {
    this.mockResponses[method] = response;
  }

  /**
   * Test helper to get all sent messages
   * @returns Array of all messages sent through the mock service
   */
  getMessages(): Array<{ to: string; body: string; from?: string; mediaUrl?: string[] }> {
    return this.messages;
  }

  /**
   * Test helper to clear the sent messages
   */
  clearMessages(): void {
    this.messages = [];
  }

  /**
   * Test helper to reset the mock service to its initial state
   */
  reset(): void {
    this.initialized = false;
    this.messages = [];
    this.mockResponses = {};
    this.mockStatus = { available: true, message: 'Service is available' };
  }
}

/**
 * Mock implementation of the SMS service for testing
 */
class MockSMSService {
  private initialized: boolean = false;
  private mockTwilioService: MockTwilioService;
  private sentMessages: Array<{ 
    to: string; 
    message: string; 
    templateName?: string; 
    variables?: Record<string, string> 
  }> = [];

  constructor() {
    this.initialized = false;
    this.mockTwilioService = new MockTwilioService();
    this.sentMessages = [];
  }

  /**
   * Mock implementation of SMS service initialization
   * @returns Promise that resolves when initialization is complete
   */
  async initialize(): Promise<void> {
    await this.mockTwilioService.initialize();
    this.initialized = true;
    return Promise.resolve();
  }

  /**
   * Checks if the SMS service is initialized
   * @returns True if the service is initialized, false otherwise
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Gets the current status of the SMS service
   * @returns Status object indicating if the service is available
   */
  async getStatus(): Promise<{ available: boolean; message: string }> {
    if (!this.initialized) {
      return { available: false, message: 'SMS service not initialized' };
    }
    
    const status = await this.mockTwilioService.getStatus();
    return { 
      available: status.status === 'available',
      message: status.details.message 
    };
  }

  /**
   * Mock implementation of sending an SMS message
   * @param to Recipient phone number
   * @param message Message content
   * @param options Additional options (mediaUrl)
   * @returns Result of the SMS sending operation
   */
  async sendSMS(
    to: string,
    message: string,
    options?: { mediaUrl?: string[] }
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.initialized) {
      throw new Error('SMS service not initialized');
    }
    
    if (!to || !message) {
      throw new Error('Missing required parameters: to, message');
    }
    
    // Store the message for testing verification
    this.sentMessages.push({ to, message });
    
    try {
      const result = await this.mockTwilioService.request({
        to,
        body: message,
        ...options
      });
      
      return {
        success: true,
        messageId: result.sid
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Mock implementation of sending a templated SMS message
   * @param to Recipient phone number
   * @param templateName Name of the template to use
   * @param variables Variables to substitute in the template
   * @param options Additional options (mediaUrl)
   * @returns Result of the SMS sending operation
   */
  async sendTemplatedSMS(
    to: string,
    templateName: string,
    variables: Record<string, string>,
    options?: { mediaUrl?: string[] }
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.initialized) {
      throw new Error('SMS service not initialized');
    }
    
    // Store the message for testing verification
    this.sentMessages.push({ 
      to, 
      message: '', // Will be filled by template 
      templateName,
      variables 
    });
    
    try {
      const result = await this.mockTwilioService.sendTemplatedMessage(
        to,
        templateName,
        variables,
        options
      );
      
      return {
        success: true,
        messageId: result.sid
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Mock implementation of sending an SMS notification based on notification type
   * @param to Recipient phone number
   * @param notificationType Type of notification to send
   * @param data Data to include in the notification
   * @returns Result of the notification sending operation
   */
  async sendNotification(
    to: string,
    notificationType: string,
    data: Record<string, string>
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.initialized) {
      throw new Error('SMS service not initialized');
    }
    
    // Check if the notification type is supported
    switch (notificationType) {
      case NOTIFICATION_TYPES.APPOINTMENT_REMINDER:
      case NOTIFICATION_TYPES.CARE_PLAN_APPROVED:
      case NOTIFICATION_TYPES.SERVICE_PLAN_APPROVED:
      case NOTIFICATION_TYPES.PROVIDER_MATCHED:
      case NOTIFICATION_TYPES.PAYMENT_PROCESSED:
      case NOTIFICATION_TYPES.PAYMENT_FAILED:
        break;
      default:
        return {
          success: false,
          error: `Unsupported notification type: ${notificationType}`
        };
    }
    
    // Store the notification for testing verification
    this.sentMessages.push({ 
      to, 
      message: '', // Will be filled by template
      templateName: notificationType,
      variables: data 
    });
    
    return this.sendTemplatedSMS(to, notificationType, data);
  }

  /**
   * Test helper to get all sent messages
   * @returns Array of all messages sent through the mock service
   */
  getSentMessages(): Array<{ 
    to: string; 
    message: string; 
    templateName?: string; 
    variables?: Record<string, string> 
  }> {
    return this.sentMessages;
  }

  /**
   * Test helper to clear the sent messages
   */
  clearSentMessages(): void {
    this.sentMessages = [];
  }

  /**
   * Test helper to set the mock service status
   * @param status Status object with available flag and message
   */
  setMockStatus(status: { available: boolean; message: string }): void {
    this.mockTwilioService.setMockStatus(status);
  }

  /**
   * Test helper to set a mock response or error
   * @param method Method name to mock ('request', 'sendTemplatedMessage', etc.)
   * @param response Response object or Error to return
   */
  setMockResponse(method: string, response: any): void {
    this.mockTwilioService.setMockResponse(method, response);
  }

  /**
   * Test helper to reset the mock service to its initial state
   */
  reset(): void {
    this.initialized = false;
    this.sentMessages = [];
    this.mockTwilioService.reset();
  }
}

// Create and export instances
export const mockTwilioService = new MockTwilioService();
export const mockSmsService = new MockSMSService();

/**
 * Mock SMS configuration for testing
 */
export const mockSmsConfig: SMSServiceConfig = {
  serviceType: 'sms' as any, // Type assertion to satisfy the interface
  timeout: 10000,
  retryConfig: {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2,
    retryableStatusCodes: [408, 429, 500, 502, 503, 504]
  },
  enabled: true,
  accountSid: 'MOCK_ACCOUNT_SID',
  authToken: 'MOCK_AUTH_TOKEN',
  phoneNumber: '+15551234567',
  templates: {
    appointment_reminder: 'You have an appointment on {{date}} at {{time}} with {{provider}}.',
    care_plan_approved: 'Your care plan has been approved by {{approver}}.',
    service_plan_approved: 'Your service plan has been approved and is ready for implementation.',
    provider_matched: 'Good news! We\'ve matched you with {{providerName}} for your {{serviceType}} needs.',
    payment_processed: 'Your payment of {{amount}} has been successfully processed for {{service}}.',
    payment_failed: 'Your payment of {{amount}} for {{service}} could not be processed. Please update your payment information.'
  }
};