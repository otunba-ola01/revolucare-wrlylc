import { darken, lighten, generateColorPalette } from '../lib/utils/color';

/**
 * Color palette definitions for the Revolucare application
 * Based on design system requirements and WCAG 2.1 AA compliance guidelines
 */
export const colorPalette = {
  primary: {
    base: '#4F46E5', // indigo-600
    50: '#F0F0FF',
    100: '#E1E0FF',
    200: '#C3C1FF',
    300: '#A5A3FF',
    400: '#8784FF',
    500: '#6965FF',
    600: '#4F46E5',
    700: '#3F38C9',
    800: '#2F2A9D',
    900: '#1F1C71',
  },
  secondary: {
    base: '#EC4899', // pink-500
    50: '#FDF2F8',
    100: '#FCE7F3',
    200: '#FBCFE8',
    300: '#F9A8D4',
    400: '#F472B6',
    500: '#EC4899',
    600: '#DB2777',
    700: '#BE185D',
    800: '#9D174D',
    900: '#831843',
  },
  accent: {
    base: '#8B5CF6', // violet-500
    50: '#F5F3FF',
    100: '#EDE9FE',
    200: '#DDD6FE',
    300: '#C4B5FD',
    400: '#A78BFA',
    500: '#8B5CF6',
    600: '#7C3AED',
    700: '#6D28D9',
    800: '#5B21B6',
    900: '#4C1D95',
  },
  neutral: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  success: {
    base: '#10B981', // green-500
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
  },
  warning: {
    base: '#F59E0B', // amber-500
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },
  error: {
    base: '#EF4444', // red-500
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },
};

/**
 * Font family definitions for consistent typography across the application
 */
export const fontFamily = {
  sans: [
    'Inter',
    'ui-sans-serif',
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'Helvetica Neue',
    'Arial',
    'sans-serif',
  ],
  serif: ['Georgia', 'Cambria', 'Times New Roman', 'Times', 'serif'],
  mono: ['Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
};

/**
 * Responsive breakpoints for different device sizes
 * Follows the specifications in section 7.9 RESPONSIVE DESIGN BREAKPOINTS
 */
export const responsiveBreakpoints = {
  xs: '375px',  // Mobile Small
  sm: '640px',  // Mobile
  md: '768px',  // Tablet
  lg: '1024px', // Desktop
  xl: '1280px', // Large Desktop
  '2xl': '1536px', // Extra Large
};

/**
 * Light theme configuration
 * Ensures appropriate contrast for accessibility
 */
export const lightTheme = {
  background: colorPalette.neutral[50],
  foreground: colorPalette.neutral[900],
  card: '#FFFFFF',
  cardForeground: colorPalette.neutral[900],
  popover: '#FFFFFF',
  popoverForeground: colorPalette.neutral[900],
  border: colorPalette.neutral[200],
  input: colorPalette.neutral[200],
  muted: colorPalette.neutral[100],
  mutedForeground: colorPalette.neutral[500],
};

/**
 * Dark theme configuration
 * Ensures appropriate contrast for accessibility in dark mode
 */
export const darkTheme = {
  background: colorPalette.neutral[900],
  foreground: colorPalette.neutral[50],
  card: colorPalette.neutral[800],
  cardForeground: colorPalette.neutral[50],
  popover: colorPalette.neutral[800],
  popoverForeground: colorPalette.neutral[50],
  border: colorPalette.neutral[700],
  input: colorPalette.neutral[700],
  muted: colorPalette.neutral[800],
  mutedForeground: colorPalette.neutral[400],
};

/**
 * Main theme configuration object that combines all theme elements
 */
export const themeConfig = {
  colors: {
    ...colorPalette,
  },
  typography: {
    fontFamily,
    fontSize: {
      xs: '0.75rem',      // 12px
      sm: '0.875rem',     // 14px
      base: '1rem',       // 16px
      lg: '1.125rem',     // 18px
      xl: '1.25rem',      // 20px
      '2xl': '1.5rem',    // 24px
      '3xl': '1.875rem',  // 30px
      '4xl': '2.25rem',   // 36px
      '5xl': '3rem',      // 48px
      '6xl': '3.75rem',   // 60px
    },
    fontWeight: {
      thin: '100',
      extralight: '200',
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
      black: '900',
    },
    lineHeight: {
      none: '1',
      tight: '1.25',
      snug: '1.375',
      normal: '1.5',
      relaxed: '1.625',
      loose: '2',
    },
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em',
    },
  },
  spacing: {
    px: '1px',
    0: '0',
    0.5: '0.125rem',
    1: '0.25rem',
    1.5: '0.375rem',
    2: '0.5rem',
    2.5: '0.625rem',
    3: '0.75rem',
    3.5: '0.875rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    7: '1.75rem',
    8: '2rem',
    9: '2.25rem',
    10: '2.5rem',
    11: '2.75rem',
    12: '3rem',
    14: '3.5rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
    28: '7rem',
    32: '8rem',
    36: '9rem',
    40: '10rem',
    44: '11rem',
    48: '12rem',
    52: '13rem',
    56: '14rem',
    60: '15rem',
    64: '16rem',
    72: '18rem',
    80: '20rem',
    96: '24rem',
  },
  borderRadius: {
    none: '0',
    sm: '0.125rem',
    DEFAULT: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    none: 'none',
  },
  breakpoints: responsiveBreakpoints,
};