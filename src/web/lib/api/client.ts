import { ApiRequestConfig, ApiOptions, ApiResponse, ErrorResponse } from '../../types/api';
import { TIMEOUTS, ERROR_MESSAGES } from '../../config/constants';
import { isBrowser } from '../utils/browser';
import { getSession } from '../auth/session';

/**
 * Core function to make API requests with error handling and authentication
 * 
 * @param config Configuration options for the API request
 * @returns Promise resolving to the API response with data of type T
 */
export async function request<T>(config: ApiRequestConfig): Promise<ApiResponse<T>> {
  // Merge default options with provided config
  const defaultConfig: Partial<ApiRequestConfig> = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: TIMEOUTS.API_REQUEST,
    withCredentials: true,
  };

  const mergedConfig = { ...defaultConfig, ...config };
  const { url, method, data, params, headers, timeout, withCredentials } = mergedConfig;

  // Get authentication token if available
  let session = null;
  if (isBrowser() || typeof window === 'undefined') {
    try {
      session = await getSession();
    } catch (error) {
      console.error('Failed to get session', error);
    }
  }

  // Set authorization header if session exists
  const requestHeaders: Record<string, string> = { ...headers };
  if (session?.user) {
    requestHeaders['Authorization'] = `Bearer ${session.accessToken || ''}`;
  }

  // Format query parameters
  const queryString = formatQueryParams(params);
  const fullUrl = `${url}${queryString}`;

  // Set up AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    // Prepare fetch options
    const fetchOptions: RequestInit = {
      method,
      headers: requestHeaders,
      credentials: withCredentials ? 'include' : 'same-origin',
      signal: controller.signal,
    };

    // Add body for non-GET requests
    if (method !== 'GET' && data !== undefined) {
      fetchOptions.body = JSON.stringify(data);
    }

    // Make the request
    const response = await fetch(fullUrl, fetchOptions);
    
    // Clear timeout
    clearTimeout(timeoutId);
    
    // Parse response based on content type
    let responseData: any;
    const contentType = response.headers.get('Content-Type') || '';
    
    if (contentType.includes('application/json')) {
      responseData = await response.json();
    } else if (contentType.includes('text/')) {
      const text = await response.text();
      // Wrap text in standard response format
      responseData = {
        success: response.ok,
        data: text as unknown as T,
        message: response.ok ? 'Success' : 'Error',
        timestamp: new Date().toISOString()
      };
    } else {
      const blob = await response.blob();
      // Wrap blob in standard response format
      responseData = {
        success: response.ok,
        data: blob as unknown as T,
        message: response.ok ? 'Success' : 'Error',
        timestamp: new Date().toISOString()
      };
    }
    
    // Check if response is successful
    if (response.ok) {
      // If response is already in the expected format, return it
      if (responseData.success !== undefined && responseData.data !== undefined) {
        return responseData as ApiResponse<T>;
      }
      
      // Otherwise, wrap it in standard response format
      return {
        success: true,
        data: responseData as T,
        message: null,
        timestamp: new Date().toISOString()
      };
    }
    
    // Handle error response
    const errorResponse = handleApiError(responseData || response);
    throw errorResponse;
  } catch (error) {
    // Clear timeout
    clearTimeout(timeoutId);
    
    // Handle different error types
    if (error instanceof DOMException && error.name === 'AbortError') {
      // Request was aborted due to timeout
      const timeoutError = handleApiError(new Error(ERROR_MESSAGES.TIMEOUT_ERROR));
      throw timeoutError;
    }
    
    // If the error is already an ErrorResponse, just rethrow it
    if (error && typeof error === 'object' && 'success' in error && 'error' in error) {
      throw error;
    }
    
    const formattedError = handleApiError(error);
    throw formattedError;
  }
}

/**
 * Make a GET request to the API
 * 
 * @param url The API endpoint URL
 * @param params Optional query parameters
 * @param options Optional request configuration
 * @returns Promise resolving to the response data
 */
export async function get<T>(url: string, params?: Record<string, any>, options?: ApiOptions): Promise<T> {
  const response = await request<T>({
    url,
    method: 'GET',
    params,
    ...options,
  });
  
  return response.data;
}

/**
 * Make a POST request to the API
 * 
 * @param url The API endpoint URL
 * @param data Optional request body
 * @param options Optional request configuration
 * @returns Promise resolving to the response data
 */
export async function post<T>(url: string, data?: any, options?: ApiOptions): Promise<T> {
  const response = await request<T>({
    url,
    method: 'POST',
    data,
    ...options,
  });
  
  return response.data;
}

/**
 * Make a PUT request to the API
 * 
 * @param url The API endpoint URL
 * @param data Optional request body
 * @param options Optional request configuration
 * @returns Promise resolving to the response data
 */
export async function put<T>(url: string, data?: any, options?: ApiOptions): Promise<T> {
  const response = await request<T>({
    url,
    method: 'PUT',
    data,
    ...options,
  });
  
  return response.data;
}

/**
 * Make a PATCH request to the API
 * 
 * @param url The API endpoint URL
 * @param data Optional request body
 * @param options Optional request configuration
 * @returns Promise resolving to the response data
 */
export async function patch<T>(url: string, data?: any, options?: ApiOptions): Promise<T> {
  const response = await request<T>({
    url,
    method: 'PATCH',
    data,
    ...options,
  });
  
  return response.data;
}

/**
 * Make a DELETE request to the API
 * 
 * @param url The API endpoint URL
 * @param options Optional request configuration
 * @returns Promise resolving to the response data
 */
export async function deleteRequest<T>(url: string, options?: ApiOptions): Promise<T> {
  const response = await request<T>({
    url,
    method: 'DELETE',
    ...options,
  });
  
  return response.data;
}

/**
 * Format an object of parameters into a URL query string
 * 
 * @param params Object containing query parameters
 * @returns Formatted query string starting with '?' or empty string if no params
 */
export function formatQueryParams(params?: Record<string, any>): string {
  if (!params || Object.keys(params).length === 0) {
    return '';
  }
  
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }
    
    if (Array.isArray(value)) {
      value.forEach(item => searchParams.append(`${key}[]`, String(item)));
    } else if (typeof value === 'object') {
      searchParams.append(key, JSON.stringify(value));
    } else {
      searchParams.append(key, String(value));
    }
  });
  
  return `?${searchParams.toString()}`;
}

/**
 * Process API error responses into a standardized format
 * 
 * @param error The error to process
 * @returns Standardized error response object
 */
export function handleApiError(error: Error | Response | any): ErrorResponse {
  // Default error response structure
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      code: 'UNKNOWN_ERROR',
      message: ERROR_MESSAGES.GENERIC_ERROR,
      status: 500,
      details: null,
      path: null,
    },
    timestamp: new Date().toISOString(),
  };
  
  // Network or timeout error
  if (error instanceof Error) {
    if (error.message.includes('timeout') || error.message === ERROR_MESSAGES.TIMEOUT_ERROR) {
      errorResponse.error.code = 'GATEWAY_TIMEOUT';
      errorResponse.error.message = ERROR_MESSAGES.TIMEOUT_ERROR;
      errorResponse.error.status = 504;
    } else if (error.message.includes('fetch') || error.message.includes('network')) {
      errorResponse.error.code = 'NETWORK_ERROR';
      errorResponse.error.message = ERROR_MESSAGES.NETWORK_ERROR;
      errorResponse.error.status = 503;
    } else {
      errorResponse.error.message = error.message;
    }
    return errorResponse;
  }
  
  // Response error with HTTP status
  if (error instanceof Response) {
    errorResponse.error.status = error.status;
    errorResponse.error.path = error.url;
    
    switch (error.status) {
      case 400:
        errorResponse.error.code = 'BAD_REQUEST';
        errorResponse.error.message = ERROR_MESSAGES.VALIDATION_ERROR;
        break;
      case 401:
        errorResponse.error.code = 'UNAUTHORIZED';
        errorResponse.error.message = ERROR_MESSAGES.AUTHENTICATION_ERROR;
        break;
      case 403:
        errorResponse.error.code = 'FORBIDDEN';
        errorResponse.error.message = ERROR_MESSAGES.AUTHORIZATION_ERROR;
        break;
      case 404:
        errorResponse.error.code = 'NOT_FOUND';
        errorResponse.error.message = ERROR_MESSAGES.NOT_FOUND_ERROR;
        break;
      case 422:
        errorResponse.error.code = 'UNPROCESSABLE_ENTITY';
        errorResponse.error.message = ERROR_MESSAGES.VALIDATION_ERROR;
        break;
      case 500:
        errorResponse.error.code = 'INTERNAL_SERVER_ERROR';
        errorResponse.error.message = ERROR_MESSAGES.SERVER_ERROR;
        break;
      case 502:
        errorResponse.error.code = 'BAD_GATEWAY';
        errorResponse.error.message = ERROR_MESSAGES.SERVER_ERROR;
        break;
      case 503:
        errorResponse.error.code = 'SERVICE_UNAVAILABLE';
        errorResponse.error.message = ERROR_MESSAGES.SERVER_ERROR;
        break;
      case 504:
        errorResponse.error.code = 'GATEWAY_TIMEOUT';
        errorResponse.error.message = ERROR_MESSAGES.TIMEOUT_ERROR;
        break;
      default:
        errorResponse.error.code = `HTTP_ERROR_${error.status}`;
        errorResponse.error.message = error.statusText || ERROR_MESSAGES.GENERIC_ERROR;
    }
    
    return errorResponse;
  }
  
  // API error response with structure
  if (error && typeof error === 'object') {
    // If it's already in our ErrorResponse format
    if (error.error && typeof error.error === 'object') {
      if (typeof error.success === 'boolean' && error.timestamp) {
        return error as ErrorResponse;
      }
      
      // Just has the error object but missing the wrapper
      errorResponse.error = {
        ...errorResponse.error,
        ...error.error
      };
      return errorResponse;
    } 
    // Common API error formats
    else if (error.message) {
      errorResponse.error.message = error.message;
      if (error.code) errorResponse.error.code = error.code;
      if (error.status) errorResponse.error.status = error.status;
      if (error.details) errorResponse.error.details = error.details;
      if (error.path) errorResponse.error.path = error.path;
    }
  }
  
  return errorResponse;
}

// Export functions
export { deleteRequest as delete, formatQueryParams, handleApiError };