import {
  NOTIFICATION_TYPES,
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_PRIORITIES,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_STATUSES
} from '../constants/notification-types';

/**
 * Generic interface for paginated notification responses
 */
export interface NotificationPaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Type definition for notification types based on constants
 */
export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES];

/**
 * Type definition for notification categories based on constants
 */
export type NotificationCategory = typeof NOTIFICATION_CATEGORIES[keyof typeof NOTIFICATION_CATEGORIES];

/**
 * Type definition for notification priorities based on constants
 */
export type NotificationPriority = typeof NOTIFICATION_PRIORITIES[keyof typeof NOTIFICATION_PRIORITIES];

/**
 * Type definition for notification channels based on constants
 */
export type NotificationChannel = typeof NOTIFICATION_CHANNELS[keyof typeof NOTIFICATION_CHANNELS];

/**
 * Type definition for notification statuses based on constants
 */
export type NotificationStatus = typeof NOTIFICATION_STATUSES[keyof typeof NOTIFICATION_STATUSES];

/**
 * Interface representing a notification entity in the system
 */
export interface Notification {
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
}

/**
 * Data transfer object for creating a new notification
 */
export interface CreateNotificationDTO {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, any> | null;
  priority?: NotificationPriority;
  channels?: NotificationChannel[];
}

/**
 * Options for filtering notifications in queries
 */
export interface NotificationFilterOptions {
  type?: NotificationType;
  category?: NotificationCategory;
  status?: NotificationStatus;
  priority?: NotificationPriority;
  startDate?: Date;
  endDate?: Date;
  read?: boolean;
  search?: string;
}

/**
 * Statistics about a user's notifications
 */
export interface NotificationStats {
  total: number;
  unread: number;
  byCategory: Record<NotificationCategory, number>;
  byPriority: Record<NotificationPriority, number>;
}

/**
 * User preferences for notification delivery
 */
export interface NotificationPreferences {
  userId: string;
  channels: Record<NotificationChannel, boolean>;
  types: Record<NotificationType, { 
    enabled: boolean; 
    channels: NotificationChannel[] 
  }>;
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string; // HH:MM format
    timezone: string;
  };
  updatedAt: Date;
}

/**
 * Data transfer object for updating notification preferences
 */
export interface NotificationPreferencesUpdateDTO {
  channels?: Partial<Record<NotificationChannel, boolean>>;
  types?: Partial<Record<NotificationType, { 
    enabled: boolean; 
    channels: NotificationChannel[] 
  }>>;
  quietHours?: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string; // HH:MM format
    timezone: string;
  };
}

/**
 * Result of a notification delivery attempt through a specific channel
 */
export interface NotificationDeliveryResult {
  success: boolean;
  channel: NotificationChannel;
  error: string | null;
  metadata: Record<string, any> | null;
}