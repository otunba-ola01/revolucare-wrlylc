import { logger } from '../../utils/logger';
import { NotificationService } from '../../services/notifications.service';
import { ServicesPlanService } from '../../services/services-plans.service';
import { CarePlan } from '../../types/care-plan.types';
import { NOTIFICATION_TYPES, NOTIFICATION_PRIORITIES } from '../../constants/notification-types';
import { PlanStatus } from '../../constants/plan-statuses';

/**
 * Handles the care plan created event
 * @param payload - The event payload containing care plan data
 */
export const handleCarePlanCreated = async (payload: Record<string, any>): Promise<void> => {
  try {
    // Extract care plan data from the payload
    const carePlan: CarePlan = payload.carePlan;

    // Log the care plan creation event
    logger.info('Care plan created event received', { carePlanId: carePlan.id });

    // Create a notification for the client about the new care plan
    const clientNotification = await createCarePlanNotification(
      carePlan.clientId,
      NOTIFICATION_TYPES.CARE_PLAN_CREATED,
      carePlan,
      NOTIFICATION_PRIORITIES.NORMAL
    );

    // Create a notification for the case manager if different from creator
    let caseManagerNotification = null;
    if (carePlan.createdById !== carePlan.clientId) {
      caseManagerNotification = await createCarePlanNotification(
        carePlan.createdById,
        NOTIFICATION_TYPES.CARE_PLAN_CREATED,
        carePlan,
        NOTIFICATION_PRIORITIES.NORMAL
      );
    }

    // Send the notifications through appropriate channels
    const notificationService = new NotificationService();
    await notificationService.sendNotification(clientNotification);
    if (caseManagerNotification) {
      await notificationService.sendNotification(caseManagerNotification);
    }

    // Log successful notification delivery
    logger.info('Care plan created notifications sent', { carePlanId: carePlan.id });
  } catch (error) {
    // Handle and log any errors during processing
    logger.error('Error handling care plan created event', { error, payload });
  }
};

/**
 * Handles the care plan updated event
 * @param payload - The event payload containing care plan data
 */
export const handleCarePlanUpdated = async (payload: Record<string, any>): Promise<void> => {
  try {
    // Extract care plan data from the payload
    const carePlan: CarePlan = payload.carePlan;

    // Log the care plan update event
    logger.info('Care plan updated event received', { carePlanId: carePlan.id });

    // Create a notification for the client about the updated care plan
    const clientNotification = await createCarePlanNotification(
      carePlan.clientId,
      NOTIFICATION_TYPES.CARE_PLAN_UPDATED,
      carePlan,
      NOTIFICATION_PRIORITIES.NORMAL
    );

    // Create a notification for the case manager if different from updater
    let caseManagerNotification = null;
    if (payload.updatedById !== carePlan.clientId) {
      caseManagerNotification = await createCarePlanNotification(
        payload.updatedById,
        NOTIFICATION_TYPES.CARE_PLAN_UPDATED,
        carePlan,
        NOTIFICATION_PRIORITIES.NORMAL
      );
    }

    // Send the notifications through appropriate channels
    const notificationService = new NotificationService();
    await notificationService.sendNotification(clientNotification);
    if (caseManagerNotification) {
      await notificationService.sendNotification(caseManagerNotification);
    }

    // Check if any related service plans need to be updated
    const servicesPlanService = new ServicesPlanService();
    await updateRelatedServicesPlans(carePlan, servicesPlanService);

    // Log successful notification and update delivery
    logger.info('Care plan updated notifications sent and related service plans updated', { carePlanId: carePlan.id });
  } catch (error) {
    // Handle and log any errors during processing
    logger.error('Error handling care plan updated event', { error, payload });
  }
};

/**
 * Handles the care plan approved event
 * @param payload - The event payload containing care plan data
 */
export const handleCarePlanApproved = async (payload: Record<string, any>): Promise<void> => {
  try {
    // Extract care plan data from the payload
    const carePlan: CarePlan = payload.carePlan;

    // Log the care plan approval event
    logger.info('Care plan approved event received', { carePlanId: carePlan.id });

    // Create a high priority notification for the client about the approved care plan
    const clientNotification = await createCarePlanNotification(
      carePlan.clientId,
      NOTIFICATION_TYPES.CARE_PLAN_APPROVED,
      carePlan,
      NOTIFICATION_PRIORITIES.HIGH
    );

    // Create a notification for the case manager if different from approver
    let caseManagerNotification = null;
    if (payload.approvedById !== carePlan.clientId) {
      caseManagerNotification = await createCarePlanNotification(
        payload.approvedById,
        NOTIFICATION_TYPES.CARE_PLAN_APPROVED,
        carePlan,
        NOTIFICATION_PRIORITIES.NORMAL
      );
    }

    // Send the notifications through appropriate channels
    const notificationService = new NotificationService();
    await notificationService.sendNotification(clientNotification);
    if (caseManagerNotification) {
      await notificationService.sendNotification(caseManagerNotification);
    }

    // Check if any related service plans need to be updated
    const servicesPlanService = new ServicesPlanService();
    await updateRelatedServicesPlans(carePlan, servicesPlanService);

    // Log successful notification and update delivery
    logger.info('Care plan approved notifications sent and related service plans updated', { carePlanId: carePlan.id });
  } catch (error) {
    // Handle and log any errors during processing
    logger.error('Error handling care plan approved event', { error, payload });
  }
};

/**
 * Handles the care plan status changed event
 * @param payload - The event payload containing care plan data
 */
export const handleCarePlanStatusChanged = async (payload: Record<string, any>): Promise<void> => {
  try {
    // Extract care plan data and status information from the payload
    const carePlan: CarePlan = payload.carePlan;
    const newStatus: PlanStatus = payload.newStatus;

    // Log the care plan status change event
    logger.info('Care plan status changed event received', { carePlanId: carePlan.id, newStatus });

    // Determine notification priority based on status (high for ACTIVE, COMPLETED, ON_HOLD)
    let priority = NOTIFICATION_PRIORITIES.NORMAL;
    if ([PlanStatus.ACTIVE, PlanStatus.COMPLETED, PlanStatus.ON_HOLD].includes(newStatus)) {
      priority = NOTIFICATION_PRIORITIES.HIGH;
    }

    // Create a notification for the client about the status change
    const clientNotification = await createCarePlanNotification(
      carePlan.clientId,
      NOTIFICATION_TYPES.CARE_PLAN_STATUS_CHANGED,
      carePlan,
      priority
    );

    // Create a notification for the case manager
    const caseManagerNotification = await createCarePlanNotification(
      carePlan.createdById,
      NOTIFICATION_TYPES.CARE_PLAN_STATUS_CHANGED,
      carePlan,
      NOTIFICATION_PRIORITIES.NORMAL
    );

    // Send the notifications through appropriate channels
    const notificationService = new NotificationService();
    await notificationService.sendNotification(clientNotification);
    await notificationService.sendNotification(caseManagerNotification);

    // Check if any related service plans need to be updated based on the new status
    const servicesPlanService = new ServicesPlanService();
    await updateRelatedServicesPlans(carePlan, servicesPlanService);

    // Log successful notification and update delivery
    logger.info('Care plan status changed notifications sent and related service plans updated', { carePlanId: carePlan.id, newStatus });
  } catch (error) {
    // Handle and log any errors during processing
    logger.error('Error handling care plan status changed event', { error, payload });
  }
};

/**
 * Creates a notification for a care plan event
 * @param userId - The ID of the user to notify
 * @param notificationType - The type of notification
 * @param carePlan - The care plan data
 * @param priority - The priority of the notification
 */
const createCarePlanNotification = async (
  userId: string,
  notificationType: string,
  carePlan: CarePlan,
  priority: string
): Promise<any> => {
  try {
    // Generate appropriate notification title based on notification type
    let title = 'Care Plan Update';
    if (notificationType === NOTIFICATION_TYPES.CARE_PLAN_CREATED) {
      title = 'New Care Plan Created';
    } else if (notificationType === NOTIFICATION_TYPES.CARE_PLAN_APPROVED) {
      title = 'Care Plan Approved';
    } else if (notificationType === NOTIFICATION_TYPES.CARE_PLAN_STATUS_CHANGED) {
      title = 'Care Plan Status Changed';
    }

    // Generate notification message with care plan details
    const message = `Your care plan "${carePlan.title}" has been updated. Please review the changes.`;

    // Create notification object with user ID, type, title, message, and priority
    const notification = {
      userId,
      type: notificationType,
      title,
      message,
      priority,
      data: {
        carePlanId: carePlan.id,
      },
    };

    // Log the creation of the notification
    logger.debug('Creating care plan notification', { userId, notificationType, carePlanId: carePlan.id });

    // Return the created notification
    return notification;
  } catch (error) {
    // Handle and log any errors during creation
    logger.error('Error creating care plan notification', { error, userId, notificationType, carePlanId: carePlan.id });
    throw error;
  }
};

/**
 * Updates service plans related to a care plan
 * @param carePlan - The care plan data
 * @param servicesPlanService - The services plan service instance
 */
const updateRelatedServicesPlans = async (carePlan: CarePlan, servicesPlanService: ServicesPlanService): Promise<void> => {
  try {
    // Find service plans that reference this care plan
    const servicesPlans = await servicesPlanService.getServicesPlans({ carePlanId: carePlan.id });

    // For each related service plan, determine if it needs updating
    for (const servicesPlan of servicesPlans) {
      // Update service plan status if needed based on care plan status
      let newStatus = servicesPlan.status;
      if (carePlan.status === PlanStatus.APPROVED && servicesPlan.status === PlanStatus.DRAFT) {
        newStatus = PlanStatus.IN_REVIEW;
      } else if (carePlan.status === PlanStatus.ACTIVE && servicesPlan.status === PlanStatus.APPROVED) {
        newStatus = PlanStatus.ACTIVE;
      } else if (carePlan.status === PlanStatus.COMPLETED && servicesPlan.status === PlanStatus.ACTIVE) {
        newStatus = PlanStatus.COMPLETED;
      } else if (carePlan.status === PlanStatus.CANCELLED && servicesPlan.status !== PlanStatus.CANCELLED) {
        newStatus = PlanStatus.CANCELLED;
      }

      // If the status has changed, update the service plan
      if (newStatus !== servicesPlan.status) {
        await servicesPlanService.updateServicesPlan(servicesPlan.id, {
          title: servicesPlan.title,
          description: servicesPlan.description,
          status: newStatus,
          serviceItems: servicesPlan.serviceItems,
          fundingSources: servicesPlan.fundingSources
        });
        logger.info('Updated related service plan status', { servicesPlanId: servicesPlan.id, newStatus });
      }
    }
  } catch (error) {
    // Handle and log any errors during updates
    logger.error('Error updating related service plans', { error, carePlanId: carePlan.id });
  }
};