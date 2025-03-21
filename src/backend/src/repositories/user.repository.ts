/**
 * Repository implementation for user-related data access in the Revolucare platform.
 * Provides methods for CRUD operations, search functionality, and role-based queries.
 */
import { prisma, executeWithTransaction } from '../config/database';
import { IUserRepository, UserSearchParams, UserSearchResult } from '../interfaces/user.interface';
import { User, UserWithProfile, UserIdentifier, UserWithoutPassword } from '../types/user.types';
import { UserModel } from '../models/user.model';
import { Roles } from '../constants/roles';
import { errorFactory } from '../utils/error-handler';

/**
 * Repository class that implements the IUserRepository interface for user data access
 */
export class UserRepository implements IUserRepository {
  /**
   * Creates a new user in the database
   * @param userData User data to create
   * @returns Created user data
   */
  async create(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    // Validate user data using UserModel
    const userModel = new UserModel(userData);
    userModel.validate();

    // Check if user with the same email already exists
    const existingUser = await this.findByEmail(userData.email);
    if (existingUser) {
      throw errorFactory.createValidationError('User with this email already exists', {
        field: 'email',
        value: userData.email
      });
    }

    try {
      // Create user record in the database
      const createdUser = await prisma.user.create({
        data: {
          email: userData.email,
          passwordHash: userData.passwordHash,
          role: userData.role,
          firstName: userData.firstName,
          lastName: userData.lastName,
          isVerified: userData.isVerified || false
        }
      });

      // Create appropriate profile based on user role
      await this.createUserProfile(createdUser.id, createdUser.role);

      // Return the created user data
      return new UserModel({
        ...createdUser
      }).toJSON();
    } catch (error) {
      throw errorFactory.createInternalServerError('Failed to create user', {
        error: error instanceof Error ? error.message : 'Unknown error'
      }, error instanceof Error ? error : undefined);
    }
  }

  /**
   * Finds a user by ID
   * @param id User ID to find
   * @returns User data or null if not found
   */
  async findById(id: string): Promise<User | null> {
    try {
      // Query the database for user with the given ID
      const user = await prisma.user.findUnique({
        where: { id }
      });

      // Return null if user not found
      if (!user) {
        return null;
      }

      // Transform database result to User model
      return new UserModel(user).toJSON();
    } catch (error) {
      throw errorFactory.createInternalServerError('Failed to find user by ID', {
        userId: id,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, error instanceof Error ? error : undefined);
    }
  }

  /**
   * Finds a user by email address
   * @param email Email address to find
   * @returns User data or null if not found
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      // Query the database for user with the given email
      const user = await prisma.user.findUnique({
        where: { email }
      });

      // Return null if user not found
      if (!user) {
        return null;
      }

      // Transform database result to User model
      return new UserModel(user).toJSON();
    } catch (error) {
      throw errorFactory.createInternalServerError('Failed to find user by email', {
        email,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, error instanceof Error ? error : undefined);
    }
  }

  /**
   * Finds a user with their role-specific profile
   * @param identifier User identifier (id or email)
   * @returns User with profile data or null if not found
   */
  async findWithProfile(identifier: UserIdentifier): Promise<UserWithProfile | null> {
    try {
      // Determine whether to search by ID or email
      if ('id' in identifier) {
        return this.getUserWithProfileById(identifier.id);
      } else if ('email' in identifier) {
        const user = await prisma.user.findUnique({
          where: { email: identifier.email }
        });
        
        if (!user) {
          return null;
        }
        
        return this.getUserWithProfileById(user.id);
      }
      
      return null;
    } catch (error) {
      throw errorFactory.createInternalServerError('Failed to find user with profile', {
        identifier,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, error instanceof Error ? error : undefined);
    }
  }

  /**
   * Updates a user's information
   * @param id User ID to update
   * @param userData User data to update
   * @returns Updated user data
   */
  async update(id: string, userData: Partial<User>): Promise<User> {
    // Check if user exists
    const existingUser = await this.findById(id);
    if (!existingUser) {
      throw errorFactory.createNotFoundError('User not found', { userId: id });
    }

    // Create a safe update object by excluding fields that shouldn't be updated
    const updateData = { ...userData };
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    try {
      // Update user record in the database
      const updatedUser = await prisma.user.update({
        where: { id },
        data: updateData
      });

      // Return the updated user data
      return new UserModel(updatedUser).toJSON();
    } catch (error) {
      throw errorFactory.createInternalServerError('Failed to update user', {
        userId: id,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, error instanceof Error ? error : undefined);
    }
  }

  /**
   * Deletes a user from the database
   * @param id User ID to delete
   * @returns True if deletion was successful
   */
  async delete(id: string): Promise<boolean> {
    // Check if user exists
    const existingUser = await this.findById(id);
    if (!existingUser) {
      throw errorFactory.createNotFoundError('User not found', { userId: id });
    }

    try {
      // Execute deletion within a transaction
      return await executeWithTransaction(async (tx) => {
        // Delete associated profiles first based on user role
        switch (existingUser.role) {
          case Roles.CLIENT:
            await tx.clientProfile.deleteMany({ where: { userId: id } });
            break;
          case Roles.PROVIDER:
            await tx.providerProfile.deleteMany({ where: { userId: id } });
            break;
          case Roles.CASE_MANAGER:
            await tx.caseManagerProfile.deleteMany({ where: { userId: id } });
            break;
          case Roles.ADMINISTRATOR:
            await tx.adminProfile.deleteMany({ where: { userId: id } });
            break;
        }

        // Delete the user record
        await tx.user.delete({ where: { id } });
        
        return true;
      });
    } catch (error) {
      throw errorFactory.createInternalServerError('Failed to delete user', {
        userId: id,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, error instanceof Error ? error : undefined);
    }
  }

  /**
   * Searches for users based on search parameters
   * @param params Search parameters
   * @returns Search results with pagination
   */
  async search(params: UserSearchParams): Promise<UserSearchResult> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = params;
    
    try {
      // Build query filters based on search parameters
      const where = this.buildSearchFilters(params);
      
      // Apply pagination parameters
      const skip = (page - 1) * limit;
      const take = limit;
      
      // Execute count query for total results
      const total = await prisma.user.count({ where });
      
      // Execute search query with filters, pagination, and sorting
      const users = await prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: {
          [sortBy]: sortOrder
        }
      });
      
      // Transform results to UserWithoutPassword models
      const transformedUsers = users.map(user => {
        const userModel = new UserModel(user);
        return userModel.toUserWithoutPassword();
      });
      
      // Return search results with pagination information
      return {
        users: transformedUsers,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      throw errorFactory.createInternalServerError('Failed to search users', {
        params,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, error instanceof Error ? error : undefined);
    }
  }

  /**
   * Finds users by role
   * @param role Role to filter by
   * @param page Page number for pagination
   * @param limit Maximum number of results per page
   * @returns Users with the specified role
   */
  async findByRole(role: Roles, page: number = 1, limit: number = 10): Promise<UserSearchResult> {
    // Create search parameters with role filter
    const searchParams: UserSearchParams = {
      role,
      page,
      limit,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };
    
    // Call the search method with these parameters
    return this.search(searchParams);
  }

  /**
   * Helper method to get a user with profile by ID
   * @param id User ID
   * @returns User with profile or null if not found
   */
  private async getUserWithProfileById(id: string): Promise<UserWithProfile | null> {
    // Query the database for user with all possible profile relations
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        clientProfile: true,
        providerProfile: true,
        caseManagerProfile: true,
        adminProfile: true
      }
    });

    // Return null if user not found
    if (!user) {
      return null;
    }

    // Transform database result to UserWithProfile model
    const userModel = new UserModel(user);
    return userModel.toUserWithProfile();
  }

  /**
   * Helper method to create a role-specific profile for a user
   * @param userId User ID
   * @param role User role
   */
  private async createUserProfile(userId: string, role: Roles): Promise<void> {
    // Determine which profile type to create based on role
    switch (role) {
      case Roles.CLIENT:
        // Create client profile for CLIENT role
        await prisma.clientProfile.create({
          data: {
            userId,
            // Initialize with default values
            dateOfBirth: null,
            gender: null,
            phone: null,
            preferences: {},
            medicalInformation: {
              conditions: [],
              allergies: [],
              medications: [],
              notes: ''
            }
          }
        });
        break;
        
      case Roles.PROVIDER:
        // Create provider profile for PROVIDER role
        await prisma.providerProfile.create({
          data: {
            userId,
            organizationName: '',
            licenseNumber: null,
            licenseExpiration: null,
            serviceTypes: [],
            bio: null,
            specializations: [],
            insuranceAccepted: [],
            averageRating: 0,
            reviewCount: 0
          }
        });
        break;
        
      case Roles.CASE_MANAGER:
        // Create case manager profile for CASE_MANAGER role
        await prisma.caseManagerProfile.create({
          data: {
            userId,
            certification: null,
            specialty: null,
            bio: null,
            assignedClients: []
          }
        });
        break;
        
      case Roles.ADMINISTRATOR:
        // Create admin profile for ADMINISTRATOR role
        await prisma.adminProfile.create({
          data: {
            userId,
            department: null,
            permissions: []
          }
        });
        break;
    }
  }

  /**
   * Helper method to build database query filters from search parameters
   * @param params Search parameters
   * @returns Prisma where clause object
   */
  private buildSearchFilters(params: UserSearchParams): object {
    const { query, role, isVerified } = params;
    const where: any = {};
    
    // Add role filter if specified
    if (role) {
      where.role = role;
    }
    
    // Add verification status filter if specified
    if (isVerified !== undefined) {
      where.isVerified = isVerified;
    }
    
    // Add text search filter if query is provided
    if (query) {
      where.OR = [
        { email: { contains: query, mode: 'insensitive' } },
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } }
      ];
    }
    
    return where;
  }
}