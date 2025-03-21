import { 
  Notification,
  NotificationType,
  NotificationCategory,
  NotificationPriority,
  NotificationChannel,
  NotificationStatus
} from '../types/notification.types';

import {
  NOTIFICATION_STATUSES,
  NOTIFICATION_TYPE_MAPPING,
  DEFAULT_NOTIFICATION_CHANNELS
} from '../constants/notification-types';

/**
 * Model class representing a notification entity in the Revolucare system.
 * Handles notification state management and provides methods for manipulating
 * notification data.
 */
export class NotificationModel {
  id: string;
  userId: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  data: Record<string, any> | null;
  priority: NotificationPriority;
  channels: NotificationChannel[];
  status: NotificationStatus;
  createdAt: Date;
  sentAt: Date | null;
  readAt: Date | null;

  /**
   * Creates a new NotificationModel instance with the given data.
   * Sets default values for missing properties.
   * 
   * @param data Partial notification data to initialize the model
   */
  constructor(data: Partial<Notification>) {
    // Generate default values
    this.id = data.id || crypto.randomUUID();
    this.userId = data.userId || '';
    this.type = data.type || '' as NotificationType;
    this.title = data.title || '';
    this.message = data.message || '';
    this.data = data.data || null;
    this.createdAt = data.createdAt || new Date();
    this.sentAt = data.sentAt || null;
    this.readAt = data.readAt || null;
    this.status = data.status || NOTIFICATION_STATUSES.PENDING;

    // Set category based on type mapping if not provided
    this.category = data.category || 
      (this.type && NOTIFICATION_TYPE_MAPPING[this.type]?.category) || 
      '' as NotificationCategory;

    // Set priority based on type mapping if not provided
    this.priority = data.priority || 
      (this.type && NOTIFICATION_TYPE_MAPPING[this.type]?.defaultPriority) || 
      'normal' as NotificationPriority;

    // Set default channels if not provided
    this.channels = data.channels || [...DEFAULT_NOTIFICATION_CHANNELS];
  }

  /**
   * Converts the model to a plain JSON object
   * 
   * @returns A plain object representation of the notification
   */
  toJSON(): Notification {
    return {
      id: this.id,
      userId: this.userId,
      type: this.type,
      category: this.category,
      title: this.title,
      message: this.message,
      data: this.data,
      priority: this.priority,
      channels: [...this.channels],
      status: this.status,
      createdAt: this.createdAt,
      sentAt: this.sentAt,
      readAt: this.readAt
    };
  }

  /**
   * Marks the notification as sent
   * 
   * @returns The updated notification model for method chaining
   */
  markAsSent(): NotificationModel {
    this.status = NOTIFICATION_STATUSES.SENT;
    this.sentAt = new Date();
    return this;
  }

  /**
   * Marks the notification as delivered
   * 
   * @returns The updated notification model for method chaining
   */
  markAsDelivered(): NotificationModel {
    this.status = NOTIFICATION_STATUSES.DELIVERED;
    return this;
  }

  /**
   * Marks the notification as read
   * 
   * @returns The updated notification model for method chaining
   */
  markAsRead(): NotificationModel {
    this.status = NOTIFICATION_STATUSES.READ;
    this.readAt = new Date();
    return this;
  }

  /**
   * Marks the notification as failed
   * 
   * @returns The updated notification model for method chaining
   */
  markAsFailed(): NotificationModel {
    this.status = NOTIFICATION_STATUSES.FAILED;
    return this;
  }

  /**
   * Checks if the notification has been read
   * 
   * @returns True if the notification has been read
   */
  isRead(): boolean {
    return this.status === NOTIFICATION_STATUSES.READ;
  }

  /**
   * Checks if the notification has been delivered
   * 
   * @returns True if the notification has been delivered or read
   */
  isDelivered(): boolean {
    return this.status === NOTIFICATION_STATUSES.DELIVERED || 
           this.status === NOTIFICATION_STATUSES.READ;
  }

  /**
   * Checks if the notification has been sent
   * 
   * @returns True if the notification has been sent, delivered, or read
   */
  isSent(): boolean {
    return this.status === NOTIFICATION_STATUSES.SENT || 
           this.status === NOTIFICATION_STATUSES.DELIVERED || 
           this.status === NOTIFICATION_STATUSES.READ;
  }

  /**
   * Checks if the notification delivery has failed
   * 
   * @returns True if the notification delivery has failed
   */
  isFailed(): boolean {
    return this.status === NOTIFICATION_STATUSES.FAILED;
  }

  /**
   * Checks if the notification is pending delivery
   * 
   * @returns True if the notification is pending delivery
   */
  isPending(): boolean {
    return this.status === NOTIFICATION_STATUSES.PENDING;
  }

  /**
   * Adds a delivery channel to the notification
   * 
   * @param channel The notification channel to add
   * @returns The updated notification model for method chaining
   */
  addChannel(channel: NotificationChannel): NotificationModel {
    if (!this.channels.includes(channel)) {
      this.channels.push(channel);
    }
    return this;
  }

  /**
   * Removes a delivery channel from the notification
   * 
   * @param channel The notification channel to remove
   * @returns The updated notification model for method chaining
   */
  removeChannel(channel: NotificationChannel): NotificationModel {
    this.channels = this.channels.filter(ch => ch !== channel);
    return this;
  }

  /**
   * Checks if the notification has a specific delivery channel
   * 
   * @param channel The notification channel to check for
   * @returns True if the notification has the specified channel
   */
  hasChannel(channel: NotificationChannel): boolean {
    return this.channels.includes(channel);
  }

  /**
   * Sets additional data for the notification
   * 
   * @param data The data object to set
   * @returns The updated notification model for method chaining
   */
  setData(data: Record<string, any>): NotificationModel {
    this.data = data;
    return this;
  }

  /**
   * Creates a NotificationModel from a database entity
   * 
   * @param entity The database entity object
   * @returns A new NotificationModel instance
   */
  static fromEntity(entity: any): NotificationModel | null {
    if (!entity) return null;
    
    return new NotificationModel({
      id: entity.id,
      userId: entity.userId,
      type: entity.type,
      category: entity.category,
      title: entity.title,
      message: entity.message,
      data: entity.data,
      priority: entity.priority,
      channels: entity.channels,
      status: entity.status,
      createdAt: entity.createdAt,
      sentAt: entity.sentAt,
      readAt: entity.readAt
    });
  }

  /**
   * Creates a new notification with required fields
   * 
   * @param userId The user ID to create the notification for
   * @param type The type of notification
   * @param title The notification title
   * @param message The notification message
   * @param additionalData Additional notification data (optional)
   * @returns A new NotificationModel instance
   */
  static create(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    additionalData?: Partial<Notification>
  ): NotificationModel {
    const data: Partial<Notification> = {
      userId,
      type,
      title,
      message,
      ...additionalData
    };
    
    return new NotificationModel(data);
  }
}