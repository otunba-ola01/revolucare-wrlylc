import { NotificationModel } from '../models/notification.model';
import {
  CreateNotificationDTO,
  NotificationFilterOptions,
  NotificationPreferences,
  NotificationPreferencesUpdateDTO,
  NotificationStats,
  NotificationDeliveryResult
} from '../types/notification.types';
import { PaginatedResponse } from '../types/response.types';

/**
 * Interface for the notification service that manages notifications
 * and user notification preferences.
 */
export interface INotificationService {
  /**
   * Creates a new notification
   * 
   * @param notification The notification data to create
   * @returns The created notification
   */
  createNotification(notification: CreateNotificationDTO): Promise<NotificationModel>;
  
  /**
   * Gets notifications for a user with filtering and pagination
   * 
   * @param userId User ID to get notifications for
   * @param options Filter and pagination options
   * @returns Paginated list of notifications
   */
  getNotifications(userId: string, options: NotificationFilterOptions): Promise<PaginatedResponse<NotificationModel>>;
  
  /**
   * Gets a notification by ID
   * 
   * @param id Notification ID
   * @returns The notification if found, null otherwise
   */
  getNotificationById(id: string): Promise<NotificationModel | null>;
  
  /**
   * Marks a notification as read
   * 
   * @param id Notification ID
   * @param userId User ID for validation
   * @returns The updated notification
   */
  markAsRead(id: string, userId: string): Promise<NotificationModel>;
  
  /**
   * Marks all notifications for a user as read
   * 
   * @param userId User ID
   * @returns Number of notifications marked as read
   */
  markAllAsRead(userId: string): Promise<number>;
  
  /**
   * Deletes a notification
   * 
   * @param id Notification ID
   * @param userId User ID for validation
   * @returns True if deleted successfully
   */
  deleteNotification(id: string, userId: string): Promise<boolean>;
  
  /**
   * Gets notification statistics for a user
   * 
   * @param userId User ID
   * @returns Notification statistics
   */
  getNotificationStats(userId: string): Promise<NotificationStats>;
  
  /**
   * Gets notification preferences for a user
   * 
   * @param userId User ID
   * @returns Notification preferences
   */
  getNotificationPreferences(userId: string): Promise<NotificationPreferences>;
  
  /**
   * Updates notification preferences for a user
   * 
   * @param userId User ID
   * @param preferences Notification preferences to update
   * @returns Updated notification preferences
   */
  updateNotificationPreferences(userId: string, preferences: NotificationPreferencesUpdateDTO): Promise<NotificationPreferences>;
  
  /**
   * Sends a notification through appropriate channels based on user preferences
   * 
   * @param notification The notification to send
   * @returns Delivery results for each attempted channel
   */
  sendNotification(notification: NotificationModel): Promise<NotificationDeliveryResult[]>;
}

/**
 * Interface for the notification repository that handles data access operations
 */
export interface INotificationRepository {
  /**
   * Creates a new notification in the database
   * 
   * @param notification The notification to create
   * @returns The created notification
   */
  create(notification: NotificationModel): Promise<NotificationModel>;
  
  /**
   * Finds a notification by ID
   * 
   * @param id Notification ID
   * @returns The notification if found, null otherwise
   */
  findById(id: string): Promise<NotificationModel | null>;
  
  /**
   * Finds notifications for a user with filtering and pagination
   * 
   * @param userId User ID
   * @param options Filter and pagination options
   * @returns Paginated list of notifications
   */
  findByUserId(userId: string, options: NotificationFilterOptions): Promise<PaginatedResponse<NotificationModel>>;
  
  /**
   * Updates a notification
   * 
   * @param id Notification ID
   * @param data Updated notification data
   * @returns The updated notification
   */
  update(id: string, data: Partial<NotificationModel>): Promise<NotificationModel>;
  
  /**
   * Deletes a notification
   * 
   * @param id Notification ID
   * @returns True if deleted successfully
   */
  delete(id: string): Promise<boolean>;
  
  /**
   * Marks a notification as read
   * 
   * @param id Notification ID
   * @returns The updated notification
   */
  markAsRead(id: string): Promise<NotificationModel>;
  
  /**
   * Marks all notifications for a user as read
   * 
   * @param userId User ID
   * @returns Number of notifications marked as read
   */
  markAllAsRead(userId: string): Promise<number>;
  
  /**
   * Gets notification statistics for a user
   * 
   * @param userId User ID
   * @returns Notification statistics
   */
  getStats(userId: string): Promise<NotificationStats>;
}

/**
 * Interface for the notification preferences repository that manages user preferences
 */
export interface INotificationPreferencesRepository {
  /**
   * Finds notification preferences for a user
   * 
   * @param userId User ID
   * @returns Notification preferences if found, null otherwise
   */
  findByUserId(userId: string): Promise<NotificationPreferences | null>;
  
  /**
   * Creates notification preferences for a user
   * 
   * @param userId User ID
   * @param preferences Notification preferences
   * @returns Created notification preferences
   */
  create(userId: string, preferences: NotificationPreferences): Promise<NotificationPreferences>;
  
  /**
   * Updates notification preferences for a user
   * 
   * @param userId User ID
   * @param preferences Updated notification preferences
   * @returns Updated notification preferences
   */
  update(userId: string, preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences>;
  
  /**
   * Deletes notification preferences for a user
   * 
   * @param userId User ID
   * @returns True if deleted successfully
   */
  delete(userId: string): Promise<boolean>;
}

/**
 * Interface for the notification delivery service that handles
 * sending notifications through different channels
 */
export interface INotificationDeliveryService {
  /**
   * Delivers a notification through specified channels
   * 
   * @param notification The notification to deliver
   * @param channels The channels to deliver through
   * @returns Delivery results for each attempted channel
   */
  deliverNotification(
    notification: NotificationModel, 
    channels: string[]
  ): Promise<NotificationDeliveryResult[]>;
  
  /**
   * Gets the delivery status for a notification
   * 
   * @param notificationId Notification ID
   * @returns Delivery results for the notification
   */
  getDeliveryStatus(notificationId: string): Promise<NotificationDeliveryResult[]>;
}