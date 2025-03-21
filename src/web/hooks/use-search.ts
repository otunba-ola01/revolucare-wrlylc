import { useState, useCallback, useEffect } from 'react'; // React ^18.2.0
import { useDebounce } from './use-debounce';

/**
 * A hook that manages search term state with debouncing to prevent excessive updates
 * 
 * @param initialSearchTerm Initial search term
 * @param debounceDelay Delay in milliseconds for debouncing
 * @returns An object containing the current search term, debounced search term, and functions to update/reset
 */
export function useSearch(initialSearchTerm = '', debounceDelay = 300) {
  // Initialize search term state with the provided initial search term
  const [searchTerm, setSearchTermState] = useState(initialSearchTerm);
  
  // Create a debounced version of the search term using useDebounce hook
  const debouncedSearchTerm = useDebounce(searchTerm, debounceDelay);
  
  // Define a memoized setSearchTerm function that updates the search term state
  const setSearchTerm = useCallback((term: string) => {
    setSearchTermState(term);
  }, []);
  
  // Define a memoized resetSearchTerm function that resets the search term to initial value
  const resetSearchTerm = useCallback(() => {
    setSearchTermState(initialSearchTerm);
  }, [initialSearchTerm]);
  
  // Return an object with the search state and functions
  return {
    searchTerm,
    debouncedSearchTerm,
    setSearchTerm,
    resetSearchTerm
  };
}

/**
 * A hook that manages search term state and executes a callback when the debounced search term changes
 * 
 * @param onSearch Callback function to execute when debounced search term changes
 * @param initialSearchTerm Initial search term
 * @param debounceDelay Delay in milliseconds for debouncing
 * @returns An object containing the current search term and functions to update/reset
 */
export function useSearchWithCallback(
  onSearch: (searchTerm: string) => void,
  initialSearchTerm = '',
  debounceDelay = 300
) {
  // Initialize search term state with the provided initial search term
  const [searchTerm, setSearchTermState] = useState(initialSearchTerm);
  
  // Create a debounced version of the search term using useDebounce hook
  const debouncedSearchTerm = useDebounce(searchTerm, debounceDelay);
  
  // Define a memoized setSearchTerm function that updates the search term state
  const setSearchTerm = useCallback((term: string) => {
    setSearchTermState(term);
  }, []);
  
  // Define a memoized resetSearchTerm function that resets the search term to initial value
  const resetSearchTerm = useCallback(() => {
    setSearchTermState(initialSearchTerm);
  }, [initialSearchTerm]);
  
  // Use useEffect to call the onSearch callback whenever the debounced search term changes
  useEffect(() => {
    onSearch(debouncedSearchTerm);
  }, [debouncedSearchTerm, onSearch]);
  
  // Return an object with the search state and functions
  return {
    searchTerm,
    setSearchTerm,
    resetSearchTerm
  };
}

/**
 * A hook that manages search term state with loading state for asynchronous search operations
 * 
 * @param initialSearchTerm Initial search term
 * @param debounceDelay Delay in milliseconds for debouncing
 * @returns An object containing the current search term, debounced search term, loading state, and functions to update/reset
 */
export function useSearchWithLoading(initialSearchTerm = '', debounceDelay = 300) {
  // Initialize search term state with the provided initial search term
  const [searchTerm, setSearchTermState] = useState(initialSearchTerm);
  
  // Initialize loading state as false
  const [isLoading, setIsLoading] = useState(false);
  
  // Create a debounced version of the search term using useDebounce hook
  const debouncedSearchTerm = useDebounce(searchTerm, debounceDelay);
  
  // Define a memoized setSearchTerm function that updates the search term state
  const setSearchTerm = useCallback((term: string) => {
    setSearchTermState(term);
  }, []);
  
  // Define a memoized resetSearchTerm function that resets the search term to initial value
  const resetSearchTerm = useCallback(() => {
    setSearchTermState(initialSearchTerm);
  }, [initialSearchTerm]);
  
  // Use useEffect to set loading to true when search term changes and false when debounced term updates
  useEffect(() => {
    // If the search term has changed but the debounced term hasn't caught up yet, set loading to true
    if (searchTerm !== debouncedSearchTerm) {
      setIsLoading(true);
    } else {
      // Once the debounced term catches up, set loading to false
      setIsLoading(false);
    }
  }, [searchTerm, debouncedSearchTerm]);
  
  // Return an object with the search state, loading state, and functions
  return {
    searchTerm,
    debouncedSearchTerm,
    isLoading,
    setSearchTerm,
    resetSearchTerm
  };
}