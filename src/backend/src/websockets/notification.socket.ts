/**
 * Implements WebSocket functionality for real-time notifications in the Revolucare platform.
 * This module enables instant delivery of notifications to connected clients, manages
 * notification subscriptions, and handles notification acknowledgments.
 *
 * @module websockets/notification.socket
 */

import { Server, Socket } from 'socket.io'; // socket.io@^4.6.1
import { authenticateSocket, extractTokenFromSocketHandshake } from './authentication.socket';
import { logger } from '../utils/logger';
import { NotificationService } from '../services/notifications.service';
import {
  Notification,
  NotificationFilterOptions,
  NotificationStats,
} from '../types/notification.types';
import { AuthService } from '../services/auth.service';
import { UserContext } from '../types/user.types';

/**
 * Sets up WebSocket handlers for notification functionality
 *
 * @param io - Socket.IO server instance
 * @param notificationService - NotificationService instance
 * @param authService - AuthService instance
 */
export function setupNotificationSocket(
  io: Server,
  notificationService: NotificationService,
  authService: AuthService
): void {
  // Create a namespace for notification-related WebSocket connections
  const notificationNamespace = io.of('/notifications');

  // Set up authentication middleware for the namespace
  notificationNamespace.use((socket, next) => {
    authenticateSocket(socket, next, authService);
  });

  // Handle connection events for new socket connections
  notificationNamespace.on('connection', (socket: Socket) => {
    handleNotificationConnection(socket, notificationService);
  });

  // Set up notification service event listeners
  setupNotificationListeners(notificationNamespace, notificationService);

  // Log successful setup of notification WebSocket handlers
  logger.info('Notification WebSocket handlers set up');
}

/**
 * Handles new WebSocket connections to the notification namespace
 *
 * @param socket - Socket.IO socket instance
 * @param notificationService - NotificationService instance
 */
function handleNotificationConnection(
  socket: Socket,
  notificationService: NotificationService
): void {
  // Extract user ID and role from socket data
  const userId = socket.data.user.userId;
  const userRole = socket.data.user.role;

  // Log new connection with user ID
  logger.info('New notification socket connection', {
    socketId: socket.id,
    userId,
    userRole,
  });

  // Join user-specific room for targeted notifications
  socket.join(`user:${userId}`);

  // Set up event handlers for notification-related events
  socket.on('getNotifications', (data: any, callback: Function) => {
    handleGetNotifications(socket, data, callback, notificationService);
  });

  socket.on('markAsRead', (data: any, callback: Function) => {
    handleMarkAsRead(socket, data, callback, notificationService);
  });

  socket.on('markAllAsRead', (data: any, callback: Function) => {
    handleMarkAllAsRead(socket, data, callback, notificationService);
  });

  socket.on('getNotificationStats', (data: any, callback: Function) => {
    handleGetNotificationStats(socket, data, callback, notificationService);
  });

  // Handle disconnection event
  socket.on('disconnect', (reason) => {
    logger.info('Notification socket disconnected', {
      socketId: socket.id,
      userId,
      reason,
    });
  });

  // Send initial notification stats to the client
  notificationService
    .getNotificationStats(userId)
    .then((stats) => {
      sendNotificationStatsToUser(socket.nsp, userId, stats);
    })
    .catch((error) => {
      logger.error('Failed to get initial notification stats', { error, userId });
    });
}

/**
 * Handles requests to get user notifications
 *
 * @param socket - Socket.IO socket instance
 * @param data - Request data (filter options, page, limit)
 * @param callback - Callback function to return the notifications
 * @param notificationService - NotificationService instance
 */
function handleGetNotifications(
  socket: Socket,
  data: any,
  callback: Function,
  notificationService: NotificationService
): void {
  // Extract user ID from socket data
  const userId = socket.data.user.userId;

  // Extract filter options, page, and limit from request data
  const { filterOptions, page, limit } = data;

  // Call notificationService.getNotifications to retrieve notifications
  notificationService
    .getNotifications(userId, filterOptions, page, limit)
    .then((notifications) => {
      // Return the notifications through the callback
      callback({
        success: true,
        notifications,
      });
    })
    .catch((error) => {
      // Handle and log any errors during the process
      logger.error('Failed to get notifications via WebSocket', { error, userId });
      callback({
        success: false,
        error: 'Failed to get notifications',
      });
    });
}

/**
 * Handles requests to mark a notification as read
 *
 * @param socket - Socket.IO socket instance
 * @param data - Request data (notification ID)
 * @param callback - Callback function to return the result
 * @param notificationService - NotificationService instance
 */
function handleMarkAsRead(
  socket: Socket,
  data: any,
  callback: Function,
  notificationService: NotificationService
): void {
  // Extract notification ID from request data
  const { notificationId } = data;
  const userId = socket.data.user.userId;

  // Call notificationService.markAsRead to update the notification
  notificationService
    .markAsRead(notificationId, userId)
    .then(() => {
      // Get updated notification stats for the user
      return notificationService.getNotificationStats(userId);
    })
    .then((stats) => {
      // Emit updated stats to the user's socket
      sendNotificationStatsToUser(socket.nsp, userId, stats);

      // Return success response through the callback
      callback({ success: true });
    })
    .catch((error) => {
      // Handle and log any errors during the process
      logger.error('Failed to mark notification as read via WebSocket', {
        error,
        notificationId,
      });
      callback({ success: false, error: 'Failed to mark as read' });
    });
}

/**
 * Handles requests to mark all notifications as read
 *
 * @param socket - Socket.IO socket instance
 * @param data - Request data (user ID)
 * @param callback - Callback function to return the result
 * @param notificationService - NotificationService instance
 */
function handleMarkAllAsRead(
  socket: Socket,
  data: any,
  callback: Function,
  notificationService: NotificationService
): void {
  // Extract user ID from socket data
  const userId = socket.data.user.userId;

  // Call notificationService.markAllAsRead to update all notifications
  notificationService
    .markAllAsRead(userId)
    .then((updatedCount) => {
      // Get updated notification stats for the user
      return notificationService.getNotificationStats(userId);
    })
    .then((stats) => {
      // Emit updated stats to the user's socket
      sendNotificationStatsToUser(socket.nsp, userId, stats);

      // Return success response with count of updated notifications
      callback({ success: true, updatedCount });
    })
    .catch((error) => {
      // Handle and log any errors during the process
      logger.error('Failed to mark all notifications as read via WebSocket', {
        error,
        userId,
      });
      callback({ success: false, error: 'Failed to mark all as read' });
    });
}

/**
 * Handles requests to get notification statistics
 *
 * @param socket - Socket.IO socket instance
 * @param data - Request data (user ID)
 * @param callback - Callback function to return the statistics
 * @param notificationService - NotificationService instance
 */
function handleGetNotificationStats(
  socket: Socket,
  data: any,
  callback: Function,
  notificationService: NotificationService
): void {
  // Extract user ID from socket data
  const userId = socket.data.user.userId;

  // Call notificationService.getNotificationStats to get statistics
  notificationService
    .getNotificationStats(userId)
    .then((stats) => {
      // Return the notification stats through the callback
      callback({ success: true, stats });
    })
    .catch((error) => {
      // Handle and log any errors during the process
      logger.error('Failed to get notification stats via WebSocket', { error, userId });
      callback({ success: false, error: 'Failed to get notification stats' });
    });
}

/**
 * Sets up event listeners for notification service events
 *
 * @param io - Socket.IO server instance
 * @param notificationService - NotificationService instance
 */
function setupNotificationListeners(
  io: Server,
  notificationService: NotificationService
): void {
  // Listen for 'notification.created' events from the notification service
  notificationService.on('notification.created', (notification: Notification) => {
    // When a notification is created, send it to the appropriate user's socket
    sendNotificationToUser(io, notification.userId, notification);
  });

  // Listen for other notification events like 'notification.updated'
  notificationService.on('notification.read', (notification: Notification) => {
    // Handle notification read event (e.g., update UI)
    logger.info('Notification read event received', { notificationId: notification.id });
  });

  // Log all notification events for debugging purposes
  notificationService.on('notification.all_read', (userId: string) => {
    logger.info('All notifications read event received', { userId });
  });
}

/**
 * Sends a notification to a specific user via WebSocket
 *
 * @param io - Socket.IO server instance
 * @param userId - The ID of the user to send the notification to
 * @param notification - The notification data to send
 */
function sendNotificationToUser(io: Server, userId: string, notification: Notification): void {
  try {
    // Emit 'notification' event to the user-specific room
    io.of('/notifications').to(`user:${userId}`).emit('notification', notification);

    // Log the notification delivery
    logger.info('Notification sent to user via WebSocket', {
      userId,
      notificationId: notification.id,
    });
  } catch (error) {
    // Handle and log any errors during the process
    logger.error('Failed to send notification to user via WebSocket', {
      error,
      userId,
      notificationId: notification.id,
    });
  }
}

/**
 * Sends updated notification statistics to a user
 *
 * @param io - Socket.IO server instance
 * @param userId - The ID of the user to send the statistics to
 * @param stats - The notification statistics to send
 */
function sendNotificationStatsToUser(io: Server, userId: string, stats: NotificationStats): void {
  try {
    // Emit 'notificationStats' event to the user-specific room
    io.of('/notifications').to(`user:${userId}`).emit('notificationStats', stats);

    // Log the stats delivery
    logger.info('Notification stats sent to user via WebSocket', { userId, stats });
  } catch (error) {
    // Handle and log any errors during the process
    logger.error('Failed to send notification stats to user via WebSocket', {
      error,
      userId,
    });
  }
}