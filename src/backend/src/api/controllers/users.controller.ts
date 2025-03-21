/**
 * Implements controller functions for user-related API endpoints in the Revolucare platform.
 * This controller handles user profile management, preferences, user search, and administrative user operations,
 * serving as the interface between the API routes and the user service layer.
 */

import { Request, Response, NextFunction } from 'express'; // express@^4.18.2
import {
  UserService,
  createUserService,
} from '../../services/users.service';
import { UserRepository } from '../../repositories/user.repository';
import { NotificationService } from '../../services/notifications.service';
import {
  ProfileUpdateRequest,
  PreferencesUpdateRequest,
  UserSearchParams,
} from '../../interfaces/user.interface';
import { AuthenticatedRequest } from '../../interfaces/auth.interface';
import {
  ApiResponse,
  UserProfileResponse,
  PaginatedResponse,
  ErrorResponse,
} from '../../types/response.types';
import {
  UpdateProfileRequest,
  UpdatePreferencesRequest,
} from '../../types/request.types';
import {
  UserWithProfile,
  UserWithoutPassword,
  UserPreferences,
} from '../../types/user.types';
import { Roles } from '../../constants/roles';
import { errorFactory } from '../../utils/error-handler';
import { logger } from '../../utils/logger';

// Create instances of UserRepository and NotificationService
const userRepository = new UserRepository();
const notificationService = new NotificationService(
  new NotificationRepository(),
  userRepository,
  new (require('../../services/email/email.service').EmailService)()
);

// Create a UserService instance using the factory function
const userService: UserService = createUserService(userRepository, notificationService);

/**
 * Retrieves the profile of the authenticated user.
 *
 * @param req - The Express Request object, extended with user information from authentication middleware.
 * @param res - The Express Response object.
 * @param next - The Express NextFunction for error handling.
 * @returns A Promise that resolves to void, sending a JSON response with the user profile data.
 */
export const getUserProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract user ID from authenticated request
    const userId = req.user.userId;

    // Call userService.getUserProfile with the user ID
    const userProfile: UserWithProfile = await userService.getUserProfile(userId);

    // Transform the result into a UserProfileResponse
    const response: UserProfileResponse = {
      success: true,
      message: 'User profile retrieved successfully',
      data: {
        user: {
          id: userProfile.user.id,
          email: userProfile.user.email,
          firstName: userProfile.user.firstName,
          lastName: userProfile.user.lastName,
          role: userProfile.user.role,
          isVerified: userProfile.user.isVerified,
          createdAt: userProfile.user.createdAt,
        },
        profile: userProfile.clientProfile ||
          userProfile.providerProfile ||
          userProfile.caseManagerProfile ||
          userProfile.adminProfile,
      },
    };

    // Send the response with 200 status code
    res.status(200).json(response);
  } catch (error: any) {
    // Catch and forward any errors to the error handling middleware
    handleError(error, next);
  }
};

/**
 * Retrieves a user profile by ID (admin access).
 *
 * @param req - The Express Request object, extended with user information from authentication middleware.
 * @param res - The Express Response object.
 * @param next - The Express NextFunction for error handling.
 * @returns A Promise that resolves to void, sending a JSON response with the user profile data.
 */
export const getUserById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract target user ID from request parameters
    const userId = req.params.id;

    // Call userService.getUserProfile with the target user ID
    const userProfile: UserWithProfile = await userService.getUserProfile(userId);

    // Transform the result into a UserProfileResponse
    const response: UserProfileResponse = {
      success: true,
      message: 'User profile retrieved successfully',
      data: {
        user: {
          id: userProfile.user.id,
          email: userProfile.user.email,
          firstName: userProfile.user.firstName,
          lastName: userProfile.user.lastName,
          role: userProfile.user.role,
          isVerified: userProfile.user.isVerified,
          createdAt: userProfile.user.createdAt,
        },
        profile: userProfile.clientProfile ||
          userProfile.providerProfile ||
          userProfile.caseManagerProfile ||
          userProfile.adminProfile,
      },
    };

    // Send the response with 200 status code
    res.status(200).json(response);
  } catch (error: any) {
    // Catch and forward any errors to the error handling middleware
    handleError(error, next);
  }
};

/**
 * Updates the profile of the authenticated user.
 *
 * @param req - The Express Request object, extended with user information from authentication middleware.
 * @param res - The Express Response object.
 * @param next - The Express NextFunction for error handling.
 * @returns A Promise that resolves to void, sending a JSON response with the updated user profile data.
 */
export const updateUserProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract user ID from authenticated request
    const userId = req.user.userId;

    // Extract profile update data from request body
    const profileData: ProfileUpdateRequest = req.body;

    // Call userService.updateUserProfile with user ID and profile data
    const updatedUser: UserWithProfile = await userService.updateUserProfile(userId, profileData);

    // Transform the result into a UserProfileResponse
    const response: UserProfileResponse = {
      success: true,
      message: 'User profile updated successfully',
      data: {
        user: {
          id: updatedUser.user.id,
          email: updatedUser.user.email,
          firstName: updatedUser.user.firstName,
          lastName: updatedUser.user.lastName,
          role: updatedUser.user.role,
          isVerified: updatedUser.user.isVerified,
          createdAt: updatedUser.user.createdAt,
        },
        profile: updatedUser.clientProfile ||
          updatedUser.providerProfile ||
          updatedUser.caseManagerProfile ||
          updatedUser.adminProfile,
      },
    };

    // Send the response with 200 status code
    res.status(200).json(response);
  } catch (error: any) {
    // Catch and forward any errors to the error handling middleware
    handleError(error, next);
  }
};

/**
 * Updates a user by ID (admin access).
 *
 * @param req - The Express Request object, extended with user information from authentication middleware.
 * @param res - The Express Response object.
 * @param next - The Express NextFunction for error handling.
 * @returns A Promise that resolves to void, sending a JSON response with the updated user data.
 */
export const updateUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract target user ID from request parameters
    const userId = req.params.id;

    // Extract user update data from request body
    const updateData: ProfileUpdateRequest = req.body;

    // Call userService.updateUserProfile with target user ID and update data
    const updatedUser: UserWithProfile = await userService.updateUserProfile(userId, updateData);

    // Transform the result into a UserProfileResponse
    const response: UserProfileResponse = {
      success: true,
      message: 'User updated successfully',
      data: {
        user: {
          id: updatedUser.user.id,
          email: updatedUser.user.email,
          firstName: updatedUser.user.firstName,
          lastName: updatedUser.user.lastName,
          role: updatedUser.user.role,
          isVerified: updatedUser.user.isVerified,
          createdAt: updatedUser.user.createdAt,
        },
        profile: updatedUser.clientProfile ||
          updatedUser.providerProfile ||
          updatedUser.caseManagerProfile ||
          updatedUser.adminProfile,
      },
    };

    // Send the response with 200 status code
    res.status(200).json(response);
  } catch (error: any) {
    // Catch and forward any errors to the error handling middleware
    handleError(error, next);
  }
};

/**
 * Updates the preferences of the authenticated user.
 *
 * @param req - The Express Request object, extended with user information from authentication middleware.
 * @param res - The Express Response object.
 * @param next - The Express NextFunction for error handling.
 * @returns A Promise that resolves to void, sending a JSON response with the updated user preferences.
 */
export const updateUserPreferences = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract user ID from authenticated request
    const userId = req.user.userId;

    // Extract preferences data from request body
    const preferencesData: PreferencesUpdateRequest = req.body;

    // Call userService.updateUserPreferences with user ID and preferences data
    const updatedPreferences: UserPreferences = await userService.updateUserPreferences(userId, preferencesData);

    // Transform the result into an ApiResponse
    const response: ApiResponse<UserPreferences> = {
      success: true,
      message: 'User preferences updated successfully',
      data: updatedPreferences,
    };

    // Send the response with 200 status code
    res.status(200).json(response);
  } catch (error: any) {
    // Catch and forward any errors to the error handling middleware
    handleError(error, next);
  }
};

/**
 * Deactivates a user account (admin access).
 *
 * @param req - The Express Request object, extended with user information from authentication middleware.
 * @param res - The Express Response object.
 * @param next - The Express NextFunction for error handling.
 * @returns A Promise that resolves to void, sending a JSON response confirming user deactivation.
 */
export const deleteUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract target user ID from request parameters
    const userId = req.params.id;

    // Extract deactivation reason from request body
    const { reason } = req.body;

    // Call userService.deactivateUser with target user ID and reason
    await userService.deactivateUser(userId, reason);

    // Transform the result into an ApiResponse
    const response: ApiResponse<null> = {
      success: true,
      message: 'User deactivated successfully',
      data: null,
    };

    // Send the response with 200 status code
    res.status(200).json(response);
  } catch (error: any) {
    // Catch and forward any errors to the error handling middleware
    handleError(error, next);
  }
};

/**
 * Searches for users based on criteria with pagination.
 *
 * @param req - The Express Request object, extended with user information from authentication middleware.
 * @param res - The Express Response object.
 * @param next - The Express NextFunction for error handling.
 * @returns A Promise that resolves to void, sending a JSON response with paginated user search results.
 */
export const searchUsers = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract search parameters from request query
    const { query, role, isVerified, page, limit, sortBy, sortOrder } = req.query;

    // Transform query parameters into UserSearchParams
    const searchParams: UserSearchParams = {
      query: query as string,
      role: role as Roles,
      isVerified: isVerified === 'true',
      page: parseInt(page as string) || 1,
      limit: parseInt(limit as string) || 10,
      sortBy: sortBy as string || 'createdAt',
      sortOrder: (sortOrder as 'asc' | 'desc') || 'desc',
    };

    // Call userService.searchUsers with search parameters
    const searchResults: PaginatedResponse<UserWithoutPassword> = await userService.searchUsers(searchParams);

    // Transform the result into a PaginatedResponse
    const response: PaginatedResponse<UserWithoutPassword> = {
      success: true,
      message: 'Users retrieved successfully',
      data: searchResults.data,
      pagination: searchResults.pagination,
    };

    // Send the response with 200 status code
    res.status(200).json(response);
  } catch (error: any) {
    // Catch and forward any errors to the error handling middleware
    handleError(error, next);
  }
};

/**
 * Retrieves users filtered by role with pagination.
 *
 * @param req - The Express Request object, extended with user information from authentication middleware.
 * @param res - The Express Response object.
 * @param next - The Express NextFunction for error handling.
 * @returns A Promise that resolves to void, sending a JSON response with paginated users of specified role.
 */
export const getUsersByRole = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract role from request parameters
    const role = req.params.role as Roles;

    // Extract pagination parameters from request query
    const { page, limit } = req.query;

    // Call userService.getUsersByRole with role and pagination parameters
    const searchResults: PaginatedResponse<UserWithoutPassword> = await userService.getUsersByRole(
      role,
      parseInt(page as string) || 1,
      parseInt(limit as string) || 10
    );

    // Transform the result into a PaginatedResponse
    const response: PaginatedResponse<UserWithoutPassword> = {
      success: true,
      message: 'Users retrieved successfully',
      data: searchResults.data,
      pagination: searchResults.pagination,
    };

    // Send the response with 200 status code
    res.status(200).json(response);
  } catch (error: any) {
    // Catch and forward any errors to the error handling middleware
    handleError(error, next);
  }
};

/**
 * Reactivates a previously deactivated user account (admin access).
 *
 * @param req - The Express Request object, extended with user information from authentication middleware.
 * @param res - The Express Response object.
 * @param next - The Express NextFunction for error handling.
 * @returns A Promise that resolves to void, sending a JSON response confirming user reactivation.
 */
export const reactivateUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract target user ID from request parameters
    const userId = req.params.id;

    // Call userService.reactivateUser with target user ID
    await userService.reactivateUser(userId);

    // Transform the result into an ApiResponse
    const response: ApiResponse<null> = {
      success: true,
      message: 'User reactivated successfully',
      data: null,
    };

    // Send the response with 200 status code
    res.status(200).json(response);
  } catch (error: any) {
    // Catch and forward any errors to the error handling middleware
    handleError(error, next);
  }
};

/**
 * Helper function to handle and log errors in controller functions.
 *
 * @param error - The error object.
 * @param next - The Express NextFunction for error handling.
 * @returns void - Forwards error to next middleware.
 */
const handleError = (error: Error, next: NextFunction): void => {
  // Log the error with appropriate level based on error type
  logger.error('Error in users controller', {
    message: error.message,
    stack: error.stack,
  });

  // Forward the error to the next middleware for centralized error handling
  next(error);
};