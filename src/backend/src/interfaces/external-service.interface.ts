/**
 * External Service Interface
 * 
 * This file defines the interfaces and types for all external service integrations
 * in the Revolucare platform. It provides a standardized contract for service implementations
 * including AI services, calendar integrations, email services, payment processing,
 * SMS notifications, and document storage.
 */

/**
 * Enum defining the types of external services integrated with the platform
 */
export enum ExternalServiceType {
  AI = 'ai',
  CALENDAR = 'calendar',
  EMAIL = 'email',
  PAYMENT = 'payment',
  SMS = 'sms',
  STORAGE = 'storage'
}

/**
 * Type defining possible status values for external services
 */
export type ServiceStatus = 'available' | 'unavailable' | 'degraded';

/**
 * Interface for retry configuration used by external service clients
 */
export interface RetryConfig {
  /**
   * Maximum number of retry attempts
   */
  maxRetries: number;
  
  /**
   * Initial delay in milliseconds before the first retry
   */
  initialDelay: number;
  
  /**
   * Maximum delay in milliseconds between retries
   */
  maxDelay: number;
  
  /**
   * Multiplier for exponential backoff between retries
   */
  backoffFactor: number;
  
  /**
   * HTTP status codes that should trigger a retry
   */
  retryableStatusCodes: number[];
}

/**
 * Base interface for all external service configurations
 */
export interface BaseServiceConfig {
  /**
   * Type of external service
   */
  serviceType: ExternalServiceType;
  
  /**
   * Request timeout in milliseconds
   */
  timeout: number;
  
  /**
   * Retry configuration
   */
  retryConfig: RetryConfig;
  
  /**
   * Whether the service is enabled
   */
  enabled: boolean;
}

/**
 * Interface for AI service configuration
 */
export interface AIServiceConfig extends BaseServiceConfig {
  serviceType: ExternalServiceType.AI;
  
  /**
   * API key for authentication
   */
  apiKey: string;
  
  /**
   * Organization ID (if applicable)
   */
  organizationId: string;
  
  /**
   * Available AI models and their configurations
   */
  models: Record<string, any>;
  
  /**
   * API endpoint URL
   */
  endpoint: string;
}

/**
 * Interface for calendar service configuration
 */
export interface CalendarServiceConfig extends BaseServiceConfig {
  serviceType: ExternalServiceType.CALENDAR;
  
  /**
   * Calendar provider (e.g., 'google', 'microsoft')
   */
  provider: string;
  
  /**
   * OAuth client ID
   */
  clientId: string;
  
  /**
   * OAuth client secret
   */
  clientSecret: string;
  
  /**
   * OAuth redirect URI
   */
  redirectUri: string;
  
  /**
   * API endpoint
   */
  endpoint: string;
  
  /**
   * Additional provider-specific options
   */
  options: Record<string, any>;
}

/**
 * Interface for email service configuration
 */
export interface EmailServiceConfig extends BaseServiceConfig {
  serviceType: ExternalServiceType.EMAIL;
  
  /**
   * API key for authentication
   */
  apiKey: string;
  
  /**
   * Default sender email address
   */
  fromEmail: string;
  
  /**
   * Default sender name
   */
  fromName: string;
  
  /**
   * Email templates by name
   */
  templates: Record<string, string>;
}

/**
 * Interface for payment service configuration
 */
export interface PaymentServiceConfig extends BaseServiceConfig {
  serviceType: ExternalServiceType.PAYMENT;
  
  /**
   * Secret key for server-side API calls
   */
  secretKey: string;
  
  /**
   * Publishable key for client-side implementation
   */
  publishableKey: string;
  
  /**
   * Secret for webhook signature verification
   */
  webhookSecret: string;
  
  /**
   * Default currency for transactions
   */
  currency: string;
  
  /**
   * Configured webhook endpoints by event type
   */
  webhookEndpoints: Record<string, string>;
}

/**
 * Interface for SMS service configuration
 */
export interface SMSServiceConfig extends BaseServiceConfig {
  serviceType: ExternalServiceType.SMS;
  
  /**
   * Account SID for authentication
   */
  accountSid: string;
  
  /**
   * Auth token for authentication
   */
  authToken: string;
  
  /**
   * Default sender phone number
   */
  phoneNumber: string;
  
  /**
   * SMS templates by name
   */
  templates: Record<string, string>;
}

/**
 * Interface for storage service configuration
 */
export interface StorageServiceConfig extends BaseServiceConfig {
  serviceType: ExternalServiceType.STORAGE;
  
  /**
   * Storage service endpoint URL
   */
  endpoint: string;
  
  /**
   * Access key for authentication
   */
  accessKey: string;
  
  /**
   * Container/bucket name
   */
  containerName: string;
  
  /**
   * Region for the storage service
   */
  region: string;
}

/**
 * Interface for webhook payload structure
 */
export interface WebhookPayload {
  /**
   * Request body
   */
  body: Record<string, any>;
  
  /**
   * Request headers
   */
  headers: Record<string, string>;
  
  /**
   * Request timestamp
   */
  timestamp: number;
}

/**
 * Interface for service status response
 */
export interface ServiceStatusResponse {
  /**
   * Current service status
   */
  status: ServiceStatus;
  
  /**
   * Additional status details
   */
  details: Record<string, any>;
  
  /**
   * When the status was last checked
   */
  lastChecked: Date;
}

/**
 * Interface that all external service implementations must implement
 */
export interface ExternalServiceInterface {
  /**
   * Initialize the service with its configuration
   * @param config Service configuration
   * @returns Promise resolving when initialization is complete
   */
  initialize(config: BaseServiceConfig): Promise<void>;
  
  /**
   * Make a request to the external service
   * @param endpoint API endpoint or operation
   * @param payload Request payload
   * @param options Additional request options
   * @returns Promise resolving with the response
   */
  request<T>(
    endpoint: string,
    payload?: Record<string, any>,
    options?: Record<string, any>
  ): Promise<T>;
  
  /**
   * Validate an incoming webhook from the service
   * @param payload Webhook payload
   * @returns Promise resolving to a boolean indicating if the webhook is valid
   */
  validateWebhook(payload: WebhookPayload): Promise<boolean>;
  
  /**
   * Get the current status of the service
   * @returns Promise resolving with the service status
   */
  getStatus(): Promise<ServiceStatusResponse>;
}

/**
 * Default timeout in milliseconds for external service requests
 */
export const DEFAULT_TIMEOUT = 30000;

/**
 * Default retry configuration for external service requests
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504]
};