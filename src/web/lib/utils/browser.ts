/**
 * Utility functions for browser detection, feature detection, and browser-specific operations
 * in the Revolucare web application. These functions help ensure safe cross-browser compatibility
 * and provide appropriate fallbacks when needed.
 */

/**
 * Breakpoint definitions based on the responsive design requirements
 */
const BREAKPOINTS = {
  MOBILE_SMALL: 375,
  MOBILE: 639,
  TABLET: 1023,
  DESKTOP: 1279,
  LARGE_DESKTOP: 1535
};

/**
 * Checks if the code is running in a browser environment
 * @returns True if running in a browser, false if running on the server
 */
export const isBrowser = (): boolean => {
  return typeof window !== 'undefined';
};

/**
 * Checks if the browser supports a specific feature
 * @param feature The feature to check for support
 * @returns True if the feature is supported, false otherwise
 */
export const supportsFeature = (feature: string): boolean => {
  if (!isBrowser()) {
    return false;
  }

  switch (feature) {
    case 'localStorage':
      try {
        const testKey = '__test__';
        localStorage.setItem(testKey, testKey);
        localStorage.removeItem(testKey);
        return true;
      } catch (e) {
        return false;
      }
    case 'sessionStorage':
      try {
        const testKey = '__test__';
        sessionStorage.setItem(testKey, testKey);
        sessionStorage.removeItem(testKey);
        return true;
      } catch (e) {
        return false;
      }
    case 'webp':
      const canvas = document.createElement('canvas');
      if (canvas.getContext && canvas.getContext('2d')) {
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
      }
      return false;
    case 'serviceWorker':
      return 'serviceWorker' in navigator;
    case 'webSocket':
      return 'WebSocket' in window;
    case 'geolocation':
      return 'geolocation' in navigator;
    case 'indexedDB':
      return 'indexedDB' in window;
    case 'webRTC':
      return navigator.mediaDevices && 'getUserMedia' in navigator.mediaDevices;
    case 'notification':
      return 'Notification' in window;
    default:
      return false;
  }
};

/**
 * Gets information about the current browser
 * @returns Browser information object
 */
export const getBrowserInfo = (): { name: string; version: string; os: string; mobile: boolean } => {
  if (!isBrowser()) {
    return {
      name: 'unknown',
      version: 'unknown',
      os: 'unknown',
      mobile: false
    };
  }

  const ua = navigator.userAgent;
  let browserName = 'unknown';
  let browserVersion = 'unknown';
  let os = 'unknown';
  let mobile = false;

  // Detect browser
  if (ua.indexOf('Firefox') > -1) {
    browserName = 'Firefox';
    const match = ua.match(/Firefox\/([0-9.]+)/);
    if (match) browserVersion = match[1];
  } else if (ua.indexOf('Edge') > -1 || ua.indexOf('Edg') > -1) {
    browserName = 'Edge';
    const match = ua.match(/Edge\/([0-9.]+)/) || ua.match(/Edg\/([0-9.]+)/);
    if (match) browserVersion = match[1];
  } else if (ua.indexOf('Chrome') > -1) {
    browserName = 'Chrome';
    const match = ua.match(/Chrome\/([0-9.]+)/);
    if (match) browserVersion = match[1];
  } else if (ua.indexOf('Safari') > -1) {
    browserName = 'Safari';
    const match = ua.match(/Version\/([0-9.]+)/);
    if (match) browserVersion = match[1];
  } else if (ua.indexOf('MSIE') > -1 || ua.indexOf('Trident/') > -1) {
    browserName = 'Internet Explorer';
    const match = ua.match(/MSIE ([0-9.]+)/) || ua.match(/rv:([0-9.]+)/);
    if (match) browserVersion = match[1];
  } else if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) {
    browserName = 'Opera';
    const match = ua.match(/Opera\/([0-9.]+)/) || ua.match(/OPR\/([0-9.]+)/);
    if (match) browserVersion = match[1];
  }

  // Detect OS
  if (ua.indexOf('Windows') > -1) {
    os = 'Windows';
    if (ua.indexOf('Windows NT 10.0') > -1) os += ' 10';
    else if (ua.indexOf('Windows NT 6.3') > -1) os += ' 8.1';
    else if (ua.indexOf('Windows NT 6.2') > -1) os += ' 8';
    else if (ua.indexOf('Windows NT 6.1') > -1) os += ' 7';
  } else if (ua.indexOf('Mac') > -1) {
    os = 'macOS';
    const match = ua.match(/Mac OS X ([0-9_]+)/);
    if (match) {
      const version = match[1].replace(/_/g, '.');
      os += ' ' + version;
    }
  } else if (ua.indexOf('Android') > -1) {
    os = 'Android';
    const match = ua.match(/Android ([0-9.]+)/);
    if (match) os += ' ' + match[1];
    mobile = true;
  } else if (ua.indexOf('iOS') > -1 || ua.indexOf('iPhone') > -1 || ua.indexOf('iPad') > -1) {
    os = 'iOS';
    const match = ua.match(/OS ([0-9_]+)/);
    if (match) {
      const version = match[1].replace(/_/g, '.');
      os += ' ' + version;
    }
    mobile = true;
  } else if (ua.indexOf('Linux') > -1) {
    os = 'Linux';
  }

  // Check if mobile
  if (
    ua.indexOf('Mobile') > -1 ||
    ua.indexOf('Android') > -1 ||
    ua.indexOf('iPhone') > -1 ||
    ua.indexOf('iPad') > -1 ||
    ua.indexOf('iPod') > -1
  ) {
    mobile = true;
  }

  return {
    name: browserName,
    version: browserVersion,
    os,
    mobile
  };
};

/**
 * Checks if the current device is running iOS
 * @returns True if the device is running iOS, false otherwise
 */
export const isIOS = (): boolean => {
  if (!isBrowser()) {
    return false;
  }

  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

/**
 * Checks if the current device is running Android
 * @returns True if the device is running Android, false otherwise
 */
export const isAndroid = (): boolean => {
  if (!isBrowser()) {
    return false;
  }

  return /Android/.test(navigator.userAgent);
};

/**
 * Checks if the current device is a mobile device
 * @returns True if the device is mobile, false otherwise
 */
export const isMobile = (): boolean => {
  if (!isBrowser()) {
    return false;
  }

  // Check if iOS or Android
  if (isIOS() || isAndroid()) {
    return true;
  }

  // Check user agent for mobile indicators
  const ua = navigator.userAgent;
  if (
    /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)
  ) {
    return true;
  }

  // Check screen size as a fallback
  return window.innerWidth <= BREAKPOINTS.MOBILE;
};

/**
 * Checks if the current device is a tablet
 * @returns True if the device is a tablet, false otherwise
 */
export const isTablet = (): boolean => {
  if (!isBrowser()) {
    return false;
  }

  // First check user agent for tablet indicators
  const ua = navigator.userAgent;
  if (/iPad|Android(?!.*Mobile)/.test(ua)) {
    return true;
  }

  // Check iPad on iPadOS 13+ which reports as desktop Safari
  if (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) {
    return true;
  }

  // Check screen size as a fallback
  const width = window.innerWidth;
  const height = window.innerHeight;
  return (
    (width > BREAKPOINTS.MOBILE && width <= BREAKPOINTS.TABLET) ||
    (height > BREAKPOINTS.MOBILE && height <= BREAKPOINTS.TABLET)
  );
};

/**
 * Gets the current screen size
 * @returns Screen dimensions in pixels
 */
export const getScreenSize = (): { width: number; height: number } => {
  if (!isBrowser()) {
    return { width: 0, height: 0 };
  }

  return {
    width: window.screen.width,
    height: window.screen.height
  };
};

/**
 * Gets the current viewport size
 * @returns Viewport dimensions in pixels
 */
export const getViewportSize = (): { width: number; height: number } => {
  if (!isBrowser()) {
    return { width: 0, height: 0 };
  }

  return {
    width: document.documentElement.clientWidth || window.innerWidth,
    height: document.documentElement.clientHeight || window.innerHeight
  };
};

/**
 * Gets the current breakpoint based on viewport width
 * @returns Current breakpoint name (mobile-small, mobile, tablet, desktop, large-desktop, xl)
 */
export const getBreakpoint = (): string => {
  if (!isBrowser()) {
    return 'unknown';
  }

  const width = getViewportSize().width;

  if (width < BREAKPOINTS.MOBILE_SMALL) {
    return 'mobile-small';
  } else if (width <= BREAKPOINTS.MOBILE) {
    return 'mobile';
  } else if (width <= BREAKPOINTS.TABLET) {
    return 'tablet';
  } else if (width <= BREAKPOINTS.DESKTOP) {
    return 'desktop';
  } else if (width <= BREAKPOINTS.LARGE_DESKTOP) {
    return 'large-desktop';
  } else {
    return 'xl';
  }
};

/**
 * Scrolls the page to a specific element
 * @param element Element or element ID to scroll to
 * @param options Scroll behavior options
 * @returns True if scroll was successful, false otherwise
 */
export const scrollToElement = (
  element: string | HTMLElement,
  options: { behavior?: 'auto' | 'smooth'; block?: 'start' | 'center' | 'end' | 'nearest' } = {}
): boolean => {
  if (!isBrowser()) {
    return false;
  }

  let targetElement: HTMLElement | null;

  if (typeof element === 'string') {
    targetElement = document.getElementById(element);
  } else {
    targetElement = element;
  }

  if (!targetElement) {
    return false;
  }

  try {
    targetElement.scrollIntoView({
      behavior: options.behavior || 'smooth',
      block: options.block || 'start'
    });
    return true;
  } catch (error) {
    console.error('Error scrolling to element:', error);
    return false;
  }
};

/**
 * Copies text to the clipboard
 * @param text Text to copy
 * @returns Promise resolving to true if copy was successful, false otherwise
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  if (!isBrowser()) {
    return Promise.resolve(false);
  }

  // Try to use the Clipboard API first (more modern and secure)
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error('Clipboard API error:', error);
      // Fall back to the older method
    }
  }

  // Fallback to the older document.execCommand method
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    
    // Make the textarea out of viewport
    textarea.style.position = 'fixed';
    textarea.style.left = '-999999px';
    textarea.style.top = '-999999px';
    
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    
    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);
    
    return successful;
  } catch (error) {
    console.error('Clipboard fallback error:', error);
    return false;
  }
};

/**
 * Detects the user's preferred color scheme
 * @returns User's preferred color scheme ('light', 'dark', or 'no-preference')
 */
export const detectColorScheme = (): 'light' | 'dark' | 'no-preference' => {
  if (!isBrowser() || !window.matchMedia) {
    return 'no-preference';
  }

  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }

  if (window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light';
  }

  return 'no-preference';
};

/**
 * Detects if the user prefers reduced motion
 * @returns True if the user prefers reduced motion, false otherwise
 */
export const detectReducedMotion = (): boolean => {
  if (!isBrowser() || !window.matchMedia) {
    return false;
  }

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Detects if the user prefers high contrast
 * @returns True if the user prefers high contrast, false otherwise
 */
export const detectHighContrast = (): boolean => {
  if (!isBrowser() || !window.matchMedia) {
    return false;
  }

  return (
    window.matchMedia('(prefers-contrast: more)').matches ||
    window.matchMedia('(forced-colors: active)').matches
  );
};

/**
 * Gets parameters from the current URL
 * @returns Object containing URL parameters
 */
export const getURLParameters = (): Record<string, string> => {
  if (!isBrowser()) {
    return {};
  }

  const params: Record<string, string> = {};
  const searchParams = new URLSearchParams(window.location.search);
  
  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  return params;
};

/**
 * Gets a specific parameter from the current URL
 * @param name Parameter name
 * @returns Parameter value or null if not found
 */
export const getURLParameter = (name: string): string | null => {
  if (!isBrowser()) {
    return null;
  }

  const params = getURLParameters();
  return params[name] || null;
};