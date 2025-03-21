import { logger } from '../../utils/logger';
import { NotificationService } from '../../services/notifications.service';
import { UserRepository } from '../../repositories/user.repository';
import { NOTIFICATION_TYPES, NOTIFICATION_PRIORITIES, NOTIFICATION_CHANNELS } from '../../constants/notification-types';
import { UserWithoutPassword } from '../../types/user.types';

// Initialize notification service and user repository
const notificationService = new NotificationService(new NotificationRepository(), new UserRepository(), new EmailService());
const userRepository = new UserRepository();

/**
 * Handles the user.registered event by sending a welcome notification
 * @param payload - The event payload containing user data
 */
export async function handleUserRegistered(payload: any): Promise<void> {
  // Log the received user.registered event
  logger.info('Received user.registered event', { payload });

  try {
    // Extract user data from the payload
    const user: UserWithoutPassword = payload.user;

    // Create a welcome notification with appropriate type and channels
    const notification = {
      userId: user.id,
      type: NOTIFICATION_TYPES.ACCOUNT_CREATED,
      title: 'Welcome to Revolucare!',
      message: `Hi ${user.firstName}, welcome to Revolucare! We're excited to help you manage your care.`,
      channels: [NOTIFICATION_CHANNELS.EMAIL, NOTIFICATION_CHANNELS.IN_APP],
    };

    // Send the notification to the user
    await notificationService.sendNotification(notification);

    // Log successful notification delivery
    logger.info('Welcome notification sent successfully', { userId: user.id });
  } catch (error) {
    // Log any errors during processing
    logger.error('Error handling user.registered event', { error });
  }
}

/**
 * Handles the email.verified event by sending a confirmation notification
 * @param payload - The event payload containing user data
 */
export async function handleEmailVerified(payload: any): Promise<void> {
  // Log the received email.verified event
  logger.info('Received email.verified event', { payload });

  try {
    // Extract user data from the payload
    const user: UserWithoutPassword = payload.user;

    // Create an email verification confirmation notification
    const notification = {
      userId: user.id,
      type: NOTIFICATION_TYPES.ACCOUNT_VERIFIED,
      title: 'Email Verified!',
      message: 'Your email address has been successfully verified.',
      channels: [NOTIFICATION_CHANNELS.IN_APP],
    };

    // Send the notification to the user
    await notificationService.sendNotification(notification);

    // Log successful notification delivery
    logger.info('Email verification confirmation sent successfully', { userId: user.id });
  } catch (error) {
    // Log any errors during processing
    logger.error('Error handling email.verified event', { error });
  }
}

/**
 * Handles the password.reset event by sending a security notification
 * @param payload - The event payload containing user data
 */
export async function handlePasswordReset(payload: any): Promise<void> {
  // Log the received password.reset event
  logger.info('Received password.reset event', { payload });

  try {
    // Extract user data from the payload
    const user: UserWithoutPassword = payload.user;

    // Create a password reset confirmation notification with high priority
    const notification = {
      userId: user.id,
      type: NOTIFICATION_TYPES.PASSWORD_RESET,
      title: 'Password Reset Confirmation',
      message: 'Your password has been successfully reset.',
      priority: NOTIFICATION_PRIORITIES.HIGH,
      channels: [NOTIFICATION_CHANNELS.EMAIL, NOTIFICATION_CHANNELS.SMS, NOTIFICATION_CHANNELS.IN_APP],
    };

    // Send the notification to the user through multiple channels for security
    await notificationService.sendNotification(notification);

    // Log successful notification delivery
    logger.info('Password reset confirmation sent successfully', { userId: user.id });
  } catch (error) {
    // Log any errors during processing
    logger.error('Error handling password.reset event', { error });
  }
}

/**
 * Handles the password.reset.requested event by sending a notification with reset instructions
 * @param payload - The event payload containing user data and reset token
 */
export async function handlePasswordResetRequested(payload: any): Promise<void> {
  // Log the received password.reset.requested event
  logger.info('Received password.reset.requested event', { payload });

  try {
    // Extract user data and reset token from the payload
    const user: UserWithoutPassword = payload.user;
    const resetToken: string = payload.resetToken;

    // Create a password reset request notification with instructions
    const notification = {
      userId: user.id,
      type: NOTIFICATION_TYPES.PASSWORD_RESET,
      title: 'Password Reset Requested',
      message: `You have requested a password reset. Use this token to reset your password: ${resetToken}`,
      channels: [NOTIFICATION_CHANNELS.EMAIL],
    };

    // Send the notification to the user
    await notificationService.sendNotification(notification);

    // Log successful notification delivery
    logger.info('Password reset request notification sent successfully', { userId: user.id });
  } catch (error) {
    // Log any errors during processing
    logger.error('Error handling password.reset.requested event', { error });
  }
}

/**
 * Handles the login.attempt.failed event by sending a security alert notification
 * @param payload - The event payload containing user data and attempt information
 */
export async function handleLoginAttemptFailed(payload: any): Promise<void> {
  // Log the received login.attempt.failed event
  logger.info('Received login.attempt.failed event', { payload });

  try {
    // Extract user data and attempt information from the payload
    const user: UserWithoutPassword = payload.user;
    const ipAddress: string = payload.ipAddress;
    const device: string = payload.device;

    // Create a failed login attempt notification with high priority
    const notification = {
      userId: user.id,
      type: NOTIFICATION_TYPES.PASSWORD_RESET,
      title: 'Failed Login Attempt',
      message: `A failed login attempt was detected from IP: ${ipAddress} on device: ${device}. If this was not you, please reset your password.`,
      priority: NOTIFICATION_PRIORITIES.HIGH,
      channels: [NOTIFICATION_CHANNELS.EMAIL, NOTIFICATION_CHANNELS.SMS, NOTIFICATION_CHANNELS.IN_APP],
    };

    // Send the notification to the user through multiple channels for security
    await notificationService.sendNotification(notification);

    // Log successful notification delivery
    logger.info('Failed login attempt notification sent successfully', { userId: user.id });
  } catch (error) {
    // Log any errors during processing
    logger.error('Error handling login.attempt.failed event', { error });
  }
}

/**
 * Handles the user.logged.in event by updating user's last login time and sending a notification if from a new device
 * @param payload - The event payload containing user data and device information
 */
export async function handleUserLoggedIn(payload: any): Promise<void> {
  // Log the received user.logged.in event
  logger.info('Received user.logged.in event', { payload });

  try {
    // Extract user data and device information from the payload
    const user: UserWithoutPassword = payload.user;
    const ipAddress: string = payload.ipAddress;
    const device: string = payload.device;

    // Update the user's last login timestamp in the database
    await userRepository.update(user.id, { updatedAt: new Date() });

    // Check if this is a login from a new device or location
    // TODO: Implement logic to detect new device/location
    const isNewDevice = false; // Placeholder

    if (isNewDevice) {
      // Create and send a security notification
      const notification = {
        userId: user.id,
        type: NOTIFICATION_TYPES.ACCOUNT_VERIFIED,
        title: 'New Login Detected',
        message: `A new login was detected from IP: ${ipAddress} on device: ${device}. Please verify this activity.`,
        priority: NOTIFICATION_PRIORITIES.HIGH,
        channels: [NOTIFICATION_CHANNELS.EMAIL, NOTIFICATION_CHANNELS.SMS, NOTIFICATION_CHANNELS.IN_APP],
      };
      await notificationService.sendNotification(notification);
      logger.info('New login notification sent successfully', { userId: user.id });
    }

    // Log successful processing of the login event
    logger.info('User logged in event processed successfully', { userId: user.id });
  } catch (error) {
    // Log any errors during processing
    logger.error('Error handling user.logged.in event', { error });
  }
}