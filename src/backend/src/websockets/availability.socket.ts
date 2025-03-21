/**
 * Implements WebSocket functionality for real-time provider availability tracking in the Revolucare platform.
 * This module enables bidirectional communication for availability updates, allowing providers to broadcast
 * changes to their schedules and clients to receive immediate notifications about provider availability.
 *
 * @module websockets/availability.socket
 */

import { Server, Socket } from 'socket.io'; // socket.io@^4.6.1
import { authenticateSocket, extractTokenFromSocketHandshake } from './authentication.socket';
import { logger } from '../utils/logger';
import { ProvidersService } from '../services/providers.service';
import { invalidateAvailabilityCache, invalidateTimeSlotsCache } from '../cache/availability.cache';
import { Availability, ProviderAvailabilityUpdateDTO, TimeSlot } from '../types/provider.types';
import { AuthService } from '../services/auth.service';
import { handleAvailabilityUpdate } from '../events/handlers/provider.handler';

/**
 * Sets up WebSocket handlers for provider availability functionality
 *
 * @param io - Socket.IO server instance
 * @param providerService - ProvidersService instance for availability operations
 * @param authService - AuthService instance for token validation
 */
export function setupAvailabilitySocket(io: Server, providerService: ProvidersService, authService: AuthService): void {
  // Create a namespace for availability-related WebSocket connections
  const availabilityNamespace = io.of('/availability');

  // Set up authentication middleware for the namespace
  availabilityNamespace.use((socket, next) => {
    authenticateSocket(socket, next, authService);
  });

  // Handle connection events for new socket connections
  availabilityNamespace.on('connection', (socket: Socket) => {
    handleAvailabilityConnection(socket, providerService);
  });

  // Log successful setup of availability WebSocket handlers
  logger.info('Availability WebSocket handlers set up');
}

/**
 * Handles new WebSocket connections to the availability namespace
 *
 * @param socket - Socket.IO socket instance
 * @param providerService - ProvidersService instance for availability operations
 */
function handleAvailabilityConnection(socket: Socket, providerService: ProvidersService): void {
  // Extract user ID and role from socket data
  const userId = socket.data.user.userId;
  const userRole = socket.data.user.role;

  // Log new connection with user ID
  logger.info('New availability socket connection', { socketId: socket.id, userId });

  // Join provider-specific room for targeted availability updates
  socket.join(`provider:${userId}`);

  // Set up event handlers for availability-related events
  socket.on('getAvailability', (data: any, callback: Function) => {
    handleGetAvailability(socket, data, callback, providerService);
  });

  socket.on('updateAvailability', (data: ProviderAvailabilityUpdateDTO, callback: Function) => {
    handleUpdateAvailability(socket, data, callback, providerService);
  });

  socket.on('checkAvailability', (data: any, callback: Function) => {
    handleCheckAvailability(socket, data, callback, providerService);
  });

  socket.on('subscribeToProviderAvailability', (data: any, callback: Function) => {
    subscribeToProviderAvailability(socket, data, callback);
  });

  socket.on('unsubscribeFromProviderAvailability', (data: any, callback: Function) => {
    unsubscribeFromProviderAvailability(socket, data, callback);
  });

  // Handle disconnection event
  socket.on('disconnect', () => {
    logger.info('Availability socket disconnected', { socketId: socket.id, userId });
  });

  // Send initial availability data to the client if they are a provider
  if (userRole === 'provider') {
    providerService.getAvailability(userId)
      .then(availability => {
        socket.emit('availabilityUpdate', { providerId: userId, availability });
      })
      .catch(error => {
        logger.error('Error sending initial availability data', { error, userId });
      });
  }
}

/**
 * Handles requests to get provider availability
 *
 * @param socket - Socket.IO socket instance
 * @param data - Request data
 * @param callback - Callback function to return the availability
 * @param providerService - ProvidersService instance for availability operations
 */
function handleGetAvailability(socket: Socket, data: any, callback: Function, providerService: ProvidersService): void {
  // Extract provider ID from request data
  const providerId = data.providerId;

  // Extract date range and service type filters if provided
  const startDate = data.startDate ? new Date(data.startDate) : undefined;
  const endDate = data.endDate ? new Date(data.endDate) : undefined;
  const serviceType = data.serviceType;

  // Log the getAvailability request
  logger.info('Handling getAvailability request', { providerId, startDate, endDate, serviceType });

  // Call providerService.getAvailability to retrieve availability data
  providerService.getAvailability(providerId)
    .then(availability => {
      // Return the availability through the callback
      callback({
        success: true,
        availability
      });
    })
    .catch(error => {
      // Handle and log any errors during the process
      logger.error('Error getting provider availability', { error, providerId });
      callback({
        success: false,
        error: error.message
      });
    });
}

/**
 * Handles requests to update provider availability
 *
 * @param socket - Socket.IO socket instance
 * @param data - ProviderAvailabilityUpdateDTO containing the updated availability data
 * @param callback - Callback function to return the update status
 * @param providerService - ProvidersService instance for availability operations
 */
function handleUpdateAvailability(socket: Socket, data: ProviderAvailabilityUpdateDTO, callback: Function, providerService: ProvidersService): void {
  // Extract user ID from socket data
  const userId = socket.data.user.userId;

  // Log the updateAvailability request
  logger.info('Handling updateAvailability request', { userId, data });

  // Validate that the user is updating their own availability
  if (userId !== data.providerId) {
    logger.warn('Unauthorized attempt to update availability', { userId, providerId: data.providerId });
    callback({
      success: false,
      error: 'Unauthorized'
    });
    return;
  }

  // Call providerService.updateAvailability to update the availability data
  providerService.updateAvailability(userId, data)
    .then(availability => {
      // Invalidate availability cache for the provider
      invalidateAvailabilityCache(userId);

      // Broadcast the availability update to all connected clients
      broadcastAvailabilityUpdate(socket.nsp, userId, availability);

      // Trigger handleAvailabilityUpdate event to update other systems
      handleAvailabilityUpdate(userId, {} as Availability, availability); // TODO: Fix this any

      // Return success response through the callback
      callback({
        success: true,
        availability
      });
    })
    .catch(error => {
      // Handle and log any errors during the process
      logger.error('Error updating provider availability', { error, userId });
      callback({
        success: false,
        error: error.message
      });
    });
}

/**
 * Handles requests to check if a provider is available for a specific time slot
 *
 * @param socket - Socket.IO socket instance
 * @param data - Request data containing provider ID, start time, end time, and service type
 * @param callback - Callback function to return the availability status
 * @param providerService - ProvidersService instance for availability operations
 */
function handleCheckAvailability(socket: Socket, data: any, callback: Function, providerService: ProvidersService): void {
  // Extract provider ID, start time, end time, and service type from request data
  const { providerId, startTime, endTime, serviceType } = data;

  // Log the checkAvailability request
  logger.info('Handling checkAvailability request', { providerId, startTime, endTime, serviceType });

  // Call providerService.checkAvailabilityForBooking to check availability
  providerService.checkAvailabilityForBooking(providerId, new Date(startTime), new Date(endTime), serviceType)
    .then(isAvailable => {
      // Return the availability status through the callback
      callback({
        success: true,
        isAvailable
      });
    })
    .catch(error => {
      // Handle and log any errors during the process
      logger.error('Error checking provider availability', { error, providerId, startTime, endTime, serviceType });
      callback({
        success: false,
        error: error.message
      });
    });
}

/**
 * Broadcasts an availability update to all connected clients
 *
 * @param io - Socket.IO server instance
 * @param providerId - The ID of the provider whose availability was updated
 * @param availability - The updated availability data
 */
export function broadcastAvailabilityUpdate(io: Server, providerId: string, availability: Availability): void {
  // Emit 'availabilityUpdate' event to the provider-specific room
  io.to(`provider:${providerId}`).emit('availabilityUpdate', { providerId, availability });

  // Log the availability update broadcast
  logger.info('Availability update broadcast', { providerId });
}

/**
 * Handles client requests to subscribe to a provider's availability updates
 *
 * @param socket - Socket.IO socket instance
 * @param data - Request data containing provider ID
 * @param callback - Callback function to return the subscription status
 */
function subscribeToProviderAvailability(socket: Socket, data: any, callback: Function): void {
  // Extract provider ID from request data
  const providerId = data.providerId;

  // Log the subscription request
  logger.info('Handling subscribeToProviderAvailability request', { providerId });

  // Join the socket to the provider-specific room
  socket.join(`provider:${providerId}`);

  // Log the subscription to provider availability
  logger.info('Subscribed to provider availability', { socketId: socket.id, providerId });

  // Return success response through the callback
  callback({
    success: true,
    message: 'Subscribed to provider availability'
  });
}

/**
 * Handles client requests to unsubscribe from a provider's availability updates
 *
 * @param socket - Socket.IO socket instance
 * @param data - Request data containing provider ID
 * @param callback - Callback function to return the unsubscription status
 */
function unsubscribeFromProviderAvailability(socket: Socket, data: any, callback: Function): void {
  // Extract provider ID from request data
  const providerId = data.providerId;

  // Log the unsubscription request
  logger.info('Handling unsubscribeFromProviderAvailability request', { providerId });

  // Leave the socket from the provider-specific room
  socket.leave(`provider:${providerId}`);

  // Log the unsubscription from provider availability
  logger.info('Unsubscribed from provider availability', { socketId: socket.id, providerId });

  // Return success response through the callback
  callback({
    success: true,
    message: 'Unsubscribed from provider availability'
  });
}