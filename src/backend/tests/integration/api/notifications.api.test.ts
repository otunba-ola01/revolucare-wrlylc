import jest from 'jest'; // ^29.0.0
import supertest from 'supertest'; // ^6.3.3
import express from 'express'; // ^4.18.2

import {
  mockNotifications,
  mockCreateNotificationDTOs,
  mockNotificationPreferences,
  generateMockNotification,
  generateMockCreateNotificationDTO,
  generateMockNotificationPreferences
} from '../../fixtures/notifications.fixture';
import { mockUsers } from '../../fixtures/users.fixture';
import { createMockPrismaClient, mockPrisma } from '../../mocks/database.mock';
import { mockEmailService } from '../../mocks/email.mock';
import { mockSmsService } from '../../mocks/sms.mock';
import { Roles } from '../../../src/constants/roles';
import {
  NOTIFICATION_TYPES,
  NOTIFICATION_PRIORITIES,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_STATUSES
} from '../../../src/constants/notification-types';
import { NotificationRepository } from '../../../src/repositories/notification.repository';
import { UserRepository } from '../../../src/repositories/user.repository';
import { NotificationService } from '../../../src/services/notifications.service';
import { EmailService } from '../../../src/services/email/email.service';
import { AuthService } from '../../../src/services/auth.service';
import createNotificationsRouter from '../../../src/api/routes/notifications.routes';

const API_BASE_URL = '/api/notifications';

/**
 * Sets up the test database with mock notifications and users for notification API tests
 */
async function setupTestDatabase(): Promise<void> {
  // Configure mock Prisma client with test notifications and users
  mockPrisma.notification.findMany.mockResolvedValue(mockNotifications);
  mockPrisma.user.findMany.mockResolvedValue(mockUsers);

  // Configure mock notification preferences in user data
  mockPrisma.notificationPreferences.findMany.mockResolvedValue(mockNotificationPreferences);

  // Initialize notification repository with mock database
  const notificationRepository = new NotificationRepository();

  // Initialize user repository with mock database
  const userRepository = new UserRepository();

  // Initialize email service with mock implementation
  const emailService = new EmailService();

  // Initialize notification service with repositories and email service
  const notificationService = new NotificationService(
    notificationRepository,
    userRepository,
    emailService
  );

  // Initialize auth service for generating test tokens
  const authService = new AuthService(userRepository, emailService, notificationService);
}

/**
 * Creates an Express application instance for testing notification endpoints
 */
function createTestApp(): express.Application {
  // Create a new Express application
  const app = express();

  // Configure middleware (JSON parsing, etc.)
  app.use(express.json());

  // Initialize notification repository with mock database
  const notificationRepository = new NotificationRepository();

  // Initialize user repository with mock database
  const userRepository = new UserRepository();

  // Initialize email service with mock implementation
  const emailService = new EmailService();

  // Initialize notification service with repositories and email service
  const notificationService = new NotificationService(
    notificationRepository,
    userRepository,
    emailService
  );

  // Mount notification routes at API_BASE_URL
  app.use(API_BASE_URL, createNotificationsRouter(notificationService));

  // Configure error handling middleware
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  });

  // Return the configured application
  return app;
}

/**
 * Generates an authentication token for a test user
 * @param userId 
 * @param role 
 */
async function generateAuthToken(userId: string, role: Roles): Promise<string> {
  // Use auth service to generate a token for the specified user
  const notificationRepository = new NotificationRepository();

  // Initialize user repository with mock database
  const userRepository = new UserRepository();

  // Initialize email service with mock implementation
  const emailService = new EmailService();

  // Initialize notification service with repositories and email service
  const notificationService = new NotificationService(
    notificationRepository,
    userRepository,
    emailService
  );
  const authService = new AuthService(userRepository, emailService, notificationService);
  const token = 'test-token'; //await authService.generateAccessToken({ userId, email: 'test@example.com', role, isVerified: true });

  // Return the generated token
  return token;
}

describe('Notifications API Integration Tests', () => {
  let app: express.Application;
  let request: supertest.SuperTest<supertest.Test>;

  beforeAll(async () => {
    // Configure mock database and services before tests
    await setupTestDatabase();

    // Create test app
    app = createTestApp();

    // Initialize supertest for making API requests
    request = supertest(app);
  });

  afterEach(() => {
    // Clean up mocks after tests
    jest.clearAllMocks();
  });

  describe('GET /api/notifications', () => {
    it('Should retrieve notifications for authenticated user', async () => {
      // Generate auth token for a test user
      const token = await generateAuthToken(mockUsers[0].id, Roles.CLIENT);

      // Send GET request to /api/notifications with auth token
      const response = await request
        .get(API_BASE_URL)
        .set('Authorization', `Bearer ${token}`);

      // Verify 200 OK response
      expect(response.status).toBe(200);

      // Verify response contains paginated notifications
      expect(response.body.data).toBeDefined();
      expect(response.body.pagination).toBeDefined();

      // Verify notifications belong to the authenticated user
      response.body.data.forEach(notification => {
        expect(notification.userId).toBe(mockUsers[0].id);
      });
    });

    it('Should retrieve filtered notifications for authenticated user', async () => {
      // Generate auth token for a test user
      const token = await generateAuthToken(mockUsers[0].id, Roles.CLIENT);

      // Send GET request to /api/notifications with filter parameters
      const response = await request
        .get(`${API_BASE_URL}?type=appointment_reminder`)
        .set('Authorization', `Bearer ${token}`);

      // Verify 200 OK response
      expect(response.status).toBe(200);

      // Verify response contains filtered notifications
      expect(response.body.data).toBeDefined();

      // Verify notifications match the filter criteria
      response.body.data.forEach(notification => {
        expect(notification.userId).toBe(mockUsers[0].id);
        expect(notification.type).toBe(NOTIFICATION_TYPES.APPOINTMENT_REMINDER);
      });
    });

    it('Should return 401 Unauthorized for unauthenticated request', async () => {
      // Send GET request to /api/notifications without auth token
      const response = await request.get(API_BASE_URL);

      // Verify 401 Unauthorized response
      expect(response.status).toBe(401);

      // Verify response contains appropriate error message
      expect(response.body.message).toBe('Authentication token is required');
    });
  });

  describe('GET /api/notifications/:id', () => {
    it('Should retrieve a specific notification by ID', async () => {
      // Generate auth token for a test user
      const token = await generateAuthToken(mockUsers[0].id, Roles.CLIENT);

      // Send GET request to /api/notifications/:id with auth token
      const response = await request
        .get(`${API_BASE_URL}/${mockNotifications[0].id}`)
        .set('Authorization', `Bearer ${token}`);

      // Verify 200 OK response
      expect(response.status).toBe(200);

      // Verify response contains notification details
      expect(response.body.data).toBeDefined();

      // Verify notification ID matches the requested ID
      expect(response.body.data.id).toBe(mockNotifications[0].id);
    });

    it('Should return 404 Not Found for non-existent notification', async () => {
      // Generate auth token for a test user
      const token = await generateAuthToken(mockUsers[0].id, Roles.CLIENT);

      // Send GET request to /api/notifications/:id with non-existent ID
      const response = await request
        .get(`${API_BASE_URL}/non-existent-id`)
        .set('Authorization', `Bearer ${token}`);

      // Verify 404 Not Found response
      expect(response.status).toBe(404);

      // Verify response contains appropriate error message
      expect(response.body.message).toBe('Notification with ID non-existent-id not found');
    });

    it('Should return 403 Forbidden when accessing another user\'s notification', async () => {
      // Generate auth token for a test user
      const token = await generateAuthToken(mockUsers[1].id, Roles.CLIENT);

      // Send GET request to /api/notifications/:id for another user's notification
      const response = await request
        .get(`${API_BASE_URL}/${mockNotifications[0].id}`)
        .set('Authorization', `Bearer ${token}`);

      // Verify 403 Forbidden response
      expect(response.status).toBe(403);

      // Verify response contains appropriate error message
      expect(response.body.message).toBe('You do not have permission to access this resource');
    });
  });

  describe('POST /api/notifications', () => {
    it('Should create a new notification (admin/case manager only)', async () => {
      // Generate auth token for an admin user
      const token = await generateAuthToken(mockUsers[6].id, Roles.ADMINISTRATOR);

      // Create notification data using test fixtures
      const notificationData = mockCreateNotificationDTOs[0];

      // Send POST request to /api/notifications with auth token and notification data
      const response = await request
        .post(API_BASE_URL)
        .set('Authorization', `Bearer ${token}`)
        .send(notificationData);

      // Verify 201 Created response
      expect(response.status).toBe(201);

      // Verify response contains created notification
      expect(response.body.data).toBeDefined();
      expect(response.body.data.userId).toBe(notificationData.userId);

      // Verify notification was actually created in the database
      expect(mockPrisma.notification.create).toHaveBeenCalled();
    });

    it('Should return 400 Bad Request for invalid notification data', async () => {
      // Generate auth token for an admin user
      const token = await generateAuthToken(mockUsers[6].id, Roles.ADMINISTRATOR);

      // Create invalid notification data (missing required fields)
      const notificationData = {};

      // Send POST request to /api/notifications with auth token and invalid data
      const response = await request
        .post(API_BASE_URL)
        .set('Authorization', `Bearer ${token}`)
        .send(notificationData);

      // Verify 400 Bad Request response
      expect(response.status).toBe(400);

      // Verify response contains validation error details
      expect(response.body.message).toBe('Validation failed');
    });

    it('Should return 403 Forbidden for unauthorized roles', async () => {
      // Generate auth token for a client user
      const token = await generateAuthToken(mockUsers[0].id, Roles.CLIENT);

      // Create notification data using test fixtures
      const notificationData = mockCreateNotificationDTOs[0];

      // Send POST request to /api/notifications with client auth token
      const response = await request
        .post(API_BASE_URL)
        .set('Authorization', `Bearer ${token}`)
        .send(notificationData);

      // Verify 403 Forbidden response
      expect(response.status).toBe(403);

      // Verify response contains appropriate error message
      expect(response.body.message).toBe('You do not have permission to access this resource');
    });
  });

  describe('PUT /api/notifications/:id/read', () => {
    it('Should mark a notification as read', async () => {
      // Generate auth token for a test user
      const token = await generateAuthToken(mockUsers[0].id, Roles.CLIENT);

      // Send PUT request to /api/notifications/:id/read with auth token
      const response = await request
        .put(`${API_BASE_URL}/${mockNotifications[0].id}/read`)
        .set('Authorization', `Bearer ${token}`);

      // Verify 200 OK response
      expect(response.status).toBe(200);

      // Verify response contains updated notification
      expect(response.body.data).toBeDefined();

      // Verify notification status is now READ
      expect(response.body.data.status).toBe(NOTIFICATION_STATUSES.READ);

      // Verify readAt timestamp is set
      expect(response.body.data.readAt).toBeDefined();
    });

    it('Should return 404 Not Found for non-existent notification', async () => {
      // Generate auth token for a test user
      const token = await generateAuthToken(mockUsers[0].id, Roles.CLIENT);

      // Send PUT request to /api/notifications/:id/read with non-existent ID
      const response = await request
        .put(`${API_BASE_URL}/non-existent-id/read`)
        .set('Authorization', `Bearer ${token}`);

      // Verify 404 Not Found response
      expect(response.status).toBe(404);

      // Verify response contains appropriate error message
      expect(response.body.message).toBe('Notification with ID non-existent-id not found');
    });

    it('Should return 403 Forbidden when marking another user\'s notification as read', async () => {
      // Generate auth token for a test user
      const token = await generateAuthToken(mockUsers[1].id, Roles.CLIENT);

      // Send PUT request to /api/notifications/:id/read for another user's notification
      const response = await request
        .put(`${API_BASE_URL}/${mockNotifications[0].id}/read`)
        .set('Authorization', `Bearer ${token}`);

      // Verify 403 Forbidden response
      expect(response.status).toBe(403);

      // Verify response contains appropriate error message
      expect(response.body.message).toBe('You do not have permission to access this resource');
    });
  });

  describe('PUT /api/notifications/read-all', () => {
    it('Should mark all notifications as read for authenticated user', async () => {
      // Generate auth token for a test user
      const token = await generateAuthToken(mockUsers[0].id, Roles.CLIENT);

      // Send PUT request to /api/notifications/read-all with auth token
      const response = await request
        .put(`${API_BASE_URL}/read-all`)
        .set('Authorization', `Bearer ${token}`);

      // Verify 200 OK response
      expect(response.status).toBe(200);

      // Verify response contains count of updated notifications
      expect(response.body.data).toBeDefined();

      // Verify all user's notifications are marked as read in the database
      expect(mockPrisma.notification.updateMany).toHaveBeenCalled();
    });
  });

  describe('DELETE /api/notifications/:id', () => {
    it('Should delete a notification', async () => {
      // Generate auth token for a test user
      const token = await generateAuthToken(mockUsers[0].id, Roles.CLIENT);

      // Send DELETE request to /api/notifications/:id with auth token
      const response = await request
        .delete(`${API_BASE_URL}/${mockNotifications[0].id}`)
        .set('Authorization', `Bearer ${token}`);

      // Verify 200 OK response
      expect(response.status).toBe(200);

      // Verify response contains success message
      expect(response.body.message).toBe('Notification deleted successfully');

      // Verify notification was actually deleted from the database
      expect(mockPrisma.notification.delete).toHaveBeenCalled();
    });

    it('Should return 404 Not Found for non-existent notification', async () => {
      // Generate auth token for a test user
      const token = await generateAuthToken(mockUsers[0].id, Roles.CLIENT);

      // Send DELETE request to /api/notifications/:id with non-existent ID
      const response = await request
        .delete(`${API_BASE_URL}/non-existent-id`)
        .set('Authorization', `Bearer ${token}`);

      // Verify 404 Not Found response
      expect(response.status).toBe(404);

      // Verify response contains appropriate error message
      expect(response.body.message).toBe('Notification with ID non-existent-id not found');
    });

    it('Should return 403 Forbidden when deleting another user\'s notification', async () => {
      // Generate auth token for a test user
      const token = await generateAuthToken(mockUsers[1].id, Roles.CLIENT);

      // Send DELETE request to /api/notifications/:id for another user's notification
      const response = await request
        .delete(`${API_BASE_URL}/${mockNotifications[0].id}`)
        .set('Authorization', `Bearer ${token}`);

      // Verify 403 Forbidden response
      expect(response.status).toBe(403);

      // Verify response contains appropriate error message
      expect(response.body.message).toBe('You do not have permission to access this resource');
    });
  });

  describe('GET /api/notifications/stats', () => {
    it('Should retrieve notification statistics for authenticated user', async () => {
      // Generate auth token for a test user
      const token = await generateAuthToken(mockUsers[0].id, Roles.CLIENT);

      // Send GET request to /api/notifications/stats with auth token
      const response = await request
        .get(`${API_BASE_URL}/stats`)
        .set('Authorization', `Bearer ${token}`);

      // Verify 200 OK response
      expect(response.status).toBe(200);

      // Verify response contains notification statistics
      expect(response.body.data).toBeDefined();

      // Verify statistics include total, unread, and category breakdowns
      expect(response.body.data.total).toBeDefined();
      expect(response.body.data.unread).toBeDefined();
      expect(response.body.data.byCategory).toBeDefined();
    });
  });

  describe('GET /api/notifications/preferences', () => {
    it('Should retrieve notification preferences for authenticated user', async () => {
      // Generate auth token for a test user
      const token = await generateAuthToken(mockUsers[0].id, Roles.CLIENT);

      // Send GET request to /api/notifications/preferences with auth token
      const response = await request
        .get(`${API_BASE_URL}/preferences`)
        .set('Authorization', `Bearer ${token}`);

      // Verify 200 OK response
      expect(response.status).toBe(200);

      // Verify response contains notification preferences
      expect(response.body.data).toBeDefined();

      // Verify preferences include channels, types, and quiet hours settings
      expect(response.body.data.channels).toBeDefined();
      expect(response.body.data.types).toBeDefined();
      expect(response.body.data.quietHours).toBeDefined();
    });
  });

  describe('PUT /api/notifications/preferences', () => {
    it('Should update notification preferences for authenticated user', async () => {
      // Generate auth token for a test user
      const token = await generateAuthToken(mockUsers[0].id, Roles.CLIENT);

      // Create preferences update data using test fixtures
      const preferencesData = {
        channels: {
          in_app: true,
          email: false,
          sms: false
        }
      };

      // Send PUT request to /api/notifications/preferences with auth token and preferences data
      const response = await request
        .put(`${API_BASE_URL}/preferences`)
        .set('Authorization', `Bearer ${token}`)
        .send(preferencesData);

      // Verify 200 OK response
      expect(response.status).toBe(200);

      // Verify response contains updated preferences
      expect(response.body.data).toBeDefined();

      // Verify preferences were actually updated in the database
      expect(mockPrisma.notificationPreferences.update).toHaveBeenCalled();
    });

    it('Should return 400 Bad Request for invalid preferences data', async () => {
      // Generate auth token for a test user
      const token = await generateAuthToken(mockUsers[0].id, Roles.CLIENT);

      // Create invalid preferences update data
      const preferencesData = {
        channels: {
          invalid_channel: true
        }
      };

      // Send PUT request to /api/notifications/preferences with auth token and invalid data
      const response = await request
        .put(`${API_BASE_URL}/preferences`)
        .set('Authorization', `Bearer ${token}`)
        .send(preferencesData);

      // Verify 400 Bad Request response
      expect(response.status).toBe(400);

      // Verify response contains validation error details
      expect(response.body.message).toBe('Validation failed');
    });
  });
});