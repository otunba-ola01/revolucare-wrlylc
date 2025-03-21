/**
 * Utility module providing geographic and location-based functionality for the Revolucare platform.
 * 
 * This module contains helper functions for distance calculations, coordinate transformations, and
 * geospatial operations to support provider matching, service area management, and location-based features.
 * 
 * @module utils/geo
 */

import haversine from 'haversine-distance'; // v1.2.1
import { logger } from './logger';
import { GeoLocation, ServiceArea } from '../types/provider.types';
import { geocodeAddress, calculateDistance } from '../integrations/google-maps';

/**
 * Calculates the distance between two geographic coordinates using the Haversine formula
 * 
 * @param point1 - First geographic coordinate
 * @param point2 - Second geographic coordinate
 * @returns Distance in miles between the two points
 */
export function calculateHaversineDistance(
  point1: GeoLocation | { latitude: number; longitude: number },
  point2: GeoLocation | { latitude: number; longitude: number }
): number {
  try {
    // Validate inputs
    if (!point1 || !point2) {
      throw new Error('Both points are required for distance calculation');
    }
    
    // Ensure coordinates are valid numbers
    if (isNaN(point1.latitude) || isNaN(point1.longitude) || 
        isNaN(point2.latitude) || isNaN(point2.longitude)) {
      throw new Error('Invalid coordinates for distance calculation');
    }
    
    // Format points for haversine calculation
    const p1 = { latitude: point1.latitude, longitude: point1.longitude };
    const p2 = { latitude: point2.latitude, longitude: point2.longitude };
    
    // Calculate distance in meters using haversine
    const distanceInMeters = haversine(p1, p2);
    
    // Convert to miles
    const distanceInMiles = distanceInMeters / 1609.34;
    
    // Return rounded distance
    return parseFloat(distanceInMiles.toFixed(2));
  } catch (error) {
    logger.error('Error calculating haversine distance', { 
      error: (error as Error).message,
      point1,
      point2
    });
    throw error;
  }
}

/**
 * Determines if a point is within a specified radius of a center point
 * 
 * @param center - The center point to measure from
 * @param point - The point to check
 * @param radiusMiles - The radius in miles
 * @returns True if the point is within the radius, false otherwise
 */
export function isPointInRadius(
  center: GeoLocation | { latitude: number; longitude: number },
  point: GeoLocation | { latitude: number; longitude: number },
  radiusMiles: number
): boolean {
  // Calculate the distance between the center and point
  const distance = calculateHaversineDistance(center, point);
  
  // Check if the distance is less than or equal to the radius
  return distance <= radiusMiles;
}

/**
 * Checks if a location point is within a provider's service area
 * 
 * @param serviceArea - The provider's service area
 * @param point - The location to check
 * @returns True if the point is within the service area, false otherwise
 */
export function isPointInServiceArea(
  serviceArea: ServiceArea,
  point: GeoLocation | { latitude: number; longitude: number }
): boolean {
  try {
    // Check if the point is within the radius of the service area
    const isInRadius = isPointInRadius(
      serviceArea.location,
      point,
      serviceArea.radius
    );
    
    // If the service area has ZIP codes defined, also check if the point's ZIP code matches
    if (serviceArea.zipCodes && serviceArea.zipCodes.length > 0 && 'zipCode' in point) {
      return isInRadius && serviceArea.zipCodes.includes(point.zipCode);
    }
    
    // If no ZIP codes are defined or the point doesn't have a ZIP code, just check the radius
    return isInRadius;
  } catch (error) {
    logger.error('Error checking if point is in service area', {
      error: (error as Error).message,
      serviceAreaId: serviceArea.id,
      point
    });
    return false;
  }
}

/**
 * Calculates a bounding box around a center point with a specified radius
 * 
 * @param center - The center point of the bounding box
 * @param radiusMiles - The radius in miles
 * @returns Bounding box coordinates (min/max latitude and longitude)
 */
export function calculateBoundingBox(
  center: GeoLocation | { latitude: number; longitude: number },
  radiusMiles: number
): { minLat: number; maxLat: number; minLng: number; maxLng: number } {
  // Convert radius from miles to kilometers
  const radiusKm = radiusMiles * 1.60934;
  
  // Earth's radius in kilometers
  const earthRadiusKm = 6371;
  
  // Angular distance in radians on a great circle
  const radDist = radiusKm / earthRadiusKm;
  
  // Convert latitude and longitude to radians
  const radLat = center.latitude * Math.PI / 180;
  const radLng = center.longitude * Math.PI / 180;
  
  // Calculate min and max latitudes
  let minLat = radLat - radDist;
  let maxLat = radLat + radDist;
  
  // Handle pole cases
  const MIN_LAT = -Math.PI / 2;
  const MAX_LAT = Math.PI / 2;
  const MIN_LNG = -Math.PI;
  const MAX_LNG = Math.PI;
  
  if (minLat < MIN_LAT) minLat = MIN_LAT;
  if (maxLat > MAX_LAT) maxLat = MAX_LAT;
  
  // Calculate min and max longitudes
  let minLng, maxLng;
  
  // If we're not too close to the poles
  if (minLat > MIN_LAT && maxLat < MAX_LAT) {
    const deltaLng = Math.asin(Math.sin(radDist) / Math.cos(radLat));
    minLng = radLng - deltaLng;
    maxLng = radLng + deltaLng;
    
    if (minLng < MIN_LNG) minLng += 2 * Math.PI;
    if (maxLng > MAX_LNG) maxLng -= 2 * Math.PI;
  } else {
    // Close to the poles, longitude span becomes a full circle
    minLng = MIN_LNG;
    maxLng = MAX_LNG;
  }
  
  // Convert back to degrees
  return {
    minLat: minLat * 180 / Math.PI,
    maxLat: maxLat * 180 / Math.PI,
    minLng: minLng * 180 / Math.PI,
    maxLng: maxLng * 180 / Math.PI
  };
}

/**
 * Retrieves the ZIP code for a given set of coordinates
 * 
 * @param latitude - The latitude coordinate
 * @param longitude - The longitude coordinate
 * @returns Promise resolving to ZIP code or null if not found
 */
export async function getZipCodeFromCoordinates(
  latitude: number,
  longitude: number
): Promise<string | null> {
  try {
    // Validate coordinates
    if (!validateCoordinates(latitude, longitude)) {
      throw new Error('Invalid coordinates');
    }
    
    logger.info('Getting ZIP code from coordinates', { latitude, longitude });
    
    // Use Google Maps reverse geocoding to get address information
    const geoLocation = await geocodeAddress(`${latitude},${longitude}`);
    
    // Return the ZIP code if found
    if (geoLocation && geoLocation.zipCode) {
      return geoLocation.zipCode;
    }
    
    // Return null if ZIP code was not found
    return null;
  } catch (error) {
    logger.error('Error getting ZIP code from coordinates', {
      error: (error as Error).message,
      latitude,
      longitude
    });
    return null;
  }
}

/**
 * Formats address components into a standardized address string
 * 
 * @param addressComponents - Object containing address components
 * @returns Formatted address string
 */
export function formatAddress(addressComponents: any): string {
  // Extract address components with fallbacks for missing data
  const streetNumber = addressComponents.streetNumber || '';
  const streetName = addressComponents.streetName || '';
  const city = addressComponents.city || '';
  const state = addressComponents.state || '';
  const zipCode = addressComponents.zipCode || '';
  
  // Build address parts, filtering out empty components
  const addressParts = [];
  
  if (streetNumber || streetName) {
    addressParts.push(`${streetNumber} ${streetName}`.trim());
  }
  
  if (city) {
    addressParts.push(city);
  }
  
  // Combine state and ZIP if either exists
  const stateZip = [state, zipCode].filter(Boolean).join(' ');
  if (stateZip) {
    addressParts.push(stateZip);
  }
  
  // Join all parts with commas
  return addressParts.join(', ');
}

/**
 * Validates if the provided coordinates are within valid ranges
 * 
 * @param latitude - Latitude to validate (-90 to 90)
 * @param longitude - Longitude to validate (-180 to 180)
 * @returns True if coordinates are valid, false otherwise
 */
export function validateCoordinates(latitude: number, longitude: number): boolean {
  // Check if values are numbers
  if (isNaN(latitude) || isNaN(longitude)) {
    return false;
  }
  
  // Check latitude range (-90 to 90 degrees)
  if (latitude < -90 || latitude > 90) {
    return false;
  }
  
  // Check longitude range (-180 to 180 degrees)
  if (longitude < -180 || longitude > 180) {
    return false;
  }
  
  return true;
}

/**
 * Finds providers within a specified radius of a location
 * 
 * @param location - The center location for the search
 * @param radiusMiles - The search radius in miles
 * @param providers - Array of providers to search
 * @returns Promise resolving to array of providers with distances
 */
export async function findNearbyProviders(
  location: GeoLocation,
  radiusMiles: number,
  providers: any[]
): Promise<Array<{ provider: any; distance: number }>> {
  try {
    // Validate inputs
    if (!location || isNaN(radiusMiles) || radiusMiles <= 0) {
      throw new Error('Invalid location or radius for provider search');
    }
    
    if (!Array.isArray(providers) || providers.length === 0) {
      return [];
    }
    
    logger.info('Finding nearby providers', { 
      location: `${location.latitude},${location.longitude}`, 
      radiusMiles,
      providerCount: providers.length
    });
    
    const nearbyProviders = [];
    
    // Calculate distance for each provider and filter by radius
    for (const provider of providers) {
      // Skip providers without location data
      if (!provider.location && 
          (!provider.address || 
           !provider.address.latitude || 
           !provider.address.longitude)) {
        continue;
      }
      
      // Get provider coordinates
      const providerLocation = provider.location || {
        latitude: provider.address.latitude,
        longitude: provider.address.longitude
      };
      
      // Calculate distance
      let distance: number;
      
      try {
        // Try using Google Maps distance calculation for accuracy
        const distanceResult = await calculateDistance(location, providerLocation);
        distance = distanceResult.distance;
      } catch (error) {
        // Fall back to haversine distance if Google Maps fails
        logger.warn('Falling back to haversine distance calculation', {
          error: (error as Error).message,
          providerId: provider.id
        });
        
        distance = calculateHaversineDistance(location, providerLocation);
      }
      
      // Include provider if within radius
      if (distance <= radiusMiles) {
        nearbyProviders.push({
          provider,
          distance
        });
      }
    }
    
    // Sort providers by distance (closest first)
    nearbyProviders.sort((a, b) => a.distance - b.distance);
    
    logger.info('Found nearby providers', { 
      providerCount: nearbyProviders.length,
      location: `${location.latitude},${location.longitude}`,
      radiusMiles
    });
    
    return nearbyProviders;
  } catch (error) {
    logger.error('Error finding nearby providers', {
      error: (error as Error).message,
      location,
      radiusMiles
    });
    throw error;
  }
}