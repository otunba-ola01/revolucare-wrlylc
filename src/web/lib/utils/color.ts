import { type ClassValue, clsx } from "clsx"; // v1.2.1
import { twMerge } from "tailwind-merge"; // v1.13.0

/**
 * Converts a hexadecimal color code to RGB values
 * @param hex - Hexadecimal color code (e.g., "#FF5733" or "#F57")
 * @returns Object with r, g, b properties or null if invalid hex
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  // Validate and normalize hex format
  const normalized = hex.startsWith("#") ? hex.substring(1) : hex;
  
  // Handle both 3-digit and 6-digit hex codes
  const regex = normalized.length === 3 
    ? /^([a-f\d])([a-f\d])([a-f\d])$/i 
    : /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;
  
  const result = regex.exec(normalized);
  if (!result) return null;
  
  // Extract components and convert to decimal
  if (normalized.length === 3) {
    // For 3-digit hex, duplicate each character (e.g., "F" becomes "FF")
    return {
      r: parseInt(`${result[1]}${result[1]}`, 16),
      g: parseInt(`${result[2]}${result[2]}`, 16),
      b: parseInt(`${result[3]}${result[3]}`, 16),
    };
  }
  
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

/**
 * Converts RGB values to a hexadecimal color code
 * @param r - Red component (0-255)
 * @param g - Green component (0-255)
 * @param b - Blue component (0-255)
 * @returns Hexadecimal color code
 */
export function rgbToHex(r: number, g: number, b: number): string {
  // Ensure values are within valid range
  const validR = Math.max(0, Math.min(255, Math.round(r)));
  const validG = Math.max(0, Math.min(255, Math.round(g)));
  const validB = Math.max(0, Math.min(255, Math.round(b)));
  
  // Convert to hex and pad with zeros if needed
  const hexR = validR.toString(16).padStart(2, "0");
  const hexG = validG.toString(16).padStart(2, "0");
  const hexB = validB.toString(16).padStart(2, "0");
  
  return `#${hexR}${hexG}${hexB}`;
}

/**
 * Lightens a color by a specified percentage
 * @param color - Hexadecimal color code
 * @param amount - Percentage to lighten (0-100)
 * @returns Lightened color in hex format
 */
export function lighten(color: string, amount: number): string {
  const rgb = hexToRgb(color);
  if (!rgb) return color;
  
  // Convert percentage to decimal and ensure it's within range
  const factor = Math.max(0, Math.min(1, amount / 100));
  
  // Lighten each component by moving toward 255
  const r = Math.round(rgb.r + (255 - rgb.r) * factor);
  const g = Math.round(rgb.g + (255 - rgb.g) * factor);
  const b = Math.round(rgb.b + (255 - rgb.b) * factor);
  
  return rgbToHex(r, g, b);
}

/**
 * Darkens a color by a specified percentage
 * @param color - Hexadecimal color code
 * @param amount - Percentage to darken (0-100)
 * @returns Darkened color in hex format
 */
export function darken(color: string, amount: number): string {
  const rgb = hexToRgb(color);
  if (!rgb) return color;
  
  // Convert percentage to decimal and ensure it's within range
  const factor = Math.max(0, Math.min(1, amount / 100));
  
  // Darken each component by moving toward 0
  const r = Math.round(rgb.r * (1 - factor));
  const g = Math.round(rgb.g * (1 - factor));
  const b = Math.round(rgb.b * (1 - factor));
  
  return rgbToHex(r, g, b);
}

/**
 * Generates a color palette with various shades based on a base color
 * @param baseColor - Base color in hex format (will be used as the 500 shade)
 * @returns Object with color shade keys (50-900) and hex values
 */
export function generateColorPalette(baseColor: string): Record<string, string> {
  // Define lightening/darkening amounts for each shade
  const shadeConfig = {
    50: { lighten: 85 },
    100: { lighten: 75 },
    200: { lighten: 60 },
    300: { lighten: 45 },
    400: { lighten: 25 },
    500: { base: true },
    600: { darken: 10 },
    700: { darken: 25 },
    800: { darken: 40 },
    900: { darken: 55 },
  };
  
  const palette: Record<string, string> = {};
  
  // Generate each shade based on the base color
  Object.entries(shadeConfig).forEach(([shade, config]) => {
    if ('base' in config) {
      palette[shade] = baseColor;
    } else if ('lighten' in config) {
      palette[shade] = lighten(baseColor, config.lighten);
    } else if ('darken' in config) {
      palette[shade] = darken(baseColor, config.darken);
    }
  });
  
  return palette;
}

/**
 * Calculates the relative luminance of a color for WCAG contrast calculations
 * @param rgb - RGB color values
 * @returns Relative luminance value
 */
function getLuminance(rgb: { r: number; g: number; b: number }): number {
  // Convert RGB to sRGB
  const srgb = {
    r: rgb.r / 255,
    g: rgb.g / 255,
    b: rgb.b / 255,
  };
  
  // Calculate luminance components
  const components = {
    r: srgb.r <= 0.03928 ? srgb.r / 12.92 : Math.pow((srgb.r + 0.055) / 1.055, 2.4),
    g: srgb.g <= 0.03928 ? srgb.g / 12.92 : Math.pow((srgb.g + 0.055) / 1.055, 2.4),
    b: srgb.b <= 0.03928 ? srgb.b / 12.92 : Math.pow((srgb.b + 0.055) / 1.055, 2.4),
  };
  
  // Calculate relative luminance using WCAG formula
  return 0.2126 * components.r + 0.7152 * components.g + 0.0722 * components.b;
}

/**
 * Calculates the contrast ratio between two colors according to WCAG guidelines
 * @param foreground - Foreground color in hex format
 * @param background - Background color in hex format
 * @returns Contrast ratio (1-21)
 */
export function getContrastRatio(foreground: string, background: string): number {
  const fgRgb = hexToRgb(foreground);
  const bgRgb = hexToRgb(background);
  
  if (!fgRgb || !bgRgb) {
    throw new Error("Invalid color format. Please provide valid hex colors.");
  }
  
  // Calculate luminance values
  const fgLuminance = getLuminance(fgRgb);
  const bgLuminance = getLuminance(bgRgb);
  
  // Determine lighter and darker colors
  const lighter = Math.max(fgLuminance, bgLuminance);
  const darker = Math.min(fgLuminance, bgLuminance);
  
  // Calculate contrast ratio using WCAG formula
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Checks if a color combination meets WCAG 2.1 AA contrast requirements
 * @param foreground - Foreground color in hex format
 * @param background - Background color in hex format
 * @param options - Options object
 * @param options.isLargeText - Whether the text is large (≥18pt or ≥14pt bold)
 * @returns True if the contrast ratio meets AA requirements
 */
export function isAccessible(
  foreground: string, 
  background: string, 
  options: { isLargeText?: boolean } = {}
): boolean {
  const { isLargeText = false } = options;
  const ratio = getContrastRatio(foreground, background);
  
  // WCAG 2.1 AA requirements
  // For large text: minimum ratio of 3:1
  // For normal text: minimum ratio of 4.5:1
  const minimumRatio = isLargeText ? 3 : 4.5;
  
  return ratio >= minimumRatio;
}

/**
 * Determines whether white or black text would be more readable on a given background color
 * @param backgroundColor - Background color in hex format
 * @returns Either '#FFFFFF' or '#000000' based on which has higher contrast
 */
export function getAccessibleTextColor(backgroundColor: string): string {
  const whiteContrast = getContrastRatio("#FFFFFF", backgroundColor);
  const blackContrast = getContrastRatio("#000000", backgroundColor);
  
  return whiteContrast > blackContrast ? "#FFFFFF" : "#000000";
}

/**
 * Utility function for conditionally joining class names with Tailwind CSS conflict resolution
 * @param inputs - Class values to be combined
 * @returns Combined class string
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}