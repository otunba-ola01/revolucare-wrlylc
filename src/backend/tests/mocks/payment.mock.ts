import { PaymentServiceConfig, ExternalServiceType } from '../../src/interfaces/external-service.interface';
import { ServicesPlan, ServiceItem } from '../../src/types/services-plan.types';
import { errorFactory } from '../../src/utils/error-handler';
import { ErrorCodes } from '../../src/constants/error-codes';
import Stripe from 'stripe'; // stripe@12.0.0
import jest from 'jest'; // jest@29.5.0

// Mock payment configuration
export const mockPaymentConfig: PaymentServiceConfig = {
  serviceType: ExternalServiceType.PAYMENT,
  secretKey: 'mock_sk_test_123456789',
  publishableKey: 'mock_pk_test_123456789',
  webhookSecret: 'mock_whsec_123456789',
  currency: 'USD',
  webhookEndpoints: {
    paymentIntent: '/api/webhooks/payment-intent',
    subscription: '/api/webhooks/subscription',
    refund: '/api/webhooks/refund'
  },
  timeout: 30000,
  retryConfig: {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2,
    retryableStatusCodes: [408, 429, 500, 502, 503, 504]
  },
  enabled: true
};

// Mock payment intent
const mockPaymentIntent = {
  id: 'pi_mock_123456789',
  object: 'payment_intent',
  amount: 10000,
  currency: 'usd',
  status: 'succeeded',
  client_secret: 'pi_mock_123456789_secret_987654321',
  metadata: {
    servicesPlanId: 'mock-services-plan-id',
    serviceItemIds: 'item1,item2',
    clientId: 'mock-client-id'
  },
  created: 1625097600,
  livemode: false
};

// Mock refund
const mockRefund = {
  id: 're_mock_123456789',
  object: 'refund',
  amount: 5000,
  currency: 'usd',
  payment_intent: 'pi_mock_123456789',
  status: 'succeeded',
  reason: 'requested_by_customer',
  created: 1625097600
};

// Mock customer
const mockCustomer = {
  id: 'cus_mock_123456789',
  object: 'customer',
  email: 'customer@example.com',
  name: 'Test Customer',
  created: 1625097600,
  livemode: false
};

// Mock event
const mockEvent = {
  id: 'evt_mock_123456789',
  object: 'event',
  type: 'payment_intent.succeeded',
  data: {
    object: {
      id: 'pi_mock_123456789',
      object: 'payment_intent',
      amount: 10000,
      currency: 'usd',
      status: 'succeeded',
      metadata: {
        servicesPlanId: 'mock-services-plan-id',
        serviceItemIds: 'item1,item2',
        clientId: 'mock-client-id'
      }
    }
  },
  created: 1625097600,
  livemode: false
};

/**
 * Creates a mock payment intent with the specified parameters
 */
export function createMockPaymentIntent(
  amount: number,
  currency: string = 'usd',
  metadata: Record<string, any> = {},
  customerId?: string,
  status: string = 'succeeded'
): Stripe.PaymentIntent {
  return {
    id: `pi_mock_${Date.now()}`,
    object: 'payment_intent',
    amount,
    currency,
    status,
    client_secret: `pi_mock_${Date.now()}_secret_${Math.random().toString(36).substring(2, 11)}`,
    metadata,
    created: Math.floor(Date.now() / 1000),
    livemode: false,
    customer: customerId,
  } as Stripe.PaymentIntent;
}

/**
 * Creates a mock refund with the specified parameters
 */
export function createMockRefund(refundParams: Stripe.RefundCreateParams): Stripe.Refund {
  return {
    id: `re_mock_${Date.now()}`,
    object: 'refund',
    amount: refundParams.amount || 0,
    currency: 'usd',
    payment_intent: refundParams.payment_intent as string,
    status: 'succeeded',
    reason: refundParams.reason || 'requested_by_customer',
    created: Math.floor(Date.now() / 1000)
  } as Stripe.Refund;
}

/**
 * Creates a mock customer with the specified parameters
 */
export function createMockCustomer(customerData: Stripe.CustomerCreateParams): Stripe.Customer {
  return {
    id: `cus_mock_${Date.now()}`,
    object: 'customer',
    email: customerData.email as string,
    name: customerData.name as string,
    created: Math.floor(Date.now() / 1000),
    livemode: false
  } as Stripe.Customer;
}

/**
 * Creates a mock Stripe event with the specified parameters
 */
export function createMockEvent(type: string, data: Record<string, any>): Stripe.Event {
  return {
    id: `evt_mock_${Date.now()}`,
    object: 'event',
    type,
    data: {
      object: data
    },
    created: Math.floor(Date.now() / 1000),
    livemode: false
  } as Stripe.Event;
}

/**
 * Creates a mock services plan for testing
 */
export function createMockServicesPlan(
  id: string,
  clientId: string,
  serviceItems: ServiceItem[]
): ServicesPlan {
  const totalCost = serviceItems.reduce((sum, item) => sum + item.estimatedCost, 0);
  
  return {
    id,
    clientId,
    carePlanId: null,
    createdById: 'mock-creator-id',
    title: 'Mock Services Plan',
    description: 'Mock services plan for testing',
    needsAssessmentId: 'mock-needs-assessment-id',
    status: 'draft',
    estimatedCost: totalCost,
    approvedById: null,
    approvedAt: null,
    serviceItems,
    fundingSources: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

/**
 * Mock implementation of the Stripe service for testing
 */
export class MockStripeService {
  private mockPaymentIntents: Map<string, Stripe.PaymentIntent> = new Map();
  private mockRefunds: Map<string, Stripe.Refund> = new Map();
  private mockCustomers: Map<string, Stripe.Customer> = new Map();
  
  constructor() {
    // Initialize with some test data
    this.reset();
  }
  
  /**
   * Initializes the mock Stripe service
   */
  async initialize(): Promise<void> {
    // Nothing to initialize in the mock
    return Promise.resolve();
  }
  
  /**
   * Creates a mock payment intent
   */
  async createPaymentIntent(
    amount: number,
    currency: string,
    metadata: Record<string, any>,
    customerId?: string
  ): Promise<Stripe.PaymentIntent> {
    const paymentIntent = createMockPaymentIntent(amount, currency, metadata, customerId);
    this.mockPaymentIntents.set(paymentIntent.id, paymentIntent);
    return paymentIntent;
  }
  
  /**
   * Retrieves a mock payment intent by ID
   */
  async retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    const paymentIntent = this.mockPaymentIntents.get(paymentIntentId);
    if (!paymentIntent) {
      throw errorFactory.createNotFoundError(`Payment intent not found: ${paymentIntentId}`);
    }
    return paymentIntent;
  }
  
  /**
   * Updates a mock payment intent
   */
  async updatePaymentIntent(
    paymentIntentId: string,
    updateParams: Partial<Stripe.PaymentIntentUpdateParams>
  ): Promise<Stripe.PaymentIntent> {
    const paymentIntent = this.mockPaymentIntents.get(paymentIntentId);
    if (!paymentIntent) {
      throw errorFactory.createNotFoundError(`Payment intent not found: ${paymentIntentId}`);
    }
    
    // Update the payment intent with the provided params
    Object.assign(paymentIntent, updateParams);
    this.mockPaymentIntents.set(paymentIntentId, paymentIntent);
    
    return paymentIntent;
  }
  
  /**
   * Cancels a mock payment intent
   */
  async cancelPaymentIntent(
    paymentIntentId: string,
    cancellationReason?: string
  ): Promise<Stripe.PaymentIntent> {
    const paymentIntent = this.mockPaymentIntents.get(paymentIntentId);
    if (!paymentIntent) {
      throw errorFactory.createNotFoundError(`Payment intent not found: ${paymentIntentId}`);
    }
    
    paymentIntent.status = 'canceled';
    if (cancellationReason) {
      paymentIntent.cancellation_reason = cancellationReason as any;
    }
    
    this.mockPaymentIntents.set(paymentIntentId, paymentIntent);
    return paymentIntent;
  }
  
  /**
   * Creates a mock customer
   */
  async createCustomer(customerData: Stripe.CustomerCreateParams): Promise<Stripe.Customer> {
    const customer = createMockCustomer(customerData);
    this.mockCustomers.set(customer.id, customer);
    return customer;
  }
  
  /**
   * Retrieves a mock customer by ID
   */
  async retrieveCustomer(customerId: string): Promise<Stripe.Customer> {
    const customer = this.mockCustomers.get(customerId);
    if (!customer) {
      throw errorFactory.createNotFoundError(`Customer not found: ${customerId}`);
    }
    return customer;
  }
  
  /**
   * Constructs a mock Stripe event from webhook payload
   */
  async constructWebhookEvent(payload: string, signature: string): Promise<Stripe.Event> {
    try {
      const parsedPayload = JSON.parse(payload);
      return createMockEvent(parsedPayload.type, parsedPayload.data.object);
    } catch (error) {
      throw errorFactory.createError(
        'Invalid webhook payload',
        ErrorCodes.VALIDATION_ERROR,
        { error: error instanceof Error ? error.message : String(error) }
      );
    }
  }
  
  /**
   * Creates a mock refund
   */
  async createRefund(refundParams: Stripe.RefundCreateParams): Promise<Stripe.Refund> {
    const refund = createMockRefund(refundParams);
    this.mockRefunds.set(refund.id, refund);
    return refund;
  }
  
  /**
   * Retrieves a mock refund by ID
   */
  async retrieveRefund(refundId: string): Promise<Stripe.Refund> {
    const refund = this.mockRefunds.get(refundId);
    if (!refund) {
      throw errorFactory.createNotFoundError(`Refund not found: ${refundId}`);
    }
    return refund;
  }
  
  /**
   * Gets the current status of the mock Stripe service
   */
  async getStatus(): Promise<{ status: string; details: Record<string, any> }> {
    return {
      status: 'available',
      details: {
        paymentIntents: this.mockPaymentIntents.size,
        refunds: this.mockRefunds.size,
        customers: this.mockCustomers.size
      }
    };
  }
  
  /**
   * Validates a mock webhook request
   */
  async validateWebhook(webhookData: { body: string, headers: Record<string, string> }): Promise<boolean> {
    // Always return true for the mock
    return true;
  }
  
  /**
   * Resets the mock service state
   */
  reset(): void {
    this.mockPaymentIntents = new Map();
    this.mockRefunds = new Map();
    this.mockCustomers = new Map();
    
    // Add some initial test data
    const initialPaymentIntent = createMockPaymentIntent(10000, 'usd', {
      servicesPlanId: 'mock-services-plan-id',
      serviceItemIds: 'item1,item2',
      clientId: 'mock-client-id'
    });
    this.mockPaymentIntents.set(initialPaymentIntent.id, initialPaymentIntent);
    
    const initialCustomer = createMockCustomer({ email: 'customer@example.com', name: 'Test Customer' });
    this.mockCustomers.set(initialCustomer.id, initialCustomer);
  }
}

/**
 * Mock implementation of the payment processing service for testing
 */
export class MockPaymentProcessingService {
  private mockStripeService: MockStripeService;
  private mockServicesPlanRepository: jest.Mock;
  
  constructor() {
    this.mockStripeService = new MockStripeService();
    
    // Create mock repository functions
    this.mockServicesPlanRepository = jest.fn().mockImplementation((id: string) => {
      // Mock finding a services plan
      return createMockServicesPlan(id, 'mock-client-id', [
        {
          id: 'item1',
          servicesPlanId: id,
          serviceType: 'physical_therapy',
          providerId: 'provider1',
          description: 'Physical therapy sessions',
          frequency: '2x weekly',
          duration: '8 weeks',
          estimatedCost: 5000,
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'item2',
          servicesPlanId: id,
          serviceType: 'occupational_therapy',
          providerId: 'provider2',
          description: 'Occupational therapy sessions',
          frequency: '1x weekly',
          duration: '8 weeks',
          estimatedCost: 5000,
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);
    });
  }
  
  /**
   * Creates a mock payment intent for a service plan
   */
  async createPaymentIntent(
    servicesPlanId: string,
    serviceItemIds: string[],
    customerId: string
  ): Promise<{ clientSecret: string; paymentIntentId: string; amount: number }> {
    // Mock finding the services plan
    const servicesPlan = this.mockServicesPlanRepository(servicesPlanId);
    
    // Calculate the total amount based on service items
    const serviceItems = servicesPlan.serviceItems.filter(item => serviceItemIds.includes(item.id));
    const amount = this.calculateServiceCost(serviceItems);
    
    // Create metadata with service plan details
    const metadata = this.createPaymentMetadata(servicesPlan, serviceItems);
    
    // Call the mock Stripe service to create a payment intent
    const paymentIntent = await this.mockStripeService.createPaymentIntent(
      amount,
      'usd',
      metadata,
      customerId
    );
    
    return {
      clientSecret: paymentIntent.client_secret as string,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount
    };
  }
  
  /**
   * Processes a mock payment and updates service plan status
   */
  async processPayment(
    paymentIntentId: string
  ): Promise<{ success: boolean; servicesPlanId: string; status: string }> {
    // Retrieve the mock payment intent
    const paymentIntent = await this.mockStripeService.retrievePaymentIntent(paymentIntentId);
    
    // Extract service plan ID from metadata
    const servicesPlanId = paymentIntent.metadata?.servicesPlanId as string;
    const serviceItemIds = (paymentIntent.metadata?.serviceItemIds as string || '').split(',');
    
    // Mock updating service items status
    await this.updateServiceItemPaymentStatus(servicesPlanId, serviceItemIds, 'active');
    
    return {
      success: true,
      servicesPlanId,
      status: paymentIntent.status as string
    };
  }
  
  /**
   * Gets the status of a mock payment intent
   */
  async getPaymentStatus(
    paymentIntentId: string
  ): Promise<{ status: string; amount: number; metadata: Record<string, any> }> {
    // Retrieve the mock payment intent
    const paymentIntent = await this.mockStripeService.retrievePaymentIntent(paymentIntentId);
    
    return {
      status: paymentIntent.status as string,
      amount: paymentIntent.amount,
      metadata: paymentIntent.metadata || {}
    };
  }
  
  /**
   * Cancels a mock payment intent
   */
  async cancelPayment(
    paymentIntentId: string,
    cancellationReason: string
  ): Promise<{ success: boolean; status: string }> {
    // Call the mock Stripe service to cancel the payment intent
    const canceledIntent = await this.mockStripeService.cancelPaymentIntent(
      paymentIntentId,
      cancellationReason
    );
    
    return {
      success: true,
      status: canceledIntent.status as string
    };
  }
  
  /**
   * Issues a mock refund for a payment
   */
  async refundPayment(
    paymentIntentId: string,
    amount: number,
    reason: string
  ): Promise<{ success: boolean; refundId: string; amount: number }> {
    // Prepare refund parameters
    const refundParams: Stripe.RefundCreateParams = {
      payment_intent: paymentIntentId,
      amount,
      reason: reason as any
    };
    
    // Call the mock Stripe service to create a refund
    const refund = await this.mockStripeService.createRefund(refundParams);
    
    return {
      success: true,
      refundId: refund.id,
      amount: refund.amount
    };
  }
  
  /**
   * Processes mock Stripe webhook events
   */
  async handleWebhook(
    payload: string,
    signature: string
  ): Promise<{ success: boolean; event: string; data: Record<string, any> }> {
    // Call the mock Stripe service to construct a webhook event
    const event = await this.mockStripeService.constructWebhookEvent(payload, signature);
    
    // Process the event based on its type
    let success = true;
    switch (event.type) {
      case 'payment_intent.succeeded':
        // Process successful payment
        await this.processPayment((event.data.object as Stripe.PaymentIntent).id);
        break;
      case 'payment_intent.payment_failed':
        // Process failed payment
        success = false;
        break;
      // Handle other event types as needed
    }
    
    return {
      success,
      event: event.type,
      data: event.data.object as Record<string, any>
    };
  }
  
  /**
   * Calculates the total cost for mock service items
   */
  calculateServiceCost(serviceItems: ServiceItem[]): number {
    // Sum the estimated cost of all service items and convert to cents
    return serviceItems.reduce((sum, item) => sum + item.estimatedCost, 0) * 100;
  }
  
  /**
   * Creates metadata for mock payment intent
   */
  createPaymentMetadata(servicesPlan: ServicesPlan, serviceItems: ServiceItem[]): Record<string, any> {
    return {
      servicesPlanId: servicesPlan.id,
      servicesPlanTitle: servicesPlan.title,
      clientId: servicesPlan.clientId,
      serviceItemIds: serviceItems.map(item => item.id).join(','),
      serviceTypes: serviceItems.map(item => item.serviceType).join(',')
    };
  }
  
  /**
   * Mocks updating the payment status of service items
   */
  async updateServiceItemPaymentStatus(
    servicesPlanId: string,
    serviceItemIds: string[],
    status: string
  ): Promise<boolean> {
    // In a real implementation, this would update the database
    // For the mock, just return true
    return true;
  }
  
  /**
   * Resets the mock service state
   */
  reset(): void {
    this.mockStripeService.reset();
    jest.clearAllMocks();
  }
}

// Singleton instances for use in tests
export const mockStripeService = new MockStripeService();
export const mockPaymentProcessingService = new MockPaymentProcessingService();