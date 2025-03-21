/**
 * Middleware for parsing request bodies in different formats (JSON, URL-encoded)
 * and handling parsing errors in the Revolucare platform.
 * 
 * This file provides standardized body parsing functionality for all API endpoints.
 */

import express from 'express'; // express@4.18.2
import bodyParser from 'body-parser'; // body-parser@1.20.2
import { errorFactory } from '../utils/error-handler';
import { ErrorCodes } from '../constants/error-codes';

/**
 * Middleware for parsing JSON request bodies with specific configuration.
 * Configures body-parser with appropriate limits and options for security
 * and standardization across the application.
 * 
 * @returns Express middleware function for JSON body parsing
 */
export function jsonBodyParser(): express.RequestHandler {
  return bodyParser.json({
    limit: '10mb', // Limit payload size to prevent abuse
    strict: true,  // Only accept arrays and objects as per JSON specification
  });
}

/**
 * Middleware for parsing URL-encoded request bodies with specific configuration.
 * Configures body-parser with appropriate limits and options for supporting
 * form submissions and API requests using application/x-www-form-urlencoded.
 * 
 * @returns Express middleware function for URL-encoded body parsing
 */
export function urlencodedParser(): express.RequestHandler {
  return bodyParser.urlencoded({
    extended: true, // Parse nested objects using the qs library
    limit: '10mb',  // Limit payload size to prevent abuse
  });
}

/**
 * Middleware for handling errors that occur during body parsing.
 * Catches and standardizes errors from JSON parsing and form data parsing,
 * providing consistent error responses for malformed request bodies.
 * 
 * @returns Express error middleware function
 */
export function bodyParserErrorHandler(): express.ErrorRequestHandler {
  return (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Determine if this is a body parsing error
    const isBodyParserError = 
      // JSON syntax errors
      (err instanceof SyntaxError && 'body' in err) || 
      // body-parser errors typically have a type property
      (err.type && (
        err.type === 'entity.too.large' ||
        err.type === 'entity.parse.failed' ||
        err.type.startsWith('encoding.') ||
        err.type.startsWith('charset.') ||
        err.type.startsWith('entity.')
      ));
    
    if (isBodyParserError) {
      // Create a standardized validation error using our error factory
      const validationError = errorFactory.createValidationError(
        'Request body parsing failed',
        {
          error: err.message,
          type: err.type || (err instanceof SyntaxError ? 'syntax_error' : 'parse_error'),
          path: req.path,
          method: req.method
        },
        err // Pass the original error as the cause for debugging
      );
      
      // Send the error response in the standard format expected by clients
      return res.status(validationError.statusCode).json({
        success: false,
        error: {
          code: validationError.code,
          message: validationError.message,
          statusCode: validationError.statusCode,
          details: validationError.details
        }
      });
    }
    
    // If it's not a body parsing error, pass it to the next error handler
    next(err);
  };
}