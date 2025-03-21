import { Request, Response } from 'express'; // express@^4.18.2
import {
  getUserProfile,
  getUserById,
  updateUserProfile,
  updateUser,
  updateUserPreferences,
  deleteUser,
  searchUsers,
  getUsersByRole,
  reactivateUser,
} from '../../../src/api/controllers/users.controller';
import { createUserService, UserService } from '../../../src/services/users.service';
import { Roles } from '../../../src/constants/roles';
import { UserWithProfile, UserPreferences } from '../../../src/types/user.types';
import { errorFactory } from '../../../src/utils/error-handler';

describe('Users Controller', () => {
  const mockUserProfile: UserWithProfile = {
    user: {
      id: 'user123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: Roles.CLIENT,
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    clientProfile: {
      id: 'profile123',
      userId: 'user123',
      dateOfBirth: new Date('1990-01-01'),
      gender: 'female',
      address: { street: '123 Main St', city: 'Springfield', state: 'IL', zipCode: '62704', country: 'USA' },
      phone: '555-123-4567',
      emergencyContact: null,
      medicalInformation: null,
      insurance: null,
      preferences: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    providerProfile: null,
    caseManagerProfile: null,
    adminProfile: null,
  };

  const mockUserPreferences: UserPreferences = {
    theme: 'light',
    notifications: { email: true, sms: false, inApp: true, types: {} },
    accessibility: { fontSize: 'medium', highContrast: false, reduceMotion: false, screenReader: false },
    language: 'en',
  };

  const mockUserSearchResult = {
    users: [
      { id: 'user123', email: 'test@example.com', firstName: 'Test', lastName: 'User', role: Roles.CLIENT, isVerified: true, createdAt: new Date(), updatedAt: new Date() },
      { id: 'user456', email: 'another@example.com', firstName: 'Another', lastName: 'User', role: Roles.CLIENT, isVerified: true, createdAt: new Date(), updatedAt: new Date() }
    ],
    total: 2,
    page: 1,
    limit: 10,
    totalPages: 1,
  };

  const createMockUserService = (): { service: UserService; getUserProfile: jest.Mock; updateUserProfile: jest.Mock; getUserPreferences: jest.Mock; updateUserPreferences: jest.Mock; searchUsers: jest.Mock; getUsersByRole: jest.Mock; deactivateUser: jest.Mock; reactivateUser: jest.Mock } => {
    const service = {
      getUserProfile: jest.fn().mockResolvedValue(mockUserProfile),
      updateUserProfile: jest.fn().mockResolvedValue(mockUserProfile),
      getUserPreferences: jest.fn().mockResolvedValue(mockUserPreferences),
      updateUserPreferences: jest.fn().mockResolvedValue(mockUserPreferences),
      searchUsers: jest.fn().mockResolvedValue(mockUserSearchResult),
      getUsersByRole: jest.fn().mockResolvedValue(mockUserSearchResult),
      deactivateUser: jest.fn().mockResolvedValue(mockUserProfile.user),
      reactivateUser: jest.fn().mockResolvedValue(mockUserProfile.user),
    } as unknown as UserService;

    return {
      service,
      getUserProfile: service.getUserProfile,
      updateUserProfile: service.updateUserProfile,
      getUserPreferences: service.getUserPreferences,
      updateUserPreferences: service.updateUserPreferences,
      searchUsers: service.searchUsers,
      getUsersByRole: service.getUsersByRole,
      deactivateUser: service.deactivateUser,
      reactivateUser: service.reactivateUser,
    };
  };

  const createMockRequest = (props: any): Request => {
    const req = {} as Request;
    req.user = {
      userId: 'user123',
      email: 'test@example.com',
      role: Roles.CLIENT,
      isVerified: true,
      permissions: []
    };
    req.params = props.params;
    req.query = props.query;
    req.body = props.body;
    return req;
  };

  const createMockResponse = (): Response => {
    const res = {} as Response;
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res;
  };

  describe('getUserProfile', () => {
    it('Should return user profile data for authenticated user', async () => {
      const { service, getUserProfile } = createMockUserService();
      const req = createMockRequest({});
      const res = createMockResponse();
      const next = jest.fn();

      await getUserProfile(req as any, res, next);

      expect(getUserProfile).toHaveBeenCalledWith('user123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'User profile retrieved successfully',
        data: {
          user: {
            id: 'user123',
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
            role: 'client',
            isVerified: true,
            createdAt: mockUserProfile.user.createdAt,
          },
          profile: mockUserProfile.clientProfile,
        },
      });
    });

    it('Should handle errors and pass to next middleware', async () => {
      const { service, getUserProfile } = createMockUserService();
      (service.getUserProfile as jest.Mock).mockRejectedValue(new Error('Test error'));
      const req = createMockRequest({});
      const res = createMockResponse();
      const next = jest.fn();

      await getUserProfile(req as any, res, next);

      expect(next).toHaveBeenCalledWith(new Error('Test error'));
    });
  });

  describe('getUserById', () => {
    it('Should return user profile data for specified user ID', async () => {
      const { service, getUserProfile } = createMockUserService();
      const req = createMockRequest({ params: { id: 'user456' } });
      const res = createMockResponse();
      const next = jest.fn();

      await getUserById(req as any, res, next);

      expect(getUserProfile).toHaveBeenCalledWith('user456');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'User profile retrieved successfully',
        data: {
          user: {
            id: 'user123',
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
            role: 'client',
            isVerified: true,
            createdAt: mockUserProfile.user.createdAt,
          },
          profile: mockUserProfile.clientProfile,
        },
      });
    });
  });

  describe('updateUserProfile', () => {
    it('Should update and return user profile data', async () => {
      const { service, updateUserProfile } = createMockUserService();
      const req = createMockRequest({ body: { firstName: 'Updated', lastName: 'User' } });
      const res = createMockResponse();
      const next = jest.fn();

      await updateUserProfile(req as any, res, next);

      expect(updateUserProfile).toHaveBeenCalledWith('user123', { firstName: 'Updated', lastName: 'User' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'User profile updated successfully',
        data: {
          user: {
            id: 'user123',
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
            role: 'client',
            isVerified: true,
            createdAt: mockUserProfile.user.createdAt,
          },
          profile: mockUserProfile.clientProfile,
        },
      });
    });
  });

  describe('updateUser', () => {
    it('Should update and return user data for specified user ID', async () => {
      const { service, updateUserProfile } = createMockUserService();
      const req = createMockRequest({ params: { id: 'user456' }, body: { firstName: 'Updated', lastName: 'User' } });
      const res = createMockResponse();
      const next = jest.fn();

      await updateUser(req as any, res, next);

      expect(updateUserProfile).toHaveBeenCalledWith('user456', { firstName: 'Updated', lastName: 'User' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'User updated successfully',
        data: {
          user: {
            id: 'user123',
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
            role: 'client',
            isVerified: true,
            createdAt: mockUserProfile.user.createdAt,
          },
          profile: mockUserProfile.clientProfile,
        },
      });
    });
  });

  describe('updateUserPreferences', () => {
    it('Should update and return user preferences', async () => {
      const { service, updateUserPreferences } = createMockUserService();
      const req = createMockRequest({ body: { theme: 'dark' } });
      const res = createMockResponse();
      const next = jest.fn();

      await updateUserPreferences(req as any, res, next);

      expect(updateUserPreferences).toHaveBeenCalledWith('user123', { theme: 'dark' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'User preferences updated successfully',
        data: mockUserPreferences,
      });
    });
  });

  describe('deleteUser', () => {
    it('Should deactivate a user account', async () => {
      const { service, deactivateUser } = createMockUserService();
      const req = createMockRequest({ params: { id: 'user456' }, body: { reason: 'Test reason' } });
      const res = createMockResponse();
      const next = jest.fn();

      await deleteUser(req as any, res, next);

      expect(deactivateUser).toHaveBeenCalledWith('user456', 'Test reason');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'User deactivated successfully',
        data: null,
      });
    });
  });

  describe('searchUsers', () => {
    it('Should return paginated user search results', async () => {
      const { service, searchUsers } = createMockUserService();
      const req = createMockRequest({ query: { query: 'test', page: '1', limit: '10' } });
      const res = createMockResponse();
      const next = jest.fn();

      await searchUsers(req as any, res, next);

      expect(searchUsers).toHaveBeenCalledWith({
        query: 'test',
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Users retrieved successfully',
        data: mockUserSearchResult.users,
        pagination: {
          page: 1,
          limit: 10,
          totalItems: 2,
          totalPages: 1,
        },
      });
    });
  });

  describe('getUsersByRole', () => {
    it('Should return users filtered by role', async () => {
      const { service, getUsersByRole } = createMockUserService();
      const req = createMockRequest({ params: { role: 'client' }, query: { page: '1', limit: '10' } });
      const res = createMockResponse();
      const next = jest.fn();

      await getUsersByRole(req as any, res, next);

      expect(getUsersByRole).toHaveBeenCalledWith('client', 1, 10);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Users retrieved successfully',
        data: mockUserSearchResult.users,
        pagination: {
          page: 1,
          limit: 10,
          totalItems: 2,
          totalPages: 1,
        },
      });
    });
  });

  describe('reactivateUser', () => {
    it('Should reactivate a previously deactivated user', async () => {
      const { service, reactivateUser } = createMockUserService();
      const req = createMockRequest({ params: { id: 'user456' } });
      const res = createMockResponse();
      const next = jest.fn();

      await reactivateUser(req as any, res, next);

      expect(reactivateUser).toHaveBeenCalledWith('user456');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'User reactivated successfully',
        data: null,
      });
    });
  });
});