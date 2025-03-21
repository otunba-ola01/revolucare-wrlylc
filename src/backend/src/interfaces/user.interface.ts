/**
 * User interfaces for the Revolucare platform
 * 
 * This file defines TypeScript interfaces for user-related operations,
 * including repository contracts, service interfaces, search parameters,
 * and data transfer objects for various user operations.
 */

import { User, UserWithProfile, UserIdentifier, UserWithoutPassword } from '../types/user.types';
import { Roles } from '../constants/roles';

/**
 * Interface defining the contract for user repository implementations.
 * Follows the repository pattern for data access abstraction.
 */
export interface IUserRepository {
  /**
   * Creates a new user in the system
   * @param user The user data to create
   * @returns The created user with generated ID
   */
  create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;

  /**
   * Finds a user by their unique identifier
   * @param id The user's unique identifier
   * @returns The user if found, null otherwise
   */
  findById(id: string): Promise<User | null>;

  /**
   * Finds a user by their email address
   * @param email The user's email address
   * @returns The user if found, null otherwise
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Finds a user with their complete profile information
   * @param identifier User identifier (id or email)
   * @returns The user with profile information if found, null otherwise
   */
  findWithProfile(identifier: UserIdentifier): Promise<UserWithProfile | null>;

  /**
   * Updates an existing user's information
   * @param id The user's unique identifier
   * @param userData The user data to update
   * @returns The updated user
   */
  update(id: string, userData: Partial<User>): Promise<User>;

  /**
   * Deletes a user from the system
   * @param id The user's unique identifier
   * @returns True if deleted, false otherwise
   */
  delete(id: string): Promise<boolean>;

  /**
   * Searches for users based on provided parameters
   * @param params Search parameters including filters, pagination, and sorting
   * @returns Search results with pagination information
   */
  search(params: UserSearchParams): Promise<UserSearchResult>;

  /**
   * Finds users by their role
   * @param role The role to filter by
   * @param page Page number for pagination
   * @param limit Maximum number of results per page
   * @returns Users with the specified role
   */
  findByRole(role: Roles, page: number, limit: number): Promise<UserSearchResult>;
}

/**
 * Interface defining parameters for searching users
 * Supports filtering, pagination, and sorting
 */
export interface UserSearchParams {
  /**
   * Optional search query to filter users by name or email
   */
  query?: string;
  
  /**
   * Optional role filter to find users with a specific role
   */
  role?: Roles;
  
  /**
   * Optional filter for verified/unverified users
   */
  isVerified?: boolean;
  
  /**
   * Page number for pagination (1-based)
   */
  page: number;
  
  /**
   * Maximum number of results per page
   */
  limit: number;
  
  /**
   * Field to sort results by
   */
  sortBy: string;
  
  /**
   * Sort direction (ascending or descending)
   */
  sortOrder: 'asc' | 'desc';
}

/**
 * Interface defining the structure of user search results
 * Includes pagination information
 */
export interface UserSearchResult {
  /**
   * Array of users matching the search criteria
   */
  users: UserWithoutPassword[];
  
  /**
   * Total number of users matching the search criteria
   */
  total: number;
  
  /**
   * Current page number
   */
  page: number;
  
  /**
   * Maximum number of results per page
   */
  limit: number;
  
  /**
   * Total number of pages available
   */
  totalPages: number;
}

/**
 * Interface defining the contract for user service implementations
 * Provides higher-level user operations beyond basic CRUD
 */
export interface IUserService {
  /**
   * Retrieves a user's complete profile information
   * @param userId The user's unique identifier
   * @returns The user with profile information
   */
  getUserProfile(userId: string): Promise<UserWithProfile>;

  /**
   * Updates a user's profile information
   * @param userId The user's unique identifier
   * @param profileData The profile data to update
   * @returns The updated user with profile information
   */
  updateUserProfile(userId: string, profileData: ProfileUpdateRequest): Promise<UserWithProfile>;

  /**
   * Retrieves a user's preferences
   * @param userId The user's unique identifier
   * @returns The user's preferences
   */
  getUserPreferences(userId: string): Promise<any>;

  /**
   * Updates a user's preferences
   * @param userId The user's unique identifier
   * @param preferences The preferences to update
   * @returns The updated preferences
   */
  updateUserPreferences(userId: string, preferences: PreferencesUpdateRequest): Promise<any>;

  /**
   * Searches for users based on provided parameters
   * @param params Search parameters
   * @returns Search results with pagination information
   */
  searchUsers(params: UserSearchParams): Promise<UserSearchResult>;

  /**
   * Retrieves users by their role
   * @param role The role to filter by
   * @param page Page number for pagination
   * @param limit Maximum number of results per page
   * @returns Users with the specified role
   */
  getUsersByRole(role: Roles, page: number, limit: number): Promise<UserSearchResult>;

  /**
   * Deactivates a user account
   * @param userId The user's unique identifier
   * @returns True if deactivated successfully
   */
  deactivateUser(userId: string): Promise<boolean>;

  /**
   * Reactivates a previously deactivated user account
   * @param userId The user's unique identifier
   * @returns True if reactivated successfully
   */
  reactivateUser(userId: string): Promise<boolean>;
}

/**
 * Interface defining the structure for user profile update requests
 */
export interface ProfileUpdateRequest {
  /**
   * Optional first name update
   */
  firstName?: string;
  
  /**
   * Optional last name update
   */
  lastName?: string;
  
  /**
   * Optional phone number update
   */
  phone?: string;
  
  /**
   * Optional address information update
   */
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  
  /**
   * Optional role-specific profile data update
   */
  roleSpecificData?: {
    [key: string]: any;
  };
}

/**
 * Interface defining the structure for user preferences update requests
 */
export interface PreferencesUpdateRequest {
  /**
   * Optional theme preference update
   */
  theme?: 'light' | 'dark' | 'system';
  
  /**
   * Optional notification preferences update
   */
  notifications?: {
    email?: boolean;
    sms?: boolean;
    inApp?: boolean;
    types?: Record<string, boolean>;
  };
  
  /**
   * Optional accessibility preferences update
   */
  accessibility?: {
    fontSize?: 'small' | 'medium' | 'large' | 'x-large';
    highContrast?: boolean;
    reduceMotion?: boolean;
    screenReader?: boolean;
  };
  
  /**
   * Optional language preference update
   */
  language?: string;
}