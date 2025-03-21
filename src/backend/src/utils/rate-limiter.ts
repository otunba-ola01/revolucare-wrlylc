/**
 * Utility module that implements a Redis-based rate limiting solution for the Revolucare platform.
 * Provides configurable rate limiting functionality to protect API endpoints from abuse,
 * ensure fair usage, and maintain system stability under load.
 */

import { redisClient } from '../config/redis';
import { logger } from './logger';
import { errorFactory } from './error-handler';
import { ErrorCodes } from '../constants/error-codes';

// Default rate limiting values
const DEFAULT_LIMIT = 100;
const DEFAULT_WINDOW_SECONDS = 60;
const DEFAULT_BURST_LIMIT = 10;

/**
 * Configuration options for the RateLimiter class
 */
export interface RateLimiterOptions {
  /**
   * Maximum number of requests allowed in the time window
   */
  limit?: number;
  
  /**
   * Time window in seconds for the rate limit
   */
  windowSeconds?: number;
  
  /**
   * Additional burst capacity for handling traffic spikes
   */
  burstLimit?: number;
}

/**
 * Result of a rate limit check operation
 */
export interface RateLimitResult {
  /**
   * Whether the request is limited (true) or allowed (false)
   */
  limited: boolean;
  
  /**
   * The maximum number of requests allowed in the time window
   */
  limit: number;
  
  /**
   * The number of requests remaining in the current window
   */
  remaining: number;
  
  /**
   * Timestamp (in seconds) when the rate limit will reset
   */
  reset: number;
  
  /**
   * The resource being rate limited
   */
  resource: string;
  
  /**
   * The identifier being rate limited (e.g., user ID, IP address)
   */
  identifier: string;
}

/**
 * Creates a unique Redis key for rate limiting based on identifier and resource
 * 
 * @param identifier - Unique identifier for the requester (e.g. IP address, user ID)
 * @param resource - The resource being requested (e.g. endpoint path)
 * @returns Formatted Redis key for rate limiting
 */
export function createRateLimitKey(identifier: string, resource: string): string {
  if (!identifier || !resource) {
    throw new Error('Both identifier and resource are required for rate limiting');
  }
  
  return `ratelimit:${resource}:${identifier}`;
}

/**
 * Creates a standardized error for rate limit exceeded responses
 * 
 * @param rateLimitResult - The rate limit result details
 * @returns Standardized rate limit error with reset information
 */
export function createRateLimitError(rateLimitResult: RateLimitResult): Error {
  const message = `Rate limit exceeded. Try again after ${new Date(rateLimitResult.reset * 1000).toISOString()}`;
  
  const error = errorFactory.createError(
    message,
    ErrorCodes.RATE_LIMIT_EXCEEDED,
    {
      limit: rateLimitResult.limit,
      remaining: rateLimitResult.remaining,
      reset: rateLimitResult.reset,
      resource: rateLimitResult.resource
    }
  );
  
  // Add standard rate limit headers as properties on the error object
  // These can be used by middleware to set appropriate response headers
  (error as any).limit = rateLimitResult.limit;
  (error as any).remaining = rateLimitResult.remaining;
  (error as any).reset = rateLimitResult.reset;
  
  return error;
}

/**
 * Class that implements the token bucket algorithm for rate limiting
 */
export class RateLimiter {
  private limit: number;
  private windowSeconds: number;
  private burstLimit: number;
  
  /**
   * Initializes a new RateLimiter with the specified options
   * 
   * @param options - Configuration options for the rate limiter
   */
  constructor(options: RateLimiterOptions = {}) {
    this.limit = options.limit || DEFAULT_LIMIT;
    this.windowSeconds = options.windowSeconds || DEFAULT_WINDOW_SECONDS;
    this.burstLimit = options.burstLimit || DEFAULT_BURST_LIMIT;
    
    if (this.limit <= 0 || this.windowSeconds <= 0) {
      throw new Error('Rate limit and window must be positive numbers');
    }
  }
  
  /**
   * Checks if the request should be rate limited based on the identifier and resource
   * 
   * @param identifier - Unique identifier for the requester (e.g. IP address, user ID)
   * @param resource - The resource being requested (e.g. endpoint path)
   * @returns Result object with limit status and remaining requests
   */
  async limit(identifier: string, resource: string): Promise<RateLimitResult> {
    const key = createRateLimitKey(identifier, resource);
    
    // Increment the counter
    const count = await redisClient.incr(key);
    
    // Set expiration on new keys
    if (count === 1) {
      await redisClient.expire(key, this.windowSeconds);
    }
    
    // Get the TTL (time to live) to calculate the reset time
    const ttl = await redisClient.ttl(key);
    
    // Calculate the effective limit (base limit + burst allowance)
    const effectiveLimit = this.limit + this.burstLimit;
    
    // Calculate remaining requests (never negative)
    const remaining = Math.max(0, effectiveLimit - count);
    
    // Determine if the request should be limited
    const limited = count > effectiveLimit;
    
    // Calculate reset timestamp
    const now = Math.floor(Date.now() / 1000);
    const reset = ttl > 0 ? now + ttl : now + this.windowSeconds;
    
    // Prepare the result
    const result: RateLimitResult = {
      limited,
      limit: effectiveLimit,
      remaining,
      reset,
      resource,
      identifier
    };
    
    // Log rate limit events
    if (limited) {
      logger.warn(`Rate limit exceeded for ${identifier} on ${resource}`, {
        identifier,
        resource,
        count,
        limit: effectiveLimit
      });
    } else if (remaining < this.burstLimit) {
      // Log when approaching the limit (entering burst mode)
      logger.debug(`Approaching rate limit for ${identifier} on ${resource}`, {
        identifier,
        resource,
        count,
        limit: effectiveLimit,
        remaining
      });
    }
    
    return result;
  }
  
  /**
   * Resets the rate limit counter for a specific identifier and resource
   * 
   * @param identifier - Unique identifier for the requester
   * @param resource - The resource being requested
   * @returns True if counter was reset, false otherwise
   */
  async reset(identifier: string, resource: string): Promise<boolean> {
    const key = createRateLimitKey(identifier, resource);
    
    // Delete the key from Redis
    const result = await redisClient.del(key);
    
    if (result === 1) {
      logger.debug(`Rate limit reset for ${identifier} on ${resource}`, {
        identifier,
        resource
      });
      return true;
    }
    
    return false;
  }
}