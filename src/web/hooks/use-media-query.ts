import { useState, useEffect, useCallback } from 'react'; // ^18.2.0
import { isBrowser } from '../lib/utils/browser';
import { useDebounce } from './use-debounce';
import { responsiveBreakpoints } from '../config/theme';

/**
 * A hook that returns whether a media query matches the current viewport
 * @param query The media query to check
 * @param options Options for customizing the behavior
 * @returns True if the media query matches, false otherwise
 */
export function useMediaQuery(query: string, options: { debounce?: number } = { debounce: 0 }): boolean {
  // Check if running in browser environment
  const supportsMatchMedia = isBrowser() && window.matchMedia !== undefined;
  
  // Initialize state with initial match (false if server-side)
  const [match, setMatch] = useState<boolean>(() => {
    if (supportsMatchMedia) {
      return window.matchMedia(query).matches;
    }
    return false;
  });
  
  // Create a function to check if the media query matches
  const checkMatch = useCallback(() => {
    if (supportsMatchMedia) {
      setMatch(window.matchMedia(query).matches);
    }
  }, [supportsMatchMedia, query]);
  
  // Set up a listener for the media query
  useEffect(() => {
    if (!supportsMatchMedia) {
      return undefined;
    }
    
    // Create MediaQueryList object
    const mediaQueryList = window.matchMedia(query);
    
    // Set initial match state
    setMatch(mediaQueryList.matches);
    
    // Define event listener function
    const listener = (event: MediaQueryListEvent) => {
      setMatch(event.matches);
    };
    
    // Add event listener (with compatibility for older browsers)
    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener('change', listener);
    } else {
      // Fallback for older browsers
      mediaQueryList.addListener(listener);
    }
    
    // Clean up the listener when the component unmounts
    return () => {
      if (mediaQueryList.removeEventListener) {
        mediaQueryList.removeEventListener('change', listener);
      } else {
        // Fallback for older browsers
        mediaQueryList.removeListener(listener);
      }
    };
  }, [supportsMatchMedia, query]);
  
  // Apply debouncing if specified
  const debouncedMatch = useDebounce(match, options.debounce || 0);
  
  // Return the current match state (with optional debouncing)
  return options.debounce > 0 ? debouncedMatch : match;
}

/**
 * A hook that returns whether the current viewport is at or above a specific breakpoint
 * @param breakpoint The breakpoint to check against
 * @param options Options for customizing the behavior
 * @returns True if the viewport is at or above the breakpoint, false otherwise
 */
export function useBreakpoint(
  breakpoint: keyof typeof responsiveBreakpoints,
  options: { debounce?: number } = { debounce: 0 }
): boolean {
  // Get the pixel value for the specified breakpoint
  const breakpointValue = responsiveBreakpoints[breakpoint];
  
  // Construct a min-width media query
  const query = `(min-width: ${breakpointValue})`;
  
  // Use the base useMediaQuery hook
  return useMediaQuery(query, options);
}

/**
 * A hook that returns a value based on the current breakpoint
 * @param values An object mapping breakpoints to values
 * @param options Options for customizing the behavior
 * @returns The value for the current breakpoint or fallback value
 */
export function useBreakpointValue<T>(
  values: Record<string, T>,
  options: { fallback?: T, debounce?: number } = { fallback: undefined, debounce: 0 }
): T | undefined {
  // Initialize with the fallback value
  let result: T | undefined = options.fallback;
  
  // Check each breakpoint in descending order (from largest to smallest)
  // This ensures we get the value for the largest matching breakpoint
  if ('2xl' in values && useBreakpoint('2xl', { debounce: options.debounce })) {
    result = values['2xl'];
  }
  
  if ('xl' in values && useBreakpoint('xl', { debounce: options.debounce })) {
    result = values.xl;
  }
  
  if ('lg' in values && useBreakpoint('lg', { debounce: options.debounce })) {
    result = values.lg;
  }
  
  if ('md' in values && useBreakpoint('md', { debounce: options.debounce })) {
    result = values.md;
  }
  
  if ('sm' in values && useBreakpoint('sm', { debounce: options.debounce })) {
    result = values.sm;
  }
  
  if ('xs' in values && useBreakpoint('xs', { debounce: options.debounce })) {
    result = values.xs;
  }
  
  return result;
}

/**
 * A hook that returns whether the user prefers dark mode
 * @param options Options for customizing the behavior
 * @returns True if the user prefers dark mode, false otherwise
 */
export function usePrefersDarkMode(options: { debounce?: number } = { debounce: 0 }): boolean {
  return useMediaQuery('(prefers-color-scheme: dark)', options);
}

/**
 * A hook that returns whether the user prefers reduced motion
 * @param options Options for customizing the behavior
 * @returns True if the user prefers reduced motion, false otherwise
 */
export function usePrefersReducedMotion(options: { debounce?: number } = { debounce: 0 }): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)', options);
}

/**
 * A hook that returns whether the user prefers high contrast
 * @param options Options for customizing the behavior
 * @returns True if the user prefers high contrast, false otherwise
 */
export function usePrefersHighContrast(options: { debounce?: number } = { debounce: 0 }): boolean {
  return useMediaQuery('(prefers-contrast: more)', options);
}