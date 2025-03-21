import { Response } from 'express'; // express@^4.18.2
import { NotificationService } from '../../services/notifications.service';
import {
  INotificationService,
} from '../../interfaces/notification.interface';
import {
  CreateNotificationDTO,
  NotificationFilterOptions,
  NotificationPreferencesUpdateDTO,
  Notification,
  NotificationStats,
  NotificationPreferences,
  ApiResponse,
  PaginatedResponse,
  NotificationResponse
} from '../../types/notification.types';
import { AuthenticatedRequest } from '../../interfaces/auth.interface';
import { logger } from '../../utils/logger';

/**
 * Controller class that handles notification-related API requests
 */
export class NotificationsController {
  /**
   * Creates a new NotificationsController instance
   * @param notificationService 
   */
  constructor(private notificationService: INotificationService) {
    // Initialize notificationService with the provided service instance
    this.notificationService = notificationService;
  }

  /**
   * Creates a new notification
   * @param req 
   * @param res 
   * @returns Sends API response
   */
  async createNotification(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Extract notification data from request body
      const notificationData: CreateNotificationDTO = req.body;

      // Call notificationService.createNotification with the data
      const createdNotification: Notification = await this.notificationService.createNotification(notificationData);

      logger.info('Notification created successfully', { notificationId: createdNotification.id });

      // Return success response with created notification
      const response: ApiResponse<Notification> = {
        success: true,
        message: 'Notification created successfully',
        data: createdNotification,
      };
      res.status(201).json(response);
    } catch (error) {
      logger.error('Failed to create notification', { error });
      res.status(500).json({ success: false, message: 'Failed to create notification', error: error instanceof Error ? error.message : String(error) });
    }
  }

  /**
   * Gets notifications for the authenticated user with filtering and pagination
   * @param req 
   * @param res 
   * @returns Sends API response
   */
  async getNotifications(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Extract user ID from authenticated request
      const userId: string = req.user.userId;

      // Extract filter options from query parameters
      const filterOptions: NotificationFilterOptions = req.query as NotificationFilterOptions;

      // Extract pagination parameters (page, limit) from query
      const page: number = parseInt(req.query.page as string || '1', 10);
      const limit: number = parseInt(req.query.limit as string || '10', 10);

      // Call notificationService.getNotifications with user ID, filters, and pagination
      const notifications: PaginatedResponse<Notification> = await this.notificationService.getNotifications(
        userId,
        filterOptions,
        page,
        limit
      );

      logger.info('Notifications retrieved successfully', { userId, count: notifications.data.length, total: notifications.pagination.totalItems });

      // Return paginated response with notifications
      res.status(200).json(notifications);
    } catch (error) {
      logger.error('Failed to get notifications', { error });
      res.status(500).json({ success: false, message: 'Failed to get notifications', error: error instanceof Error ? error.message : String(error) });
    }
  }

  /**
   * Gets a notification by its ID
   * @param req 
   * @param res 
   * @returns Sends API response
   */
  async getNotificationById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Extract notification ID from request parameters
      const notificationId: string = req.params.id;

      // Call notificationService.getNotificationById with the ID
      const notification: Notification = await this.notificationService.getNotificationById(notificationId);

      logger.info('Notification retrieved successfully', { notificationId });

      // Return success response with notification
      const response: ApiResponse<Notification> = {
        success: true,
        message: 'Notification retrieved successfully',
        data: notification,
      };
      res.status(200).json(response);
    } catch (error) {
      logger.error('Failed to get notification by ID', { error, notificationId: req.params.id });
      res.status(500).json({ success: false, message: 'Failed to get notification', error: error instanceof Error ? error.message : String(error) });
    }
  }

  /**
   * Marks a notification as read
   * @param req 
   * @param res 
   * @returns Sends API response
   */
  async markAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Extract notification ID from request parameters
      const notificationId: string = req.params.id;
      const userId: string = req.user.userId;

      // Call notificationService.markAsRead with the ID
      const updatedNotification: Notification = await this.notificationService.markAsRead(notificationId, userId);

      logger.info('Notification marked as read successfully', { notificationId });

      // Return success response with updated notification
      const response: ApiResponse<Notification> = {
        success: true,
        message: 'Notification marked as read successfully',
        data: updatedNotification,
      };
      res.status(200).json(response);
    } catch (error) {
      logger.error('Failed to mark notification as read', { error, notificationId: req.params.id });
      res.status(500).json({ success: false, message: 'Failed to mark notification as read', error: error instanceof Error ? error.message : String(error) });
    }
  }

  /**
   * Marks all notifications for the authenticated user as read
   * @param req 
   * @param res 
   * @returns Sends API response
   */
  async markAllAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Extract user ID from authenticated request
      const userId: string = req.user.userId;

      // Call notificationService.markAllAsRead with the user ID
      const updatedCount: number = await this.notificationService.markAllAsRead(userId);

      logger.info('All notifications marked as read successfully', { userId, updatedCount });

      // Return success response with count of updated notifications
      const response: ApiResponse<number> = {
        success: true,
        message: 'All notifications marked as read successfully',
        data: updatedCount,
      };
      res.status(200).json(response);
    } catch (error) {
      logger.error('Failed to mark all notifications as read', { error, userId: req.user.userId });
      res.status(500).json({ success: false, message: 'Failed to mark all notifications as read', error: error instanceof Error ? error.message : String(error) });
    }
  }

  /**
   * Deletes a notification
   * @param req 
   * @param res 
   * @returns Sends API response
   */
  async deleteNotification(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Extract notification ID from request parameters
      const notificationId: string = req.params.id;
      const userId: string = req.user.userId;

      // Call notificationService.deleteNotification with the ID
      const result: boolean = await this.notificationService.deleteNotification(notificationId, userId);

      logger.info('Notification deleted successfully', { notificationId, result });

      // Return success response with deletion confirmation
      const response: ApiResponse<boolean> = {
        success: true,
        message: 'Notification deleted successfully',
        data: result,
      };
      res.status(200).json(response);
    } catch (error) {
      logger.error('Failed to delete notification', { error, notificationId: req.params.id });
      res.status(500).json({ success: false, message: 'Failed to delete notification', error: error instanceof Error ? error.message : String(error) });
    }
  }

  /**
   * Gets notification statistics for the authenticated user
   * @param req 
   * @param res 
   * @returns Sends API response
   */
  async getNotificationStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Extract user ID from authenticated request
      const userId: string = req.user.userId;

      // Call notificationService.getNotificationStats with the user ID
      const stats: NotificationStats = await this.notificationService.getNotificationStats(userId);

      logger.info('Notification statistics retrieved successfully', { userId, stats });

      // Return success response with notification statistics
      const response: ApiResponse<NotificationStats> = {
        success: true,
        message: 'Notification statistics retrieved successfully',
        data: stats,
      };
      res.status(200).json(response);
    } catch (error) {
      logger.error('Failed to get notification statistics', { error, userId: req.user.userId });
      res.status(500).json({ success: false, message: 'Failed to get notification statistics', error: error instanceof Error ? error.message : String(error) });
    }
  }

  /**
   * Gets notification preferences for the authenticated user
   * @param req 
   * @param res 
   * @returns Sends API response
   */
  async getNotificationPreferences(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Extract user ID from authenticated request
      const userId: string = req.user.userId;

      // Call notificationService.getNotificationPreferences with the user ID
      const preferences: NotificationPreferences = await this.notificationService.getNotificationPreferences(userId);

      logger.info('Notification preferences retrieved successfully', { userId, preferences });

      // Return success response with notification preferences
      const response: ApiResponse<NotificationPreferences> = {
        success: true,
        message: 'Notification preferences retrieved successfully',
        data: preferences,
      };
      res.status(200).json(response);
    } catch (error) {
      logger.error('Failed to get notification preferences', { error, userId: req.user.userId });
      res.status(500).json({ success: false, message: 'Failed to get notification preferences', error: error instanceof Error ? error.message : String(error) });
    }
  }

  /**
   * Updates notification preferences for the authenticated user
   * @param req 
   * @param res 
   * @returns Sends API response
   */
  async updateNotificationPreferences(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Extract user ID from authenticated request
      const userId: string = req.user.userId;

      // Extract preferences data from request body
      const preferencesData: NotificationPreferencesUpdateDTO = req.body;

      // Call notificationService.updateNotificationPreferences with user ID and preferences data
      const updatedPreferences: NotificationPreferences = await this.notificationService.updateNotificationPreferences(userId, preferencesData);

      logger.info('Notification preferences updated successfully', { userId, updatedPreferences });

      // Return success response with updated preferences
      const response: ApiResponse<NotificationPreferences> = {
        success: true,
        message: 'Notification preferences updated successfully',
        data: updatedPreferences,
      };
      res.status(200).json(response);
    } catch (error) {
      logger.error('Failed to update notification preferences', { error, userId: req.user.userId, preferencesData: req.body });
      res.status(500).json({ success: false, message: 'Failed to update notification preferences', error: error instanceof Error ? error.message : String(error) });
    }
  }
}