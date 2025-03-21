# src/backend/src/events/handlers/services-plan.handler.ts
```typescript
import { ServicesPlanService } from '../../services/services-plans.service';
import { NotificationService } from '../../services/notifications.service';
import { ServicesPlan } from '../../types/services-plan.types';
import { logger } from '../../utils/logger';
import { errorFactory } from '../../utils/error-handler';

/**
 * Handles the services plan created event
 * @param event The event object
 */
export async function handleServicesPlanCreated(event: any): Promise<void> {
  try {
    // Extract servicesPlanId from the event payload
    const { servicesPlanId } = event.payload;

    // Validate servicesPlanId
    if (!servicesPlanId) {
      throw errorFactory.createInternalServerError('ServicesPlanId is missing in the event payload', { eventPayload: event.payload });
    }

    // Retrieve the complete services plan using the service
    const servicesPlanService = new ServicesPlanService(); // v0.0.1
    const servicesPlan: ServicesPlan = await servicesPlanService.getServicesPlanById(servicesPlanId);

    // Create notifications for relevant stakeholders (client, case manager)
    const notificationService = new NotificationService(); // v0.0.1
    await createServicesPlanNotification(servicesPlan.clientId, 'services_plan_created', servicesPlan, {});

    // Log successful handling of the event
    logger.info('Successfully handled services plan created event', { servicesPlanId });
  } catch (error) {
    // Log any errors during event handling
    logger.error('Error handling services plan created event', { error, event });
  }
}

/**
 * Handles the services plan updated event
 * @param event The event object
 */
export async function handleServicesPlanUpdated(event: any): Promise<void> {
  try {
    // Extract servicesPlanId and updatedBy from the event payload
    const { servicesPlanId, updatedBy } = event.payload;

    // Validate servicesPlanId and updatedBy
    if (!servicesPlanId || !updatedBy) {
      throw errorFactory.createInternalServerError('ServicesPlanId or updatedBy is missing in the event payload', { eventPayload: event.payload });
    }

    // Retrieve the complete services plan using the service
    const servicesPlanService = new ServicesPlanService(); // v0.0.1
    const servicesPlan: ServicesPlan = await servicesPlanService.getServicesPlanById(servicesPlanId);

    // Create notifications for relevant stakeholders about the update
    const notificationService = new NotificationService(); // v0.0.1
    await createServicesPlanNotification(servicesPlan.clientId, 'services_plan_updated', servicesPlan, { updatedBy });

    // Log successful handling of the event
    logger.info('Successfully handled services plan updated event', { servicesPlanId });
  } catch (error) {
    // Log any errors during event handling
    logger.error('Error handling services plan updated event', { error, event });
  }
}

/**
 * Handles the services plan approved event
 * @param event The event object
 */
export async function handleServicesPlanApproved(event: any): Promise<void> {
  try {
    // Extract servicesPlanId and approvedBy from the event payload
    const { servicesPlanId, approvedBy } = event.payload;

    // Validate servicesPlanId and approvedBy
    if (!servicesPlanId || !approvedBy) {
      throw errorFactory.createInternalServerError('ServicesPlanId or approvedBy is missing in the event payload', { eventPayload: event.payload });
    }

    // Retrieve the complete services plan using the service
    const servicesPlanService = new ServicesPlanService(); // v0.0.1
    const servicesPlan: ServicesPlan = await servicesPlanService.getServicesPlanById(servicesPlanId);

    // Create notifications for client and providers about the approval
    const notificationService = new NotificationService(); // v0.0.1
    await createServicesPlanNotification(servicesPlan.clientId, 'services_plan_approved', servicesPlan, { approvedBy });

    // Trigger any necessary follow-up actions (e.g., scheduling, payment processing)
    // TODO: Implement follow-up actions

    // Log successful handling of the event
    logger.info('Successfully handled services plan approved event', { servicesPlanId });
  } catch (error) {
    // Log any errors during event handling
    logger.error('Error handling services plan approved event', { error, event });
  }
}

/**
 * Handles the services plan status changed event
 * @param event The event object
 */
export async function handleServicesPlanStatusChanged(event: any): Promise<void> {
  try {
    // Extract servicesPlanId, oldStatus, and newStatus from the event payload
    const { servicesPlanId, oldStatus, newStatus } = event.payload;

    // Validate servicesPlanId, oldStatus, and newStatus
    if (!servicesPlanId || !oldStatus || !newStatus) {
      throw errorFactory.createInternalServerError('ServicesPlanId, oldStatus, or newStatus is missing in the event payload', { eventPayload: event.payload });
    }

    // Retrieve the complete services plan using the service
    const servicesPlanService = new ServicesPlanService(); // v0.0.1
    const servicesPlan: ServicesPlan = await servicesPlanService.getServicesPlanById(servicesPlanId);

    // Create appropriate notifications based on the status transition
    const notificationService = new NotificationService(); // v0.0.1
    await createServicesPlanNotification(servicesPlan.clientId, 'services_plan_status_changed', servicesPlan, { oldStatus, newStatus });

    // Perform status-specific actions (e.g., completion tasks, cancellation handling)
    // TODO: Implement status-specific actions

    // Log successful handling of the event
    logger.info('Successfully handled services plan status changed event', { servicesPlanId, oldStatus, newStatus });
  } catch (error) {
    // Log any errors during event handling
    logger.error('Error handling services plan status changed event', { error, event });
  }
}

/**
 * Creates a notification for a services plan event
 * @param userId The ID of the user to notify
 * @param type The type of notification
 * @param servicesPlan The services plan object
 * @param additionalData Additional data for the notification
 */
async function createServicesPlanNotification(
  userId: string,
  type: string,
  servicesPlan: ServicesPlan,
  additionalData: Record<string, any>
): Promise<void> {
  try {
    // Prepare notification data with title, message, and priority based on type
    let title: string;
    let message: string;
    let priority: string;

    switch (type) {
      case 'services_plan_created':
        title = 'New Services Plan Created';
        message = `A new services plan "${servicesPlan.title}" has been created for you.`;
        priority = 'normal';
        break;
      case 'services_plan_updated':
        title = 'Services Plan Updated';
        message = `Services plan "${servicesPlan.title}" has been updated.`;
        priority = 'normal';
        break;
      case 'services_plan_approved':
        title = 'Services Plan Approved';
        message = `Services plan "${servicesPlan.title}" has been approved.`;
        priority = 'high';
        break;
      case 'services_plan_status_changed':
        title = 'Services Plan Status Changed';
        message = `Services plan "${servicesPlan.title}" status changed to ${servicesPlan.status}.`;
        priority = 'normal';
        break;
      default:
        title = 'Services Plan Event';
        message = `A services plan event occurred for "${servicesPlan.title}".`;
        priority = 'normal';
    }

    // Include services plan details and additional data in the notification
    const notificationData = {
      servicesPlanId: servicesPlan.id,
      servicesPlanTitle: servicesPlan.title,
      ...additionalData,
    };

    // Determine appropriate notification channels based on type and user role
    const channels = ['in_app']; // Default to in-app notifications

    // Create the notification using the notification service
    const notificationService = new NotificationService(); // v0.0.1
    await notificationService.createNotification({
      userId,
      type,
      title,
      message,
      data: notificationData,
      priority,
      channels,
    });

    // Log the notification creation
    logger.info('Services plan notification created', { userId, type, servicesPlanId: servicesPlan.id });
  } catch (error) {
    // Log any errors during notification creation
    logger.error('Error creating services plan notification', { error, userId, type, servicesPlanId: servicesPlan.id });
  }
}