import { PaymentProcessingService } from '../../../src/services/payment/payment-processing.service';
import { stripeService } from '../../../src/integrations/stripe';
import { ServicesPlanRepository } from '../../../src/repositories/services-plan.repository';
import { mockServicesPlans, mockServiceItems } from '../../fixtures/services-plans.fixture';
import { mockStripeService, createMockPaymentIntent, createMockRefund, createMockEvent } from '../../mocks/payment.mock';
import { resetMockDatabase } from '../../mocks/database.mock';
import Stripe from 'stripe'; // stripe@12.0.0
import jest from 'jest'; // jest@29.5.0

// Global variables for PaymentProcessingService and ServicesPlanRepository
let paymentProcessingService: PaymentProcessingService;
let mockServicesPlanRepo: ServicesPlanRepository;

// Setup function that runs before all tests
beforeAll(() => {
  // Mock the Stripe service methods
  jest.spyOn(stripeService, 'createPaymentIntent').mockImplementation(mockStripeService.createPaymentIntent.bind(mockStripeService));
  jest.spyOn(stripeService, 'retrievePaymentIntent').mockImplementation(mockStripeService.retrievePaymentIntent.bind(mockStripeService));
  jest.spyOn(stripeService, 'cancelPaymentIntent').mockImplementation(mockStripeService.cancelPaymentIntent.bind(mockStripeService));
  jest.spyOn(stripeService, 'createRefund').mockImplementation(mockStripeService.createRefund.bind(mockStripeService));
  jest.spyOn(stripeService, 'constructWebhookEvent').mockImplementation(mockStripeService.constructWebhookEvent.bind(mockStripeService));

  // Create a mock ServicesPlanRepository instance
  mockServicesPlanRepo = {
    findById: jest.fn().mockResolvedValue(mockServicesPlans[0]),
    updateServiceItemPaymentStatus: jest.fn().mockResolvedValue(true),
    update: jest.fn().mockResolvedValue(mockServicesPlans[0]),
  } as any;

  // Initialize the PaymentProcessingService with the mock repository
  paymentProcessingService = new PaymentProcessingService();
  paymentProcessingService['servicesPlanRepository'] = mockServicesPlanRepo as any;
});

// Setup function that runs before each test
beforeEach(() => {
  // Reset the mock database state
  resetMockDatabase();

  // Reset all mocks to ensure clean test state
  jest.clearAllMocks();
});

// Cleanup function that runs after all tests
afterAll(() => {
  // Reset all mocks
  jest.restoreAllMocks();

  // Clean up any resources
  resetMockDatabase();
});

describe('PaymentProcessingService Integration Tests', () => {
  it('should create a payment intent for a service plan', async () => {
    // Mock the ServicesPlanRepository.findById to return a mock service plan
    (mockServicesPlanRepo.findById as jest.Mock).mockResolvedValue(mockServicesPlans[0]);

    // Mock the stripeService.createPaymentIntent to return a mock payment intent
    const mockPaymentIntent = createMockPaymentIntent(10000);
    (stripeService.createPaymentIntent as jest.Mock).mockResolvedValue(mockPaymentIntent);

    // Call paymentProcessingService.createPaymentIntent with service plan ID, service item IDs, and customer ID
    const { clientSecret, paymentIntentId, amount } = await paymentProcessingService.createPaymentIntent(
      'mock-services-plan-id',
      ['item1', 'item2'],
      'mock-customer-id'
    );

    // Assert that the returned client secret, payment intent ID, and amount match expected values
    expect(clientSecret).toBe(mockPaymentIntent.client_secret);
    expect(paymentIntentId).toBe(mockPaymentIntent.id);
    expect(amount).toBe(mockPaymentIntent.amount);

    // Verify that the repository and Stripe service methods were called with correct parameters
    expect(mockServicesPlanRepo.findById).toHaveBeenCalledWith('mock-services-plan-id', true, false);
    expect(stripeService.createPaymentIntent).toHaveBeenCalledWith(
      10000,
      'usd',
      expect.objectContaining({
        services_plan_id: 'mock-services-plan-id',
        service_item_ids: '["item1","item2"]',
        clientId: 'mock-client-id'
      }),
      'mock-customer-id'
    );
  });

  it('should throw an error if service plan is not found', async () => {
    // Mock the ServicesPlanRepository.findById to return null
    (mockServicesPlanRepo.findById as jest.Mock).mockResolvedValue(null);

    // Expect paymentProcessingService.createPaymentIntent to throw an error
    await expect(
      paymentProcessingService.createPaymentIntent('non-existent-plan-id', ['item1', 'item2'], 'mock-customer-id')
    ).rejects.toThrow('Services plan with ID non-existent-plan-id not found');

    // Verify that the repository method was called to find the service plan
    expect(mockServicesPlanRepo.findById).toHaveBeenCalledWith('non-existent-plan-id', true, false);
  });

  it('should process a successful payment', async () => {
    // Mock the stripeService.retrievePaymentIntent to return a mock payment intent with 'succeeded' status
    const mockPaymentIntent = createMockPaymentIntent(10000, 'usd', { services_plan_id: 'mock-services-plan-id', service_item_ids: '["item1", "item2"]' }, undefined, 'succeeded');
    (stripeService.retrievePaymentIntent as jest.Mock).mockResolvedValue(mockPaymentIntent);

    // Mock the ServicesPlanRepository.updateServiceItemPaymentStatus to return true
    (mockServicesPlanRepo.updateServiceItemPaymentStatus as jest.Mock).mockResolvedValue(true);

    // Call paymentProcessingService.processPayment with a payment intent ID
    const result = await paymentProcessingService.processPayment('mock-payment-intent-id');

    // Assert that the returned object indicates success and contains the correct service plan ID and status
    expect(result).toEqual({
      success: true,
      servicesPlanId: 'mock-services-plan-id',
      status: 'paid'
    });

    // Verify that the repository method was called to update service item payment status
    expect(mockServicesPlanRepo.updateServiceItemPaymentStatus).toHaveBeenCalledWith(
      'mock-services-plan-id',
      ['item1', 'item2'],
      'paid'
    );
  });

  it('should throw an error if payment intent is not successful', async () => {
    // Mock the stripeService.retrievePaymentIntent to return a mock payment intent with 'requires_payment_method' status
    const mockPaymentIntent = createMockPaymentIntent(10000, 'usd', { services_plan_id: 'mock-services-plan-id' }, undefined, 'requires_payment_method');
    (stripeService.retrievePaymentIntent as jest.Mock).mockResolvedValue(mockPaymentIntent);

    // Expect paymentProcessingService.processPayment to throw an error
    await expect(paymentProcessingService.processPayment('mock-payment-intent-id')).rejects.toThrow(
      'Payment is not in succeeded state: requires_payment_method'
    );
  });

  it('should get payment status', async () => {
    // Mock the stripeService.retrievePaymentIntent to return a mock payment intent
    const mockPaymentIntent = createMockPaymentIntent(10000, 'usd', { services_plan_id: 'mock-services-plan-id' });
    (stripeService.retrievePaymentIntent as jest.Mock).mockResolvedValue(mockPaymentIntent);

    // Call paymentProcessingService.getPaymentStatus with a payment intent ID
    const paymentStatus = await paymentProcessingService.getPaymentStatus('mock-payment-intent-id');

    // Assert that the returned status, amount, and metadata match the mock payment intent
    expect(paymentStatus).toEqual({
      status: 'succeeded',
      amount: 10000,
      metadata: { services_plan_id: 'mock-services-plan-id' }
    });
  });

  it('should cancel a payment', async () => {
    // Mock the stripeService.cancelPaymentIntent to return a mock canceled payment intent
    const mockCanceledPaymentIntent = createMockPaymentIntent(10000, 'usd', { services_plan_id: 'mock-services-plan-id' }, undefined, 'canceled');
    (stripeService.cancelPaymentIntent as jest.Mock).mockResolvedValue(mockCanceledPaymentIntent);

    // Call paymentProcessingService.cancelPayment with a payment intent ID and cancellation reason
    const result = await paymentProcessingService.cancelPayment('mock-payment-intent-id', 'requested_by_customer');

    // Assert that the returned object indicates success and contains the correct status
    expect(result).toEqual({
      success: true,
      status: 'canceled'
    });

    // Verify that the Stripe service method was called with correct parameters
    expect(stripeService.cancelPaymentIntent).toHaveBeenCalledWith('mock-payment-intent-id', 'requested_by_customer');
  });

  it('should process a refund', async () => {
    // Mock the stripeService.retrievePaymentIntent to return a mock payment intent with 'succeeded' status
    const mockPaymentIntent = createMockPaymentIntent(10000, 'usd', { services_plan_id: 'mock-services-plan-id' }, undefined, 'succeeded');
    (stripeService.retrievePaymentIntent as jest.Mock).mockResolvedValue(mockPaymentIntent);

    // Mock the stripeService.createRefund to return a mock refund
    const mockRefund = createMockRefund({ payment_intent: 'mock-payment-intent-id', amount: 5000, reason: 'requested_by_customer' });
    (stripeService.createRefund as jest.Mock).mockResolvedValue(mockRefund);

    // Call paymentProcessingService.refundPayment with payment intent ID, amount, and reason
    const result = await paymentProcessingService.refundPayment('mock-payment-intent-id', 5000, 'requested_by_customer');

    // Assert that the returned object indicates success and contains the correct refund ID and amount
    expect(result).toEqual({
      success: true,
      refundId: mockRefund.id,
      amount: mockRefund.amount
    });

    // Verify that the Stripe service methods were called with correct parameters
    expect(stripeService.retrievePaymentIntent).toHaveBeenCalledWith('mock-payment-intent-id');
    expect(stripeService.createRefund).toHaveBeenCalledWith({
      payment_intent: 'mock-payment-intent-id',
      amount: 5000,
      reason: 'requested_by_customer'
    });
  });

  it('should throw an error if refunding a payment that is not successful', async () => {
    // Mock the stripeService.retrievePaymentIntent to return a mock payment intent with 'requires_payment_method' status
    const mockPaymentIntent = createMockPaymentIntent(10000, 'usd', { services_plan_id: 'mock-services-plan-id' }, undefined, 'requires_payment_method');
    (stripeService.retrievePaymentIntent as jest.Mock).mockResolvedValue(mockPaymentIntent);

    // Expect paymentProcessingService.refundPayment to throw an error
    await expect(paymentProcessingService.refundPayment('mock-payment-intent-id', 5000, 'requested_by_customer')).rejects.toThrow(
      'Payment intent is not eligible for refund. Status: requires_payment_method'
    );
  });

  it('should handle payment_intent.succeeded webhook event', async () => {
    // Mock the stripeService.constructWebhookEvent to return a mock event with type 'payment_intent.succeeded'
    const mockEventData = createMockPaymentIntent(10000, 'usd', { services_plan_id: 'mock-services-plan-id' }, undefined, 'succeeded');
    const mockWebhookEvent = createMockEvent('payment_intent.succeeded', mockEventData);
    (stripeService.constructWebhookEvent as jest.Mock).mockResolvedValue(mockWebhookEvent);

    // Mock the paymentProcessingService.processPayment to return a success response
    jest.spyOn(paymentProcessingService, 'processPayment').mockResolvedValue({
      success: true,
      servicesPlanId: 'mock-services-plan-id',
      status: 'paid'
    });

    // Call paymentProcessingService.handleWebhook with payload and signature
    const result = await paymentProcessingService.handleWebhook('mock-payload', 'mock-signature');

    // Assert that the returned object indicates success and contains the correct event type
    expect(result).toEqual({
      success: true,
      event: 'payment_intent.succeeded',
      data: mockEventData
    });

    // Verify that processPayment was called with the correct payment intent ID
    expect(paymentProcessingService.processPayment).toHaveBeenCalledWith(mockWebhookEvent.data.object.id);
  });

  it('should handle payment_intent.payment_failed webhook event', async () => {
    // Mock the stripeService.constructWebhookEvent to return a mock event with type 'payment_intent.payment_failed'
    const mockEventData = createMockPaymentIntent(10000, 'usd', { services_plan_id: 'mock-services-plan-id' }, undefined, 'requires_payment_method');
    const mockWebhookEvent = createMockEvent('payment_intent.payment_failed', mockEventData);
    (stripeService.constructWebhookEvent as jest.Mock).mockResolvedValue(mockWebhookEvent);

    // Call paymentProcessingService.handleWebhook with payload and signature
    const result = await paymentProcessingService.handleWebhook('mock-payload', 'mock-signature');

    // Assert that the returned object indicates success and contains the correct event type
    expect(result).toEqual({
      success: true,
      event: 'payment_intent.payment_failed',
      data: mockEventData
    });

    // Verify that appropriate actions were taken for the failed payment
    // In this case, we only verify that constructWebhookEvent was called
    expect(stripeService.constructWebhookEvent).toHaveBeenCalledWith('mock-payload', 'mock-signature');
  });

  it('should calculate service cost correctly', () => {
    // Create an array of mock service items with known costs
    const serviceItems = [
      { estimatedCost: 10 } as ServiceItem,
      { estimatedCost: 25.5 } as ServiceItem,
      { estimatedCost: 5.75 } as ServiceItem
    ];

    // Call the private method calculateServiceCost with the mock service items
    const amount = (paymentProcessingService as any).calculateServiceCost(serviceItems);

    // Assert that the returned amount is the sum of all service item costs converted to cents
    expect(amount).toBe(4125); // (10 + 25.5 + 5.75) * 100 = 4125
  });

  it('should create payment metadata with correct format', () => {
    // Create a mock service plan and service items
    const mockServicesPlan = mockServicesPlans[0];
    const mockServiceItems = mockServiceItems.slice(0, 2);

    // Call the private method createPaymentMetadata with the mock service plan and items
    const metadata = (paymentProcessingService as any).createPaymentMetadata(mockServicesPlan, mockServiceItems);

    // Assert that the returned metadata contains the correct service plan ID, title, client ID, and service item information
    expect(metadata).toEqual({
      services_plan_id: mockServicesPlan.id,
      services_plan_title: mockServicesPlan.title,
      client_id: mockServicesPlan.clientId,
      service_item_ids: '["service-item-1234-5678","service-item-2345-6789"]',
      service_types: 'physical_therapy,occupational_therapy',
      service_descriptions: 'Physical therapy focusing on gait and balance training; Occupational therapy focusing on energy conservation techniques'
    });
  });
});