import { GeoLocation, ServiceArea } from '../../types/provider';

/**
 * Earth radius in kilometers
 */
const EARTH_RADIUS_KM = 6371;

/**
 * Earth radius in miles
 */
const EARTH_RADIUS_MILES = 3959;

/**
 * Conversion factor from miles to kilometers
 */
const MILES_TO_KM_FACTOR = 1.60934;

/**
 * Conversion factor from kilometers to miles
 */
const KM_TO_MILES_FACTOR = 0.621371;

/**
 * Calculates the distance between two geographic coordinates using the Haversine formula
 * 
 * @param lat1 - Latitude of the first point in degrees
 * @param lon1 - Longitude of the first point in degrees
 * @param lat2 - Latitude of the second point in degrees
 * @param lon2 - Longitude of the second point in degrees
 * @param unit - Unit of measurement ('miles' or 'km'), defaults to 'miles'
 * @returns Distance between the two points in the specified unit
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  unit: 'miles' | 'km' = 'miles'
): number {
  // Convert latitude and longitude from degrees to radians
  const radLat1 = (Math.PI * lat1) / 180;
  const radLon1 = (Math.PI * lon1) / 180;
  const radLat2 = (Math.PI * lat2) / 180;
  const radLon2 = (Math.PI * lon2) / 180;

  // Calculate differences between coordinates
  const dLat = radLat2 - radLat1;
  const dLon = radLon2 - radLon1;

  // Apply the Haversine formula
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // Calculate the distance using the appropriate Earth radius
  const radius = unit === 'km' ? EARTH_RADIUS_KM : EARTH_RADIUS_MILES;
  const distance = radius * c;

  // Return the rounded distance to 2 decimal places
  return Math.round(distance * 100) / 100;
}

/**
 * Calculates the distance between two GeoLocation objects
 * 
 * @param location1 - First location
 * @param location2 - Second location
 * @param unit - Unit of measurement ('miles' or 'km'), defaults to 'miles'
 * @returns Distance between the two locations in the specified unit
 */
export function calculateDistanceFromGeoLocations(
  location1: GeoLocation,
  location2: GeoLocation,
  unit: 'miles' | 'km' = 'miles'
): number {
  return calculateDistance(
    location1.latitude,
    location1.longitude,
    location2.latitude,
    location2.longitude,
    unit
  );
}

/**
 * Determines if a point is within a specified radius of another point
 * 
 * @param centerLat - Latitude of the center point in degrees
 * @param centerLon - Longitude of the center point in degrees
 * @param pointLat - Latitude of the target point in degrees
 * @param pointLon - Longitude of the target point in degrees
 * @param radiusMiles - Radius in miles
 * @returns True if the point is within the radius, false otherwise
 */
export function isPointInRadius(
  centerLat: number,
  centerLon: number,
  pointLat: number,
  pointLon: number,
  radiusMiles: number
): boolean {
  const distance = calculateDistance(centerLat, centerLon, pointLat, pointLon, 'miles');
  return distance <= radiusMiles;
}

/**
 * Determines if a location is within a provider's service area
 * 
 * @param location - The location to check
 * @param serviceArea - The service area to check against
 * @returns True if the location is within the service area, false otherwise
 */
export function isLocationInServiceArea(
  location: GeoLocation,
  serviceArea: ServiceArea
): boolean {
  return isPointInRadius(
    serviceArea.location.latitude,
    serviceArea.location.longitude,
    location.latitude,
    location.longitude,
    serviceArea.radius
  );
}

/**
 * Finds service areas that are within a specified distance of a location
 * 
 * @param location - The reference location
 * @param serviceAreas - Array of service areas to check
 * @param maxDistanceMiles - Maximum distance in miles
 * @returns Array of service areas within the specified distance
 */
export function findNearbyServiceAreas(
  location: GeoLocation,
  serviceAreas: ServiceArea[],
  maxDistanceMiles: number
): ServiceArea[] {
  return serviceAreas.filter((serviceArea) => {
    const distance = calculateDistanceFromGeoLocations(
      location,
      serviceArea.location,
      'miles'
    );
    return distance <= maxDistanceMiles;
  });
}

/**
 * Converts a distance from miles to kilometers
 * 
 * @param miles - Distance in miles
 * @returns Equivalent distance in kilometers
 */
export function convertMilesToKilometers(miles: number): number {
  return Math.round((miles * MILES_TO_KM_FACTOR) * 100) / 100;
}

/**
 * Converts a distance from kilometers to miles
 * 
 * @param kilometers - Distance in kilometers
 * @returns Equivalent distance in miles
 */
export function convertKilometersToMiles(kilometers: number): number {
  return Math.round((kilometers * KM_TO_MILES_FACTOR) * 100) / 100;
}

/**
 * Formats a distance value with the appropriate unit label
 * 
 * @param distance - Distance value to format
 * @param unit - Unit of measurement ('miles' or 'km'), defaults to 'miles'
 * @param decimalPlaces - Number of decimal places to round to, defaults to 1
 * @returns Formatted distance string with unit (e.g., '5.2 miles')
 */
export function formatDistance(
  distance: number,
  unit: 'miles' | 'km' = 'miles',
  decimalPlaces: number = 1
): string {
  const roundedDistance = Number(distance.toFixed(decimalPlaces));
  const unitLabel = unit === 'km' ? 'kilometers' : 'miles';
  return `${roundedDistance} ${unitLabel}`;
}

/**
 * Calculates a bounding box around a center point with a specified radius
 * 
 * @param centerLat - Latitude of the center point in degrees
 * @param centerLon - Longitude of the center point in degrees
 * @param radiusMiles - Radius in miles
 * @returns Bounding box coordinates (minLat, maxLat, minLon, maxLon)
 */
export function calculateBoundingBox(
  centerLat: number,
  centerLon: number,
  radiusMiles: number
): { minLat: number; maxLat: number; minLon: number; maxLon: number } {
  // Convert radius from miles to kilometers
  const radiusKm = convertMilesToKilometers(radiusMiles);
  
  // Earth's radius in kilometers
  const earthRadiusKm = EARTH_RADIUS_KM;
  
  // Convert latitude and longitude from degrees to radians
  const centerLatRad = (Math.PI * centerLat) / 180;
  
  // Calculate the latitude bounds
  const latDelta = radiusKm / earthRadiusKm;
  const latDeltaDegrees = (latDelta * 180) / Math.PI;
  
  // Calculate the longitude bounds
  // The longitude bounds depend on the latitude
  const lonDelta = Math.asin(Math.sin(latDelta) / Math.cos(centerLatRad));
  const lonDeltaDegrees = (lonDelta * 180) / Math.PI;
  
  return {
    minLat: centerLat - latDeltaDegrees,
    maxLat: centerLat + latDeltaDegrees,
    minLon: centerLon - lonDeltaDegrees,
    maxLon: centerLon + lonDeltaDegrees
  };
}

/**
 * Calculates the center point of multiple service areas
 * 
 * @param serviceAreas - Array of service areas
 * @returns Center coordinates {lat, lng} for the map
 */
export function calculateMapCenter(serviceAreas: ServiceArea[]): { lat: number; lng: number } {
  // Default center if no service areas are provided
  if (!serviceAreas || serviceAreas.length === 0) {
    return { lat: 39.8283, lng: -98.5795 }; // Center of the continental US
  }
  
  // Calculate the average of all service area center points
  const totalLat = serviceAreas.reduce(
    (sum, area) => sum + area.location.latitude,
    0
  );
  const totalLng = serviceAreas.reduce(
    (sum, area) => sum + area.location.longitude,
    0
  );
  
  return {
    lat: totalLat / serviceAreas.length,
    lng: totalLng / serviceAreas.length
  };
}

/**
 * Calculates appropriate zoom level for a map based on service areas
 * 
 * @param serviceAreas - Array of service areas
 * @returns Zoom level for the map (1-20, where 1 is most zoomed out)
 */
export function calculateZoomLevel(serviceAreas: ServiceArea[]): number {
  // Default zoom level if no service areas are provided
  if (!serviceAreas || serviceAreas.length === 0) {
    return 4; // Default zoom for continental US view
  }
  
  if (serviceAreas.length === 1) {
    // Single service area - zoom based on radius
    const radius = serviceAreas[0].radius;
    
    if (radius <= 5) return 13; // Very small radius
    if (radius <= 10) return 12;
    if (radius <= 25) return 11;
    if (radius <= 50) return 10;
    if (radius <= 100) return 9;
    
    return 8; // Large radius
  }
  
  // Multiple service areas - calculate the maximum distance between any two service areas
  let maxDistance = 0;
  
  for (let i = 0; i < serviceAreas.length; i++) {
    for (let j = i + 1; j < serviceAreas.length; j++) {
      const distance = calculateDistanceFromGeoLocations(
        serviceAreas[i].location,
        serviceAreas[j].location
      );
      
      if (distance > maxDistance) {
        maxDistance = distance;
      }
    }
  }
  
  // Determine zoom level based on maximum distance
  if (maxDistance <= 5) return 13;
  if (maxDistance <= 10) return 12;
  if (maxDistance <= 25) return 11;
  if (maxDistance <= 50) return 10;
  if (maxDistance <= 100) return 9;
  if (maxDistance <= 250) return 8;
  if (maxDistance <= 500) return 7;
  if (maxDistance <= 1000) return 6;
  if (maxDistance <= 2000) return 5;
  
  return 4; // Very large distance
}

/**
 * Formats a GeoLocation object into a human-readable address string
 * 
 * @param location - The GeoLocation object to format
 * @returns Formatted address string
 */
export function formatAddress(location: GeoLocation): string {
  if (!location) {
    return '';
  }
  
  const addressParts = [
    location.address,
    location.city,
    `${location.state} ${location.zipCode}`
  ].filter(Boolean); // Remove any empty parts
  
  return addressParts.join(', ');
}