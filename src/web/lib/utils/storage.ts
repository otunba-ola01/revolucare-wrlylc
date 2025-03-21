/**
 * Utility functions for interacting with browser storage (localStorage and sessionStorage) 
 * in a type-safe and consistent manner.
 */

import { isBrowser, supportsFeature } from './browser';

/**
 * Enum for specifying which storage type to use
 */
export enum StorageType {
  /**
   * Use localStorage for persistent storage across browser sessions
   */
  LOCAL = 'localStorage',
  
  /**
   * Use sessionStorage for storage that clears when the page session ends
   */
  SESSION = 'sessionStorage'
}

/**
 * Retrieves an item from browser storage (localStorage or sessionStorage)
 * 
 * @template T - The type of the stored value
 * @param {string} key - The key to retrieve
 * @param {StorageType} [storageType=StorageType.LOCAL] - The type of storage to use
 * @returns {T | null} The stored value parsed from JSON, or null if not found or on error
 * 
 * @example
 * // Get a stored user object
 * const user = getStorageItem<User>('currentUser');
 * 
 * // Get a value from sessionStorage
 * const token = getStorageItem<string>('authToken', StorageType.SESSION);
 */
export function getStorageItem<T>(key: string, storageType: StorageType = StorageType.LOCAL): T | null {
  // Check if running in browser
  if (!isBrowser()) {
    return null;
  }

  // Check if storage type is supported
  if (!supportsFeature(storageType === StorageType.LOCAL ? 'localStorage' : 'sessionStorage')) {
    return null;
  }

  try {
    // Get the appropriate storage object
    const storage = storageType === StorageType.LOCAL ? localStorage : sessionStorage;
    
    // Get the item from storage
    const item = storage.getItem(key);
    
    // If item doesn't exist, return null
    if (item === null) {
      return null;
    }
    
    // Parse the item and return
    return JSON.parse(item) as T;
  } catch (error) {
    // Handle any errors (e.g., parsing errors)
    if (process.env.NODE_ENV === 'development') {
      console.error(`Error retrieving item from ${storageType}:`, error);
    }
    return null;
  }
}

/**
 * Stores an item in browser storage (localStorage or sessionStorage)
 * 
 * @template T - The type of the value to store
 * @param {string} key - The key to store the value under
 * @param {T} value - The value to store (will be JSON stringified)
 * @param {StorageType} [storageType=StorageType.LOCAL] - The type of storage to use
 * @returns {boolean} True if storage was successful, false otherwise
 * 
 * @example
 * // Store a user object
 * const user = { id: 1, name: 'John Doe' };
 * setStorageItem('currentUser', user);
 * 
 * // Store a token in sessionStorage
 * setStorageItem('authToken', 'abc123', StorageType.SESSION);
 */
export function setStorageItem<T>(key: string, value: T, storageType: StorageType = StorageType.LOCAL): boolean {
  // Check if running in browser
  if (!isBrowser()) {
    return false;
  }

  // Check if storage type is supported
  if (!supportsFeature(storageType === StorageType.LOCAL ? 'localStorage' : 'sessionStorage')) {
    return false;
  }

  try {
    // Get the appropriate storage object
    const storage = storageType === StorageType.LOCAL ? localStorage : sessionStorage;
    
    // Stringify the value and store it
    storage.setItem(key, JSON.stringify(value));
    
    return true;
  } catch (error) {
    // Handle any errors (e.g., quota exceeded)
    if (process.env.NODE_ENV === 'development') {
      console.error(`Error storing item in ${storageType}:`, error);
    }
    return false;
  }
}

/**
 * Removes an item from browser storage (localStorage or sessionStorage)
 * 
 * @param {string} key - The key to remove
 * @param {StorageType} [storageType=StorageType.LOCAL] - The type of storage to use
 * @returns {boolean} True if removal was successful, false otherwise
 * 
 * @example
 * // Remove a user from localStorage
 * removeStorageItem('currentUser');
 * 
 * // Remove a token from sessionStorage
 * removeStorageItem('authToken', StorageType.SESSION);
 */
export function removeStorageItem(key: string, storageType: StorageType = StorageType.LOCAL): boolean {
  // Check if running in browser
  if (!isBrowser()) {
    return false;
  }

  // Check if storage type is supported
  if (!supportsFeature(storageType === StorageType.LOCAL ? 'localStorage' : 'sessionStorage')) {
    return false;
  }

  try {
    // Get the appropriate storage object
    const storage = storageType === StorageType.LOCAL ? localStorage : sessionStorage;
    
    // Remove the item
    storage.removeItem(key);
    
    return true;
  } catch (error) {
    // Handle any errors
    if (process.env.NODE_ENV === 'development') {
      console.error(`Error removing item from ${storageType}:`, error);
    }
    return false;
  }
}

/**
 * Clears all items from browser storage (localStorage or sessionStorage)
 * 
 * @param {StorageType} [storageType=StorageType.LOCAL] - The type of storage to clear
 * @returns {boolean} True if clearing was successful, false otherwise
 * 
 * @example
 * // Clear all items from localStorage
 * clearStorage();
 * 
 * // Clear all items from sessionStorage
 * clearStorage(StorageType.SESSION);
 */
export function clearStorage(storageType: StorageType = StorageType.LOCAL): boolean {
  // Check if running in browser
  if (!isBrowser()) {
    return false;
  }

  // Check if storage type is supported
  if (!supportsFeature(storageType === StorageType.LOCAL ? 'localStorage' : 'sessionStorage')) {
    return false;
  }

  try {
    // Get the appropriate storage object
    const storage = storageType === StorageType.LOCAL ? localStorage : sessionStorage;
    
    // Clear all items
    storage.clear();
    
    return true;
  } catch (error) {
    // Handle any errors
    if (process.env.NODE_ENV === 'development') {
      console.error(`Error clearing ${storageType}:`, error);
    }
    return false;
  }
}

/**
 * Gets all keys from browser storage (localStorage or sessionStorage)
 * 
 * @param {StorageType} [storageType=StorageType.LOCAL] - The type of storage to get keys from
 * @returns {string[]} Array of storage keys
 * 
 * @example
 * // Get all keys from localStorage
 * const localKeys = getStorageKeys();
 * 
 * // Get all keys from sessionStorage
 * const sessionKeys = getStorageKeys(StorageType.SESSION);
 */
export function getStorageKeys(storageType: StorageType = StorageType.LOCAL): string[] {
  // Check if running in browser
  if (!isBrowser()) {
    return [];
  }

  // Check if storage type is supported
  if (!supportsFeature(storageType === StorageType.LOCAL ? 'localStorage' : 'sessionStorage')) {
    return [];
  }

  try {
    // Get the appropriate storage object
    const storage = storageType === StorageType.LOCAL ? localStorage : sessionStorage;
    
    // Get all keys
    return Object.keys(storage);
  } catch (error) {
    // Handle any errors
    if (process.env.NODE_ENV === 'development') {
      console.error(`Error getting keys from ${storageType}:`, error);
    }
    return [];
  }
}

/**
 * Gets the current size of browser storage in bytes
 * 
 * @param {StorageType} [storageType=StorageType.LOCAL] - The type of storage to check
 * @returns {number} Size of storage in bytes
 * 
 * @example
 * // Get size of localStorage in bytes
 * const localSize = getStorageSize();
 * console.log(`localStorage is using ${localSize} bytes`);
 */
export function getStorageSize(storageType: StorageType = StorageType.LOCAL): number {
  // Check if running in browser
  if (!isBrowser()) {
    return 0;
  }

  // Check if storage type is supported
  if (!supportsFeature(storageType === StorageType.LOCAL ? 'localStorage' : 'sessionStorage')) {
    return 0;
  }

  try {
    // Get all keys
    const keys = getStorageKeys(storageType);
    
    // Get the appropriate storage object
    const storage = storageType === StorageType.LOCAL ? localStorage : sessionStorage;
    
    // Calculate total size
    let totalSize = 0;
    
    for (const key of keys) {
      // Add key size
      totalSize += key.length;
      
      // Add value size
      const value = storage.getItem(key);
      if (value) {
        totalSize += value.length;
      }
    }
    
    return totalSize;
  } catch (error) {
    // Handle any errors
    if (process.env.NODE_ENV === 'development') {
      console.error(`Error calculating size of ${storageType}:`, error);
    }
    return 0;
  }
}

/**
 * Checks if browser storage is full or near capacity
 * 
 * @param {StorageType} [storageType=StorageType.LOCAL] - The type of storage to check
 * @returns {boolean} True if storage is full or near capacity, false otherwise
 * 
 * @example
 * // Check if localStorage is full
 * if (isStorageFull()) {
 *   console.warn('localStorage is full, clearing old data');
 *   // Clear some items to make space
 * }
 */
export function isStorageFull(storageType: StorageType = StorageType.LOCAL): boolean {
  // Check if running in browser
  if (!isBrowser()) {
    return false;
  }

  // Check if storage type is supported
  if (!supportsFeature(storageType === StorageType.LOCAL ? 'localStorage' : 'sessionStorage')) {
    return false;
  }

  try {
    // Get the appropriate storage object
    const storage = storageType === StorageType.LOCAL ? localStorage : sessionStorage;
    
    // Try to set a test item that's reasonably large
    const testKey = '__storage_test__';
    const testValue = 'A'.repeat(100000); // 100KB test
    
    try {
      storage.setItem(testKey, testValue);
      storage.removeItem(testKey);
      return false; // If successful, storage is not full
    } catch (e) {
      // If we get an error, storage is full
      return true;
    }
  } catch (error) {
    // Handle any other errors (assume storage is full to be safe)
    if (process.env.NODE_ENV === 'development') {
      console.error(`Error checking if ${storageType} is full:`, error);
    }
    return true;
  }
}