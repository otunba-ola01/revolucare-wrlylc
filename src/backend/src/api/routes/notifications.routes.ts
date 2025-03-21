import { Router } from 'express'; // express@^4.18.2
import { NotificationsController } from '../controllers/notifications.controller';
import { NotificationService } from '../../services/notifications.service';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validateBody, validateParams, validateQuery } from '../middlewares/validation.middleware';
import { createNotificationSchema, notificationFilterSchema, notificationIdParamSchema, notificationPreferencesSchema, paginationSchema } from '../validators/notifications.validator';
import { Roles } from '../../constants/roles';

/**
 * Creates and configures a router for notification-related endpoints
 * @param notificationService 
 * @returns Configured Express router with notification endpoints
 */
const createNotificationsRouter = (notificationService: NotificationService): Router => {
  // Create a new Express Router instance
  const router = Router();

  // Initialize NotificationsController with the provided notification service
  const notificationsController = new NotificationsController(notificationService);

  // Configure routes with appropriate middleware and controller methods
  // Route for creating a new notification
  router.post(
    '/',
    authenticate,
    authorize([Roles.ADMINISTRATOR, Roles.CASE_MANAGER]),
    validateBody(createNotificationSchema),
    (req, res) => notificationsController.createNotification(req, res)
  );

  // Route for getting notifications with filtering and pagination
  router.get(
    '/',
    authenticate,
    authorize([Roles.ADMINISTRATOR, Roles.CASE_MANAGER, Roles.PROVIDER, Roles.CLIENT]),
    validateQuery(notificationFilterSchema.merge(paginationSchema)),
    (req, res) => notificationsController.getNotifications(req, res)
  );

  // Route for getting a notification by its ID
  router.get(
    '/:id',
    authenticate,
    authorize([Roles.ADMINISTRATOR, Roles.CASE_MANAGER, Roles.PROVIDER, Roles.CLIENT]),
    validateParams(notificationIdParamSchema),
    (req, res) => notificationsController.getNotificationById(req, res)
  );

  // Route for marking a notification as read
  router.put(
    '/:id/read',
    authenticate,
    authorize([Roles.ADMINISTRATOR, Roles.CASE_MANAGER, Roles.PROVIDER, Roles.CLIENT]),
    validateParams(notificationIdParamSchema),
    (req, res) => notificationsController.markAsRead(req, res)
  );

  // Route for marking all notifications as read
  router.put(
    '/read-all',
    authenticate,
    authorize([Roles.ADMINISTRATOR, Roles.CASE_MANAGER, Roles.PROVIDER, Roles.CLIENT]),
    (req, res) => notificationsController.markAllAsRead(req, res)
  );

  // Route for deleting a notification
  router.delete(
    '/:id',
    authenticate,
    authorize([Roles.ADMINISTRATOR, Roles.CASE_MANAGER, Roles.PROVIDER, Roles.CLIENT]),
    validateParams(notificationIdParamSchema),
    (req, res) => notificationsController.deleteNotification(req, res)
  );

  // Route for getting notification statistics
  router.get(
    '/stats',
    authenticate,
    authorize([Roles.ADMINISTRATOR, Roles.CASE_MANAGER, Roles.PROVIDER, Roles.CLIENT]),
    (req, res) => notificationsController.getNotificationStats(req, res)
  );

  // Route for getting notification preferences
  router.get(
    '/preferences',
    authenticate,
    authorize([Roles.ADMINISTRATOR, Roles.CASE_MANAGER, Roles.PROVIDER, Roles.CLIENT]),
    (req, res) => notificationsController.getNotificationPreferences(req, res)
  );

  // Route for updating notification preferences
  router.put(
    '/preferences',
    authenticate,
    authorize([Roles.ADMINISTRATOR, Roles.CASE_MANAGER, Roles.PROVIDER, Roles.CLIENT]),
    validateBody(notificationPreferencesSchema),
    (req, res) => notificationsController.updateNotificationPreferences(req, res)
  );

  // Return the configured router
  return router;
};

// Export the createNotificationsRouter function as the default export
export default createNotificationsRouter;