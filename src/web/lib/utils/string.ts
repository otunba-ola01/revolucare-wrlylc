/**
 * String utility functions for the Revolucare web application.
 * This module provides common string manipulation operations used throughout the frontend,
 * including normalization, truncation, formatting, and other string transformations.
 */

/**
 * Normalizes a string by removing diacritics, converting to lowercase, and trimming whitespace.
 * 
 * @param input - The string to normalize
 * @returns The normalized string
 */
export function normalizeString(input: string): string {
  // Check if input is null, undefined, or empty
  if (input == null || input === '') {
    return '';
  }
  
  // Convert input to string if it's not already
  const str = String(input);
  
  // Normalize Unicode characters using NFD
  // Remove diacritical marks using regular expression
  // Convert to lowercase and trim whitespace
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Truncates a string to a specified length and adds an ellipsis if truncated.
 * 
 * @param input - The string to truncate
 * @param maxLength - The maximum length of the string (default: 50)
 * @param ellipsis - The string to append if truncated (default: '...')
 * @returns The truncated string
 */
export function truncateString(input: string, maxLength: number = 50, ellipsis: string = '...'): string {
  // Check if input is null, undefined, or empty
  if (input == null || input === '') {
    return '';
  }
  
  // Convert input to string if it's not already
  const str = String(input);
  
  // If input length is less than or equal to maxLength, return input as is
  if (str.length <= maxLength) {
    return str;
  }
  
  // Otherwise, truncate input to maxLength - ellipsis.length characters and append ellipsis
  return str.substring(0, maxLength - ellipsis.length) + ellipsis;
}

/**
 * Capitalizes the first letter of a string.
 * 
 * @param input - The string to capitalize
 * @returns The capitalized string
 */
export function capitalizeString(input: string): string {
  // Check if input is null, undefined, or empty
  if (input == null || input === '') {
    return '';
  }
  
  // Convert input to string if it's not already
  const str = String(input);
  
  // Capitalize the first letter and concatenate with the rest of the string
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Converts a string to title case (capitalizes the first letter of each word).
 * 
 * @param input - The string to convert to title case
 * @returns The title-cased string
 */
export function titleCaseString(input: string): string {
  // Check if input is null, undefined, or empty
  if (input == null || input === '') {
    return '';
  }
  
  // Convert input to string if it's not already
  const str = String(input);
  
  // Split the string into words, capitalize the first letter of each word, and join them back together
  return str
    .split(' ')
    .map(word => word.length > 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word)
    .join(' ');
}

/**
 * Converts a camelCase string to Title Case with spaces.
 * 
 * @param input - The camelCase string to convert
 * @returns The title-cased string with spaces
 */
export function camelCaseToTitleCase(input: string): string {
  // Check if input is null, undefined, or empty
  if (input == null || input === '') {
    return '';
  }
  
  // Convert input to string if it's not already
  const str = String(input);
  
  // Replace camelCase pattern with space and the matched letter, then capitalize the first letter
  const result = str
    .replace(/([A-Z])/g, ' $1')
    .trim();
  
  return result.charAt(0).toUpperCase() + result.slice(1);
}

/**
 * Converts a string to a URL-friendly slug.
 * 
 * @param input - The string to slugify
 * @returns A URL-friendly slug
 */
export function slugify(input: string): string {
  // Check if input is null, undefined, or empty
  if (input == null || input === '') {
    return '';
  }
  
  // Convert input to string if it's not already
  const str = String(input);
  
  // Normalize the string
  const normalized = normalizeString(str);
  
  // Replace spaces and special characters with hyphens
  // Remove consecutive hyphens
  // Remove leading and trailing hyphens
  return normalized
    .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/[\s_]+/g, '-')  // Replace spaces and underscores with hyphens
    .replace(/-+/g, '-')      // Replace consecutive hyphens with a single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading and trailing hyphens
}

/**
 * Removes HTML tags from a string.
 * 
 * @param input - The string containing HTML
 * @returns The string without HTML tags
 */
export function stripHtml(input: string): string {
  // Check if input is null, undefined, or empty
  if (input == null || input === '') {
    return '';
  }
  
  // Convert input to string if it's not already
  const str = String(input);
  
  // Replace all HTML tags with empty string
  return str.replace(/<[^>]*>/g, '');
}

/**
 * Escapes special characters in a string for use in a regular expression.
 * 
 * @param input - The string to escape
 * @returns The escaped string safe for RegExp
 */
export function escapeRegExp(input: string): string {
  // Check if input is null, undefined, or empty
  if (input == null || input === '') {
    return '';
  }
  
  // Convert input to string if it's not already
  const str = String(input);
  
  // Replace special RegExp characters with their escaped versions
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Generates initials from a name (first letter of first and last name).
 * 
 * @param name - The name to generate initials from
 * @param maxLength - The maximum number of initials to return (default: 2)
 * @returns The initials
 */
export function generateInitials(name: string, maxLength: number = 2): string {
  // Check if name is null, undefined, or empty
  if (name == null || name === '') {
    return '';
  }
  
  // Convert name to string if it's not already
  const str = String(name);
  
  // Split the name into words, take the first letter of each word, join and uppercase them
  const initials = str
    .split(/\s+/)
    .filter(word => word.length > 0)
    .map(word => word[0])
    .join('')
    .toUpperCase();
  
  // Limit to maxLength characters
  return initials.substring(0, maxLength);
}

/**
 * Formats a first and last name into a full name.
 * 
 * @param firstName - The first name
 * @param lastName - The last name
 * @returns The formatted full name
 */
export function formatName(firstName: string, lastName: string): string {
  // Check if both firstName and lastName are empty
  if ((!firstName || firstName === '') && (!lastName || lastName === '')) {
    return '';
  }
  
  // If only firstName is provided, return it
  if (firstName && (!lastName || lastName === '')) {
    return firstName;
  }
  
  // If only lastName is provided, return it
  if ((!firstName || firstName === '') && lastName) {
    return lastName;
  }
  
  // If both are provided, concatenate them with a space
  return `${firstName} ${lastName}`;
}

/**
 * Masks a portion of a string with a specified character (useful for sensitive data).
 * 
 * @param input - The string to mask
 * @param visibleStart - The number of characters to show at the start (default: 0)
 * @param visibleEnd - The number of characters to show at the end (default: 0)
 * @param maskChar - The character to use for masking (default: '*')
 * @returns The masked string
 */
export function maskString(input: string, visibleStart: number = 0, visibleEnd: number = 0, maskChar: string = '*'): string {
  // Check if input is null, undefined, or empty
  if (input == null || input === '') {
    return '';
  }
  
  // Convert input to string if it's not already
  const str = String(input);
  
  // Calculate the start and end indices for visible portions
  const startVisible = Math.min(visibleStart, str.length);
  const endVisible = Math.max(0, str.length - visibleEnd);
  
  // If the visible portions overlap, adjust them
  if (startVisible >= endVisible) {
    return str;
  }
  
  // Extract visible start characters
  const visibleStartPart = str.substring(0, startVisible);
  
  // Create mask characters for the middle portion
  const maskedPart = maskChar.repeat(endVisible - startVisible);
  
  // Extract visible end characters
  const visibleEndPart = str.substring(endVisible);
  
  // Combine the parts and return
  return visibleStartPart + maskedPart + visibleEndPart;
}

/**
 * Removes extra spaces from a string, including consecutive spaces.
 * 
 * @param input - The string to normalize spacing in
 * @returns The string with normalized spacing
 */
export function removeExtraSpaces(input: string): string {
  // Check if input is null, undefined, or empty
  if (input == null || input === '') {
    return '';
  }
  
  // Convert input to string if it's not already
  const str = String(input);
  
  // Replace multiple spaces with a single space and trim
  return str.replace(/\s+/g, ' ').trim();
}

/**
 * Counts the number of words in a string.
 * 
 * @param input - The string to count words in
 * @returns The word count
 */
export function countWords(input: string): number {
  // Check if input is null, undefined, or empty
  if (input == null || input === '') {
    return 0;
  }
  
  // Convert input to string if it's not already
  const str = String(input);
  
  // Trim whitespace, split by whitespace, and filter out empty strings
  const words = str.trim().split(/\s+/).filter(word => word.length > 0);
  
  // Return the length of the resulting array
  return words.length;
}

/**
 * Calculates the byte size of a string (useful for storage calculations).
 * 
 * @param input - The string to calculate the byte size of
 * @returns The size in bytes
 */
export function getStringByteSize(input: string): number {
  // Check if input is null, undefined, or empty
  if (input == null || input === '') {
    return 0;
  }
  
  // Convert input to string if it's not already
  const str = String(input);
  
  // Use TextEncoder to encode the string as UTF-8 and get the byte length
  return new TextEncoder().encode(str).length;
}