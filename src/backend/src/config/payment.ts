/**
 * Payment Configuration
 * 
 * Configuration module for payment processing services in the Revolucare platform.
 * Exports payment-related configuration settings including Stripe API keys, webhook
 * secrets, default currency, and webhook endpoints.
 */

import dotenv from 'dotenv'; // dotenv@16.0.3
import { ExternalServiceType, PaymentServiceConfig } from '../interfaces/external-service.interface';
import { logger } from './logger';

// Ensure environment variables are loaded
dotenv.config();

// Stripe API configuration
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

/**
 * Validates that all required payment configuration values are present
 * @returns True if configuration is valid, false otherwise
 */
const validatePaymentConfig = (): boolean => {
  const missingConfigs: string[] = [];
  
  if (!STRIPE_SECRET_KEY) {
    missingConfigs.push('STRIPE_SECRET_KEY');
  }
  
  if (!STRIPE_PUBLISHABLE_KEY) {
    missingConfigs.push('STRIPE_PUBLISHABLE_KEY');
  }
  
  if (!STRIPE_WEBHOOK_SECRET) {
    missingConfigs.push('STRIPE_WEBHOOK_SECRET');
  }
  
  if (missingConfigs.length > 0) {
    logger.warn(`Missing required payment configuration: ${missingConfigs.join(', ')}`);
    return false;
  }
  
  logger.info('Payment configuration validated successfully');
  return true;
};

// Validate payment configuration on module load
const isConfigValid = validatePaymentConfig();

/**
 * Stripe configuration settings
 */
export const stripe = {
  secretKey: STRIPE_SECRET_KEY,
  publishableKey: STRIPE_PUBLISHABLE_KEY,
  webhookSecret: STRIPE_WEBHOOK_SECRET,
  apiVersion: '2023-10-16' // Using a recent Stripe API version
};

/**
 * Default currency for payment processing
 */
export const currency = 'USD';

/**
 * Webhook endpoint paths for different payment events
 */
export const webhookEndpoints = {
  paymentIntent: '/api/webhooks/payment/intent',
  subscription: '/api/webhooks/payment/subscription',
  refund: '/api/webhooks/payment/refund'
};

/**
 * Complete payment service configuration object conforming to PaymentServiceConfig interface
 */
export const paymentConfig: PaymentServiceConfig = {
  serviceType: ExternalServiceType.PAYMENT,
  secretKey: stripe.secretKey,
  publishableKey: stripe.publishableKey,
  webhookSecret: stripe.webhookSecret,
  currency,
  webhookEndpoints,
  timeout: 30000, // 30 seconds timeout for payment operations
  retryConfig: {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2,
    retryableStatusCodes: [408, 429, 500, 502, 503, 504]
  },
  enabled: isConfigValid
};

// Default export of the payment configuration
export default paymentConfig;