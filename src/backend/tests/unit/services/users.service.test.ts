import { UserService } from '../../../src/services/users.service';
import { UserRepository } from '../../../src/repositories/user.repository';
import { NotificationService } from '../../../src/services/notifications.service';
import { Roles } from '../../../src/constants/roles';
import { errorFactory } from '../../../src/utils/error-handler';
import * as userCache from '../../../src/cache/user.cache';
import { UserWithProfile, UserPreferences, UserSearchResult } from '../../../src/types/user.types';
import { ProfileUpdateRequest, PreferencesUpdateRequest, UserSearchParams } from '../../../src/interfaces/user.interface';
import { mockUserWithProfile, mockUserPreferences, mockUserSearchResult } from '../../fixtures/users.fixture';
import jest from 'jest'; // jest@^29.0.0

describe('UserService', () => {
  let userRepository: UserRepository;
  let notificationService: NotificationService;
  let userService: UserService;

  beforeEach(() => {
    userRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findWithProfile: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      search: jest.fn(),
      findByRole: jest.fn(),
    } as unknown as UserRepository;

    notificationService = {
      createNotification: jest.fn(),
      getNotifications: jest.fn(),
      getNotificationById: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      deleteNotification: jest.fn(),
      getNotificationStats: jest.fn(),
      getNotificationPreferences: jest.fn(),
      updateNotificationPreferences: jest.fn(),
      sendNotification: jest.fn(),
      on: jest.fn(),
      once: jest.fn(),
      off: jest.fn(),
    } as unknown as NotificationService;

    userService = new UserService(userRepository, notificationService);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getUserProfile', () => {
    it('should return cached user profile when available', async () => {
      const userId = 'test-user-id';
      const cachedProfile = mockUserWithProfile;
      jest.spyOn(userCache, 'getCachedUserWithProfile').mockResolvedValue(cachedProfile);

      const profile = await userService.getUserProfile(userId);

      expect(userCache.getCachedUserWithProfile).toHaveBeenCalledWith(userId);
      expect(userRepository.findWithProfile).not.toHaveBeenCalled();
      expect(profile).toEqual(cachedProfile);
    });

    it('should fetch and cache user profile when not in cache', async () => {
      const userId = 'test-user-id';
      const fetchedProfile = mockUserWithProfile;
      jest.spyOn(userCache, 'getCachedUserWithProfile').mockResolvedValue(null);
      (userRepository.findWithProfile as jest.Mock).mockResolvedValue(fetchedProfile);
      jest.spyOn(userCache, 'cacheUserWithProfile').mockResolvedValue();

      const profile = await userService.getUserProfile(userId);

      expect(userCache.getCachedUserWithProfile).toHaveBeenCalledWith(userId);
      expect(userRepository.findWithProfile).toHaveBeenCalledWith({ id: userId });
      expect(userCache.cacheUserWithProfile).toHaveBeenCalledWith(fetchedProfile);
      expect(profile).toEqual(fetchedProfile);
    });

    it('should throw NotFoundError when user does not exist', async () => {
      const userId = 'non-existent-user-id';
      jest.spyOn(userCache, 'getCachedUserWithProfile').mockResolvedValue(null);
      (userRepository.findWithProfile as jest.Mock).mockResolvedValue(null);

      await expect(userService.getUserProfile(userId)).rejects.toThrow(errorFactory.createNotFoundError('User not found', { userId }));
    });
  });

  describe('updateUserProfile', () => {
    it('should update user profile successfully', async () => {
      const userId = 'test-user-id';
      const initialProfile = mockUserWithProfile;
      const updateData: ProfileUpdateRequest = { firstName: 'Updated' };
      const updatedProfile = { ...mockUserWithProfile, user: { ...mockUserWithProfile.user, firstName: 'Updated' } };
      (userRepository.findWithProfile as jest.Mock).mockResolvedValue(initialProfile);
      (userRepository.update as jest.Mock).mockResolvedValue(updatedProfile.user);
      jest.spyOn(userCache, 'invalidateUserCache').mockResolvedValue();
      jest.spyOn(userCache, 'invalidateUserSearchCache').mockResolvedValue();
      (notificationService.createNotification as jest.Mock).mockResolvedValue({});

      const profile = await userService.updateUserProfile(userId, updateData);

      expect(userRepository.findWithProfile).toHaveBeenCalledWith({ id: userId });
      expect(userRepository.update).toHaveBeenCalledWith(userId, { firstName: 'Updated' });
      expect(userCache.invalidateUserCache).toHaveBeenCalledWith(userId);
      expect(userCache.invalidateUserSearchCache).toHaveBeenCalled();
      expect(notificationService.createNotification).toHaveBeenCalled();
      expect(profile.user.firstName).toEqual('Updated');
    });

    it('should throw NotFoundError when user does not exist', async () => {
      const userId = 'non-existent-user-id';
      const updateData: ProfileUpdateRequest = { firstName: 'Updated' };
      (userRepository.findWithProfile as jest.Mock).mockResolvedValue(null);

      await expect(userService.updateUserProfile(userId, updateData)).rejects.toThrow(errorFactory.createNotFoundError('User not found', { userId }));
    });

    it("should throw ForbiddenError when user tries to update another user's profile without admin role", async () => {
      const userId = 'test-user-id';
      const otherUserId = 'other-user-id';
      const initialProfile = mockUserWithProfile;
      (userRepository.findWithProfile as jest.Mock).mockResolvedValue(initialProfile);
      const updateData: ProfileUpdateRequest = { firstName: 'Updated' };

      await expect(userService.updateUserProfile(otherUserId, updateData)).rejects.toThrow(errorFactory.createForbiddenError('You do not have permission to update this profile'));
    });

    it("should allow admin to update another user's profile", async () => {
      const adminProfile = { ...mockUserWithProfile, user: { ...mockUserWithProfile.user, role: Roles.ADMINISTRATOR } };
      const userId = 'admin-user-id';
      const otherUserId = 'other-user-id';
      const updateData: ProfileUpdateRequest = { firstName: 'Updated' };
      const updatedProfile = { ...mockUserWithProfile, user: { ...mockUserWithProfile.user, firstName: 'Updated' } };
      (userRepository.findWithProfile as jest.Mock).mockResolvedValue(adminProfile);
      (userRepository.update as jest.Mock).mockResolvedValue(updatedProfile.user);
      jest.spyOn(userCache, 'invalidateUserCache').mockResolvedValue();
      jest.spyOn(userCache, 'invalidateUserSearchCache').mockResolvedValue();

      const profile = await userService.updateUserProfile(otherUserId, updateData);

      expect(userRepository.update).toHaveBeenCalledWith(otherUserId, { firstName: 'Updated' });
      expect(profile.user.firstName).toEqual('Updated');
    });
  });

  describe('getUserPreferences', () => {
    it('should return cached user preferences when available', async () => {
      const userId = 'test-user-id';
      const cachedPreferences = mockUserPreferences;
      jest.spyOn(userCache, 'getCachedUserPreferences').mockResolvedValue(cachedPreferences);

      const preferences = await userService.getUserPreferences(userId);

      expect(userCache.getCachedUserPreferences).toHaveBeenCalledWith(userId);
      expect(userRepository.findWithProfile).not.toHaveBeenCalled();
      expect(preferences).toEqual(cachedPreferences);
    });

    it('should fetch and cache user preferences when not in cache', async () => {
      const userId = 'test-user-id';
      const userWithProfile = mockUserWithProfile;
      jest.spyOn(userCache, 'getCachedUserPreferences').mockResolvedValue(null);
      (userRepository.findWithProfile as jest.Mock).mockResolvedValue(userWithProfile);
      jest.spyOn(userCache, 'cacheUserPreferences').mockResolvedValue();

      const preferences = await userService.getUserPreferences(userId);

      expect(userCache.getCachedUserPreferences).toHaveBeenCalledWith(userId);
      expect(userRepository.findWithProfile).toHaveBeenCalledWith({ id: userId });
      expect(userCache.cacheUserPreferences).toHaveBeenCalledWith(userWithProfile.clientProfile.preferences, userId);
      expect(preferences).toEqual(userWithProfile.clientProfile.preferences);
    });

    it('should return default preferences when user has no preferences set', async () => {
      const userId = 'test-user-id';
      const userWithProfile = { ...mockUserWithProfile, clientProfile: { ...mockUserWithProfile.clientProfile, preferences: null } };
      jest.spyOn(userCache, 'getCachedUserPreferences').mockResolvedValue(null);
      (userRepository.findWithProfile as jest.Mock).mockResolvedValue(userWithProfile);
      jest.spyOn(userCache, 'cacheUserPreferences').mockResolvedValue();

      const preferences = await userService.getUserPreferences(userId);

      expect(userCache.getCachedUserPreferences).toHaveBeenCalledWith(userId);
      expect(userRepository.findWithProfile).toHaveBeenCalledWith({ id: userId });
      expect(userCache.cacheUserPreferences).toHaveBeenCalled();
      expect(preferences).toBeDefined();
    });

    it('should throw NotFoundError when user does not exist', async () => {
      const userId = 'non-existent-user-id';
      jest.spyOn(userCache, 'getCachedUserPreferences').mockResolvedValue(null);
      (userRepository.findWithProfile as jest.Mock).mockResolvedValue(null);

      await expect(userService.getUserPreferences(userId)).rejects.toThrow(errorFactory.createNotFoundError('User not found', { userId }));
    });
  });

  describe('updateUserPreferences', () => {
    it('should update user preferences successfully', async () => {
      const userId = 'test-user-id';
      const currentPreferences = mockUserPreferences;
      const updateData: PreferencesUpdateRequest = { theme: 'dark' };
      const updatedPreferences = { ...mockUserPreferences, theme: 'dark' };
      jest.spyOn(userService, 'getUserPreferences').mockResolvedValue(currentPreferences);
      (userRepository.findWithProfile as jest.Mock).mockResolvedValue(mockUserWithProfile);
      (userRepository.update as jest.Mock).mockResolvedValue(mockUserWithProfile.user);
      jest.spyOn(userCache, 'invalidateUserCache').mockResolvedValue();
      jest.spyOn(userCache, 'cacheUserPreferences').mockResolvedValue();

      const preferences = await userService.updateUserPreferences(userId, updateData);

      expect(userService.getUserPreferences).toHaveBeenCalledWith(userId);
      expect(userRepository.update).toHaveBeenCalled();
      expect(userCache.invalidateUserCache).toHaveBeenCalledWith(userId);
      expect(userCache.cacheUserPreferences).toHaveBeenCalledWith(updatedPreferences, userId);
      expect(preferences.theme).toEqual('dark');
    });

    it("should throw ForbiddenError when user tries to update another user's preferences without admin role", async () => {
      const userId = 'test-user-id';
      const otherUserId = 'other-user-id';
      (userRepository.findWithProfile as jest.Mock).mockResolvedValue(mockUserWithProfile);
      const updateData: PreferencesUpdateRequest = { theme: 'dark' };

      await expect(userService.updateUserPreferences(otherUserId, updateData)).rejects.toThrow(errorFactory.createForbiddenError('You do not have permission to update this profile'));
    });

    it("should allow admin to update another user's preferences", async () => {
      const adminProfile = { ...mockUserWithProfile, user: { ...mockUserWithProfile.user, role: Roles.ADMINISTRATOR } };
      const userId = 'admin-user-id';
      const otherUserId = 'other-user-id';
      const currentPreferences = mockUserPreferences;
      const updateData: PreferencesUpdateRequest = { theme: 'dark' };
      const updatedPreferences = { ...mockUserPreferences, theme: 'dark' };
      (userRepository.findWithProfile as jest.Mock).mockResolvedValue(adminProfile);
      jest.spyOn(userService, 'getUserPreferences').mockResolvedValue(currentPreferences);
      (userRepository.update as jest.Mock).mockResolvedValue(mockUserWithProfile.user);
      jest.spyOn(userCache, 'invalidateUserCache').mockResolvedValue();
      jest.spyOn(userCache, 'cacheUserPreferences').mockResolvedValue();

      const preferences = await userService.updateUserPreferences(otherUserId, updateData);

      expect(userRepository.update).toHaveBeenCalled();
      expect(userCache.invalidateUserCache).toHaveBeenCalledWith(otherUserId);
      expect(userCache.cacheUserPreferences).toHaveBeenCalledWith(updatedPreferences, otherUserId);
      expect(preferences.theme).toEqual('dark');
    });
  });

  describe('searchUsers', () => {
    it('should return cached search results when available', async () => {
      const searchParams: UserSearchParams = { query: 'test', page: 1, limit: 10, sortBy: 'createdAt', sortOrder: 'desc' };
      const cachedResults = mockUserSearchResult;
      jest.spyOn(userCache, 'getCachedUserSearchResults').mockResolvedValue(cachedResults);

      const results = await userService.searchUsers(searchParams);

      expect(userCache.getCachedUserSearchResults).toHaveBeenCalledWith(searchParams);
      expect(userRepository.search).not.toHaveBeenCalled();
      expect(results).toEqual(cachedResults);
    });

    it('should fetch and cache search results when not in cache', async () => {
      const searchParams: UserSearchParams = { query: 'test', page: 1, limit: 10, sortBy: 'createdAt', sortOrder: 'desc' };
      const fetchedResults = mockUserSearchResult;
      jest.spyOn(userCache, 'getCachedUserSearchResults').mockResolvedValue(null);
      (userRepository.search as jest.Mock).mockResolvedValue(fetchedResults);
      jest.spyOn(userCache, 'cacheUserSearchResults').mockResolvedValue();

      const results = await userService.searchUsers(searchParams);

      expect(userCache.getCachedUserSearchResults).toHaveBeenCalledWith(searchParams);
      expect(userRepository.search).toHaveBeenCalledWith(searchParams);
      expect(userCache.cacheUserSearchResults).toHaveBeenCalledWith(searchParams, fetchedResults);
      expect(results).toEqual(fetchedResults);
    });

    it('should use default pagination values when not provided', async () => {
      const searchParams: UserSearchParams = { query: 'test', sortBy: 'createdAt', sortOrder: 'desc' } as any;
      const fetchedResults = mockUserSearchResult;
      jest.spyOn(userCache, 'getCachedUserSearchResults').mockResolvedValue(null);
      (userRepository.search as jest.Mock).mockResolvedValue(fetchedResults);
      jest.spyOn(userCache, 'cacheUserSearchResults').mockResolvedValue();

      await userService.searchUsers(searchParams);

      expect(userRepository.search).toHaveBeenCalledWith(expect.objectContaining({ page: 1, limit: 10 }));
    });
  });

  describe('getUsersByRole', () => {
    it('should return users filtered by role', async () => {
      const role = Roles.CLIENT;
      const page = 1;
      const limit = 10;
      const searchResults = mockUserSearchResult;
      (userService.searchUsers as jest.Mock).mockResolvedValue(searchResults);

      const results = await userService.getUsersByRole(role, page, limit);

      expect(userService.searchUsers).toHaveBeenCalledWith({
        role,
        page,
        limit,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      expect(results).toEqual(searchResults);
    });

    it('should use default pagination values when not provided', async () => {
      const role = Roles.CLIENT;
      const searchResults = mockUserSearchResult;
      (userService.searchUsers as jest.Mock).mockResolvedValue(searchResults);

      await userService.getUsersByRole(role);

      expect(userService.searchUsers).toHaveBeenCalledWith(expect.objectContaining({ page: 1, limit: 10 }));
    });
  });

  describe('deactivateUser', () => {
    it('should deactivate a user successfully', async () => {
      const userId = 'test-user-id';
      const reason = 'Test reason';
      const existingUser = mockUserWithProfile;
      (userService.getUserProfile as jest.Mock).mockResolvedValue(existingUser);
      (userRepository.update as jest.Mock).mockResolvedValue({ ...existingUser.user, isVerified: false });
      jest.spyOn(userCache, 'invalidateUserCache').mockResolvedValue();
      jest.spyOn(userCache, 'invalidateUserSearchCache').mockResolvedValue();
      (notificationService.createNotification as jest.Mock).mockResolvedValue({});

      const deactivatedUser = await userService.deactivateUser(userId, reason);

      expect(userService.getUserProfile).toHaveBeenCalledWith(userId);
      expect(userRepository.update).toHaveBeenCalledWith(userId, { isVerified: false });
      expect(userCache.invalidateUserCache).toHaveBeenCalledWith(userId);
      expect(userCache.invalidateUserSearchCache).toHaveBeenCalled();
      expect(notificationService.createNotification).toHaveBeenCalled();
      expect(deactivatedUser.isVerified).toBe(false);
    });

    it('should throw NotFoundError when user does not exist', async () => {
      const userId = 'non-existent-user-id';
      const reason = 'Test reason';
      (userService.getUserProfile as jest.Mock).mockRejectedValue(errorFactory.createNotFoundError('User not found', { userId }));

      await expect(userService.deactivateUser(userId, reason)).rejects.toThrow(errorFactory.createNotFoundError('User not found', { userId }));
    });
  });

  describe('reactivateUser', () => {
    it('should reactivate a user successfully', async () => {
      const userId = 'test-user-id';
      const existingUser = { ...mockUserWithProfile, user: { ...mockUserWithProfile.user, isVerified: false } };
      (userService.getUserProfile as jest.Mock).mockResolvedValue(existingUser);
      (userRepository.update as jest.Mock).mockResolvedValue({ ...existingUser.user, isVerified: true });
      jest.spyOn(userCache, 'invalidateUserCache').mockResolvedValue();
      jest.spyOn(userCache, 'invalidateUserSearchCache').mockResolvedValue();
      (notificationService.createNotification as jest.Mock).mockResolvedValue({});

      const reactivatedUser = await userService.reactivateUser(userId);

      expect(userService.getUserProfile).toHaveBeenCalledWith(userId);
      expect(userRepository.update).toHaveBeenCalledWith(userId, { isVerified: true });
      expect(userCache.invalidateUserCache).toHaveBeenCalledWith(userId);
      expect(userCache.invalidateUserSearchCache).toHaveBeenCalled();
      expect(notificationService.createNotification).toHaveBeenCalled();
      expect(reactivatedUser.isVerified).toBe(true);
    });

    it('should throw NotFoundError when user does not exist', async () => {
      const userId = 'non-existent-user-id';
      (userService.getUserProfile as jest.Mock).mockRejectedValue(errorFactory.createNotFoundError('User not found', { userId }));

      await expect(userService.reactivateUser(userId)).rejects.toThrow(errorFactory.createNotFoundError('User not found', { userId }));
    });

    it('should throw ValidationError when user is already active', async () => {
      const userId = 'test-user-id';
      const existingUser = mockUserWithProfile;
      (userService.getUserProfile as jest.Mock).mockResolvedValue(existingUser);

      await expect(userService.reactivateUser(userId)).rejects.toThrow(errorFactory.createValidationError('User is already active'));
    });
  });
});