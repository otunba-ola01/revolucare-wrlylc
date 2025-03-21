import Stripe from 'stripe'; // stripe@12.0.0
import { paymentConfig } from '../config/payment';
import { errorFactory } from '../utils/error-handler';
import { logger } from '../utils/logger';
import { ExternalServiceInterface } from '../interfaces/external-service.interface';
import { ErrorCodes } from '../constants/error-codes';

/**
 * Creates a payment intent in Stripe for processing a payment
 * 
 * @param amount - Amount to charge in the smallest currency unit (cents)
 * @param currency - Three-letter ISO currency code
 * @param metadata - Additional metadata to attach to the payment intent
 * @param customerId - Optional customer ID to associate with the payment intent
 * @returns Promise resolving to the created payment intent
 */
const createPaymentIntent = async (
  amount: number,
  currency: string,
  metadata: Record<string, any>,
  customerId?: string
): Promise<Stripe.PaymentIntent> => {
  try {
    // Validate the amount
    if (amount <= 0) {
      throw errorFactory.createValidationError('Payment amount must be greater than zero');
    }

    // Ensure amount is an integer (in smallest currency unit)
    const amountInCents = Math.round(amount);

    // Prepare payment intent parameters
    const params: Stripe.PaymentIntentCreateParams = {
      amount: amountInCents,
      currency,
      metadata,
    };

    // Add customer ID to parameters if provided
    if (customerId) {
      params.customer = customerId;
    }

    // Create a new instance of Stripe with the secret key
    const stripe = new Stripe(paymentConfig.secretKey, {
      apiVersion: '2023-10-16',
    });

    // Create the payment intent
    const paymentIntent = await stripe.paymentIntents.create(params);
    
    logger.info('Payment intent created successfully', {
      paymentIntentId: paymentIntent.id,
      amount: amountInCents,
      currency,
    });

    return paymentIntent;
  } catch (error) {
    return handleStripeError(error);
  }
};

/**
 * Retrieves a payment intent from Stripe by ID
 * 
 * @param paymentIntentId - ID of the payment intent to retrieve
 * @returns Promise resolving to the retrieved payment intent
 */
const retrievePaymentIntent = async (
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> => {
  try {
    if (!paymentIntentId) {
      throw errorFactory.createValidationError('Payment intent ID is required');
    }

    // Create a new instance of Stripe with the secret key
    const stripe = new Stripe(paymentConfig.secretKey, {
      apiVersion: '2023-10-16',
    });

    // Retrieve the payment intent
    return await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch (error) {
    return handleStripeError(error);
  }
};

/**
 * Updates an existing payment intent in Stripe
 * 
 * @param paymentIntentId - ID of the payment intent to update
 * @param updateParams - Parameters to update
 * @returns Promise resolving to the updated payment intent
 */
const updatePaymentIntent = async (
  paymentIntentId: string,
  updateParams: Partial<Stripe.PaymentIntentUpdateParams>
): Promise<Stripe.PaymentIntent> => {
  try {
    if (!paymentIntentId) {
      throw errorFactory.createValidationError('Payment intent ID is required');
    }

    if (!updateParams || Object.keys(updateParams).length === 0) {
      throw errorFactory.createValidationError('Update parameters are required');
    }

    // Create a new instance of Stripe with the secret key
    const stripe = new Stripe(paymentConfig.secretKey, {
      apiVersion: '2023-10-16',
    });

    // Update the payment intent
    const updatedPaymentIntent = await stripe.paymentIntents.update(
      paymentIntentId,
      updateParams
    );
    
    logger.info('Payment intent updated successfully', {
      paymentIntentId,
      updatedFields: Object.keys(updateParams),
    });

    return updatedPaymentIntent;
  } catch (error) {
    return handleStripeError(error);
  }
};

/**
 * Cancels a payment intent in Stripe
 * 
 * @param paymentIntentId - ID of the payment intent to cancel
 * @param cancellationReason - Optional reason for cancellation
 * @returns Promise resolving to the canceled payment intent
 */
const cancelPaymentIntent = async (
  paymentIntentId: string,
  cancellationReason?: string
): Promise<Stripe.PaymentIntent> => {
  try {
    if (!paymentIntentId) {
      throw errorFactory.createValidationError('Payment intent ID is required');
    }

    // Create a new instance of Stripe with the secret key
    const stripe = new Stripe(paymentConfig.secretKey, {
      apiVersion: '2023-10-16',
    });

    // Prepare cancellation parameters
    const params: Stripe.PaymentIntentCancelParams = {};
    if (cancellationReason) {
      params.cancellation_reason = cancellationReason as Stripe.PaymentIntentCancelParams.CancellationReason;
    }

    // Cancel the payment intent
    const canceledPaymentIntent = await stripe.paymentIntents.cancel(
      paymentIntentId,
      params
    );
    
    logger.info('Payment intent canceled successfully', {
      paymentIntentId,
      cancellationReason,
    });

    return canceledPaymentIntent;
  } catch (error) {
    return handleStripeError(error);
  }
};

/**
 * Creates a new customer in Stripe
 * 
 * @param customerData - Customer information
 * @returns Promise resolving to the created customer
 */
const createCustomer = async (
  customerData: Stripe.CustomerCreateParams
): Promise<Stripe.Customer> => {
  try {
    if (!customerData) {
      throw errorFactory.createValidationError('Customer data is required');
    }

    // Create a new instance of Stripe with the secret key
    const stripe = new Stripe(paymentConfig.secretKey, {
      apiVersion: '2023-10-16',
    });

    // Create the customer
    const customer = await stripe.customers.create(customerData);
    
    logger.info('Customer created successfully', {
      customerId: customer.id,
      email: customer.email,
    });

    return customer;
  } catch (error) {
    return handleStripeError(error);
  }
};

/**
 * Retrieves a customer from Stripe by ID
 * 
 * @param customerId - ID of the customer to retrieve
 * @returns Promise resolving to the retrieved customer
 */
const retrieveCustomer = async (
  customerId: string
): Promise<Stripe.Customer> => {
  try {
    if (!customerId) {
      throw errorFactory.createValidationError('Customer ID is required');
    }

    // Create a new instance of Stripe with the secret key
    const stripe = new Stripe(paymentConfig.secretKey, {
      apiVersion: '2023-10-16',
    });

    // Retrieve the customer
    return await stripe.customers.retrieve(customerId) as Stripe.Customer;
  } catch (error) {
    return handleStripeError(error);
  }
};

/**
 * Constructs a Stripe event from webhook payload and signature
 * 
 * @param payload - Raw request body from webhook
 * @param signature - Stripe signature from request headers
 * @returns Promise resolving to the constructed Stripe event
 */
const constructWebhookEvent = async (
  payload: string,
  signature: string
): Promise<Stripe.Event> => {
  try {
    if (!payload || !signature) {
      throw errorFactory.createValidationError('Webhook payload and signature are required');
    }

    // Create a new instance of Stripe with the secret key
    const stripe = new Stripe(paymentConfig.secretKey, {
      apiVersion: '2023-10-16',
    });

    // Construct the event using Stripe's webhook verification
    return stripe.webhooks.constructEvent(
      payload,
      signature,
      paymentConfig.webhookSecret
    );
  } catch (error) {
    return handleStripeError(error);
  }
};

/**
 * Creates a refund for a payment in Stripe
 * 
 * @param refundParams - Refund parameters including payment intent ID
 * @returns Promise resolving to the created refund
 */
const createRefund = async (
  refundParams: Stripe.RefundCreateParams
): Promise<Stripe.Refund> => {
  try {
    if (!refundParams) {
      throw errorFactory.createValidationError('Refund parameters are required');
    }

    // Create a new instance of Stripe with the secret key
    const stripe = new Stripe(paymentConfig.secretKey, {
      apiVersion: '2023-10-16',
    });

    // Create the refund
    const refund = await stripe.refunds.create(refundParams);
    
    logger.info('Refund created successfully', {
      refundId: refund.id,
      paymentIntentId: refundParams.payment_intent,
      amount: refund.amount,
    });

    return refund;
  } catch (error) {
    return handleStripeError(error);
  }
};

/**
 * Retrieves a refund from Stripe by ID
 * 
 * @param refundId - ID of the refund to retrieve
 * @returns Promise resolving to the retrieved refund
 */
const retrieveRefund = async (
  refundId: string
): Promise<Stripe.Refund> => {
  try {
    if (!refundId) {
      throw errorFactory.createValidationError('Refund ID is required');
    }

    // Create a new instance of Stripe with the secret key
    const stripe = new Stripe(paymentConfig.secretKey, {
      apiVersion: '2023-10-16',
    });

    // Retrieve the refund
    return await stripe.refunds.retrieve(refundId);
  } catch (error) {
    return handleStripeError(error);
  }
};

/**
 * Handles Stripe API errors and transforms them into application errors
 * 
 * @param error - The error to handle
 * @throws AppError with appropriate error code and details
 */
const handleStripeError = (error: Error): never => {
  // Check if this is a Stripe error
  if (error instanceof Stripe.errors.StripeError) {
    // Extract error details
    const errorDetails = {
      type: error.type,
      code: error.code,
      param: error.param,
      decline_code: error.decline_code,
      stripeErrorMessage: error.message,
    };

    // Map Stripe error types to application error codes
    let errorCode = ErrorCodes.PAYMENT_PROCESSING_ERROR;
    
    switch (error.type) {
      case 'card_error':
      case 'validation_error':
        errorCode = ErrorCodes.VALIDATION_ERROR;
        break;
      case 'rate_limit_error':
        errorCode = ErrorCodes.RATE_LIMIT_EXCEEDED;
        break;
      case 'authentication_error':
        errorCode = ErrorCodes.UNAUTHORIZED;
        break;
      case 'api_connection_error':
      case 'api_error':
        errorCode = ErrorCodes.EXTERNAL_SERVICE_ERROR;
        break;
      case 'idempotency_error':
      case 'invalid_request_error':
        errorCode = ErrorCodes.BAD_REQUEST;
        break;
    }

    logger.error(`Stripe error: ${error.message}`, {
      type: error.type,
      code: error.code,
      param: error.param,
    });

    throw errorFactory.createError(
      `Payment processing error: ${error.message}`,
      errorCode,
      errorDetails,
      error
    );
  }

  // If it's not a Stripe error, rethrow as internal server error
  logger.error(`Unexpected error during payment processing: ${error.message}`, {
    stack: error.stack,
  });

  throw errorFactory.createInternalServerError(
    'An unexpected error occurred during payment processing',
    {},
    error
  );
};

/**
 * Service class that provides a wrapper around the Stripe API for payment processing
 * in the Revolucare platform. Implements the ExternalServiceInterface for consistent
 * integration with other services.
 */
class StripeService implements ExternalServiceInterface {
  private stripe: Stripe;

  /**
   * Creates a new instance of the StripeService
   */
  constructor() {
    // Initialize the Stripe client with the secret key from payment configuration
    this.stripe = new Stripe(paymentConfig.secretKey, {
      apiVersion: '2023-10-16',
    });

    logger.info('Stripe service initialized');
  }

  /**
   * Initializes the Stripe service
   * 
   * @returns Promise that resolves when initialization is complete
   */
  async initialize(): Promise<void> {
    // Validate that all required configuration is present
    if (!paymentConfig.secretKey || !paymentConfig.publishableKey || !paymentConfig.webhookSecret) {
      throw errorFactory.createError(
        'Missing required Stripe configuration',
        ErrorCodes.INTERNAL_SERVER_ERROR
      );
    }

    logger.info('Stripe service initialized successfully');
    // No additional initialization needed as constructor already sets up the client
  }

  /**
   * Creates a payment intent in Stripe
   * 
   * @param amount - Amount to charge in the smallest currency unit (cents)
   * @param currency - Three-letter ISO currency code
   * @param metadata - Additional metadata to attach to the payment intent
   * @param customerId - Optional customer ID to associate with the payment intent
   * @returns Promise resolving to the created payment intent
   */
  async createPaymentIntent(
    amount: number,
    currency: string,
    metadata: Record<string, any>,
    customerId?: string
  ): Promise<Stripe.PaymentIntent> {
    return createPaymentIntent(amount, currency, metadata, customerId);
  }

  /**
   * Retrieves a payment intent from Stripe
   * 
   * @param paymentIntentId - ID of the payment intent to retrieve
   * @returns Promise resolving to the retrieved payment intent
   */
  async retrievePaymentIntent(
    paymentIntentId: string
  ): Promise<Stripe.PaymentIntent> {
    return retrievePaymentIntent(paymentIntentId);
  }

  /**
   * Updates a payment intent in Stripe
   * 
   * @param paymentIntentId - ID of the payment intent to update
   * @param updateParams - Parameters to update
   * @returns Promise resolving to the updated payment intent
   */
  async updatePaymentIntent(
    paymentIntentId: string,
    updateParams: Partial<Stripe.PaymentIntentUpdateParams>
  ): Promise<Stripe.PaymentIntent> {
    return updatePaymentIntent(paymentIntentId, updateParams);
  }

  /**
   * Cancels a payment intent in Stripe
   * 
   * @param paymentIntentId - ID of the payment intent to cancel
   * @param cancellationReason - Optional reason for cancellation
   * @returns Promise resolving to the canceled payment intent
   */
  async cancelPaymentIntent(
    paymentIntentId: string,
    cancellationReason?: string
  ): Promise<Stripe.PaymentIntent> {
    return cancelPaymentIntent(paymentIntentId, cancellationReason);
  }

  /**
   * Creates a new customer in Stripe
   * 
   * @param customerData - Customer information
   * @returns Promise resolving to the created customer
   */
  async createCustomer(
    customerData: Stripe.CustomerCreateParams
  ): Promise<Stripe.Customer> {
    return createCustomer(customerData);
  }

  /**
   * Retrieves a customer from Stripe
   * 
   * @param customerId - ID of the customer to retrieve
   * @returns Promise resolving to the retrieved customer
   */
  async retrieveCustomer(
    customerId: string
  ): Promise<Stripe.Customer> {
    return retrieveCustomer(customerId);
  }

  /**
   * Constructs a Stripe event from webhook payload
   * 
   * @param payload - Raw request body from webhook
   * @param signature - Stripe signature from request headers
   * @returns Promise resolving to the constructed Stripe event
   */
  async constructWebhookEvent(
    payload: string,
    signature: string
  ): Promise<Stripe.Event> {
    return constructWebhookEvent(payload, signature);
  }

  /**
   * Creates a refund in Stripe
   * 
   * @param refundParams - Refund parameters including payment intent ID
   * @returns Promise resolving to the created refund
   */
  async createRefund(
    refundParams: Stripe.RefundCreateParams
  ): Promise<Stripe.Refund> {
    return createRefund(refundParams);
  }

  /**
   * Retrieves a refund from Stripe
   * 
   * @param refundId - ID of the refund to retrieve
   * @returns Promise resolving to the retrieved refund
   */
  async retrieveRefund(
    refundId: string
  ): Promise<Stripe.Refund> {
    return retrieveRefund(refundId);
  }

  /**
   * Makes a request to the external service
   * Not implemented directly as we use the Stripe SDK methods instead
   */
  async request<T>(
    endpoint: string,
    payload?: Record<string, any>,
    options?: Record<string, any>
  ): Promise<T> {
    throw errorFactory.createError(
      'Direct API requests are not supported. Use the provided methods instead.',
      ErrorCodes.BAD_REQUEST
    );
  }

  /**
   * Gets the current status of the Stripe service
   * 
   * @returns Promise resolving to the service status
   */
  async getStatus(): Promise<{ status: string; details: Record<string, any> }> {
    try {
      // Make a simple API call to check if Stripe is available
      await this.stripe.balance.retrieve();
      
      return {
        status: 'available',
        details: {
          message: 'Stripe service is operational',
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        status: 'unavailable',
        details: {
          message: 'Stripe service is currently unavailable',
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  /**
   * Validates a webhook request from Stripe
   * 
   * @param webhookData - Object containing request body and headers
   * @returns Promise resolving to a boolean indicating if the webhook is valid
   */
  async validateWebhook(
    webhookData: { body: string, headers: Record<string, string> }
  ): Promise<boolean> {
    try {
      const signature = webhookData.headers['stripe-signature'];
      
      if (!signature) {
        logger.warn('Missing Stripe signature in webhook request');
        return false;
      }
      
      // Attempt to construct the event which will validate the signature
      await constructWebhookEvent(webhookData.body, signature);
      
      return true;
    } catch (error) {
      logger.warn(`Invalid webhook signature: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }
}

// Create a singleton instance of the Stripe service
export const stripeService = new StripeService();

// Export as default for module imports
export default StripeService;