import { useState, useEffect, useCallback } from 'react';
import { isBrowser, supportsFeature } from '../lib/utils/browser';
import { StorageType, getStorageItem, setStorageItem, removeStorageItem } from '../lib/utils/storage';

/**
 * Options for the useLocalStorage and useSessionStorage hooks
 */
interface StorageOptions {
  /**
   * Whether to sync state across browser tabs/windows
   * Only applicable for localStorage
   * @default true
   */
  syncAcrossTabs?: boolean;
}

/**
 * A custom React hook that provides a type-safe interface for storing and retrieving
 * data from localStorage with automatic serialization/deserialization.
 * This hook synchronizes state between React components and browser storage,
 * allowing for persistent state across page refreshes and browser sessions.
 * 
 * @template T Type of the stored value
 * @param {string} key The key to store the value under in localStorage
 * @param {T} initialValue The initial value if no value is stored
 * @param {StorageOptions} options Additional configuration options
 * @returns {[T, (value: T | ((val: T) => T)) => void, () => void]} 
 * A tuple containing the value, a setter function, and a remove function
 * 
 * @example
 * // Store user preferences
 * const [theme, setTheme, resetTheme] = useLocalStorage<'light' | 'dark'>('theme', 'light');
 * 
 * // Update the theme
 * setTheme('dark');
 * 
 * // Reset to initial value
 * resetTheme();
 */
export function useLocalStorage<T>(
  key: string, 
  initialValue: T, 
  options: StorageOptions = {}
): [T, (value: T | ((val: T) => T)) => void, () => void] {
  // Check if localStorage is supported
  const isSupported = isBrowser() && supportsFeature('localStorage');
  
  // Get initial value from localStorage or use initialValue
  const getInitialState = useCallback((): T => {
    if (!isSupported) {
      return initialValue;
    }
    
    const storedValue = getStorageItem<T>(key, StorageType.LOCAL);
    return storedValue !== null ? storedValue : initialValue;
  }, [initialValue, isSupported, key]);
  
  // Initialize state
  const [state, setState] = useState<T>(getInitialState);
  
  // Set value to localStorage and update state
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    setState(prevState => {
      const newValue = value instanceof Function ? value(prevState) : value;
      
      if (isSupported) {
        setStorageItem(key, newValue, StorageType.LOCAL);
      }
      
      return newValue;
    });
  }, [isSupported, key]);
  
  // Remove value from localStorage and reset state
  const removeValue = useCallback(() => {
    if (isSupported) {
      removeStorageItem(key, StorageType.LOCAL);
    }
    setState(initialValue);
  }, [initialValue, isSupported, key]);
  
  // Sync state with localStorage changes in other tabs/windows
  useEffect(() => {
    if (!isSupported || options.syncAcrossTabs === false) {
      return;
    }
    
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.storageArea === localStorage) {
        try {
          if (event.newValue === null) {
            // Key was removed
            setState(initialValue);
          } else {
            // Key was updated
            const newValue = JSON.parse(event.newValue) as T;
            setState(newValue);
          }
        } catch (error) {
          console.error(`Error parsing localStorage event for key "${key}":`, error);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [initialValue, isSupported, key, options.syncAcrossTabs]);
  
  return [state, setValue, removeValue];
}

/**
 * A custom React hook that provides a type-safe interface for storing and retrieving
 * data from sessionStorage with automatic serialization/deserialization.
 * This hook synchronizes state between React components and browser storage,
 * allowing for persistent state during the current browser session.
 * 
 * @template T Type of the stored value
 * @param {string} key The key to store the value under in sessionStorage
 * @param {T} initialValue The initial value if no value is stored
 * @param {StorageOptions} options Additional configuration options
 * @returns {[T, (value: T | ((val: T) => T)) => void, () => void]} 
 * A tuple containing the value, a setter function, and a remove function
 * 
 * @example
 * // Store form state
 * const [formData, setFormData, resetForm] = useSessionStorage<FormValues>('checkout-form', defaultValues);
 * 
 * // Update form data
 * setFormData(values => ({ ...values, name: 'John' }));
 * 
 * // Reset form
 * resetForm();
 */
export function useSessionStorage<T>(
  key: string, 
  initialValue: T, 
  options: StorageOptions = {}
): [T, (value: T | ((val: T) => T)) => void, () => void] {
  // Check if sessionStorage is supported
  const isSupported = isBrowser() && supportsFeature('sessionStorage');
  
  // Get initial value from sessionStorage or use initialValue
  const getInitialState = useCallback((): T => {
    if (!isSupported) {
      return initialValue;
    }
    
    const storedValue = getStorageItem<T>(key, StorageType.SESSION);
    return storedValue !== null ? storedValue : initialValue;
  }, [initialValue, isSupported, key]);
  
  // Initialize state
  const [state, setState] = useState<T>(getInitialState);
  
  // Set value to sessionStorage and update state
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    setState(prevState => {
      const newValue = value instanceof Function ? value(prevState) : value;
      
      if (isSupported) {
        setStorageItem(key, newValue, StorageType.SESSION);
      }
      
      return newValue;
    });
  }, [isSupported, key]);
  
  // Remove value from sessionStorage and reset state
  const removeValue = useCallback(() => {
    if (isSupported) {
      removeStorageItem(key, StorageType.SESSION);
    }
    setState(initialValue);
  }, [initialValue, isSupported, key]);
  
  // SessionStorage is not shared between tabs, so no need for storage event listener
  
  return [state, setValue, removeValue];
}