# src/backend/src/events/subscribers/auth.subscriber.ts
```typescript
import { redisClient } from '../../config/redis'; // ioredis@5.3.2
import { logger } from '../../utils/logger';
import { handleUserRegistered, handleEmailVerified, handlePasswordReset, handlePasswordResetRequested, handleLoginAttemptFailed, handleUserLoggedIn } from '../handlers/auth.handler';

// Define authentication event type constants
export const AUTH_EVENTS = {
  USER_REGISTERED: 'user.registered',
  EMAIL_VERIFIED: 'email.verified',
  PASSWORD_RESET: 'password.reset',
  PASSWORD_RESET_REQUESTED: 'password.reset.requested',
  LOGIN_ATTEMPT_FAILED: 'login.attempt.failed',
  USER_LOGGED_IN: 'user.logged.in'
};

/**
 * Subscribes to authentication-related Redis channels
 */
async function subscribeToAuthEvents(): Promise<void> {
  try {
    // Subscribe to the user.registered channel
    await redisClient.subscribe(AUTH_EVENTS.USER_REGISTERED);
    // Subscribe to the email.verified channel
    await redisClient.subscribe(AUTH_EVENTS.EMAIL_VERIFIED);
    // Subscribe to the password.reset channel
    await redisClient.subscribe(AUTH_EVENTS.PASSWORD_RESET);
    // Subscribe to the password.reset.requested channel
    await redisClient.subscribe(AUTH_EVENTS.PASSWORD_RESET_REQUESTED);
    // Subscribe to the login.attempt.failed channel
    await redisClient.subscribe(AUTH_EVENTS.LOGIN_ATTEMPT_FAILED);
    // Subscribe to the user.logged.in channel
    await redisClient.subscribe(AUTH_EVENTS.USER_LOGGED_IN);

    // Log successful subscription to all authentication events
    logger.info('Subscribed to all authentication events');
  } catch (error) {
    // Catch and log any errors during subscription
    logger.error('Error subscribing to authentication events', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Sets up message listeners for authentication events
 */
function setupAuthEventListeners(): void {
  // Set up message listener for Redis pub/sub messages
  redisClient.on('message', async (channel, message) => {
    try {
      // Parse the received message payload
      const payload = JSON.parse(message);

      // Determine the channel/event type
      switch (channel) {
        // For user.registered events, call handleUserRegistered
        case AUTH_EVENTS.USER_REGISTERED:
          await handleUserRegistered(payload);
          break;

        // For email.verified events, call handleEmailVerified
        case AUTH_EVENTS.EMAIL_VERIFIED:
          await handleEmailVerified(payload);
          break;

        // For password.reset events, call handlePasswordReset
        case AUTH_EVENTS.PASSWORD_RESET:
          await handlePasswordReset(payload);
          break;

        // For password.reset.requested events, call handlePasswordResetRequested
        case AUTH_EVENTS.PASSWORD_RESET_REQUESTED:
          await handlePasswordResetRequested(payload);
          break;

        // For login.attempt.failed events, call handleLoginAttemptFailed
        case AUTH_EVENTS.LOGIN_ATTEMPT_FAILED:
          await handleLoginAttemptFailed(payload);
          break;

        // For user.logged.in events, call handleUserLoggedIn
        case AUTH_EVENTS.USER_LOGGED_IN:
          await handleUserLoggedIn(payload);
          break;

        // Log any unhandled event types
        default:
          logger.warn(`Unhandled event type: ${channel}`);
      }
    } catch (error) {
      // Catch and log any errors during event handling
      logger.error('Error handling authentication event', {
        channel,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });
}

/**
 * Initializes all authentication event subscribers
 */
export async function initializeAuthSubscribers(): Promise<void> {
  try {
    // Log the start of authentication subscribers initialization
    logger.info('Initializing authentication subscribers...');

    // Set up authentication event listeners
    setupAuthEventListeners();

    // Subscribe to authentication event channels
    await subscribeToAuthEvents();

    // Log successful initialization of authentication subscribers
    logger.info('Authentication subscribers initialized successfully');
  } catch (error) {
    // Catch and log any errors during initialization
    logger.error('Error initializing authentication subscribers', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}