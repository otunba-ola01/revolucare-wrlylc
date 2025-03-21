/**
 * Error codes for the Revolucare platform.
 * 
 * This file defines standardized error codes, categories, and HTTP status code mappings
 * to ensure consistent error handling, logging, and client responses across the application.
 */

/**
 * Enumeration of all possible error codes used throughout the application.
 * 
 * These codes should be used consistently when throwing and handling errors to
 * provide standardized error responses and facilitate troubleshooting.
 */
export enum ErrorCodes {
  // Validation Errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
  
  // Authentication Errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  
  // Authorization Errors
  FORBIDDEN = 'FORBIDDEN',
  
  // Resource Errors
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // System Errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  
  // Service Availability Errors
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  GATEWAY_TIMEOUT = 'GATEWAY_TIMEOUT',
  
  // External Service Errors
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
  PAYMENT_PROCESSING_ERROR = 'PAYMENT_PROCESSING_ERROR',
  CALENDAR_INTEGRATION_ERROR = 'CALENDAR_INTEGRATION_ERROR',
  NOTIFICATION_ERROR = 'NOTIFICATION_ERROR',
  
  // Document Processing Errors
  DOCUMENT_PROCESSING_ERROR = 'DOCUMENT_PROCESSING_ERROR',
  FILE_UPLOAD_ERROR = 'FILE_UPLOAD_ERROR',
}

/**
 * Categorization of errors for appropriate handling strategies.
 * 
 * These categories help determine how errors should be handled, logged,
 * and communicated to the client.
 */
export enum ErrorCategories {
  // Client errors that can be fixed by changing the request
  VALIDATION = 'VALIDATION',
  
  // Authentication-related errors
  AUTHENTICATION = 'AUTHENTICATION',
  
  // Permission and access control errors
  AUTHORIZATION = 'AUTHORIZATION',
  
  // Resource availability errors
  RESOURCE = 'RESOURCE',
  
  // Errors related to business rules and logic
  BUSINESS_LOGIC = 'BUSINESS_LOGIC',
  
  // Internal system errors
  SYSTEM = 'SYSTEM',
  
  // Errors from external service integrations
  EXTERNAL = 'EXTERNAL',
  
  // Temporary errors that may succeed on retry
  TRANSIENT = 'TRANSIENT',
}

/**
 * Interface defining the structure of error code mapping entries.
 */
interface ErrorCodeMappingEntry {
  statusCode: number;
  category: ErrorCategories;
  retryable: boolean;
  loggingLevel: 'info' | 'warn' | 'error';
  defaultMessage: string;
}

/**
 * Mapping of error codes to their corresponding HTTP status codes and categories.
 * 
 * This mapping provides the information needed to:
 * - Construct appropriate HTTP responses
 * - Determine error handling strategies
 * - Set appropriate logging levels
 * - Determine if an operation can be retried
 */
export const ErrorCodeMapping: Record<ErrorCodes, ErrorCodeMappingEntry> = {
  // Validation Errors
  [ErrorCodes.VALIDATION_ERROR]: {
    statusCode: 422, // Unprocessable Entity
    category: ErrorCategories.VALIDATION,
    retryable: false,
    loggingLevel: 'info',
    defaultMessage: 'The provided data failed validation requirements'
  },
  [ErrorCodes.BAD_REQUEST]: {
    statusCode: 400,
    category: ErrorCategories.VALIDATION,
    retryable: false,
    loggingLevel: 'info',
    defaultMessage: 'The request was malformed or contained invalid parameters'
  },
  
  // Authentication Errors
  [ErrorCodes.UNAUTHORIZED]: {
    statusCode: 401,
    category: ErrorCategories.AUTHENTICATION,
    retryable: false,
    loggingLevel: 'info',
    defaultMessage: 'Authentication is required to access this resource'
  },
  [ErrorCodes.INVALID_TOKEN]: {
    statusCode: 401,
    category: ErrorCategories.AUTHENTICATION,
    retryable: false,
    loggingLevel: 'info',
    defaultMessage: 'The provided authentication token is invalid'
  },
  [ErrorCodes.TOKEN_EXPIRED]: {
    statusCode: 401,
    category: ErrorCategories.AUTHENTICATION,
    retryable: false,
    loggingLevel: 'info',
    defaultMessage: 'The authentication token has expired'
  },
  
  // Authorization Errors
  [ErrorCodes.FORBIDDEN]: {
    statusCode: 403,
    category: ErrorCategories.AUTHORIZATION,
    retryable: false,
    loggingLevel: 'warn',
    defaultMessage: 'You do not have permission to access this resource'
  },
  
  // Resource Errors
  [ErrorCodes.NOT_FOUND]: {
    statusCode: 404,
    category: ErrorCategories.RESOURCE,
    retryable: false,
    loggingLevel: 'info',
    defaultMessage: 'The requested resource was not found'
  },
  [ErrorCodes.CONFLICT]: {
    statusCode: 409,
    category: ErrorCategories.RESOURCE,
    retryable: false,
    loggingLevel: 'info',
    defaultMessage: 'The request conflicts with the current state of the resource'
  },
  
  // Rate Limiting
  [ErrorCodes.RATE_LIMIT_EXCEEDED]: {
    statusCode: 429,
    category: ErrorCategories.TRANSIENT,
    retryable: true,
    loggingLevel: 'warn',
    defaultMessage: 'Rate limit exceeded, please try again later'
  },
  
  // System Errors
  [ErrorCodes.INTERNAL_SERVER_ERROR]: {
    statusCode: 500,
    category: ErrorCategories.SYSTEM,
    retryable: true,
    loggingLevel: 'error',
    defaultMessage: 'An unexpected error occurred while processing your request'
  },
  [ErrorCodes.DATABASE_ERROR]: {
    statusCode: 500,
    category: ErrorCategories.SYSTEM,
    retryable: true,
    loggingLevel: 'error',
    defaultMessage: 'A database error occurred while processing your request'
  },
  
  // Availability Errors
  [ErrorCodes.SERVICE_UNAVAILABLE]: {
    statusCode: 503,
    category: ErrorCategories.TRANSIENT,
    retryable: true,
    loggingLevel: 'error',
    defaultMessage: 'The service is temporarily unavailable, please try again later'
  },
  [ErrorCodes.GATEWAY_TIMEOUT]: {
    statusCode: 504,
    category: ErrorCategories.TRANSIENT,
    retryable: true,
    loggingLevel: 'error',
    defaultMessage: 'The request timed out while waiting for a response'
  },
  
  // External Service Errors
  [ErrorCodes.EXTERNAL_SERVICE_ERROR]: {
    statusCode: 502,
    category: ErrorCategories.EXTERNAL,
    retryable: true,
    loggingLevel: 'error',
    defaultMessage: 'An error occurred while communicating with an external service'
  },
  [ErrorCodes.AI_SERVICE_ERROR]: {
    statusCode: 502,
    category: ErrorCategories.EXTERNAL,
    retryable: true,
    loggingLevel: 'error',
    defaultMessage: 'An error occurred while processing with the AI service'
  },
  [ErrorCodes.PAYMENT_PROCESSING_ERROR]: {
    statusCode: 502,
    category: ErrorCategories.EXTERNAL,
    retryable: true,
    loggingLevel: 'error',
    defaultMessage: 'An error occurred during payment processing'
  },
  [ErrorCodes.CALENDAR_INTEGRATION_ERROR]: {
    statusCode: 502,
    category: ErrorCategories.EXTERNAL,
    retryable: true,
    loggingLevel: 'error',
    defaultMessage: 'An error occurred with the calendar integration'
  },
  [ErrorCodes.NOTIFICATION_ERROR]: {
    statusCode: 502,
    category: ErrorCategories.EXTERNAL,
    retryable: true,
    loggingLevel: 'error',
    defaultMessage: 'An error occurred while sending notifications'
  },
  
  // Document Processing Errors
  [ErrorCodes.DOCUMENT_PROCESSING_ERROR]: {
    statusCode: 500,
    category: ErrorCategories.SYSTEM,
    retryable: true,
    loggingLevel: 'error',
    defaultMessage: 'An error occurred while processing the document'
  },
  [ErrorCodes.FILE_UPLOAD_ERROR]: {
    statusCode: 500,
    category: ErrorCategories.SYSTEM,
    retryable: true,
    loggingLevel: 'error',
    defaultMessage: 'An error occurred while uploading the file'
  },
};

/**
 * Default error code to use when no specific code is provided.
 * This ensures that even unclassified errors can be properly handled.
 */
export const DEFAULT_ERROR_CODE = ErrorCodes.INTERNAL_SERVER_ERROR;

/**
 * Default error message to use when no specific message is provided.
 * This provides a generic message that doesn't expose system details.
 */
export const DEFAULT_ERROR_MESSAGE = 'An unexpected error occurred while processing your request';