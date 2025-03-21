# src/backend/tests/integration/api/analytics.api.test.ts
```typescript
import request from 'supertest'; // ^6.3.3
import express from 'express'; // ^4.18.2
import { mockUsers, mockAdminsWithProfiles, mockCaseManagersWithProfiles, mockProvidersWithProfiles, mockClientsWithProfiles } from '../../fixtures/users.fixture';
import { createMockPrismaClient, mockPrisma } from '../../mocks/database.mock';
import { mockBlobStorageService } from '../../mocks/storage.mock';
import { mockAIService } from '../../mocks/ai.mock';
import { Roles } from '../../../src/constants/roles';
import { METRIC_CATEGORIES, TIME_PERIODS, REPORT_FORMATS } from '../../../src/constants/metrics';
import { AnalyticsRepository } from '../../../src/repositories/analytics.repository';
import { AnalyticsService } from '../../../src/services/analytics.service';
import { AuthService } from '../../../src/services/auth.service';
import { UserRepository } from '../../../src/repositories/user.repository';
import createAnalyticsRouter from '../../../src/api/routes/analytics.routes';

const API_BASE_URL = '/api/analytics';

describe('Analytics API Integration Tests', () => {
  let app: express.Express;
  let authToken: string;

  beforeAll(async () => {
    // Create an Express application instance
    app = express();
    app.use(express.json());

    // Mock database and services
    const mockPrismaClient = createMockPrismaClient();
    const analyticsRepository = new AnalyticsRepository();
    const analyticsService = new AnalyticsService(analyticsRepository);
    const userRepository = new UserRepository();
    const authService = new AuthService(userRepository, null as any, null as any);

    // Create analytics router with mock database and services
    const analyticsRouter = createAnalyticsRouter();

    // Mount the analytics router on the app
    app.use(API_BASE_URL, analyticsRouter);

    // Setup test database with mock data
    await setupTestDatabase();
  });

  /**
   * Sets up the test database with mock data for analytics tests
   */
  const setupTestDatabase = async (): Promise<void> => {
    // Configure mock Prisma client with test users and profiles
    mockPrisma.user.findUnique.mockResolvedValue(mockUsers[0]);
    mockPrisma.user.findMany.mockResolvedValue(mockUsers);

    // Set up mock metrics and dashboard data
    await setupMockMetrics();
    await setupMockDashboards();

    // Initialize analytics repository with mock database
    new AnalyticsRepository();

    // Set up mock blob storage service for report and export testing
    mockBlobStorageService.uploadFile.mockResolvedValue({
      storageUrl: 'mocked-report-url',
      contentType: 'application/pdf',
      size: 12345,
      etag: 'mocked-etag',
      uploadedAt: new Date()
    });
  };

  /**
   * Generates an authentication token for a test user
   * @param userId 
   * @param role 
   */
  const generateAuthToken = async (userId: string, role: Roles): Promise<string> => {
    // Create auth service instance
    const userRepository = new UserRepository();
    const authService = new AuthService(userRepository, null as any, null as any);

    // Generate JWT token with user ID and role
    return await authService.login({
      email: mockUsers.find(user => user.id === userId)?.email || 'test@example.com',
      password: 'password123'
    }).then(response => response.accessToken);
  };

  /**
   * Sets up mock metrics data in the database
   */
  const setupMockMetrics = async (): Promise<void> => {
    // Create mock metrics for different categories
    mockPrisma.metric.findMany.mockResolvedValue([
      {
        id: 'metric-1',
        name: 'active_users',
        description: 'Number of active users',
        category: 'user',
        value: 1234,
        unit: 'count',
        period: 'daily',
        previousValue: 1000,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'metric-2',
        name: 'service_utilization',
        description: 'Utilization rate of available services',
        category: 'service',
        value: 75,
        unit: 'percentage',
        period: 'monthly',
        previousValue: 60,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    // Add historical data for trend calculation
    mockPrisma.metricHistory.findMany.mockResolvedValue([]);
  };

  /**
   * Sets up mock dashboard configurations in the database
   */
  const setupMockDashboards = async (): Promise<void> => {
    // Create mock dashboards for different user roles
    mockPrisma.dashboard.findFirst.mockResolvedValue({
      id: 'dashboard-1',
      userId: 'user-admin-1',
      role: Roles.ADMINISTRATOR,
      title: 'Admin Dashboard',
      description: 'System overview for administrators',
      widgets: [],
      layout: {},
      isDefault: true,
      lastViewed: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Configure widgets with metric references
    mockPrisma.dashboardWidget.findMany.mockResolvedValue([]);
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/analytics/metrics - authenticated admin', () => {
    it('Should return metrics for authenticated admin user', async () => {
      // Generate auth token for admin user
      authToken = await generateAuthToken('user-admin-1', Roles.ADMINISTRATOR);

      // Send GET request to /api/analytics/metrics with auth token
      const response = await request(app)
        .get(`${API_BASE_URL}/metrics`)
        .set('Authorization', `Bearer ${authToken}`);

      // Verify 200 OK response
      expect(response.statusCode).toBe(200);

      // Verify response contains metrics array
      expect(response.body.metrics).toBeDefined();
      expect(Array.isArray(response.body.metrics)).toBe(true);

      // Verify metrics have expected structure with values, trends, and units
      response.body.metrics.forEach(metric => {
        expect(metric.value).toBeDefined();
        expect(metric.trend).toBeDefined();
        expect(metric.unit).toBeDefined();
      });
    });
  });

  describe('GET /api/analytics/metrics - with filters', () => {
    it('Should return filtered metrics based on query parameters', async () => {
      // Generate auth token for admin user
      authToken = await generateAuthToken('user-admin-1', Roles.ADMINISTRATOR);

      // Send GET request with category, period, and date range filters
      const response = await request(app)
        .get(`${API_BASE_URL}/metrics?category=user&period=monthly&startDate=2023-01-01&endDate=2023-01-31`)
        .set('Authorization', `Bearer ${authToken}`);

      // Verify 200 OK response
      expect(response.statusCode).toBe(200);

      // Verify returned metrics match the filter criteria
      expect(response.body.metrics).toBeDefined();
      response.body.metrics.forEach(metric => {
        expect(metric.category).toBe('user');
        expect(metric.period).toBe('monthly');
      });
    });
  });

  describe('GET /api/analytics/metrics - unauthenticated', () => {
    it('Should return 401 Unauthorized for unauthenticated request', async () => {
      // Send GET request without authentication token
      const response = await request(app).get(`${API_BASE_URL}/metrics`);

      // Verify 401 Unauthorized response
      expect(response.statusCode).toBe(401);

      // Verify response contains appropriate error message
      expect(response.body.message).toBe('Authentication token is required');
    });
  });

  describe('GET /api/analytics/metrics - unauthorized role', () => {
    it('Should return 403 Forbidden for user without analytics access', async () => {
      // Generate auth token for client user (who shouldn't have full analytics access)
      authToken = await generateAuthToken('user-client-1', Roles.CLIENT);

      // Send GET request with client auth token
      const response = await request(app)
        .get(`${API_BASE_URL}/metrics`)
        .set('Authorization', `Bearer ${authToken}`);

      // Verify 403 Forbidden response
      expect(response.statusCode).toBe(403);

      // Verify response contains appropriate error message
      expect(response.body.message).toBe('You do not have permission to access this resource');
    });
  });

  describe('GET /api/analytics/metrics - invalid parameters', () => {
    it('Should return 400 Bad Request for invalid query parameters', async () => {
      // Generate auth token for admin user
      authToken = await generateAuthToken('user-admin-1', Roles.ADMINISTRATOR);

      // Send GET request with invalid category or period
      const response = await request(app)
        .get(`${API_BASE_URL}/metrics?category=invalid&period=wrong`)
        .set('Authorization', `Bearer ${authToken}`);

      // Verify 400 Bad Request response
      expect(response.statusCode).toBe(400);

      // Verify response contains validation error details
      expect(response.body.message).toBe('Validation failed');
    });
  });

  describe('GET /api/analytics/dashboard - authenticated admin', () => {
    it('Should return dashboard for authenticated admin user', async () => {
      // Generate auth token for admin user
      authToken = await generateAuthToken('user-admin-1', Roles.ADMINISTRATOR);

      // Send GET request to /api/analytics/dashboard with auth token
      const response = await request(app)
        .get(`${API_BASE_URL}/dashboard`)
        .set('Authorization', `Bearer ${authToken}`);

      // Verify 200 OK response
      expect(response.statusCode).toBe(200);

      // Verify response contains dashboard configuration and metrics
      expect(response.body.dashboard).toBeDefined();
      expect(response.body.metrics).toBeDefined();

      // Verify dashboard has expected structure with widgets and layout
      expect(response.body.dashboard.widgets).toBeDefined();
      expect(response.body.dashboard.layout).toBeDefined();
    });
  });

  describe('GET /api/analytics/dashboard - role-specific dashboard', () => {
    it('Should return role-specific dashboard for different user roles', async () => {
      // Generate auth tokens for different user roles
      const adminToken = await generateAuthToken('user-admin-1', Roles.ADMINISTRATOR);
      const caseManagerToken = await generateAuthToken('user-case-manager-1', Roles.CASE_MANAGER);
      const providerToken = await generateAuthToken('user-provider-1', Roles.PROVIDER);
      const clientToken = await generateAuthToken('user-client-1', Roles.CLIENT);

      // Send GET requests with different role tokens
      const adminResponse = await request(app)
        .get(`${API_BASE_URL}/dashboard`)
        .set('Authorization', `Bearer ${adminToken}`);
      const caseManagerResponse = await request(app)
        .get(`${API_BASE_URL}/dashboard`)
        .set('Authorization', `Bearer ${caseManagerToken}`);
      const providerResponse = await request(app)
        .get(`${API_BASE_URL}/dashboard`)
        .set('Authorization', `Bearer ${providerToken}`);
      const clientResponse = await request(app)
        .get(`${API_BASE_URL}/dashboard`)
        .set('Authorization', `Bearer ${clientToken}`);

      // Verify each response contains role-appropriate dashboard
      expect(adminResponse.body.dashboard.role).toBe(Roles.ADMINISTRATOR);
      expect(caseManagerResponse.body.dashboard.role).toBe(Roles.CASE_MANAGER);
      expect(providerResponse.body.dashboard.role).toBe(Roles.PROVIDER);
      expect(clientResponse.body.dashboard.role).toBe(Roles.CLIENT);

      // Verify widgets are relevant to the user role
      expect(adminResponse.body.dashboard.widgets.length).toBeGreaterThan(0);
      expect(caseManagerResponse.body.dashboard.widgets.length).toBeGreaterThan(0);
      expect(providerResponse.body.dashboard.widgets.length).toBeGreaterThan(0);
      expect(clientResponse.body.dashboard.widgets.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/analytics/dashboard - with time period', () => {
    it('Should return dashboard with metrics for specified time period', async () => {
      // Generate auth token for admin user
      authToken = await generateAuthToken('user-admin-1', Roles.ADMINISTRATOR);

      // Send GET request with period parameter
      const response = await request(app)
        .get(`${API_BASE_URL}/dashboard?period=weekly`)
        .set('Authorization', `Bearer ${authToken}`);

      // Verify 200 OK response
      expect(response.statusCode).toBe(200);

      // Verify metrics in response match the requested period
      expect(response.body.period).toBe('weekly');
    });
  });

  describe('GET /api/analytics/dashboard - unauthenticated', () => {
    it('Should return 401 Unauthorized for unauthenticated request', async () => {
      // Send GET request without authentication token
      const response = await request(app).get(`${API_BASE_URL}/dashboard`);

      // Verify 401 Unauthorized response
      expect(response.statusCode).toBe(401);

      // Verify response contains appropriate error message
      expect(response.body.message).toBe('Authentication token is required');
    });
  });

  describe('POST /api/analytics/reports - generate report', () => {
    it('Should generate a report and return download URL', async () => {
      // Generate auth token for admin user
      authToken = await generateAuthToken('user-admin-1', Roles.ADMINISTRATOR);

      // Create valid report request with metrics and format
      const reportRequest = {
        name: 'System Health Report',
        description: 'Overview of system performance metrics',
        categories: ['system'],
        metrics: ['api_response_time', 'error_rate'],
        period: 'daily',
        startDate: '2023-01-01',
        endDate: '2023-01-31',
        format: 'pdf'
      };

      // Send POST request to /api/analytics/reports
      const response = await request(app)
        .post(`${API_BASE_URL}/reports`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(reportRequest);

      // Verify 200 OK response
      expect(response.statusCode).toBe(200);

      // Verify response contains report URL and expiration time
      expect(response.body.url).toBeDefined();
      expect(response.body.expiresAt).toBeDefined();

      // Verify mock storage service was called to store the report
      expect(mockBlobStorageService.uploadFile).toHaveBeenCalled();
    });
  });

  describe('POST /api/analytics/reports - invalid request', () => {
    it('Should return 400 Bad Request for invalid report parameters', async () => {
      // Generate auth token for admin user
      authToken = await generateAuthToken('user-admin-1', Roles.ADMINISTRATOR);

      // Create invalid report request (missing required fields)
      const reportRequest = {
        description: 'Overview of system performance metrics',
        metrics: ['api_response_time', 'error_rate'],
        period: 'daily',
        startDate: '2023-01-01',
        endDate: '2023-01-31',
        format: 'pdf'
      };

      // Send POST request to /api/analytics/reports
      const response = await request(app)
        .post(`${API_BASE_URL}/reports`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(reportRequest);

      // Verify 400 Bad Request response
      expect(response.statusCode).toBe(400);

      // Verify response contains validation error details
      expect(response.body.message).toBe('Validation failed');
    });
  });

  describe('POST /api/analytics/reports - unauthenticated', () => {
    it('Should return 401 Unauthorized for unauthenticated request', async () => {
      // Send POST request without authentication token
      const response = await request(app).post(`${API_BASE_URL}/reports`);

      // Verify 401 Unauthorized response
      expect(response.statusCode).toBe(401);

      // Verify response contains appropriate error message
      expect(response.body.message).toBe('Authentication token is required');
    });
  });

  describe('POST /api/analytics/reports - unauthorized role', () => {
    it('Should return 403 Forbidden for user without report generation access', async () => {
      // Generate auth token for client user
      authToken = await generateAuthToken('user-client-1', Roles.CLIENT);

      // Create valid report request
      const reportRequest = {
        name: 'System Health Report',
        description: 'Overview of system performance metrics',
        categories: ['system'],
        metrics: ['api_response_time', 'error_rate'],
        period: 'daily',
        startDate: '2023-01-01',
        endDate: '2023-01-31',
        format: 'pdf'
      };

      // Send POST request with client auth token
      const response = await request(app)
        .post(`${API_BASE_URL}/reports`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(reportRequest);

      // Verify 403 Forbidden response
      expect(response.statusCode).toBe(403);

      // Verify response contains appropriate error message
      expect(response.body.message).toBe('You do not have permission to access this resource');
    });
  });

  describe('POST /api/analytics/export - export data', () => {
    it('Should export data and return download URL', async () => {
      // Generate auth token for admin user
      authToken = await generateAuthToken('user-admin-1', Roles.ADMINISTRATOR);

      // Create valid export request with data type and format
      const exportRequest = {
        dataType: 'user_activity',
        filters: {},
        format: 'csv'
      };

      // Send POST request to /api/analytics/export
      const response = await request(app)
        .post(`${API_BASE_URL}/export`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(exportRequest);

      // Verify 200 OK response
      expect(response.statusCode).toBe(200);

      // Verify response contains export URL and expiration time
      expect(response.body.exportUrl).toBeDefined();
      expect(response.body.expiresAt).toBeDefined();

      // Verify mock storage service was called to store the export file
      expect(mockBlobStorageService.uploadFile).toHaveBeenCalled();
    });
  });

  describe('POST /api/analytics/export - invalid request', () => {
    it('Should return 400 Bad Request for invalid export parameters', async () => {
      // Generate auth token for admin user
      authToken = await generateAuthToken('user-admin-1', Roles.ADMINISTRATOR);

      // Create invalid export request (missing required fields)
      const exportRequest = {
        filters: {},
        format: 'csv'
      };

      // Send POST request to /api/analytics/export
      const response = await request(app)
        .post(`${API_BASE_URL}/export`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(exportRequest);

      // Verify 400 Bad Request response
      expect(response.statusCode).toBe(400);

      // Verify response contains validation error details
      expect(response.body.message).toBe('Validation failed');
    });
  });

  describe('POST /api/analytics/export - unauthenticated', () => {
    it('Should return 401 Unauthorized for unauthenticated request', async () => {
      // Send POST request without authentication token
      const response = await request(app).post(`${API_BASE_URL}/export`);

      // Verify 401 Unauthorized response
      expect(response.statusCode).toBe(401);

      // Verify response contains appropriate error message
      expect(response.body.message).toBe('Authentication token is required');
    });
  });

  describe('POST /api/analytics/events - track event', () => {
    it('Should track analytics event and return success', async () => {
      // Generate auth token for any authenticated user
      authToken = await generateAuthToken('user-admin-1', Roles.ADMINISTRATOR);

      // Create valid event tracking request
      const eventRequest = {
        eventType: 'user_login',
        eventData: {
          loginMethod: 'email',
          timestamp: new Date().toISOString()
        }
      };

      // Send POST request to /api/analytics/events
      const response = await request(app)
        .post(`${API_BASE_URL}/events`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(eventRequest);

      // Verify 202 Accepted response
      expect(response.statusCode).toBe(202);

      // Verify event was queued for processing
      // (In a real implementation, you would verify that the event was added to a queue)
    });
  });

  describe('POST /api/analytics/events - invalid event', () => {
    it('Should return 400 Bad Request for invalid event data', async () => {
      // Generate auth token for authenticated user
      authToken = await generateAuthToken('user-admin-1', Roles.ADMINISTRATOR);

      // Create invalid event request (missing required fields)
      const eventRequest = {
        eventData: {
          loginMethod: 'email'
        }
      };

      // Send POST request to /api/analytics/events
      const response = await request(app)
        .post(`${API_BASE_URL}/events`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(eventRequest);

      // Verify 400 Bad Request response
      expect(response.statusCode).toBe(400);

      // Verify response contains validation error details
      expect(response.body.message).toBe('Validation failed');
    });
  });

  describe('POST /api/analytics/events - unauthenticated', () => {
    it('Should return 401 Unauthorized for unauthenticated request', async () => {
      // Send POST request without authentication token
      const response = await request(app).post(`${API_BASE_URL}/events`);

      // Verify 401 Unauthorized response
      expect(response.statusCode).toBe(401);

      // Verify response contains appropriate error message
      expect(response.body.message).toBe('Authentication token is required');
    });
  });
});