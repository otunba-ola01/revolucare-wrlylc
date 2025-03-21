/**
 * Express middleware that validates incoming request data against Zod schemas.
 * It provides a consistent approach to request validation across all API endpoints,
 * ensuring data integrity and proper error handling for validation failures.
 */

import { Request, Response, NextFunction } from 'express'; // express@4.18.2
import { z } from 'zod'; // zod@3.21.4
import { validateRequest, validateQueryParams } from '../../utils/validation';
import { errorFactory } from '../../utils/error-handler';
import { ErrorCodes } from '../../constants/error-codes';
import { logger } from '../../utils/logger';

/**
 * Middleware factory that creates request body validation middleware
 * 
 * @param schema - Zod schema to validate against
 * @returns Middleware function that validates request body
 */
export const validateBody = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate request body against the schema
      const validatedData = validateRequest(schema, req.body);
      
      // Replace request body with validated data
      req.body = validatedData;
      
      // Continue to the next middleware
      next();
    } catch (error) {
      // Log validation failure details
      logger.debug('Request body validation failed', {
        path: req.path,
        error
      });
      
      // Pass the error to the next middleware for consistent error handling
      next(error);
    }
  };
};

/**
 * Middleware factory that creates request parameters validation middleware
 * 
 * @param schema - Zod schema to validate against
 * @returns Middleware function that validates request parameters
 */
export const validateParams = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate request parameters against the schema
      const validatedData = validateRequest(schema, req.params);
      
      // Replace request parameters with validated data
      req.params = validatedData;
      
      // Continue to the next middleware
      next();
    } catch (error) {
      // Log validation failure details
      logger.debug('Request parameters validation failed', {
        path: req.path,
        params: req.params,
        error
      });
      
      // Pass the error to the next middleware for consistent error handling
      next(error);
    }
  };
};

/**
 * Middleware factory that creates query parameters validation middleware
 * 
 * @param schema - Zod schema to validate against
 * @returns Middleware function that validates query parameters
 */
export const validateQuery = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate query parameters against the schema
      const validatedData = validateQueryParams(schema, req.query);
      
      // Replace query parameters with validated data
      req.query = validatedData;
      
      // Continue to the next middleware
      next();
    } catch (error) {
      // Log validation failure details
      logger.debug('Query parameters validation failed', {
        path: req.path,
        query: req.query,
        error
      });
      
      // Pass the error to the next middleware for consistent error handling
      next(error);
    }
  };
};

/**
 * Middleware that validates file uploads
 * Requires Multer middleware to be used before this middleware
 * 
 * @param req - Express request object (with Multer file properties)
 * @param res - Express response object
 * @param next - Express next function
 */
export const validateFile = (req: Request, res: Response, next: NextFunction): void => {
  // Check if request contains files
  if (!req.files && !req.file) {
    logger.debug('File validation failed: No files uploaded', {
      path: req.path
    });
    
    const validationError = errorFactory.createValidationError(
      'No files were uploaded',
      { 
        validationErrors: [
          {
            field: 'file',
            message: 'Required file is missing',
            value: null
          }
        ]
      }
    );
    
    return next(validationError);
  }
  
  // Define allowed MIME types and max file size
  const allowedMimeTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain', 'text/csv'
  ];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  const validationErrors = [];
  
  // Validate single file upload
  if (req.file) {
    const file = req.file;
    
    // Check MIME type
    if (!allowedMimeTypes.includes(file.mimetype)) {
      validationErrors.push({
        field: 'file',
        message: `File type ${file.mimetype} is not allowed`,
        value: file.originalname
      });
    }
    
    // Check file size
    if (file.size > maxSize) {
      validationErrors.push({
        field: 'file',
        message: `File size exceeds maximum of ${maxSize / (1024 * 1024)}MB`,
        value: file.size
      });
    }
  }
  
  // Validate multiple file upload
  if (req.files) {
    // Handle array of files
    if (Array.isArray(req.files)) {
      req.files.forEach((file, index) => {
        // Check MIME type
        if (!allowedMimeTypes.includes(file.mimetype)) {
          validationErrors.push({
            field: `files[${index}]`,
            message: `File type ${file.mimetype} is not allowed`,
            value: file.originalname
          });
        }
        
        // Check file size
        if (file.size > maxSize) {
          validationErrors.push({
            field: `files[${index}]`,
            message: `File size exceeds maximum of ${maxSize / (1024 * 1024)}MB`,
            value: file.size
          });
        }
      });
    } else {
      // Handle object with field names as keys
      Object.keys(req.files).forEach((fieldName) => {
        const fieldFiles = req.files[fieldName];
        // Convert to array if it's not already
        const files = Array.isArray(fieldFiles) ? fieldFiles : [fieldFiles];
        
        files.forEach((file, index) => {
          // Check MIME type
          if (!allowedMimeTypes.includes(file.mimetype)) {
            validationErrors.push({
              field: `${fieldName}[${index}]`,
              message: `File type ${file.mimetype} is not allowed`,
              value: file.originalname
            });
          }
          
          // Check file size
          if (file.size > maxSize) {
            validationErrors.push({
              field: `${fieldName}[${index}]`,
              message: `File size exceeds maximum of ${maxSize / (1024 * 1024)}MB`,
              value: file.size
            });
          }
        });
      });
    }
  }
  
  // If we have validation errors, create a validation error
  if (validationErrors.length > 0) {
    logger.debug('File validation failed', {
      path: req.path,
      validationErrors
    });
    
    const validationError = errorFactory.createValidationError(
      'File validation failed',
      { validationErrors }
    );
    
    return next(validationError);
  }
  
  // If we reach here, all validations passed
  next();
};