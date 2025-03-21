/**
 * Express middleware for implementing rate limiting in the Revolucare platform.
 * This middleware protects API endpoints from abuse by limiting the number of requests
 * a client can make within a specified time window, using the token bucket algorithm
 * with Redis-based storage.
 */

import { Request, Response, NextFunction } from 'express'; // express@4.18.2
import { RateLimiter, createRateLimitError } from '../../utils/rate-limiter';
import { logger } from '../../utils/logger';
import { UserContext } from '../../interfaces/auth.interface';

// Default rate limit options
const DEFAULT_RATE_LIMIT_OPTIONS = {
  limit: 100,        // 100 requests
  windowSeconds: 60, // per minute
  burstLimit: 10     // Additional burst capacity
};

// Endpoint-specific rate limits
const ENDPOINT_SPECIFIC_LIMITS = {
  '/api/auth/login': {
    limit: 20,
    windowSeconds: 60,
    burstLimit: 5
  },
  '/api/auth/register': {
    limit: 10,
    windowSeconds: 60,
    burstLimit: 3
  },
  '/api/documents/analyze': {
    limit: 30,
    windowSeconds: 300, // 5 minutes
    burstLimit: 5
  }
};

/**
 * Configuration options for rate limiting middleware
 */
export interface RateLimitOptions {
  limit?: number;
  windowSeconds?: number;
  burstLimit?: number;
}

/**
 * Factory function that creates rate limiting middleware with configurable options
 * 
 * @param options - Optional configuration options for rate limiting
 * @returns Express middleware function for rate limiting
 */
export function rateLimitMiddleware(options: RateLimitOptions = {}) {
  // Create a new RateLimiter instance with provided options or defaults
  const rateLimiter = new RateLimiter({
    limit: options.limit || DEFAULT_RATE_LIMIT_OPTIONS.limit,
    windowSeconds: options.windowSeconds || DEFAULT_RATE_LIMIT_OPTIONS.windowSeconds,
    burstLimit: options.burstLimit || DEFAULT_RATE_LIMIT_OPTIONS.burstLimit
  });

  // Return the actual middleware function
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get client identifier (user ID or IP address)
      const clientIdentifier = getClientIdentifier(req);
      
      // Get resource identifier (endpoint path)
      const resourceIdentifier = getResourceIdentifier(req);
      
      // Check if endpoint has specific rate limit configuration
      const endpointLimits = getEndpointSpecificLimits(resourceIdentifier);
      
      // If endpoint has specific limits, create a new rate limiter instance for this request
      const limiter = endpointLimits 
        ? new RateLimiter(endpointLimits) 
        : rateLimiter;
      
      // Apply rate limit
      const result = await limiter.limit(clientIdentifier, resourceIdentifier);
      
      // Add rate limiting headers to response
      res.setHeader('X-RateLimit-Limit', result.limit.toString());
      res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
      res.setHeader('X-RateLimit-Reset', result.reset.toString());
      
      // If rate limit is exceeded, return 429 Too Many Requests
      if (result.limited) {
        // Calculate Retry-After in seconds
        const retryAfter = Math.max(1, result.reset - Math.floor(Date.now() / 1000));
        res.setHeader('Retry-After', retryAfter.toString());
        
        // Create standardized rate limit error
        const error = createRateLimitError(result);
        
        // Return 429 Too Many Requests
        return res.status(429).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
            details: {
              limit: result.limit,
              remaining: result.remaining,
              reset: result.reset,
              resource: result.resource
            }
          }
        });
      }
      
      // Rate limit not exceeded, continue to next middleware
      next();
    } catch (error) {
      // Log error and continue to next middleware
      logger.warn('Rate limit middleware error', { 
        error: error instanceof Error ? error.message : String(error),
        path: req.path,
        method: req.method
      });
      
      // Continue to next middleware even if rate limiting fails
      // This prevents rate limiting issues from completely blocking the API
      next();
    }
  };
}

/**
 * Extracts a unique identifier for the client making the request
 * 
 * @param req - Express request object
 * @returns Unique identifier for the client (user ID or IP address)
 */
export function getClientIdentifier(req: Request): string {
  // If authenticated, use user ID
  if (req.user && (req.user as UserContext).userId) {
    return `user:${(req.user as UserContext).userId}`;
  }
  
  // If not authenticated, use IP address
  // Try to get real IP if behind a proxy
  const clientIp = req.headers['x-forwarded-for'] || req.ip || '127.0.0.1';
  
  // Handle potential array of IPs in x-forwarded-for
  const ip = Array.isArray(clientIp) 
    ? clientIp[0] 
    : typeof clientIp === 'string' 
      ? clientIp.split(',')[0].trim() 
      : '127.0.0.1';
  
  return `ip:${ip}`;
}

/**
 * Determines the resource identifier for rate limiting based on the request
 * 
 * @param req - Express request object
 * @returns Resource identifier (typically the endpoint path)
 */
function getResourceIdentifier(req: Request): string {
  // Get base path without query parameters
  const path = req.originalUrl || req.url;
  const basePath = path.split('?')[0];
  
  // Normalize path (remove trailing slash)
  return basePath.endsWith('/') && basePath.length > 1
    ? basePath.slice(0, -1)
    : basePath;
}

/**
 * Retrieves endpoint-specific rate limit configuration if available
 * 
 * @param path - The request path
 * @returns Rate limit options for the endpoint or null if not specified
 */
function getEndpointSpecificLimits(path: string): RateLimitOptions | null {
  // Check if the path matches any keys in ENDPOINT_SPECIFIC_LIMITS
  if (ENDPOINT_SPECIFIC_LIMITS[path]) {
    logger.debug(`Using specific rate limits for endpoint: ${path}`);
    return ENDPOINT_SPECIFIC_LIMITS[path];
  }
  
  // Check for pattern matching using regular expressions
  for (const pattern in ENDPOINT_SPECIFIC_LIMITS) {
    // Simple pattern check - could be extended for more complex pattern matching
    if (pattern.includes('*')) {
      const regexPattern = pattern.replace('*', '.*');
      const regex = new RegExp(`^${regexPattern}$`);
      
      if (regex.test(path)) {
        logger.debug(`Using pattern-matched rate limits for endpoint: ${path} -> ${pattern}`);
        return ENDPOINT_SPECIFIC_LIMITS[pattern];
      }
    }
  }
  
  return null;
}