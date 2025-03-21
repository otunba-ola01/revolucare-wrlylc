import supertest from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

import { 
  mockUsers, 
  mockClientsWithProfiles, 
  mockProvidersWithProfiles, 
  mockCaseManagersWithProfiles, 
  mockAdminsWithProfiles,
  generateMockUserWithProfile
} from '../../fixtures/users.fixture';
import { Roles } from '../../../src/constants/roles';
import { UserRepository } from '../../../src/repositories/user.repository';

// Global variables for the test suite
let app: express.Application;
let request: supertest.SuperTest<supertest.Test>;
const userRepository = new UserRepository();

/**
 * Setup test environment before all tests
 */
beforeAll(async () => {
  // Initialize Express app and configure middleware
  app = express();
  app.use(express.json());
  
  // Import and configure routes (mocked for tests)
  // This would be the real configuration in the actual implementation
  const mockRouteHandler = jest.fn();
  // Mock implementation of API routes for testing
  
  // Create supertest instance
  request = supertest(app);
  
  // Seed test database with mock users and profiles
  // In a real environment, this might use transactions and a test database
  jest.spyOn(userRepository, 'findById').mockImplementation(async (id) => {
    const user = mockUsers.find(u => u.id === id);
    return user || null;
  });
  
  jest.spyOn(userRepository, 'findWithProfile').mockImplementation(async (identifier) => {
    if ('id' in identifier) {
      const clientProfile = mockClientsWithProfiles.find(c => c.user.id === identifier.id);
      if (clientProfile) return clientProfile;
      
      const providerProfile = mockProvidersWithProfiles.find(p => p.user.id === identifier.id);
      if (providerProfile) return providerProfile;
      
      const caseManagerProfile = mockCaseManagersWithProfiles.find(cm => cm.user.id === identifier.id);
      if (caseManagerProfile) return caseManagerProfile;
      
      const adminProfile = mockAdminsWithProfiles.find(a => a.user.id === identifier.id);
      if (adminProfile) return adminProfile;
    }
    
    return null;
  });
});

/**
 * Clean up test environment after all tests
 */
afterAll(async () => {
  // Clean up test resources
  jest.restoreAllMocks();
});

/**
 * Helper function to create Authorization header with JWT token
 */
const createAuthHeader = (userId: string, role: Roles) => {
  const token = jwt.sign(
    { 
      userId, 
      role,
      permissions: [], // Would include role-specific permissions in real implementation
    }, 
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
  
  return { Authorization: `Bearer ${token}` };
};

/**
 * Tests for the endpoint that retrieves the authenticated user's profile
 */
describe('GET /api/users/profile', () => {
  it('should return the authenticated user profile for client role', async () => {
    const mockClient = mockClientsWithProfiles[0];
    const authHeader = createAuthHeader(mockClient.user.id, Roles.CLIENT);
    
    const response = await request
      .get('/api/users/profile')
      .set(authHeader);
      
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.id).toBe(mockClient.user.id);
    expect(response.body.data.user.role).toBe(Roles.CLIENT);
    expect(response.body.data.clientProfile).toBeTruthy();
    expect(response.body.data.providerProfile).toBeNull();
    expect(response.body.data.caseManagerProfile).toBeNull();
    expect(response.body.data.adminProfile).toBeNull();
  });
  
  it('should return the authenticated user profile for provider role', async () => {
    const mockProvider = mockProvidersWithProfiles[0];
    const authHeader = createAuthHeader(mockProvider.user.id, Roles.PROVIDER);
    
    const response = await request
      .get('/api/users/profile')
      .set(authHeader);
      
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.id).toBe(mockProvider.user.id);
    expect(response.body.data.user.role).toBe(Roles.PROVIDER);
    expect(response.body.data.clientProfile).toBeNull();
    expect(response.body.data.providerProfile).toBeTruthy();
    expect(response.body.data.caseManagerProfile).toBeNull();
    expect(response.body.data.adminProfile).toBeNull();
  });
  
  it('should return the authenticated user profile for case manager role', async () => {
    const mockCaseManager = mockCaseManagersWithProfiles[0];
    const authHeader = createAuthHeader(mockCaseManager.user.id, Roles.CASE_MANAGER);
    
    const response = await request
      .get('/api/users/profile')
      .set(authHeader);
      
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.id).toBe(mockCaseManager.user.id);
    expect(response.body.data.user.role).toBe(Roles.CASE_MANAGER);
    expect(response.body.data.clientProfile).toBeNull();
    expect(response.body.data.providerProfile).toBeNull();
    expect(response.body.data.caseManagerProfile).toBeTruthy();
    expect(response.body.data.adminProfile).toBeNull();
  });
  
  it('should return the authenticated user profile for administrator role', async () => {
    const mockAdmin = mockAdminsWithProfiles[0];
    const authHeader = createAuthHeader(mockAdmin.user.id, Roles.ADMINISTRATOR);
    
    const response = await request
      .get('/api/users/profile')
      .set(authHeader);
      
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.id).toBe(mockAdmin.user.id);
    expect(response.body.data.user.role).toBe(Roles.ADMINISTRATOR);
    expect(response.body.data.clientProfile).toBeNull();
    expect(response.body.data.providerProfile).toBeNull();
    expect(response.body.data.caseManagerProfile).toBeNull();
    expect(response.body.data.adminProfile).toBeTruthy();
  });
  
  it('should return 401 unauthorized when no token is provided', async () => {
    const response = await request.get('/api/users/profile');
      
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBeTruthy();
  });
  
  it('should return 401 unauthorized when an invalid token is provided', async () => {
    const response = await request
      .get('/api/users/profile')
      .set({ Authorization: 'Bearer invalid-token' });
      
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBeTruthy();
  });
});

/**
 * Tests for the endpoint that retrieves a user by ID (admin access)
 */
describe('GET /api/users/:id', () => {
  it('should allow an admin to retrieve any user by ID', async () => {
    const mockAdmin = mockAdminsWithProfiles[0];
    const mockClient = mockClientsWithProfiles[0];
    const authHeader = createAuthHeader(mockAdmin.user.id, Roles.ADMINISTRATOR);
    
    const response = await request
      .get(`/api/users/${mockClient.user.id}`)
      .set(authHeader);
      
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.id).toBe(mockClient.user.id);
    expect(response.body.data.user.role).toBe(Roles.CLIENT);
  });
  
  it('should return 403 forbidden when a non-admin tries to access', async () => {
    const mockClient = mockClientsWithProfiles[0];
    const mockProvider = mockProvidersWithProfiles[0];
    const authHeader = createAuthHeader(mockClient.user.id, Roles.CLIENT);
    
    const response = await request
      .get(`/api/users/${mockProvider.user.id}`)
      .set(authHeader);
      
    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBeTruthy();
    expect(response.body.error.code).toBe('FORBIDDEN');
  });
  
  it('should return 404 not found when user ID doesn\'t exist', async () => {
    const mockAdmin = mockAdminsWithProfiles[0];
    const authHeader = createAuthHeader(mockAdmin.user.id, Roles.ADMINISTRATOR);
    const nonExistentId = 'non-existent-id';
    
    const response = await request
      .get(`/api/users/${nonExistentId}`)
      .set(authHeader);
      
    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBeTruthy();
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});

/**
 * Tests for the endpoint that updates the authenticated user's profile
 */
describe('PUT /api/users/profile', () => {
  it('should update the authenticated client user profile', async () => {
    const mockClient = mockClientsWithProfiles[0];
    const authHeader = createAuthHeader(mockClient.user.id, Roles.CLIENT);
    
    const updateData = {
      firstName: 'Updated',
      lastName: 'Name',
      phone: '(555) 987-6543',
      address: {
        street: '456 New Street',
        city: 'New City',
        state: 'CA',
        zipCode: '94105',
        country: 'USA'
      }
    };
    
    const response = await request
      .put('/api/users/profile')
      .set(authHeader)
      .send(updateData);
      
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.firstName).toBe(updateData.firstName);
    expect(response.body.data.user.lastName).toBe(updateData.lastName);
    expect(response.body.data.clientProfile.phone).toBe(updateData.phone);
    expect(response.body.data.clientProfile.address.street).toBe(updateData.address.street);
  });
  
  it('should update the authenticated provider user profile', async () => {
    const mockProvider = mockProvidersWithProfiles[0];
    const authHeader = createAuthHeader(mockProvider.user.id, Roles.PROVIDER);
    
    const updateData = {
      firstName: 'Updated',
      lastName: 'Provider',
      roleSpecificData: {
        organizationName: 'Updated Organization',
        bio: 'Updated provider bio information',
        specializations: ['Updated Specialization 1', 'Updated Specialization 2']
      }
    };
    
    const response = await request
      .put('/api/users/profile')
      .set(authHeader)
      .send(updateData);
      
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.firstName).toBe(updateData.firstName);
    expect(response.body.data.user.lastName).toBe(updateData.lastName);
    expect(response.body.data.providerProfile.organizationName).toBe(updateData.roleSpecificData.organizationName);
    expect(response.body.data.providerProfile.bio).toBe(updateData.roleSpecificData.bio);
    expect(response.body.data.providerProfile.specializations).toEqual(updateData.roleSpecificData.specializations);
  });
  
  it('should return 400 bad request with invalid profile data', async () => {
    const mockClient = mockClientsWithProfiles[0];
    const authHeader = createAuthHeader(mockClient.user.id, Roles.CLIENT);
    
    const invalidData = {
      email: 'not-an-email',
      firstName: '',
      address: {
        // Missing required fields
        street: ''
      }
    };
    
    const response = await request
      .put('/api/users/profile')
      .set(authHeader)
      .send(invalidData);
      
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBeTruthy();
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
  
  it('should return 401 unauthorized when no token is provided', async () => {
    const updateData = {
      firstName: 'Updated',
      lastName: 'Name'
    };
    
    const response = await request
      .put('/api/users/profile')
      .send(updateData);
      
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBeTruthy();
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });
});

/**
 * Tests for the endpoint that updates a user by ID (admin access)
 */
describe('PUT /api/users/:id', () => {
  it('should allow an admin to update any user', async () => {
    const mockAdmin = mockAdminsWithProfiles[0];
    const mockClient = mockClientsWithProfiles[0];
    const authHeader = createAuthHeader(mockAdmin.user.id, Roles.ADMINISTRATOR);
    
    const updateData = {
      firstName: 'Admin',
      lastName: 'Updated',
      role: Roles.CLIENT, // Role should remain the same
      isVerified: true
    };
    
    const response = await request
      .put(`/api/users/${mockClient.user.id}`)
      .set(authHeader)
      .send(updateData);
      
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.firstName).toBe(updateData.firstName);
    expect(response.body.data.lastName).toBe(updateData.lastName);
    expect(response.body.data.role).toBe(updateData.role);
    expect(response.body.data.isVerified).toBe(updateData.isVerified);
  });
  
  it('should return 403 forbidden when non-admin tries to update', async () => {
    const mockClient = mockClientsWithProfiles[0];
    const mockProvider = mockProvidersWithProfiles[0];
    const authHeader = createAuthHeader(mockClient.user.id, Roles.CLIENT);
    
    const updateData = {
      firstName: 'Should',
      lastName: 'Fail'
    };
    
    const response = await request
      .put(`/api/users/${mockProvider.user.id}`)
      .set(authHeader)
      .send(updateData);
      
    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBeTruthy();
    expect(response.body.error.code).toBe('FORBIDDEN');
  });
  
  it('should return 404 not found when user ID doesn\'t exist', async () => {
    const mockAdmin = mockAdminsWithProfiles[0];
    const authHeader = createAuthHeader(mockAdmin.user.id, Roles.ADMINISTRATOR);
    const nonExistentId = 'non-existent-id';
    
    const updateData = {
      firstName: 'Not',
      lastName: 'Found'
    };
    
    const response = await request
      .put(`/api/users/${nonExistentId}`)
      .set(authHeader)
      .send(updateData);
      
    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBeTruthy();
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
  
  it('should return 400 bad request with invalid update data', async () => {
    const mockAdmin = mockAdminsWithProfiles[0];
    const mockClient = mockClientsWithProfiles[0];
    const authHeader = createAuthHeader(mockAdmin.user.id, Roles.ADMINISTRATOR);
    
    const invalidData = {
      email: 'not-an-email',
      firstName: '',
      role: 'invalid-role'
    };
    
    const response = await request
      .put(`/api/users/${mockClient.user.id}`)
      .set(authHeader)
      .send(invalidData);
      
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBeTruthy();
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});

/**
 * Tests for the endpoint that updates the authenticated user's preferences
 */
describe('PUT /api/users/preferences', () => {
  it('should update user preferences for a client', async () => {
    const mockClient = mockClientsWithProfiles[0];
    const authHeader = createAuthHeader(mockClient.user.id, Roles.CLIENT);
    
    const preferences = {
      theme: 'dark',
      notifications: {
        email: true,
        sms: false,
        inApp: true,
        types: {
          appointment: true,
          message: true,
          careplan: false
        }
      },
      accessibility: {
        fontSize: 'large',
        highContrast: true,
        reduceMotion: false,
        screenReader: false
      },
      language: 'en-US'
    };
    
    const response = await request
      .put('/api/users/preferences')
      .set(authHeader)
      .send(preferences);
      
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.theme).toBe(preferences.theme);
    expect(response.body.data.notifications).toEqual(preferences.notifications);
    expect(response.body.data.accessibility).toEqual(preferences.accessibility);
    expect(response.body.data.language).toBe(preferences.language);
  });
  
  it('should update user preferences for a provider', async () => {
    const mockProvider = mockProvidersWithProfiles[0];
    const authHeader = createAuthHeader(mockProvider.user.id, Roles.PROVIDER);
    
    const preferences = {
      theme: 'light',
      notifications: {
        email: true,
        sms: true,
        inApp: true
      },
      language: 'en-US'
    };
    
    const response = await request
      .put('/api/users/preferences')
      .set(authHeader)
      .send(preferences);
      
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.theme).toBe(preferences.theme);
    expect(response.body.data.notifications).toEqual(preferences.notifications);
    expect(response.body.data.language).toBe(preferences.language);
  });
  
  it('should return 400 bad request with invalid preferences data', async () => {
    const mockClient = mockClientsWithProfiles[0];
    const authHeader = createAuthHeader(mockClient.user.id, Roles.CLIENT);
    
    const invalidData = {
      theme: 'invalid-theme',
      notifications: {
        email: 'not-a-boolean'
      },
      accessibility: {
        fontSize: 'invalid-size'
      }
    };
    
    const response = await request
      .put('/api/users/preferences')
      .set(authHeader)
      .send(invalidData);
      
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBeTruthy();
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
  
  it('should return 401 unauthorized when no token is provided', async () => {
    const preferences = {
      theme: 'dark',
      language: 'en-US'
    };
    
    const response = await request
      .put('/api/users/preferences')
      .send(preferences);
      
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBeTruthy();
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });
});

/**
 * Tests for the endpoint that searches for users with filtering and pagination
 */
describe('GET /api/users/search', () => {
  it('should search users with query filter', async () => {
    const mockAdmin = mockAdminsWithProfiles[0];
    const authHeader = createAuthHeader(mockAdmin.user.id, Roles.ADMINISTRATOR);
    
    const response = await request
      .get('/api/users/search')
      .query({ query: 'John' })
      .set(authHeader);
      
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.users).toBeInstanceOf(Array);
    expect(response.body.data.total).toBeGreaterThanOrEqual(0);
    // At least one user should match the search term
    expect(response.body.data.users.some(u => 
      u.firstName.includes('John') || u.lastName.includes('John')
    )).toBe(true);
  });
  
  it('should search users with role filter', async () => {
    const mockAdmin = mockAdminsWithProfiles[0];
    const authHeader = createAuthHeader(mockAdmin.user.id, Roles.ADMINISTRATOR);
    
    const response = await request
      .get('/api/users/search')
      .query({ role: Roles.CLIENT })
      .set(authHeader);
      
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.users).toBeInstanceOf(Array);
    expect(response.body.data.users.every(u => u.role === Roles.CLIENT)).toBe(true);
  });
  
  it('should search users with verification status filter', async () => {
    const mockAdmin = mockAdminsWithProfiles[0];
    const authHeader = createAuthHeader(mockAdmin.user.id, Roles.ADMINISTRATOR);
    
    const response = await request
      .get('/api/users/search')
      .query({ isVerified: 'true' })
      .set(authHeader);
      
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.users).toBeInstanceOf(Array);
    expect(response.body.data.users.every(u => u.isVerified === true)).toBe(true);
  });
  
  it('should search users with pagination', async () => {
    const mockAdmin = mockAdminsWithProfiles[0];
    const authHeader = createAuthHeader(mockAdmin.user.id, Roles.ADMINISTRATOR);
    
    const response = await request
      .get('/api/users/search')
      .query({ page: 1, limit: 2 })
      .set(authHeader);
      
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.users).toBeInstanceOf(Array);
    expect(response.body.data.users.length).toBeLessThanOrEqual(2);
    expect(response.body.data.page).toBe(1);
    expect(response.body.data.limit).toBe(2);
    expect(response.body.data.totalPages).toBeGreaterThanOrEqual(1);
  });
  
  it('should search users with sorting', async () => {
    const mockAdmin = mockAdminsWithProfiles[0];
    const authHeader = createAuthHeader(mockAdmin.user.id, Roles.ADMINISTRATOR);
    
    const response = await request
      .get('/api/users/search')
      .query({ sortBy: 'firstName', sortOrder: 'asc' })
      .set(authHeader);
      
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.users).toBeInstanceOf(Array);
    
    // Verify sorting order
    const userNames = response.body.data.users.map(u => u.firstName);
    const sortedNames = [...userNames].sort();
    expect(userNames).toEqual(sortedNames);
  });
  
  it('should return 403 forbidden when a non-admin attempts a global search', async () => {
    const mockClient = mockClientsWithProfiles[0];
    const authHeader = createAuthHeader(mockClient.user.id, Roles.CLIENT);
    
    const response = await request
      .get('/api/users/search')
      .set(authHeader);
      
    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBeTruthy();
    expect(response.body.error.code).toBe('FORBIDDEN');
  });
  
  it('should allow case managers to search their assigned clients', async () => {
    const mockCaseManager = mockCaseManagersWithProfiles[0];
    const authHeader = createAuthHeader(mockCaseManager.user.id, Roles.CASE_MANAGER);
    
    const response = await request
      .get('/api/users/search')
      .query({ role: Roles.CLIENT })
      .set(authHeader);
      
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.users).toBeInstanceOf(Array);
    expect(response.body.data.users.every(u => u.role === Roles.CLIENT)).toBe(true);
  });
});

/**
 * Tests for the endpoint that retrieves users by role
 */
describe('GET /api/users/role/:role', () => {
  it('should retrieve users by role', async () => {
    const mockAdmin = mockAdminsWithProfiles[0];
    const authHeader = createAuthHeader(mockAdmin.user.id, Roles.ADMINISTRATOR);
    
    const response = await request
      .get(`/api/users/role/${Roles.CLIENT}`)
      .set(authHeader);
      
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.users).toBeInstanceOf(Array);
    expect(response.body.data.users.every(u => u.role === Roles.CLIENT)).toBe(true);
  });
  
  it('should retrieve users by role with pagination', async () => {
    const mockAdmin = mockAdminsWithProfiles[0];
    const authHeader = createAuthHeader(mockAdmin.user.id, Roles.ADMINISTRATOR);
    
    const response = await request
      .get(`/api/users/role/${Roles.PROVIDER}`)
      .query({ page: 1, limit: 2 })
      .set(authHeader);
      
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.users).toBeInstanceOf(Array);
    expect(response.body.data.users.every(u => u.role === Roles.PROVIDER)).toBe(true);
    expect(response.body.data.users.length).toBeLessThanOrEqual(2);
    expect(response.body.data.page).toBe(1);
    expect(response.body.data.limit).toBe(2);
  });
  
  it('should return 403 forbidden when a non-admin or non-case-manager tries to access', async () => {
    const mockClient = mockClientsWithProfiles[0];
    const authHeader = createAuthHeader(mockClient.user.id, Roles.CLIENT);
    
    const response = await request
      .get(`/api/users/role/${Roles.PROVIDER}`)
      .set(authHeader);
      
    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBeTruthy();
    expect(response.body.error.code).toBe('FORBIDDEN');
  });
  
  it('should return 400 bad request for invalid role parameter', async () => {
    const mockAdmin = mockAdminsWithProfiles[0];
    const authHeader = createAuthHeader(mockAdmin.user.id, Roles.ADMINISTRATOR);
    
    const response = await request
      .get('/api/users/role/invalid-role')
      .set(authHeader);
      
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBeTruthy();
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
  
  it('should allow case managers to retrieve client users', async () => {
    const mockCaseManager = mockCaseManagersWithProfiles[0];
    const authHeader = createAuthHeader(mockCaseManager.user.id, Roles.CASE_MANAGER);
    
    const response = await request
      .get(`/api/users/role/${Roles.CLIENT}`)
      .set(authHeader);
      
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.users).toBeInstanceOf(Array);
    expect(response.body.data.users.every(u => u.role === Roles.CLIENT)).toBe(true);
  });
});

/**
 * Tests for the endpoint that deactivates a user account (admin access)
 */
describe('DELETE /api/users/:id', () => {
  it('should allow an admin to deactivate a user', async () => {
    const mockAdmin = mockAdminsWithProfiles[0];
    const mockClient = mockClientsWithProfiles[0];
    const authHeader = createAuthHeader(mockAdmin.user.id, Roles.ADMINISTRATOR);
    
    const deactivateData = {
      reason: 'Account inactive per user request'
    };
    
    const response = await request
      .delete(`/api/users/${mockClient.user.id}`)
      .set(authHeader)
      .send(deactivateData);
      
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.deactivated).toBe(true);
    expect(response.body.data.userId).toBe(mockClient.user.id);
  });
  
  it('should return 403 forbidden when non-admin tries to deactivate', async () => {
    const mockClient = mockClientsWithProfiles[0];
    const mockProvider = mockProvidersWithProfiles[0];
    const authHeader = createAuthHeader(mockClient.user.id, Roles.CLIENT);
    
    const deactivateData = {
      reason: 'Should not work'
    };
    
    const response = await request
      .delete(`/api/users/${mockProvider.user.id}`)
      .set(authHeader)
      .send(deactivateData);
      
    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBeTruthy();
    expect(response.body.error.code).toBe('FORBIDDEN');
  });
  
  it('should return 404 not found when user ID doesn\'t exist', async () => {
    const mockAdmin = mockAdminsWithProfiles[0];
    const authHeader = createAuthHeader(mockAdmin.user.id, Roles.ADMINISTRATOR);
    const nonExistentId = 'non-existent-id';
    
    const deactivateData = {
      reason: 'Testing non-existent user'
    };
    
    const response = await request
      .delete(`/api/users/${nonExistentId}`)
      .set(authHeader)
      .send(deactivateData);
      
    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBeTruthy();
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
  
  it('should return 400 bad request when deactivation reason is missing', async () => {
    const mockAdmin = mockAdminsWithProfiles[0];
    const mockClient = mockClientsWithProfiles[0];
    const authHeader = createAuthHeader(mockAdmin.user.id, Roles.ADMINISTRATOR);
    
    // Missing required reason
    const deactivateData = {};
    
    const response = await request
      .delete(`/api/users/${mockClient.user.id}`)
      .set(authHeader)
      .send(deactivateData);
      
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBeTruthy();
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});

/**
 * Tests for the endpoint that reactivates a previously deactivated user account (admin access)
 */
describe('POST /api/users/:id/reactivate', () => {
  it('should allow an admin to reactivate a user', async () => {
    const mockAdmin = mockAdminsWithProfiles[0];
    const mockClient = mockClientsWithProfiles[0];
    const authHeader = createAuthHeader(mockAdmin.user.id, Roles.ADMINISTRATOR);
    
    const response = await request
      .post(`/api/users/${mockClient.user.id}/reactivate`)
      .set(authHeader);
      
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.reactivated).toBe(true);
    expect(response.body.data.userId).toBe(mockClient.user.id);
  });
  
  it('should return 403 forbidden when non-admin tries to reactivate', async () => {
    const mockClient = mockClientsWithProfiles[0];
    const mockProvider = mockProvidersWithProfiles[0];
    const authHeader = createAuthHeader(mockClient.user.id, Roles.CLIENT);
    
    const response = await request
      .post(`/api/users/${mockProvider.user.id}/reactivate`)
      .set(authHeader);
      
    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBeTruthy();
    expect(response.body.error.code).toBe('FORBIDDEN');
  });
  
  it('should return 404 not found when user ID doesn\'t exist', async () => {
    const mockAdmin = mockAdminsWithProfiles[0];
    const authHeader = createAuthHeader(mockAdmin.user.id, Roles.ADMINISTRATOR);
    const nonExistentId = 'non-existent-id';
    
    const response = await request
      .post(`/api/users/${nonExistentId}/reactivate`)
      .set(authHeader);
      
    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBeTruthy();
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
  
  it('should return error when trying to reactivate an already active user', async () => {
    const mockAdmin = mockAdminsWithProfiles[0];
    // Assume this user is already active
    const mockActiveClient = mockClientsWithProfiles[1];
    const authHeader = createAuthHeader(mockAdmin.user.id, Roles.ADMINISTRATOR);
    
    const response = await request
      .post(`/api/users/${mockActiveClient.user.id}/reactivate`)
      .set(authHeader);
      
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBeTruthy();
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.message).toContain('already active');
  });
});