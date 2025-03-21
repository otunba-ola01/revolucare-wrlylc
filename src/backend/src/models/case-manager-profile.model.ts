/**
 * Model class representing a case manager profile in the Revolucare platform.
 * 
 * This model provides methods for creating, validating, and transforming case manager profile 
 * data, serving as a bridge between the database schema and application logic.
 */
import { CaseManagerProfile } from '../types/user.types';

export class CaseManagerProfileModel {
  id: string;
  userId: string;
  certification: string | null;
  specialty: string | null;
  bio: string | null;
  assignedClients: string[] | null;
  createdAt: Date;
  updatedAt: Date;

  /**
   * Creates a new CaseManagerProfileModel instance with the provided profile data
   * 
   * @param profileData Partial case manager profile data to initialize the model
   */
  constructor(profileData: Partial<CaseManagerProfile> = {}) {
    this.id = profileData.id || '';
    this.userId = profileData.userId || '';
    this.certification = profileData.certification || null;
    this.specialty = profileData.specialty || null;
    this.bio = profileData.bio || null;
    this.assignedClients = profileData.assignedClients || null;
    this.createdAt = profileData.createdAt || new Date();
    this.updatedAt = profileData.updatedAt || new Date();
  }

  /**
   * Validates the case manager profile data to ensure it meets all requirements
   * 
   * @returns true if the profile data is valid, otherwise throws an error
   * @throws Error if validation fails
   */
  validate(): boolean {
    // Check required fields
    if (!this.userId) {
      throw new Error('Case manager profile requires a user ID');
    }

    // Validate certification format if provided
    if (this.certification !== null && this.certification.trim() === '') {
      throw new Error('Certification cannot be an empty string');
    }

    // Validate specialty format if provided
    if (this.specialty !== null && this.specialty.trim() === '') {
      throw new Error('Specialty cannot be an empty string');
    }

    // Validate bio length if provided
    if (this.bio !== null) {
      if (this.bio.trim() === '') {
        throw new Error('Bio cannot be an empty string');
      }
      
      if (this.bio.length > 1000) {
        throw new Error('Bio must be less than 1000 characters');
      }
    }

    // Validate assignedClients if provided
    if (this.assignedClients !== null) {
      if (!Array.isArray(this.assignedClients)) {
        throw new Error('Assigned clients must be an array');
      }
      
      // Check that all client IDs are non-empty strings
      if (this.assignedClients.some(clientId => typeof clientId !== 'string' || clientId.trim() === '')) {
        throw new Error('All assigned client IDs must be valid strings');
      }
    }

    return true;
  }

  /**
   * Converts the case manager profile model to a plain JSON object
   * 
   * @returns Case manager profile object
   */
  toJSON(): CaseManagerProfile {
    return {
      id: this.id,
      userId: this.userId,
      certification: this.certification,
      specialty: this.specialty,
      bio: this.bio,
      assignedClients: this.assignedClients,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Converts the case manager profile model to a format compatible with Prisma ORM
   * 
   * @returns Prisma-compatible object for database operations
   */
  toPrisma(): any {
    // Create a base object with all properties
    const prismaObject: any = {
      id: this.id || undefined,
      userId: this.userId,
      certification: this.certification,
      specialty: this.specialty,
      bio: this.bio,
      assignedClients: this.assignedClients ? JSON.stringify(this.assignedClients) : null,
      createdAt: this.id ? undefined : this.createdAt, // Only include for new records
      updatedAt: this.updatedAt
    };

    // Remove undefined values for cleaner object
    Object.keys(prismaObject).forEach(key => {
      if (prismaObject[key] === undefined) {
        delete prismaObject[key];
      }
    });

    return prismaObject;
  }

  /**
   * Checks if a specific client is assigned to this case manager
   * 
   * @param clientId The ID of the client to check
   * @returns true if the client is assigned to this case manager, otherwise false
   */
  hasClient(clientId: string): boolean {
    if (!this.assignedClients) {
      return false;
    }
    
    return this.assignedClients.includes(clientId);
  }

  /**
   * Adds a client to the case manager's assigned clients list
   * 
   * @param clientId The ID of the client to add
   */
  addClient(clientId: string): void {
    if (!this.assignedClients) {
      this.assignedClients = [];
    }
    
    if (!this.hasClient(clientId)) {
      this.assignedClients.push(clientId);
    }
  }

  /**
   * Removes a client from the case manager's assigned clients list
   * 
   * @param clientId The ID of the client to remove
   */
  removeClient(clientId: string): void {
    if (!this.assignedClients) {
      return;
    }
    
    this.assignedClients = this.assignedClients.filter(id => id !== clientId);
  }
}