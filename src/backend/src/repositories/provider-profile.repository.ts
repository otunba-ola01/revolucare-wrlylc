import { prisma } from '../config/database';
import { redisClient, getCacheKey } from '../config/redis';
import { ProviderProfile, ProviderProfileUpdateDTO, ProviderSearchCriteria } from '../types/provider.types';
import { ServiceType } from '../constants/service-types';
import { PaginatedResponse } from '../types/response.types';
import { IProviderRepository } from '../interfaces/provider.interface';
import { ProviderProfileModel } from '../models/provider-profile.model';
import { logger } from '../utils/logger';
import { executeWithTransaction } from '../config/database';
import { v4 as uuidv4 } from 'uuid'; // uuid@^9.0.0

/**
 * Generates a cache key for provider profile data
 * @param providerId - Provider ID to create cache key for
 * @returns Formatted cache key
 */
export function getProviderProfileCacheKey(providerId: string): string {
  return getCacheKey('provider-profile', providerId);
}

/**
 * Maps a database provider record to a ProviderProfile object
 * @param dbProvider - Database provider record
 * @returns Mapped provider profile object
 */
function mapDbProviderToModel(dbProvider: any): ProviderProfile {
  const model = new ProviderProfileModel({
    id: dbProvider.id,
    userId: dbProvider.userId,
    organizationName: dbProvider.organizationName,
    licenseNumber: dbProvider.licenseNumber,
    licenseExpiration: dbProvider.licenseExpiration,
    serviceTypes: dbProvider.serviceTypes || [],
    bio: dbProvider.bio,
    specializations: dbProvider.specializations || [],
    insuranceAccepted: dbProvider.insuranceAccepted || [],
    address: dbProvider.address,
    phone: dbProvider.phone,
    averageRating: dbProvider.averageRating || 0,
    reviewCount: dbProvider.reviewCount || 0,
    createdAt: dbProvider.createdAt,
    updatedAt: dbProvider.updatedAt
  });
  
  return model.toJSON();
}

/**
 * Repository class for managing provider profile data in the database
 * Implements the IProviderRepository interface
 */
export class ProviderProfileRepository implements IProviderRepository {
  /**
   * Finds a provider profile by its ID
   * @param id - Provider ID to search for
   * @returns The provider profile or null if not found
   */
  async findById(id: string): Promise<ProviderProfile | null> {
    logger.debug(`Finding provider profile by ID: ${id}`);
    
    // Try to get from cache first
    const cacheKey = getProviderProfileCacheKey(id);
    try {
      const cachedProvider = await redisClient.get(cacheKey);
      if (cachedProvider) {
        logger.debug(`Provider profile found in cache: ${id}`);
        return JSON.parse(cachedProvider) as ProviderProfile;
      }
    } catch (error) {
      logger.error(`Error retrieving provider from cache`, { error: error instanceof Error ? error.message : String(error) });
      // Continue to database query if cache fails
    }
    
    // Not in cache, query the database
    try {
      const provider = await prisma.providerProfile.findUnique({
        where: { id }
      });
      
      if (!provider) {
        logger.debug(`Provider profile not found for ID: ${id}`);
        return null;
      }
      
      // Map to provider model and transform
      const providerProfile = mapDbProviderToModel(provider);
      
      // Cache the result
      try {
        await redisClient.set(
          cacheKey,
          JSON.stringify(providerProfile),
          'EX',
          3600 // Cache for 1 hour
        );
        logger.debug(`Provider profile cached for ID: ${id}`);
      } catch (error) {
        logger.error(`Error caching provider profile`, { error: error instanceof Error ? error.message : String(error) });
        // Continue even if caching fails
      }
      
      return providerProfile;
    } catch (error) {
      logger.error(`Error finding provider profile by ID: ${id}`, { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }
  
  /**
   * Finds a provider profile by user ID
   * @param userId - User ID to search for
   * @returns The provider profile or null if not found
   */
  async findByUserId(userId: string): Promise<ProviderProfile | null> {
    logger.debug(`Finding provider profile by user ID: ${userId}`);
    
    try {
      const provider = await prisma.providerProfile.findUnique({
        where: { userId }
      });
      
      if (!provider) {
        logger.debug(`Provider profile not found for user ID: ${userId}`);
        return null;
      }
      
      // Map to provider model and transform
      const providerProfile = mapDbProviderToModel(provider);
      
      // Cache using the provider ID
      try {
        const cacheKey = getProviderProfileCacheKey(provider.id);
        await redisClient.set(
          cacheKey,
          JSON.stringify(providerProfile),
          'EX',
          3600 // Cache for 1 hour
        );
        logger.debug(`Provider profile cached for ID: ${provider.id}`);
      } catch (error) {
        logger.error(`Error caching provider profile`, { error: error instanceof Error ? error.message : String(error) });
        // Continue even if caching fails
      }
      
      return providerProfile;
    } catch (error) {
      logger.error(`Error finding provider profile by user ID: ${userId}`, { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }
  
  /**
   * Creates a new provider profile
   * @param data - Provider profile data to create
   * @returns The newly created provider profile
   */
  async create(data: Partial<ProviderProfile>): Promise<ProviderProfile> {
    logger.info(`Creating new provider profile`);
    
    // Generate ID if not provided
    const id = data.id || uuidv4();
    
    // Create model and validate
    const providerModel = new ProviderProfileModel({
      ...data,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Validate the data
    providerModel.validate();
    
    try {
      // Use transaction for atomic operation
      const provider = await executeWithTransaction(async (tx) => {
        return await tx.providerProfile.create({
          data: {
            id: providerModel.id,
            userId: providerModel.userId,
            organizationName: providerModel.organizationName,
            licenseNumber: providerModel.licenseNumber,
            licenseExpiration: providerModel.licenseExpiration,
            serviceTypes: providerModel.serviceTypes,
            bio: providerModel.bio,
            specializations: providerModel.specializations,
            insuranceAccepted: providerModel.insuranceAccepted,
            address: providerModel.address,
            phone: providerModel.phone,
            averageRating: providerModel.averageRating,
            reviewCount: providerModel.reviewCount,
            createdAt: providerModel.createdAt,
            updatedAt: providerModel.updatedAt
          }
        });
      });
      
      // Map to provider model
      const providerProfile = mapDbProviderToModel(provider);
      
      // Cache the new provider
      try {
        const cacheKey = getProviderProfileCacheKey(providerProfile.id);
        await redisClient.set(
          cacheKey,
          JSON.stringify(providerProfile),
          'EX',
          3600 // Cache for 1 hour
        );
      } catch (error) {
        logger.error(`Error caching new provider profile`, { error: error instanceof Error ? error.message : String(error) });
        // Continue even if caching fails
      }
      
      logger.info(`Provider profile created successfully`, { providerId: providerProfile.id });
      return providerProfile;
    } catch (error) {
      logger.error(`Error creating provider profile`, { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }
  
  /**
   * Updates an existing provider profile
   * @param id - Provider ID to update
   * @param data - Provider profile data to update
   * @returns The updated provider profile
   */
  async update(id: string, data: ProviderProfileUpdateDTO): Promise<ProviderProfile> {
    logger.info(`Updating provider profile: ${id}`);
    
    // Check if provider exists
    const existingProvider = await this.findById(id);
    if (!existingProvider) {
      logger.error(`Provider profile not found for update: ${id}`);
      throw new Error(`Provider profile not found: ${id}`);
    }
    
    // Create model with combined data and validate
    const providerModel = new ProviderProfileModel({
      ...existingProvider,
      ...data,
      updatedAt: new Date()
    });
    
    // Validate the data
    providerModel.validate();
    
    try {
      // Use transaction for atomic operation
      const provider = await executeWithTransaction(async (tx) => {
        return await tx.providerProfile.update({
          where: { id },
          data: {
            organizationName: providerModel.organizationName,
            licenseNumber: providerModel.licenseNumber,
            licenseExpiration: providerModel.licenseExpiration,
            serviceTypes: providerModel.serviceTypes,
            bio: providerModel.bio,
            specializations: providerModel.specializations,
            insuranceAccepted: providerModel.insuranceAccepted,
            address: providerModel.address,
            phone: providerModel.phone,
            updatedAt: providerModel.updatedAt
          }
        });
      });
      
      // Map to provider model
      const updatedProvider = mapDbProviderToModel(provider);
      
      // Invalidate cache
      await this.invalidateCache(id);
      
      logger.info(`Provider profile updated successfully`, { providerId: id });
      return updatedProvider;
    } catch (error) {
      logger.error(`Error updating provider profile: ${id}`, { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }
  
  /**
   * Deletes a provider profile
   * @param id - Provider ID to delete
   * @returns True if the profile was deleted, false otherwise
   */
  async delete(id: string): Promise<boolean> {
    logger.info(`Deleting provider profile: ${id}`);
    
    try {
      // Use transaction for atomic operation
      await executeWithTransaction(async (tx) => {
        await tx.providerProfile.delete({
          where: { id }
        });
      });
      
      // Invalidate cache
      await this.invalidateCache(id);
      
      logger.info(`Provider profile deleted successfully`, { providerId: id });
      return true;
    } catch (error) {
      logger.error(`Error deleting provider profile: ${id}`, { error: error instanceof Error ? error.message : String(error) });
      return false;
    }
  }
  
  /**
   * Searches for providers based on search criteria
   * @param criteria - Search criteria including filters and pagination
   * @returns Paginated list of matching providers
   */
  async search(criteria: ProviderSearchCriteria): Promise<PaginatedResponse<ProviderProfile>> {
    logger.debug(`Searching providers with criteria`, { criteria });
    
    // Default pagination values
    const page = criteria.page || 1;
    const limit = criteria.limit || 10;
    const skip = (page - 1) * limit;
    
    // Build the query
    const whereClause: Record<string, any> = {};
    
    // Filter by service types if specified
    if (criteria.serviceTypes && criteria.serviceTypes.length > 0) {
      whereClause.serviceTypes = {
        hasSome: criteria.serviceTypes
      };
    }
    
    // Filter by location if specified
    if (criteria.location && criteria.distance) {
      // For PostgreSQL with PostGIS extension, we would use a geo query
      // This is a simplified implementation
      if (criteria.location.latitude && criteria.location.longitude) {
        // In a real implementation, this would use a PostGIS function like ST_DWithin
        // Here we're just logging that the filter would be applied
        logger.debug(`Location filter being applied`, { 
          location: criteria.location, 
          distance: criteria.distance 
        });
        
        // We'll continue with other filters but note that location filtering
        // would need to be applied post-query or using a database extension
      }
    } else if (criteria.zipCode) {
      // Filter by zip code if location coordinates not provided
      whereClause['address.zipCode'] = criteria.zipCode;
    }
    
    // Filter by insurance if specified
    if (criteria.insurance) {
      whereClause.insuranceAccepted = {
        has: criteria.insurance
      };
    }
    
    // Filter by minimum rating if specified
    if (criteria.minRating !== null && criteria.minRating !== undefined) {
      whereClause.averageRating = {
        gte: criteria.minRating
      };
    }
    
    // Filter by specializations if specified
    if (criteria.specializations && criteria.specializations.length > 0) {
      whereClause.specializations = {
        hasSome: criteria.specializations
      };
    }
    
    try {
      // Execute count query for total items
      const totalItems = await prisma.providerProfile.count({
        where: whereClause
      });
      
      // Calculate total pages
      const totalPages = Math.ceil(totalItems / limit);
      
      // Execute main query with pagination
      const providers = await prisma.providerProfile.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: {
          [criteria.sortBy || 'createdAt']: criteria.sortOrder || 'desc'
        }
      });
      
      // Map results to provider models
      const providerProfiles = providers.map(provider => mapDbProviderToModel(provider));
      
      logger.debug(`Provider search completed`, { totalItems, page, limit });
      
      return {
        success: true,
        message: 'Providers retrieved successfully',
        data: providerProfiles,
        pagination: {
          page,
          limit,
          totalItems,
          totalPages
        }
      };
    } catch (error) {
      logger.error(`Error searching providers`, { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }
  
  /**
   * Updates a provider's average rating and review count
   * @param providerId - Provider ID to update
   * @param newRating - New average rating
   * @param reviewCount - New review count
   * @returns The updated provider profile
   */
  async updateRating(providerId: string, newRating: number, reviewCount: number): Promise<ProviderProfile> {
    logger.info(`Updating provider rating: ${providerId}`);
    
    // Validate rating values
    if (newRating < 0 || newRating > 5) {
      throw new Error('Rating must be between 0 and 5');
    }
    
    if (reviewCount < 0 || !Number.isInteger(reviewCount)) {
      throw new Error('Review count must be a non-negative integer');
    }
    
    try {
      // Use transaction for atomic operation
      const provider = await executeWithTransaction(async (tx) => {
        return await tx.providerProfile.update({
          where: { id: providerId },
          data: {
            averageRating: newRating,
            reviewCount: reviewCount,
            updatedAt: new Date()
          }
        });
      });
      
      // Map to provider model
      const updatedProvider = mapDbProviderToModel(provider);
      
      // Invalidate cache
      await this.invalidateCache(providerId);
      
      logger.info(`Provider rating updated successfully`, { providerId, newRating, reviewCount });
      return updatedProvider;
    } catch (error) {
      logger.error(`Error updating provider rating: ${providerId}`, { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }
  
  /**
   * Finds providers that offer a specific service type
   * @param serviceType - Service type to search for
   * @returns Array of providers offering the service type
   */
  async findProvidersWithServiceType(serviceType: ServiceType): Promise<ProviderProfile[]> {
    logger.debug(`Finding providers with service type: ${serviceType}`);
    
    try {
      const providers = await prisma.providerProfile.findMany({
        where: {
          serviceTypes: {
            has: serviceType
          }
        }
      });
      
      // Map results to provider models
      const providerProfiles = providers.map(provider => mapDbProviderToModel(provider));
      
      logger.debug(`Found ${providerProfiles.length} providers with service type: ${serviceType}`);
      return providerProfiles;
    } catch (error) {
      logger.error(`Error finding providers with service type: ${serviceType}`, { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }
  
  /**
   * Finds providers within a geographic area
   * @param latitude - Latitude coordinate of the center point
   * @param longitude - Longitude coordinate of the center point
   * @param radiusInMiles - Radius in miles to search within
   * @returns Array of providers in the specified area
   */
  async findProvidersInArea(latitude: number, longitude: number, radiusInMiles: number): Promise<ProviderProfile[]> {
    logger.debug(`Finding providers in area: (${latitude}, ${longitude}) with radius ${radiusInMiles} miles`);
    
    try {
      // In a production implementation, this would use a PostGIS query with ST_DWithin
      // For this implementation, we'll use a simplified approach
      
      // Simplified implementation that would be replaced with proper geospatial query in production
      // This calculates a rough bounding box to filter providers (not accurate for large distances)
      const milesPerLatDegree = 69;
      const milesPerLngDegree = Math.cos(latitude * (Math.PI / 180)) * 69;
      
      const latDelta = radiusInMiles / milesPerLatDegree;
      const lngDelta = radiusInMiles / milesPerLngDegree;
      
      const minLat = latitude - latDelta;
      const maxLat = latitude + latDelta;
      const minLng = longitude - lngDelta;
      const maxLng = longitude + lngDelta;
      
      // In a real implementation with PostGIS, we would use something like:
      // SELECT * FROM provider_profiles
      // WHERE ST_DWithin(
      //   geography(ST_MakePoint(longitude, latitude)),
      //   geography(ST_MakePoint($longitude, $latitude)),
      //   $radiusInMiles * 1609.34  -- convert miles to meters
      // );
      
      // For now, we'll do a simpler query and filter results in memory
      const providers = await prisma.providerProfile.findMany();
      
      // Filter providers based on bounding box (simplified approach)
      const filteredProviders = providers.filter(provider => {
        // Skip providers without location data
        if (!provider.address || !provider.address.latitude || !provider.address.longitude) {
          return false;
        }
        
        const providerLat = provider.address.latitude;
        const providerLng = provider.address.longitude;
        
        // Check if provider is within bounding box
        return (
          providerLat >= minLat &&
          providerLat <= maxLat &&
          providerLng >= minLng &&
          providerLng <= maxLng
        );
      });
      
      // Map results to provider models
      const providerProfiles = filteredProviders.map(provider => mapDbProviderToModel(provider));
      
      logger.debug(`Found ${providerProfiles.length} providers in specified area`);
      return providerProfiles;
    } catch (error) {
      logger.error(`Error finding providers in area`, { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }
  
  /**
   * Finds providers that accept a specific insurance
   * @param insurance - Insurance name to search for
   * @returns Array of providers accepting the insurance
   */
  async findProvidersWithInsurance(insurance: string): Promise<ProviderProfile[]> {
    logger.debug(`Finding providers that accept insurance: ${insurance}`);
    
    try {
      const providers = await prisma.providerProfile.findMany({
        where: {
          insuranceAccepted: {
            has: insurance
          }
        }
      });
      
      // Map results to provider models
      const providerProfiles = providers.map(provider => mapDbProviderToModel(provider));
      
      logger.debug(`Found ${providerProfiles.length} providers that accept insurance: ${insurance}`);
      return providerProfiles;
    } catch (error) {
      logger.error(`Error finding providers with insurance: ${insurance}`, { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }
  
  /**
   * Invalidates cache entries for a provider's profile
   * @param providerId - Provider ID to invalidate cache for
   */
  async invalidateCache(providerId: string): Promise<void> {
    logger.debug(`Invalidating cache for provider: ${providerId}`);
    
    try {
      const cacheKey = getProviderProfileCacheKey(providerId);
      await redisClient.del(cacheKey);
      logger.debug(`Cache invalidated for provider: ${providerId}`);
    } catch (error) {
      logger.error(`Error invalidating provider cache`, { error: error instanceof Error ? error.message : String(error) });
      // Don't throw error for cache invalidation failures
    }
  }
}