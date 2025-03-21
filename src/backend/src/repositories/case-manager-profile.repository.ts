/**
 * Repository implementation for case manager profile data access operations in the Revolucare platform.
 *
 * This repository provides methods for creating, retrieving, updating, and deleting 
 * case manager profile records in the database, as well as managing assigned clients.
 */
import { prisma } from '../config/database';
import { CaseManagerProfileModel } from '../models/case-manager-profile.model';
import { CaseManagerProfile } from '../types/user.types';
import { errorFactory } from '../utils/error-handler';

/**
 * Repository class for case manager profile data access operations
 */
export class CaseManagerProfileRepository {
  /**
   * Creates a new case manager profile in the database
   *
   * @param profileData Partial case manager profile data
   * @returns The created case manager profile
   */
  async create(profileData: Partial<CaseManagerProfile>): Promise<CaseManagerProfile> {
    try {
      // Validate the profile data using CaseManagerProfileModel
      const profileModel = new CaseManagerProfileModel(profileData);
      profileModel.validate();

      // Transform the data for database storage
      const prismaData = profileModel.toPrisma();

      // Create the case manager profile record in the database
      const createdProfile = await prisma.caseManagerProfile.create({
        data: prismaData
      });

      // Transform the database result to a CaseManagerProfile object
      return new CaseManagerProfileModel({
        ...createdProfile,
        assignedClients: createdProfile.assignedClients ? 
          JSON.parse(createdProfile.assignedClients as string) : 
          null
      }).toJSON();
    } catch (error) {
      // If a validation error occurred, rethrow it
      if (error instanceof Error && error.message.includes('validation')) {
        throw error;
      }
      
      // Otherwise, wrap it in an internal server error
      throw errorFactory.createInternalServerError(
        'Failed to create case manager profile',
        { error: error instanceof Error ? error.message : String(error) },
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Finds a case manager profile by its ID
   *
   * @param id Case manager profile ID
   * @returns The case manager profile if found, null otherwise
   */
  async findById(id: string): Promise<CaseManagerProfile | null> {
    try {
      // Query the database for a case manager profile with the given ID
      const profile = await prisma.caseManagerProfile.findUnique({
        where: { id }
      });

      // If not found, return null
      if (!profile) {
        return null;
      }

      // Transform the database result to a CaseManagerProfile object
      return new CaseManagerProfileModel({
        ...profile,
        assignedClients: profile.assignedClients ? 
          JSON.parse(profile.assignedClients as string) : 
          null
      }).toJSON();
    } catch (error) {
      throw errorFactory.createInternalServerError(
        'Failed to find case manager profile',
        { id, error: error instanceof Error ? error.message : String(error) },
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Finds a case manager profile by user ID
   *
   * @param userId User ID
   * @returns The case manager profile if found, null otherwise
   */
  async findByUserId(userId: string): Promise<CaseManagerProfile | null> {
    try {
      // Query the database for a case manager profile with the given user ID
      const profile = await prisma.caseManagerProfile.findUnique({
        where: { userId }
      });

      // If not found, return null
      if (!profile) {
        return null;
      }

      // Transform the database result to a CaseManagerProfile object
      return new CaseManagerProfileModel({
        ...profile,
        assignedClients: profile.assignedClients ? 
          JSON.parse(profile.assignedClients as string) : 
          null
      }).toJSON();
    } catch (error) {
      throw errorFactory.createInternalServerError(
        'Failed to find case manager profile by user ID',
        { userId, error: error instanceof Error ? error.message : String(error) },
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Updates an existing case manager profile
   *
   * @param id Case manager profile ID
   * @param profileData Updated profile data
   * @returns The updated case manager profile
   */
  async update(id: string, profileData: Partial<CaseManagerProfile>): Promise<CaseManagerProfile> {
    try {
      // Check if the profile exists
      const existingProfile = await this.findById(id);
      if (!existingProfile) {
        throw errorFactory.createNotFoundError(
          'Case manager profile not found',
          { id }
        );
      }

      // Validate the update data using CaseManagerProfileModel
      const profileModel = new CaseManagerProfileModel({
        ...existingProfile,
        ...profileData
      });
      profileModel.validate();

      // Transform the data for database storage
      const prismaData = profileModel.toPrisma();

      // Update the case manager profile record in the database
      const updatedProfile = await prisma.caseManagerProfile.update({
        where: { id },
        data: prismaData
      });

      // Transform the database result to a CaseManagerProfile object
      return new CaseManagerProfileModel({
        ...updatedProfile,
        assignedClients: updatedProfile.assignedClients ? 
          JSON.parse(updatedProfile.assignedClients as string) : 
          null
      }).toJSON();
    } catch (error) {
      // If a not found error, rethrow it
      if (error instanceof Error && error.message.includes('not found')) {
        throw error;
      }
      
      // If a validation error occurred, rethrow it
      if (error instanceof Error && error.message.includes('validation')) {
        throw error;
      }
      
      // Otherwise, wrap it in an internal server error
      throw errorFactory.createInternalServerError(
        'Failed to update case manager profile',
        { id, error: error instanceof Error ? error.message : String(error) },
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Deletes a case manager profile
   *
   * @param id Case manager profile ID
   * @returns True if the profile was deleted, false otherwise
   */
  async delete(id: string): Promise<boolean> {
    try {
      // Check if the profile exists
      const existingProfile = await this.findById(id);
      if (!existingProfile) {
        throw errorFactory.createNotFoundError(
          'Case manager profile not found',
          { id }
        );
      }

      // Delete the case manager profile record from the database
      await prisma.caseManagerProfile.delete({
        where: { id }
      });

      return true;
    } catch (error) {
      // If a not found error, rethrow it
      if (error instanceof Error && error.message.includes('not found')) {
        throw error;
      }
      
      // Otherwise, wrap it in an internal server error
      throw errorFactory.createInternalServerError(
        'Failed to delete case manager profile',
        { id, error: error instanceof Error ? error.message : String(error) },
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Searches for case manager profiles based on criteria
   *
   * @param searchParams Search parameters
   * @returns Search results with pagination information
   */
  async search(searchParams: any): Promise<{ 
    profiles: CaseManagerProfile[]; 
    total: number; 
    page: number; 
    limit: number; 
  }> {
    try {
      const { 
        query = '', 
        page = 1, 
        limit = 10,
        specialty = null,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = searchParams;

      // Parse page and limit to integers
      const pageNumber = parseInt(page.toString(), 10);
      const limitNumber = parseInt(limit.toString(), 10);
      const offset = (pageNumber - 1) * limitNumber;

      // Build the where clause for the query
      const where: any = {};

      // Add specialty filter if provided
      if (specialty) {
        where.specialty = specialty;
      }

      // Add text search if query is provided
      if (query) {
        where.OR = [
          { 
            certification: { 
              contains: query, 
              mode: 'insensitive' 
            } 
          },
          { 
            specialty: { 
              contains: query, 
              mode: 'insensitive' 
            } 
          },
          { 
            bio: { 
              contains: query, 
              mode: 'insensitive' 
            } 
          }
        ];
      }

      // Determine the sort order
      const orderBy: any = {};
      orderBy[sortBy] = sortOrder.toLowerCase();

      // Execute the query to get matching profiles
      const profiles = await prisma.caseManagerProfile.findMany({
        where,
        orderBy,
        skip: offset,
        take: limitNumber
      });

      // Count total matching records for pagination
      const totalCount = await prisma.caseManagerProfile.count({ where });

      // Transform database results to CaseManagerProfile objects
      const transformedProfiles = profiles.map(profile => new CaseManagerProfileModel({
        ...profile,
        assignedClients: profile.assignedClients ? 
          JSON.parse(profile.assignedClients as string) : 
          null
      }).toJSON());

      // Return profiles with pagination metadata
      return {
        profiles: transformedProfiles,
        total: totalCount,
        page: pageNumber,
        limit: limitNumber
      };
    } catch (error) {
      throw errorFactory.createInternalServerError(
        'Failed to search case manager profiles',
        { searchParams, error: error instanceof Error ? error.message : String(error) },
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Checks if a case manager profile exists
   *
   * @param id Case manager profile ID
   * @returns True if the profile exists, false otherwise
   */
  async exists(id: string): Promise<boolean> {
    try {
      // Query the database to check if a profile with the given ID exists
      const count = await prisma.caseManagerProfile.count({
        where: { id }
      });

      // Return true if found, false otherwise
      return count > 0;
    } catch (error) {
      throw errorFactory.createInternalServerError(
        'Failed to check if case manager profile exists',
        { id, error: error instanceof Error ? error.message : String(error) },
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Adds a client to a case manager's assigned clients list
   *
   * @param caseManagerId Case manager profile ID
   * @param clientId Client ID to add
   * @returns The updated case manager profile
   */
  async addClientToManager(caseManagerId: string, clientId: string): Promise<CaseManagerProfile> {
    try {
      // Find the case manager profile by ID
      const profile = await this.findById(caseManagerId);
      if (!profile) {
        throw errorFactory.createNotFoundError(
          'Case manager profile not found',
          { caseManagerId }
        );
      }

      // Create a CaseManagerProfileModel instance from the profile
      const profileModel = new CaseManagerProfileModel(profile);
      
      // Add the client ID to the assignedClients array
      profileModel.addClient(clientId);
      
      // Update the profile in the database
      return await this.update(caseManagerId, profileModel.toJSON());
    } catch (error) {
      // If a not found error, rethrow it
      if (error instanceof Error && error.message.includes('not found')) {
        throw error;
      }
      
      // Otherwise, wrap it in an internal server error
      throw errorFactory.createInternalServerError(
        'Failed to add client to case manager',
        { caseManagerId, clientId, error: error instanceof Error ? error.message : String(error) },
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Removes a client from a case manager's assigned clients list
   *
   * @param caseManagerId Case manager profile ID
   * @param clientId Client ID to remove
   * @returns The updated case manager profile
   */
  async removeClientFromManager(caseManagerId: string, clientId: string): Promise<CaseManagerProfile> {
    try {
      // Find the case manager profile by ID
      const profile = await this.findById(caseManagerId);
      if (!profile) {
        throw errorFactory.createNotFoundError(
          'Case manager profile not found',
          { caseManagerId }
        );
      }

      // Create a CaseManagerProfileModel instance from the profile
      const profileModel = new CaseManagerProfileModel(profile);
      
      // Remove the client ID from the assignedClients array
      profileModel.removeClient(clientId);
      
      // Update the profile in the database
      return await this.update(caseManagerId, profileModel.toJSON());
    } catch (error) {
      // If a not found error, rethrow it
      if (error instanceof Error && error.message.includes('not found')) {
        throw error;
      }
      
      // Otherwise, wrap it in an internal server error
      throw errorFactory.createInternalServerError(
        'Failed to remove client from case manager',
        { caseManagerId, clientId, error: error instanceof Error ? error.message : String(error) },
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Gets the list of clients assigned to a case manager
   *
   * @param caseManagerId Case manager profile ID
   * @returns Array of client IDs assigned to the case manager
   */
  async getAssignedClients(caseManagerId: string): Promise<string[]> {
    try {
      // Find the case manager profile by ID
      const profile = await this.findById(caseManagerId);
      if (!profile) {
        throw errorFactory.createNotFoundError(
          'Case manager profile not found',
          { caseManagerId }
        );
      }

      // Return the assignedClients array or an empty array if null
      return profile.assignedClients || [];
    } catch (error) {
      // If a not found error, rethrow it
      if (error instanceof Error && error.message.includes('not found')) {
        throw error;
      }
      
      // Otherwise, wrap it in an internal server error
      throw errorFactory.createInternalServerError(
        'Failed to get assigned clients',
        { caseManagerId, error: error instanceof Error ? error.message : String(error) },
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Checks if a client is assigned to a specific case manager
   *
   * @param caseManagerId Case manager profile ID
   * @param clientId Client ID to check
   * @returns True if the client is assigned to the case manager, false otherwise
   */
  async isClientAssignedToManager(caseManagerId: string, clientId: string): Promise<boolean> {
    try {
      // Find the case manager profile by ID
      const profile = await this.findById(caseManagerId);
      if (!profile) {
        return false;
      }

      // Create a CaseManagerProfileModel instance from the profile
      const profileModel = new CaseManagerProfileModel(profile);
      
      // Check if the client ID is in the assignedClients array
      return profileModel.hasClient(clientId);
    } catch (error) {
      throw errorFactory.createInternalServerError(
        'Failed to check if client is assigned to manager',
        { caseManagerId, clientId, error: error instanceof Error ? error.message : String(error) },
        error instanceof Error ? error : undefined
      );
    }
  }
}

// Create a singleton instance of the repository
export const caseManagerProfileRepository = new CaseManagerProfileRepository();