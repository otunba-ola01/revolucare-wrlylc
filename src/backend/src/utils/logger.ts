/**
 * Utility module that provides a centralized logging system for the Revolucare platform.
 * Implements structured logging with correlation ID tracking, sensitive data redaction, 
 * and configurable log levels.
 * 
 * @module utils/logger
 */

import { createNamespace, getNamespace } from 'cls-hooked'; // cls-hooked@4.2.2
import { v4 as uuidv4 } from 'uuid'; // uuid@9.0.0
import { logger as baseLogger } from '../config/logger';

// Create a namespace for continuation-local storage to track correlation IDs
const NAMESPACE = createNamespace('revolucare-app');
const CORRELATION_ID_KEY = 'correlationId';

// List of field names that should be redacted from logs to protect sensitive information
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'ssn',
  'creditCard',
  'socialSecurityNumber',
  'medicalRecordNumber'
];

/**
 * Sets the correlation ID in the current execution context
 * @param correlationId - The correlation ID to set
 */
export function setCorrelationId(correlationId: string): void {
  const namespace = getNamespace(NAMESPACE.name);
  if (namespace && namespace.active) {
    namespace.set(CORRELATION_ID_KEY, correlationId);
  } else {
    baseLogger.warn('Attempted to set correlation ID outside of an active namespace');
  }
}

/**
 * Retrieves the correlation ID from the current execution context
 * @returns The current correlation ID or undefined if not set
 */
export function getCorrelationId(): string | undefined {
  const namespace = getNamespace(NAMESPACE.name);
  if (namespace && namespace.active) {
    return namespace.get(CORRELATION_ID_KEY);
  }
  return undefined;
}

/**
 * Creates a new unique correlation ID
 * @returns A new UUID v4 correlation ID
 */
export function createCorrelationId(): string {
  return uuidv4();
}

/**
 * Redacts sensitive information from objects before logging
 * @param data - The data object to redact
 * @returns Copy of the data with sensitive fields redacted
 */
export function redactSensitiveData(data: Record<string, any>): Record<string, any> {
  if (!data || typeof data !== 'object') return data;
  
  try {
    // Create a deep copy to avoid modifying the original object
    const copy = JSON.parse(JSON.stringify(data));
    
    // Function to recursively redact sensitive fields
    function redactObject(obj: Record<string, any>): Record<string, any> {
      if (!obj || typeof obj !== 'object') return obj;
      
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          const lowerKey = key.toLowerCase();
          
          // Check if this is a sensitive field
          if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field.toLowerCase()))) {
            obj[key] = '[REDACTED]';
          } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            // Recursively redact nested objects
            obj[key] = redactObject(obj[key]);
          }
        }
      }
      
      return obj;
    }
    
    return redactObject(copy);
  } catch (error) {
    // In case of circular references or other JSON serialization errors
    baseLogger.warn('Error redacting sensitive data', { error: error instanceof Error ? error.message : String(error) });
    return { error: 'Unable to process data for logging', originalType: typeof data };
  }
}

/**
 * Enhances log messages with contextual information like correlation ID
 * @param context - The context object to enhance
 * @returns Enhanced context with correlation ID and other metadata
 */
function enhanceLoggerWithContext(context: Record<string, any> = {}): Record<string, any> {
  const correlationId = getCorrelationId();
  
  // Create enhanced context with original context
  const enhancedContext = {
    ...context,
    timestamp: new Date().toISOString(),
  };
  
  // Add correlation ID if available
  if (correlationId) {
    enhancedContext.correlationId = correlationId;
  }
  
  // Add additional metadata if needed
  enhancedContext.service = 'revolucare';
  
  // Redact any sensitive information
  return redactSensitiveData(enhancedContext);
}

/**
 * Logs a message with enhanced context information
 * @param level - The log level (error, warn, info, debug)
 * @param message - The message to log
 * @param context - Additional context to include with the log
 */
function logWithContext(level: string, message: string, context: Record<string, any> = {}): void {
  const enhancedContext = enhanceLoggerWithContext(context);
  
  switch (level) {
    case 'error':
      baseLogger.error(message, enhancedContext);
      break;
    case 'warn':
      baseLogger.warn(message, enhancedContext);
      break;
    case 'info':
      baseLogger.info(message, enhancedContext);
      break;
    case 'debug':
      baseLogger.debug(message, enhancedContext);
      break;
    default:
      baseLogger.info(message, enhancedContext);
  }
}

/**
 * Enhanced logger with correlation ID tracking and context enrichment
 */
export const logger = {
  /**
   * Log an error message with enhanced context
   * @param message - The error message
   * @param context - Additional context
   */
  error: (message: string, context?: Record<string, any>): void => {
    logWithContext('error', message, context);
  },
  
  /**
   * Log a warning message with enhanced context
   * @param message - The warning message
   * @param context - Additional context
   */
  warn: (message: string, context?: Record<string, any>): void => {
    logWithContext('warn', message, context);
  },
  
  /**
   * Log an info message with enhanced context
   * @param message - The info message
   * @param context - Additional context
   */
  info: (message: string, context?: Record<string, any>): void => {
    logWithContext('info', message, context);
  },
  
  /**
   * Log a debug message with enhanced context
   * @param message - The debug message
   * @param context - Additional context
   */
  debug: (message: string, context?: Record<string, any>): void => {
    logWithContext('debug', message, context);
  }
};

/**
 * Stream interface for integration with Express middleware like Morgan
 * Enhances logs with correlation ID and context information
 */
export const stream = {
  /**
   * Write function compatible with Morgan and other middleware
   * @param message - The message to write to the log
   */
  write: (message: string): void => {
    // Get the trimmed message from the stream
    const trimmedMessage = message.trim();
    
    // Log using our enhanced logger with HTTP source context
    logger.info(trimmedMessage, { source: 'http' });
  }
};