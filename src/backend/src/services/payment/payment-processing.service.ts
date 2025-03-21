import { stripeService } from '../../integrations/stripe';
import { currency } from '../../config/payment';
import { errorFactory } from '../../utils/error-handler';
import { logger } from '../../utils/logger';
import { ServicesPlanRepository } from '../../repositories/services-plan.repository';
import { ServicesPlan, ServiceItem } from '../../types/services-plan.types';

/**
 * Service class that handles payment processing for the Revolucare platform
 */
export class PaymentProcessingService {
  private servicesPlanRepository: ServicesPlanRepository;

  /**
   * Creates a new instance of the PaymentProcessingService
   */
  constructor() {
    this.servicesPlanRepository = new ServicesPlanRepository();
  }

  /**
   * Creates a payment intent for a service plan or specific service items
   * 
   * @param servicesPlanId - ID of the services plan to charge for
   * @param serviceItemIds - Optional array of specific service item IDs to charge for
   * @param customerId - Optional Stripe customer ID
   * @returns Payment intent details for client-side processing
   */
  async createPaymentIntent(
    servicesPlanId: string,
    serviceItemIds?: string[],
    customerId?: string
  ): Promise<{ clientSecret: string; paymentIntentId: string; amount: number }> {
    try {
      logger.info('Creating payment intent', { servicesPlanId, serviceItemIds });

      // Validate the services plan exists
      const servicesPlan = await this.servicesPlanRepository.findById(servicesPlanId, true, false);
      if (!servicesPlan) {
        throw errorFactory.createNotFoundError(`Services plan with ID ${servicesPlanId} not found`);
      }

      // Retrieve the services plan with service items
      let serviceItems = servicesPlan.serviceItems;
      
      // Filter service items if specific IDs are provided
      if (serviceItemIds && serviceItemIds.length > 0) {
        serviceItems = serviceItems.filter(item => serviceItemIds.includes(item.id));
        if (serviceItems.length === 0) {
          throw errorFactory.createNotFoundError('No matching service items found');
        }
      }

      // Calculate the total amount to charge
      const amount = this.calculateServiceCost(serviceItems);
      
      // Create metadata with service plan and item details
      const metadata = this.createPaymentMetadata(servicesPlan, serviceItems);

      // Call Stripe service to create a payment intent
      const paymentIntent = await stripeService.createPaymentIntent(
        amount, 
        currency, 
        metadata,
        customerId
      );

      logger.info('Payment intent created successfully', { 
        paymentIntentId: paymentIntent.id,
        amount,
        servicesPlanId
      });

      return {
        clientSecret: paymentIntent.client_secret || '',
        paymentIntentId: paymentIntent.id,
        amount
      };
    } catch (error) {
      logger.error('Failed to create payment intent', { error, servicesPlanId });
      throw error;
    }
  }

  /**
   * Processes a completed payment and updates service plan status
   * 
   * @param paymentIntentId - ID of the completed payment intent
   * @returns Payment processing result
   */
  async processPayment(
    paymentIntentId: string
  ): Promise<{ success: boolean; servicesPlanId: string; status: string }> {
    try {
      logger.info('Processing payment', { paymentIntentId });

      // Retrieve the payment intent from Stripe
      const paymentIntent = await stripeService.retrievePaymentIntent(paymentIntentId);

      // Verify the payment intent status is 'succeeded'
      if (paymentIntent.status !== 'succeeded') {
        throw errorFactory.createError(
          `Payment is not in succeeded state: ${paymentIntent.status}`,
          ErrorCodes.PAYMENT_PROCESSING_ERROR,
          { status: paymentIntent.status }
        );
      }

      // Extract service plan ID from payment intent metadata
      const servicesPlanId = paymentIntent.metadata?.services_plan_id;
      if (!servicesPlanId) {
        throw errorFactory.createError(
          'Payment intent does not have a services plan ID in metadata',
          ErrorCodes.PAYMENT_PROCESSING_ERROR
        );
      }

      // Extract service item IDs from metadata
      const serviceItemIds = paymentIntent.metadata?.service_item_ids
        ? JSON.parse(paymentIntent.metadata.service_item_ids)
        : [];

      // Update service items status to 'paid'
      await this.updateServiceItemPaymentStatus(
        servicesPlanId,
        serviceItemIds,
        'paid'
      );

      // Update service plan payment status
      await this.servicesPlanRepository.update(servicesPlanId, {
        status: servicesPlan.status, // Maintain current status
        title: servicesPlan.title,
        description: servicesPlan.description,
        serviceItems: [], // No changes to service items here
        fundingSources: [] // No changes to funding sources
      });

      logger.info('Payment processed successfully', { 
        paymentIntentId, 
        servicesPlanId,
        amount: paymentIntent.amount
      });

      return {
        success: true,
        servicesPlanId,
        status: 'paid'
      };
    } catch (error) {
      logger.error('Failed to process payment', { error, paymentIntentId });
      throw error;
    }
  }

  /**
   * Gets the current status of a payment intent
   * 
   * @param paymentIntentId - ID of the payment intent to check
   * @returns Payment status details
   */
  async getPaymentStatus(
    paymentIntentId: string
  ): Promise<{ status: string; amount: number; metadata: Record<string, any> }> {
    try {
      logger.info('Getting payment status', { paymentIntentId });

      // Retrieve the payment intent from Stripe
      const paymentIntent = await stripeService.retrievePaymentIntent(paymentIntentId);

      // Extract status, amount, and metadata
      logger.info('Payment status retrieved', { 
        paymentIntentId, 
        status: paymentIntent.status
      });

      return {
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        metadata: paymentIntent.metadata || {}
      };
    } catch (error) {
      logger.error('Failed to get payment status', { error, paymentIntentId });
      throw error;
    }
  }

  /**
   * Cancels a pending payment intent
   * 
   * @param paymentIntentId - ID of the payment intent to cancel
   * @param cancellationReason - Optional reason for cancellation
   * @returns Cancellation result
   */
  async cancelPayment(
    paymentIntentId: string,
    cancellationReason?: string
  ): Promise<{ success: boolean; status: string }> {
    try {
      logger.info('Cancelling payment', { paymentIntentId, cancellationReason });

      // Validate the payment intent exists
      const paymentIntent = await stripeService.retrievePaymentIntent(paymentIntentId);
      
      // Call Stripe service to cancel the payment intent
      const cancelledIntent = await stripeService.cancelPaymentIntent(
        paymentIntentId,
        cancellationReason
      );

      // Update service plan payment status if applicable
      if (paymentIntent.metadata?.services_plan_id) {
        const servicesPlanId = paymentIntent.metadata.services_plan_id;
        const serviceItemIds = paymentIntent.metadata?.service_item_ids
          ? JSON.parse(paymentIntent.metadata.service_item_ids)
          : [];

        if (serviceItemIds.length > 0) {
          await this.updateServiceItemPaymentStatus(
            servicesPlanId,
            serviceItemIds,
            'payment_cancelled'
          );
        }
      }

      logger.info('Payment cancelled successfully', { 
        paymentIntentId, 
        status: cancelledIntent.status
      });

      return {
        success: true,
        status: cancelledIntent.status
      };
    } catch (error) {
      logger.error('Failed to cancel payment', { error, paymentIntentId });
      throw error;
    }
  }

  /**
   * Issues a refund for a completed payment
   * 
   * @param paymentIntentId - ID of the payment intent to refund
   * @param amount - Optional amount to refund (defaults to full amount)
   * @param reason - Optional reason for the refund
   * @returns Refund result
   */
  async refundPayment(
    paymentIntentId: string,
    amount?: number,
    reason?: string
  ): Promise<{ success: boolean; refundId: string; amount: number }> {
    try {
      logger.info('Creating refund', { paymentIntentId, amount, reason });

      // Validate the payment intent exists and is in a refundable state
      const paymentIntent = await stripeService.retrievePaymentIntent(paymentIntentId);
      
      if (paymentIntent.status !== 'succeeded') {
        throw errorFactory.createError(
          `Payment intent is not eligible for refund. Status: ${paymentIntent.status}`,
          ErrorCodes.PAYMENT_PROCESSING_ERROR,
          { status: paymentIntent.status }
        );
      }

      // Prepare refund parameters including amount and reason
      const refundParams: any = {
        payment_intent: paymentIntentId,
      };

      if (amount) {
        refundParams.amount = amount;
      }

      if (reason) {
        refundParams.reason = reason;
      }

      // Call Stripe service to create a refund
      const refund = await stripeService.createRefund(refundParams);

      // Update service plan payment status to reflect the refund
      if (paymentIntent.metadata?.services_plan_id) {
        const servicesPlanId = paymentIntent.metadata.services_plan_id;
        const serviceItemIds = paymentIntent.metadata?.service_item_ids
          ? JSON.parse(paymentIntent.metadata.service_item_ids)
          : [];

        // Determine if this is a full or partial refund
        const isFullRefund = !amount || amount === paymentIntent.amount;
        const status = isFullRefund ? 'refunded' : 'partially_refunded';

        if (serviceItemIds.length > 0) {
          await this.updateServiceItemPaymentStatus(
            servicesPlanId,
            serviceItemIds,
            status
          );
        }
      }

      logger.info('Refund created successfully', { 
        paymentIntentId, 
        refundId: refund.id,
        amount: refund.amount
      });

      return {
        success: true,
        refundId: refund.id,
        amount: refund.amount
      };
    } catch (error) {
      logger.error('Failed to create refund', { error, paymentIntentId });
      throw error;
    }
  }

  /**
   * Processes Stripe webhook events
   * 
   * @param payload - Raw request body from webhook
   * @param signature - Stripe signature from request headers
   * @returns Webhook processing result
   */
  async handleWebhook(
    payload: string,
    signature: string
  ): Promise<{ success: boolean; event: string; data: Record<string, any> }> {
    try {
      logger.info('Processing webhook event');

      // Validate the webhook signature
      const event = await stripeService.constructWebhookEvent(payload, signature);

      // Determine the event type and handle accordingly
      logger.info('Webhook event verified', { 
        eventType: event.type,
        eventId: event.id
      });

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.processPayment(event.data.object.id);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(event.data.object);
          break;
        case 'charge.refunded':
          await this.handleChargeRefunded(event.data.object);
          break;
        // Additional event types can be handled here
      }

      return {
        success: true,
        event: event.type,
        data: event.data.object
      };
    } catch (error) {
      logger.error('Failed to process webhook', { error });
      throw error;
    }
  }

  /**
   * Calculates the total cost for specified service items
   * 
   * @param serviceItems - Array of service items
   * @returns Total cost in smallest currency unit (cents)
   */
  private calculateServiceCost(serviceItems: ServiceItem[]): number {
    // Sum the estimated cost of all service items
    const total = serviceItems.reduce(
      (sum, item) => sum + (item.estimatedCost || 0),
      0
    );

    // Convert to smallest currency unit (cents)
    return Math.round(total * 100);
  }

  /**
   * Creates metadata for payment intent with service details
   * 
   * @param servicesPlan - The services plan
   * @param serviceItems - The service items
   * @returns Metadata for payment intent
   */
  private createPaymentMetadata(
    servicesPlan: ServicesPlan,
    serviceItems: ServiceItem[]
  ): Record<string, any> {
    // Create metadata object with service plan ID and title
    const metadata: Record<string, any> = {
      services_plan_id: servicesPlan.id,
      services_plan_title: servicesPlan.title,
      client_id: servicesPlan.clientId,
      service_item_ids: JSON.stringify(serviceItems.map(item => item.id)),
      service_types: serviceItems.map(item => item.serviceType).join(','),
    };

    // Add service types and descriptions
    if (serviceItems.length <= 5) {
      // Only include individual descriptions if there aren't too many
      metadata.service_descriptions = serviceItems
        .map(item => item.description)
        .join('; ');
    }

    return metadata;
  }

  /**
   * Updates the payment status of service items
   * 
   * @param servicesPlanId - ID of the services plan
   * @param serviceItemIds - IDs of the service items to update
   * @param status - New payment status
   * @returns True if update was successful
   */
  private async updateServiceItemPaymentStatus(
    servicesPlanId: string,
    serviceItemIds: string[],
    status: string
  ): Promise<boolean> {
    try {
      logger.info('Updating service item payment status', { 
        servicesPlanId, 
        serviceItemIds,
        status
      });

      // Validate the service plan exists
      const servicesPlan = await this.servicesPlanRepository.findById(servicesPlanId, true, false);
      if (!servicesPlan) {
        throw errorFactory.createNotFoundError(`Services plan with ID ${servicesPlanId} not found`);
      }

      // Update the status of each service item
      for (const itemId of serviceItemIds) {
        const serviceItem = servicesPlan.serviceItems.find(item => item.id === itemId);
        if (serviceItem) {
          await this.servicesPlanRepository.updateServiceItem(itemId, {
            ...serviceItem,
            status
          });
        }
      }

      logger.info('Service item payment status updated successfully', { 
        servicesPlanId, 
        serviceItemIds,
        status
      });

      return true;
    } catch (error) {
      logger.error('Failed to update service item payment status', { 
        error, 
        servicesPlanId, 
        serviceItemIds
      });
      throw error;
    }
  }

  /**
   * Handles payment_intent.payment_failed webhook events
   * 
   * @param paymentIntent - The payment intent object from webhook
   */
  private async handlePaymentIntentFailed(paymentIntent: any): Promise<void> {
    try {
      logger.info('Processing payment_intent.payment_failed webhook', { 
        paymentIntentId: paymentIntent.id 
      });

      // Extract service plan and item IDs from metadata
      const servicesPlanId = paymentIntent.metadata?.services_plan_id;
      if (!servicesPlanId) {
        logger.warn('Payment intent does not have a services plan ID in metadata', {
          paymentIntentId: paymentIntent.id
        });
        return;
      }

      const serviceItemIds = paymentIntent.metadata?.service_item_ids
        ? JSON.parse(paymentIntent.metadata.service_item_ids)
        : [];

      // Update service items to payment_failed status
      if (serviceItemIds.length > 0) {
        await this.updateServiceItemPaymentStatus(
          servicesPlanId,
          serviceItemIds,
          'payment_failed'
        );
      }
    } catch (error) {
      logger.error('Error handling payment_intent.payment_failed webhook', { 
        error, 
        paymentIntentId: paymentIntent.id 
      });
      throw error;
    }
  }

  /**
   * Handles charge.refunded webhook events
   * 
   * @param charge - The charge object from webhook
   */
  private async handleChargeRefunded(charge: any): Promise<void> {
    try {
      logger.info('Processing charge.refunded webhook', { 
        chargeId: charge.id 
      });

      // Get payment intent ID and retrieve it
      const paymentIntentId = charge.payment_intent;
      if (!paymentIntentId) {
        logger.warn('Charge does not have a payment intent ID', {
          chargeId: charge.id
        });
        return;
      }

      const paymentIntent = await stripeService.retrievePaymentIntent(paymentIntentId);

      // Extract service plan and item IDs from metadata
      const servicesPlanId = paymentIntent.metadata?.services_plan_id;
      if (!servicesPlanId) {
        logger.warn('Payment intent does not have a services plan ID in metadata', {
          paymentIntentId
        });
        return;
      }

      const serviceItemIds = paymentIntent.metadata?.service_item_ids
        ? JSON.parse(paymentIntent.metadata.service_item_ids)
        : [];

      // Determine if this is a full or partial refund
      const isFullRefund = charge.amount_refunded === charge.amount;
      const status = isFullRefund ? 'refunded' : 'partially_refunded';

      // Update service items status
      if (serviceItemIds.length > 0) {
        await this.updateServiceItemPaymentStatus(
          servicesPlanId,
          serviceItemIds,
          status
        );
      }
    } catch (error) {
      logger.error('Error handling charge.refunded webhook', { 
        error, 
        chargeId: charge.id 
      });
      throw error;
    }
  }
}

// Error codes enumeration for payment processing errors
enum ErrorCodes {
  PAYMENT_PROCESSING_ERROR = 'PAYMENT_PROCESSING_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR'
}

export default PaymentProcessingService;