import { useState, useEffect, useRef } from 'react'; // React ^18.2.0

/**
 * A hook that returns a debounced version of a value that only updates 
 * after a specified delay has passed without the value changing.
 * 
 * @param value The value to debounce
 * @param delay The delay in milliseconds
 * @returns The debounced value that updates only after the specified delay
 */
export function useDebounce<T>(value: T, delay: number): T {
  // Initialize state with the provided initial value
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  // Create a timeout reference using useRef
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any existing timeout to prevent multiple timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set a new timeout that will update the debounced value after the delay
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timeout when the component unmounts or when the value/delay changes
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  // Return the debounced value
  return debouncedValue;
}

/**
 * A hook that returns a debounced version of a callback function that only
 * executes after a specified delay has passed without being called again.
 * 
 * @param callback The function to debounce
 * @param delay The delay in milliseconds
 * @param dependencies Optional array of dependencies to re-create the debounced function
 * @returns A debounced version of the callback function
 */
export function useDebouncedCallback<T extends (...args: any[]) => void>(
  callback: T,
  delay: number,
  dependencies: any[] = []
): (...args: Parameters<T>) => void {
  // Create a timeout reference using useRef
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Create a callback reference to store the latest callback function
  const callbackRef = useRef<T>(callback);
  
  // Store the arguments to be used when the callback is eventually called
  const argsRef = useRef<Parameters<T>>();
  
  // Update the callback reference when the callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  
  // Clean up the timeout when the component unmounts or when dependencies change
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, dependencies);
  
  // Return a memoized function that debounces the callback execution
  return (...args: Parameters<T>) => {
    // Store the arguments for later use
    argsRef.current = args;
    
    // When the returned function is called, clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set a new timeout that will execute the callback after the delay
    timeoutRef.current = setTimeout(() => {
      if (argsRef.current) {
        callbackRef.current(...argsRef.current);
      }
    }, delay);
  };
}