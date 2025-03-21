import { ServiceArea, GeoLocation } from '../types/provider.types';
import { validateCoordinates, calculateHaversineDistance } from '../utils/geo';

/**
 * Model class representing a geographic service area for a provider in the Revolucare platform.
 * Service areas define the geographic region where a provider offers services, including
 * a center location, radius, and optional ZIP code coverage.
 */
export class ServiceAreaModel {
  /** Unique identifier for the service area */
  id: string;
  
  /** ID of the provider this service area belongs to */
  providerId: string;
  
  /** Geographic center location of the service area */
  location: GeoLocation;
  
  /** Radius of the service area in miles */
  radius: number;
  
  /** List of ZIP codes covered by this service area */
  zipCodes: string[];
  
  /** When the service area was created */
  createdAt: Date;
  
  /** When the service area was last updated */
  updatedAt: Date;
  
  /**
   * Creates a new ServiceAreaModel instance with the provided service area data
   * 
   * @param serviceAreaData The service area data to initialize with
   */
  constructor(serviceAreaData: Partial<ServiceArea> = {}) {
    this.id = serviceAreaData.id || '';
    this.providerId = serviceAreaData.providerId || '';
    this.location = serviceAreaData.location || {
      latitude: 0,
      longitude: 0,
      address: '',
      city: '',
      state: '',
      zipCode: ''
    };
    this.radius = serviceAreaData.radius || 0;
    this.zipCodes = serviceAreaData.zipCodes || [];
    this.createdAt = serviceAreaData.createdAt || new Date();
    this.updatedAt = serviceAreaData.updatedAt || new Date();
    
    // Validate the service area data during initialization
    this.validate();
  }
  
  /**
   * Validates the service area data to ensure it meets all requirements
   * 
   * @throws Error if the service area data is invalid
   * @returns Returns true if the service area data is valid, otherwise throws an error
   */
  validate(): boolean {
    // Check if providerId is present
    if (!this.providerId) {
      throw new Error('Provider ID is required for service area');
    }
    
    // Validate location coordinates
    if (!this.location || !validateCoordinates(this.location.latitude, this.location.longitude)) {
      throw new Error('Valid geographic coordinates are required for service area location');
    }
    
    // Validate radius
    if (typeof this.radius !== 'number' || this.radius <= 0) {
      throw new Error('Service area radius must be a positive number');
    }
    
    // Validate ZIP codes if present
    if (this.zipCodes && !Array.isArray(this.zipCodes)) {
      throw new Error('ZIP codes must be an array');
    }
    
    // Validate each ZIP code format if present
    if (this.zipCodes && this.zipCodes.length > 0) {
      for (const zipCode of this.zipCodes) {
        if (typeof zipCode !== 'string' || !zipCode.trim()) {
          throw new Error('ZIP codes must be non-empty strings');
        }
        
        // Basic US ZIP code validation (5 digits or ZIP+4 format)
        if (!/^\d{5}(-\d{4})?$/.test(zipCode)) {
          throw new Error(`Invalid ZIP code format: ${zipCode}`);
        }
      }
    }
    
    return true;
  }
  
  /**
   * Determines if a geographic point is within this service area
   * 
   * This method checks if the given point is within the radius of the service area.
   * If the service area also has ZIP codes defined, it will check if the point's
   * ZIP code is in the list of covered ZIP codes.
   * 
   * @param point The geographic point to check
   * @throws Error if the point coordinates are invalid
   * @returns Returns true if the point is within the service area, false otherwise
   */
  containsPoint(point: GeoLocation): boolean {
    // Validate the point coordinates
    if (!point || !validateCoordinates(point.latitude, point.longitude)) {
      throw new Error('Valid geographic coordinates are required for the point');
    }
    
    // Calculate the distance between the service area center and the point
    const distance = this.distanceToPoint(point);
    
    // Check if the distance is within the radius
    const isWithinRadius = distance <= this.radius;
    
    // If no ZIP codes are specified, just check the radius
    if (!this.zipCodes || this.zipCodes.length === 0) {
      return isWithinRadius;
    }
    
    // If ZIP codes are specified, check if the point's ZIP code is in the list
    const pointZipCode = point.zipCode;
    if (!pointZipCode) {
      // If the point doesn't have a ZIP code, just use the radius check
      return isWithinRadius;
    }
    
    // Check both radius and ZIP code match
    return isWithinRadius && this.zipCodes.includes(pointZipCode);
  }
  
  /**
   * Calculates the distance from the service area center to a geographic point
   * 
   * @param point The geographic point to calculate distance to
   * @throws Error if the point coordinates are invalid
   * @returns Distance in miles from the service area center to the point
   */
  distanceToPoint(point: GeoLocation): number {
    // Validate the point coordinates
    if (!point || !validateCoordinates(point.latitude, point.longitude)) {
      throw new Error('Valid geographic coordinates are required for the point');
    }
    
    // Use the imported calculateHaversineDistance function to calculate the distance
    return calculateHaversineDistance(this.location, point);
  }
  
  /**
   * Adds a ZIP code to the service area coverage
   * 
   * @param zipCode The ZIP code to add
   * @throws Error if the ZIP code is invalid
   * @returns Returns true if the ZIP code was added, false if it already exists
   */
  addZipCode(zipCode: string): boolean {
    // Validate the ZIP code
    if (!zipCode || typeof zipCode !== 'string' || !zipCode.trim()) {
      throw new Error('ZIP code must be a non-empty string');
    }
    
    // Basic US ZIP code validation (5 digits or ZIP+4 format)
    if (!/^\d{5}(-\d{4})?$/.test(zipCode)) {
      throw new Error(`Invalid ZIP code format: ${zipCode}`);
    }
    
    // Check if the ZIP code already exists
    if (this.zipCodes.includes(zipCode)) {
      return false;
    }
    
    // Add the ZIP code
    this.zipCodes.push(zipCode);
    this.updatedAt = new Date();
    return true;
  }
  
  /**
   * Removes a ZIP code from the service area coverage
   * 
   * @param zipCode The ZIP code to remove
   * @returns Returns true if the ZIP code was removed, false if not found
   */
  removeZipCode(zipCode: string): boolean {
    // Find the index of the ZIP code
    const index = this.zipCodes.indexOf(zipCode);
    
    // If the ZIP code is not found, return false
    if (index === -1) {
      return false;
    }
    
    // Remove the ZIP code
    this.zipCodes.splice(index, 1);
    this.updatedAt = new Date();
    return true;
  }
  
  /**
   * Updates the center location of the service area
   * 
   * @param newLocation The new location
   * @throws Error if the new location coordinates are invalid
   * @returns Returns true if the location was updated successfully
   */
  updateLocation(newLocation: GeoLocation): boolean {
    // Validate the new location
    if (!newLocation || !validateCoordinates(newLocation.latitude, newLocation.longitude)) {
      throw new Error('Valid geographic coordinates are required for new location');
    }
    
    // Update the location
    this.location = {...newLocation};
    this.updatedAt = new Date();
    return true;
  }
  
  /**
   * Updates the radius of the service area
   * 
   * @param newRadius The new radius in miles
   * @throws Error if the new radius is invalid
   * @returns Returns true if the radius was updated successfully
   */
  updateRadius(newRadius: number): boolean {
    // Validate the new radius
    if (typeof newRadius !== 'number' || newRadius <= 0) {
      throw new Error('Radius must be a positive number');
    }
    
    // Update the radius
    this.radius = newRadius;
    this.updatedAt = new Date();
    return true;
  }
  
  /**
   * Converts the service area model to a plain JSON object
   * 
   * @returns Service area object ready for serialization
   */
  toJSON(): ServiceArea {
    return {
      id: this.id,
      providerId: this.providerId,
      location: this.location,
      radius: this.radius,
      zipCodes: [...this.zipCodes],
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
  
  /**
   * Creates a service area model from a plain JSON object
   * 
   * @param json The JSON object
   * @returns A new service area model instance
   */
  static fromJSON(json: object): ServiceAreaModel {
    // Parse the JSON if it's a string
    const data = typeof json === 'string' ? JSON.parse(json) : json;
    
    // Convert date strings to Date objects
    if (data.createdAt && typeof data.createdAt === 'string') {
      data.createdAt = new Date(data.createdAt);
    }
    
    if (data.updatedAt && typeof data.updatedAt === 'string') {
      data.updatedAt = new Date(data.updatedAt);
    }
    
    // Create and return a new ServiceAreaModel instance
    return new ServiceAreaModel(data as Partial<ServiceArea>);
  }
  
  /**
   * Calculates a bounding box around the service area for geographic queries
   * 
   * This method is useful for optimizing geographic queries by first filtering
   * locations within the bounding box before doing more expensive precise distance calculations.
   * 
   * @returns Bounding box coordinates (min/max latitude and longitude)
   */
  getBoundingBox(): { minLat: number; maxLat: number; minLng: number; maxLng: number } {
    // Earth's approximate radius in miles
    const earthRadiusInMiles = 3958.8;
    
    // Calculate the approximate miles per degree at this latitude
    const milesPerLatDegree = 69.0; // Approximate miles per degree of latitude
    
    // The miles per degree of longitude varies with latitude
    const milesPerLngDegree = Math.cos(this.location.latitude * (Math.PI / 180)) * 69.0;
    
    // Calculate the latitude offset in degrees
    const latOffset = this.radius / milesPerLatDegree;
    
    // Calculate the longitude offset in degrees
    const lngOffset = this.radius / milesPerLngDegree;
    
    // Calculate the bounding box
    return {
      minLat: this.location.latitude - latOffset,
      maxLat: this.location.latitude + latOffset,
      minLng: this.location.longitude - lngOffset,
      maxLng: this.location.longitude + lngOffset
    };
  }
}