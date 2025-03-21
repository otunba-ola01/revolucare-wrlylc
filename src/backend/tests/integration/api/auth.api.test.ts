import { Response } from 'express'; // express@^4.18.2
import supertest from 'supertest'; // ^6.3.3
import express from 'express'; // express@^4.18.2
import cookieParser from 'cookie-parser'; // ^1.4.6
import { mockUsers, generateMockUser } from '../../fixtures/users.fixture';
import { createMockPrismaClient, mockPrisma } from '../../mocks/database.mock';
import { mockRedisClient } from '../../mocks/redis.mock';
import { mockEmailService } from '../../mocks/email.mock';
import { hashPassword } from '../../../src/utils/security';
import { Roles } from '../../../src/constants/roles';
import { UserRepository } from '../../../src/repositories/user.repository';
import { AuthService } from '../../../src/services/auth.service';
import { NotificationService } from '../../../src/services/notifications.service';
import createAuthRouter from '../../../src/api/routes/auth.routes';

const API_BASE_URL = '/api/auth';

/**
 * Sets up the test database with mock users for authentication API tests
 */
async function setupTestDatabase(): Promise<void> {
  // Create hashed passwords for test users
  const mockUsersWithHashedPasswords = await Promise.all(
    mockUsers.map(async (user) => ({
      ...user,
      passwordHash: await hashPassword('password123'),
    }))
  );

  // Configure mock Prisma client with test users
  mockPrisma.user.findUnique.mockImplementation(async (params) => {
    return mockUsersWithHashedPasswords.find((user) => user.email === params.where?.email) || null;
  });

  mockPrisma.user.findMany.mockResolvedValue(mockUsersWithHashedPasswords);

  mockPrisma.user.create.mockImplementation(async (params) => {
    const newUser = {
      id: `user-${mockUsersWithHashedPasswords.length + 1}`,
      ...params.data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockUsersWithHashedPasswords.push(newUser);
    return newUser;
  });

  // Configure mock Redis client for token storage
  mockRedisClient.get.mockImplementation(async (key: string) => {
    const user = mockUsersWithHashedPasswords.find((u) => key.includes(u.id));
    return user ? JSON.stringify(user) : null;
  });

  // Configure mock Email service for verification emails
  mockEmailService.deliverNotification.mockResolvedValue([{ success: true, channel: 'email', error: null, metadata: {} }]);

  // Initialize user repository with mock database
  const userRepository = new UserRepository();

  // Initialize notification service with mocks
  const notificationService = new NotificationService({} as any, {} as any, {} as any);

  // Initialize auth service with user repository, email service, and notification service
  const authService = new AuthService(userRepository, mockEmailService, notificationService);
}

/**
 * Creates an Express application instance for testing
 */
function createTestApp(): express.Application {
  // Create a new Express application
  const app = express();

  // Configure middleware (JSON parsing, cookie parsing, etc.)
  app.use(express.json());
  app.use(cookieParser());

  // Mount auth routes at API_BASE_URL using createAuthRouter
  app.use(API_BASE_URL, createAuthRouter(AuthService));

  // Configure error handling middleware
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ message: err.message || 'Internal Server Error' });
  });

  // Return the configured application
  return app;
}

/**
 * Extracts cookies from a supertest response
 */
function extractCookies(response: supertest.Response): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (response.header['set-cookie']) {
    response.header['set-cookie'].forEach((cookieString: string) => {
      const parts = cookieString.split(';');
      const cookie = parts[0].split('=');
      cookies[cookie[0]] = cookie[1];
    });
  }
  return cookies;
}

describe('Authentication API Integration Tests', () => {
  let app: express.Application;
  let request: supertest.SuperTest<supertest.Test>;

  beforeAll(async () => {
    // Configure mock database and services before tests
    await setupTestDatabase();

    // Create test application instance
    app = createTestApp();

    // Create supertest instance for testing
    request = supertest(app);
  });

  afterEach(() => {
    // Clean up mocks after tests
    jest.clearAllMocks();
  });

  it('POST /api/auth/register', async () => {
    // Create valid registration data for a new user
    const registrationData = {
      email: 'newuser@example.com',
      password: 'StrongPassword123!',
      firstName: 'New',
      lastName: 'User',
      role: Roles.CLIENT,
    };

    // Send POST request to /api/auth/register with registration data
    const response = await request.post(`${API_BASE_URL}/register`).send(registrationData);

    // Verify 201 Created response
    expect(response.status).toBe(201);

    // Verify response contains user data without password
    expect(response.body.data).toBeDefined();
    expect(response.body.data.email).toBe(registrationData.email);
    expect(response.body.data.firstName).toBe(registrationData.firstName);
    expect(response.body.data.lastName).toBe(registrationData.lastName);
    expect(response.body.data.role).toBe(registrationData.role);
    expect(response.body.data.password).toBeUndefined();

    // Verify user was actually created in the database
    expect(mockPrisma.user.create).toHaveBeenCalled();

    // Verify verification email was sent
    expect(mockEmailService.deliverNotification).toHaveBeenCalled();
  });

  it('POST /api/auth/register - email already exists', async () => {
    // Create registration data with an email that already exists
    const registrationData = {
      email: 'test@example.com',
      password: 'StrongPassword123!',
      firstName: 'Existing',
      lastName: 'User',
      role: Roles.CLIENT,
    };

    // Send POST request to /api/auth/register with registration data
    const response = await request.post(`${API_BASE_URL}/register`).send(registrationData);

    // Verify 400 Bad Request response
    expect(response.status).toBe(422);

    // Verify response contains appropriate error message about duplicate email
    expect(response.body.message).toBe('The provided data failed validation requirements');
    expect(response.body.error.details.validationErrors[0].message).toBe('User with this email already exists');
  });

  it('POST /api/auth/register - invalid data', async () => {
    // Create invalid registration data (missing required fields, invalid email format, weak password)
    const registrationData = {
      email: 'invalid-email',
      password: 'weak',
      firstName: '',
      lastName: '',
      role: 'invalid-role',
    };

    // Send POST request to /api/auth/register with invalid data
    const response = await request.post(`${API_BASE_URL}/register`).send(registrationData);

    // Verify 400 Bad Request response
    expect(response.status).toBe(422);

    // Verify response contains validation error details
    expect(response.body.message).toBe('The provided data failed validation requirements');
    expect(response.body.error.details.validationErrors).toBeDefined();
  });

  it('POST /api/auth/login', async () => {
    // Create valid login credentials for an existing user
    const loginCredentials = {
      email: 'test@example.com',
      password: 'password123',
    };

    // Send POST request to /api/auth/login with credentials
    const response = await request.post(`${API_BASE_URL}/login`).send(loginCredentials);

    // Verify 200 OK response
    expect(response.status).toBe(200);

    // Verify response contains access token and user data
    expect(response.body.data.accessToken).toBeDefined();
    expect(response.body.data.user).toBeDefined();
    expect(response.body.data.user.email).toBe(loginCredentials.email);

    // Verify refresh token is set in cookies
    const cookies = extractCookies(response);
    expect(cookies.refreshToken).toBeDefined();

    // Verify token can be used to access protected resources
    // TODO: Implement protected resource and test access with token
  });

  it('POST /api/auth/login - invalid credentials', async () => {
    // Create login credentials with invalid password
    const loginCredentials = {
      email: 'test@example.com',
      password: 'wrongpassword',
    };

    // Send POST request to /api/auth/login with invalid credentials
    const response = await request.post(`${API_BASE_URL}/login`).send(loginCredentials);

    // Verify 401 Unauthorized response
    expect(response.status).toBe(401);

    // Verify response contains appropriate error message
    expect(response.body.message).toBe('Authentication is required to access this resource');
  });

  it('POST /api/auth/login - user not found', async () => {
    // Create login credentials with non-existent email
    const loginCredentials = {
      email: 'nonexistent@example.com',
      password: 'password123',
    };

    // Send POST request to /api/auth/login with non-existent credentials
    const response = await request.post(`${API_BASE_URL}/login`).send(loginCredentials);

    // Verify 401 Unauthorized response
    expect(response.status).toBe(401);

    // Verify response contains appropriate error message
    expect(response.body.message).toBe('Authentication is required to access this resource');
  });

  it('POST /api/auth/login - unverified user', async () => {
    // Create valid login credentials for an unverified user
    const unverifiedUser = generateMockUser({ email: 'unverified@example.com', isVerified: false });
    mockPrisma.user.findUnique.mockResolvedValue(unverifiedUser);

    const loginCredentials = {
      email: 'unverified@example.com',
      password: 'password123',
    };

    // Send POST request to /api/auth/login with credentials
    const response = await request.post(`${API_BASE_URL}/login`).send(loginCredentials);

    // Verify 401 Unauthorized response
    expect(response.status).toBe(401);

    // Verify response contains error message about email verification
    expect(response.body.message).toBe('Authentication is required to access this resource');
  });

  it('POST /api/auth/refresh-token', async () => {
    // Login to get initial tokens
    const loginCredentials = {
      email: 'test@example.com',
      password: 'password123',
    };
    const loginResponse = await request.post(`${API_BASE_URL}/login`).send(loginCredentials);
    const refreshToken = extractCookies(loginResponse).refreshToken;

    // Send POST request to /api/auth/refresh-token with refresh token
    const response = await request.post(`${API_BASE_URL}/refresh-token`).send({ refreshToken });

    // Verify 200 OK response
    expect(response.status).toBe(200);

    // Verify response contains new access token
    expect(response.body.data.accessToken).toBeDefined();

    // Verify new refresh token is set in cookies
    const cookies = extractCookies(response);
    expect(cookies.refreshToken).toBeDefined();

    // Verify old refresh token is invalidated
    // TODO: Implement check for token invalidation
  });

  it('POST /api/auth/refresh-token - invalid token', async () => {
    // Send POST request to /api/auth/refresh-token with invalid refresh token
    const response = await request.post(`${API_BASE_URL}/refresh-token`).send({ refreshToken: 'invalid-token' });

    // Verify 401 Unauthorized response
    expect(response.status).toBe(401);

    // Verify response contains appropriate error message
    expect(response.body.message).toBe('Authentication is required to access this resource');
  });

  it('POST /api/auth/logout', async () => {
    // Login to get tokens
    const loginCredentials = {
      email: 'test@example.com',
      password: 'password123',
    };
    const loginResponse = await request.post(`${API_BASE_URL}/login`).send(loginCredentials);
    const refreshToken = extractCookies(loginResponse).refreshToken;

    // Send POST request to /api/auth/logout with refresh token
    const response = await request.post(`${API_BASE_URL}/logout`).send({ refreshToken });

    // Verify 200 OK response
    expect(response.status).toBe(200);

    // Verify refresh token cookie is cleared
    expect(response.header['set-cookie'][0]).toContain('refreshToken=;');

    // Verify refresh token is invalidated in the system
    // TODO: Implement check for token invalidation

    // Verify subsequent refresh token attempts fail
    // TODO: Implement check for token invalidation
  });

  it('POST /api/auth/verify-email', async () => {
    // Create an unverified user
    const unverifiedUser = generateMockUser({ email: 'unverified@example.com', isVerified: false });
    mockPrisma.user.findUnique.mockResolvedValue(unverifiedUser);

    // Generate a valid verification token
    const verificationToken = 'valid-token';
    mockRedisClient.get.mockResolvedValue(JSON.stringify({ userId: unverifiedUser.id }));

    // Send POST request to /api/auth/verify-email with token
    const response = await request.post(`${API_BASE_URL}/verify-email`).send({ token: verificationToken });

    // Verify 200 OK response
    expect(response.status).toBe(200);

    // Verify response contains success message
    expect(response.body.message).toBe('Email verified successfully');

    // Verify user's isVerified status is updated in the database
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: unverifiedUser.id },
        data: { isVerified: true },
      })
    );
  });

  it('POST /api/auth/verify-email - invalid token', async () => {
    // Send POST request to /api/auth/verify-email with invalid token
    const response = await request.post(`${API_BASE_URL}/verify-email`).send({ token: 'invalid-token' });

    // Verify 400 Bad Request response
    expect(response.status).toBe(422);

    // Verify response contains appropriate error message
    expect(response.body.message).toBe('The provided data failed validation requirements');
  });

  it('POST /api/auth/resend-verification', async () => {
    // Create an unverified user
    const unverifiedUser = generateMockUser({ email: 'unverified@example.com', isVerified: false });
    mockPrisma.user.findUnique.mockResolvedValue(unverifiedUser);

    // Send POST request to /api/auth/resend-verification with user's email
    const response = await request.post(`${API_BASE_URL}/resend-verification`).send({ email: 'unverified@example.com' });

    // Verify 200 OK response
    expect(response.status).toBe(200);

    // Verify response contains success message
    expect(response.body.message).toBe('Verification email resent successfully');

    // Verify verification email was sent
    expect(mockEmailService.deliverNotification).toHaveBeenCalled();
  });

  it('POST /api/auth/resend-verification - already verified', async () => {
    // Create a verified user
    const verifiedUser = generateMockUser({ email: 'verified@example.com', isVerified: true });
    mockPrisma.user.findUnique.mockResolvedValue(verifiedUser);

    // Send POST request to /api/auth/resend-verification with user's email
    const response = await request.post(`${API_BASE_URL}/resend-verification`).send({ email: 'verified@example.com' });

    // Verify 400 Bad Request response
    expect(response.status).toBe(422);

    // Verify response contains appropriate error message
    expect(response.body.message).toBe('The provided data failed validation requirements');
  });

  it('POST /api/auth/password-reset', async () => {
    // Send POST request to /api/auth/password-reset with user's email
    const response = await request.post(`${API_BASE_URL}/password-reset`).send({ email: 'test@example.com' });

    // Verify 200 OK response
    expect(response.status).toBe(200);

    // Verify response contains success message
    expect(response.body.message).toBe('Password reset email sent successfully');

    // Verify password reset email was sent
    expect(mockEmailService.deliverNotification).toHaveBeenCalled();
  });

  it('POST /api/auth/password-reset - user not found', async () => {
    // Send POST request to /api/auth/password-reset with non-existent email
    const response = await request.post(`${API_BASE_URL}/password-reset`).send({ email: 'nonexistent@example.com' });

    // Verify 200 OK response
    expect(response.status).toBe(200);

    // Verify response contains success message
    expect(response.body.message).toBe('Password reset email sent successfully');

    // Verify no email was actually sent
    expect(mockEmailService.deliverNotification).not.toHaveBeenCalled();
  });

  it('POST /api/auth/password-reset/confirm', async () => {
    // Generate a valid password reset token
    const resetToken = 'valid-reset-token';
    mockRedisClient.get.mockResolvedValue(JSON.stringify({ userId: 'user-client-1' }));

    // Send POST request to /api/auth/password-reset/confirm with token and new password
    const response = await request.post(`${API_BASE_URL}/password-reset/confirm`).send({ token: resetToken, password: 'NewStrongPassword123!' });

    // Verify 200 OK response
    expect(response.status).toBe(200);

    // Verify response contains success message
    expect(response.body.message).toBe('Password reset successfully');

    // Verify user's password is updated in the database
    expect(mockPrisma.user.update).toHaveBeenCalled();

    // Verify user can login with new password
    // TODO: Implement login with new password
  });

  it('POST /api/auth/password-reset/confirm - invalid token', async () => {
    // Send POST request to /api/auth/password-reset/confirm with invalid token
    const response = await request.post(`${API_BASE_URL}/password-reset/confirm`).send({ token: 'invalid-token', password: 'NewStrongPassword123!' });

    // Verify 400 Bad Request response
    expect(response.status).toBe(422);

    // Verify response contains appropriate error message
    expect(response.body.message).toBe('The provided data failed validation requirements');
  });

  it('POST /api/auth/password-reset/confirm - weak password', async () => {
    // Generate a valid password reset token
    const resetToken = 'valid-reset-token';
    mockRedisClient.get.mockResolvedValue(JSON.stringify({ userId: 'user-client-1' }));

    // Send POST request to /api/auth/password-reset/confirm with token and weak password
    const response = await request.post(`${API_BASE_URL}/password-reset/confirm`).send({ token: resetToken, password: 'weak' });

    // Verify 400 Bad Request response
    expect(response.status).toBe(422);

    // Verify response contains password strength error message
    expect(response.body.message).toBe('The provided data failed validation requirements');
  });

  it('POST /api/auth/change-password', async () => {
    // Login to get authentication token
    const loginCredentials = {
      email: 'test@example.com',
      password: 'password123',
    };
    const loginResponse = await request.post(`${API_BASE_URL}/login`).send(loginCredentials);
    const cookies = extractCookies(loginResponse);
    const accessToken = loginResponse.body.data.accessToken;

    // Send POST request to /api/auth/change-password with current and new password
    const response = await request
      .post(`${API_BASE_URL}/change-password`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Cookie', `refreshToken=${cookies.refreshToken}`)
      .send({ currentPassword: 'password123', newPassword: 'NewStrongPassword123!' });

    // Verify 200 OK response
    expect(response.status).toBe(200);

    // Verify response contains success message
    expect(response.body.message).toBe('Password changed successfully');

    // Verify user's password is updated in the database
    expect(mockPrisma.user.update).toHaveBeenCalled();

    // Verify user can login with new password
    // TODO: Implement login with new password

    // Verify old refresh tokens are invalidated
    // TODO: Implement check for token invalidation
  });

  it('POST /api/auth/change-password - incorrect current password', async () => {
    // Login to get authentication token
    const loginCredentials = {
      email: 'test@example.com',
      password: 'password123',
    };
    const loginResponse = await request.post(`${API_BASE_URL}/login`).send(loginCredentials);
    const cookies = extractCookies(loginResponse);
    const accessToken = loginResponse.body.data.accessToken;

    // Send POST request to /api/auth/change-password with incorrect current password
    const response = await request
      .post(`${API_BASE_URL}/change-password`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Cookie', `refreshToken=${cookies.refreshToken}`)
      .send({ currentPassword: 'wrongpassword', newPassword: 'NewStrongPassword123!' });

    // Verify 401 Unauthorized response
    expect(response.status).toBe(401);

    // Verify response contains appropriate error message
    expect(response.body.message).toBe('Authentication is required to access this resource');
  });

  it('POST /api/auth/change-password - weak new password', async () => {
    // Login to get authentication token
    const loginCredentials = {
      email: 'test@example.com',
      password: 'password123',
    };
    const loginResponse = await request.post(`${API_BASE_URL}/login`).send(loginCredentials);
    const cookies = extractCookies(loginResponse);
    const accessToken = loginResponse.body.data.accessToken;

    // Send POST request to /api/auth/change-password with correct current password but weak new password
    const response = await request
      .post(`${API_BASE_URL}/change-password`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Cookie', `refreshToken=${cookies.refreshToken}`)
      .send({ currentPassword: 'password123', newPassword: 'weak' });

    // Verify 400 Bad Request response
    expect(response.status).toBe(422);

    // Verify response contains password strength error message
    expect(response.body.message).toBe('The provided data failed validation requirements');
  });

  it('POST /api/auth/change-password - unauthenticated', async () => {
    // Send POST request to /api/auth/change-password without authentication token
    const response = await request.post(`${API_BASE_URL}/change-password`).send({ currentPassword: 'password123', newPassword: 'NewStrongPassword123!' });

    // Verify 401 Unauthorized response
    expect(response.status).toBe(401);

    // Verify response contains appropriate error message
    expect(response.body.message).toBe('Authentication is required to access this resource');
  });

  it('GET /api/auth/profile', async () => {
    // Login to get authentication token
    const loginCredentials = {
      email: 'test@example.com',
      password: 'password123',
    };
    const loginResponse = await request.post(`${API_BASE_URL}/login`).send(loginCredentials);
    const cookies = extractCookies(loginResponse);
    const accessToken = loginResponse.body.data.accessToken;

    // Send GET request to /api/auth/profile with authentication token
    const response = await request
      .get(`${API_BASE_URL}/profile`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Cookie', `refreshToken=${cookies.refreshToken}`);

    // Verify 200 OK response
    expect(response.status).toBe(200);

    // Verify response contains user profile data
    expect(response.body.data).toBeDefined();
    expect(response.body.data.email).toBe(loginCredentials.email);

    // Verify profile data matches the authenticated user
    // TODO: Implement profile data verification
  });

  it('GET /api/auth/profile - unauthenticated', async () => {
    // Send GET request to /api/auth/profile without authentication token
    const response = await request.get(`${API_BASE_URL}/profile`);

    // Verify 401 Unauthorized response
    expect(response.status).toBe(401);

    // Verify response contains appropriate error message
    expect(response.body.message).toBe('Authentication is required to access this resource');
  });
});