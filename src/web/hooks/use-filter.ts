import { useState, useCallback, useEffect } from 'react'; // React ^18.2.0
import { useDebounce } from './use-debounce';

/**
 * Interface for useFilter hook return type
 */
interface UseFilterReturn<T> {
  filters: T;
  debouncedFilters: T;
  updateFilters: (newFilters: Partial<T>) => void;
  resetFilters: () => void;
}

/**
 * Interface for useFilterWithCallback hook return type
 */
interface UseFilterWithCallbackReturn<T> {
  filters: T;
  updateFilters: (newFilters: Partial<T>) => void;
  resetFilters: () => void;
}

/**
 * Interface for useFilterWithSearch hook return type
 */
interface UseFilterWithSearchReturn<T> {
  filters: T;
  debouncedFilters: T;
  searchTerm: string;
  debouncedSearchTerm: string;
  updateFilters: (newFilters: Partial<T>) => void;
  setSearchTerm: (term: string) => void;
  resetAll: () => void;
}

/**
 * A hook that manages filter state with debouncing to prevent excessive updates
 * 
 * @param initialFilters The initial filter values
 * @param debounceDelay The delay in milliseconds for debouncing (default: 300ms)
 * @returns An object containing the current filters, debounced filters, and functions to update and reset filters
 */
export function useFilter<T>(initialFilters: T, debounceDelay = 300): UseFilterReturn<T> {
  // Initialize filter state with the provided initial filters
  const [filters, setFilters] = useState<T>(initialFilters);
  
  // Create a debounced version of the filters using useDebounce hook
  const debouncedFilters = useDebounce<T>(filters, debounceDelay);
  
  // Define a memoized updateFilters function that merges new filters with existing ones
  const updateFilters = useCallback((newFilters: Partial<T>) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      ...newFilters
    }));
  }, []);
  
  // Define a memoized resetFilters function that resets the filters to initial value
  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
  }, [initialFilters]);
  
  // Return an object containing the filters, debounced filters, updateFilters function, and resetFilters function
  return {
    filters,
    debouncedFilters,
    updateFilters,
    resetFilters
  };
}

/**
 * A hook that manages filter state and executes a callback when the debounced filters change
 * 
 * @param onFilter Callback function that gets called when the debounced filters change
 * @param initialFilters The initial filter values
 * @param debounceDelay The delay in milliseconds for debouncing (default: 300ms)
 * @returns An object containing the current filters and functions to update and reset filters
 */
export function useFilterWithCallback<T>(
  onFilter: (filters: T) => void,
  initialFilters: T,
  debounceDelay = 300
): UseFilterWithCallbackReturn<T> {
  // Initialize filter state with the provided initial filters
  const [filters, setFilters] = useState<T>(initialFilters);
  
  // Create a debounced version of the filters using useDebounce hook
  const debouncedFilters = useDebounce<T>(filters, debounceDelay);
  
  // Define a memoized updateFilters function that merges new filters with existing ones
  const updateFilters = useCallback((newFilters: Partial<T>) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      ...newFilters
    }));
  }, []);
  
  // Define a memoized resetFilters function that resets the filters to initial value
  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
  }, [initialFilters]);
  
  // Use useEffect to call the onFilter callback whenever the debounced filters change
  useEffect(() => {
    onFilter(debouncedFilters);
  }, [debouncedFilters, onFilter]);
  
  // Return an object containing the filters, updateFilters function, and resetFilters function
  return {
    filters,
    updateFilters,
    resetFilters
  };
}

/**
 * A hook that combines filter and search functionality for advanced data querying
 * 
 * @param initialFilters The initial filter values
 * @param initialSearchTerm The initial search term (default: empty string)
 * @param debounceDelay The delay in milliseconds for debouncing (default: 300ms)
 * @returns An object containing filters, search term, their debounced versions, and functions to update and reset them
 */
export function useFilterWithSearch<T>(
  initialFilters: T,
  initialSearchTerm = '',
  debounceDelay = 300
): UseFilterWithSearchReturn<T> {
  // Initialize filter state with the provided initial filters
  const [filters, setFilters] = useState<T>(initialFilters);
  
  // Initialize search term state with the provided initial search term
  const [searchTerm, setSearchTermState] = useState<string>(initialSearchTerm);
  
  // Create debounced versions of both filters and search term
  const debouncedFilters = useDebounce<T>(filters, debounceDelay);
  const debouncedSearchTerm = useDebounce<string>(searchTerm, debounceDelay);
  
  // Define a memoized updateFilters function that merges new filters with existing ones
  const updateFilters = useCallback((newFilters: Partial<T>) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      ...newFilters
    }));
  }, []);
  
  // Define a memoized setSearchTerm function that updates the search term state
  const setSearchTerm = useCallback((term: string) => {
    setSearchTermState(term);
  }, []);
  
  // Define a memoized resetAll function that resets both filters and search term to initial values
  const resetAll = useCallback(() => {
    setFilters(initialFilters);
    setSearchTermState(initialSearchTerm);
  }, [initialFilters, initialSearchTerm]);
  
  // Return an object containing the filters, debounced filters, search term, debounced search term,
  // and functions to update and reset them
  return {
    filters,
    debouncedFilters,
    searchTerm,
    debouncedSearchTerm,
    updateFilters,
    setSearchTerm,
    resetAll
  };
}