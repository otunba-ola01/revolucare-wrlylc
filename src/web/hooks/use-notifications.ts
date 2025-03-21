import { useEffect, useCallback, useState } from 'react';
import { useNotificationContext } from '../lib/state/notification-provider';
import { useAuth } from './use-auth';
import { useToast } from './use-toast';
import { 
  Notification, 
  NotificationFilterOptions, 
  NotificationStats, 
  NotificationPreferences 
} from '../types/notification';

/**
 * A hook that provides access to notification functionality and state
 * 
 * @param initialFilters Optional initial filters to apply to notifications
 * @returns Notification state and functions
 */
export function useNotifications(initialFilters?: NotificationFilterOptions) {
  // Get context hooks
  const notification = useNotificationContext();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  
  // Local state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<NotificationFilterOptions>(initialFilters || {});

  // Fetch notifications with filters
  const fetchNotifications = useCallback(async (newFilters?: NotificationFilterOptions) => {
    if (!isAuthenticated) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const appliedFilters = newFilters || filters;
      await notification.fetchNotifications(appliedFilters);
      
      if (newFilters) {
        setFilters(newFilters);
      }
      
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
      console.error('Error fetching notifications:', err);
    }
  }, [isAuthenticated, filters, notification.fetchNotifications]);

  // Mark a notification as read
  const markAsRead = useCallback(async (id: string) => {
    if (!isAuthenticated) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      await notification.markAsRead(id);
      
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
      setError(err instanceof Error ? err.message : 'Failed to mark notification as read');
      console.error('Error marking notification as read:', err);
    }
  }, [isAuthenticated, notification.markAsRead]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!isAuthenticated || notification.unreadCount === 0) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      await notification.markAllAsRead();
      
      setIsLoading(false);
      toast({
        title: 'Notifications marked as read',
        variant: 'success',
        duration: 3000
      });
    } catch (err) {
      setIsLoading(false);
      setError(err instanceof Error ? err.message : 'Failed to mark all notifications as read');
      console.error('Error marking all notifications as read:', err);
      
      toast({
        title: 'Failed to mark notifications as read',
        description: err instanceof Error ? err.message : undefined,
        variant: 'error',
        duration: 3000
      });
    }
  }, [isAuthenticated, notification.unreadCount, notification.markAllAsRead, toast]);

  // Delete a notification
  const deleteNotification = useCallback(async (id: string) => {
    if (!isAuthenticated) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      await notification.deleteNotification(id);
      
      setIsLoading(false);
      toast({
        title: 'Notification deleted',
        variant: 'success',
        duration: 3000
      });
    } catch (err) {
      setIsLoading(false);
      setError(err instanceof Error ? err.message : 'Failed to delete notification');
      console.error('Error deleting notification:', err);
      
      toast({
        title: 'Failed to delete notification',
        description: err instanceof Error ? err.message : undefined,
        variant: 'error',
        duration: 3000
      });
    }
  }, [isAuthenticated, notification.deleteNotification, toast]);

  // Update notification preferences
  const updatePreferences = useCallback(async (preferences: Partial<NotificationPreferences>) => {
    if (!isAuthenticated) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      await notification.updatePreferences(preferences);
      
      setIsLoading(false);
      toast({
        title: 'Notification preferences updated',
        variant: 'success',
        duration: 3000
      });
    } catch (err) {
      setIsLoading(false);
      setError(err instanceof Error ? err.message : 'Failed to update notification preferences');
      console.error('Error updating notification preferences:', err);
      
      toast({
        title: 'Failed to update notification preferences',
        description: err instanceof Error ? err.message : undefined,
        variant: 'error',
        duration: 3000
      });
    }
  }, [isAuthenticated, notification.updatePreferences, toast]);

  // Handle new notifications with toast display
  const handleNewNotification = useCallback((newNotification: Notification) => {
    toast({
      title: newNotification.title,
      description: newNotification.message,
      variant: newNotification.priority === 'urgent' ? 'error' : 
               newNotification.priority === 'high' ? 'warning' : 
               newNotification.priority === 'normal' ? 'default' : 'info',
      duration: 5000,
      action: {
        label: 'View',
        onClick: () => markAsRead(newNotification.id)
      }
    });
  }, [toast, markAsRead]);

  // Fetch notifications when component mounts or filters change
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchNotifications();
    }
  }, [isAuthenticated, user, filters, fetchNotifications]);

  // Fetch notification stats and preferences when component mounts
  useEffect(() => {
    if (isAuthenticated && user) {
      notification.fetchNotificationStats();
      notification.fetchNotificationPreferences();
    }
  }, [isAuthenticated, user, notification.fetchNotificationStats, notification.fetchNotificationPreferences]);

  return {
    // State
    notifications: notification.notifications,
    unreadCount: notification.unreadCount,
    stats: notification.stats,
    preferences: notification.preferences,
    isLoading: isLoading || notification.isLoading,
    error: error || notification.error,
    filters,
    
    // Actions
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updatePreferences,
    setFilters
  };
}