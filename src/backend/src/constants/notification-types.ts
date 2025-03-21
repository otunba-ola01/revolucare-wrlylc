/**
 * Constants for notification types, categories, priorities, channels, and statuses
 * used throughout the Revolucare platform.
 * 
 * This file serves as a central reference for all notification-related enumerations
 * and mappings to ensure consistent usage across the application.
 */

/**
 * All possible notification types in the system
 */
export const NOTIFICATION_TYPES = {
  APPOINTMENT_REMINDER: 'appointment_reminder',
  CARE_PLAN_CREATED: 'care_plan_created',
  CARE_PLAN_UPDATED: 'care_plan_updated',
  CARE_PLAN_APPROVED: 'care_plan_approved',
  SERVICE_PLAN_CREATED: 'service_plan_created',
  SERVICE_PLAN_UPDATED: 'service_plan_updated',
  SERVICE_PLAN_APPROVED: 'service_plan_approved',
  PROVIDER_MATCHED: 'provider_matched',
  PROVIDER_AVAILABILITY: 'provider_availability',
  DOCUMENT_UPLOADED: 'document_uploaded',
  DOCUMENT_ANALYZED: 'document_analyzed',
  MESSAGE_RECEIVED: 'message_received',
  PAYMENT_PROCESSED: 'payment_processed',
  PAYMENT_FAILED: 'payment_failed',
  ACCOUNT_CREATED: 'account_created',
  ACCOUNT_VERIFIED: 'account_verified',
  PASSWORD_RESET: 'password_reset',
  SYSTEM_UPDATE: 'system_update'
} as const;

/**
 * Categories for grouping notifications
 */
export const NOTIFICATION_CATEGORIES = {
  APPOINTMENT: 'appointment',
  CARE_PLAN: 'care_plan',
  SERVICE_PLAN: 'service_plan',
  PROVIDER: 'provider',
  DOCUMENT: 'document',
  MESSAGE: 'message',
  PAYMENT: 'payment',
  ACCOUNT: 'account',
  SYSTEM: 'system'
} as const;

/**
 * Priority levels for notifications
 */
export const NOTIFICATION_PRIORITIES = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent'
} as const;

/**
 * Delivery channels for notifications
 */
export const NOTIFICATION_CHANNELS = {
  IN_APP: 'in_app',
  EMAIL: 'email',
  SMS: 'sms'
} as const;

/**
 * Possible statuses for notifications
 */
export const NOTIFICATION_STATUSES = {
  PENDING: 'pending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
  FAILED: 'failed'
} as const;

/**
 * Maps notification types to their categories and default priorities
 */
export const NOTIFICATION_TYPE_MAPPING = {
  appointment_reminder: {
    category: NOTIFICATION_CATEGORIES.APPOINTMENT,
    defaultPriority: NOTIFICATION_PRIORITIES.HIGH
  },
  care_plan_created: {
    category: NOTIFICATION_CATEGORIES.CARE_PLAN,
    defaultPriority: NOTIFICATION_PRIORITIES.NORMAL
  },
  care_plan_updated: {
    category: NOTIFICATION_CATEGORIES.CARE_PLAN,
    defaultPriority: NOTIFICATION_PRIORITIES.NORMAL
  },
  care_plan_approved: {
    category: NOTIFICATION_CATEGORIES.CARE_PLAN,
    defaultPriority: NOTIFICATION_PRIORITIES.HIGH
  },
  service_plan_created: {
    category: NOTIFICATION_CATEGORIES.SERVICE_PLAN,
    defaultPriority: NOTIFICATION_PRIORITIES.NORMAL
  },
  service_plan_updated: {
    category: NOTIFICATION_CATEGORIES.SERVICE_PLAN,
    defaultPriority: NOTIFICATION_PRIORITIES.NORMAL
  },
  service_plan_approved: {
    category: NOTIFICATION_CATEGORIES.SERVICE_PLAN,
    defaultPriority: NOTIFICATION_PRIORITIES.HIGH
  },
  provider_matched: {
    category: NOTIFICATION_CATEGORIES.PROVIDER,
    defaultPriority: NOTIFICATION_PRIORITIES.HIGH
  },
  provider_availability: {
    category: NOTIFICATION_CATEGORIES.PROVIDER,
    defaultPriority: NOTIFICATION_PRIORITIES.NORMAL
  },
  document_uploaded: {
    category: NOTIFICATION_CATEGORIES.DOCUMENT,
    defaultPriority: NOTIFICATION_PRIORITIES.NORMAL
  },
  document_analyzed: {
    category: NOTIFICATION_CATEGORIES.DOCUMENT,
    defaultPriority: NOTIFICATION_PRIORITIES.NORMAL
  },
  message_received: {
    category: NOTIFICATION_CATEGORIES.MESSAGE,
    defaultPriority: NOTIFICATION_PRIORITIES.HIGH
  },
  payment_processed: {
    category: NOTIFICATION_CATEGORIES.PAYMENT,
    defaultPriority: NOTIFICATION_PRIORITIES.NORMAL
  },
  payment_failed: {
    category: NOTIFICATION_CATEGORIES.PAYMENT,
    defaultPriority: NOTIFICATION_PRIORITIES.URGENT
  },
  account_created: {
    category: NOTIFICATION_CATEGORIES.ACCOUNT,
    defaultPriority: NOTIFICATION_PRIORITIES.NORMAL
  },
  account_verified: {
    category: NOTIFICATION_CATEGORIES.ACCOUNT,
    defaultPriority: NOTIFICATION_PRIORITIES.NORMAL
  },
  password_reset: {
    category: NOTIFICATION_CATEGORIES.ACCOUNT,
    defaultPriority: NOTIFICATION_PRIORITIES.HIGH
  },
  system_update: {
    category: NOTIFICATION_CATEGORIES.SYSTEM,
    defaultPriority: NOTIFICATION_PRIORITIES.NORMAL
  }
};

/**
 * Default channels for sending notifications if not specified
 */
export const DEFAULT_NOTIFICATION_CHANNELS = [NOTIFICATION_CHANNELS.IN_APP];

// Type definitions to enhance type safety
export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES];
export type NotificationCategory = typeof NOTIFICATION_CATEGORIES[keyof typeof NOTIFICATION_CATEGORIES];
export type NotificationPriority = typeof NOTIFICATION_PRIORITIES[keyof typeof NOTIFICATION_PRIORITIES];
export type NotificationChannel = typeof NOTIFICATION_CHANNELS[keyof typeof NOTIFICATION_CHANNELS];
export type NotificationStatus = typeof NOTIFICATION_STATUSES[keyof typeof NOTIFICATION_STATUSES];