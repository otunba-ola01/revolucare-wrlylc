import { Request, Response, NextFunction } from 'express'; // express@^4.18.2
import { AuthController, createAuthController } from '../../../src/api/controllers/auth.controller';
import { IAuthService, RegisterRequest, LoginRequest, AuthResponse, RefreshTokenRequest, VerifyEmailRequest, PasswordResetRequest, PasswordResetConfirmRequest, ChangePasswordRequest, AuthenticatedRequest } from '../../../src/interfaces/auth.interface';
import { UserWithoutPassword } from '../../../src/types/user.types';
import { Roles } from '../../../src/constants/roles';
import { ErrorCodes } from '../../../src/constants/error-codes';
import { generateMockUserWithoutPassword } from '../../fixtures/users.fixture';
import jest from 'jest'; // jest@^29.5.0

/**
 * Creates a mock implementation of the IAuthService interface for testing
 * @returns A mock implementation of the auth service
 */
const createMockAuthService = (): IAuthService => {
  const mockAuthService: jest.Mocked<IAuthService> = {
    register: jest.fn(),
    login: jest.fn(),
    refreshToken: jest.fn(),
    logout: jest.fn(),
    verifyEmail: jest.fn(),
    requestPasswordReset: jest.fn(),
    resetPassword: jest.fn(),
    changePassword: jest.fn(),
    validateToken: jest.fn(),
    resendVerificationEmail: jest.fn(),
    getUserFromToken: jest.fn(),
  };

  return mockAuthService;
};

/**
 * Creates a mock Express Request object for testing
 * @param body 
 * @param params 
 * @param query 
 * @param cookies 
 * @param headers 
 * @returns A mock Express Request object
 */
const createMockRequest = (
  body: any = {},
  params: any = {},
  query: any = {},
  cookies: any = {},
  headers: any = {}
): Request => {
  const req: Partial<Request> = {};
  req.body = body;
  req.params = params;
  req.query = query;
  req.cookies = cookies;
  req.headers = headers;
  return req as Request;
};

/**
 * Creates a mock Express Response object for testing
 * @returns A mock Express Response object with Jest spy methods
 */
const createMockResponse = (): Response => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn().mockReturnThis();
  res.send = jest.fn().mockReturnThis();
  res.cookie = jest.fn().mockReturnThis();
  res.clearCookie = jest.fn().mockReturnThis();
  return res as Response;
};

/**
 * Creates a mock Express NextFunction for testing
 * @returns A Jest mock function for the Express next middleware function
 */
const createMockNext = (): NextFunction => {
  return jest.fn() as NextFunction;
};

describe('AuthController', () => {
  describe('register', () => {
    it('should register a new user and return 201 status', async () => {
      // Arrange
      const mockAuthService = createMockAuthService();
      const mockUser: UserWithoutPassword = generateMockUserWithoutPassword();
      mockAuthService.register.mockResolvedValue(mockUser);
      const controller = createAuthController(mockAuthService);
      const req = createMockRequest({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: Roles.CLIENT,
      } as RegisterRequest);
      const res = createMockResponse();
      const next = createMockNext();

      // Act
      await controller.register(req, res, next);

      // Assert
      expect(mockAuthService.register).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'User registered successfully',
        data: mockUser,
      });
    });

    it('should pass errors to next middleware', async () => {
      // Arrange
      const mockAuthService = createMockAuthService();
      const mockError = new Error('Registration failed');
      mockAuthService.register.mockRejectedValue(mockError);
      const controller = createAuthController(mockAuthService);
      const req = createMockRequest({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: Roles.CLIENT,
      } as RegisterRequest);
      const res = createMockResponse();
      const next = createMockNext();

      // Act
      await controller.register(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(mockError);
    });
  });

  describe('login', () => {
    it('should authenticate user and return tokens with 200 status', async () => {
      // Arrange
      const mockAuthService = createMockAuthService();
      const mockUser: UserWithoutPassword = generateMockUserWithoutPassword();
      const mockAuthResponse: AuthResponse = {
        accessToken: 'mockAccessToken',
        refreshToken: 'mockRefreshToken',
        expiresIn: 3600,
        user: mockUser,
      };
      mockAuthService.login.mockResolvedValue(mockAuthResponse);
      const controller = createAuthController(mockAuthService);
      const req = createMockRequest({
        email: 'test@example.com',
        password: 'password123',
      } as LoginRequest);
      const res = createMockResponse();
      const next = createMockNext();

      // Act
      await controller.login(req, res, next);

      // Assert
      expect(mockAuthService.login).toHaveBeenCalledWith(req.body);
      expect(res.cookie).toHaveBeenCalledWith('refreshToken', mockAuthResponse.refreshToken, expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'User logged in successfully',
        data: {
          accessToken: mockAuthResponse.accessToken,
          user: mockAuthResponse.user,
        },
      });
    });

    it('should pass errors to next middleware', async () => {
      // Arrange
      const mockAuthService = createMockAuthService();
      const mockError = new Error('Login failed');
      mockAuthService.login.mockRejectedValue(mockError);
      const controller = createAuthController(mockAuthService);
      const req = createMockRequest({
        email: 'test@example.com',
        password: 'password123',
      } as LoginRequest);
      const res = createMockResponse();
      const next = createMockNext();

      // Act
      await controller.login(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(mockError);
    });
  });

  describe('refreshToken', () => {
    it('should refresh tokens and return new tokens with 200 status', async () => {
      // Arrange
      const mockAuthService = createMockAuthService();
      const mockUser: UserWithoutPassword = generateMockUserWithoutPassword();
      const mockAuthResponse: AuthResponse = {
        accessToken: 'newAccessToken',
        refreshToken: 'newRefreshToken',
        expiresIn: 3600,
        user: mockUser,
      };
      mockAuthService.refreshToken.mockResolvedValue(mockAuthResponse);
      const controller = createAuthController(mockAuthService);
      const req = createMockRequest({}, {}, {}, { refreshToken: 'oldRefreshToken' });
      const res = createMockResponse();
      const next = createMockNext();

      // Act
      await controller.refreshToken(req, res, next);

      // Assert
      expect(mockAuthService.refreshToken).toHaveBeenCalledWith({ refreshToken: 'oldRefreshToken' });
      expect(res.cookie).toHaveBeenCalledWith('refreshToken', mockAuthResponse.refreshToken, expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Access token refreshed successfully',
        data: {
          accessToken: mockAuthResponse.accessToken,
        },
      });
    });

    it('should use token from request body if not in cookies', async () => {
      // Arrange
      const mockAuthService = createMockAuthService();
      const mockUser: UserWithoutPassword = generateMockUserWithoutPassword();
      const mockAuthResponse: AuthResponse = {
        accessToken: 'newAccessToken',
        refreshToken: 'newRefreshToken',
        expiresIn: 3600,
        user: mockUser,
      };
      mockAuthService.refreshToken.mockResolvedValue(mockAuthResponse);
      const controller = createAuthController(mockAuthService);
      const req = createMockRequest({ refreshToken: 'oldRefreshToken' });
      const res = createMockResponse();
      const next = createMockNext();

      // Act
      await controller.refreshToken(req, res, next);

      // Assert
      expect(mockAuthService.refreshToken).toHaveBeenCalledWith({ refreshToken: 'oldRefreshToken' });
      expect(res.cookie).toHaveBeenCalledWith('refreshToken', mockAuthResponse.refreshToken, expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Access token refreshed successfully',
        data: {
          accessToken: mockAuthResponse.accessToken,
        },
      });
    });

    it('should pass errors to next middleware', async () => {
      // Arrange
      const mockAuthService = createMockAuthService();
      const mockError = new Error('Token refresh failed');
      mockAuthService.refreshToken.mockRejectedValue(mockError);
      const controller = createAuthController(mockAuthService);
      const req = createMockRequest({}, {}, {}, { refreshToken: 'oldRefreshToken' });
      const res = createMockResponse();
      const next = createMockNext();

      // Act
      await controller.refreshToken(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(mockError);
    });
  });

  describe('logout', () => {
    it('should logout user and clear refresh token cookie', async () => {
      // Arrange
      const mockAuthService = createMockAuthService();
      mockAuthService.logout.mockResolvedValue({ success: true });
      const controller = createAuthController(mockAuthService);
      const req = createMockRequest({}, {}, {}, { refreshToken: 'oldRefreshToken' });
      const res = createMockResponse();
      const next = createMockNext();

      // Act
      await controller.logout(req, res, next);

      // Assert
      expect(mockAuthService.logout).toHaveBeenCalledWith({ refreshToken: 'oldRefreshToken' });
      expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'User logged out successfully',
      });
    });

    it('should use token from request body if not in cookies', async () => {
      // Arrange
      const mockAuthService = createMockAuthService();
      mockAuthService.logout.mockResolvedValue({ success: true });
      const controller = createAuthController(mockAuthService);
      const req = createMockRequest({ refreshToken: 'oldRefreshToken' });
      const res = createMockResponse();
      const next = createMockNext();

      // Act
      await controller.logout(req, res, next);

      // Assert
      expect(mockAuthService.logout).toHaveBeenCalledWith({ refreshToken: 'oldRefreshToken' });
      expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'User logged out successfully',
      });
    });

    it('should pass errors to next middleware', async () => {
      // Arrange
      const mockAuthService = createMockAuthService();
      const mockError = new Error('Logout failed');
      mockAuthService.logout.mockRejectedValue(mockError);
      const controller = createAuthController(mockAuthService);
      const req = createMockRequest({}, {}, {}, { refreshToken: 'oldRefreshToken' });
      const res = createMockResponse();
      const next = createMockNext();

      // Act
      await controller.logout(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(mockError);
    });
  });

  describe('verifyEmail', () => {
    it('should verify email and return success message', async () => {
      // Arrange
      const mockAuthService = createMockAuthService();
      mockAuthService.verifyEmail.mockResolvedValue({ success: true });
      const controller = createAuthController(mockAuthService);
      const req = createMockRequest({ token: 'verificationToken' } as VerifyEmailRequest);
      const res = createMockResponse();
      const next = createMockNext();

      // Act
      await controller.verifyEmail(req, res, next);

      // Assert
      expect(mockAuthService.verifyEmail).toHaveBeenCalledWith({ token: 'verificationToken' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Email verified successfully',
      });
    });

    it('should pass errors to next middleware', async () => {
      // Arrange
      const mockAuthService = createMockAuthService();
      const mockError = new Error('Email verification failed');
      mockAuthService.verifyEmail.mockRejectedValue(mockError);
      const controller = createAuthController(mockAuthService);
      const req = createMockRequest({ token: 'verificationToken' } as VerifyEmailRequest);
      const res = createMockResponse();
      const next = createMockNext();

      // Act
      await controller.verifyEmail(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(mockError);
    });
  });

  describe('requestPasswordReset', () => {
    it('should request password reset and return success message', async () => {
      // Arrange
      const mockAuthService = createMockAuthService();
      mockAuthService.requestPasswordReset.mockResolvedValue({ success: true });
      const controller = createAuthController(mockAuthService);
      const req = createMockRequest({ email: 'test@example.com' } as PasswordResetRequest);
      const res = createMockResponse();
      const next = createMockNext();

      // Act
      await controller.requestPasswordReset(req, res, next);

      // Assert
      expect(mockAuthService.requestPasswordReset).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Password reset email sent successfully',
      });
    });

    it('should pass errors to next middleware', async () => {
      // Arrange
      const mockAuthService = createMockAuthService();
      const mockError = new Error('Password reset request failed');
      mockAuthService.requestPasswordReset.mockRejectedValue(mockError);
      const controller = createAuthController(mockAuthService);
      const req = createMockRequest({ email: 'test@example.com' } as PasswordResetRequest);
      const res = createMockResponse();
      const next = createMockNext();

      // Act
      await controller.requestPasswordReset(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(mockError);
    });
  });

  describe('resetPassword', () => {
    it('should reset password and return success message', async () => {
      // Arrange
      const mockAuthService = createMockAuthService();
      mockAuthService.resetPassword.mockResolvedValue({ success: true });
      const controller = createAuthController(mockAuthService);
      const req = createMockRequest({
        token: 'resetToken',
        password: 'newPassword123',
      } as PasswordResetConfirmRequest);
      const res = createMockResponse();
      const next = createMockNext();

      // Act
      await controller.resetPassword(req, res, next);

      // Assert
      expect(mockAuthService.resetPassword).toHaveBeenCalledWith({ token: 'resetToken', password: 'newPassword123' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Password reset successfully',
      });
    });

    it('should pass errors to next middleware', async () => {
      // Arrange
      const mockAuthService = createMockAuthService();
      const mockError = new Error('Password reset failed');
      mockAuthService.resetPassword.mockRejectedValue(mockError);
      const controller = createAuthController(mockAuthService);
      const req = createMockRequest({
        token: 'resetToken',
        password: 'newPassword123',
      } as PasswordResetConfirmRequest);
      const res = createMockResponse();
      const next = createMockNext();

      // Act
      await controller.resetPassword(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(mockError);
    });
  });

  describe('changePassword', () => {
    it('should change password for authenticated user and return success message', async () => {
      // Arrange
      const mockAuthService = createMockAuthService();
      mockAuthService.changePassword.mockResolvedValue({ success: true });
      const controller = createAuthController(mockAuthService);
      const req = createMockRequest({
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword123',
      } as ChangePasswordRequest) as AuthenticatedRequest;
      req.user = { userId: 'userId', email: 'test@example.com', role: Roles.CLIENT, isVerified: true, permissions: [] };
      const res = createMockResponse();
      const next = createMockNext();

      // Act
      await controller.changePassword(req, res, next);

      // Assert
      expect(mockAuthService.changePassword).toHaveBeenCalledWith('userId', { currentPassword: 'oldPassword123', newPassword: 'newPassword123' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Password changed successfully',
      });
    });

    it('should pass errors to next middleware', async () => {
      // Arrange
      const mockAuthService = createMockAuthService();
      const mockError = new Error('Password change failed');
      mockAuthService.changePassword.mockRejectedValue(mockError);
      const controller = createAuthController(mockAuthService);
      const req = createMockRequest({
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword123',
      } as ChangePasswordRequest) as AuthenticatedRequest;
      req.user = { userId: 'userId', email: 'test@example.com', role: Roles.CLIENT, isVerified: true, permissions: [] };
      const res = createMockResponse();
      const next = createMockNext();

      // Act
      await controller.changePassword(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(mockError);
    });
  });

  describe('resendVerificationEmail', () => {
    it('should resend verification email and return success message', async () => {
      // Arrange
      const mockAuthService = createMockAuthService();
      mockAuthService.resendVerificationEmail.mockResolvedValue({ success: true });
      const controller = createAuthController(mockAuthService);
      const req = createMockRequest({ email: 'test@example.com' });
      const res = createMockResponse();
      const next = createMockNext();

      // Act
      await controller.resendVerificationEmail(req, res, next);

      // Assert
      expect(mockAuthService.resendVerificationEmail).toHaveBeenCalledWith('test@example.com');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Verification email resent successfully',
      });
    });

    it('should pass errors to next middleware', async () => {
      // Arrange
      const mockAuthService = createMockAuthService();
      const mockError = new Error('Resend verification email failed');
      mockAuthService.resendVerificationEmail.mockRejectedValue(mockError);
      const controller = createAuthController(mockAuthService);
      const req = createMockRequest({ email: 'test@example.com' });
      const res = createMockResponse();
      const next = createMockNext();

      // Act
      await controller.resendVerificationEmail(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(mockError);
    });
  });

  describe('getProfile', () => {
    it('should get user profile from token and return user data', async () => {
      // Arrange
      const mockAuthService = createMockAuthService();
      const mockUser: UserWithoutPassword = generateMockUserWithoutPassword();
      mockAuthService.getUserFromToken.mockResolvedValue(mockUser);
      const controller = createAuthController(mockAuthService);
      const req = createMockRequest({}, {}, {}, {}, { authorization: 'Bearer mockToken' }) as AuthenticatedRequest;
      const res = createMockResponse();
      const next = createMockNext();

      // Act
      await controller.getProfile(req, res, next);

      // Assert
      expect(mockAuthService.getUserFromToken).toHaveBeenCalledWith('mockToken');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'User profile retrieved successfully',
        data: mockUser,
      });
    });

    it('should pass errors to next middleware', async () => {
      // Arrange
      const mockAuthService = createMockAuthService();
      const mockError = new Error('Get user profile failed');
      mockAuthService.getUserFromToken.mockRejectedValue(mockError);
      const controller = createAuthController(mockAuthService);
      const req = createMockRequest({}, {}, {}, {}, { authorization: 'Bearer mockToken' }) as AuthenticatedRequest;
      const res = createMockResponse();
      const next = createMockNext();

      // Act
      await controller.getProfile(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(mockError);
    });
  });

  describe('createAuthController factory function', () => {
    it('should create an AuthController instance with provided auth service', () => {
      // Arrange
      const mockAuthService = createMockAuthService();

      // Act
      const controller = createAuthController(mockAuthService);

      // Assert
      expect(controller).toBeInstanceOf(AuthController);
    });
  });
});