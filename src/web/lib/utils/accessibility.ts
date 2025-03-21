import React, { useEffect, useRef } from 'react';

/**
 * Traps keyboard focus within a specified element (for modals, dialogs, etc.)
 * @param element - The container element to trap focus within
 * @param event - The keyboard event to handle
 */
export function trapFocus(element: HTMLElement, event: KeyboardEvent): void {
  // Check if the Tab key was pressed
  if (event.key !== 'Tab') return;
  
  // Get all focusable elements within the container
  const focusableElements = getFocusableElements(element);
  
  if (focusableElements.length === 0) return;
  
  // Get the first and last focusable elements
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  // Handle tab navigation
  if (event.shiftKey) {
    // If Shift+Tab is pressed and focus is on the first element, move focus to the last element
    if (document.activeElement === firstElement) {
      lastElement.focus();
      event.preventDefault();
    }
  } else {
    // If Tab is pressed and focus is on the last element, move focus to the first element
    if (document.activeElement === lastElement) {
      firstElement.focus();
      event.preventDefault();
    }
  }
}

/**
 * Gets all focusable elements within a container element
 * @param container - The container element to search within
 * @returns Array of focusable elements
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  // Define selector for all potentially focusable elements
  const selector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    'details',
    'summary',
    'iframe',
    'object',
    'embed',
    'audio[controls]',
    'video[controls]',
    '[contenteditable]:not([contenteditable="false"])',
  ].join(',');
  
  // Query the container for all elements matching the selector
  const elements = Array.from(container.querySelectorAll(selector)) as HTMLElement[];
  
  // Filter out elements that are not visible, disabled, or have tabindex=-1
  return elements.filter(element => {
    const isVisible = element.offsetWidth > 0 && 
                      element.offsetHeight > 0 && 
                      window.getComputedStyle(element).visibility !== 'hidden';
    const isDisabled = element.hasAttribute('disabled');
    const tabIndex = element.getAttribute('tabindex');
    const hasNegativeTabIndex = tabIndex !== null && parseInt(tabIndex, 10) < 0;
    
    return isVisible && !isDisabled && !hasNegativeTabIndex;
  });
}

/**
 * Sets focus to a specified element with proper handling for screen readers
 * @param element - The element to focus
 * @param options - Focus options
 */
export function setFocus(element: HTMLElement | null, options: { preventScroll?: boolean } = {}): void {
  // Check if element exists
  if (!element) return;
  
  // Set focus to the element with provided options
  element.focus(options);
  
  // Ensure the element has a tabindex if it's not naturally focusable
  if (!element.matches('a[href], button, input, select, textarea, [tabindex]')) {
    const currentTabIndex = element.getAttribute('tabindex');
    if (!currentTabIndex || currentTabIndex === '-1') {
      element.setAttribute('tabindex', '0');
    }
  }
}

/**
 * Announces a message to screen readers using ARIA live regions
 * @param message - The message to announce
 * @param priority - The announcement priority (polite or assertive)
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  // Get or create the ARIA live region element
  let announcer = document.getElementById('aria-live-announcer');
  
  if (!announcer) {
    announcer = document.createElement('div');
    announcer.id = 'aria-live-announcer';
    announcer.className = 'sr-only'; // Visually hidden but available to screen readers
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    document.body.appendChild(announcer);
  } else {
    // Update the aria-live attribute based on priority
    announcer.setAttribute('aria-live', priority);
  }
  
  // Update the content of the live region with the message
  announcer.textContent = '';
  
  // Use setTimeout to ensure the DOM update for the empty string is processed
  setTimeout(() => {
    announcer!.textContent = message;
    
    // Clean up the message after it's been announced
    setTimeout(() => {
      announcer!.textContent = '';
    }, 3000);
  }, 100);
}

/**
 * Handles Escape key press for closing modals, dialogs, or menus
 * @param event - The keyboard event
 * @param onEscape - Callback function to execute when Escape is pressed
 */
export function handleEscapeKey(event: KeyboardEvent, onEscape: () => void): void {
  // Check if the Escape key was pressed
  if (event.key === 'Escape' || event.key === 'Esc') {
    // Call the onEscape callback function
    onEscape();
    // Prevent default behavior
    event.preventDefault();
  }
}

/**
 * Detects if the user has enabled reduced motion preferences
 * @returns True if reduced motion is preferred
 */
export function isReducedMotionPreferred(): boolean {
  // Check if window is defined (for SSR compatibility)
  if (typeof window === 'undefined') return false;
  
  // Use matchMedia to check for prefers-reduced-motion media query
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  
  // Return true if reduced motion is preferred
  return mediaQuery.matches;
}

/**
 * Generates appropriate ARIA labels for elements based on content and context
 * @param labelOptions - Options for visible and screen reader labels
 * @returns ARIA label attributes
 */
export function getAriaLabel(labelOptions: { 
  visible?: string; 
  screenReader?: string 
}): { 'aria-label'?: string; 'aria-labelledby'?: string } {
  const { visible, screenReader } = labelOptions;
  
  // If no labels provided, return empty object
  if (!visible && !screenReader) return {};
  
  // If only screen reader label is provided, use aria-label
  if (screenReader && !visible) {
    return { 'aria-label': screenReader };
  }
  
  // If only visible label is provided, we don't need aria-label (it will use the visible text)
  if (visible && !screenReader) {
    return {};
  }
  
  // If both are provided but they're the same, no need for aria-label
  if (visible === screenReader) {
    return {};
  }
  
  // If both are provided and different, use aria-label with the screen reader text
  return { 'aria-label': screenReader };
}

/**
 * Generates appropriate ARIA described-by attributes for additional element descriptions
 * @param id - Primary description element ID
 * @param additionalId - Additional description element ID
 * @returns ARIA describedby attribute
 */
export function getAriaDescribedBy(
  id: string | undefined, 
  additionalId: string | undefined
): { 'aria-describedby'?: string } {
  // If both IDs exist, combine them
  if (id && additionalId) {
    return { 'aria-describedby': `${id} ${additionalId}` };
  }
  
  // If only one ID exists, use it
  if (id) {
    return { 'aria-describedby': id };
  }
  
  if (additionalId) {
    return { 'aria-describedby': additionalId };
  }
  
  // If no IDs are provided, return empty object
  return {};
}

/**
 * React hook for managing screen reader announcements
 * @returns Object containing announce function
 */
export function useAriaAnnouncer(): { 
  announce: (message: string, priority?: 'polite' | 'assertive') => void 
} {
  // Create a function that uses announceToScreenReader
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    announceToScreenReader(message, priority);
  };
  
  // Return the announce function for components to use
  return { announce };
}

/**
 * React hook for trapping focus within a container element
 * @param active - Whether the focus trap is active
 * @returns Ref to attach to the container element
 */
export function useFocusTrap(active: boolean): React.RefObject<HTMLElement> {
  // Create a ref for the container element
  const containerRef = useRef<HTMLElement>(null);
  
  useEffect(() => {
    // If not active or no container, do nothing
    if (!active || !containerRef.current) return;
    
    const container = containerRef.current;
    
    // Store the element that had focus before the trap was activated
    const previousActiveElement = document.activeElement as HTMLElement;
    
    // Set up event listeners for keyboard navigation when active
    const handleKeyDown = (event: KeyboardEvent) => {
      trapFocus(container, event);
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    // Focus the first focusable element in the container
    const focusableElements = getFocusableElements(container);
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    } else {
      // If no focusable elements, make the container focusable and focus it
      container.setAttribute('tabindex', '-1');
      container.focus();
    }
    
    // Clean up event listeners when inactive or on unmount
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      
      // Restore focus to the previously active element when the trap is deactivated
      if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
        previousActiveElement.focus();
      }
    };
  }, [active]);
  
  // Return the ref to be attached to the container
  return containerRef;
}

/**
 * React hook for automatically focusing an element on mount
 * @param shouldFocus - Whether the element should be focused
 * @returns Ref to attach to the element to focus
 */
export function useAutoFocus(shouldFocus: boolean): React.RefObject<HTMLElement> {
  // Create a ref for the element
  const elementRef = useRef<HTMLElement>(null);
  
  useEffect(() => {
    // Use useEffect to focus the element on mount if shouldFocus is true
    if (shouldFocus && elementRef.current) {
      // Small timeout to ensure the element is rendered
      setTimeout(() => {
        setFocus(elementRef.current);
      }, 0);
    }
  }, [shouldFocus]);
  
  // Return the ref to be attached to the element
  return elementRef;
}