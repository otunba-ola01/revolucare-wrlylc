/**
 * Utility module that provides comprehensive error handling functionality for the Revolucare platform,
 * including error creation, formatting, logging, and classification.
 * 
 * This module implements a consistent approach to error management across the application,
 * ensuring proper error responses, detailed logging, and appropriate error categorization.
 * 
 * @module utils/error-handler
 */

import { 
  AppError, 
  ValidationError, 
  ErrorHandlerOptions, 
  ErrorResponseBody,
  ErrorFactory
} from '../interfaces/error.interface';
import {
  ErrorCodes,
  ErrorCategories,
  ErrorCodeMapping,
  DEFAULT_ERROR_CODE,
  DEFAULT_ERROR_MESSAGE
} from '../constants/error-codes';
import { logger, redactSensitiveData, getCorrelationId } from './logger';

/**
 * Default options for error handling behavior
 */
const DEFAULT_ERROR_OPTIONS: ErrorHandlerOptions = {
  logError: true,
  logLevel: 'error',
  includeDetails: true,
  includeStack: false
};

/**
 * Creates a standardized AppError instance with consistent properties
 * 
 * @param message - Human-readable error message
 * @param code - Error code from ErrorCodes enum
 * @param details - Additional error details (optional)
 * @param cause - Original error that caused this error (optional)
 * @returns Standardized error object with consistent properties
 */
export function createAppError(
  message: string, 
  code: ErrorCodes = DEFAULT_ERROR_CODE, 
  details?: Record<string, any>,
  cause?: Error
): AppError {
  // Get error mapping from the error code
  const errorMapping = ErrorCodeMapping[code] || ErrorCodeMapping[DEFAULT_ERROR_CODE];
  
  // Create new error with provided message or default message
  const error = new Error(message || errorMapping.defaultMessage) as AppError;
  
  // Enhance the error with AppError properties
  error.name = 'AppError';
  error.code = code;
  error.category = errorMapping.category;
  error.statusCode = errorMapping.statusCode;
  
  // Set operational flag based on category
  error.isOperational = errorMapping.category !== ErrorCategories.SYSTEM;
  
  // Add details if provided
  if (details) {
    error.details = details;
  }
  
  // Add original cause if provided
  if (cause) {
    error.cause = cause;
  }
  
  return error;
}

/**
 * Type guard function to check if an error is an AppError
 * 
 * @param error - The error to check
 * @returns True if the error is an AppError, false otherwise
 */
export function isAppError(error: unknown): error is AppError {
  if (!error || typeof error !== 'object') {
    return false;
  }
  
  return (
    'code' in error &&
    'category' in error &&
    'statusCode' in error &&
    'isOperational' in error
  );
}

/**
 * Formats an error into a standardized API response structure
 * 
 * @param error - The error to format
 * @param options - Configuration options for the error response
 * @returns Standardized error response for API endpoints
 */
export function formatErrorResponse(
  error: AppError,
  options?: Partial<ErrorHandlerOptions>
): ErrorResponseBody {
  // Merge provided options with defaults
  const mergedOptions: ErrorHandlerOptions = {
    ...DEFAULT_ERROR_OPTIONS,
    ...options
  };
  
  // Create the error response object
  const response: ErrorResponseBody = {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode
    }
  };
  
  // Add error details if configured
  if (mergedOptions.includeDetails && error.details) {
    response.error.details = error.details;
  }
  
  // Add stack trace in development environment if configured
  if (mergedOptions.includeStack && error.stack && process.env.NODE_ENV !== 'production') {
    response.error.stack = error.stack;
  }
  
  return response;
}

/**
 * Logs an error with appropriate context and log level
 * 
 * @param error - The error to log
 * @param context - Additional context to include in the log
 * @param options - Configuration options for error logging
 */
export function logError(
  error: AppError,
  context: Record<string, any> = {},
  options?: Partial<ErrorHandlerOptions>
): void {
  // Merge provided options with defaults
  const mergedOptions: ErrorHandlerOptions = {
    ...DEFAULT_ERROR_OPTIONS,
    ...options
  };
  
  // Skip logging if disabled
  if (!mergedOptions.logError) {
    return;
  }
  
  // Prepare the context for logging
  const logContext = {
    ...context,
    errorCode: error.code,
    errorCategory: error.category,
    statusCode: error.statusCode,
    isOperational: error.isOperational
  };
  
  // Add details if available
  if (error.details) {
    logContext.errorDetails = error.details;
  }
  
  // Add cause if available
  if (error.cause) {
    logContext.cause = error.cause instanceof Error 
      ? {
          name: error.cause.name,
          message: error.cause.message,
          stack: error.cause.stack
        }
      : error.cause;
  }
  
  // Add correlation ID to context if available
  const correlationId = getCorrelationId();
  if (correlationId) {
    logContext.correlationId = correlationId;
  }
  
  // Redact sensitive data
  const safeContext = redactSensitiveData(logContext);
  
  // Determine the appropriate log level
  const logLevel = mergedOptions.logLevel || (
    error.category === ErrorCategories.SYSTEM || error.category === ErrorCategories.EXTERNAL
      ? 'error'
      : error.category === ErrorCategories.VALIDATION || error.category === ErrorCategories.RESOURCE
        ? 'info'
        : 'warn'
  );
  
  // Log the error with the appropriate level
  switch (logLevel) {
    case 'error':
      logger.error(error.message, safeContext);
      break;
    case 'warn':
      logger.warn(error.message, safeContext);
      break;
    case 'info':
      logger.info(error.message, safeContext);
      break;
    case 'debug':
      logger.debug(error.message, safeContext);
      break;
    default:
      logger.error(error.message, safeContext);
  }
}

/**
 * Creates a factory object for generating different types of application errors
 * 
 * @returns Factory object with methods for creating different error types
 */
export function createErrorFactory(): ErrorFactory {
  return {
    /**
     * Creates a generic application error
     */
    createError(message: string, code: ErrorCodes, details?: Record<string, any>, cause?: Error): AppError {
      return createAppError(message, code, details, cause);
    },
    
    /**
     * Creates a validation error
     */
    createValidationError(message: string, details?: Record<string, any>, cause?: Error): AppError {
      return createAppError(
        message || 'The provided data failed validation requirements',
        ErrorCodes.VALIDATION_ERROR,
        details,
        cause
      );
    },
    
    /**
     * Creates a not found error
     */
    createNotFoundError(message: string, details?: Record<string, any>, cause?: Error): AppError {
      return createAppError(
        message || 'The requested resource was not found',
        ErrorCodes.NOT_FOUND,
        details,
        cause
      );
    },
    
    /**
     * Creates an unauthorized error
     */
    createUnauthorizedError(message: string, details?: Record<string, any>, cause?: Error): AppError {
      return createAppError(
        message || 'Authentication is required to access this resource',
        ErrorCodes.UNAUTHORIZED,
        details,
        cause
      );
    },
    
    /**
     * Creates a forbidden error
     */
    createForbiddenError(message: string, details?: Record<string, any>, cause?: Error): AppError {
      return createAppError(
        message || 'You do not have permission to access this resource',
        ErrorCodes.FORBIDDEN,
        details,
        cause
      );
    },
    
    /**
     * Creates an internal server error
     */
    createInternalServerError(message: string, details?: Record<string, any>, cause?: Error): AppError {
      return createAppError(
        message || 'An unexpected error occurred while processing your request',
        ErrorCodes.INTERNAL_SERVER_ERROR,
        details,
        cause
      );
    }
  };
}

/**
 * Error factory singleton instance for creating standardized application errors
 */
export const errorFactory = createErrorFactory();