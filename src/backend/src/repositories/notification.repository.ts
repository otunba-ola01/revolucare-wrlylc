import { INotificationRepository } from '../interfaces/notification.interface';
import { Notification, NotificationFilterOptions, NotificationStats, CreateNotificationDTO } from '../types/notification.types';
import { prisma } from '../config/database';
import { NOTIFICATION_CATEGORIES, NOTIFICATION_PRIORITIES } from '../constants/notification-types';
import { NotificationModel } from '../models/notification.model';
import { PaginatedResponse } from '../types/response.types';
import { errorFactory } from '../utils/error-handler';

/**
 * Repository class that implements the INotificationRepository interface for notification data access
 */
export class NotificationRepository implements INotificationRepository {
  /**
   * Creates a new notification in the database
   * 
   * @param notificationData The notification data to create
   * @returns Newly created notification
   */
  async create(notificationData: CreateNotificationDTO): Promise<Notification> {
    try {
      // Create notification model from DTO
      const notificationModel = new NotificationModel({
        userId: notificationData.userId,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        data: notificationData.data,
        priority: notificationData.priority,
        channels: notificationData.channels
      });

      // Create notification record in database using Prisma
      const dbNotification = await prisma.notification.create({
        data: {
          id: notificationModel.id,
          userId: notificationModel.userId,
          type: notificationModel.type,
          category: notificationModel.category,
          title: notificationModel.title,
          message: notificationModel.message,
          data: notificationModel.data,
          priority: notificationModel.priority,
          channels: notificationModel.channels,
          status: notificationModel.status,
          createdAt: notificationModel.createdAt,
          sentAt: notificationModel.sentAt,
          readAt: notificationModel.readAt
        }
      });

      // Transform database result to Notification type
      return this.mapToNotification(dbNotification);
    } catch (error) {
      throw errorFactory.createError(
        'Failed to create notification',
        ErrorCodes.DATABASE_ERROR,
        { error: error instanceof Error ? error.message : 'Unknown error' },
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Finds a notification by its ID
   * 
   * @param id Notification ID
   * @returns Notification if found, null otherwise
   */
  async findById(id: string): Promise<Notification | null> {
    try {
      // Query database for notification with matching ID
      const notification = await prisma.notification.findUnique({
        where: { id }
      });

      // Return null if no notification found
      if (!notification) {
        return null;
      }

      // Transform database result to Notification type
      return this.mapToNotification(notification);
    } catch (error) {
      throw errorFactory.createError(
        'Failed to find notification',
        ErrorCodes.DATABASE_ERROR,
        { error: error instanceof Error ? error.message : 'Unknown error', id },
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Finds notifications for a specific user with filtering and pagination
   * 
   * @param userId User ID
   * @param options Filter options
   * @param page Page number
   * @param limit Items per page
   * @returns Paginated list of notifications
   */
  async findByUserId(
    userId: string,
    options: NotificationFilterOptions,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResponse<Notification>> {
    try {
      // Build where clause with userId and filter options
      const where: any = { userId };

      // Add type filter if specified
      if (options.type) {
        where.type = options.type;
      }

      // Add category filter if specified
      if (options.category) {
        where.category = options.category;
      }

      // Add status filter if specified
      if (options.status) {
        where.status = options.status;
      }

      // Add priority filter if specified
      if (options.priority) {
        where.priority = options.priority;
      }

      // Add date range filters if specified
      if (options.startDate) {
        where.createdAt = {
          ...(where.createdAt || {}),
          gte: options.startDate
        };
      }

      if (options.endDate) {
        where.createdAt = {
          ...(where.createdAt || {}),
          lte: options.endDate
        };
      }

      // Add read status filter if specified
      if (options.read !== undefined) {
        where.status = options.read ? 'read' : { not: 'read' };
      }

      // Add search filter for title/message if specified
      if (options.search) {
        where.OR = [
          { title: { contains: options.search, mode: 'insensitive' } },
          { message: { contains: options.search, mode: 'insensitive' } }
        ];
      }

      // Calculate pagination values (skip, take)
      const skip = (page - 1) * limit;
      const take = limit;

      // Execute count query for total results
      const totalCount = await prisma.notification.count({ where });

      // Execute find query with filters and pagination
      const notifications = await prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take
      });

      // Transform database results to Notification type
      const notificationModels = notifications.map(notification => 
        this.mapToNotification(notification)
      );

      // Calculate total pages
      const totalPages = Math.ceil(totalCount / limit);

      // Return paginated response with notifications and metadata
      return {
        success: true,
        message: 'Notifications retrieved successfully',
        data: notificationModels,
        pagination: {
          page,
          limit,
          totalItems: totalCount,
          totalPages
        }
      };
    } catch (error) {
      throw errorFactory.createError(
        'Failed to find notifications',
        ErrorCodes.DATABASE_ERROR,
        { error: error instanceof Error ? error.message : 'Unknown error', userId },
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Updates an existing notification in the database
   * 
   * @param id Notification ID
   * @param notificationData Updated notification data
   * @returns Updated notification
   */
  async update(id: string, notificationData: Partial<Notification>): Promise<Notification> {
    try {
      // Check if notification exists
      const existingNotification = await prisma.notification.findUnique({
        where: { id }
      });

      // Throw not found error if notification doesn't exist
      if (!existingNotification) {
        throw errorFactory.createNotFoundError(
          `Notification with ID ${id} not found`
        );
      }

      // Update notification record in database using Prisma
      const updatedNotification = await prisma.notification.update({
        where: { id },
        data: notificationData
      });

      // Transform database result to Notification type
      return this.mapToNotification(updatedNotification);
    } catch (error) {
      // If it's already an AppError, just rethrow it
      if (error instanceof Error && error.name === 'AppError') {
        throw error;
      }

      throw errorFactory.createError(
        'Failed to update notification',
        ErrorCodes.DATABASE_ERROR,
        { error: error instanceof Error ? error.message : 'Unknown error', id },
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Deletes a notification from the database
   * 
   * @param id Notification ID
   * @returns True if notification was deleted, false otherwise
   */
  async delete(id: string): Promise<boolean> {
    try {
      // Check if notification exists
      const existingNotification = await prisma.notification.findUnique({
        where: { id }
      });

      // Throw not found error if notification doesn't exist
      if (!existingNotification) {
        throw errorFactory.createNotFoundError(
          `Notification with ID ${id} not found`
        );
      }

      // Delete notification record from database using Prisma
      await prisma.notification.delete({
        where: { id }
      });

      // Return true if deletion was successful
      return true;
    } catch (error) {
      // If it's already an AppError, just rethrow it
      if (error instanceof Error && error.name === 'AppError') {
        throw error;
      }

      throw errorFactory.createError(
        'Failed to delete notification',
        ErrorCodes.DATABASE_ERROR,
        { error: error instanceof Error ? error.message : 'Unknown error', id },
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Marks a notification as read
   * 
   * @param id Notification ID
   * @returns Updated notification
   */
  async markAsRead(id: string): Promise<Notification> {
    try {
      // Check if notification exists
      const existingNotification = await prisma.notification.findUnique({
        where: { id }
      });

      // Throw not found error if notification doesn't exist
      if (!existingNotification) {
        throw errorFactory.createNotFoundError(
          `Notification with ID ${id} not found`
        );
      }

      // Update notification status to READ and set readAt to current date
      const updatedNotification = await prisma.notification.update({
        where: { id },
        data: {
          status: 'read',
          readAt: new Date()
        }
      });

      // Transform database result to Notification type
      return this.mapToNotification(updatedNotification);
    } catch (error) {
      // If it's already an AppError, just rethrow it
      if (error instanceof Error && error.name === 'AppError') {
        throw error;
      }

      throw errorFactory.createError(
        'Failed to mark notification as read',
        ErrorCodes.DATABASE_ERROR,
        { error: error instanceof Error ? error.message : 'Unknown error', id },
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Marks all notifications for a user as read
   * 
   * @param userId User ID
   * @returns Number of notifications marked as read
   */
  async markAllAsRead(userId: string): Promise<number> {
    try {
      // Update all unread notifications for the user
      const result = await prisma.notification.updateMany({
        where: {
          userId,
          status: { not: 'read' }
        },
        data: {
          status: 'read',
          readAt: new Date()
        }
      });

      // Return the count of updated notifications
      return result.count;
    } catch (error) {
      throw errorFactory.createError(
        'Failed to mark all notifications as read',
        ErrorCodes.DATABASE_ERROR,
        { error: error instanceof Error ? error.message : 'Unknown error', userId },
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Gets notification statistics for a user
   * 
   * @param userId User ID
   * @returns Notification statistics
   */
  async getStats(userId: string): Promise<NotificationStats> {
    try {
      // Count total notifications for the user
      const total = await prisma.notification.count({
        where: { userId }
      });

      // Count unread notifications for the user
      const unread = await prisma.notification.count({
        where: {
          userId,
          status: { not: 'read' }
        }
      });

      // Initialize category counts
      const byCategory: Record<string, number> = {};
      for (const category of Object.values(NOTIFICATION_CATEGORIES)) {
        byCategory[category] = 0;
      }

      // Initialize priority counts
      const byPriority: Record<string, number> = {};
      for (const priority of Object.values(NOTIFICATION_PRIORITIES)) {
        byPriority[priority] = 0;
      }

      // Count notifications by category
      const categoryResults = await prisma.notification.groupBy({
        by: ['category'],
        where: { userId },
        _count: true
      });

      // Update category counts
      for (const result of categoryResults) {
        byCategory[result.category] = result._count;
      }

      // Count notifications by priority
      const priorityResults = await prisma.notification.groupBy({
        by: ['priority'],
        where: { userId },
        _count: true
      });

      // Update priority counts
      for (const result of priorityResults) {
        byPriority[result.priority] = result._count;
      }

      // Compile statistics into NotificationStats object
      return {
        total,
        unread,
        byCategory,
        byPriority
      };
    } catch (error) {
      throw errorFactory.createError(
        'Failed to get notification statistics',
        ErrorCodes.DATABASE_ERROR,
        { error: error instanceof Error ? error.message : 'Unknown error', userId },
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Maps a database notification record to the Notification type
   * 
   * @param dbNotification Database notification record
   * @returns Notification object with standardized structure
   */
  private mapToNotification(dbNotification: any): Notification {
    // Create a new NotificationModel instance with database notification data
    return new NotificationModel(dbNotification).toJSON();
  }
}

// Import ErrorCodes enum to use in error creation
import { ErrorCodes } from '../constants/error-codes';

// Export the NotificationRepository class for database operations related to notifications
export default NotificationRepository;