import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { resetMockDatabase, getMockData } from '../../mocks/database.mock';
import { mockUsers } from '../../fixtures/users.fixture';
import { 
  mockServicesPlans, 
  mockNeedsAssessments, 
  mockCreateServicesPlanDTOs, 
  mockUpdateServicesPlanDTOs, 
  mockCreateNeedsAssessmentDTOs, 
  generateMockServicesPlan, 
  generateMockNeedsAssessment, 
  generateMockCreateServicesPlanDTO, 
  generateMockUpdateServicesPlanDTO, 
  generateMockCreateNeedsAssessmentDTO 
} from '../../fixtures/services-plans.fixture';
import { mockCarePlans } from '../../fixtures/care-plans.fixture';
import { Roles } from '../../../src/constants/roles';
import { PlanStatus } from '../../../src/constants/plan-statuses';

// Mock Express app for testing
const app = express();

/**
 * Sets up test data in the mock database before each test
 */
function setupTestData(): void {
  // Reset the mock database
  resetMockDatabase();
  
  // Insert test data
  const mockData = getMockData();
  
  // Add users
  mockData.user = [...mockUsers];
  
  // Add care plans
  mockData.careplan = [...mockCarePlans];
  
  // Add needs assessments
  mockData.needsassessment = [...mockNeedsAssessments];
  
  // Add services plans
  mockData.servicesplan = [...mockServicesPlans];
}

describe('Services Plans API Integration Tests', () => {
  beforeEach(() => {
    setupTestData();
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  test('GET /api/services-plans - Should return paginated services plans', async () => {
    // Set up auth token for case manager user
    const token = jwt.sign(
      { id: mockUsers[4].id, email: mockUsers[4].email, role: Roles.CASE_MANAGER },
      'test-secret-key',
      { expiresIn: '1h' }
    );
    
    const response = await request(app)
      .get('/api/services-plans')
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('pagination');
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);
  });
  
  test('GET /api/services-plans - Should filter services plans by client ID', async () => {
    // Set up auth token for case manager user
    const token = jwt.sign(
      { id: mockUsers[4].id, email: mockUsers[4].email, role: Roles.CASE_MANAGER },
      'test-secret-key',
      { expiresIn: '1h' }
    );
    
    const clientId = mockUsers[0].id; // Sarah Johnson
    
    const response = await request(app)
      .get(`/api/services-plans?clientId=${clientId}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(Array.isArray(response.body.data)).toBe(true);
    
    // All returned services plans should be for the specified client
    response.body.data.forEach((plan: any) => {
      expect(plan.clientId).toBe(clientId);
    });
  });
  
  test('GET /api/services-plans - Should filter services plans by status', async () => {
    // Set up auth token for case manager user
    const token = jwt.sign(
      { id: mockUsers[4].id, email: mockUsers[4].email, role: Roles.CASE_MANAGER },
      'test-secret-key',
      { expiresIn: '1h' }
    );
    
    const status = PlanStatus.DRAFT;
    
    const response = await request(app)
      .get(`/api/services-plans?status=${status}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(Array.isArray(response.body.data)).toBe(true);
    
    // All returned services plans should have the specified status
    response.body.data.forEach((plan: any) => {
      expect(plan.status).toBe(status);
    });
  });
  
  test('GET /api/services-plans/:id - Should return a specific services plan', async () => {
    // Set up auth token for case manager user
    const token = jwt.sign(
      { id: mockUsers[4].id, email: mockUsers[4].email, role: Roles.CASE_MANAGER },
      'test-secret-key',
      { expiresIn: '1h' }
    );
    
    const servicesPlanId = mockServicesPlans[0].id;
    
    const response = await request(app)
      .get(`/api/services-plans/${servicesPlanId}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', servicesPlanId);
    expect(response.body).toHaveProperty('serviceItems');
    expect(response.body).toHaveProperty('fundingSources');
    expect(Array.isArray(response.body.serviceItems)).toBe(true);
    expect(Array.isArray(response.body.fundingSources)).toBe(true);
  });
  
  test('GET /api/services-plans/:id - Should return 404 for non-existent services plan', async () => {
    // Set up auth token for case manager user
    const token = jwt.sign(
      { id: mockUsers[4].id, email: mockUsers[4].email, role: Roles.CASE_MANAGER },
      'test-secret-key',
      { expiresIn: '1h' }
    );
    
    const nonExistentId = 'non-existent-id';
    
    const response = await request(app)
      .get(`/api/services-plans/${nonExistentId}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('message');
  });
  
  test('POST /api/services-plans - Should create a new services plan', async () => {
    // Set up auth token for case manager user
    const token = jwt.sign(
      { id: mockUsers[4].id, email: mockUsers[4].email, role: Roles.CASE_MANAGER },
      'test-secret-key',
      { expiresIn: '1h' }
    );
    
    const createDTO = generateMockCreateServicesPlanDTO();
    
    const response = await request(app)
      .post('/api/services-plans')
      .set('Authorization', `Bearer ${token}`)
      .send(createDTO);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('clientId', createDTO.clientId);
    expect(response.body).toHaveProperty('title', createDTO.title);
    expect(response.body).toHaveProperty('serviceItems');
    expect(response.body).toHaveProperty('fundingSources');
    expect(response.body.serviceItems.length).toBe(createDTO.serviceItems.length);
    expect(response.body.fundingSources.length).toBe(createDTO.fundingSources.length);
    
    // Verify the services plan is stored in database
    const dbData = getMockData();
    const createdPlan = dbData.servicesplan.find((plan: any) => plan.id === response.body.id);
    expect(createdPlan).toBeTruthy();
  });
  
  test('POST /api/services-plans - Should return 400 for invalid services plan data', async () => {
    // Set up auth token for case manager user
    const token = jwt.sign(
      { id: mockUsers[4].id, email: mockUsers[4].email, role: Roles.CASE_MANAGER },
      'test-secret-key',
      { expiresIn: '1h' }
    );
    
    // Create invalid DTO with missing required fields
    const invalidDTO = {
      clientId: mockUsers[0].id,
      // Missing title, description, and other required fields
    };
    
    const response = await request(app)
      .post('/api/services-plans')
      .set('Authorization', `Bearer ${token}`)
      .send(invalidDTO);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message');
  });
  
  test('PUT /api/services-plans/:id - Should update an existing services plan', async () => {
    // Set up auth token for case manager user
    const token = jwt.sign(
      { id: mockUsers[4].id, email: mockUsers[4].email, role: Roles.CASE_MANAGER },
      'test-secret-key',
      { expiresIn: '1h' }
    );
    
    const servicesPlanId = mockServicesPlans[0].id;
    const updateDTO = generateMockUpdateServicesPlanDTO();
    
    const response = await request(app)
      .put(`/api/services-plans/${servicesPlanId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateDTO);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', servicesPlanId);
    expect(response.body).toHaveProperty('title', updateDTO.title);
    expect(response.body).toHaveProperty('description', updateDTO.description);
    expect(response.body).toHaveProperty('status', updateDTO.status);
    
    // Verify the services plan is updated in database
    const dbData = getMockData();
    const updatedPlan = dbData.servicesplan.find((plan: any) => plan.id === servicesPlanId);
    expect(updatedPlan.title).toBe(updateDTO.title);
    expect(updatedPlan.status).toBe(updateDTO.status);
  });
  
  test('PUT /api/services-plans/:id - Should return 404 for non-existent services plan', async () => {
    // Set up auth token for case manager user
    const token = jwt.sign(
      { id: mockUsers[4].id, email: mockUsers[4].email, role: Roles.CASE_MANAGER },
      'test-secret-key',
      { expiresIn: '1h' }
    );
    
    const nonExistentId = 'non-existent-id';
    const updateDTO = generateMockUpdateServicesPlanDTO();
    
    const response = await request(app)
      .put(`/api/services-plans/${nonExistentId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateDTO);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('message');
  });
  
  test('DELETE /api/services-plans/:id - Should delete a services plan', async () => {
    // Set up auth token for case manager user
    const token = jwt.sign(
      { id: mockUsers[4].id, email: mockUsers[4].email, role: Roles.CASE_MANAGER },
      'test-secret-key',
      { expiresIn: '1h' }
    );
    
    const servicesPlanId = mockServicesPlans[0].id;
    
    const response = await request(app)
      .delete(`/api/services-plans/${servicesPlanId}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message');
    
    // Verify the services plan is removed from database
    const dbData = getMockData();
    const deletedPlan = dbData.servicesplan.find((plan: any) => plan.id === servicesPlanId);
    expect(deletedPlan).toBeUndefined();
  });
  
  test('DELETE /api/services-plans/:id - Should return 404 for non-existent services plan', async () => {
    // Set up auth token for case manager user
    const token = jwt.sign(
      { id: mockUsers[4].id, email: mockUsers[4].email, role: Roles.CASE_MANAGER },
      'test-secret-key',
      { expiresIn: '1h' }
    );
    
    const nonExistentId = 'non-existent-id';
    
    const response = await request(app)
      .delete(`/api/services-plans/${nonExistentId}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('message');
  });
  
  test('POST /api/services-plans/:id/approve - Should approve a services plan', async () => {
    // Set up auth token for case manager user
    const token = jwt.sign(
      { id: mockUsers[4].id, email: mockUsers[4].email, role: Roles.CASE_MANAGER },
      'test-secret-key',
      { expiresIn: '1h' }
    );
    
    const servicesPlanId = mockServicesPlans[1].id; // Draft services plan
    const approvalData = {
      notes: 'Approved after review of all components.'
    };
    
    const response = await request(app)
      .post(`/api/services-plans/${servicesPlanId}/approve`)
      .set('Authorization', `Bearer ${token}`)
      .send(approvalData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', servicesPlanId);
    expect(response.body).toHaveProperty('status', PlanStatus.APPROVED);
    expect(response.body).toHaveProperty('approvedById', mockUsers[4].id);
    expect(response.body).toHaveProperty('approvedAt');
  });
  
  test('POST /api/services-plans/:id/approve - Should return 404 for non-existent services plan', async () => {
    // Set up auth token for case manager user
    const token = jwt.sign(
      { id: mockUsers[4].id, email: mockUsers[4].email, role: Roles.CASE_MANAGER },
      'test-secret-key',
      { expiresIn: '1h' }
    );
    
    const nonExistentId = 'non-existent-id';
    const approvalData = {
      notes: 'Approval notes'
    };
    
    const response = await request(app)
      .post(`/api/services-plans/${nonExistentId}/approve`)
      .set('Authorization', `Bearer ${token}`)
      .send(approvalData);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('message');
  });
  
  test('POST /api/services-plans/generate - Should generate services plan options', async () => {
    // Set up auth token for case manager user
    const token = jwt.sign(
      { id: mockUsers[4].id, email: mockUsers[4].email, role: Roles.CASE_MANAGER },
      'test-secret-key',
      { expiresIn: '1h' }
    );
    
    const generationCriteria = {
      clientId: mockUsers[0].id, // Sarah Johnson
      carePlanId: mockCarePlans[0].id,
      needsAssessmentId: mockNeedsAssessments[0].id,
      preferences: {
        priorityAreas: ['mobility', 'fatigue'],
        preferredProviders: [mockUsers[2].id] // Emily Lee (Provider)
      }
    };
    
    const response = await request(app)
      .post('/api/services-plans/generate')
      .set('Authorization', `Bearer ${token}`)
      .send(generationCriteria);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('options');
    expect(Array.isArray(response.body.options)).toBe(true);
    expect(response.body.options.length).toBeGreaterThan(0);
    
    // Check that the options have confidence scores
    expect(response.body).toHaveProperty('confidenceScores');
    
    // Check that the first option is a valid services plan
    const firstOption = response.body.options[0];
    expect(firstOption).toHaveProperty('clientId', generationCriteria.clientId);
    expect(firstOption).toHaveProperty('serviceItems');
    expect(firstOption).toHaveProperty('fundingSources');
  });
  
  test('GET /api/services-plans/:id/costs - Should estimate costs for a services plan', async () => {
    // Set up auth token for case manager user
    const token = jwt.sign(
      { id: mockUsers[4].id, email: mockUsers[4].email, role: Roles.CASE_MANAGER },
      'test-secret-key',
      { expiresIn: '1h' }
    );
    
    const servicesPlanId = mockServicesPlans[0].id;
    
    const response = await request(app)
      .get(`/api/services-plans/${servicesPlanId}/costs`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('totalCost');
    expect(response.body).toHaveProperty('coveredAmount');
    expect(response.body).toHaveProperty('outOfPocketCost');
    expect(response.body).toHaveProperty('serviceBreakdown');
    expect(response.body).toHaveProperty('fundingBreakdown');
    expect(Array.isArray(response.body.serviceBreakdown)).toBe(true);
    expect(Array.isArray(response.body.fundingBreakdown)).toBe(true);
  });
  
  test('GET /api/services-plans/:id/costs - Should return 404 for non-existent services plan', async () => {
    // Set up auth token for case manager user
    const token = jwt.sign(
      { id: mockUsers[4].id, email: mockUsers[4].email, role: Roles.CASE_MANAGER },
      'test-secret-key',
      { expiresIn: '1h' }
    );
    
    const nonExistentId = 'non-existent-id';
    
    const response = await request(app)
      .get(`/api/services-plans/${nonExistentId}/costs`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('message');
  });
  
  test('GET /api/services-plans/clients/:clientId/funding - Should identify funding sources', async () => {
    // Set up auth token for case manager user
    const token = jwt.sign(
      { id: mockUsers[4].id, email: mockUsers[4].email, role: Roles.CASE_MANAGER },
      'test-secret-key',
      { expiresIn: '1h' }
    );
    
    const clientId = mockUsers[0].id; // Sarah Johnson
    
    const response = await request(app)
      .get(`/api/services-plans/clients/${clientId}/funding`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('availableSources');
    expect(response.body).toHaveProperty('recommendedSources');
    expect(response.body).toHaveProperty('clientInsuranceInfo');
    expect(Array.isArray(response.body.availableSources)).toBe(true);
    expect(Array.isArray(response.body.recommendedSources)).toBe(true);
  });
  
  test('POST /api/needs-assessments - Should create a new needs assessment', async () => {
    // Set up auth token for case manager user
    const token = jwt.sign(
      { id: mockUsers[4].id, email: mockUsers[4].email, role: Roles.CASE_MANAGER },
      'test-secret-key',
      { expiresIn: '1h' }
    );
    
    const createDTO = generateMockCreateNeedsAssessmentDTO();
    
    const response = await request(app)
      .post('/api/needs-assessments')
      .set('Authorization', `Bearer ${token}`)
      .send(createDTO);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('clientId', createDTO.clientId);
    expect(response.body).toHaveProperty('createdById', mockUsers[4].id);
    expect(response.body).toHaveProperty('assessmentData');
    expect(response.body).toHaveProperty('notes', createDTO.notes);
    
    // Verify the needs assessment is stored in database
    const dbData = getMockData();
    const createdAssessment = dbData.needsassessment.find((assessment: any) => assessment.id === response.body.id);
    expect(createdAssessment).toBeTruthy();
  });
  
  test('GET /api/needs-assessments/:id - Should return a specific needs assessment', async () => {
    // Set up auth token for case manager user
    const token = jwt.sign(
      { id: mockUsers[4].id, email: mockUsers[4].email, role: Roles.CASE_MANAGER },
      'test-secret-key',
      { expiresIn: '1h' }
    );
    
    const needsAssessmentId = mockNeedsAssessments[0].id;
    
    const response = await request(app)
      .get(`/api/needs-assessments/${needsAssessmentId}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', needsAssessmentId);
    expect(response.body).toHaveProperty('clientId');
    expect(response.body).toHaveProperty('assessmentData');
    expect(response.body).toHaveProperty('notes');
  });
  
  test('GET /api/needs-assessments/clients/:clientId - Should return needs assessments for a client', async () => {
    // Set up auth token for case manager user
    const token = jwt.sign(
      { id: mockUsers[4].id, email: mockUsers[4].email, role: Roles.CASE_MANAGER },
      'test-secret-key',
      { expiresIn: '1h' }
    );
    
    const clientId = mockUsers[0].id; // Sarah Johnson
    
    const response = await request(app)
      .get(`/api/needs-assessments/clients/${clientId}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    
    // All returned needs assessments should be for the specified client
    response.body.forEach((assessment: any) => {
      expect(assessment.clientId).toBe(clientId);
    });
  });
  
  test('Should return 401 when no authentication token is provided', async () => {
    const response = await request(app)
      .get('/api/services-plans');
    
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('message');
  });
  
  test('Should return 403 when user does not have required role', async () => {
    // Set up auth token for client user (without case manager role)
    const token = jwt.sign(
      { id: mockUsers[0].id, email: mockUsers[0].email, role: Roles.CLIENT },
      'test-secret-key',
      { expiresIn: '1h' }
    );
    
    const createDTO = generateMockCreateServicesPlanDTO();
    
    const response = await request(app)
      .post('/api/services-plans')
      .set('Authorization', `Bearer ${token}`)
      .send(createDTO);
    
    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty('message');
  });
});