/**
 * Configuration module for Redis connectivity in the Revolucare platform.
 * Initializes and exports the Redis client with appropriate connection settings,
 * provides utility functions for cache operations, and implements key
 * generation strategies for consistent cache key management.
 */

import Redis from 'ioredis'; // ioredis@5.3.2
import ms from 'ms'; // ms@2.1.3
import { info, error, debug } from '../utils/logger';

// Environment variables with defaults
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
const REDIS_TLS_ENABLED = process.env.REDIS_TLS_ENABLED === 'true';
const REDIS_CLUSTER_ENABLED = process.env.REDIS_CLUSTER_ENABLED === 'true';
export const DEFAULT_CACHE_TTL = 3600; // 1 hour in seconds

/**
 * Retrieves Redis configuration from environment variables with defaults
 * @returns Redis configuration object
 */
function getRedisConfig(): Redis.RedisOptions {
  const redisConfig: Redis.RedisOptions = {
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: !REDIS_CLUSTER_ENABLED, // Cluster mode connects automatically
  };

  // Add password if provided
  if (REDIS_PASSWORD) {
    redisConfig.password = REDIS_PASSWORD;
  }

  // Add TLS options if enabled
  if (REDIS_TLS_ENABLED) {
    redisConfig.tls = {
      rejectUnauthorized: false,
    };
  }

  return redisConfig;
}

/**
 * Creates and configures a Redis client based on environment settings
 * @returns Configured Redis client instance
 */
function createRedisClient(): Redis {
  const config = getRedisConfig();
  let client: Redis;

  if (REDIS_CLUSTER_ENABLED) {
    // Parse cluster URLs
    const clusterUrls = REDIS_URL.split(',');
    const clusterNodes = clusterUrls.map(url => {
      const parsedUrl = new URL(url);
      return {
        host: parsedUrl.hostname,
        port: parseInt(parsedUrl.port || '6379', 10)
      };
    });

    // Create cluster client
    client = new Redis.Cluster(clusterNodes, {
      redisOptions: config,
      scaleReads: 'slave',
    });
  } else {
    // Create standalone client
    client = new Redis(REDIS_URL, config);
  }

  // Set up event handlers
  client.on('connect', () => {
    info('Redis client connected');
  });

  client.on('error', (err) => {
    error('Redis client error', { error: err.message });
  });

  client.on('ready', () => {
    info('Redis client ready');
  });

  client.on('reconnecting', () => {
    debug('Redis client reconnecting');
  });

  return client;
}

// Create Redis client instance
export const redisClient = createRedisClient();

/**
 * Generates a standardized cache key with namespace and identifier
 * 
 * @param namespace - The namespace for the key
 * @param identifier - The unique identifier within the namespace
 * @returns Formatted cache key
 */
export function getCacheKey(namespace: string, identifier: string): string {
  if (!namespace || !identifier) {
    throw new Error('Both namespace and identifier are required for cache key generation');
  }

  return `${namespace}:${identifier}`;
}

/**
 * Establishes the initial Redis connection
 * @returns Promise that resolves when connection is established
 */
export async function connectRedis(): Promise<void> {
  try {
    // For Redis Cluster, the connection happens automatically
    if (!REDIS_CLUSTER_ENABLED && redisClient.status !== 'ready') {
      await redisClient.connect();
      info('Redis connection established');
    } else {
      // For cluster or already connected clients
      await redisClient.ping(); // Test connection with PING
      info('Redis connection verified');
    }
  } catch (error) {
    error('Failed to connect to Redis', { 
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

/**
 * Gracefully disconnects from Redis
 * @returns Promise that resolves when disconnection is complete
 */
export async function disconnectRedis(): Promise<void> {
  try {
    await redisClient.quit();
    info('Redis connection closed');
  } catch (error) {
    error('Error disconnecting from Redis', {
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

/**
 * Gets a value from cache or sets it if not found
 * Implements the cache-aside pattern
 * 
 * @param key - The cache key
 * @param fetchFunction - Function to call if cache miss
 * @param ttl - Time to live in seconds or string format (e.g., '1h', '30m')
 * @returns The cached value or newly fetched value
 */
export async function getOrSetCache<T>(
  key: string,
  fetchFunction: () => Promise<T>,
  ttl: number | string = DEFAULT_CACHE_TTL
): Promise<T> {
  try {
    // Try to get from cache first
    const cachedValue = await redisClient.get(key);
    
    if (cachedValue) {
      debug('Cache hit', { key });
      try {
        return JSON.parse(cachedValue) as T;
      } catch (parseError) {
        error('Failed to parse cached value', {
          key,
          error: parseError instanceof Error ? parseError.message : String(parseError)
        });
        // Handle invalid JSON by treating it as a cache miss
      }
    }
    
    // Cache miss, fetch fresh data
    debug('Cache miss', { key });
    const freshData = await fetchFunction();
    
    // Calculate TTL in seconds
    const ttlSeconds = typeof ttl === 'string' ? Math.floor(ms(ttl) / 1000) : ttl;
    
    // Store in cache
    try {
      // Check if the data is serializable
      const serializedData = JSON.stringify(freshData);
      
      await redisClient.set(
        key,
        serializedData,
        'EX',
        ttlSeconds
      );
    } catch (serializeError) {
      error('Failed to serialize or store value in cache', {
        key,
        error: serializeError instanceof Error ? serializeError.message : String(serializeError),
        dataType: typeof freshData
      });
      // Continue even if caching fails
    }
    
    return freshData;
  } catch (error) {
    error('Cache operation failed', {
      key,
      error: error instanceof Error ? error.message : String(error)
    });
    
    // If cache fails, still try to get fresh data
    return await fetchFunction();
  }
}