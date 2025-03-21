# src/backend/src/services/notifications.service.ts
```typescript
import { EventEmitter } from 'events'; // events@^1.1.1
import {
  INotificationService,
  INotificationRepository,
  INotificationDeliveryService,
} from '../interfaces/notification.interface';
import { NotificationRepository } from '../repositories/notification.repository';
import { UserRepository } from '../repositories/user.repository';
import { NotificationModel } from '../models/notification.model';
import { EmailService } from './email/email.service';
import { smsService } from './sms/sms.service';
import {
  CreateNotificationDTO,
  NotificationFilterOptions,
  NotificationPreferences,
  NotificationPreferencesUpdateDTO,
  NotificationStats,
  Notification,
  NotificationChannel,
  NotificationDeliveryResult,
} from '../types/notification.types';
import { PaginatedResponse } from '../types/response.types';
import {
  NOTIFICATION_CHANNELS,
  DEFAULT_NOTIFICATION_CHANNELS,
} from '../constants/notification-types';
import { logger } from '../utils/logger';
import { errorFactory } from '../utils/error-handler';

/**
 * Service class that implements the INotificationService interface for notification management
 */
export class NotificationService implements INotificationService {
  private notificationRepository: NotificationRepository;
  private userRepository: UserRepository;
  private emailService: EmailService;
  private smsService: typeof smsService;
  private userPreferencesCache: Map<string, NotificationPreferences>;
  private notificationEmitter: EventEmitter;

  /**
   * Creates a new NotificationService instance
   * @param notificationRepository 
   * @param userRepository 
   * @param emailService 
   */
  constructor(
    notificationRepository: NotificationRepository,
    userRepository: UserRepository,
    emailService: EmailService
  ) {
    this.notificationRepository = notificationRepository;
    this.userRepository = userRepository;
    this.emailService = emailService;
    this.smsService = smsService;
    this.userPreferencesCache = new Map<string, NotificationPreferences>();
    this.notificationEmitter = new EventEmitter();
  }

  /**
   * Creates a new notification in the system
   * @param notificationData 
   * @returns 
   */
  async createNotification(notificationData: CreateNotificationDTO): Promise<Notification> {
    try {
      // Log the attempt to create a notification
      logger.info('Creating new notification', { notificationData });

      // Create notification model from DTO
      const notificationModel = new NotificationModel(notificationData);

      // Save notification to database using repository
      const createdNotification = await this.notificationRepository.create(notificationModel);

      // Emit notification.created event on the local emitter
      this.notificationEmitter.emit('notification.created', createdNotification);

      // Log the successful creation of the notification
      logger.info('Notification created successfully', { notificationId: createdNotification.id });

      // Return the created notification
      return createdNotification;
    } catch (error) {
      // Log the error and re-throw it for handling in the upper layers
      logger.error('Failed to create notification', { error });
      throw error;
    }
  }

  /**
   * Gets notifications for a user with filtering and pagination
   * @param userId 
   * @param options 
   * @param page 
   * @param limit 
   * @returns 
   */
  async getNotifications(
    userId: string,
    options: NotificationFilterOptions,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResponse<Notification>> {
    try {
      // Log the attempt to retrieve notifications
      logger.info('Getting notifications for user', { userId, options, page, limit });

      // Call repository to find notifications by user ID with filters and pagination
      const notifications = await this.notificationRepository.findByUserId(userId, options, page, limit);

      // Log the successful retrieval of notifications
      logger.info('Notifications retrieved successfully', {
        userId,
        count: notifications.data.length,
        total: notifications.pagination.totalItems,
      });

      // Return paginated response with notifications
      return notifications;
    } catch (error) {
      // Log the error and re-throw it for handling in the upper layers
      logger.error('Failed to get notifications', { error });
      throw error;
    }
  }

  /**
   * Gets a notification by its ID
   * @param id 
   * @returns 
   */
  async getNotificationById(id: string): Promise<Notification> {
    try {
      // Log the attempt to retrieve a notification by ID
      logger.info('Getting notification by ID', { notificationId: id });

      // Call repository to find notification by ID
      const notification = await this.notificationRepository.findById(id);

      // Throw not found error if notification doesn't exist
      if (!notification) {
        throw errorFactory.createNotFoundError(`Notification with ID ${id} not found`);
      }

      // Log the successful retrieval of the notification
      logger.info('Notification retrieved successfully', { notificationId: id });

      // Return the found notification
      return notification;
    } catch (error) {
      // Log the error and re-throw it for handling in the upper layers
      logger.error('Failed to get notification by ID', { error, notificationId: id });
      throw error;
    }
  }

  /**
   * Marks a notification as read
   * @param id 
   * @returns 
   */
  async markAsRead(id: string, userId: string): Promise<Notification> {
    try {
      // Log the attempt to mark a notification as read
      logger.info('Marking notification as read', { notificationId: id, userId });

      // Call repository to mark notification as read
      const updatedNotification = await this.notificationRepository.markAsRead(id);

      // Emit notification.read event on the local emitter
      this.notificationEmitter.emit('notification.read', updatedNotification);

      // Log the successful marking of the notification as read
      logger.info('Notification marked as read successfully', { notificationId: id });

      // Return the updated notification
      return updatedNotification;
    } catch (error) {
      // Log the error and re-throw it for handling in the upper layers
      logger.error('Failed to mark notification as read', { error, notificationId: id });
      throw error;
    }
  }

  /**
   * Marks all notifications for a user as read
   * @param userId 
   * @returns 
   */
  async markAllAsRead(userId: string): Promise<number> {
    try {
      // Log the attempt to mark all notifications as read
      logger.info('Marking all notifications as read for user', { userId });

      // Call repository to mark all notifications as read for the user
      const updatedCount = await this.notificationRepository.markAllAsRead(userId);

      // Emit notification.all_read event on the local emitter
      this.notificationEmitter.emit('notification.all_read', userId);

      // Log the successful marking of all notifications as read
      logger.info('All notifications marked as read successfully', { userId, updatedCount });

      // Return the count of updated notifications
      return updatedCount;
    } catch (error) {
      // Log the error and re-throw it for handling in the upper layers
      logger.error('Failed to mark all notifications as read', { error, userId });
      throw error;
    }
  }

  /**
   * Deletes a notification
   * @param id 
   * @returns 
   */
  async deleteNotification(id: string, userId: string): Promise<boolean> {
    try {
      // Log the attempt to delete a notification
      logger.info('Deleting notification', { notificationId: id, userId });

      // Call repository to delete notification
      const result = await this.notificationRepository.delete(id);

      // Log the successful deletion of the notification
      logger.info('Notification deleted successfully', { notificationId: id, result });

      // Return the result of the deletion operation
      return result;
    } catch (error) {
      // Log the error and re-throw it for handling in the upper layers
      logger.error('Failed to delete notification', { error, notificationId: id });
      throw error;
    }
  }

  /**
   * Gets notification statistics for a user
   * @param userId 
   * @returns 
   */
  async getNotificationStats(userId: string): Promise<NotificationStats> {
    try {
      // Log the attempt to get notification statistics
      logger.info('Getting notification statistics for user', { userId });

      // Call repository to get notification statistics for the user
      const stats = await this.notificationRepository.getStats(userId);

      // Log the successful retrieval of notification statistics
      logger.info('Notification statistics retrieved successfully', { userId, stats });

      // Return the notification statistics
      return stats;
    } catch (error) {
      // Log the error and re-throw it for handling in the upper layers
      logger.error('Failed to get notification statistics', { error, userId });
      throw error;
    }
  }

  /**
   * Gets notification preferences for a user
   * @param userId 
   * @returns 
   */
  async getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      // Log the attempt to get notification preferences
      logger.info('Getting notification preferences for user', { userId });

      // Check if preferences are in cache
      if (this.userPreferencesCache.has(userId)) {
        const cachedPreferences = this.userPreferencesCache.get(userId);
        logger.debug('Notification preferences retrieved from cache', { userId, cachedPreferences });
        return cachedPreferences!;
      }

      // Fetch user from repository
      const user = await this.userRepository.findById(userId);

      // Throw not found error if user doesn't exist
      if (!user) {
        throw errorFactory.createNotFoundError(`User with ID ${userId} not found`);
      }

      // Extract preferences from user profile
      let preferences: NotificationPreferences | null = null;
      // TODO: Implement profile-specific preferences retrieval
      // preferences = user.profile?.notificationPreferences || null;

      // If no preferences found, create default preferences
      if (!preferences) {
        preferences = this.getDefaultPreferences(userId);
      }

      // Cache the preferences
      this.userPreferencesCache.set(userId, preferences);

      // Log the successful retrieval of notification preferences
      logger.info('Notification preferences retrieved successfully', { userId, preferences });

      // Return the notification preferences
      return preferences;
    } catch (error) {
      // Log the error and re-throw it for handling in the upper layers
      logger.error('Failed to get notification preferences', { error, userId });
      throw error;
    }
  }

  /**
   * Updates notification preferences for a user
   * @param userId 
   * @param preferencesData 
   * @returns 
   */
  async updateNotificationPreferences(
    userId: string,
    preferencesData: NotificationPreferencesUpdateDTO
  ): Promise<NotificationPreferences> {
    try {
      // Log the attempt to update notification preferences
      logger.info('Updating notification preferences for user', { userId, preferencesData });

      // Get current preferences
      const currentPreferences = await this.getNotificationPreferences(userId);

      // Merge current preferences with update data
      const updatedPreferences = {
        ...currentPreferences,
        ...preferencesData,
        updatedAt: new Date(),
      };

      // TODO: Implement profile-specific preferences update
      // Update user profile with new preferences
      // await this.userRepository.updateProfile(userId, { notificationPreferences: updatedPreferences });

      // Update cache with new preferences
      this.userPreferencesCache.set(userId, updatedPreferences);

      // Log the successful update of notification preferences
      logger.info('Notification preferences updated successfully', { userId, updatedPreferences });

      // Return the updated preferences
      return updatedPreferences;
    } catch (error) {
      // Log the error and re-throw it for handling in the upper layers
      logger.error('Failed to update notification preferences', { error, userId, preferencesData });
      throw error;
    }
  }

  /**
   * Sends a notification through appropriate channels based on user preferences
   * @param notification 
   * @returns 
   */
  async sendNotification(notification: Notification): Promise<NotificationDeliveryResult[]> {
    try {
      // Log the attempt to send a notification
      logger.info('Sending notification', { notificationId: notification.id, userId: notification.userId });

      // Get user preferences for notification channels
      const preferences = await this.getNotificationPreferences(notification.userId);

      // Apply user preferences to notification channels
      const deliveryResults: NotificationDeliveryResult[] = [];

      // Check for quiet hours if applicable
      if (this.shouldDeliverNotification(notification, preferences, NOTIFICATION_CHANNELS.IN_APP)) {
        // In-app notification is always delivered locally
        deliveryResults.push(await this.deliverViaChannel(notification, NOTIFICATION_CHANNELS.IN_APP));
      }

      if (this.shouldDeliverNotification(notification, preferences, NOTIFICATION_CHANNELS.EMAIL)) {
        // Deliver notification via email
        deliveryResults.push(await this.deliverViaChannel(notification, NOTIFICATION_CHANNELS.EMAIL));
      }

      if (this.shouldDeliverNotification(notification, preferences, NOTIFICATION_CHANNELS.SMS)) {
        // Deliver notification via SMS
        deliveryResults.push(await this.deliverViaChannel(notification, NOTIFICATION_CHANNELS.SMS));
      }

      // Log the delivery results
      logger.info('Notification delivery results', {
        notificationId: notification.id,
        results: deliveryResults,
      });

      // Return array of delivery results
      return deliveryResults;
    } catch (error) {
      // Log the error and re-throw it for handling in the upper layers
      logger.error('Failed to send notification', { error, notificationId: notification.id });
      throw error;
    }
  }

  /**
   * Registers an event listener for notification events
   * @param event 
   * @param listener 
   * @returns 
   */
  on(event: string, listener: Function): NotificationService {
    this.notificationEmitter.on(event, listener);
    return this;
  }

  /**
   * Registers a one-time event listener for notification events
   * @param event 
   * @param listener 
   * @returns 
   */
  once(event: string, listener: Function): NotificationService {
    this.notificationEmitter.once(event, listener);
    return this;
  }

  /**
   * Removes an event listener from notification events
   * @param event 
   * @param listener 
   * @returns 
   */
  off(event: string, listener: Function): NotificationService {
    this.notificationEmitter.off(event, listener);
    return this;
  }

  /**
   * Delivers a notification through a specific channel
   * @param notification 
   * @param channel 
   * @returns 
   */
  private async deliverViaChannel(
    notification: Notification,
    channel: NotificationChannel
  ): Promise<NotificationDeliveryResult> {
    try {
      // Log the attempt to deliver a notification via a specific channel
      logger.info('Delivering notification via channel', {
        notificationId: notification.id,
        channel,
      });

      let success = false;
      let error: string | null = null;
      let metadata: Record<string, any> | null = null;

      switch (channel) {
        case NOTIFICATION_CHANNELS.IN_APP:
          // Emit in-app notification event
          this.notificationEmitter.emit('notification.in_app', notification);
          success = true;
          metadata = { deliveredAt: new Date().toISOString() };
          break;

        case NOTIFICATION_CHANNELS.EMAIL:
          // Deliver notification via email service
          const emailResult = await this.emailService.deliverNotification(notification);
          success = emailResult[0].success;
          error = emailResult[0].error;
          metadata = emailResult[0].metadata;
          break;

        case NOTIFICATION_CHANNELS.SMS:
          // Deliver notification via SMS service
          const smsResult = await this.smsService.sendNotification(
            notification.userId,
            notification.type,
            notification.data || {}
          );
          success = smsResult.success;
          error = smsResult.error || null;
          metadata = { messageId: smsResult.messageId };
          break;

        default:
          throw new Error(`Unsupported notification channel: ${channel}`);
      }

      // Log the successful delivery of the notification via the channel
      logger.info('Notification delivered successfully via channel', {
        notificationId: notification.id,
        channel,
        success,
      });

      // Return delivery result with success/failure status
      return {
        success,
        channel,
        error,
        metadata,
      };
    } catch (error) {
      // Log the error and return a failed delivery result
      logger.error('Failed to deliver notification via channel', {
        notificationId: notification.id,
        channel,
        error,
      });

      return {
        success: false,
        channel,
        error: error instanceof Error ? error.message : String(error),
        metadata: null,
      };
    }
  }

  /**
   * Creates default notification preferences for a user
   * @param userId 
   * @returns 
   */
  private getDefaultPreferences(userId: string): NotificationPreferences {
    // Log the creation of default notification preferences
    logger.info('Creating default notification preferences for user', { userId });

    // Create default channels configuration (all enabled)
    const channels = {
      [NOTIFICATION_CHANNELS.IN_APP]: true,
      [NOTIFICATION_CHANNELS.EMAIL]: true,
      [NOTIFICATION_CHANNELS.SMS]: true,
    };

    // Create default notification types configuration
    const types: Record<string, { enabled: boolean; channels: NotificationChannel[] }> = {};
    // TODO: Implement default notification types configuration

    // Create default quiet hours configuration (disabled)
    const quietHours = {
      enabled: false,
      start: '22:00',
      end: '07:00',
      timezone: 'UTC',
    };

    // Log the successful creation of default notification preferences
    logger.info('Default notification preferences created successfully', { userId });

    // Return complete default preferences object
    return {
      userId,
      channels,
      types,
      quietHours,
      updatedAt: new Date(),
    };
  }

  /**
   * Determines if a notification should be delivered based on user preferences
   * @param notification 
   * @param preferences 
   * @param channel 
   * @returns 
   */
  private shouldDeliverNotification(
    notification: Notification,
    preferences: NotificationPreferences,
    channel: NotificationChannel
  ): boolean {
    // Log the check for notification delivery
    logger.debug('Checking if notification should be delivered', {
      notificationId: notification.id,
      channel,
      preferences,
    });

    // Check if channel is enabled in user preferences
    if (!preferences.channels[channel]) {
      logger.debug('Channel is disabled in user preferences', {
        notificationId: notification.id,
        channel,
      });
      return false;
    }

    // TODO: Implement notification type-specific checks
    // Check if notification type is enabled in user preferences
    // if (!preferences.types[notification.type]?.enabled) {
    //   logger.debug('Notification type is disabled in user preferences', {
    //     notificationId: notification.id,
    //     type: notification.type,
    //   });
    //   return false;
    // }

    // TODO: Implement channel-specific checks for notification types
    // Check if channel is enabled for this notification type
    // if (!preferences.types[notification.type]?.channels.includes(channel)) {
    //   logger.debug('Channel is disabled for this notification type', {
    //     notificationId: notification.id,
    //     type: notification.type,
    //     channel,
    //   });
    //   return false;
    // }

    // Check if currently in quiet hours
    if (this.isInQuietHours(preferences)) {
      logger.debug('Currently in quiet hours, skipping notification', {
        notificationId: notification.id,
        channel,
      });
      return false;
    }

    // Log that all checks passed and notification should be delivered
    logger.debug('All checks passed, delivering notification', {
      notificationId: notification.id,
      channel,
    });

    // Return true only if all checks pass
    return true;
  }

  /**
   * Checks if current time is within user's quiet hours
   * @param preferences 
   * @returns 
   */
  private isInQuietHours(preferences: NotificationPreferences): boolean {
    // Check if quiet hours are enabled
    if (!preferences.quietHours.enabled) {
      return false;
    }

    try {
      // Get current time in user's timezone
      const now = new Date();
      const timezone = preferences.quietHours.timezone || 'UTC';
      const nowInTimezone = new Date(now.toLocaleString('en-US', { timeZone: timezone }));

      // Parse quiet hours start and end times
      const [startHours, startMinutes] = preferences.quietHours.start.split(':').map(Number);
      const [endHours, endMinutes] = preferences.quietHours.end.split(':').map(Number);

      // Create date objects for start and end times today
      const startTime = new Date(nowInTimezone);
      startTime.setHours(startHours, startMinutes, 0, 0);

      const endTime = new Date(nowInTimezone);
      endTime.setHours(endHours, endMinutes, 0, 0);

      // Determine if current time falls within quiet hours range
      let inQuietHours = false;
      if (startTime < endTime) {
        // Normal case: start time is before end time
        inQuietHours = nowInTimezone >= startTime && nowInTimezone <= endTime;
      } else {
        // Wrap-around case: start time is after end time (e.g., 10 PM to 6 AM)
        inQuietHours = nowInTimezone >= startTime || nowInTimezone <= endTime;
      }

      // Log the result of the quiet hours check
      logger.debug('Checking if current time is in quiet hours', {
        now: nowInTimezone.toLocaleTimeString(),
        startTime: startTime.toLocaleTimeString(),
        endTime: endTime.toLocaleTimeString(),
        inQuietHours,
      });

      // Return true if in quiet hours, false otherwise
      return inQuietHours;
    } catch (error) {
      // Log the error and return false to avoid blocking notifications
      logger.error('Error checking quiet hours', { error });
      return false;
    }
  }
}

// Export the NotificationService class for dependency injection
export { NotificationService };