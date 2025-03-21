# src/backend/src/services/auth.service.ts
```typescript
import { EventEmitter } from 'events'; // events@^1.1.1
import {
  IAuthService,
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  RefreshTokenRequest,
  VerifyEmailRequest,
  PasswordResetRequest,
  PasswordResetConfirmRequest,
  ChangePasswordRequest,
  TokenPayload,
  RefreshTokenData,
  UserContext,
} from '../interfaces/auth.interface';
import { UserRepository } from '../repositories/user.repository';
import { User, UserWithoutPassword } from '../types/user.types';
import {
  generateAccessToken,
  generateRefreshToken,
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
  revokeRefreshToken,
  decodeToken,
} from '../utils/token-manager';
import {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  generateSecureRandomString,
} from '../utils/security';
import { errorFactory } from '../utils/error-handler';
import { ErrorCodes } from '../constants/error-codes';
import { Roles } from '../constants/roles';
import { logger } from '../utils/logger';
import { redisClient } from '../config/redis';
import { EmailService } from './email/email.service';
import { NotificationService } from './notifications.service';
import {
  cacheUser,
  getCachedUser,
  cacheUserByEmail,
  getCachedUserIdByEmail,
  invalidateUserCache,
  invalidateUserEmailCache,
} from '../cache/user.cache';

const REFRESH_TOKEN_KEY_PREFIX = 'refresh_token:';
const VERIFICATION_TOKEN_KEY_PREFIX = 'verification_token:';
const PASSWORD_RESET_TOKEN_KEY_PREFIX = 'password_reset_token:';

const TOKEN_EXPIRATION = {
  VERIFICATION: '24 * 60 * 60', // 24 hours in seconds
  PASSWORD_RESET: '1 * 60 * 60', // 1 hour in seconds
  REFRESH_TOKEN_CACHE: '7 * 24 * 60 * 60', // 7 days in seconds
};

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

/**
 * Service that implements the IAuthService interface to provide authentication functionality
 */
export class AuthService implements IAuthService {
  /**
   * Creates a new AuthService instance with required dependencies
   * @param userRepository 
   * @param emailService 
   * @param notificationService 
   */
  constructor(
    private userRepository: UserRepository,
    private emailService: EmailService,
    private notificationService: NotificationService
  ) {
    // Store the provided user repository
    this.userRepository = userRepository;
    // Store the provided email service
    this.emailService = emailService;
    // Store the provided notification service
    this.notificationService = notificationService;
  }

  /**
   * Registers a new user in the system
   * @param registerData 
   * @returns The registered user without password
   */
  async register(registerData: RegisterRequest): Promise<UserWithoutPassword> {
    // Validate registration data (email format, password strength)
    logger.info('Validating registration data', { email: registerData.email });

    // Check if user with the same email already exists
    const existingUser = await this.userRepository.findByEmail(registerData.email);
    if (existingUser) {
      logger.warn('User with this email already exists', { email: registerData.email });
      throw errorFactory.createValidationError('User with this email already exists', {
        field: 'email',
        value: registerData.email,
      });
    }

    // Hash the password using hashPassword utility
    const hashedPassword = await hashPassword(registerData.password);

    // Create user object with hashed password and isVerified=false
    const user = {
      ...registerData,
      passwordHash: hashedPassword,
      isVerified: false,
    };

    // Save user to database using userRepository
    const createdUser = await this.userRepository.create(user);

    // Generate verification token
    const verificationToken = await this.generateVerificationToken(createdUser.id);

    // Store verification token in Redis with expiration
    const verificationKey = `${VERIFICATION_TOKEN_KEY_PREFIX}${verificationToken}`;
    await redisClient.set(verificationKey, JSON.stringify({ userId: createdUser.id }), 'EX', parseInt(TOKEN_EXPIRATION.VERIFICATION));

    // Send verification email to the user
    await this.sendVerificationEmail(createdUser, verificationToken);

    // Cache the new user data
    await cacheUser(createdUser);

    // Return user data without password
    const { passwordHash, ...userWithoutPassword } = createdUser;
    return userWithoutPassword;
  }

  /**
   * Authenticates a user and provides access tokens
   * @param loginData 
   * @returns Authentication response with tokens and user data
   */
  async login(loginData: LoginRequest): Promise<AuthResponse> {
    // Validate login data (email and password presence)
    logger.info('Validating login data', { email: loginData.email });

    // Check cached user data or query database for user by email
    const cachedUserId = await getCachedUserIdByEmail(loginData.email);
    let user: User | null = null;
    if (cachedUserId) {
      user = await getCachedUser(cachedUserId);
    } else {
      user = await this.userRepository.findByEmail(loginData.email);
    }

    // If user not found, throw unauthorized error
    if (!user) {
      logger.warn('Invalid credentials: User not found', { email: loginData.email });
      throw errorFactory.createUnauthorizedError('Invalid credentials');
    }

    // Verify password against stored hash
    const passwordMatch = await verifyPassword(loginData.password, user.passwordHash);

    // If password invalid, throw unauthorized error
    if (!passwordMatch) {
      logger.warn('Invalid credentials: Password mismatch', { email: loginData.email });
      throw errorFactory.createUnauthorizedError('Invalid credentials');
    }

    // If user is not verified, throw error requiring verification
    if (!user.isVerified) {
      logger.warn('User is not verified', { email: loginData.email });
      throw errorFactory.createUnauthorizedError('Email not verified. Please verify your email address.');
    }

    // Generate token payload with user data
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
    };

    // Generate access and refresh tokens
    const { accessToken, refreshToken, expiresIn } = await generateTokens(payload);

    // Store refresh token in Redis with user ID and expiration
    const refreshTokenData = {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + (expiresIn * 1000)),
      createdAt: new Date(),
      isRevoked: false
    };
    await this.storeRefreshToken(refreshTokenData);

    // Return authentication response with tokens and user data
    logger.info('User logged in successfully', { userId: user.id, email: user.email });
    return {
      accessToken,
      refreshToken,
      expiresIn,
      user,
    };
  }

  /**
   * Refreshes the access token using a valid refresh token
   * @param refreshData 
   * @returns New authentication response with fresh tokens
   */
  async refreshToken(refreshData: RefreshTokenRequest): Promise<AuthResponse> {
    // Validate refresh token presence
    if (!refreshData || !refreshData.refreshToken) {
      logger.warn('Refresh token missing');
      throw errorFactory.createUnauthorizedError('Refresh token is required');
    }

    // Retrieve stored token data from Redis
    const storedToken = await this.getStoredRefreshToken(refreshData.refreshToken);

    // If token not found, throw unauthorized error
    if (!storedToken) {
      logger.warn('Invalid or expired refresh token');
      throw errorFactory.createUnauthorizedError('Invalid or expired refresh token');
    }

    // Verify refresh token validity
    if (!verifyRefreshToken(refreshData.refreshToken, storedToken)) {
      logger.warn('Refresh token verification failed');
      await this.deleteRefreshToken(refreshData.refreshToken);
      throw errorFactory.createUnauthorizedError('Invalid or expired refresh token');
    }

    // Get user data from database
    const user = await this.userRepository.findById(storedToken.userId);
    if (!user) {
      logger.warn('User not found for refresh token', { userId: storedToken.userId });
      throw errorFactory.createUnauthorizedError('Invalid or expired refresh token');
    }

    // Generate new token payload
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
    };

    // Generate new access and refresh tokens
    const { accessToken, refreshToken, expiresIn } = await generateTokens(payload);

    // Revoke old refresh token
    const revokedToken = revokeRefreshToken(storedToken);
    await this.deleteRefreshToken(revokedToken.token);

    // Store new refresh token in Redis
    const newRefreshTokenData = {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + (expiresIn * 1000)),
      createdAt: new Date(),
      isRevoked: false
    };
    await this.storeRefreshToken(newRefreshTokenData);

    // Return new authentication response
    logger.info('Access token refreshed successfully', { userId: user.id });
    return {
      accessToken,
      refreshToken,
      expiresIn,
      user,
    };
  }

  /**
   * Logs out a user by revoking their refresh token
   * @param logoutData 
   * @returns Success status of the logout operation
   */
  async logout(logoutData: RefreshTokenRequest): Promise<{ success: boolean }> {
    // Validate refresh token presence
    if (!logoutData || !logoutData.refreshToken) {
      logger.warn('Refresh token missing for logout');
      throw errorFactory.createUnauthorizedError('Refresh token is required');
    }

    // Retrieve stored token data from Redis
    const storedToken = await this.getStoredRefreshToken(logoutData.refreshToken);

    // If token found, delete it from Redis
    if (storedToken) {
      await this.deleteRefreshToken(logoutData.refreshToken);
      logger.info('User logged out successfully', { userId: storedToken.userId });
    }

    // Return success status
    return { success: true };
  }

  /**
   * Verifies a user's email using a verification token
   * @param verifyData 
   * @returns Success status of the verification
   */
  async verifyEmail(verifyData: VerifyEmailRequest): Promise<{ success: boolean }> {
    // Validate verification token presence
    if (!verifyData || !verifyData.token) {
      logger.warn('Verification token missing');
      throw errorFactory.createValidationError('Verification token is required');
    }

    // Retrieve token data from Redis
    const verificationKey = `${VERIFICATION_TOKEN_KEY_PREFIX}${verifyData.token}`;
    const tokenDataString = await redisClient.get(verificationKey);

    // If token not found or expired, throw error
    if (!tokenDataString) {
      logger.warn('Invalid or expired verification token');
      throw errorFactory.createValidationError('Invalid or expired verification token');
    }

    const tokenData = JSON.parse(tokenDataString) as { userId: string };

    // Extract user ID from token data
    const userId = tokenData.userId;

    // Update user's isVerified status to true
    const user = await this.userRepository.update(userId, { isVerified: true });

    // Delete verification token from Redis
    await redisClient.del(verificationKey);

    // Invalidate user cache
    await invalidateUserCache(userId);
    await invalidateUserEmailCache(user.email);

    // Send welcome notification
    await this.notificationService.createNotification({
      userId: user.id,
      type: 'account_verified',
      title: 'Welcome to Revolucare!',
      message: 'Your email has been verified successfully.',
      data: { email: user.email }
    });

    // Return success status
    logger.info('Email verified successfully', { userId });
    return { success: true };
  }

  /**
   * Initiates a password reset process for a user
   * @param resetData 
   * @returns Success status of the reset request
   */
  async requestPasswordReset(resetData: PasswordResetRequest): Promise<{ success: boolean }> {
    // Validate email presence
    if (!resetData || !resetData.email) {
      logger.warn('Email missing for password reset request');
      throw errorFactory.createValidationError('Email is required');
    }

    // Check if user exists with the provided email
    const user = await this.userRepository.findByEmail(resetData.email);
    if (!user) {
      logger.warn('User not found for password reset request', { email: resetData.email });
      // Intentionally don't reveal if the email exists or not for security reasons
      return { success: true };
    }

    // Generate password reset token
    const resetToken = await this.generatePasswordResetToken(user.id);

    // Store token in Redis with expiration
    const resetKey = `${PASSWORD_RESET_TOKEN_KEY_PREFIX}${resetToken}`;
    await redisClient.set(resetKey, JSON.stringify({ userId: user.id }), 'EX', parseInt(TOKEN_EXPIRATION.PASSWORD_RESET));

    // Send password reset email with token
    await this.sendPasswordResetEmail(user, resetToken);

    // Return success status (always true for security)
    logger.info('Password reset requested successfully', { email: resetData.email });
    return { success: true };
  }

  /**
   * Completes the password reset process with a new password
   * @param resetData 
   * @returns Success status of the password reset
   */
  async resetPassword(resetData: PasswordResetConfirmRequest): Promise<{ success: boolean }> {
    // Validate token and new password presence
    if (!resetData || !resetData.token || !resetData.password) {
      logger.warn('Password reset token or new password missing');
      throw errorFactory.createValidationError('Token and new password are required');
    }

    // Validate password strength
    if (!validatePasswordStrength(resetData.password)) {
      logger.warn('New password does not meet security requirements');
      throw errorFactory.createValidationError('New password does not meet security requirements');
    }

    // Retrieve token data from Redis
    const resetKey = `${PASSWORD_RESET_TOKEN_KEY_PREFIX}${resetData.token}`;
    const tokenDataString = await redisClient.get(resetKey);

    // If token not found or expired, throw error
    if (!tokenDataString) {
      logger.warn('Invalid or expired password reset token');
      throw errorFactory.createValidationError('Invalid or expired password reset token');
    }

    const tokenData = JSON.parse(tokenDataString) as { userId: string };

    // Extract user ID from token data
    const userId = tokenData.userId;

    // Get user from database
    const user = await this.userRepository.findById(userId);
    if (!user) {
      logger.warn('User not found for password reset', { userId });
      throw errorFactory.createValidationError('Invalid or expired password reset token');
    }

    // Hash the new password
    const hashedPassword = await hashPassword(resetData.password);

    // Update user's password in database
    await this.userRepository.update(userId, { passwordHash: hashedPassword });

    // Delete reset token from Redis
    await redisClient.del(resetKey);

    // Invalidate user cache
    await invalidateUserCache(userId);
    await invalidateUserEmailCache(user.email);

    // Revoke all refresh tokens for the user
    await this.revokeAllUserRefreshTokens(userId);

    // Send password changed notification
    await this.notificationService.createNotification({
      userId: user.id,
      type: 'password_reset',
      title: 'Password Changed',
      message: 'Your password has been changed successfully.',
      data: { email: user.email }
    });

    // Return success status
    logger.info('Password reset successfully', { userId });
    return { success: true };
  }

  /**
   * Changes the password for an authenticated user
   * @param userId 
   * @param passwordData 
   * @returns Success status of the password change
   */
  async changePassword(userId: string, passwordData: ChangePasswordRequest): Promise<{ success: boolean }> {
    // Validate current and new password presence
    if (!passwordData || !passwordData.currentPassword || !passwordData.newPassword) {
      logger.warn('Current or new password missing for password change');
      throw errorFactory.createValidationError('Current and new passwords are required');
    }

    // Validate new password strength
    if (!validatePasswordStrength(passwordData.newPassword)) {
      logger.warn('New password does not meet security requirements');
      throw errorFactory.createValidationError('New password does not meet security requirements');
    }

    // Get user from database
    const user = await this.userRepository.findById(userId);
    if (!user) {
      logger.warn('User not found for password change', { userId });
      throw errorFactory.createUnauthorizedError('Invalid credentials');
    }

    // Verify current password
    const passwordMatch = await verifyPassword(passwordData.currentPassword, user.passwordHash);

    // If current password invalid, throw unauthorized error
    if (!passwordMatch) {
      logger.warn('Invalid current password for password change', { userId });
      throw errorFactory.createUnauthorizedError('Invalid current password');
    }

    // Hash the new password
    const hashedPassword = await hashPassword(passwordData.newPassword);

    // Update user's password in database
    await this.userRepository.update(userId, { passwordHash: hashedPassword });

    // Invalidate user cache
    await invalidateUserCache(userId);
    await invalidateUserEmailCache(user.email);

    // Revoke all refresh tokens for the user
    await this.revokeAllUserRefreshTokens(userId);

    // Send password changed notification
    await this.notificationService.createNotification({
      userId: user.id,
      type: 'password_reset',
      title: 'Password Changed',
      message: 'Your password has been changed successfully.',
      data: { email: user.email }
    });

    // Return success status
    logger.info('Password changed successfully', { userId });
    return { success: true };
  }

  /**
   * Validates an access token and returns the user context
   * @param token 
   * @returns User context extracted from the token
   */
  async validateToken(token: string): Promise<UserContext> {
    // Verify access token using token manager
    const verificationResult = verifyAccessToken(token);

    // If token invalid, throw unauthorized error
    if (!verificationResult.isValid || !verificationResult.payload) {
      logger.warn('Invalid access token', { error: verificationResult.error });
      throw errorFactory.createUnauthorizedError(verificationResult.error || 'Invalid access token');
    }

    // Extract user context from token payload
    const { userId, email, role, isVerified } = verificationResult.payload;

    // Return user context
    logger.info('Access token validated successfully', { userId });
    return {
      userId,
      email,
      role,
      isVerified,
      permissions: [], // TODO: Implement permission retrieval based on role
    };
  }

  /**
   * Resends the verification email to a user
   * @param email 
   * @returns Success status of the email resend
   */
  async resendVerificationEmail(email: string): Promise<{ success: boolean }> {
    // Validate email presence
    if (!email) {
      logger.warn('Email missing for resend verification request');
      throw errorFactory.createValidationError('Email is required');
    }

    // Check if user exists with the provided email
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      logger.warn('User not found for resend verification request', { email });
      // Intentionally don't reveal if the email exists or not for security reasons
      return { success: true };
    }

    // If user already verified, throw error
    if (user.isVerified) {
      logger.warn('User already verified', { email });
      throw errorFactory.createValidationError('User already verified');
    }

    // Delete any existing verification token
    const existingToken = await this.generateVerificationToken(user.id);
    if (existingToken) {
      const verificationKey = `${VERIFICATION_TOKEN_KEY_PREFIX}${existingToken}`;
      await redisClient.del(verificationKey);
    }

    // Generate new verification token
    const verificationToken = await this.generateVerificationToken(user.id);

    // Store token in Redis with expiration
    const verificationKey = `${VERIFICATION_TOKEN_KEY_PREFIX}${verificationToken}`;
    await redisClient.set(verificationKey, JSON.stringify({ userId: user.id }), 'EX', parseInt(TOKEN_EXPIRATION.VERIFICATION));

    // Send verification email with token
    await this.sendVerificationEmail(user, verificationToken);

    // Return success status
    logger.info('Verification email resent successfully', { email });
    return { success: true };
  }

  /**
   * Retrieves user data from an access token
   * @param token 
   * @returns User data without password
   */
  async getUserFromToken(token: string): Promise<UserWithoutPassword> {
    // Decode token to extract user ID
    const decodedToken = decodeToken(token);

    // If token invalid, throw unauthorized error
    if (!decodedToken || !decodedToken.userId) {
      logger.warn('Invalid access token for getUserFromToken');
      throw errorFactory.createUnauthorizedError('Invalid access token');
    }

    // Get user from database
    const user = await this.userRepository.findById(decodedToken.userId);
    if (!user) {
      logger.warn('User not found for getUserFromToken', { userId: decodedToken.userId });
      throw errorFactory.createUnauthorizedError('Invalid access token');
    }

    // Return user data without password
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Generates a secure verification token for email verification
   * @param userId 
   * @returns Generated verification token
   */
  private async generateVerificationToken(userId: string): Promise<string> {
    // Generate secure random string for token
    const token = generateSecureRandomString(64);

    // Create token data with user ID
    const tokenData = { userId };

    // Store token in Redis with expiration
    const verificationKey = `${VERIFICATION_TOKEN_KEY_PREFIX}${token}`;
    await redisClient.set(verificationKey, JSON.stringify(tokenData), 'EX', parseInt(TOKEN_EXPIRATION.VERIFICATION));

    // Return the generated token
    logger.debug('Verification token generated', { userId });
    return token;
  }

  /**
   * Generates a secure token for password reset
   * @param userId 
   * @returns Generated password reset token
   */
  private async generatePasswordResetToken(userId: string): Promise<string> {
    // Generate secure random string for token
    const token = generateSecureRandomString(64);

    // Create token data with user ID
    const tokenData = { userId };

    // Store token in Redis with expiration
    const resetKey = `${PASSWORD_RESET_TOKEN_KEY_PREFIX}${token}`;
    await redisClient.set(resetKey, JSON.stringify(tokenData), 'EX', parseInt(TOKEN_EXPIRATION.PASSWORD_RESET));

    // Return the generated token
    logger.debug('Password reset token generated', { userId });
    return token;
  }

  /**
   * Sends an email with verification link to the user
   * @param user 
   * @param token 
   * @returns Promise that resolves when email is sent
   */
  private async sendVerificationEmail(user: User, token: string): Promise<void> {
    // Construct verification URL with token
    const verificationUrl = `${FRONTEND_URL}/verify-email?token=${token}`;

    // Create email content with verification link
    const emailContent = {
      to: user.email,
      subject: 'Verify Your Email Address',
      templateId: 'd-xxxxxxxxxxxx', // Replace with actual SendGrid template ID
      dynamicTemplateData: {
        name: user.firstName,
        verificationUrl,
      },
    };

    // Send email using email service
    try {
      await this.emailService.deliverNotification(
        {
          userId: user.id,
          type: 'account_verified',
          title: 'Verify Your Email Address',
          message: `Please click the following link to verify your email: ${verificationUrl}`,
          data: { email: user.email }
        },
        {
          recipient: user.email,
          templateId: 'd-xxxxxxxxxxxx',
          templateData: {
            name: user.firstName,
            verificationUrl,
          }
        }
      );
      logger.info('Verification email sent successfully', { email: user.email });
    } catch (error) {
      logger.error('Failed to send verification email', { error, email: user.email });
    }
  }

  /**
   * Sends an email with password reset link to the user
   * @param user 
   * @param token 
   * @returns Promise that resolves when email is sent
   */
  private async sendPasswordResetEmail(user: User, token: string): Promise<void> {
    // Construct password reset URL with token
    const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;

    // Create email content with reset link
    const emailContent = {
      to: user.email,
      subject: 'Password Reset Request',
      templateId: 'd-xxxxxxxxxxxx', // Replace with actual SendGrid template ID
      dynamicTemplateData: {
        name: user.firstName,
        resetUrl,
      },
    };

    // Send email using email service
    try {
      await this.emailService.deliverNotification(
        {
          userId: user.id,
          type: 'password_reset',
          title: 'Password Reset Request',
          message: `Please click the following link to reset your password: ${resetUrl}`,
          data: { email: user.email }
        },
        {
          recipient: user.email,
          templateId: 'd-xxxxxxxxxxxx',
          templateData: {
            name: user.firstName,
            resetUrl,
          }
        }
      );
      logger.info('Password reset email sent successfully', { email: user.email });
    } catch (error) {
      logger.error('Failed to send password reset email', { error, email: user.email });
    }
  }

  /**
   * Stores a refresh token in Redis
   * @param tokenData 
   * @returns Promise that resolves when token is stored
   */
  private async storeRefreshToken(tokenData: RefreshTokenData): Promise<void> {
    // Generate Redis key with token prefix and token value
    const key = `${REFRESH_TOKEN_KEY_PREFIX}${tokenData.token}`;

    // Serialize token data to JSON
    const tokenDataString = JSON.stringify(tokenData);

    // Store token data in Redis with expiration
    await redisClient.set(key, tokenDataString, 'EX', parseInt(TOKEN_EXPIRATION.REFRESH_TOKEN_CACHE));

    // Log token storage
    logger.debug('Refresh token stored in Redis', { userId: tokenData.userId, token: tokenData.token });
  }

  /**
   * Retrieves a stored refresh token from Redis
   * @param token 
   * @returns Token data if found, null otherwise
   */
  private async getStoredRefreshToken(token: string): Promise<RefreshTokenData | null> {
    // Generate Redis key with token prefix and token value
    const key = `${REFRESH_TOKEN_KEY_PREFIX}${token}`;

    // Retrieve token data from Redis
    const tokenDataString = await redisClient.get(key);

    // If data exists, parse JSON to RefreshTokenData
    if (tokenDataString) {
      try {
        const tokenData: RefreshTokenData = JSON.parse(tokenDataString);
        logger.debug('Refresh token retrieved from Redis', { userId: tokenData.userId, token });
        return tokenData;
      } catch (error) {
        logger.error('Failed to parse refresh token data from Redis', { error, token });
        return null;
      }
    }

    // Return null if token not found
    logger.debug('Refresh token not found in Redis', { token });
    return null;
  }

  /**
   * Deletes a refresh token from Redis
   * @param token 
   * @returns True if token was deleted, false otherwise
   */
  private async deleteRefreshToken(token: string): Promise<boolean> {
    // Generate Redis key with token prefix and token value
    const key = `${REFRESH_TOKEN_KEY_PREFIX}${token}`;

    // Delete key from Redis
    const result = await redisClient.del(key);

    // Return success status
    logger.debug('Refresh token deleted from Redis', { token, result });
    return result > 0;
  }

  /**
   * Revokes all refresh tokens for a specific user
   * @param userId 
   * @returns Promise that resolves when all tokens are revoked
   */
  private async revokeAllUserRefreshTokens(userId: string): Promise<void> {
    // Scan Redis for all keys matching the user's refresh tokens
    const pattern = `${REFRESH_TOKEN_KEY_PREFIX}*`;
    let cursor = '0';
    let keysDeleted = 0;

    do {
      const [nextCursor, keys] = await redisClient.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;

      // Filter keys to only include those belonging to the user
      const userKeys = keys.filter(key => {
        try {
          const tokenDataString = redisClient.get(key);
          if (!tokenDataString) return false;
          const tokenData = JSON.parse(tokenDataString) as RefreshTokenData;
          return tokenData.userId === userId;
        } catch (error) {
          logger.warn(`Error parsing token data for key ${key}`, { error });
          return false;
        }
      });

      // Delete all matching keys
      if (userKeys.length > 0) {
        const delResult = await redisClient.del(...userKeys);
        keysDeleted += delResult;
      }
    } while (cursor !== '0');

    // Log token revocation
    logger.info('All refresh tokens revoked for user', { userId, keysDeleted });
  }
}

/**
 * Factory function to create a configured AuthService instance with required dependencies
 */
export function createAuthService(
  userRepository: UserRepository,
  emailService: EmailService,
  notificationService: NotificationService
): AuthService {
  return new AuthService(userRepository, emailService, notificationService);
}