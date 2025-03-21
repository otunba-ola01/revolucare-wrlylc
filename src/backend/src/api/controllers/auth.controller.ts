import { Request, Response, NextFunction } from 'express'; // express@^4.18.2
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
  AuthenticatedRequest,
} from '../../interfaces/auth.interface';
import { AuthService, createAuthService } from '../../services/auth.service';
import { errorFactory } from '../../utils/error-handler';
import { logger } from '../../utils/logger';
import { ErrorCodes } from '../../constants/error-codes';

// Define cookie options for refresh token
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

/**
 * Controller that handles authentication-related HTTP requests
 */
export class AuthController {
  private authService: IAuthService;

  /**
   * Creates a new AuthController instance with the required dependencies
   * @param authService 
   */
  constructor(authService: IAuthService) {
    this.authService = authService;
  }

  /**
   * Handles user registration requests
   * @param req 
   * @param res 
   * @param next 
   */
  async register(req: Request<{}, {}, RegisterRequest>, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract registration data from request body
      const registerData = req.body;

      // Call authService.register with the registration data
      const registeredUser = await this.authService.register(registerData);

      // Log successful registration
      logger.info('User registered successfully', { userId: registeredUser.id, email: registeredUser.email });

      // Return 201 Created response with the registered user data
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: registeredUser,
      });
    } catch (error) {
      // Catch and forward any errors to the error handling middleware
      next(error);
    }
  }

  /**
   * Handles user login requests
   * @param req 
   * @param res 
   * @param next 
   */
  async login(req: Request<{}, {}, LoginRequest>, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract login credentials from request body
      const loginData = req.body;

      // Call authService.login with the credentials
      const authResponse = await this.authService.login(loginData);

      // Set refresh token in HTTP-only cookie
      res.cookie('refreshToken', authResponse.refreshToken, COOKIE_OPTIONS);

      // Log successful login
      logger.info('User logged in successfully', { userId: authResponse.user.id, email: authResponse.user.email });

      // Return 200 OK response with access token and user data
      res.status(200).json({
        success: true,
        message: 'User logged in successfully',
        data: {
          accessToken: authResponse.accessToken,
          user: authResponse.user,
        },
      });
    } catch (error) {
      // Catch and forward any errors to the error handling middleware
      next(error);
    }
  }

  /**
   * Handles token refresh requests
   * @param req 
   * @param res 
   * @param next 
   */
  async refreshToken(req: Request<{}, {}, RefreshTokenRequest>, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract refresh token from cookies or request body
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

      // Call authService.refreshToken with the refresh token
      const authResponse = await this.authService.refreshToken({ refreshToken });

      // Set new refresh token in HTTP-only cookie
      res.cookie('refreshToken', authResponse.refreshToken, COOKIE_OPTIONS);

      // Log successful token refresh
      logger.info('Access token refreshed successfully');

      // Return 200 OK response with new access token
      res.status(200).json({
        success: true,
        message: 'Access token refreshed successfully',
        data: {
          accessToken: authResponse.accessToken,
        },
      });
    } catch (error) {
      // Catch and forward any errors to the error handling middleware
      next(error);
    }
  }

  /**
   * Handles user logout requests
   * @param req 
   * @param res 
   * @param next 
   */
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract refresh token from cookies or request body
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

      // Call authService.logout with the refresh token
      await this.authService.logout({ refreshToken });

      // Clear refresh token cookie
      res.clearCookie('refreshToken', COOKIE_OPTIONS);

      // Log successful logout
      logger.info('User logged out successfully');

      // Return 200 OK response with success message
      res.status(200).json({
        success: true,
        message: 'User logged out successfully',
      });
    } catch (error) {
      // Catch and forward any errors to the error handling middleware
      next(error);
    }
  }

  /**
   * Handles email verification requests
   * @param req 
   * @param res 
   * @param next 
   */
  async verifyEmail(req: Request<{}, {}, VerifyEmailRequest>, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract verification token from request body
      const { token } = req.body;

      // Call authService.verifyEmail with the token
      await this.authService.verifyEmail({ token });

      // Log successful email verification
      logger.info('Email verified successfully');

      // Return 200 OK response with success message
      res.status(200).json({
        success: true,
        message: 'Email verified successfully',
      });
    } catch (error) {
      // Catch and forward any errors to the error handling middleware
      next(error);
    }
  }

  /**
   * Handles password reset requests
   * @param req 
   * @param res 
   * @param next 
   */
  async requestPasswordReset(req: Request<{}, {}, PasswordResetRequest>, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract email from request body
      const { email } = req.body;

      // Call authService.requestPasswordReset with the email
      await this.authService.requestPasswordReset({ email });

      // Log password reset request (without revealing success/failure for security)
      logger.info('Password reset requested successfully', { email });

      // Return 200 OK response with success message (always success for security)
      res.status(200).json({
        success: true,
        message: 'Password reset email sent successfully',
      });
    } catch (error) {
      // Catch and forward any errors to the error handling middleware
      next(error);
    }
  }

  /**
   * Handles password reset confirmation requests
   * @param req 
   * @param res 
   * @param next 
   */
  async resetPassword(req: Request<{}, {}, PasswordResetConfirmRequest>, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract token and new password from request body
      const { token, password } = req.body;

      // Call authService.resetPassword with the token and new password
      await this.authService.resetPassword({ token, password });

      // Log successful password reset
      logger.info('Password reset successfully');

      // Return 200 OK response with success message
      res.status(200).json({
        success: true,
        message: 'Password reset successfully',
      });
    } catch (error) {
      // Catch and forward any errors to the error handling middleware
      next(error);
    }
  }

  /**
   * Handles password change requests for authenticated users
   * @param req 
   * @param res 
   * @param next 
   */
  async changePassword(req: AuthenticatedRequest<{}, {}, ChangePasswordRequest>, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract user ID from authenticated request
      const userId = req.user.userId;

      // Extract current and new password from request body
      const { currentPassword, newPassword } = req.body;

      // Call authService.changePassword with user ID and password data
      await this.authService.changePassword(userId, { currentPassword, newPassword });

      // Log successful password change
      logger.info('Password changed successfully', { userId });

      // Return 200 OK response with success message
      res.status(200).json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      // Catch and forward any errors to the error handling middleware
      next(error);
    }
  }

  /**
   * Handles requests to resend verification email
   * @param req 
   * @param res 
   * @param next 
   */
  async resendVerificationEmail(req: Request<{}, {}, { email: string }>, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract email from request body
      const { email } = req.body;

      // Call authService.resendVerificationEmail with the email
      await this.authService.resendVerificationEmail(email);

      // Log successful resend of verification email
      logger.info('Verification email resent successfully', { email });

      // Return 200 OK response with success message
      res.status(200).json({
        success: true,
        message: 'Verification email resent successfully',
      });
    } catch (error) {
      // Catch and forward any errors to the error handling middleware
      next(error);
    }
  }
  
    /**
   * Handles requests to get the authenticated user's profile
   * @param req 
   * @param res 
   * @param next 
   */
  async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract token from request headers
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        throw errorFactory.createUnauthorizedError('Missing authorization token');
      }
      // Call authService.getUserFromToken with the token
      const userProfile = await this.authService.getUserFromToken(token);

      // Return 200 OK response with user profile data
      res.status(200).json({
        success: true,
        message: 'User profile retrieved successfully',
        data: userProfile,
      });
    } catch (error) {
      // Catch and forward any errors to the error handling middleware
      next(error);
    }
  }
}

/**
 * Factory function to create a configured AuthController instance with required dependencies
 */
export function createAuthController(authService: IAuthService): AuthController {
  return new AuthController(authService);
}