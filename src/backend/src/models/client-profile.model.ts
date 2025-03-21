/**
 * Client profile model that provides data validation, transformation, and business logic
 * for client profiles in the Revolucare platform.
 * 
 * This model serves as an intermediary between the raw database data and the
 * application's domain logic, ensuring data integrity and consistency.
 */

import { 
  ClientProfile, 
  Address, 
  EmergencyContact, 
  MedicalInformation, 
  Insurance 
} from '../types/user.types';
import { errorFactory } from '../utils/error-handler';
import { validation } from '../utils/validation';

/**
 * Model class for client profile data validation and transformation
 */
export class ClientProfileModel {
  /**
   * Creates a new ClientProfileModel instance
   */
  constructor() {}

  /**
   * Validates client profile data against business rules
   * 
   * @param profileData - The client profile data to validate
   * @returns True if the data is valid, throws an error otherwise
   * @throws ValidationError if the data fails validation
   */
  validate(profileData: Partial<ClientProfile>): boolean {
    // Validate dateOfBirth if provided
    if (profileData.dateOfBirth) {
      if (!validation.isValidDate(profileData.dateOfBirth)) {
        throw errorFactory.createValidationError(
          'Invalid date of birth format',
          { field: 'dateOfBirth', value: profileData.dateOfBirth }
        );
      }
      
      // Check that date is not in the future
      const now = new Date();
      const dob = new Date(profileData.dateOfBirth);
      if (dob > now) {
        throw errorFactory.createValidationError(
          'Date of birth cannot be in the future',
          { field: 'dateOfBirth', value: profileData.dateOfBirth }
        );
      }
    }
    
    // Validate phone number if provided
    if (profileData.phone) {
      if (!validation.isValidPhone(profileData.phone)) {
        throw errorFactory.createValidationError(
          'Invalid phone number format',
          { field: 'phone', value: profileData.phone }
        );
      }
    }
    
    // Validate address if provided
    if (profileData.address) {
      this.validateAddress(profileData.address);
    }
    
    // Validate emergency contact if provided
    if (profileData.emergencyContact) {
      this.validateEmergencyContact(profileData.emergencyContact);
    }
    
    // Validate medical information if provided
    if (profileData.medicalInformation) {
      this.validateMedicalInformation(profileData.medicalInformation);
    }
    
    // Validate insurance if provided
    if (profileData.insurance) {
      this.validateInsurance(profileData.insurance);
    }
    
    return true;
  }
  
  /**
   * Transforms client profile data for database storage
   * 
   * @param profileData - The client profile data to transform
   * @returns Data formatted for database storage
   */
  toDatabase(profileData: Partial<ClientProfile>): object {
    const dbData: Record<string, any> = { ...profileData };
    
    // Convert complex objects to JSON strings for database storage
    if (dbData.address) {
      dbData.address = JSON.stringify(dbData.address);
    }
    
    if (dbData.emergencyContact) {
      dbData.emergencyContact = JSON.stringify(dbData.emergencyContact);
    }
    
    if (dbData.medicalInformation) {
      dbData.medicalInformation = JSON.stringify(dbData.medicalInformation);
    }
    
    if (dbData.insurance) {
      dbData.insurance = JSON.stringify(dbData.insurance);
    }
    
    if (dbData.preferences) {
      dbData.preferences = JSON.stringify(dbData.preferences);
    }
    
    // Format dates to ISO strings if needed
    if (dbData.dateOfBirth instanceof Date) {
      dbData.dateOfBirth = dbData.dateOfBirth.toISOString();
    }
    
    // Remove any properties not in the database schema
    // In the future, if there are properties to exclude, they would be removed here
    
    return dbData;
  }
  
  /**
   * Transforms database data to client profile domain model
   * 
   * @param dbData - The database data to transform
   * @returns Client profile domain model
   */
  fromDatabase(dbData: any): ClientProfile {
    if (!dbData) {
      throw new Error('Cannot transform null or undefined database data');
    }
    
    const profileData: Partial<ClientProfile> = { ...dbData };
    
    // Parse JSON fields back to objects
    if (typeof profileData.address === 'string') {
      try {
        profileData.address = JSON.parse(profileData.address) as Address;
      } catch (error) {
        profileData.address = null;
      }
    }
    
    if (typeof profileData.emergencyContact === 'string') {
      try {
        profileData.emergencyContact = JSON.parse(profileData.emergencyContact) as EmergencyContact;
      } catch (error) {
        profileData.emergencyContact = null;
      }
    }
    
    if (typeof profileData.medicalInformation === 'string') {
      try {
        profileData.medicalInformation = JSON.parse(profileData.medicalInformation) as MedicalInformation;
      } catch (error) {
        profileData.medicalInformation = null;
      }
    }
    
    if (typeof profileData.insurance === 'string') {
      try {
        profileData.insurance = JSON.parse(profileData.insurance) as Insurance;
      } catch (error) {
        profileData.insurance = null;
      }
    }
    
    if (typeof profileData.preferences === 'string') {
      try {
        profileData.preferences = JSON.parse(profileData.preferences);
      } catch (error) {
        profileData.preferences = null;
      }
    }
    
    // Convert date strings to Date objects
    if (profileData.dateOfBirth && typeof profileData.dateOfBirth === 'string') {
      profileData.dateOfBirth = new Date(profileData.dateOfBirth);
    }
    
    if (profileData.createdAt && typeof profileData.createdAt === 'string') {
      profileData.createdAt = new Date(profileData.createdAt);
    }
    
    if (profileData.updatedAt && typeof profileData.updatedAt === 'string') {
      profileData.updatedAt = new Date(profileData.updatedAt);
    }
    
    return profileData as ClientProfile;
  }
  
  /**
   * Validates address data structure
   * 
   * @param address - The address to validate
   * @returns True if valid, throws an error otherwise
   * @throws ValidationError if the address fails validation
   */
  validateAddress(address: Address): boolean {
    // Check if required fields are present
    if (!address.street) {
      throw errorFactory.createValidationError(
        'Street is required in address',
        { field: 'address.street', value: address.street }
      );
    }
    
    if (!address.city) {
      throw errorFactory.createValidationError(
        'City is required in address',
        { field: 'address.city', value: address.city }
      );
    }
    
    if (!address.state) {
      throw errorFactory.createValidationError(
        'State is required in address',
        { field: 'address.state', value: address.state }
      );
    }
    
    if (!address.zipCode) {
      throw errorFactory.createValidationError(
        'Zip code is required in address',
        { field: 'address.zipCode', value: address.zipCode }
      );
    }
    
    // Validate zip code format if country is US
    if (address.country === 'US' || address.country === 'USA' || !address.country) {
      const zipRegex = /^\d{5}(-\d{4})?$/;
      if (!zipRegex.test(address.zipCode)) {
        throw errorFactory.createValidationError(
          'Invalid US zip code format',
          { field: 'address.zipCode', value: address.zipCode }
        );
      }
    }
    
    return true;
  }
  
  /**
   * Validates emergency contact data structure
   * 
   * @param contact - The emergency contact to validate
   * @returns True if valid, throws an error otherwise
   * @throws ValidationError if the emergency contact fails validation
   */
  validateEmergencyContact(contact: EmergencyContact): boolean {
    // Check if required fields are present
    if (!contact.name) {
      throw errorFactory.createValidationError(
        'Name is required for emergency contact',
        { field: 'emergencyContact.name', value: contact.name }
      );
    }
    
    if (!contact.relationship) {
      throw errorFactory.createValidationError(
        'Relationship is required for emergency contact',
        { field: 'emergencyContact.relationship', value: contact.relationship }
      );
    }
    
    if (!contact.phone) {
      throw errorFactory.createValidationError(
        'Phone number is required for emergency contact',
        { field: 'emergencyContact.phone', value: contact.phone }
      );
    }
    
    // Validate phone number
    if (!validation.isValidPhone(contact.phone)) {
      throw errorFactory.createValidationError(
        'Invalid phone number format for emergency contact',
        { field: 'emergencyContact.phone', value: contact.phone }
      );
    }
    
    // Validate email if provided
    if (contact.email && !validation.isValidEmail(contact.email)) {
      throw errorFactory.createValidationError(
        'Invalid email format for emergency contact',
        { field: 'emergencyContact.email', value: contact.email }
      );
    }
    
    return true;
  }
  
  /**
   * Validates medical information data structure
   * 
   * @param medInfo - The medical information to validate
   * @returns True if valid, throws an error otherwise
   * @throws ValidationError if the medical information fails validation
   */
  validateMedicalInformation(medInfo: MedicalInformation): boolean {
    // Check if required arrays are present and valid
    if (!Array.isArray(medInfo.conditions)) {
      throw errorFactory.createValidationError(
        'Conditions must be an array',
        { field: 'medicalInformation.conditions', value: medInfo.conditions }
      );
    }
    
    if (!Array.isArray(medInfo.allergies)) {
      throw errorFactory.createValidationError(
        'Allergies must be an array',
        { field: 'medicalInformation.allergies', value: medInfo.allergies }
      );
    }
    
    if (!Array.isArray(medInfo.medications)) {
      throw errorFactory.createValidationError(
        'Medications must be an array',
        { field: 'medicalInformation.medications', value: medInfo.medications }
      );
    }
    
    return true;
  }
  
  /**
   * Validates insurance data structure
   * 
   * @param insurance - The insurance information to validate
   * @returns True if valid, throws an error otherwise
   * @throws ValidationError if the insurance fails validation
   */
  validateInsurance(insurance: Insurance): boolean {
    // Check if required fields are present
    if (!insurance.provider) {
      throw errorFactory.createValidationError(
        'Provider is required for insurance',
        { field: 'insurance.provider', value: insurance.provider }
      );
    }
    
    if (!insurance.policyNumber) {
      throw errorFactory.createValidationError(
        'Policy number is required for insurance',
        { field: 'insurance.policyNumber', value: insurance.policyNumber }
      );
    }
    
    return true;
  }
  
  /**
   * Merges existing profile with update data
   * 
   * @param existingProfile - The existing client profile
   * @param updateData - The data to update with
   * @returns Merged client profile
   */
  merge(existingProfile: ClientProfile, updateData: Partial<ClientProfile>): ClientProfile {
    // Create a copy of the existing profile
    const merged: ClientProfile = { ...existingProfile };
    
    // Update simple properties
    if (updateData.dateOfBirth !== undefined) {
      merged.dateOfBirth = updateData.dateOfBirth;
    }
    
    if (updateData.gender !== undefined) {
      merged.gender = updateData.gender;
    }
    
    if (updateData.phone !== undefined) {
      merged.phone = updateData.phone;
    }
    
    // Deep merge complex objects
    if (updateData.address) {
      merged.address = {
        ...(merged.address || {}),
        ...updateData.address
      };
    }
    
    if (updateData.emergencyContact) {
      merged.emergencyContact = {
        ...(merged.emergencyContact || {}),
        ...updateData.emergencyContact
      };
    }
    
    if (updateData.medicalInformation) {
      merged.medicalInformation = {
        ...(merged.medicalInformation || {}),
        ...updateData.medicalInformation,
        // Special handling for arrays to ensure they're replaced instead of merged
        conditions: updateData.medicalInformation.conditions || merged.medicalInformation?.conditions || [],
        allergies: updateData.medicalInformation.allergies || merged.medicalInformation?.allergies || [],
        medications: updateData.medicalInformation.medications || merged.medicalInformation?.medications || []
      };
    }
    
    if (updateData.insurance) {
      merged.insurance = {
        ...(merged.insurance || {}),
        ...updateData.insurance,
        // Deep merge for coverageDetails
        coverageDetails: {
          ...(merged.insurance?.coverageDetails || {}),
          ...(updateData.insurance.coverageDetails || {})
        }
      };
    }
    
    if (updateData.preferences) {
      merged.preferences = {
        ...(merged.preferences || {}),
        ...updateData.preferences
      };
    }
    
    return merged;
  }
}

// Create a singleton instance for use throughout the application
export const clientProfileModel = new ClientProfileModel();