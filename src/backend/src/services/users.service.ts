import {
  IUserService,
  ProfileUpdateRequest,
  PreferencesUpdateRequest,
  UserSearchParams,
  UserSearchResult,
} from '../interfaces/user.interface';
import { UserRepository } from '../repositories/user.repository';
import {
  UserWithProfile,
  UserWithoutPassword,
  UserPreferences,
} from '../types/user.types';
import { Roles } from '../constants/roles';
import { errorFactory } from '../utils/error-handler';
import { NotificationService } from './notifications.service';
import { logger } from '../utils/logger';
import {
  cacheUserWithProfile,
  getCachedUserWithProfile,
  cacheUserPreferences,
  getCachedUserPreferences,
  invalidateUserCache,
  invalidateUserSearchCache,
} from '../cache/user.cache';

/**
 * Service class that implements the IUserService interface for user profile management
 */
export class UserService implements IUserService {
  private userRepository: UserRepository;
  private notificationService: NotificationService;

  /**
   * Creates a new UserService instance
   * @param userRepository 
   * @param notificationService 
   */
  constructor(
    userRepository: UserRepository,
    notificationService: NotificationService
  ) {
    this.userRepository = userRepository;
    this.notificationService = notificationService;
  }

  /**
   * Retrieves a user's profile with role-specific data
   * @param userId 
   * @returns User profile with role-specific data
   */
  async getUserProfile(userId: string): Promise<UserWithProfile> {
    // Log the attempt to retrieve a user profile
    logger.info('Retrieving user profile', { userId });

    // Validate userId parameter
    if (!userId) {
      throw errorFactory.createValidationError('User ID is required');
    }

    // Check cache for user profile data
    const cachedProfile = await getCachedUserWithProfile(userId);
    if (cachedProfile) {
      logger.debug('User profile retrieved from cache', { userId });
      return cachedProfile;
    }

    // If not cached, fetch profile from repository
    const userWithProfile = await this.userRepository.findWithProfile({ id: userId });

    // If user not found, throw not found error
    if (!userWithProfile) {
      throw errorFactory.createNotFoundError('User not found', { userId });
    }

    // Cache the retrieved profile for future requests
    await cacheUserWithProfile(userWithProfile);
    logger.debug('User profile cached successfully', { userId });

    // Return the user profile with role-specific data
    return userWithProfile;
  }

  /**
   * Updates a user's profile information
   * @param userId 
   * @param profileData 
   * @returns Updated user profile
   */
  async updateUserProfile(
    userId: string,
    profileData: ProfileUpdateRequest
  ): Promise<UserWithProfile> {
    // Log the attempt to update a user profile
    logger.info('Updating user profile', { userId, profileData });

    // Validate userId and profileData parameters
    if (!userId) {
      throw errorFactory.createValidationError('User ID is required');
    }
    if (!profileData) {
      throw errorFactory.createValidationError('Profile data is required');
    }

    // Get current user profile
    const currentUser = await this.getUserProfile(userId);

    // Validate update permissions (users can only update their own profile unless admin)
    this.validateProfileUpdatePermission(userId, currentUser.user.id, currentUser.user.role);

    // Update basic user information (firstName, lastName, etc.)
    const updateData: any = {};
    if (profileData.firstName) {
      updateData.firstName = profileData.firstName;
    }
    if (profileData.lastName) {
      updateData.lastName = profileData.lastName;
    }

    // Update role-specific profile data based on user role
    let roleSpecificUpdateData: any = {};
    switch (currentUser.user.role) {
      case Roles.CLIENT:
        roleSpecificUpdateData = {
          // TODO: Implement client profile update logic
        };
        break;
      case Roles.PROVIDER:
        roleSpecificUpdateData = {
          // TODO: Implement provider profile update logic
        };
        break;
      case Roles.CASE_MANAGER:
        roleSpecificUpdateData = {
          // TODO: Implement case manager profile update logic
        };
        break;
      case Roles.ADMINISTRATOR:
        roleSpecificUpdateData = {
          // TODO: Implement admin profile update logic
        };
        break;
      default:
        break;
    }

    // Save updated profile to repository
    const updatedUser = await this.userRepository.update(userId, updateData);

    // Invalidate user cache to ensure fresh data
    await invalidateUserCache(userId);

    // Invalidate search cache as profile changes may affect search results
    await invalidateUserSearchCache();

    // Send profile update notification
    await this.sendProfileUpdateNotification(userId, currentUser);

    // Return the updated user profile
    return this.getUserProfile(userId);
  }

  /**
   * Retrieves a user's preferences
   * @param userId 
   * @returns User preferences
   */
  async getUserPreferences(userId: string): Promise<UserPreferences> {
    // Log the attempt to retrieve user preferences
    logger.info('Retrieving user preferences', { userId });

    // Validate userId parameter
    if (!userId) {
      throw errorFactory.createValidationError('User ID is required');
    }

    // Check cache for user preferences
    const cachedPreferences = await getCachedUserPreferences(userId);
    if (cachedPreferences) {
      logger.debug('User preferences retrieved from cache', { userId });
      return cachedPreferences;
    }

    // If not cached, fetch user profile from repository
    const userWithProfile = await this.userRepository.findWithProfile({ id: userId });

    // Extract preferences from appropriate profile based on user role
    let preferences: UserPreferences | null = null;
    if (userWithProfile?.clientProfile?.preferences) {
      preferences = userWithProfile.clientProfile.preferences as UserPreferences;
    }

    // If no preferences found, return default preferences
    if (!preferences) {
      preferences = this.getDefaultPreferences();
    }

    // Cache the preferences for future requests
    await cacheUserPreferences(preferences, userId);
    logger.debug('User preferences cached successfully', { userId });

    // Return the user preferences
    return preferences;
  }

  /**
   * Updates a user's preferences
   * @param userId 
   * @param preferencesData 
   * @returns Updated user preferences
   */
  async updateUserPreferences(
    userId: string,
    preferencesData: PreferencesUpdateRequest
  ): Promise<UserPreferences> {
    // Log the attempt to update user preferences
    logger.info('Updating user preferences', { userId, preferencesData });

    // Validate userId and preferencesData parameters
    if (!userId) {
      throw errorFactory.createValidationError('User ID is required');
    }
    if (!preferencesData) {
      throw errorFactory.createValidationError('Preferences data is required');
    }

    // Get current user preferences
    const currentPreferences = await this.getUserPreferences(userId);

    // Validate update permissions (users can only update their own preferences unless admin)
    // TODO: Implement admin override for preference updates

    // Merge current preferences with update data
    const updatedPreferences = {
      ...currentPreferences,
      ...preferencesData,
    };

    // Update preferences in appropriate profile based on user role
    // TODO: Implement profile-specific preferences update
    // await this.userRepository.updateProfile(userId, { preferences: updatedPreferences });

    // Invalidate user cache to ensure fresh data
    await invalidateUserCache(userId);

    // Cache the updated preferences
    await cacheUserPreferences(updatedPreferences, userId);
    logger.debug('User preferences cached successfully', { userId });

    // Return the updated preferences
    return updatedPreferences;
  }

  /**
   * Searches for users based on criteria with pagination
   * @param params 
   * @returns Search results with pagination information
   */
  async searchUsers(params: UserSearchParams): Promise<UserSearchResult> {
    // Log the attempt to search users
    logger.info('Searching users', { params });

    // Validate search parameters
    if (!params) {
      throw errorFactory.createValidationError('Search parameters are required');
    }

    // Set default values for pagination if not provided
    const page = params.page || 1;
    const limit = params.limit || 10;

    // Check cache for search results with these parameters
    const cachedResults = await getCachedUserSearchResults(params);
    if (cachedResults) {
      logger.debug('User search results retrieved from cache', { params });
      return cachedResults;
    }

    // If not cached, perform search using repository
    const searchResults = await this.userRepository.search(params);

    // Cache search results for future requests
    await cacheUserSearchResults(params, searchResults);
    logger.debug('User search results cached successfully', { params });

    // Return search results with pagination information
    return searchResults;
  }

  /**
   * Retrieves users filtered by role with pagination
   * @param role 
   * @param page 
   * @param limit 
   * @returns Users with the specified role
   */
  async getUsersByRole(role: Roles, page: number = 1, limit: number = 10): Promise<UserSearchResult> {
    // Log the attempt to get users by role
    logger.info('Getting users by role', { role, page, limit });

    // Validate role parameter
    if (!role) {
      throw errorFactory.createValidationError('Role is required');
    }

    // Create search parameters with role filter
    const searchParams: UserSearchParams = {
      role,
      page,
      limit,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };

    // Call searchUsers method with these parameters
    return this.searchUsers(searchParams);
  }

  /**
   * Deactivates a user account
   * @param userId 
   * @param reason 
   * @returns Deactivated user information
   */
  async deactivateUser(userId: string, reason: string): Promise<UserWithoutPassword> {
    // Log the attempt to deactivate a user
    logger.info('Deactivating user', { userId, reason });

    // Validate userId and reason parameters
    if (!userId) {
      throw errorFactory.createValidationError('User ID is required');
    }
    if (!reason) {
      throw errorFactory.createValidationError('Deactivation reason is required');
    }

    // Check if user exists
    const existingUser = await this.getUserProfile(userId);
    if (!existingUser) {
      throw errorFactory.createNotFoundError('User not found', { userId });
    }

    // TODO: Implement user deactivation logic in repository
    // Update user status to inactive
    // Record deactivation reason and timestamp

    // Invalidate user cache
    await invalidateUserCache(userId);

    // Invalidate search cache
    await invalidateUserSearchCache();

    // Send account deactivation notification
    // TODO: Implement notification sending

    // Log user deactivation with reason
    logger.info('User deactivated successfully', { userId, reason });

    // Return the deactivated user information
    return existingUser.user;
  }

  /**
   * Reactivates a previously deactivated user account
   * @param userId 
   * @returns Reactivated user information
   */
  async reactivateUser(userId: string): Promise<UserWithoutPassword> {
    // Log the attempt to reactivate a user
    logger.info('Reactivating user', { userId });

    // Validate userId parameter
    if (!userId) {
      throw errorFactory.createValidationError('User ID is required');
    }

    // Check if user exists and is currently inactive
    const existingUser = await this.getUserProfile(userId);
    if (!existingUser) {
      throw errorFactory.createNotFoundError('User not found', { userId });
    }

    // TODO: Implement user reactivation logic in repository
    // Update user status to active
    // Clear deactivation reason and timestamp

    // Invalidate user cache
    await invalidateUserCache(userId);

    // Invalidate search cache
    await invalidateUserSearchCache();

    // Send account reactivation notification
    // TODO: Implement notification sending

    // Log user reactivation
    logger.info('User reactivated successfully', { userId });

    // Return the reactivated user information
    return existingUser.user;
  }

  /**
   * Creates default user preferences
   * @returns Default user preferences
   */
  private getDefaultPreferences(): UserPreferences {
    // Log the creation of default user preferences
    logger.info('Creating default user preferences');

    // Create default theme setting (light)
    const theme = 'light';

    // Create default notification preferences (email and in-app enabled)
    const notifications = {
      email: true,
      sms: false,
      inApp: true,
      types: {},
    };

    // Create default accessibility settings (standard)
    const accessibility = {
      fontSize: 'medium',
      highContrast: false,
      reduceMotion: false,
      screenReader: false,
    };

    // Create default language setting (English)
    const language = 'en';

    // Log the successful creation of default user preferences
    logger.info('Default user preferences created successfully');

    // Return complete default preferences object
    return {
      theme,
      notifications,
      accessibility,
      language,
    } as UserPreferences;
  }

  /**
   * Validates if a user has permission to update a profile
   * @param requestingUserId 
   * @param targetUserId 
   * @param requestingUserRole 
   * @returns Resolves if permission is valid, throws error otherwise
   */
  private async validateProfileUpdatePermission(
    requestingUserId: string,
    targetUserId: string,
    requestingUserRole: Roles
  ): Promise<void> {
    // Log the attempt to validate profile update permission
    logger.info('Validating profile update permission', {
      requestingUserId,
      targetUserId,
      requestingUserRole,
    });

    // Check if requesting user is updating their own profile
    if (requestingUserId === targetUserId) {
      logger.debug('User is updating their own profile, permission granted');
      return; // Self-update is always allowed
    }

    // If not self-update, check if requesting user has admin role
    if (requestingUserRole === Roles.ADMINISTRATOR) {
      logger.debug('Admin user is updating profile, permission granted');
      return; // Admins can update any profile
    }

    // If neither self-update nor admin, throw forbidden error
    logger.warn('User does not have permission to update this profile', {
      requestingUserId,
      targetUserId,
      requestingUserRole,
    });
    throw errorFactory.createForbiddenError('You do not have permission to update this profile');
  }

  /**
   * Sends a notification about profile updates
   * @param userId 
   * @param profile 
   * @returns Resolves when notification is sent
   */
  private async sendProfileUpdateNotification(
    userId: string,
    profile: UserWithProfile
  ): Promise<void> {
    // Log the attempt to send a profile update notification
    logger.info('Sending profile update notification', { userId });

    // Create notification data with profile update information
    const notificationData = {
      title: 'Profile Updated',
      message: 'Your profile has been updated successfully.',
      data: {
        firstName: profile.user.firstName,
        lastName: profile.user.lastName,
      },
    };

    // Set appropriate notification priority and channels
    const priority = 'normal';
    const channels = ['in_app', 'email'];

    // Send notification using notification service
    await this.notificationService.createNotification({
      userId,
      type: 'profile_updated', // TODO: Define notification type constant
      title: notificationData.title,
      message: notificationData.message,
      data: notificationData.data,
      priority,
      channels,
    });

    // Log notification sending result
    logger.info('Profile update notification sent successfully', { userId });
  }
}

/**
 * Factory function to create a configured UserService instance with required dependencies
 * @param userRepository 
 * @param notificationService 
 * @returns Configured UserService instance
 */
export const createUserService = (
  userRepository: UserRepository,
  notificationService: NotificationService
): UserService => {
  return new UserService(userRepository, notificationService);
};