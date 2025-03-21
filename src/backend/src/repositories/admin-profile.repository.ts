/**
 * Repository for managing administrator profile data in the Revolucare platform.
 * Implements the repository pattern to provide a consistent interface for admin profile
 * data operations, including CRUD operations and specialized permission management.
 */

import { AdminProfile } from '../types/user.types';
import { prisma } from '../config/database';
import { errorFactory } from '../utils/error-handler';
import { AdminProfileModel } from '../models/admin-profile.model';

/**
 * Repository class that provides data access methods for administrator profiles
 */
export class AdminProfileRepository {
  /**
   * Creates a new administrator profile in the database
   * @param profileData The profile data to create
   * @returns Newly created administrator profile
   */
  async create(profileData: Omit<AdminProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<AdminProfile> {
    // Validate profile data using AdminProfileModel
    const profileModel = AdminProfileModel.create(profileData);
    
    // Create profile record in database using Prisma
    const createdProfile = await prisma.adminProfile.create({
      data: {
        userId: profileModel.userId,
        department: profileModel.department,
        permissions: profileModel.permissions,
      }
    });
    
    // Transform database result to AdminProfile type
    return this.mapToAdminProfile(createdProfile);
  }

  /**
   * Finds an administrator profile by its ID
   * @param id The profile ID to find
   * @returns Administrator profile if found, null otherwise
   */
  async findById(id: string): Promise<AdminProfile | null> {
    // Query database for profile with matching ID
    const profile = await prisma.adminProfile.findUnique({
      where: { id }
    });
    
    // Return null if no profile found
    if (!profile) {
      return null;
    }
    
    // Transform database result to AdminProfile type
    return this.mapToAdminProfile(profile);
  }

  /**
   * Finds an administrator profile by user ID
   * @param userId The user ID to find the profile for
   * @returns Administrator profile if found, null otherwise
   */
  async findByUserId(userId: string): Promise<AdminProfile | null> {
    // Query database for profile with matching user ID
    const profile = await prisma.adminProfile.findUnique({
      where: { userId }
    });
    
    // Return null if no profile found
    if (!profile) {
      return null;
    }
    
    // Transform database result to AdminProfile type
    return this.mapToAdminProfile(profile);
  }

  /**
   * Updates an existing administrator profile in the database
   * @param id The profile ID to update
   * @param profileData The updated profile data
   * @returns Updated administrator profile
   */
  async update(id: string, profileData: Partial<AdminProfile>): Promise<AdminProfile> {
    // Check if profile exists
    const existingProfile = await this.findById(id);
    if (!existingProfile) {
      throw errorFactory.createNotFoundError(`Administrator profile with ID ${id} not found`);
    }
    
    // Validate update data using AdminProfileModel
    const profileModel = new AdminProfileModel({
      ...existingProfile,
      ...profileData
    });
    profileModel.validate();
    
    // Update profile record in database using Prisma
    const updatedProfile = await prisma.adminProfile.update({
      where: { id },
      data: {
        department: profileModel.department,
        permissions: profileModel.permissions,
        updatedAt: new Date()
      }
    });
    
    // Transform database result to AdminProfile type
    return this.mapToAdminProfile(updatedProfile);
  }

  /**
   * Deletes an administrator profile from the database
   * @param id The profile ID to delete
   * @returns True if profile was deleted, false otherwise
   */
  async delete(id: string): Promise<boolean> {
    // Check if profile exists
    const existingProfile = await this.findById(id);
    if (!existingProfile) {
      throw errorFactory.createNotFoundError(`Administrator profile with ID ${id} not found`);
    }
    
    // Delete profile record from database using Prisma
    await prisma.adminProfile.delete({
      where: { id }
    });
    
    return true;
  }

  /**
   * Adds a permission to an administrator profile
   * @param id The profile ID
   * @param permission The permission to add
   * @returns Updated administrator profile with the new permission
   */
  async addPermission(id: string, permission: string): Promise<AdminProfile> {
    // Find the profile by ID
    const profile = await this.findById(id);
    if (!profile) {
      throw errorFactory.createNotFoundError(`Administrator profile with ID ${id} not found`);
    }
    
    // Create AdminProfileModel instance from the found profile
    const profileModel = new AdminProfileModel(profile);
    profileModel.addPermission(permission);
    
    // Update the profile in the database with the new permissions array
    const updatedProfile = await prisma.adminProfile.update({
      where: { id },
      data: {
        permissions: profileModel.permissions,
        updatedAt: new Date()
      }
    });
    
    return this.mapToAdminProfile(updatedProfile);
  }

  /**
   * Removes a permission from an administrator profile
   * @param id The profile ID
   * @param permission The permission to remove
   * @returns Updated administrator profile without the removed permission
   */
  async removePermission(id: string, permission: string): Promise<AdminProfile> {
    // Find the profile by ID
    const profile = await this.findById(id);
    if (!profile) {
      throw errorFactory.createNotFoundError(`Administrator profile with ID ${id} not found`);
    }
    
    // Create AdminProfileModel instance from the found profile
    const profileModel = new AdminProfileModel(profile);
    profileModel.removePermission(permission);
    
    // Update the profile in the database with the updated permissions array
    const updatedProfile = await prisma.adminProfile.update({
      where: { id },
      data: {
        permissions: profileModel.permissions,
        updatedAt: new Date()
      }
    });
    
    return this.mapToAdminProfile(updatedProfile);
  }

  /**
   * Checks if an administrator profile has a specific permission
   * @param id The profile ID
   * @param permission The permission to check
   * @returns True if the profile has the permission, false otherwise
   */
  async hasPermission(id: string, permission: string): Promise<boolean> {
    // Find the profile by ID
    const profile = await this.findById(id);
    if (!profile) {
      return false;
    }
    
    // Create AdminProfileModel instance from the found profile
    const profileModel = new AdminProfileModel(profile);
    return profileModel.hasPermission(permission);
  }

  /**
   * Maps a database admin profile record to the AdminProfile type
   * @param dbProfile The database profile record
   * @returns Administrator profile object with standardized structure
   */
  private mapToAdminProfile(dbProfile: any): AdminProfile {
    // Create a new AdminProfileModel instance with database profile data
    const profileModel = new AdminProfileModel({
      id: dbProfile.id,
      userId: dbProfile.userId,
      department: dbProfile.department,
      permissions: dbProfile.permissions || [],
      createdAt: dbProfile.createdAt,
      updatedAt: dbProfile.updatedAt
    });
    
    // Return the profile data in standardized format
    return profileModel.toJSON();
  }
}