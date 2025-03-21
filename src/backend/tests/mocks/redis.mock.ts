/**
 * Mock Redis client for testing purposes
 * Provides in-memory implementation of Redis functionality 
 * to test components that depend on Redis without requiring an actual Redis instance
 * 
 * @packageDocumentation
 * @module tests/mocks
 */

// Import Redis types for type checking
import type { Redis } from 'ioredis';

// In-memory store for Redis data
const inMemoryStore = new Map<string, { value: string; expiry: number | null }>();

// Pub/Sub channels and their subscribers
const pubSubChannels = new Map<string, Set<(message: string, channel: string) => void>>();

/**
 * Default TTL for cache entries (1 hour in seconds)
 */
export const DEFAULT_CACHE_TTL = 3600;

/**
 * Creates a mock Redis client with in-memory implementations
 * @returns Mock Redis client implementation
 */
const createMockRedisClient = () => {
  return {
    get: jest.fn().mockImplementation((key: string) => {
      const item = inMemoryStore.get(key);
      if (!item) return null;
      
      // Check if the item has expired
      if (item.expiry !== null && item.expiry < Date.now()) {
        inMemoryStore.delete(key);
        return null;
      }
      
      return item.value;
    }),
    
    set: jest.fn().mockImplementation((key: string, value: string, ...args) => {
      let expiry: number | null = null;
      
      // Parse expiry from args (mimics Redis EX and PX arguments)
      for (let i = 0; i < args.length; i++) {
        if ((args[i] === 'EX' || args[i] === 'ex') && i + 1 < args.length) {
          // EX is in seconds
          const seconds = parseInt(args[i + 1] as string, 10);
          if (!isNaN(seconds)) {
            expiry = Date.now() + seconds * 1000;
          }
        } else if ((args[i] === 'PX' || args[i] === 'px') && i + 1 < args.length) {
          // PX is in milliseconds
          const milliseconds = parseInt(args[i + 1] as string, 10);
          if (!isNaN(milliseconds)) {
            expiry = Date.now() + milliseconds;
          }
        }
      }
      
      inMemoryStore.set(key, { value, expiry });
      return 'OK';
    }),
    
    del: jest.fn().mockImplementation((...keys: string[]) => {
      let deleted = 0;
      for (const key of keys) {
        if (inMemoryStore.delete(key)) {
          deleted++;
        }
      }
      return deleted;
    }),
    
    incr: jest.fn().mockImplementation((key: string) => {
      const item = inMemoryStore.get(key);
      let value = 0;
      
      if (item) {
        value = parseInt(item.value, 10) || 0;
      }
      
      value++;
      inMemoryStore.set(key, { value: value.toString(), expiry: item?.expiry || null });
      return value;
    }),
    
    expire: jest.fn().mockImplementation((key: string, seconds: number) => {
      const item = inMemoryStore.get(key);
      if (!item) return 0;
      
      item.expiry = Date.now() + seconds * 1000;
      inMemoryStore.set(key, item);
      return 1;
    }),
    
    publish: jest.fn().mockImplementation((channel: string, message: string) => {
      const subscribers = pubSubChannels.get(channel);
      if (subscribers) {
        subscribers.forEach(callback => callback(message, channel));
      }
      return subscribers ? subscribers.size : 0;
    }),
    
    subscribe: jest.fn().mockImplementation((channel: string, callback: (message: string, channel: string) => void) => {
      if (!pubSubChannels.has(channel)) {
        pubSubChannels.set(channel, new Set());
      }
      pubSubChannels.get(channel)?.add(callback);
      return 'OK';
    }),
    
    unsubscribe: jest.fn().mockImplementation((channel: string, callback?: (message: string, channel: string) => void) => {
      if (!pubSubChannels.has(channel)) return 'OK';
      
      if (callback) {
        pubSubChannels.get(channel)?.delete(callback);
      } else {
        pubSubChannels.delete(channel);
      }
      return 'OK';
    }),
    
    on: jest.fn(),
    quit: jest.fn().mockResolvedValue('OK'),
  };
};

/**
 * Clears the in-memory Redis store for test isolation
 * Should be called in beforeEach/afterEach test hooks
 */
export const clearMockRedisStore = (): void => {
  inMemoryStore.clear();
  pubSubChannels.clear();
};

/**
 * Mock implementation of connecting to Redis
 * @returns Promise that resolves immediately
 */
export const connectRedis = async (): Promise<void> => {
  return Promise.resolve();
};

/**
 * Mock implementation of disconnecting from Redis
 * @returns Promise that resolves immediately
 */
export const disconnectRedis = async (): Promise<void> => {
  return Promise.resolve();
};

/**
 * Mock implementation of generating a cache key
 * @param namespace - The namespace for the cache key
 * @param identifier - The unique identifier within the namespace
 * @returns Formatted cache key
 */
export const getCacheKey = (namespace: string, identifier: string): string => {
  if (!namespace || !identifier) {
    throw new Error('Both namespace and identifier are required for cache key');
  }
  return `${namespace}:${identifier}`;
};

/**
 * Mock implementation of get-or-set cache pattern
 * @param key - The cache key
 * @param fetchFunction - Function to execute if cache miss
 * @param ttl - Time-to-live in seconds
 * @returns Promise resolving to the cached or fetched value
 */
export const getOrSetCache = async <T>(
  key: string,
  fetchFunction: () => Promise<T>,
  ttl = DEFAULT_CACHE_TTL
): Promise<T> => {
  const cachedItem = inMemoryStore.get(key);
  
  if (cachedItem) {
    // Check if item is expired
    if (cachedItem.expiry === null || cachedItem.expiry > Date.now()) {
      try {
        return JSON.parse(cachedItem.value) as T;
      } catch (error) {
        // If parsing fails, fetch and store again
      }
    }
  }
  
  // If no valid cached value, fetch and store
  const result = await fetchFunction();
  inMemoryStore.set(key, {
    value: JSON.stringify(result),
    expiry: ttl > 0 ? Date.now() + ttl * 1000 : null
  });
  
  return result;
};

// Create mock Redis client
export const mockRedisClient = createMockRedisClient();