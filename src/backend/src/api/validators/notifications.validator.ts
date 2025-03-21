import { z } from 'zod'; // zod v3.21.4
import {
  NOTIFICATION_TYPES,
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_PRIORITIES,
  NOTIFICATION_CHANNELS
} from '../../constants/notification-types';
import {
  NotificationType,
  NotificationCategory,
  NotificationPriority,
  NotificationChannel
} from '../../types/notification.types';

/**
 * Validation schema for creating a new notification
 * 
 * Validates request payload when creating notifications to ensure
 * all required fields are present and properly formatted
 */
export const createNotificationSchema = z.object({
  userId: z.string().uuid({ message: 'Invalid user ID format' }),
  type: z.enum(Object.values(NOTIFICATION_TYPES) as [NotificationType, ...NotificationType[]]),
  title: z.string().min(1, { message: 'Title is required' }).max(100, { message: 'Title cannot exceed 100 characters' }),
  message: z.string().min(1, { message: 'Message is required' }).max(500, { message: 'Message cannot exceed 500 characters' }),
  data: z.record(z.string(), z.any()).nullable().optional(),
  priority: z.enum(Object.values(NOTIFICATION_PRIORITIES) as [NotificationPriority, ...NotificationPriority[]]).optional(),
  channels: z.array(
    z.enum(Object.values(NOTIFICATION_CHANNELS) as [NotificationChannel, ...NotificationChannel[]])
  ).optional()
});

/**
 * Validation schema for notification filtering options
 * 
 * Validates query parameters when fetching notifications with filters
 */
export const notificationFilterSchema = z.object({
  type: z.enum(Object.values(NOTIFICATION_TYPES) as [NotificationType, ...NotificationType[]]).optional(),
  category: z.enum(Object.values(NOTIFICATION_CATEGORIES) as [NotificationCategory, ...NotificationCategory[]]).optional(),
  status: z.enum(['pending', 'sent', 'delivered', 'read', 'failed']).optional(),
  priority: z.enum(Object.values(NOTIFICATION_PRIORITIES) as [NotificationPriority, ...NotificationPriority[]]).optional(),
  startDate: z.string().datetime({ message: 'Invalid start date format' }).optional(),
  endDate: z.string().datetime({ message: 'Invalid end date format' }).optional(),
  read: z.boolean().optional(),
  search: z.string().max(100, { message: 'Search term cannot exceed 100 characters' }).optional(),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(20)
});

/**
 * Validation schema for notification ID in URL parameters
 * 
 * Ensures the notification ID is in the correct UUID format
 */
export const notificationIdParamSchema = z.object({
  id: z.string().uuid({ message: 'Invalid notification ID format' })
});

/**
 * Validation schema for updating notification preferences
 * 
 * Validates request payload when updating a user's notification preferences
 */
export const notificationPreferencesSchema = z.object({
  channels: z.record(
    z.enum(Object.values(NOTIFICATION_CHANNELS) as [NotificationChannel, ...NotificationChannel[]]),
    z.boolean()
  ).optional(),
  types: z.record(
    z.enum(Object.values(NOTIFICATION_TYPES) as [NotificationType, ...NotificationType[]]),
    z.object({
      enabled: z.boolean(),
      channels: z.array(
        z.enum(Object.values(NOTIFICATION_CHANNELS) as [NotificationChannel, ...NotificationChannel[]])
      )
    })
  ).optional(),
  quietHours: z.object({
    enabled: z.boolean(),
    start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { 
      message: 'Start time must be in HH:MM format' 
    }),
    end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { 
      message: 'End time must be in HH:MM format' 
    }),
    timezone: z.string()
  }).optional()
});

/**
 * Validation schema for marking notifications as read
 * 
 * Validates request payload when marking a notification as read
 */
export const markAsReadSchema = z.object({
  id: z.string().uuid({ message: 'Invalid notification ID format' })
});

/**
 * Validation schema for pagination parameters
 * 
 * Reusable schema for validating pagination parameters across multiple endpoints
 */
export const paginationSchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(20)
});