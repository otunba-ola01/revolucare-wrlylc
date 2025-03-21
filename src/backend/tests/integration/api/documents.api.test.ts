import request from 'supertest'; // ^6.3.3
import { path } from 'path'; // built-in
import fs from 'fs'; // built-in
import jest from 'jest'; // v^29.0.0

import { app } from '../../../src/server';
import {
  connectDatabase,
  disconnectDatabase,
  resetMockDatabase,
  getMockData
} from '../../mocks/database.mock';
import { MockBlobStorageService } from '../../mocks/storage.mock';
import { MockDocumentAnalysisService } from '../../mocks/ai.mock';
import {
  mockUsers,
  mockClientsWithProfiles,
  mockProvidersWithProfiles,
  mockCaseManagersWithProfiles,
  mockAdminsWithProfiles
} from '../../fixtures/users.fixture';
import {
  mockDocuments,
  mockDocumentMetadata,
  mockDocumentAnalyses,
  generateMockDocument,
  generateMockDocumentMetadata
} from '../../fixtures/documents.fixture';
import {
  DOCUMENT_TYPES,
  DOCUMENT_MIME_TYPES,
  DOCUMENT_ANALYSIS_TYPES
} from '../../../src/constants/document-types';
import { DocumentStatus, AnalysisStatus } from '../../../src/types/document.types';
import { Roles } from '../../../src/constants/roles';

// Initialize mock storage service
const mockStorageService = new MockBlobStorageService({ apiKey: 'test-key', endpoint: 'test-endpoint' });

// Initialize mock analysis service
const mockAnalysisService = new MockDocumentAnalysisService({});

// Define test file path
const testFilePath = path.join(__dirname, '../../fixtures/test-files/sample.pdf');

// Read test file into buffer
const testFileBuffer = fs.readFileSync(testFilePath);

// Define auth tokens object
const authTokens: { client: string; provider: string; caseManager: string; admin: string } = { client: '', provider: '', caseManager: '', admin: '' };

/**
 * Sets up a test user in the mock database and generates an auth token
 * @param user - The user object
 * @param role - The role of the user
 * @returns Promise<string> - JWT token for the user
 */
async function setupTestUser(user: any, role: string): Promise<string> {
  // Add the user to the mock database
  mockUsers.push(user);

  // Generate a JWT token for the user with appropriate role
  const token = `test-token-for-${role}`;

  // Return the token for use in authenticated requests
  return token;
}

/**
 * Sets up test documents in the mock database
 * @param ownerId - The ID of the document owner
 * @param count - The number of documents to create
 * @returns Promise<Array> - Array of created test documents
 */
async function setupTestDocuments(ownerId: string, count: number): Promise<Array<any>> {
  // Generate the specified number of mock documents
  const documents = Array.from({ length: count }, (_, i) => {
    return generateMockDocument({ ownerId, name: `Test_Document_${i + 1}.pdf` });
  });

  // Add the documents to the mock database
  mockDocuments.push(...documents);

  // Return the created documents for test assertions
  return documents;
}

describe('Documents API Integration Tests', () => {
  /**
   * Tests the documents API endpoints for CRUD operations and analysis
   */

  beforeAll(async () => {
    /**
     * Initialize mock storage service
     */
    await mockStorageService.initialize();

    /**
     * Initialize mock analysis service
     */
    await mockAnalysisService.initialize();

    /**
     * Connect to mock database
     */
    await connectDatabase();

    /**
     * Set up test users with different roles
     */
    authTokens.client = await setupTestUser(mockUsers[0], 'client');
    authTokens.provider = await setupTestUser(mockUsers[1], 'provider');
    authTokens.caseManager = await setupTestUser(mockUsers[2], 'case-manager');
    authTokens.admin = await setupTestUser(mockUsers[3], 'admin');
  });

  afterAll(async () => {
    /**
     * Disconnect from mock database
     */
    await disconnectDatabase();
  });

  beforeEach(async () => {
    /**
     * Reset mock database
     */
    await resetMockDatabase();

    /**
     * Reset mock storage service
     */
    mockStorageService.reset();
  });

  it('POST /api/documents/upload - should upload a document successfully', async () => {
    /**
     * Create a multipart form request with a test file and metadata
     */
    const res = await request(app)
      .post('/api/documents/upload')
      .set('Authorization', `Bearer ${authTokens.admin}`)
      .attach('file', testFilePath)
      .field('ownerId', mockUsers[0].id)
      .field('name', 'Test_Document.pdf')
      .field('type', DOCUMENT_TYPES.MEDICAL_RECORD)
      .field('metadata', JSON.stringify(generateMockDocumentMetadata()));

    /**
     * Assert response status is 201
     */
    expect(res.statusCode).toEqual(201);

    /**
     * Assert response contains expected document properties
     */
    expect(res.body.success).toEqual(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.name).toEqual('Test_Document.pdf');
    expect(res.body.data.type).toEqual(DOCUMENT_TYPES.MEDICAL_RECORD);
    expect(res.body.data.status).toEqual(DocumentStatus.AVAILABLE);

    /**
     * Assert document was stored in the mock database
     */
    const mockData = getMockData();
    expect(mockData.document.length).toEqual(1);
    expect(mockData.document[0].name).toEqual('Test_Document.pdf');

    /**
     * Assert file was uploaded to mock storage
     */
    expect(mockStorageService.uploadFile).toHaveBeenCalled();
  });

  it('POST /api/documents/upload - should return 400 for missing file', async () => {
    /**
     * Create a multipart form request with metadata but no file
     */
    const res = await request(app)
      .post('/api/documents/upload')
      .set('Authorization', `Bearer ${authTokens.admin}`)
      .field('ownerId', mockUsers[0].id)
      .field('name', 'Test_Document.pdf')
      .field('type', DOCUMENT_TYPES.MEDICAL_RECORD)
      .field('metadata', JSON.stringify(generateMockDocumentMetadata()));

    /**
     * Assert response status is 400
     */
    expect(res.statusCode).toEqual(400);

    /**
     * Assert response contains appropriate error message
     */
    expect(res.body.success).toEqual(false);
    expect(res.body.error.message).toEqual('File is required');
  });

  it('POST /api/documents/upload - should return 400 for invalid document type', async () => {
    /**
     * Create a multipart form request with a test file and invalid document type
     */
    const res = await request(app)
      .post('/api/documents/upload')
      .set('Authorization', `Bearer ${authTokens.admin}`)
      .attach('file', testFilePath)
      .field('ownerId', mockUsers[0].id)
      .field('name', 'Test_Document.pdf')
      .field('type', 'invalid_type')
      .field('metadata', JSON.stringify(generateMockDocumentMetadata()));

    /**
     * Assert response status is 400
     */
    expect(res.statusCode).toEqual(400);

    /**
     * Assert response contains appropriate error message about invalid document type
     */
    expect(res.body.success).toEqual(false);
    expect(res.body.error.message).toEqual('Invalid document type');
  });

  it('POST /api/documents/upload - should return 401 for unauthenticated request', async () => {
    /**
     * Create a multipart form request with a test file and metadata
     */
    const res = await request(app)
      .post('/api/documents/upload')
      .attach('file', testFilePath)
      .field('ownerId', mockUsers[0].id)
      .field('name', 'Test_Document.pdf')
      .field('type', DOCUMENT_TYPES.MEDICAL_RECORD)
      .field('metadata', JSON.stringify(generateMockDocumentMetadata()));

    /**
     * Assert response status is 401
     */
    expect(res.statusCode).toEqual(401);
  });

  it('GET /api/documents/:id - should retrieve a document by ID', async () => {
    /**
     * Set up a test document in the database
     */
    const testDocument = generateMockDocument({ ownerId: mockUsers[0].id });
    mockDocuments.push(testDocument);

    /**
     * Send GET request to the document endpoint with the document ID
     */
    const res = await request(app)
      .get(`/api/documents/${testDocument.id}`)
      .set('Authorization', `Bearer ${authTokens.admin}`);

    /**
     * Assert response status is 200
     */
    expect(res.statusCode).toEqual(200);

    /**
     * Assert response contains the expected document data
     */
    expect(res.body.success).toEqual(true);
    expect(res.body.data.id).toEqual(testDocument.id);
    expect(res.body.data.name).toEqual(testDocument.name);

    /**
     * Assert response includes a download URL
     */
    expect(res.body.data).toHaveProperty('downloadUrl');
  });

  it('GET /api/documents/:id - should return 404 for non-existent document', async () => {
    /**
     * Send GET request to the document endpoint with a non-existent ID
     */
    const res = await request(app)
      .get('/api/documents/non-existent-id')
      .set('Authorization', `Bearer ${authTokens.admin}`);

    /**
     * Assert response status is 404
     */
    expect(res.statusCode).toEqual(404);

    /**
     * Assert response contains appropriate error message
     */
    expect(res.body.success).toEqual(false);
    expect(res.body.error.message).toEqual('The requested resource was not found');
  });

  it("GET /api/documents/:id - should return 403 when user doesn't have access", async () => {
    /**
     * Set up a test document owned by admin user
     */
    const testDocument = generateMockDocument({ ownerId: mockUsers[3].id });
    mockDocuments.push(testDocument);

    /**
     * Send GET request with client auth token (different user)
     */
    const res = await request(app)
      .get(`/api/documents/${testDocument.id}`)
      .set('Authorization', `Bearer ${authTokens.client}`);

    /**
     * Assert response status is 403
     */
    expect(res.statusCode).toEqual(403);

    /**
     * Assert response contains appropriate error message about permissions
     */
    expect(res.body.success).toEqual(false);
    expect(res.body.error.message).toEqual('You do not have permission to access this resource');
  });

  it('GET /api/documents - should list documents with pagination', async () => {
    /**
     * Set up multiple test documents in the database
     */
    await setupTestDocuments(mockUsers[0].id, 5);

    /**
     * Send GET request to the documents list endpoint with pagination parameters
     */
    const res = await request(app)
      .get('/api/documents')
      .set('Authorization', `Bearer ${authTokens.admin}`)
      .query({ page: 1, limit: 3 });

    /**
     * Assert response status is 200
     */
    expect(res.statusCode).toEqual(200);

    /**
     * Assert response contains the expected number of documents
     */
    expect(res.body.success).toEqual(true);
    expect(res.body.data.length).toEqual(3);

    /**
     * Assert pagination metadata is correct
     */
    expect(res.body.pagination.page).toEqual(1);
    expect(res.body.pagination.limit).toEqual(3);
    expect(res.body.pagination.total).toEqual(5);
    expect(res.body.pagination.totalPages).toEqual(2);

    /**
     * Assert documents are sorted as expected
     */
    const mockData = getMockData();
    const expectedOrder = mockData.document
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 3)
      .map(doc => doc.id);
    const actualOrder = res.body.data.map(doc => doc.id);
    expect(actualOrder).toEqual(expectedOrder);
  });

  it('GET /api/documents - should filter documents by type', async () => {
    /**
     * Set up test documents with different types
     */
    await setupTestDocuments(mockUsers[0].id, 3);
    mockDocuments.push(generateMockDocument({ ownerId: mockUsers[0].id, type: DOCUMENT_TYPES.ASSESSMENT }));

    /**
     * Send GET request with type filter parameter
     */
    const res = await request(app)
      .get('/api/documents')
      .set('Authorization', `Bearer ${authTokens.admin}`)
      .query({ type: DOCUMENT_TYPES.ASSESSMENT });

    /**
     * Assert response status is 200
     */
    expect(res.statusCode).toEqual(200);

    /**
     * Assert all returned documents match the specified type
     */
    expect(res.body.success).toEqual(true);
    res.body.data.forEach(doc => {
      expect(doc.type).toEqual(DOCUMENT_TYPES.ASSESSMENT);
    });
  });

  it('GET /api/documents - should filter documents by owner', async () => {
    /**
     * Set up test documents with different owners
     */
    await setupTestDocuments(mockUsers[0].id, 2);
    mockDocuments.push(generateMockDocument({ ownerId: mockUsers[1].id }));

    /**
     * Send GET request with owner filter parameter
     */
    const res = await request(app)
      .get('/api/documents')
      .set('Authorization', `Bearer ${authTokens.admin}`)
      .query({ ownerId: mockUsers[0].id });

    /**
     * Assert response status is 200
     */
    expect(res.statusCode).toEqual(200);

    /**
     * Assert all returned documents match the specified owner
     */
    expect(res.body.success).toEqual(true);
    res.body.data.forEach(doc => {
      expect(doc.ownerId).toEqual(mockUsers[0].id);
    });
  });

  it('DELETE /api/documents/:id - should delete a document', async () => {
    /**
     * Set up a test document in the database
     */
    const testDocument = generateMockDocument({ ownerId: mockUsers[0].id });
    mockDocuments.push(testDocument);

    /**
     * Send DELETE request to the document endpoint with the document ID
     */
    const res = await request(app)
      .delete(`/api/documents/${testDocument.id}`)
      .set('Authorization', `Bearer ${authTokens.admin}`)
      .query({ permanent: true });

    /**
     * Assert response status is 200
     */
    expect(res.statusCode).toEqual(200);

    /**
     * Assert document is removed from the database
     */
    const mockData = getMockData();
    expect(mockData.document.find(doc => doc.id === testDocument.id)).toBeUndefined();

    /**
     * Assert file is deleted from storage when permanent=true
     */
    expect(mockStorageService.deleteFile).toHaveBeenCalledWith(expect.stringContaining(testDocument.id));
  });

  it('DELETE /api/documents/:id - should return 404 for non-existent document', async () => {
    /**
     * Send DELETE request to the document endpoint with a non-existent ID
     */
    const res = await request(app)
      .delete('/api/documents/non-existent-id')
      .set('Authorization', `Bearer ${authTokens.admin}`);

    /**
     * Assert response status is 404
     */
    expect(res.statusCode).toEqual(404);

    /**
     * Assert response contains appropriate error message
     */
    expect(res.body.success).toEqual(false);
    expect(res.body.error.message).toEqual('The requested resource was not found');
  });

  it('POST /api/documents/:id/analyze - should initiate document analysis', async () => {
    /**
     * Set up a test document in the database
     */
    const testDocument = generateMockDocument({ ownerId: mockUsers[0].id });
    mockDocuments.push(testDocument);

    /**
     * Send POST request to the analyze endpoint with analysis parameters
     */
    const res = await request(app)
      .post(`/api/documents/${testDocument.id}/analyze`)
      .set('Authorization', `Bearer ${authTokens.admin}`)
      .send({ analysisType: DOCUMENT_ANALYSIS_TYPES.MEDICAL_EXTRACTION });

    /**
     * Assert response status is 202
     */
    expect(res.statusCode).toEqual(202);

    /**
     * Assert response contains analysis ID and status
     */
    expect(res.body.success).toEqual(true);
    expect(res.body.data).toHaveProperty('analysisId');
    expect(res.body.data.status).toEqual(AnalysisStatus.PENDING);

    /**
     * Assert analysis job is created in the database
     */
    const mockData = getMockData();
    expect(mockData.document.find(doc => doc.id === testDocument.id).analysisResults).toBeDefined();
  });

  it('GET /api/documents/:id/analysis/:analysisId - should retrieve analysis results', async () => {
    /**
     * Set up a test document with completed analysis
     */
    const testDocument = generateMockDocument({ ownerId: mockUsers[0].id });
    const testAnalysis = generateMockDocumentAnalysis({ documentId: testDocument.id });
    mockDocuments.push(testDocument);

    /**
     * Send GET request to the analysis results endpoint
     */
    const res = await request(app)
      .get(`/api/documents/${testDocument.id}/analysis/${testAnalysis.id}`)
      .set('Authorization', `Bearer ${authTokens.admin}`);

    /**
     * Assert response status is 200
     */
    expect(res.statusCode).toEqual(200);

    /**
     * Assert response contains the expected analysis results
     */
    expect(res.body.success).toEqual(true);
    expect(res.body.data.id).toEqual(testAnalysis.id);
    expect(res.body.data.status).toEqual(AnalysisStatus.COMPLETED);

    /**
     * Assert confidence score is included in the response
     */
    expect(res.body.data).toHaveProperty('confidence');
  });

  it('PUT /api/documents/:id/metadata - should update document metadata', async () => {
    /**
     * Set up a test document in the database
     */
    const testDocument = generateMockDocument({ ownerId: mockUsers[0].id });
    mockDocuments.push(testDocument);

    /**
     * Send PUT request with updated metadata
     */
    const updatedMetadata = { ...testDocument.metadata, title: 'Updated Title' };
    const res = await request(app)
      .put(`/api/documents/${testDocument.id}/metadata`)
      .set('Authorization', `Bearer ${authTokens.admin}`)
      .send(updatedMetadata);

    /**
     * Assert response status is 200
     */
    expect(res.statusCode).toEqual(200);

    /**
     * Assert response contains updated metadata values
     */
    expect(res.body.success).toEqual(true);
    expect(res.body.data.metadata.title).toEqual('Updated Title');

    /**
     * Assert document is updated in the database
     */
    const mockData = getMockData();
    const updatedDocument = mockData.document.find(doc => doc.id === testDocument.id);
    expect(updatedDocument.metadata.title).toEqual('Updated Title');
  });

  it('GET /api/documents/:id/download - should download a document', async () => {
    /**
     * Set up a test document in the database
     */
    const testDocument = generateMockDocument({ ownerId: mockUsers[0].id });
    mockDocuments.push(testDocument);

    /**
     * Send GET request to the download endpoint
     */
    const res = await request(app)
      .get(`/api/documents/${testDocument.id}/download`)
      .set('Authorization', `Bearer ${authTokens.admin}`);

    /**
     * Assert response status is 200
     */
    expect(res.statusCode).toEqual(200);

    /**
     * Assert response content type matches document type
     */
    expect(res.headers['content-type']).toEqual(testDocument.mimeType);

    /**
     * Assert response body contains the file data
     */
    expect(res.body).toBeDefined();
  });

  it('GET /api/documents/:id/signed-url - should generate a signed URL', async () => {
    /**
     * Set up a test document in the database
     */
    const testDocument = generateMockDocument({ ownerId: mockUsers[0].id });
    mockDocuments.push(testDocument);

    /**
     * Send GET request to the signed URL endpoint
     */
    const res = await request(app)
      .get(`/api/documents/${testDocument.id}/signed-url`)
      .set('Authorization', `Bearer ${authTokens.admin}`);

    /**
     * Assert response status is 200
     */
    expect(res.statusCode).toEqual(200);

    /**
     * Assert response contains a valid signed URL
     */
    expect(res.body.success).toEqual(true);
    expect(res.body.data).toHaveProperty('signedUrl');

    /**
     * Assert URL expiration is set correctly
     */
    expect(res.body.data.signedUrl).toContain('expires=');
  });

  it('Role-based access control tests for each endpoint', async () => {
    /**
     * Test each endpoint with different user role tokens
     */
    const testDocument = generateMockDocument({ ownerId: mockUsers[0].id });
    mockDocuments.push(testDocument);

    const endpoints = [
      { path: '/api/documents/upload', method: 'post', allowedRoles: [Roles.ADMINISTRATOR] },
      { path: `/api/documents/${testDocument.id}`, method: 'get', allowedRoles: [Roles.ADMINISTRATOR, Roles.CASE_MANAGER, Roles.CLIENT] },
      { path: '/api/documents', method: 'get', allowedRoles: [Roles.ADMINISTRATOR, Roles.CASE_MANAGER, Roles.CLIENT, Roles.PROVIDER] },
      { path: `/api/documents/${testDocument.id}`, method: 'delete', allowedRoles: [Roles.ADMINISTRATOR] },
      { path: `/api/documents/${testDocument.id}/analyze`, method: 'post', allowedRoles: [Roles.ADMINISTRATOR, Roles.CASE_MANAGER] },
      { path: `/api/documents/${testDocument.id}/analysis/analysis-id`, method: 'get', allowedRoles: [Roles.ADMINISTRATOR, Roles.CASE_MANAGER] },
      { path: `/api/documents/${testDocument.id}/metadata`, method: 'put', allowedRoles: [Roles.ADMINISTRATOR] },
      { path: `/api/documents/${testDocument.id}/download`, method: 'get', allowedRoles: [Roles.ADMINISTRATOR, Roles.CASE_MANAGER, Roles.CLIENT] },
      { path: `/api/documents/${testDocument.id}/signed-url`, method: 'get', allowedRoles: [Roles.ADMINISTRATOR] },
    ];

    for (const endpoint of endpoints) {
      for (const role of Object.values(Roles)) {
        const isAllowed = endpoint.allowedRoles.includes(role);
        let res;

        switch (endpoint.method) {
          case 'post':
            res = await request(app)
              .post(endpoint.path)
              .set('Authorization', `Bearer ${authTokens[role.toLowerCase()]}`)
              .attach('file', testFilePath)
              .field('ownerId', mockUsers[0].id)
              .field('name', 'Test_Document.pdf')
              .field('type', DOCUMENT_TYPES.MEDICAL_RECORD)
              .field('metadata', JSON.stringify(generateMockDocumentMetadata()));
            break;
          case 'get':
            res = await request(app)
              .get(endpoint.path)
              .set('Authorization', `Bearer ${authTokens[role.toLowerCase()]}`);
            break;
          case 'put':
            res = await request(app)
              .put(endpoint.path)
              .set('Authorization', `Bearer ${authTokens[role.toLowerCase()]}`)
              .send({ title: 'Updated Title' });
            break;
          case 'delete':
            res = await request(app)
              .delete(endpoint.path)
              .set('Authorization', `Bearer ${authTokens[role.toLowerCase()]}`);
            break;
          default:
            throw new Error(`Unsupported method: ${endpoint.method}`);
        }

        /**
         * Verify appropriate access is granted or denied based on role
         */
        if (isAllowed) {
          expect(res.status).not.toEqual(401);
          expect(res.status).not.toEqual(403);
        } else {
          expect([401, 403]).toContain(res.status);
        }
      }
    }

    /**
     * Verify case managers can access client documents
     */
    const clientDocument = generateMockDocument({ ownerId: mockUsers[0].id });
    mockDocuments.push(clientDocument);

    const caseManagerRes = await request(app)
      .get(`/api/documents/${clientDocument.id}`)
      .set('Authorization', `Bearer ${authTokens.caseManager}`);
    expect(caseManagerRes.status).not.toEqual(403);

    /**
     * Verify providers can only access their own documents and assigned client documents
     */
    const providerDocument = generateMockDocument({ ownerId: mockUsers[1].id });
    mockDocuments.push(providerDocument);

    const providerRes = await request(app)
      .get(`/api/documents/${providerDocument.id}`)
      .set('Authorization', `Bearer ${authTokens.provider}`);
    expect(providerRes.status).not.toEqual(403);

    /**
     * Verify clients can only access their own documents
     */
    const clientRes = await request(app)
      .get(`/api/documents/${clientDocument.id}`)
      .set('Authorization', `Bearer ${authTokens.client}`);
    expect(clientRes.status).not.toEqual(403);

    /**
     * Verify admins can access all documents
     */
    const adminRes = await request(app)
      .get(`/api/documents/${clientDocument.id}`)
      .set('Authorization', `Bearer ${authTokens.admin}`);
    expect(adminRes.status).not.toEqual(403);
  });
});