/**
 * Express middleware for HTTP request logging in the Revolucare platform.
 * Provides structured logging, correlation ID tracking, and request/response monitoring.
 */

import morgan from 'morgan'; // morgan@1.10.0
import { Request, Response, NextFunction } from 'express'; // express@4.18.2
import onFinished from 'on-finished'; // on-finished@2.4.1
import { 
  logger, 
  createCorrelationId, 
  setCorrelationId, 
  getCorrelationId, 
  redactSensitiveData 
} from '../../utils/logger';

// Paths that should be excluded from detailed logging (health checks, static assets)
const SKIP_LOGGING_PATHS = ['/health', '/metrics', '/favicon.ico'];

// Environment detection for development-specific logging
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Determines if logging should be skipped for a given request path
 * @param path The request path to check
 * @returns Boolean indicating if logging should be skipped
 */
function shouldSkipLogging(path: string): boolean {
  return SKIP_LOGGING_PATHS.some(skipPath => path.startsWith(skipPath));
}

/**
 * Extracts and formats relevant information from the request object
 * @param req Express request object
 * @returns Formatted request information with sensitive data redacted
 */
function extractRequestInfo(req: Request): Record<string, any> {
  const { method, originalUrl, path, query, headers, body, ip } = req;
  
  // Extract user information if available (depends on auth middleware)
  const user = (req as any).user ? {
    id: (req as any).user.id,
    role: (req as any).user.role
  } : undefined;

  // Construct request info object
  const requestInfo = {
    method,
    url: originalUrl,
    path,
    query: Object.keys(query).length > 0 ? query : undefined,
    headers: { ...headers },
    body: NODE_ENV === 'development' ? body : undefined, // Only include body in development
    ip,
    user
  };

  // Redact sensitive information before logging
  return redactSensitiveData(requestInfo);
}

/**
 * Extracts and formats relevant information from the response object
 * @param res Express response object
 * @param responseTime Response time in milliseconds
 * @returns Formatted response information with sensitive data redacted
 */
function extractResponseInfo(res: Response, responseTime: number): Record<string, any> {
  const { statusCode, statusMessage } = res;
  
  // Get headers safely, accounting for headers possibly already sent
  let headers;
  try {
    headers = res.getHeaders ? { ...res.getHeaders() } : {};
  } catch (error) {
    headers = { error: 'Headers already sent' };
  }

  // Construct response info object
  const responseInfo = {
    statusCode,
    statusMessage,
    headers,
    responseTime: `${responseTime.toFixed(2)}ms`
  };

  // Redact sensitive information before logging
  return redactSensitiveData(responseInfo);
}

/**
 * Express middleware that logs incoming HTTP requests with correlation IDs
 * for request tracing across the system.
 */
export function requestLoggingMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Skip detailed logging for health checks and static assets
  if (shouldSkipLogging(req.path)) {
    return next();
  }

  // Use existing correlation ID from headers or create a new one
  // This allows tracing requests across distributed systems
  const correlationId = 
    req.headers['x-correlation-id'] as string || 
    req.headers['x-request-id'] as string || 
    createCorrelationId();

  // Set correlation ID in the current execution context
  setCorrelationId(correlationId);

  // Add correlation ID to response headers for client-side tracking
  res.setHeader('X-Correlation-ID', correlationId);

  // Log the incoming request
  const requestInfo = extractRequestInfo(req);
  logger.info(`Incoming request: ${req.method} ${req.path}`, {
    ...requestInfo,
    correlationId
  });

  // Log response when finished (including error cases)
  onFinished(res, (err, res) => {
    if (err) {
      logger.error(`Request handling error`, {
        error: err.message,
        stack: err.stack,
        correlationId: getCorrelationId()
      });
    }
  });

  next();
}

/**
 * Express middleware that logs HTTP responses with timing information
 * and response status codes.
 */
export function responseLoggingMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Skip detailed logging for health checks and static assets
  if (shouldSkipLogging(req.path)) {
    return next();
  }

  // Record the start time of the request
  const startTime = process.hrtime();

  // Log response when finished
  onFinished(res, (err, res) => {
    // Calculate response time in milliseconds
    const diff = process.hrtime(startTime);
    const responseTime = diff[0] * 1e3 + diff[1] * 1e-6;

    // Get the correlation ID for this request
    const correlationId = getCorrelationId();

    // Extract response information
    const responseInfo = extractResponseInfo(res, responseTime);

    // Log with appropriate level based on status code
    if (res.statusCode >= 500) {
      logger.error(`Response: ${res.statusCode} ${req.method} ${req.path}`, {
        ...responseInfo,
        correlationId
      });
    } else if (res.statusCode >= 400) {
      logger.warn(`Response: ${res.statusCode} ${req.method} ${req.path}`, {
        ...responseInfo,
        correlationId
      });
    } else {
      logger.info(`Response: ${res.statusCode} ${req.method} ${req.path}`, {
        ...responseInfo,
        correlationId
      });
    }
  });

  next();
}

/**
 * Configures and returns Morgan HTTP request logger middleware
 * with custom formatting and integration with the app logger.
 */
export function morganMiddleware() {
  // Define a custom Morgan format that includes correlation ID
  morgan.token('correlation-id', (req: Request) => {
    return getCorrelationId() || 'unknown';
  });

  // Skip logging for health checks and static paths
  const skipFunction = (req: Request) => {
    return shouldSkipLogging(req.path);
  };

  // Define the format string based on environment
  const formatString = NODE_ENV === 'production'
    ? ':remote-addr - :method :url :status :res[content-length] - :response-time ms [:correlation-id]'
    : ':method :url :status :res[content-length] - :response-time ms [:correlation-id]';

  // Return configured Morgan middleware
  return morgan(formatString, {
    skip: skipFunction,
    stream: {
      // Use the logger's info level for HTTP logs
      write: (message: string) => {
        logger.info(message.trim(), { source: 'http' });
      }
    }
  });
}