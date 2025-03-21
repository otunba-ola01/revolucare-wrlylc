import React, { createContext, useContext, useState, useEffect } from 'react';
import { lightTheme, darkTheme } from '../../config/theme';
import { useLocalStorage } from '../../hooks/use-local-storage';
import { usePrefersDarkMode } from '../../hooks/use-media-query';
import { isBrowser } from '../utils/browser';

/**
 * Valid theme options for the application
 */
type Theme = 'light' | 'dark' | 'system';

/**
 * Props for the ThemeProvider component
 */
interface ThemeProviderProps {
  /**
   * Child components to render
   */
  children: React.ReactNode;
  
  /**
   * Optional default theme to use if none is stored
   * @default 'system'
   */
  defaultTheme?: string;
}

/**
 * Theme context value type
 */
interface ThemeContextType {
  /**
   * Current theme setting ('light', 'dark', or 'system')
   */
  theme: Theme;
  
  /**
   * Function to update the theme
   */
  setTheme: (theme: Theme) => void;
  
  /**
   * The actual theme being applied ('light' or 'dark'),
   * resolves 'system' to either 'light' or 'dark' based on system preference
   */
  resolvedTheme: 'light' | 'dark';
}

// Create theme context with undefined default value
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Provider component that manages theme state and provides it to child components
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'system',
}) => {
  // Validate defaultTheme
  const validDefaultTheme: Theme = (['light', 'dark', 'system'].includes(defaultTheme) 
    ? defaultTheme 
    : 'system') as Theme;

  // Get stored theme preference from localStorage
  const [storedTheme, setStoredTheme] = useLocalStorage<Theme>(
    'revolucare-theme',
    validDefaultTheme
  );

  // Detect system theme preference
  const prefersDarkMode = usePrefersDarkMode();

  // Initialize theme state with stored preference or default
  const [theme, setTheme] = useState<Theme>(storedTheme);

  // Function to set theme and update localStorage
  const updateTheme = (newTheme: Theme) => {
    // Validate the new theme
    if (!['light', 'dark', 'system'].includes(newTheme)) {
      console.error(`Invalid theme: ${newTheme}. Using 'system' instead.`);
      newTheme = 'system' as Theme;
    }
    
    setTheme(newTheme);
    setStoredTheme(newTheme);
  };

  // Function to get current theme value based on theme state and system preference
  const getResolvedTheme = (): 'light' | 'dark' => {
    if (theme === 'system') {
      return prefersDarkMode ? 'dark' : 'light';
    }
    return theme as 'light' | 'dark';
  };

  // Get the resolved theme
  const resolvedTheme = getResolvedTheme();

  // Update document with theme class and CSS variables when theme changes
  useEffect(() => {
    if (!isBrowser()) return;

    try {
      const root = window.document.documentElement;
      
      // Remove old theme classes
      root.classList.remove('light', 'dark');
      
      // Add the resolved theme class
      root.classList.add(resolvedTheme);
      
      // Get the appropriate theme configuration
      const currentTheme = resolvedTheme === 'dark' ? darkTheme : lightTheme;
      
      // Apply theme variables to root element
      Object.entries(currentTheme).forEach(([property, value]) => {
        root.style.setProperty(`--${property}`, value as string);
      });
  
      // Mark initial theme load complete to prevent flash
      if (root.style.getPropertyValue('--initial-theme-load') !== 'true') {
        root.style.setProperty('--initial-theme-load', 'true');
      }
    } catch (error) {
      console.error('Failed to apply theme:', error);
    }
    
  }, [resolvedTheme]);

  // Provide theme context to children
  const contextValue: ThemeContextType = {
    theme,
    setTheme: updateTheme,
    resolvedTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Hook to access the theme context in components
 * @returns The theme context value
 * @throws Error if used outside of ThemeProvider
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
};