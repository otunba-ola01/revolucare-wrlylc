/**
 * Express middleware for centralized error handling in the Revolucare platform.
 * This middleware catches all errors thrown during request processing, 
 * formats them into standardized API responses, logs them appropriately, 
 * and sends consistent error responses to clients.
 * 
 * @module api/middlewares/error.middleware
 */

import { Request, Response, NextFunction } from 'express'; // express@4.18.2
import { isAppError, formatErrorResponse, logError, errorFactory } from '../../utils/error-handler';
import { AppError, ErrorHandlerOptions } from '../../interfaces/error.interface';
import { ErrorCodes, ErrorCategories } from '../../constants/error-codes';
import { logger, getCorrelationId } from '../../utils/logger';

// Set default environment
const NODE_ENV = process.env.NODE_ENV || 'development';

// Default error handling options
const DEFAULT_ERROR_OPTIONS: ErrorHandlerOptions = {
  logError: true,
  logLevel: 'error',
  includeDetails: NODE_ENV === 'development',
  includeStack: NODE_ENV === 'development'
};

/**
 * Express middleware that handles errors and sends standardized error responses.
 * This is the central error handling point for the entire application.
 * 
 * @param err - The error object thrown during request processing
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function (not used but required for Express error middleware)
 */
export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Ensure we have an AppError with standardized properties
  let appError: AppError;
  
  if (isAppError(err)) {
    // Already an AppError, use it directly
    appError = err;
  } else {
    // Convert to AppError with appropriate classification
    appError = errorFactory.createInternalServerError(
      err.message || 'An unexpected error occurred',
      undefined,
      err
    );
  }
  
  // Extract context information from the request for logging
  const requestContext = {
    url: req.originalUrl || req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    userId: req.user?.id, // If authentication middleware adds user to request
    correlationId: getCorrelationId() || req.headers['x-correlation-id'],
    requestId: req.headers['x-request-id'],
    referrer: req.headers.referer || req.headers.referrer
  };
  
  // Log the error with context
  logError(appError, requestContext, DEFAULT_ERROR_OPTIONS);
  
  // Format the error response based on environment
  const errorResponse = formatErrorResponse(appError, DEFAULT_ERROR_OPTIONS);
  
  // Send the error response with appropriate status code
  res.status(appError.statusCode || 500).json(errorResponse);
};

/**
 * Express middleware that handles 404 Not Found errors for undefined routes.
 * This middleware should be used after all route definitions.
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const notFoundMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Create a Not Found error and pass it to the error handler
  const notFoundError = errorFactory.createNotFoundError(
    `Route not found: ${req.method} ${req.originalUrl || req.url}`
  );
  
  // Pass the error to the next middleware (which will be the error handler)
  next(notFoundError);
};