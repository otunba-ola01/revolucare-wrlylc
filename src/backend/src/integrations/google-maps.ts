/**
 * Google Maps API integration for the Revolucare platform
 * 
 * This module provides integration with Google Maps services for location-based
 * features including geocoding, distance calculation, place search, and more.
 * It supports provider matching, availability tracking, and service area management.
 * 
 * @module integrations/google-maps
 */

import { 
  Client, 
  GeocodeResponse, 
  PlaceDetailsResponse, 
  PlacesNearbyResponse,
  DirectionsResponse,
  TravelMode, 
  DistanceMatrixResponse,
  GeocodeResult,
  Status as GoogleMapsStatus
} from '@googlemaps/google-maps-services-js'; // v3.3.28
import axios, { AxiosError } from 'axios'; // v1.4.0
import { logger } from '../utils/logger';
import { AppError } from '../interfaces/error.interface';
import { ErrorCodes, ErrorCategories } from '../constants/error-codes';
import { GeoLocation } from '../types/provider.types';
import { ExternalServiceInterface } from '../interfaces/external-service.interface';

// Configuration from environment variables with defaults
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';
const GOOGLE_MAPS_TIMEOUT = Number(process.env.GOOGLE_MAPS_TIMEOUT) || 10000;
const GOOGLE_MAPS_RETRY_COUNT = Number(process.env.GOOGLE_MAPS_RETRY_COUNT) || 3;

/**
 * Creates and configures a Google Maps client instance with retry logic
 * @returns Configured Google Maps client
 */
function createGoogleMapsClient(): Client {
  const client = new Client({
    axiosInstance: axios.create({
      timeout: GOOGLE_MAPS_TIMEOUT,
    }),
  });
  
  return client;
}

/**
 * Handles errors from Google Maps API and converts them to standardized AppError format
 * @param error - The error from Google Maps API
 * @returns Standardized application error
 */
function handleGoogleMapsError(error: Error): AppError {
  logger.error('Google Maps API error', { error: error.message });
  
  let errorCode = ErrorCodes.EXTERNAL_SERVICE_ERROR;
  let statusCode = 500;
  let message = 'Error communicating with Google Maps service';
  let details: Record<string, any> = {};
  
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    
    if (axiosError.response) {
      statusCode = axiosError.response.status;
      details = {
        status: axiosError.response.status,
        data: axiosError.response.data,
      };
      
      // Map specific Google Maps errors to appropriate error codes
      if (statusCode === 400) {
        errorCode = ErrorCodes.BAD_REQUEST;
        message = 'Invalid request to Google Maps service';
      } else if (statusCode === 403) {
        errorCode = ErrorCodes.EXTERNAL_SERVICE_ERROR;
        message = 'Invalid or missing Google Maps API key';
      } else if (statusCode === 404) {
        errorCode = ErrorCodes.NOT_FOUND;
        message = 'Google Maps resource not found';
      } else if (statusCode === 429) {
        errorCode = ErrorCodes.RATE_LIMIT_EXCEEDED;
        message = 'Google Maps API rate limit exceeded';
      } else if (statusCode >= 500) {
        errorCode = ErrorCodes.SERVICE_UNAVAILABLE;
        message = 'Google Maps service is currently unavailable';
      }
    } else if (axiosError.request) {
      errorCode = ErrorCodes.GATEWAY_TIMEOUT;
      message = 'Timeout connecting to Google Maps service';
      details = { timeout: GOOGLE_MAPS_TIMEOUT };
    }
  }
  
  const appError = {
    name: 'GoogleMapsError',
    message,
    code: errorCode,
    category: ErrorCategories.EXTERNAL,
    statusCode,
    details,
    cause: error,
    isOperational: true,
    stack: error.stack,
  } as AppError;
  
  return appError;
}

/**
 * Converts a physical address to geographic coordinates (latitude and longitude)
 * @param address - The address to geocode
 * @returns Promise resolving to geographic coordinates with address components
 */
export async function geocodeAddress(address: string): Promise<GeoLocation> {
  if (!address || address.trim() === '') {
    throw {
      name: 'ValidationError',
      message: 'Address cannot be empty',
      code: ErrorCodes.VALIDATION_ERROR,
      category: ErrorCategories.VALIDATION,
      statusCode: 400,
      isOperational: true,
    } as AppError;
  }

  logger.debug('Geocoding address', { address });
  
  const client = createGoogleMapsClient();
  let retries = 0;
  
  while (retries <= GOOGLE_MAPS_RETRY_COUNT) {
    try {
      const response = await client.geocode({
        params: {
          address,
          key: GOOGLE_MAPS_API_KEY,
        },
      });
      
      if (response.data.status !== GoogleMapsStatus.OK) {
        logger.warn('Google Maps geocoding error', { 
          status: response.data.status, 
          address 
        });
        
        if (response.data.status === GoogleMapsStatus.ZERO_RESULTS) {
          throw {
            name: 'NotFoundError',
            message: 'Address not found',
            code: ErrorCodes.NOT_FOUND,
            category: ErrorCategories.RESOURCE,
            statusCode: 404,
            details: { address },
            isOperational: true,
          } as AppError;
        }
        
        throw {
          name: 'GoogleMapsError',
          message: `Geocoding error: ${response.data.status}`,
          code: ErrorCodes.EXTERNAL_SERVICE_ERROR,
          category: ErrorCategories.EXTERNAL,
          statusCode: 500,
          details: { status: response.data.status, address },
          isOperational: true,
        } as AppError;
      }
      
      const results = response.data.results;
      
      if (results.length === 0) {
        throw {
          name: 'NotFoundError',
          message: 'Address not found',
          code: ErrorCodes.NOT_FOUND,
          category: ErrorCategories.RESOURCE,
          statusCode: 404,
          details: { address },
          isOperational: true,
        } as AppError;
      }
      
      const result = results[0];
      const location = result.geometry.location;
      
      // Extract address components
      let city = '';
      let state = '';
      let zipCode = '';
      
      for (const component of result.address_components) {
        if (component.types.includes('locality')) {
          city = component.long_name;
        } else if (component.types.includes('administrative_area_level_1')) {
          state = component.short_name;
        } else if (component.types.includes('postal_code')) {
          zipCode = component.long_name;
        }
      }
      
      const geoLocation: GeoLocation = {
        latitude: location.lat,
        longitude: location.lng,
        address: result.formatted_address,
        city,
        state,
        zipCode,
      };
      
      logger.debug('Geocoding successful', { 
        address, 
        result: { 
          latitude: geoLocation.latitude, 
          longitude: geoLocation.longitude 
        } 
      });
      
      return geoLocation;
      
    } catch (error) {
      if ((error as AppError).isOperational) {
        throw error;
      }
      
      // Retry logic for non-operational errors
      retries++;
      
      if (retries > GOOGLE_MAPS_RETRY_COUNT) {
        logger.error('Max retries reached for geocoding', { address, retries });
        throw handleGoogleMapsError(error as Error);
      }
      
      // Exponential backoff
      const delay = Math.pow(2, retries) * 1000;
      logger.debug(`Retrying geocoding (${retries}/${GOOGLE_MAPS_RETRY_COUNT}) after ${delay}ms`, { address });
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // This should never be reached due to the error handling above
  throw handleGoogleMapsError(new Error('Unknown error during geocoding'));
}

/**
 * Converts geographic coordinates to a physical address
 * @param latitude - The latitude coordinate
 * @param longitude - The longitude coordinate
 * @returns Promise resolving to address information with coordinates
 */
export async function reverseGeocode(latitude: number, longitude: number): Promise<GeoLocation> {
  if (isNaN(latitude) || isNaN(longitude)) {
    throw {
      name: 'ValidationError',
      message: 'Invalid coordinates',
      code: ErrorCodes.VALIDATION_ERROR,
      category: ErrorCategories.VALIDATION,
      statusCode: 400,
      details: { latitude, longitude },
      isOperational: true,
    } as AppError;
  }

  logger.debug('Reverse geocoding coordinates', { latitude, longitude });
  
  const client = createGoogleMapsClient();
  let retries = 0;
  
  while (retries <= GOOGLE_MAPS_RETRY_COUNT) {
    try {
      const response = await client.reverseGeocode({
        params: {
          latlng: { lat: latitude, lng: longitude },
          key: GOOGLE_MAPS_API_KEY,
        },
      });
      
      if (response.data.status !== GoogleMapsStatus.OK) {
        logger.warn('Google Maps reverse geocoding error', { 
          status: response.data.status, 
          latitude, 
          longitude 
        });
        
        if (response.data.status === GoogleMapsStatus.ZERO_RESULTS) {
          throw {
            name: 'NotFoundError',
            message: 'No address found for coordinates',
            code: ErrorCodes.NOT_FOUND,
            category: ErrorCategories.RESOURCE,
            statusCode: 404,
            details: { latitude, longitude },
            isOperational: true,
          } as AppError;
        }
        
        throw {
          name: 'GoogleMapsError',
          message: `Reverse geocoding error: ${response.data.status}`,
          code: ErrorCodes.EXTERNAL_SERVICE_ERROR,
          category: ErrorCategories.EXTERNAL,
          statusCode: 500,
          details: { status: response.data.status, latitude, longitude },
          isOperational: true,
        } as AppError;
      }
      
      const results = response.data.results;
      
      if (results.length === 0) {
        throw {
          name: 'NotFoundError',
          message: 'No address found for coordinates',
          code: ErrorCodes.NOT_FOUND,
          category: ErrorCategories.RESOURCE,
          statusCode: 404,
          details: { latitude, longitude },
          isOperational: true,
        } as AppError;
      }
      
      // Use the most specific result (usually the first one)
      const result = results[0];
      
      // Extract address components
      let city = '';
      let state = '';
      let zipCode = '';
      
      for (const component of result.address_components) {
        if (component.types.includes('locality')) {
          city = component.long_name;
        } else if (component.types.includes('administrative_area_level_1')) {
          state = component.short_name;
        } else if (component.types.includes('postal_code')) {
          zipCode = component.long_name;
        }
      }
      
      const geoLocation: GeoLocation = {
        latitude,
        longitude,
        address: result.formatted_address,
        city,
        state,
        zipCode,
      };
      
      logger.debug('Reverse geocoding successful', { 
        latitude, 
        longitude, 
        address: geoLocation.address 
      });
      
      return geoLocation;
      
    } catch (error) {
      if ((error as AppError).isOperational) {
        throw error;
      }
      
      // Retry logic for non-operational errors
      retries++;
      
      if (retries > GOOGLE_MAPS_RETRY_COUNT) {
        logger.error('Max retries reached for reverse geocoding', { latitude, longitude, retries });
        throw handleGoogleMapsError(error as Error);
      }
      
      // Exponential backoff
      const delay = Math.pow(2, retries) * 1000;
      logger.debug(`Retrying reverse geocoding (${retries}/${GOOGLE_MAPS_RETRY_COUNT}) after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // This should never be reached due to the error handling above
  throw handleGoogleMapsError(new Error('Unknown error during reverse geocoding'));
}

/**
 * Calculates the distance between two locations using Google Maps Distance Matrix API
 * @param origin - The starting location
 * @param destination - The ending location
 * @param mode - The travel mode (driving, walking, bicycling, transit)
 * @returns Promise resolving to distance in miles and duration in minutes
 */
export async function calculateDistance(
  origin: GeoLocation | { latitude: number; longitude: number },
  destination: GeoLocation | { latitude: number; longitude: number },
  mode: string = 'driving'
): Promise<{ distance: number; duration: number }> {
  // Validate inputs
  if (!origin || !destination) {
    throw {
      name: 'ValidationError',
      message: 'Origin and destination are required',
      code: ErrorCodes.VALIDATION_ERROR,
      category: ErrorCategories.VALIDATION,
      statusCode: 400,
      isOperational: true,
    } as AppError;
  }

  // Validate coordinates
  if (isNaN(origin.latitude) || isNaN(origin.longitude) || 
      isNaN(destination.latitude) || isNaN(destination.longitude)) {
    throw {
      name: 'ValidationError',
      message: 'Invalid coordinates',
      code: ErrorCodes.VALIDATION_ERROR,
      category: ErrorCategories.VALIDATION,
      statusCode: 400,
      details: { origin, destination },
      isOperational: true,
    } as AppError;
  }

  logger.debug('Calculating distance', { 
    origin: `${origin.latitude},${origin.longitude}`, 
    destination: `${destination.latitude},${destination.longitude}`,
    mode 
  });
  
  // Validate travel mode
  const validModes = ['driving', 'walking', 'bicycling', 'transit'];
  const travelMode = mode.toLowerCase();
  
  if (!validModes.includes(travelMode)) {
    throw {
      name: 'ValidationError',
      message: `Invalid travel mode. Must be one of: ${validModes.join(', ')}`,
      code: ErrorCodes.VALIDATION_ERROR,
      category: ErrorCategories.VALIDATION,
      statusCode: 400,
      details: { providedMode: mode, validModes },
      isOperational: true,
    } as AppError;
  }
  
  const client = createGoogleMapsClient();
  let retries = 0;
  
  while (retries <= GOOGLE_MAPS_RETRY_COUNT) {
    try {
      const response = await client.distancematrix({
        params: {
          origins: [{ lat: origin.latitude, lng: origin.longitude }],
          destinations: [{ lat: destination.latitude, lng: destination.longitude }],
          mode: travelMode as TravelMode,
          key: GOOGLE_MAPS_API_KEY,
        },
      });
      
      if (response.data.status !== GoogleMapsStatus.OK) {
        logger.warn('Google Maps distance matrix error', { 
          status: response.data.status, 
          origin, 
          destination,
          mode 
        });
        
        throw {
          name: 'GoogleMapsError',
          message: `Distance calculation error: ${response.data.status}`,
          code: ErrorCodes.EXTERNAL_SERVICE_ERROR,
          category: ErrorCategories.EXTERNAL,
          statusCode: 500,
          details: { status: response.data.status, origin, destination, mode },
          isOperational: true,
        } as AppError;
      }
      
      const rows = response.data.rows;
      
      if (rows.length === 0 || rows[0].elements.length === 0) {
        throw {
          name: 'NotFoundError',
          message: 'No route found between locations',
          code: ErrorCodes.NOT_FOUND,
          category: ErrorCategories.RESOURCE,
          statusCode: 404,
          details: { origin, destination, mode },
          isOperational: true,
        } as AppError;
      }
      
      const element = rows[0].elements[0];
      
      if (element.status !== GoogleMapsStatus.OK) {
        throw {
          name: 'NotFoundError',
          message: `Route error: ${element.status}`,
          code: ErrorCodes.NOT_FOUND,
          category: ErrorCategories.RESOURCE,
          statusCode: 404,
          details: { status: element.status, origin, destination, mode },
          isOperational: true,
        } as AppError;
      }
      
      // Convert distance from meters to miles
      const distanceInMiles = element.distance.value / 1609.34;
      
      // Convert duration from seconds to minutes
      const durationInMinutes = element.duration.value / 60;
      
      logger.debug('Distance calculation successful', { 
        origin: `${origin.latitude},${origin.longitude}`, 
        destination: `${destination.latitude},${destination.longitude}`,
        distance: distanceInMiles.toFixed(2) + ' miles',
        duration: durationInMinutes.toFixed(0) + ' minutes',
        mode
      });
      
      return {
        distance: parseFloat(distanceInMiles.toFixed(2)),
        duration: parseFloat(durationInMinutes.toFixed(0)),
      };
      
    } catch (error) {
      if ((error as AppError).isOperational) {
        throw error;
      }
      
      // Retry logic for non-operational errors
      retries++;
      
      if (retries > GOOGLE_MAPS_RETRY_COUNT) {
        logger.error('Max retries reached for distance calculation', { 
          origin, 
          destination,
          mode, 
          retries 
        });
        throw handleGoogleMapsError(error as Error);
      }
      
      // Exponential backoff
      const delay = Math.pow(2, retries) * 1000;
      logger.debug(`Retrying distance calculation (${retries}/${GOOGLE_MAPS_RETRY_COUNT}) after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // This should never be reached due to the error handling above
  throw handleGoogleMapsError(new Error('Unknown error during distance calculation'));
}

/**
 * Retrieves detailed information about a place using its place_id
 * @param placeId - The Google Maps place ID
 * @returns Promise resolving to place details
 */
export async function getPlaceDetails(placeId: string): Promise<Record<string, any>> {
  if (!placeId || placeId.trim() === '') {
    throw {
      name: 'ValidationError',
      message: 'Place ID cannot be empty',
      code: ErrorCodes.VALIDATION_ERROR,
      category: ErrorCategories.VALIDATION,
      statusCode: 400,
      isOperational: true,
    } as AppError;
  }

  logger.debug('Getting place details', { placeId });
  
  const client = createGoogleMapsClient();
  let retries = 0;
  
  while (retries <= GOOGLE_MAPS_RETRY_COUNT) {
    try {
      const response = await client.placeDetails({
        params: {
          place_id: placeId,
          key: GOOGLE_MAPS_API_KEY,
          // Request comprehensive place information
          fields: [
            'name', 'formatted_address', 'geometry', 'type',
            'formatted_phone_number', 'website', 'opening_hours',
            'address_component', 'rating', 'user_ratings_total',
            'wheelchair_accessible_entrance'
          ]
        },
      });
      
      if (response.data.status !== GoogleMapsStatus.OK) {
        logger.warn('Google Maps place details error', { 
          status: response.data.status, 
          placeId 
        });
        
        if (response.data.status === GoogleMapsStatus.ZERO_RESULTS || 
            response.data.status === GoogleMapsStatus.NOT_FOUND) {
          throw {
            name: 'NotFoundError',
            message: 'Place not found',
            code: ErrorCodes.NOT_FOUND,
            category: ErrorCategories.RESOURCE,
            statusCode: 404,
            details: { placeId },
            isOperational: true,
          } as AppError;
        }
        
        throw {
          name: 'GoogleMapsError',
          message: `Place details error: ${response.data.status}`,
          code: ErrorCodes.EXTERNAL_SERVICE_ERROR,
          category: ErrorCategories.EXTERNAL,
          statusCode: 500,
          details: { status: response.data.status, placeId },
          isOperational: true,
        } as AppError;
      }
      
      const result = response.data.result;
      
      // Format the response data
      const placeDetails = {
        placeId,
        name: result.name,
        address: result.formatted_address,
        location: {
          latitude: result.geometry.location.lat,
          longitude: result.geometry.location.lng,
        },
        phoneNumber: result.formatted_phone_number || null,
        website: result.website || null,
        types: result.types || [],
        rating: result.rating || null,
        ratingsCount: result.user_ratings_total || 0,
        openingHours: result.opening_hours ? {
          isOpen: result.opening_hours.open_now,
          periods: result.opening_hours.periods || [],
          weekdayText: result.opening_hours.weekday_text || [],
        } : null,
        accessibility: {
          wheelchairAccessible: result.wheelchair_accessible_entrance || false,
        },
      };
      
      logger.debug('Place details retrieved successfully', { placeId });
      
      return placeDetails;
      
    } catch (error) {
      if ((error as AppError).isOperational) {
        throw error;
      }
      
      // Retry logic for non-operational errors
      retries++;
      
      if (retries > GOOGLE_MAPS_RETRY_COUNT) {
        logger.error('Max retries reached for place details', { placeId, retries });
        throw handleGoogleMapsError(error as Error);
      }
      
      // Exponential backoff
      const delay = Math.pow(2, retries) * 1000;
      logger.debug(`Retrying place details (${retries}/${GOOGLE_MAPS_RETRY_COUNT}) after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // This should never be reached due to the error handling above
  throw handleGoogleMapsError(new Error('Unknown error while getting place details'));
}

/**
 * Searches for places near a specific location based on type or keyword
 * @param location - The center point for the search
 * @param radiusMiles - The search radius in miles
 * @param options - Additional search options (type, keyword, etc.)
 * @returns Promise resolving to array of nearby places
 */
export async function searchNearbyPlaces(
  location: GeoLocation | { latitude: number; longitude: number },
  radiusMiles: number,
  options: {
    type?: string;
    keyword?: string;
    minPrice?: number;
    maxPrice?: number;
    openNow?: boolean;
  } = {}
): Promise<Array<Record<string, any>>> {
  // Validate inputs
  if (!location) {
    throw {
      name: 'ValidationError',
      message: 'Location is required',
      code: ErrorCodes.VALIDATION_ERROR,
      category: ErrorCategories.VALIDATION,
      statusCode: 400,
      isOperational: true,
    } as AppError;
  }

  // Validate coordinates
  if (isNaN(location.latitude) || isNaN(location.longitude)) {
    throw {
      name: 'ValidationError',
      message: 'Invalid coordinates',
      code: ErrorCodes.VALIDATION_ERROR,
      category: ErrorCategories.VALIDATION,
      statusCode: 400,
      details: { location },
      isOperational: true,
    } as AppError;
  }

  // Validate radius
  if (isNaN(radiusMiles) || radiusMiles <= 0 || radiusMiles > 50) {
    throw {
      name: 'ValidationError',
      message: 'Radius must be between 0 and 50 miles',
      code: ErrorCodes.VALIDATION_ERROR,
      category: ErrorCategories.VALIDATION,
      statusCode: 400,
      details: { radiusMiles },
      isOperational: true,
    } as AppError;
  }

  logger.debug('Searching for nearby places', { 
    location: `${location.latitude},${location.longitude}`, 
    radiusMiles,
    options 
  });
  
  // Convert radius from miles to meters (Google Maps API uses meters)
  const radiusMeters = Math.round(radiusMiles * 1609.34);
  
  const client = createGoogleMapsClient();
  let retries = 0;
  
  while (retries <= GOOGLE_MAPS_RETRY_COUNT) {
    try {
      const params: any = {
        location: { lat: location.latitude, lng: location.longitude },
        radius: radiusMeters,
        key: GOOGLE_MAPS_API_KEY,
      };
      
      // Add optional parameters
      if (options.type) params.type = options.type;
      if (options.keyword) params.keyword = options.keyword;
      if (options.minPrice !== undefined) params.minprice = options.minPrice;
      if (options.maxPrice !== undefined) params.maxprice = options.maxPrice;
      if (options.openNow !== undefined) params.opennow = options.openNow;
      
      const response = await client.placesNearby({
        params,
      });
      
      if (response.data.status !== GoogleMapsStatus.OK && 
          response.data.status !== GoogleMapsStatus.ZERO_RESULTS) {
        logger.warn('Google Maps nearby search error', { 
          status: response.data.status, 
          location, 
          radiusMiles,
          options 
        });
        
        throw {
          name: 'GoogleMapsError',
          message: `Nearby places search error: ${response.data.status}`,
          code: ErrorCodes.EXTERNAL_SERVICE_ERROR,
          category: ErrorCategories.EXTERNAL,
          statusCode: 500,
          details: { status: response.data.status, location, radiusMiles, options },
          isOperational: true,
        } as AppError;
      }
      
      const results = response.data.results || [];
      
      // Format the places data
      const places = results.map(place => ({
        placeId: place.place_id,
        name: place.name,
        address: place.vicinity,
        location: {
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
        },
        types: place.types || [],
        businessStatus: place.business_status || null,
        rating: place.rating || null,
        ratingsCount: place.user_ratings_total || 0,
        priceLevel: place.price_level !== undefined ? place.price_level : null,
        isOpen: place.opening_hours ? place.opening_hours.open_now : null,
        photos: place.photos ? place.photos.map((photo: any) => ({
          reference: photo.photo_reference,
          width: photo.width,
          height: photo.height,
          attributions: photo.html_attributions,
        })) : [],
        distance: 0, // Will be calculated below
      }));
      
      // Calculate the actual distance from the origin for each place
      for (let i = 0; i < places.length; i++) {
        try {
          const distanceResult = await calculateDistance(
            location,
            places[i].location,
            'driving'
          );
          places[i].distance = distanceResult.distance;
          places[i].duration = distanceResult.duration;
        } catch (distanceError) {
          // If distance calculation fails, approximate using straight-line distance
          logger.warn('Failed to calculate exact distance, using approximate', {
            placeId: places[i].placeId,
            error: (distanceError as Error).message
          });
          
          // Simple Haversine formula for straight-line distance
          const R = 3958.8; // Earth's radius in miles
          const dLat = (places[i].location.latitude - location.latitude) * Math.PI / 180;
          const dLon = (places[i].location.longitude - location.longitude) * Math.PI / 180;
          const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(location.latitude * Math.PI / 180) * Math.cos(places[i].location.latitude * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          places[i].distance = parseFloat((R * c).toFixed(2));
          places[i].duration = null; // Cannot estimate duration
        }
      }
      
      // Sort places by distance
      places.sort((a, b) => a.distance - b.distance);
      
      logger.debug('Nearby places search successful', { 
        location: `${location.latitude},${location.longitude}`, 
        radiusMiles,
        count: places.length 
      });
      
      return places;
      
    } catch (error) {
      if ((error as AppError).isOperational) {
        throw error;
      }
      
      // Retry logic for non-operational errors
      retries++;
      
      if (retries > GOOGLE_MAPS_RETRY_COUNT) {
        logger.error('Max retries reached for nearby places search', { 
          location, 
          radiusMiles,
          options, 
          retries 
        });
        throw handleGoogleMapsError(error as Error);
      }
      
      // Exponential backoff
      const delay = Math.pow(2, retries) * 1000;
      logger.debug(`Retrying nearby places search (${retries}/${GOOGLE_MAPS_RETRY_COUNT}) after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // This should never be reached due to the error handling above
  throw handleGoogleMapsError(new Error('Unknown error during nearby places search'));
}

/**
 * Gets directions between two locations with optional waypoints
 * @param origin - The starting location
 * @param destination - The ending location
 * @param options - Additional options (mode, waypoints, etc.)
 * @returns Promise resolving to directions information
 */
export async function getDirections(
  origin: GeoLocation | { latitude: number; longitude: number },
  destination: GeoLocation | { latitude: number; longitude: number },
  options: {
    mode?: string;
    waypoints?: Array<{ latitude: number; longitude: number }>;
    alternatives?: boolean;
    avoidTolls?: boolean;
    avoidHighways?: boolean;
  } = {}
): Promise<Record<string, any>> {
  // Validate inputs
  if (!origin || !destination) {
    throw {
      name: 'ValidationError',
      message: 'Origin and destination are required',
      code: ErrorCodes.VALIDATION_ERROR,
      category: ErrorCategories.VALIDATION,
      statusCode: 400,
      isOperational: true,
    } as AppError;
  }

  // Validate coordinates
  if (isNaN(origin.latitude) || isNaN(origin.longitude) || 
      isNaN(destination.latitude) || isNaN(destination.longitude)) {
    throw {
      name: 'ValidationError',
      message: 'Invalid coordinates',
      code: ErrorCodes.VALIDATION_ERROR,
      category: ErrorCategories.VALIDATION,
      statusCode: 400,
      details: { origin, destination },
      isOperational: true,
    } as AppError;
  }

  logger.debug('Getting directions', { 
    origin: `${origin.latitude},${origin.longitude}`, 
    destination: `${destination.latitude},${destination.longitude}`,
    options 
  });
  
  // Validate travel mode
  const mode = options.mode || 'driving';
  const validModes = ['driving', 'walking', 'bicycling', 'transit'];
  
  if (!validModes.includes(mode.toLowerCase())) {
    throw {
      name: 'ValidationError',
      message: `Invalid travel mode. Must be one of: ${validModes.join(', ')}`,
      code: ErrorCodes.VALIDATION_ERROR,
      category: ErrorCategories.VALIDATION,
      statusCode: 400,
      details: { providedMode: mode, validModes },
      isOperational: true,
    } as AppError;
  }
  
  const client = createGoogleMapsClient();
  let retries = 0;
  
  while (retries <= GOOGLE_MAPS_RETRY_COUNT) {
    try {
      const params: any = {
        origin: { lat: origin.latitude, lng: origin.longitude },
        destination: { lat: destination.latitude, lng: destination.longitude },
        mode: mode.toLowerCase() as TravelMode,
        key: GOOGLE_MAPS_API_KEY,
      };
      
      // Add optional parameters
      if (options.alternatives !== undefined) params.alternatives = options.alternatives;
      if (options.avoidTolls) params.avoid = params.avoid ? `${params.avoid}|tolls` : 'tolls';
      if (options.avoidHighways) params.avoid = params.avoid ? `${params.avoid}|highways` : 'highways';
      
      // Format waypoints if provided
      if (options.waypoints && options.waypoints.length > 0) {
        params.waypoints = options.waypoints.map(waypoint => ({
          location: { lat: waypoint.latitude, lng: waypoint.longitude },
          stopover: true
        }));
      }
      
      const response = await client.directions({
        params,
      });
      
      if (response.data.status !== GoogleMapsStatus.OK) {
        logger.warn('Google Maps directions error', { 
          status: response.data.status, 
          origin, 
          destination,
          options 
        });
        
        if (response.data.status === GoogleMapsStatus.ZERO_RESULTS) {
          throw {
            name: 'NotFoundError',
            message: 'No routes found between these locations',
            code: ErrorCodes.NOT_FOUND,
            category: ErrorCategories.RESOURCE,
            statusCode: 404,
            details: { origin, destination, options },
            isOperational: true,
          } as AppError;
        }
        
        throw {
          name: 'GoogleMapsError',
          message: `Directions error: ${response.data.status}`,
          code: ErrorCodes.EXTERNAL_SERVICE_ERROR,
          category: ErrorCategories.EXTERNAL,
          statusCode: 500,
          details: { status: response.data.status, origin, destination, options },
          isOperational: true,
        } as AppError;
      }
      
      const routes = response.data.routes;
      
      if (routes.length === 0) {
        throw {
          name: 'NotFoundError',
          message: 'No routes found between these locations',
          code: ErrorCodes.NOT_FOUND,
          category: ErrorCategories.RESOURCE,
          statusCode: 404,
          details: { origin, destination, options },
          isOperational: true,
        } as AppError;
      }
      
      // Format the response
      const directionsResult = {
        routes: routes.map(route => ({
          summary: route.summary,
          warnings: route.warnings,
          copyrights: route.copyrights,
          waypointOrder: route.waypoint_order,
          fare: route.fare ? {
            currency: route.fare.currency,
            value: route.fare.value,
            text: route.fare.text,
          } : null,
          bounds: {
            northeast: {
              latitude: route.bounds.northeast.lat,
              longitude: route.bounds.northeast.lng,
            },
            southwest: {
              latitude: route.bounds.southwest.lat,
              longitude: route.bounds.southwest.lng,
            },
          },
          overviewPolyline: route.overview_polyline.points,
          legs: route.legs.map(leg => ({
            distance: {
              value: leg.distance.value,
              text: leg.distance.text,
              miles: parseFloat((leg.distance.value / 1609.34).toFixed(2)),
            },
            duration: {
              value: leg.duration.value,
              text: leg.duration.text,
              minutes: Math.round(leg.duration.value / 60),
            },
            startAddress: leg.start_address,
            endAddress: leg.end_address,
            startLocation: {
              latitude: leg.start_location.lat,
              longitude: leg.start_location.lng,
            },
            endLocation: {
              latitude: leg.end_location.lat,
              longitude: leg.end_location.lng,
            },
            steps: leg.steps.map(step => ({
              distance: {
                value: step.distance.value,
                text: step.distance.text,
                miles: parseFloat((step.distance.value / 1609.34).toFixed(2)),
              },
              duration: {
                value: step.duration.value,
                text: step.duration.text,
                minutes: Math.round(step.duration.value / 60),
              },
              startLocation: {
                latitude: step.start_location.lat,
                longitude: step.start_location.lng,
              },
              endLocation: {
                latitude: step.end_location.lat,
                longitude: step.end_location.lng,
              },
              instruction: step.html_instructions,
              travelMode: step.travel_mode,
              polyline: step.polyline.points,
            })),
          })),
        })),
        waypoints: options.waypoints || [],
        mode,
        origin: {
          latitude: origin.latitude,
          longitude: origin.longitude,
        },
        destination: {
          latitude: destination.latitude,
          longitude: destination.longitude,
        },
      };
      
      logger.debug('Directions retrieved successfully', { 
        origin: `${origin.latitude},${origin.longitude}`, 
        destination: `${destination.latitude},${destination.longitude}`,
        routeCount: directionsResult.routes.length
      });
      
      return directionsResult;
      
    } catch (error) {
      if ((error as AppError).isOperational) {
        throw error;
      }
      
      // Retry logic for non-operational errors
      retries++;
      
      if (retries > GOOGLE_MAPS_RETRY_COUNT) {
        logger.error('Max retries reached for directions', { 
          origin, 
          destination,
          options, 
          retries 
        });
        throw handleGoogleMapsError(error as Error);
      }
      
      // Exponential backoff
      const delay = Math.pow(2, retries) * 1000;
      logger.debug(`Retrying directions (${retries}/${GOOGLE_MAPS_RETRY_COUNT}) after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // This should never be reached due to the error handling above
  throw handleGoogleMapsError(new Error('Unknown error while getting directions'));
}

/**
 * Validates if an address exists and is properly formatted
 * @param address - The address to validate
 * @returns Promise resolving to validation result
 */
export async function validateAddress(address: string): Promise<{ isValid: boolean; formattedAddress?: string }> {
  if (!address || address.trim() === '') {
    return { isValid: false };
  }

  logger.debug('Validating address', { address });
  
  try {
    // Use geocodeAddress to attempt to geocode the address
    const geoLocation = await geocodeAddress(address);
    
    // If geocoding succeeds, the address is valid
    return {
      isValid: true,
      formattedAddress: geoLocation.address,
    };
  } catch (error) {
    if ((error as AppError).code === ErrorCodes.NOT_FOUND) {
      // Address not found, so it's invalid
      logger.debug('Address validation failed - address not found', { address });
      return { isValid: false };
    }
    
    // For other errors, propagate them
    logger.error('Error during address validation', { 
      address, 
      error: (error as Error).message 
    });
    throw error;
  }
}

/**
 * Retrieves the boundary polygon for a ZIP code area
 * @param zipCode - The ZIP code to get the boundary for
 * @returns Promise resolving to array of boundary coordinates
 */
export async function getZipCodeBoundary(zipCode: string): Promise<Array<{ lat: number; lng: number }>> {
  if (!zipCode || !/^\d{5}(-\d{4})?$/.test(zipCode)) {
    throw {
      name: 'ValidationError',
      message: 'Invalid ZIP code format',
      code: ErrorCodes.VALIDATION_ERROR,
      category: ErrorCategories.VALIDATION,
      statusCode: 400,
      details: { zipCode },
      isOperational: true,
    } as AppError;
  }

  logger.debug('Getting ZIP code boundary', { zipCode });
  
  // Extract the 5-digit ZIP code if it's in ZIP+4 format
  const fiveDigitZip = zipCode.substring(0, 5);
  
  const client = createGoogleMapsClient();
  let retries = 0;
  
  while (retries <= GOOGLE_MAPS_RETRY_COUNT) {
    try {
      // Use geocoding API to get the boundary of the ZIP code
      const response = await client.geocode({
        params: {
          address: fiveDigitZip,
          components: {
            postal_code: fiveDigitZip,
            country: 'US', // Limit to US ZIP codes
          },
          key: GOOGLE_MAPS_API_KEY,
        },
      });
      
      if (response.data.status !== GoogleMapsStatus.OK) {
        logger.warn('Google Maps ZIP code geocoding error', { 
          status: response.data.status, 
          zipCode 
        });
        
        if (response.data.status === GoogleMapsStatus.ZERO_RESULTS) {
          throw {
            name: 'NotFoundError',
            message: 'ZIP code not found',
            code: ErrorCodes.NOT_FOUND,
            category: ErrorCategories.RESOURCE,
            statusCode: 404,
            details: { zipCode },
            isOperational: true,
          } as AppError;
        }
        
        throw {
          name: 'GoogleMapsError',
          message: `ZIP code geocoding error: ${response.data.status}`,
          code: ErrorCodes.EXTERNAL_SERVICE_ERROR,
          category: ErrorCategories.EXTERNAL,
          statusCode: 500,
          details: { status: response.data.status, zipCode },
          isOperational: true,
        } as AppError;
      }
      
      const results = response.data.results;
      
      if (results.length === 0) {
        throw {
          name: 'NotFoundError',
          message: 'ZIP code not found',
          code: ErrorCodes.NOT_FOUND,
          category: ErrorCategories.RESOURCE,
          statusCode: 404,
          details: { zipCode },
          isOperational: true,
        } as AppError;
      }
      
      const result = results[0];
      
      // Check if we have geometry data
      if (!result.geometry || !result.geometry.bounds) {
        // If bounds are not available, create a circular boundary around the center point
        const center = result.geometry.location;
        const radius = 2000; // Approximate radius for a ZIP code in meters
        const numPoints = 20; // Number of points to create a circle
        
        const circularBoundary = [];
        for (let i = 0; i < numPoints; i++) {
          const angle = (i / numPoints) * (2 * Math.PI);
          const dx = Math.cos(angle) * radius / 111320; // Convert meters to degrees (approximation)
          const dy = Math.sin(angle) * radius / (111320 * Math.cos(center.lat * Math.PI / 180));
          
          circularBoundary.push({
            lat: center.lat + dy,
            lng: center.lng + dx,
          });
        }
        
        logger.debug('Created approximate circular boundary for ZIP code', { 
          zipCode, 
          pointCount: circularBoundary.length 
        });
        
        return circularBoundary;
      }
      
      // If we have bounds, create a rectangular boundary
      const bounds = result.geometry.bounds;
      const boundary = [
        { lat: bounds.northeast.lat, lng: bounds.northeast.lng },
        { lat: bounds.northeast.lat, lng: bounds.southwest.lng },
        { lat: bounds.southwest.lat, lng: bounds.southwest.lng },
        { lat: bounds.southwest.lat, lng: bounds.northeast.lng },
        { lat: bounds.northeast.lat, lng: bounds.northeast.lng }, // Close the loop
      ];
      
      logger.debug('Retrieved boundary for ZIP code', { 
        zipCode, 
        pointCount: boundary.length 
      });
      
      return boundary;
      
    } catch (error) {
      if ((error as AppError).isOperational) {
        throw error;
      }
      
      // Retry logic for non-operational errors
      retries++;
      
      if (retries > GOOGLE_MAPS_RETRY_COUNT) {
        logger.error('Max retries reached for ZIP code boundary', { zipCode, retries });
        throw handleGoogleMapsError(error as Error);
      }
      
      // Exponential backoff
      const delay = Math.pow(2, retries) * 1000;
      logger.debug(`Retrying ZIP code boundary (${retries}/${GOOGLE_MAPS_RETRY_COUNT}) after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // This should never be reached due to the error handling above
  throw handleGoogleMapsError(new Error('Unknown error while getting ZIP code boundary'));
}

/**
 * Service class implementing the ExternalServiceInterface for Google Maps integration
 */
export class GoogleMapsService implements ExternalServiceInterface {
  private client: Client;
  private apiKey: string;
  private timeout: number;
  private maxRetries: number;
  
  /**
   * Initializes the Google Maps service with configuration
   */
  constructor() {
    this.apiKey = GOOGLE_MAPS_API_KEY;
    this.timeout = GOOGLE_MAPS_TIMEOUT;
    this.maxRetries = GOOGLE_MAPS_RETRY_COUNT;
    this.client = createGoogleMapsClient();
  }
  
  /**
   * Initializes the Google Maps service
   * @returns Promise that resolves when initialization is complete
   */
  async initialize(): Promise<void> {
    if (!this.apiKey) {
      throw {
        name: 'ConfigurationError',
        message: 'Google Maps API key is required',
        code: ErrorCodes.INTERNAL_SERVER_ERROR,
        category: ErrorCategories.SYSTEM,
        statusCode: 500,
        isOperational: true,
      } as AppError;
    }
    
    // Test the connection with a simple geocode request
    try {
      await this.geocodeAddress('New York, NY');
      logger.info('Google Maps service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Google Maps service', { error });
      throw error;
    }
  }
  
  /**
   * Makes a request to the Google Maps API
   * @param endpoint - The API endpoint
   * @param params - Request parameters
   * @returns Promise resolving to API response
   */
  async request<T = any>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
    // Ensure API key is included
    const paramsWithKey = {
      ...params,
      key: this.apiKey,
    };
    
    let retries = 0;
    
    while (retries <= this.maxRetries) {
      try {
        let response;
        
        switch (endpoint) {
          case 'geocode':
            response = await this.client.geocode({ params: paramsWithKey });
            break;
          case 'reverseGeocode':
            response = await this.client.reverseGeocode({ params: paramsWithKey });
            break;
          case 'placeDetails':
            response = await this.client.placeDetails({ params: paramsWithKey });
            break;
          case 'placesNearby':
            response = await this.client.placesNearby({ params: paramsWithKey });
            break;
          case 'directions':
            response = await this.client.directions({ params: paramsWithKey });
            break;
          case 'distancematrix':
            response = await this.client.distancematrix({ params: paramsWithKey });
            break;
          default:
            throw new Error(`Unsupported endpoint: ${endpoint}`);
        }
        
        return response.data as T;
        
      } catch (error) {
        // Retry logic for certain errors
        if (axios.isAxiosError(error)) {
          const axiosError = error as AxiosError;
          
          if (axiosError.response && [429, 500, 502, 503, 504].includes(axiosError.response.status)) {
            retries++;
            
            if (retries > this.maxRetries) {
              throw handleGoogleMapsError(error);
            }
            
            // Exponential backoff
            const delay = Math.pow(2, retries) * 1000;
            logger.debug(`Retrying ${endpoint} (${retries}/${this.maxRetries}) after ${delay}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }
        
        // Not a retryable error, or not an Axios error
        throw handleGoogleMapsError(error as Error);
      }
    }
    
    // This should never be reached
    throw new Error('Unknown error in Google Maps request');
  }
  
  /**
   * Validates a webhook payload from Google Maps (not typically used)
   * @param payload - The webhook payload
   * @returns Promise resolving to validation result
   */
  async validateWebhook(): Promise<boolean> {
    // Google Maps doesn't typically use webhooks
    // This is a placeholder implementation
    return true;
  }
  
  /**
   * Checks the status of the Google Maps API service
   * @returns Promise resolving to service status
   */
  async getStatus(): Promise<{ status: string; details: Record<string, any>; lastChecked: Date }> {
    try {
      // Make a simple request to check if the service is available
      await this.geocodeAddress('New York, NY');
      
      return {
        status: 'available',
        details: {
          apiKey: this.apiKey ? 'Configured' : 'Not configured',
          timeout: this.timeout,
        },
        lastChecked: new Date(),
      };
    } catch (error) {
      return {
        status: 'unavailable',
        details: {
          error: (error as Error).message,
          apiKey: this.apiKey ? 'Configured' : 'Not configured',
        },
        lastChecked: new Date(),
      };
    }
  }
  
  /**
   * Converts a physical address to geographic coordinates
   * @param address - The address to geocode
   * @returns Promise resolving to geographic coordinates with address components
   */
  async geocodeAddress(address: string): Promise<GeoLocation> {
    return geocodeAddress(address);
  }
  
  /**
   * Converts geographic coordinates to a physical address
   * @param latitude - The latitude coordinate
   * @param longitude - The longitude coordinate
   * @returns Promise resolving to address information with coordinates
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<GeoLocation> {
    return reverseGeocode(latitude, longitude);
  }
  
  /**
   * Calculates the distance between two locations
   * @param origin - The starting location
   * @param destination - The ending location
   * @param mode - The travel mode (driving, walking, bicycling, transit)
   * @returns Promise resolving to distance in miles and duration in minutes
   */
  async calculateDistance(
    origin: GeoLocation | { latitude: number; longitude: number },
    destination: GeoLocation | { latitude: number; longitude: number },
    mode: string = 'driving'
  ): Promise<{ distance: number; duration: number }> {
    return calculateDistance(origin, destination, mode);
  }
}