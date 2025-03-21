/**
 * Central module for WebSocket functionality in the Revolucare platform.
 * This file exports the main WebSocket setup function and coordinates the
 * initialization of all WebSocket namespaces including authentication,
 * availability tracking, and notifications.
 *
 * @module websockets/index
 */

import { Server, Socket } from 'socket.io'; // socket.io@^4.6.1
import { setupSocketAuthentication } from './authentication.socket';
import { setupAvailabilitySocket } from './availability.socket';
import { setupNotificationSocket } from './notification.socket';
import { logger } from '../utils/logger';

/**
 * Sets up all WebSocket functionality for the Revolucare platform
 *
 * @param io - Socket.IO server instance
 * @param services - Object containing service instances (authService, providerService, notificationService)
 */
export function setupWebSockets(io: Server, services: { authService: any; providerService: any; notificationService: any }): void {
  // Log the initialization of WebSocket services
  logger.info('Setting up WebSocket services...');

  // Extract required services from the services object
  const { authService, providerService, notificationService } = services;

  // Set up socket authentication using setupSocketAuthentication
  setupSocketAuthentication(io, authService);

  // Set up availability socket using setupAvailabilitySocket
  setupAvailabilitySocket(io, providerService, authService);

  // Set up notification socket using setupNotificationSocket
  setupNotificationSocket(io, notificationService, authService);

  // Set up connection event handler for the main socket namespace
  io.on('connection', (socket: Socket) => {
    handleMainConnection(socket);
  });

  // Log successful WebSocket initialization
  logger.info('WebSocket services initialized successfully');
}

/**
 * Handles connections to the main socket namespace
 *
 * @param socket - Socket.IO socket instance
 */
function handleMainConnection(socket: Socket): void {
  // Log new connection with socket ID
  logger.info('New connection to main namespace', { socketId: socket.id });

  // Set up disconnect event handler
  socket.on('disconnect', (reason) => {
    handleSocketDisconnect(socket, reason);
  });

  // Set up error event handler
  socket.on('error', (error) => {
    handleSocketError(socket, error);
  });

  // Send welcome message to the connected client
  socket.emit('welcome', 'Welcome to Revolucare!');
}

/**
 * Handles socket disconnection events
 *
 * @param socket - Socket.IO socket instance
 * @param reason - Reason for disconnection
 */
function handleSocketDisconnect(socket: Socket, reason: string): void {
  // Log disconnection with socket ID and reason
  logger.info('Socket disconnected', { socketId: socket.id, reason });

  // Clean up any resources associated with the socket
  // Perform any necessary state updates on disconnection
}

/**
 * Handles socket error events
 *
 * @param socket - Socket.IO socket instance
 * @param error - Error object
 */
function handleSocketError(socket: Socket, error: Error): void {
  // Log error with socket ID and error details
  logger.error('Socket error', { socketId: socket.id, error: error.message });

  // Send error notification to the client if possible
  socket.emit('socketError', { message: 'An error occurred', error: error.message });

  // Determine if socket should be disconnected based on error severity
  // Disconnect the socket
  socket.disconnect(true);
}