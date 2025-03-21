/**
 * API client module for interacting with the notification endpoints of the Revolucare backend.
 * This file provides functions for fetching, managing, and manipulating user notifications,
 * notification preferences, and notification statistics.
 */

import { get, post, put, delete as httpDelete } from './client';
import {
  Notification,
  NotificationFilterOptions,
  NotificationPreferences,
  NotificationPreferencesUpdateDTO,
  NotificationStats,
  NotificationsResponse,
  NotificationResponse,
  NotificationPaginatedResponse
} from '../../types/notification';

/**
 * Fetches notifications for the current user with optional filtering and pagination
 * 
 * @param filters - Optional filtering options for notifications
 * @param page - Page number for pagination (1-based)
 * @param limit - Number of notifications per page
 * @returns Promise resolving to paginated notifications response
 */
export async function getNotifications(
  filters?: NotificationFilterOptions,
  page?: number,
  limit?: number
): Promise<NotificationPaginatedResponse> {
  // Construct query parameters
  const queryParams: Record<string, any> = {
    ...(filters || {}),
    ...(page !== undefined ? { page } : {}),
    ...(limit !== undefined ? { limit } : {})
  };

  // Make the API request
  return get<NotificationPaginatedResponse>('/api/notifications', queryParams);
}

/**
 * Fetches a single notification by its ID
 * 
 * @param id - ID of the notification to fetch
 * @returns Promise resolving to notification response
 */
export async function getNotificationById(id: string): Promise<NotificationResponse> {
  return get<NotificationResponse>(`/api/notifications/${id}`);
}

/**
 * Marks a specific notification as read
 * 
 * @param id - ID of the notification to mark as read
 * @returns Promise resolving to updated notification response
 */
export async function markAsRead(id: string): Promise<NotificationResponse> {
  return put<NotificationResponse>(`/api/notifications/${id}/read`);
}

/**
 * Marks all notifications for the current user as read
 * 
 * @returns Promise resolving to success response with count of updated notifications
 */
export async function markAllAsRead(): Promise<{ success: boolean; message: string; count: number }> {
  return put<{ success: boolean; message: string; count: number }>('/api/notifications/read-all');
}

/**
 * Deletes a specific notification
 * 
 * @param id - ID of the notification to delete
 * @returns Promise resolving to success response
 */
export async function deleteNotification(id: string): Promise<{ success: boolean; message: string }> {
  return httpDelete<{ success: boolean; message: string }>(`/api/notifications/${id}`);
}

/**
 * Fetches notification statistics for the current user
 * 
 * @returns Promise resolving to notification statistics
 */
export async function getNotificationStats(): Promise<{ success: boolean; message: string; stats: NotificationStats }> {
  return get<{ success: boolean; message: string; stats: NotificationStats }>('/api/notifications/stats');
}

/**
 * Fetches notification preferences for the current user
 * 
 * @returns Promise resolving to notification preferences
 */
export async function getNotificationPreferences(): Promise<{ success: boolean; message: string; preferences: NotificationPreferences }> {
  return get<{ success: boolean; message: string; preferences: NotificationPreferences }>('/api/notifications/preferences');
}

/**
 * Updates notification preferences for the current user
 * 
 * @param preferences - Updated notification preferences
 * @returns Promise resolving to updated notification preferences
 */
export async function updateNotificationPreferences(
  preferences: NotificationPreferencesUpdateDTO
): Promise<{ success: boolean; message: string; preferences: NotificationPreferences }> {
  return put<{ success: boolean; message: string; preferences: NotificationPreferences }>(
    '/api/notifications/preferences',
    preferences
  );
}