import { useState, useEffect, useCallback, useRef } from 'react'; // React ^18.2.0
import { isBrowser } from '../lib/utils/browser';
import { useDebounce } from './use-debounce';

/**
 * Options for the scroll hooks
 */
interface UseScrollOptions {
  /** Debounce time in milliseconds */
  debounce?: number;
  /** Target element to track scroll - defaults to window if not provided */
  target?: React.RefObject<HTMLElement> | undefined;
}

/**
 * A hook that tracks scroll position and direction
 * 
 * @param options - Configuration options for the scroll tracking
 * @returns Object containing scroll position, direction, and status
 */
export function useScroll(options: UseScrollOptions = {}) {
  const { debounce = 0, target = undefined } = options;
  
  // State for scroll position, direction, and status
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [direction, setDirection] = useState<'up' | 'down' | 'none'>('none');
  const [isScrolling, setIsScrolling] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(false);
  
  // Previous scroll position ref
  const prevPosition = useRef(0);
  
  // Scrolling timer ref
  const scrollTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Debounce timer ref
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  
  const handleScroll = useCallback(() => {
    if (!isBrowser()) return;
    
    const targetElement = target?.current || document.documentElement;
    const x = targetElement === document.documentElement ? window.scrollX : targetElement.scrollLeft;
    const y = targetElement === document.documentElement ? window.scrollY : targetElement.scrollTop;
    
    setPosition({ x, y });
    
    // Determine direction
    if (y > prevPosition.current) {
      setDirection('down');
    } else if (y < prevPosition.current) {
      setDirection('up');
    }
    prevPosition.current = y;
    
    // Check top and bottom
    const isTop = y <= 0;
    const isBottom = targetElement.scrollHeight - y - targetElement.clientHeight <= 1;
    setIsAtTop(isTop);
    setIsAtBottom(isBottom);
    
    // Update scrolling state
    setIsScrolling(true);
    
    if (scrollTimer.current) {
      clearTimeout(scrollTimer.current);
    }
    
    scrollTimer.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  }, [target]);
  
  useEffect(() => {
    if (!isBrowser()) return;
    
    const targetElement = target?.current || window;
    
    // Initial position
    handleScroll();
    
    // Create scroll handler with debounce if needed
    const scrollHandler = debounce > 0
      ? () => {
          if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
          }
          debounceTimer.current = setTimeout(handleScroll, debounce);
        }
      : handleScroll;
    
    // Add scroll listener
    targetElement.addEventListener('scroll', scrollHandler, { passive: true });
    
    // Clean up
    return () => {
      targetElement.removeEventListener('scroll', scrollHandler);
      if (scrollTimer.current) {
        clearTimeout(scrollTimer.current);
      }
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [target, handleScroll, debounce]);
  
  return {
    x: position.x,
    y: position.y,
    direction,
    isScrolling,
    isAtTop,
    isAtBottom
  };
}

/**
 * A hook that provides a function to scroll to a specific position or element
 * 
 * @returns Function to scroll to a position or element
 */
export function useScrollTo() {
  const scrollTo = useCallback((
    target: HTMLElement | string | { x?: number; y?: number }, 
    options: { behavior?: 'auto' | 'smooth'; block?: 'start' | 'center' | 'end' | 'nearest' } = {}
  ) => {
    if (!isBrowser()) return;
    
    const { behavior = 'smooth' } = options;
    
    // If target is an element reference
    if (target instanceof HTMLElement) {
      target.scrollIntoView({
        behavior,
        block: options.block || 'start',
      });
      return;
    }
    
    // If target is an element ID
    if (typeof target === 'string') {
      const element = document.getElementById(target);
      if (element) {
        element.scrollIntoView({
          behavior,
          block: options.block || 'start',
        });
      }
      return;
    }
    
    // If target is coordinates
    window.scrollTo({
      top: target.y ?? 0,
      left: target.x ?? 0,
      behavior,
    });
  }, []);
  
  return scrollTo;
}

/**
 * A hook that provides functions to lock and unlock scrolling on the page
 * 
 * @returns Object with lockScroll and unlockScroll functions, and isLocked state
 */
export function useScrollLock() {
  const [isLocked, setIsLocked] = useState(false);
  const originalStyle = useRef('');
  const scrollY = useRef(0);
  
  const lockScroll = useCallback(() => {
    if (!isBrowser() || isLocked) return;
    
    // Store current scroll position
    scrollY.current = window.scrollY;
    
    // Save the original body style
    originalStyle.current = document.body.style.overflow;
    
    // Apply scroll lock styles
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY.current}px`;
    document.body.style.width = '100%';
    
    setIsLocked(true);
  }, [isLocked]);
  
  const unlockScroll = useCallback(() => {
    if (!isBrowser() || !isLocked) return;
    
    // Restore original body style
    document.body.style.overflow = originalStyle.current;
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    
    // Restore scroll position
    window.scrollTo(0, scrollY.current);
    
    setIsLocked(false);
  }, [isLocked]);
  
  // Ensure scroll is unlocked when component unmounts
  useEffect(() => {
    return () => {
      if (isLocked) {
        unlockScroll();
      }
    };
  }, [isLocked, unlockScroll]);
  
  return { lockScroll, unlockScroll, isLocked };
}

/**
 * A hook that detects when scroll position crosses a specified threshold
 * 
 * @param threshold - Scroll position threshold in pixels
 * @param options - Configuration options for the scroll tracking
 * @returns Boolean indicating if scroll position is beyond the threshold
 */
export function useScrollThreshold(threshold: number = 100, options: UseScrollOptions = {}) {
  const { y } = useScroll(options);
  return y >= threshold;
}

/**
 * A hook that calculates the scroll percentage through a page or element
 * 
 * @param options - Configuration options for the scroll tracking
 * @returns Percentage scrolled (0-100)
 */
export function useScrollPercentage(options: UseScrollOptions = {}) {
  const { debounce = 0, target = undefined } = options;
  const [percentage, setPercentage] = useState(0);
  
  const calculatePercentage = useCallback(() => {
    if (!isBrowser()) return;
    
    const targetElement = target?.current || document.documentElement;
    const totalHeight = targetElement.scrollHeight - targetElement.clientHeight;
    
    if (totalHeight <= 0) {
      setPercentage(0);
      return;
    }
    
    const currentScroll = targetElement === document.documentElement 
      ? window.scrollY 
      : targetElement.scrollTop;
    
    const calculatedPercentage = (currentScroll / totalHeight) * 100;
    setPercentage(Math.max(0, Math.min(100, calculatedPercentage)));
  }, [target]);
  
  // Debounce timer ref
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (!isBrowser()) return;
    
    const targetElement = target?.current || window;
    
    // Initial calculation
    calculatePercentage();
    
    // Create scroll handler with debounce if needed
    const scrollHandler = debounce > 0
      ? () => {
          if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
          }
          debounceTimer.current = setTimeout(calculatePercentage, debounce);
        }
      : calculatePercentage;
    
    // Add scroll listener
    targetElement.addEventListener('scroll', scrollHandler, { passive: true });
    
    // Clean up
    return () => {
      targetElement.removeEventListener('scroll', scrollHandler);
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [target, calculatePercentage, debounce]);
  
  return percentage;
}