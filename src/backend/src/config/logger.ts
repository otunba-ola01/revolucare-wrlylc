/**
 * Configuration module for the application's logging system using Winston.
 * Provides structured logging with support for different environments,
 * sensitive data redaction, and integration with Express middleware.
 * 
 * @module config/logger
 */

import winston from 'winston'; // winston@3.10.0
import { format, transports } from 'winston'; // winston@3.10.0
import path from 'path'; // path@16.0.0

// Environment variables with defaults
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const NODE_ENV = process.env.NODE_ENV || 'development';
const LOG_DIR = process.env.LOG_DIR || 'logs';

/**
 * Determines the appropriate log level based on environment and configuration
 * @returns The log level to use (debug, info, warn, error)
 */
const getLogLevel = (): string => {
  // If LOG_LEVEL is explicitly set, use it
  if (process.env.LOG_LEVEL) {
    return process.env.LOG_LEVEL;
  }
  
  // Otherwise, use environment-specific defaults
  switch (NODE_ENV) {
    case 'development':
      return 'debug';
    case 'test':
      return 'error'; // Less verbose in test to reduce noise
    case 'production':
    default:
      return 'info';
  }
};

/**
 * Creates the format configuration for Winston logger
 * @returns Winston format configuration
 */
const createLoggerFormat = () => {
  // Sensitive field patterns that should be redacted
  const sensitiveFields = [
    'password', 'token', 'secret', 'authorization', 'cookie',
    'ssn', 'social', 'creditcard', 'cardnumber', 'cvv',
    'medicalrecord', 'diagnosis', 'treatment', 'phi', 'pii'
  ];
  
  // Custom format to redact sensitive information
  const redactSensitive = format((info) => {
    const redactObject = (obj: Record<string, any>): Record<string, any> => {
      if (!obj || typeof obj !== 'object') return obj;
      
      const result = { ...obj };
      
      for (const key in result) {
        if (Object.prototype.hasOwnProperty.call(result, key)) {
          // Check if key matches any sensitive field pattern
          if (sensitiveFields.some(pattern => key.toLowerCase().includes(pattern))) {
            result[key] = '[REDACTED]';
          } else if (typeof result[key] === 'object' && result[key] !== null) {
            // Recursively check nested objects
            result[key] = redactObject(result[key]);
          }
        }
      }
      
      return result;
    };
    
    return redactObject(info);
  });
  
  // Format to add metadata to all logs
  const addMetadata = format((info) => {
    // Add application metadata
    info.app = 'revolucare';
    info.environment = NODE_ENV;
    info.service = 'api';
    
    // Ensure we always have a correlation ID for request tracing
    if (!info.correlationId) {
      info.correlationId = 'UNKNOWN';
    }
    
    // Add process metadata
    info.pid = process.pid;
    
    // Add host metadata if running in production
    if (NODE_ENV === 'production') {
      try {
        info.hostname = require('os').hostname();
      } catch (error) {
        // Ignore hostname errors
      }
    }
    
    return info;
  });
  
  // Base format configuration
  const baseFormat = format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss.SSS'
    }),
    format.errors({ stack: true }), // Include stack traces for errors
    addMetadata(),
    redactSensitive()
  );
  
  // For production, use JSON format for structured logging
  if (NODE_ENV === 'production') {
    return format.combine(
      baseFormat,
      format.json()
    );
  }
  
  // For development, use a more readable format with colors
  return format.combine(
    baseFormat,
    format.printf((info) => {
      const { timestamp, level, message, correlationId, stack, ...rest } = info;
      
      // Remove some fields from metadata to avoid clutter
      delete rest.environment;
      delete rest.app;
      delete rest.pid;
      delete rest.service;
      
      const meta = Object.keys(rest).length ? `\n${JSON.stringify(rest, null, 2)}` : '';
      const correlationIdStr = correlationId && correlationId !== 'UNKNOWN' ? ` [${correlationId}]` : '';
      const stackStr = stack ? `\n${stack}` : '';
      
      return `${timestamp} ${level}${correlationIdStr}: ${message}${meta}${stackStr}`;
    }),
    format.colorize({ all: true })
  );
};

/**
 * Creates the appropriate transports for the logger based on environment
 * @returns Array of Winston transport configurations
 */
const createLoggerTransports = () => {
  const transportsArray = [];
  
  // Create console transport for all environments
  transportsArray.push(
    new transports.Console({
      level: getLogLevel(),
      handleExceptions: true,
      stderrLevels: ['error']
    })
  );
  
  // In production, add file transports
  if (NODE_ENV === 'production') {
    try {
      // Ensure log directory exists
      const logDir = path.resolve(process.cwd(), LOG_DIR);
      
      // Error logs - separate file for easier tracking of issues
      transportsArray.push(
        new transports.File({
          level: 'error',
          filename: path.join(logDir, 'error.log'),
          maxsize: 5242880, // 5MB
          maxFiles: 10,
          handleExceptions: true,
          tailable: true
        })
      );
      
      // All logs combined
      transportsArray.push(
        new transports.File({
          level: getLogLevel(),
          filename: path.join(logDir, 'combined.log'),
          maxsize: 5242880, // 5MB
          maxFiles: 10,
          tailable: true
        })
      );
      
      // HTTP logs - separate file for API request logging
      transportsArray.push(
        new transports.File({
          level: 'http',
          filename: path.join(logDir, 'http.log'),
          maxsize: 5242880, // 5MB
          maxFiles: 10,
          tailable: true
        })
      );
    } catch (error) {
      // If there's an error setting up file transports, log to console and continue
      console.error('Error setting up log file transports:', error);
      console.error('Continuing with console logging only');
    }
  }
  
  return transportsArray;
};

// Create and configure the logger instance
const logger = winston.createLogger({
  level: getLogLevel(),
  levels: winston.config.npm.levels,
  format: createLoggerFormat(),
  transports: createLoggerTransports(),
  exitOnError: false, // Don't exit on handled exceptions
  silent: NODE_ENV === 'test' && !process.env.LOG_LEVEL // Silent in test unless explicitly configured
});

// Create a stream object for integration with Express middleware like Morgan
const stream = {
  write: (message: string): void => {
    // Route HTTP logs through the logger at http level
    logger.http(message.trim());
  }
};

// Log the logger initialization
if (NODE_ENV !== 'test') {
  logger.info(`Logger initialized with level: ${getLogLevel()}`);
}

export { logger, stream };