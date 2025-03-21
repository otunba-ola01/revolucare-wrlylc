# src/backend/tests/integration/api/care-plans.api.test.ts
```typescript
import express from 'express'; // express@^4.18.2
import request from 'supertest'; // supertest@^6.3.3
import { z } from 'zod'; // zod@3.22.2

import {
  mockCarePlans,
  mockCreateCarePlanDTOs,
  mockUpdateCarePlanDTOs,
  mockCarePlanOptions,
  generateMockCarePlan,
  generateMockCreateCarePlanDTO,
  generateMockUpdateCarePlanDTO
} from '../../fixtures/care-plans.fixture';
import {
  mockUsers,
  mockClientsWithProfiles,
  mockCaseManagersWithProfiles,
  mockAdminsWithProfiles
} from '../../fixtures/users.fixture';
import { mockDocuments } from '../../fixtures/documents.fixture';
import { createMockPrismaClient, mockPrisma } from '../../mocks/database.mock';
import { mockRedisClient } from '../../mocks/redis.mock';
import { mockAIService } from '../../mocks/ai.mock';
import { PlanStatus } from '../../../src/constants/plan-statuses';
import { Roles } from '../../../src/constants/roles';
import { CarePlanRepository } from '../../../src/repositories/care-plan.repository';
import { DocumentRepository } from '../../../src/repositories/document.repository';
import { CarePlanGeneratorService } from '../../../src/services/ai/care-plan-generator.service';
import { NotificationService } from '../../../src/services/notifications.service';
import { CarePlansService } from '../../../src/services/care-plans.service';
import { createCarePlansRouter } from '../../../src/api/routes/care-plans.routes';
import { authenticate, authorize } from '../../../src/api/middlewares/auth.middleware';
import { generateToken } from '../../../src/utils/token-manager';

const API_BASE_URL = '/api/care-plans';

/**
 * Sets up the test database with mock data for care plans API tests
 */
async function setupTestDatabase(): Promise<void> {
  // Configure mock Prisma client with test users, care plans, and documents
  mockPrisma.user.findUnique.mockResolvedValue(mockUsers[0]);
  mockPrisma.carePlan.findUnique.mockResolvedValue(mockCarePlans[0]);
  mockPrisma.carePlan.findMany.mockResolvedValue(mockCarePlans);
  mockPrisma.document.findUnique.mockResolvedValue(mockDocuments[0]);

  // Configure mock Redis client for caching

  // Configure mock AI service for care plan generation

  // Initialize repositories with mock database

  // Initialize notification service with mocks

  // Initialize care plan generator service with AI mock

  // Initialize care plans service with repositories and other services
}

/**
 * Creates an Express application instance for testing
 */
function createTestApp(): express.Application {
  // Create a new Express application
  const app = express();

  // Configure middleware (JSON parsing, etc.)
  app.use(express.json());

  // Mock authentication middleware to simulate authenticated requests
  app.use((req, res, next) => {
    (req as any).user = {
      userId: mockUsers[0].id,
      email: mockUsers[0].email,
      role: mockUsers[0].role,
      isVerified: true,
      permissions: []
    };
    next();
  });

  // Mount care plans routes at API_BASE_URL using createCarePlansRouter
  app.use(API_BASE_URL, createCarePlansRouter());

  // Configure error handling middleware
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  });

  // Return the configured application
  return app;
}

/**
 * Generates an authentication token for test requests
 */
function generateAuthToken(userId: string, role: string): string {
  // Create payload with user ID, role, and other required claims
  const payload = {
    userId,
    role,
    isVerified: true
  };

  // Generate JWT token using the token manager
  const token = generateToken(payload);

  // Return the token string
  return token;
}

describe('Care Plans API Integration Tests', () => {
  let app: express.Application;

  /**
   * Configure mock database and services before tests
   */
  beforeAll(async () => {
    await setupTestDatabase();
    app = createTestApp();
  });

  /**
   * Clean up mocks after tests
   */
  afterAll(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/care-plans', () => {
    it('Should retrieve paginated care plans', async () => {
      // Generate auth token for a case manager
      const authToken = generateAuthToken(mockUsers[4].id, Roles.CASE_MANAGER);

      // Send GET request to /api/care-plans with auth token
      const response = await request(app)
        .get(API_BASE_URL)
        .set('Authorization', `Bearer ${authToken}`);

      // Verify 200 OK response
      expect(response.status).toBe(200);

      // Verify response contains paginated care plans
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);

      // Verify total count matches expected number of care plans
      expect(response.body.pagination.totalItems).toBe(mockCarePlans.length);
    });

    it('Should retrieve filtered care plans', async () => {
      // Generate auth token for a case manager
      const authToken = generateAuthToken(mockUsers[4].id, Roles.CASE_MANAGER);

      // Send GET request to /api/care-plans with filter parameters
      const response = await request(app)
        .get(`${API_BASE_URL}?status=${PlanStatus.ACTIVE}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Verify 200 OK response
      expect(response.status).toBe(200);

      // Verify response contains only care plans matching filters
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.every(plan => plan.carePlan.status === PlanStatus.ACTIVE)).toBe(true);

      // Verify total count matches expected number of filtered care plans
      const activePlans = mockCarePlans.filter(plan => plan.status === PlanStatus.ACTIVE);
      expect(response.body.pagination.totalItems).toBe(activePlans.length);
    });

    it('Should retrieve only client\'s own care plans', async () => {
      // Generate auth token for a client
      const authToken = generateAuthToken(mockUsers[0].id, Roles.CLIENT);

      // Send GET request to /api/care-plans with auth token
      const response = await request(app)
        .get(API_BASE_URL)
        .set('Authorization', `Bearer ${authToken}`);

      // Verify 200 OK response
      expect(response.status).toBe(200);

      // Verify response contains only care plans for the authenticated client
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.every(plan => plan.carePlan.clientId === mockUsers[0].id)).toBe(true);

      // Verify total count matches expected number of client's care plans
      const clientPlans = mockCarePlans.filter(plan => plan.clientId === mockUsers[0].id);
      expect(response.body.pagination.totalItems).toBe(clientPlans.length);
    });

    it('Should return 403 Forbidden for unauthorized roles', async () => {
      // Generate auth token for a user with unauthorized role
      const authToken = generateAuthToken(mockUsers[2].id, Roles.PROVIDER);

      // Send GET request to /api/care-plans with auth token
      const response = await request(app)
        .get(API_BASE_URL)
        .set('Authorization', `Bearer ${authToken}`);

      // Verify 403 Forbidden response
      expect(response.status).toBe(403);

      // Verify response contains appropriate error message
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('You do not have permission to access this resource');
    });

    it('Should return 401 Unauthorized for unauthenticated request', async () => {
      // Send GET request to /api/care-plans without auth token
      const response = await request(app)
        .get(API_BASE_URL);

      // Verify 401 Unauthorized response
      expect(response.status).toBe(401);

      // Verify response contains appropriate error message
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Authentication token is required');
    });
  });

  describe('GET /api/care-plans/:id', () => {
    it('Should retrieve a specific care plan by ID', async () => {
      // Generate auth token for a case manager
      const authToken = generateAuthToken(mockUsers[4].id, Roles.CASE_MANAGER);

      // Send GET request to /api/care-plans/:id with valid ID
      const response = await request(app)
        .get(`${API_BASE_URL}/${mockCarePlans[0].id}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Verify 200 OK response
      expect(response.status).toBe(200);

      // Verify response contains the requested care plan
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.carePlan.id).toBe(mockCarePlans[0].id);

      // Verify care plan data matches expected values
      expect(response.body.data.carePlan.title).toBe(mockCarePlans[0].title);
      expect(response.body.data.carePlan.description).toBe(mockCarePlans[0].description);
    });

    it('Should return 404 Not Found for non-existent care plan', async () => {
      // Generate auth token for a case manager
      const authToken = generateAuthToken(mockUsers[4].id, Roles.CASE_MANAGER);

      // Send GET request to /api/care-plans/:id with non-existent ID
      const response = await request(app)
        .get(`${API_BASE_URL}/non-existent-id`)
        .set('Authorization', `Bearer ${authToken}`);

      // Verify 404 Not Found response
      expect(response.status).toBe(404);

      // Verify response contains appropriate error message
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Care plan not found');
    });

    it('Should allow client to access their own care plan', async () => {
      // Generate auth token for a client
      const authToken = generateAuthToken(mockUsers[0].id, Roles.CLIENT);

      // Send GET request to /api/care-plans/:id with ID of client's own care plan
      const response = await request(app)
        .get(`${API_BASE_URL}/${mockCarePlans[0].id}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Verify 200 OK response
      expect(response.status).toBe(200);

      // Verify response contains the requested care plan
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.carePlan.id).toBe(mockCarePlans[0].id);
    });

    it('Should deny client access to another client\'s care plan', async () => {
      // Generate auth token for a client
      const authToken = generateAuthToken(mockUsers[0].id, Roles.CLIENT);

      // Send GET request to /api/care-plans/:id with ID of another client's care plan
      const response = await request(app)
        .get(`${API_BASE_URL}/${mockCarePlans[1].id}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Verify 403 Forbidden response
      expect(response.status).toBe(403);

      // Verify response contains appropriate error message
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('You do not have permission to access this resource');
    });
  });

  describe('POST /api/care-plans', () => {
    it('Should create a new care plan', async () => {
      // Generate auth token for a case manager
      const authToken = generateAuthToken(mockUsers[4].id, Roles.CASE_MANAGER);

      // Create valid care plan data
      const carePlanData = generateMockCreateCarePlanDTO();

      // Send POST request to /api/care-plans with care plan data
      const response = await request(app)
        .post(API_BASE_URL)
        .set('Authorization', `Bearer ${authToken}`)
        .send(carePlanData);

      // Verify 201 Created response
      expect(response.status).toBe(201);

      // Verify response contains the created care plan
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.carePlan.title).toBe(carePlanData.title);
      expect(response.body.data.carePlan.description).toBe(carePlanData.description);

      // Verify care plan was actually created in the database
      expect(mockPrisma.carePlan.create).toHaveBeenCalled();

      // Verify notification was sent to the client
      // TODO: Implement notification verification
    });

    it('Should return 400 Bad Request for invalid care plan data', async () => {
      // Generate auth token for a case manager
      const authToken = generateAuthToken(mockUsers[4].id, Roles.CASE_MANAGER);

      // Create invalid care plan data (missing required fields)
      const carePlanData = {};

      // Send POST request to /api/care-plans with invalid data
      const response = await request(app)
        .post(API_BASE_URL)
        .set('Authorization', `Bearer ${authToken}`)
        .send(carePlanData);

      // Verify 400 Bad Request response
      expect(response.status).toBe(400);

      // Verify response contains validation error details
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
      expect(response.body.error.details).toBeDefined();
    });

    it('Should return 403 Forbidden for unauthorized roles', async () => {
      // Generate auth token for a client (who cannot create care plans)
      const authToken = generateAuthToken(mockUsers[0].id, Roles.CLIENT);

      // Create valid care plan data
      const carePlanData = generateMockCreateCarePlanDTO();

      // Send POST request to /api/care-plans with care plan data
      const response = await request(app)
        .post(API_BASE_URL)
        .set('Authorization', `Bearer ${authToken}`)
        .send(carePlanData);

      // Verify 403 Forbidden response
      expect(response.status).toBe(403);

      // Verify response contains appropriate error message
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('You do not have permission to access this resource');
    });
  });

  describe('PUT /api/care-plans/:id', () => {
    it('Should update an existing care plan', async () => {
      // Generate auth token for a case manager
      const authToken = generateAuthToken(mockUsers[4].id, Roles.CASE_MANAGER);

      // Create valid update data
      const updateData = generateMockUpdateCarePlanDTO();

      // Send PUT request to /api/care-plans/:id with update data
      const response = await request(app)
        .put(`${API_BASE_URL}/${mockCarePlans[0].id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      // Verify 200 OK response
      expect(response.status).toBe(200);

      // Verify response contains the updated care plan
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.carePlan.title).toBe(updateData.title);
      expect(response.body.data.carePlan.description).toBe(updateData.description);

      // Verify care plan was actually updated in the database
      expect(mockPrisma.carePlan.update).toHaveBeenCalled();

      // Verify notification was sent to the client
      // TODO: Implement notification verification
    });

    it('Should return 404 Not Found for non-existent care plan', async () => {
      // Generate auth token for a case manager
      const authToken = generateAuthToken(mockUsers[4].id, Roles.CASE_MANAGER);

      // Create valid update data
      const updateData = generateMockUpdateCarePlanDTO();

      // Send PUT request to /api/care-plans/:id with non-existent ID
      const response = await request(app)
        .put(`${API_BASE_URL}/non-existent-id`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      // Verify 404 Not Found response
      expect(response.status).toBe(404);

      // Verify response contains appropriate error message
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Care plan not found');
    });

    it('Should return 400 Bad Request for invalid update data', async () => {
      // Generate auth token for a case manager
      const authToken = generateAuthToken(mockUsers[4].id, Roles.CASE_MANAGER);

      // Create invalid update data
      const updateData = { title: '' };

      // Send PUT request to /api/care-plans/:id with invalid data
      const response = await request(app)
        .put(`${API_BASE_URL}/${mockCarePlans[0].id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      // Verify 400 Bad Request response
      expect(response.status).toBe(400);

      // Verify response contains validation error details
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
      expect(response.body.error.details).toBeDefined();
    });

    it('Should return 403 Forbidden for unauthorized roles', async () => {
      // Generate auth token for a client (who cannot update care plans)
      const authToken = generateAuthToken(mockUsers[0].id, Roles.CLIENT);

      // Create valid update data
      const updateData = generateMockUpdateCarePlanDTO();

      // Send PUT request to /api/care-plans/:id with update data
      const response = await request(app)
        .put(`${API_BASE_URL}/${mockCarePlans[0].id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      // Verify 403 Forbidden response
      expect(response.status).toBe(403);

      // Verify response contains appropriate error message
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('You do not have permission to access this resource');
    });
  });

  describe('POST /api/care-plans/:id/approve', () => {
    it('Should approve a care plan', async () => {
      // Generate auth token for a case manager
      const authToken = generateAuthToken(mockUsers[4].id, Roles.CASE_MANAGER);

      // Create approval data with notes
      const approvalData = { approvalNotes: 'Approved based on client assessment' };

      // Send POST request to /api/care-plans/:id/approve with approval data
      const response = await request(app)
        .post(`${API_BASE_URL}/${mockCarePlans[0].id}/approve`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(approvalData);

      // Verify 200 OK response
      expect(response.status).toBe(200);

      // Verify response contains the approved care plan
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.carePlan.id).toBe(mockCarePlans[0].id);

      // Verify care plan status is updated to APPROVED
      expect(response.body.data.carePlan.status).toBe(PlanStatus.APPROVED);

      // Verify approval metadata (approvedBy, approvedAt, approvalNotes) is set
      expect(response.body.data.carePlan.approvedBy).toBeDefined();
      expect(response.body.data.carePlan.approvedAt).toBeDefined();
      expect(response.body.data.carePlan.approvalNotes).toBe(approvalData.approvalNotes);

      // Verify notification was sent to the client
      // TODO: Implement notification verification
    });

    it('Should return 400 Bad Request for already approved care plan', async () => {
      // Generate auth token for a case manager
      const authToken = generateAuthToken(mockUsers[4].id, Roles.CASE_MANAGER);

      // Create approval data with notes
      const approvalData = { approvalNotes: 'Approved based on client assessment' };

      // Send POST request to /api/care-plans/:id/approve for already approved plan
      const response = await request(app)
        .post(`${API_BASE_URL}/${mockCarePlans[3].id}/approve`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(approvalData);

      // Verify 400 Bad Request response
      expect(response.status).toBe(400);

      // Verify response contains appropriate error message
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('Should return 403 Forbidden for unauthorized roles', async () => {
      // Generate auth token for a client (who cannot approve care plans)
      const authToken = generateAuthToken(mockUsers[0].id, Roles.CLIENT);

      // Create approval data with notes
      const approvalData = { approvalNotes: 'Approved based on client assessment' };

      // Send POST request to /api/care-plans/:id/approve with approval data
      const response = await request(app)
        .post(`${API_BASE_URL}/${mockCarePlans[0].id}/approve`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(approvalData);

      // Verify 403 Forbidden response
      expect(response.status).toBe(403);

      // Verify response contains appropriate error message
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('You do not have permission to access this resource');
    });
  });

  describe('DELETE /api/care-plans/:id', () => {
    it('Should delete a care plan', async () => {
      // Generate auth token for a case manager
      const authToken = generateAuthToken(mockUsers[4].id, Roles.CASE_MANAGER);

      // Send DELETE request to /api/care-plans/:id with valid ID
      const response = await request(app)
        .delete(`${API_BASE_URL}/${mockCarePlans[0].id}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Verify 200 OK response
      expect(response.status).toBe(200);

      // Verify response contains success message
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Care plan deleted successfully');

      // Verify care plan was actually deleted from the database
      expect(mockPrisma.carePlan.delete).toHaveBeenCalled();
    });

    it('Should return 404 Not Found for non-existent care plan', async () => {
      // Generate auth token for a case manager
      const authToken = generateAuthToken(mockUsers[4].id, Roles.CASE_MANAGER);

      // Send DELETE request to /api/care-plans/:id with non-existent ID
      const response = await request(app)
        .delete(`${API_BASE_URL}/non-existent-id`)
        .set('Authorization', `Bearer ${authToken}`);

      // Verify 404 Not Found response
      expect(response.status).toBe(404);

      // Verify response contains appropriate error message
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Care plan not found');
    });

    it('Should return 403 Forbidden for unauthorized roles', async () => {
      // Generate auth token for a client (who cannot delete care plans)
      const authToken = generateAuthToken(mockUsers[0].id, Roles.CLIENT);

      // Send DELETE request to /api/care-plans/:id with valid ID
      const response = await request(app)
        .delete(`${API_BASE_URL}/${mockCarePlans[0].id}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Verify 403 Forbidden response
      expect(response.status).toBe(403);

      // Verify response contains appropriate error message
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('You do not have permission to access this resource');
    });
  });

  describe('GET /api/care-plans/:id/history', () => {
    it('Should retrieve care plan version history', async () => {
      // Generate auth token for a case manager
      const authToken = generateAuthToken(mockUsers[4].id, Roles.CASE_MANAGER);

      // Send GET request to /api/care-plans/:id/history with valid ID
      const response = await request(app)
        .get(`${API_BASE_URL}/${mockCarePlans[0].id}/history`)
        .set('Authorization', `Bearer ${authToken}`);

      // Verify 200 OK response
      expect(response.status).toBe(200);

      // Verify response contains version history
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data.versions)).toBe(true);

      // Verify history includes all versions with changes
      // TODO: Implement version history verification
    });

    it('Should return 404 Not Found for non-existent care plan', async () => {
      // Generate auth token for a case manager
      const authToken = generateAuthToken(mockUsers[4].id, Roles.CASE_MANAGER);

      // Send GET request to /api/care-plans/:id/history with non-existent ID
      const response = await request(app)
        .get(`${API_BASE_URL}/non-existent-id/history`)
        .set('Authorization', `Bearer ${authToken}`);

      // Verify 404 Not Found response
      expect(response.status).toBe(404);

      // Verify response contains appropriate error message
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Care plan not found');
    });

    it('Should return 403 Forbidden for unauthorized roles', async () => {
      // Generate auth token for a client (who cannot view history)
      const authToken = generateAuthToken(mockUsers[0].id, Roles.CLIENT);

      // Send GET request to /api/care-plans/:id/history with valid ID
      const response = await request(app)
        .get(`${API_BASE_URL}/${mockCarePlans[0].id}/history`)
        .set('Authorization', `Bearer ${authToken}`);

      // Verify 403 Forbidden response
      expect(response.status).toBe(403);

      // Verify response contains appropriate error message
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('You do not have permission to access this resource');
    });
  });

  describe('POST /api/care-plans/generate', () => {
    it('Should generate AI-powered care plan options', async () => {
      // Generate auth token for a case manager
      const authToken = generateAuthToken(mockUsers[4].id, Roles.CASE_MANAGER);

      // Create generation request with client ID and document IDs
      const generationData = {
        clientId: mockClientsWithProfiles[0].user.id,
        documentIds: [mockDocuments[0].id, mockDocuments[1].id]
      };

      // Configure mock AI service to return expected options
      mockAIService.generateOptions.mockResolvedValue(mockCarePlanOptions);

      // Send POST request to /api/care-plans/generate with request data
      const response = await request(app)
        .post(`${API_BASE_URL}/generate`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(generationData);

      // Verify 200 OK response
      expect(response.status).toBe(200);

      // Verify response contains generated care plan options
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data.options)).toBe(true);

      // Verify options include confidence scores
      expect(response.body.data.options.every(option => option.confidenceScore)).toBe(true);

      // Verify AI service was called with correct parameters
      expect(mockAIService.generateOptions).toHaveBeenCalledWith(generationData);
    });

    it('Should return 400 Bad Request for invalid generation request', async () => {
      // Generate auth token for a case manager
      const authToken = generateAuthToken(mockUsers[4].id, Roles.CASE_MANAGER);

      // Create invalid generation request (missing required fields)
      const generationData = { clientId: mockClientsWithProfiles[0].user.id };

      // Send POST request to /api/care-plans/generate with invalid data
      const response = await request(app)
        .post(`${API_BASE_URL}/generate`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(generationData);

      // Verify 400 Bad Request response
      expect(response.status).toBe(400);

      // Verify response contains validation error details
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
      expect(response.body.error.details).toBeDefined();
    });

    it('Should return 500 Internal Server Error when AI service fails', async () => {
      // Generate auth token for a case manager
      const authToken = generateAuthToken(mockUsers[4].id, Roles.CASE_MANAGER);

      // Create valid generation request
      const generationData = {
        clientId: mockClientsWithProfiles[0].user.id,
        documentIds: [mockDocuments[0].id, mockDocuments[1].id]
      };

      // Configure mock AI service to throw an error
      mockAIService.generateOptions.mockRejectedValue(new Error('AI service failed'));

      // Send POST request to /api/care-plans/generate with request data
      const response = await request(app)
        .post(`${API_BASE_URL}/generate`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(generationData);

      // Verify 500 Internal Server Error response
      expect(response.status).toBe(500);

      // Verify response contains appropriate error message
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('An unexpected error occurred while processing your request');
    });

    it('Should return 403 Forbidden for unauthorized roles', async () => {
      // Generate auth token for a client (who cannot generate care plans)
      const authToken = generateAuthToken(mockUsers[0].id, Roles.CLIENT);

      // Create valid generation request
      const generationData = {
        clientId: mockClientsWithProfiles[0].user.id,
        documentIds: [mockDocuments[0].id, mockDocuments[1].id]
      };

      // Send POST request to /api/care-plans/generate with request data
      const response = await request(app)
        .post(`${API_BASE_URL}/generate`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(generationData);

      // Verify 403 Forbidden response
      expect(response.status).toBe(403);

      // Verify response contains appropriate error message
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('You do not have permission to access this resource');
    });
  });
});