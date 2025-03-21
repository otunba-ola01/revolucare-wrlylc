/**
 * Error interfaces for the Revolucare platform.
 * 
 * This file defines standardized error interfaces used throughout the application
 * to ensure consistent error handling, reporting, and client responses across
 * all components of the system.
 */

import { ErrorCodes, ErrorCategories } from '../constants/error-codes';

/**
 * Core application error interface that extends the standard Error with additional
 * properties needed for comprehensive error handling.
 * 
 * This interface provides a standardized structure for all errors in the system,
 * enabling consistent error handling, logging, and client responses.
 */
export interface AppError extends Error {
  /** The name of the error (usually the constructor name) */
  name: string;
  
  /** Human-readable error message */
  message: string;
  
  /** Specific error code from the ErrorCodes enum */
  code: ErrorCodes;
  
  /** Error category for classification and handling strategies */
  category: ErrorCategories;
  
  /** HTTP status code to return to the client */
  statusCode: number;
  
  /** Additional details about the error (optional) */
  details?: Record<string, any>;
  
  /** Original error that caused this error (optional) */
  cause?: Error;
  
  /** 
   * Indicates if this is an operational error (expected in normal operation)
   * as opposed to a programming error that should be fixed
   */
  isOperational: boolean;
  
  /** Stack trace (optional) */
  stack?: string;
}

/**
 * Interface for field-specific validation errors.
 * 
 * Used to provide detailed information about validation failures
 * for specific fields in user input or API requests.
 */
export interface ValidationError {
  /** The field/property that failed validation */
  field: string;
  
  /** Human-readable error message explaining the validation failure */
  message: string;
  
  /** The invalid value that was provided */
  value: any;
}

/**
 * Configuration options for error handling behavior.
 * 
 * These options control how errors are processed, logged, and
 * what information is included in responses.
 */
export interface ErrorHandlerOptions {
  /** Whether to log the error */
  logError: boolean;
  
  /** Log level to use ('info', 'warn', 'error') */
  logLevel: string;
  
  /** Whether to include error details in the response */
  includeDetails: boolean;
  
  /** Whether to include stack trace in the response (typically only in development) */
  includeStack: boolean;
}

/**
 * Standardized error response format for API endpoints.
 * 
 * This interface defines the structure of error responses returned to clients,
 * ensuring consistency across all API endpoints.
 */
export interface ErrorResponseBody {
  /** Always false for error responses */
  success: boolean;
  
  /** Error details */
  error: {
    /** Error code (from ErrorCodes enum) */
    code: ErrorCodes;
    
    /** Human-readable error message */
    message: string;
    
    /** HTTP status code */
    statusCode: number;
    
    /** Additional error details (optional) */
    details?: Record<string, any>;
    
    /** Stack trace (optional, typically only in development) */
    stack?: string;
  };
}

/**
 * Factory interface for creating different types of standardized errors.
 * 
 * This interface defines methods for creating various error types,
 * ensuring that all errors follow the standardized structure.
 */
export interface ErrorFactory {
  /**
   * Creates a generic application error
   * 
   * @param message Human-readable error message
   * @param code Specific error code
   * @param details Additional error details (optional)
   * @param cause Original error that caused this error (optional)
   */
  createError(message: string, code: ErrorCodes, details?: Record<string, any>, cause?: Error): AppError;
  
  /**
   * Creates a validation error
   * 
   * @param message Human-readable error message
   * @param details Validation error details, typically containing field errors
   * @param cause Original error that caused this error (optional) 
   */
  createValidationError(message: string, details?: Record<string, any>, cause?: Error): AppError;
  
  /**
   * Creates a not found error
   * 
   * @param message Human-readable error message
   * @param details Additional error details (optional)
   * @param cause Original error that caused this error (optional)
   */
  createNotFoundError(message: string, details?: Record<string, any>, cause?: Error): AppError;
  
  /**
   * Creates an unauthorized error
   * 
   * @param message Human-readable error message
   * @param details Additional error details (optional)
   * @param cause Original error that caused this error (optional)
   */
  createUnauthorizedError(message: string, details?: Record<string, any>, cause?: Error): AppError;
  
  /**
   * Creates a forbidden error
   * 
   * @param message Human-readable error message
   * @param details Additional error details (optional)
   * @param cause Original error that caused this error (optional)
   */
  createForbiddenError(message: string, details?: Record<string, any>, cause?: Error): AppError;
  
  /**
   * Creates an internal server error
   * 
   * @param message Human-readable error message
   * @param details Additional error details (optional)
   * @param cause Original error that caused this error (optional)
   */
  createInternalServerError(message: string, details?: Record<string, any>, cause?: Error): AppError;
}