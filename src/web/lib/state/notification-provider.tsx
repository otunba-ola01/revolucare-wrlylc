import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  Notification,
  NotificationFilterOptions,
  NotificationStats,
  NotificationPreferences,
  NotificationContextType
} from '../../types/notification';
import {
  getNotifications,
  getNotificationStats,
  getNotificationPreferences,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  updateNotificationPreferences
} from '../api/notifications';
import { useAuth } from './auth-provider';

/**
 * React context for notification state and methods
 * Provides notification data and functionality to components
 */
const NotificationContext = createContext<NotificationContextType | null>(null);

/**
 * Initial state for notification context
 */
const initialNotificationState = {
  notifications: [] as Notification[],
  unreadCount: 0,
  stats: null as NotificationStats | null,
  preferences: null as NotificationPreferences | null,
  isLoading: false,
  error: null as string | null
};

/**
 * Provider component that manages notification state and provides it to children
 * Handles fetching, updating, and managing user notifications throughout the application
 */
export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State for notifications, stats, preferences, loading, and errors
  const [notifications, setNotifications] = useState<Notification[]>(initialNotificationState.notifications);
  const [unreadCount, setUnreadCount] = useState<number>(initialNotificationState.unreadCount);
  const [stats, setStats] = useState<NotificationStats | null>(initialNotificationState.stats);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(initialNotificationState.preferences);
  const [isLoading, setIsLoading] = useState<boolean>(initialNotificationState.isLoading);
  const [error, setError] = useState<string | null>(initialNotificationState.error);

  // Get authentication state from auth context
  const { isAuthenticated, user } = useAuth();

  /**
   * Fetches notifications with optional filtering
   * @param filters Optional filter criteria for notifications
   */
  const fetchNotifications = useCallback(async (filters?: NotificationFilterOptions): Promise<void> => {
    if (!isAuthenticated || !user) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await getNotifications(filters);
      setNotifications(response.data);
      
      // Calculate unread count from the response
      const unreadCount = response.data.filter(notification => 
        notification.status !== 'read' && notification.readAt === null
      ).length;
      setUnreadCount(unreadCount);

      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      setError(error instanceof Error ? error.message : 'Failed to fetch notifications');
      console.error('Error fetching notifications:', error);
    }
  }, [isAuthenticated, user]);

  /**
   * Fetches notification statistics for the current user
   */
  const fetchNotificationStats = useCallback(async (): Promise<void> => {
    if (!isAuthenticated || !user) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await getNotificationStats();
      setStats(response.stats);

      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      setError(error instanceof Error ? error.message : 'Failed to fetch notification statistics');
      console.error('Error fetching notification statistics:', error);
    }
  }, [isAuthenticated, user]);

  /**
   * Fetches notification preferences for the current user
   */
  const fetchNotificationPreferences = useCallback(async (): Promise<void> => {
    if (!isAuthenticated || !user) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await getNotificationPreferences();
      setPreferences(response.preferences);

      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      setError(error instanceof Error ? error.message : 'Failed to fetch notification preferences');
      console.error('Error fetching notification preferences:', error);
    }
  }, [isAuthenticated, user]);

  /**
   * Marks a specific notification as read
   * @param id The ID of the notification to mark as read
   */
  const handleMarkAsRead = useCallback(async (id: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await markAsRead(id);
      const updatedNotification = response.notification;

      // Update local state to reflect the change
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === id ? updatedNotification : notification
        )
      );
      
      // If the notification was previously unread, decrement the unread count
      const wasUnread = notifications.find(n => n.id === id)?.status !== 'read';
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      setError(error instanceof Error ? error.message : 'Failed to mark notification as read');
      console.error('Error marking notification as read:', error);
    }
  }, [notifications]);

  /**
   * Marks all notifications as read
   */
  const handleMarkAllAsRead = useCallback(async (): Promise<void> => {
    if (unreadCount === 0) return; // No need to make an API call if there are no unread notifications

    try {
      setIsLoading(true);
      setError(null);

      const response = await markAllAsRead();
      
      // Update local state to reflect the change - all notifications are now read
      setNotifications(prev =>
        prev.map(notification => ({
          ...notification,
          status: 'read',
          readAt: notification.readAt || new Date().toISOString()
        }))
      );
      setUnreadCount(0);

      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      setError(error instanceof Error ? error.message : 'Failed to mark all notifications as read');
      console.error('Error marking all notifications as read:', error);
    }
  }, [unreadCount]);

  /**
   * Deletes a specific notification
   * @param id The ID of the notification to delete
   */
  const handleDeleteNotification = useCallback(async (id: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      // Find the notification before deleting it to check its read status
      const notificationToDelete = notifications.find(n => n.id === id);
      await deleteNotification(id);

      // Update local state to reflect the deletion
      setNotifications(prev => prev.filter(notification => notification.id !== id));
      
      // If the deleted notification was unread, decrement the unread count
      if (notificationToDelete && notificationToDelete.status !== 'read') {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      setError(error instanceof Error ? error.message : 'Failed to delete notification');
      console.error('Error deleting notification:', error);
    }
  }, [notifications]);

  /**
   * Updates notification preferences
   * @param updatedPreferences Updated notification preference settings
   */
  const handleUpdatePreferences = useCallback(async (updatedPreferences: Partial<NotificationPreferences>): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await updateNotificationPreferences(updatedPreferences);
      setPreferences(response.preferences);

      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      setError(error instanceof Error ? error.message : 'Failed to update notification preferences');
      console.error('Error updating notification preferences:', error);
    }
  }, []);

  // Fetch notifications, stats, and preferences when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchNotifications();
      fetchNotificationStats();
      fetchNotificationPreferences();
    } else {
      // Reset state when user is not authenticated
      setNotifications(initialNotificationState.notifications);
      setUnreadCount(initialNotificationState.unreadCount);
      setStats(initialNotificationState.stats);
      setPreferences(initialNotificationState.preferences);
    }
  }, [isAuthenticated, user, fetchNotifications, fetchNotificationStats, fetchNotificationPreferences]);

  // Create the context value object with all state and methods
  const contextValue: NotificationContextType = {
    notifications,
    unreadCount,
    stats,
    preferences,
    isLoading,
    error,
    fetchNotifications,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    deleteNotification: handleDeleteNotification,
    updatePreferences: handleUpdatePreferences,
    fetchNotificationStats,
    fetchNotificationPreferences
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

/**
 * Custom hook to access the notification context
 * Must be used within a NotificationProvider component
 */
export const useNotificationContext = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};

export { NotificationContext };