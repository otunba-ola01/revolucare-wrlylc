/**
 * Type definition for notification types in the system
 * These values represent different events that can trigger notifications
 */
export type NotificationType = 
  | 'appointment_reminder'
  | 'appointment_created'
  | 'appointment_modified'
  | 'appointment_cancelled'
  | 'care_plan_created'
  | 'care_plan_updated'
  | 'care_plan_approved'
  | 'service_plan_created'
  | 'service_plan_updated'
  | 'provider_matched'
  | 'document_uploaded'
  | 'document_analyzed'
  | 'message_received'
  | 'system_notification'
  | 'payment_processed'
  | 'payment_failed'
  | 'account_created'
  | 'account_updated'
  | 'billing_reminder';

/**
 * Type definition for notification categories
 * Used for grouping similar notifications together
 */
export type NotificationCategory =
  | 'appointment'
  | 'care_plan'
  | 'service_plan'
  | 'provider'
  | 'document'
  | 'message'
  | 'system'
  | 'payment'
  | 'account'
  | 'billing';

/**
 * Type definition for notification priorities
 * Determines visual treatment and delivery urgency
 */
export type NotificationPriority =
  | 'low'
  | 'normal'
  | 'high'
  | 'urgent';

/**
 * Type definition for notification delivery channels
 * Specifies how notifications should be delivered to users
 */
export type NotificationChannel =
  | 'in_app'
  | 'email'
  | 'sms';

/**
 * Type definition for notification statuses
 * Tracks the delivery and read status of notifications
 */
export type NotificationStatus =
  | 'pending'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed';

/**
 * Interface representing a notification entity in the system
 */
export interface Notification {
  /**
   * Unique identifier for the notification
   */
  id: string;
  
  /**
   * ID of the user who should receive this notification
   */
  userId: string;
  
  /**
   * Type of notification that determines its content template
   */
  type: NotificationType;
  
  /**
   * Category the notification belongs to for grouping
   */
  category: NotificationCategory;
  
  /**
   * Short title/heading for the notification
   */
  title: string;
  
  /**
   * Main content of the notification
   */
  message: string;
  
  /**
   * Additional structured data relevant to the notification
   * Can include entity IDs, action URLs, etc.
   */
  data: Record<string, any> | null;
  
  /**
   * Priority level that affects visual treatment and delivery urgency
   */
  priority: NotificationPriority;
  
  /**
   * Delivery channels this notification was sent through
   */
  channels: NotificationChannel[];
  
  /**
   * Current status of the notification
   */
  status: NotificationStatus;
  
  /**
   * Timestamp when the notification was created
   * ISO 8601 format
   */
  createdAt: string;
  
  /**
   * Timestamp when the notification was sent
   * ISO 8601 format, null if not yet sent
   */
  sentAt: string | null;
  
  /**
   * Timestamp when the notification was read by the user
   * ISO 8601 format, null if not yet read
   */
  readAt: string | null;
}

/**
 * Options for filtering notifications in queries
 */
export interface NotificationFilterOptions {
  /**
   * Filter by notification type
   */
  type?: NotificationType;
  
  /**
   * Filter by notification category
   */
  category?: NotificationCategory;
  
  /**
   * Filter by notification status
   */
  status?: NotificationStatus;
  
  /**
   * Filter by priority level
   */
  priority?: NotificationPriority;
  
  /**
   * Filter by start date (inclusive)
   * ISO 8601 format
   */
  startDate?: string;
  
  /**
   * Filter by end date (inclusive)
   * ISO 8601 format
   */
  endDate?: string;
  
  /**
   * Filter by read status
   * true = read, false = unread
   */
  read?: boolean;
  
  /**
   * Text search in notification title and message
   */
  search?: string;
}

/**
 * Statistics about a user's notifications
 */
export interface NotificationStats {
  /**
   * Total number of notifications
   */
  total: number;
  
  /**
   * Number of unread notifications
   */
  unread: number;
  
  /**
   * Count of notifications by category
   */
  byCategory: Record<NotificationCategory, number>;
  
  /**
   * Count of notifications by priority
   */
  byPriority: Record<NotificationPriority, number>;
}

/**
 * User preferences for notification delivery
 */
export interface NotificationPreferences {
  /**
   * ID of the user these preferences belong to
   */
  userId: string;
  
  /**
   * Enabled/disabled status for each channel
   */
  channels: Record<NotificationChannel, boolean>;
  
  /**
   * Preferences for each notification type
   */
  types: Record<NotificationType, {
    /**
     * Whether this notification type is enabled
     */
    enabled: boolean;
    
    /**
     * Which channels to use for this notification type
     */
    channels: NotificationChannel[];
  }>;
  
  /**
   * Quiet hours configuration when notifications shouldn't be sent
   */
  quietHours: {
    /**
     * Whether quiet hours are enabled
     */
    enabled: boolean;
    
    /**
     * Start time in 24-hour format (HH:MM)
     */
    start: string;
    
    /**
     * End time in 24-hour format (HH:MM)
     */
    end: string;
    
    /**
     * Timezone for quiet hours (IANA format)
     */
    timezone: string;
  };
  
  /**
   * When preferences were last updated
   * ISO 8601 format
   */
  updatedAt: string;
}

/**
 * Data transfer object for updating notification preferences
 * All fields are optional to allow partial updates
 */
export interface NotificationPreferencesUpdateDTO {
  /**
   * Updated channel settings
   */
  channels?: Partial<Record<NotificationChannel, boolean>>;
  
  /**
   * Updated notification type settings
   */
  types?: Partial<Record<NotificationType, {
    enabled: boolean;
    channels: NotificationChannel[];
  }>>;
  
  /**
   * Updated quiet hours settings
   */
  quietHours?: {
    enabled: boolean;
    start: string;
    end: string;
    timezone: string;
  };
}

/**
 * Result of a notification delivery attempt through a specific channel
 */
export interface NotificationDeliveryResult {
  /**
   * Whether delivery was successful
   */
  success: boolean;
  
  /**
   * Channel that was used for delivery
   */
  channel: NotificationChannel;
  
  /**
   * Error message if delivery failed
   */
  error: string | null;
  
  /**
   * Additional metadata about the delivery
   * (e.g. message ID from email service)
   */
  metadata: Record<string, any> | null;
}

/**
 * Type definition for the notification context used in the React context provider
 */
export interface NotificationContextType {
  /**
   * List of notifications for the current user
   */
  notifications: Notification[];
  
  /**
   * Count of unread notifications
   */
  unreadCount: number;
  
  /**
   * Statistics about user's notifications
   */
  stats: NotificationStats | null;
  
  /**
   * User's notification preferences
   */
  preferences: NotificationPreferences | null;
  
  /**
   * Whether notifications are currently loading
   */
  isLoading: boolean;
  
  /**
   * Error message if notification loading failed
   */
  error: string | null;
  
  /**
   * Fetch notifications with optional filters
   */
  fetchNotifications: (filters?: NotificationFilterOptions) => Promise<void>;
  
  /**
   * Mark a specific notification as read
   */
  markAsRead: (id: string) => Promise<void>;
  
  /**
   * Mark all notifications as read
   */
  markAllAsRead: () => Promise<void>;
  
  /**
   * Delete a specific notification
   */
  deleteNotification: (id: string) => Promise<void>;
  
  /**
   * Update notification preferences
   */
  updatePreferences: (preferences: Partial<NotificationPreferences>) => Promise<void>;
  
  /**
   * Fetch notification statistics
   */
  fetchNotificationStats: () => Promise<void>;
  
  /**
   * Fetch notification preferences
   */
  fetchNotificationPreferences: () => Promise<void>;
}

/**
 * Base interface for API responses
 */
export interface ApiResponseBase {
  /**
   * Whether the request was successful
   */
  success: boolean;
  
  /**
   * Message describing the result
   */
  message: string;
}

/**
 * API response containing a single notification
 */
export interface NotificationResponse extends ApiResponseBase {
  /**
   * The notification data
   */
  notification: Notification;
}

/**
 * API response containing a list of notifications with metadata
 */
export interface NotificationsResponse extends ApiResponseBase {
  /**
   * List of notifications
   */
  notifications: Notification[];
  
  /**
   * Count of unread notifications
   */
  unreadCount: number;
  
  /**
   * Total count of notifications (for pagination)
   */
  totalCount: number;
}

/**
 * Paginated response for notification listings
 */
export interface NotificationPaginatedResponse extends ApiResponseBase {
  /**
   * Array of notification objects
   */
  data: Notification[];
  
  /**
   * Pagination metadata
   */
  meta: {
    /**
     * Total number of notifications matching the query
     */
    total: number;
    
    /**
     * Current page number
     */
    page: number;
    
    /**
     * Number of items per page
     */
    limit: number;
    
    /**
     * Total number of pages
     */
    totalPages: number;
  };
}