/**
 * Implements WebSocket authentication functionality for the Revolucare platform, providing secure
 * authentication mechanisms for real-time socket connections. This module enables token-based
 * authentication for WebSocket connections, ensuring that only authenticated users can establish
 * and maintain socket connections.
 *
 * @module websockets/authentication.socket
 */

import { Server, Socket, Namespace } from 'socket.io'; // socket.io@^4.6.1
import {
  verifyAccessToken,
  extractTokenFromHeader,
  extractTokenFromCookie,
} from '../utils/token-manager';
import { logger } from '../utils/logger';
import { UserContext } from '../types/user.types';
import { AuthService } from '../services/auth.service';

/**
 * Sets up authentication middleware for Socket.IO server
 *
 * @param io - Socket.IO server instance
 * @param authService - AuthService instance for token validation
 */
export function setupSocketAuthentication(io: Server, authService: AuthService): void {
  // Configure Socket.IO server to use authentication middleware
  io.use((socket, next) => {
    authenticateSocket(socket, next, authService);
  });

  // Log successful setup of socket authentication
  logger.info('Socket.IO authentication middleware set up for the entire server');
}

/**
 * Middleware function to authenticate socket connections using JWT tokens
 *
 * @param socket - Socket.IO socket instance
 * @param next - Next middleware function
 * @param authService - AuthService instance for token validation
 */
export function authenticateSocket(socket: Socket, next: (err?: Error) => void, authService: AuthService): void {
  // Extract JWT token from socket handshake (headers or cookies)
  const token = extractTokenFromSocketHandshake(socket.handshake);

  // If no token is found, disconnect the socket with authentication error
  if (!token) {
    logger.warn('Socket authentication failed: No token provided', { socketId: socket.id });
    return socket.disconnect(true);
  }

  // Validate the token using authService.validateToken
  verifySocketToken(token, authService)
    .then((userContext) => {
      // If token is invalid, disconnect the socket with authentication error
      if (!userContext) {
        logger.warn('Socket authentication failed: Invalid token', { socketId: socket.id });
        return socket.disconnect(true);
      }

      // Attach user context to socket object for future reference
      socket.data.user = userContext;

      // Log successful socket authentication
      logger.info('Socket authenticated successfully', {
        socketId: socket.id,
        userId: userContext.userId,
      });

      // Call next() to proceed with the connection
      next();
    })
    .catch((error) => {
      logger.error('Error during socket authentication', { error, socketId: socket.id });
      socket.disconnect(true);
    });
}

/**
 * Extracts JWT token from socket handshake data
 *
 * @param handshake - Socket handshake data
 * @returns Extracted token or null if not found
 */
export function extractTokenFromSocketHandshake(handshake: any): string | null {
  // Try to extract token from Authorization header
  let token = extractTokenFromHeader(handshake.headers.authorization);

  // If not found in header, try to extract from cookies
  if (!token && handshake.headers.cookie) {
    token = extractTokenFromCookie(handshake.headers.cookie);
  }

  // Log token extraction attempt (success or failure)
  if (token) {
    logger.debug('Token extracted from socket handshake', { token });
  } else {
    logger.debug('No token found in socket handshake');
  }

  // Return the extracted token or null if not found
  return token;
}

/**
 * Verifies a socket authentication token and returns user context
 *
 * @param token - The JWT token to verify
 * @param authService - AuthService instance for token validation
 * @returns User context if token is valid, null otherwise
 */
export async function verifySocketToken(token: string, authService: AuthService): Promise<UserContext | null> {
  try {
    // Call authService.validateToken to verify the token
    const verificationResult = await authService.validateToken(token);

    // Return the user context if token is valid
    if (verificationResult.isValid && verificationResult.payload) {
      logger.debug('Socket token verified successfully', { userId: verificationResult.payload.userId });
      return verificationResult.payload;
    }

    // Log token verification result
    logger.warn('Socket token verification failed', { error: verificationResult.error });

    // Return null if token is invalid
    return null;
  } catch (error) {
    logger.error('Error verifying socket token', { error });
    return null;
  }
}

/**
 * Applies authentication middleware to a specific Socket.IO namespace
 *
 * @param namespace - Socket.IO namespace instance
 * @param authService - AuthService instance for token validation
 */
export function applyNamespaceAuth(namespace: Namespace, authService: AuthService): void {
  // Configure namespace to use authentication middleware
  namespace.use((socket, next) => {
    authenticateSocket(socket, next, authService);
  });

  // Log successful setup of namespace authentication
  logger.info('Socket.IO authentication middleware set up for namespace', {
    namespace: namespace.name,
  });
}