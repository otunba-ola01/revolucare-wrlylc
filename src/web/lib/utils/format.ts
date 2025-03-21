import { format as formatFns } from 'date-fns'; // date-fns v2.30.0

/**
 * Formats a number with thousand separators and specified decimal places
 *
 * @param value - The number to format
 * @param decimalPlaces - Number of decimal places to show (default: 0)
 * @param locale - Locale to use for formatting (default: 'en-US')
 * @returns Formatted number string
 */
export function formatNumber(
  value: number | string,
  decimalPlaces: number = 0,
  locale: string = 'en-US'
): string {
  // Check if value is null, undefined, or empty string and return '-' if true
  if (value === null || value === undefined || value === '') {
    return '-';
  }
  
  // Convert string value to number if needed
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Check if value is a valid number and return '-' if not
  if (isNaN(numValue)) {
    return '-';
  }
  
  // Use Intl.NumberFormat with specified locale and decimal places
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(numValue);
}

/**
 * Formats a number as currency with the specified currency code
 *
 * @param value - The number to format as currency
 * @param currencyCode - Currency code (default: 'USD')
 * @param locale - Locale to use for formatting (default: 'en-US')
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number | string,
  currencyCode: string = 'USD',
  locale: string = 'en-US'
): string {
  // Check if value is null, undefined, or empty string and return '-' if true
  if (value === null || value === undefined || value === '') {
    return '-';
  }
  
  // Convert string value to number if needed
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Check if value is a valid number and return '-' if not
  if (isNaN(numValue)) {
    return '-';
  }
  
  // Use Intl.NumberFormat with currency style and specified currency code
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
  }).format(numValue);
}

/**
 * Formats a number as a percentage with specified decimal places
 *
 * @param value - The number to format as percentage
 * @param decimalPlaces - Number of decimal places to show (default: 0)
 * @param locale - Locale to use for formatting (default: 'en-US')
 * @returns Formatted percentage string
 */
export function formatPercentage(
  value: number | string,
  decimalPlaces: number = 0,
  locale: string = 'en-US'
): string {
  // Check if value is null, undefined, or empty string and return '-' if true
  if (value === null || value === undefined || value === '') {
    return '-';
  }
  
  // Convert string value to number if needed
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Check if value is a valid number and return '-' if not
  if (isNaN(numValue)) {
    return '-';
  }
  
  // Use Intl.NumberFormat with percent style and specified decimal places
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(numValue);
}

/**
 * Formats a file size in bytes to a human-readable format (KB, MB, GB)
 *
 * @param bytes - Size in bytes
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number): string {
  // Check if bytes is null, undefined, not a number, or negative
  if (bytes === null || bytes === undefined || isNaN(bytes) || bytes < 0) {
    return '-';
  }
  
  // Define units array
  const units = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  // Calculate the appropriate unit based on the size
  let i = 0;
  if (bytes > 0) {
    i = Math.floor(Math.log(bytes) / Math.log(1024));
  }
  
  // Format the number with appropriate decimal places based on unit
  if (i === 0) {
    return `${bytes} ${units[i]}`;
  }
  
  const size = bytes / Math.pow(1024, i);
  const decimalPlaces = i > 0 ? 2 : 0;
  
  return `${size.toFixed(decimalPlaces)} ${units[i]}`;
}

/**
 * Formats a phone number string into a standardized format
 *
 * @param phoneNumber - The phone number to format
 * @param format - Format pattern (default: '(###) ###-####')
 * @returns Formatted phone number
 */
export function formatPhoneNumber(
  phoneNumber: string,
  format: string = '(###) ###-####'
): string {
  // Check if phoneNumber is null, undefined, or empty
  if (!phoneNumber) {
    return '';
  }
  
  // Remove all non-digit characters from the phone number
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Count how many placeholders we have in the format
  const placeholderCount = (format.match(/#/g) || []).length;
  
  // Check if the cleaned number has enough digits
  if (cleaned.length < placeholderCount) {
    return phoneNumber; // Return original if not enough digits
  }
  
  // Replace the format placeholders with actual digits
  let result = format;
  let charIndex = 0;
  
  result = result.replace(/#/g, () => {
    return charIndex < cleaned.length ? cleaned[charIndex++] : '#';
  });
  
  // If there are remaining digits, append them
  if (charIndex < cleaned.length) {
    result += ' ' + cleaned.substring(charIndex);
  }
  
  return result;
}

/**
 * Formats an address object into a single-line or multi-line string
 *
 * @param address - Address object containing street, city, state, etc.
 * @param multiline - Whether to format with line breaks (default: false)
 * @returns Formatted address string
 */
export function formatAddress(
  address: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  },
  multiline: boolean = false
): string {
  // Check if address is null or undefined
  if (!address) {
    return '';
  }
  
  // Extract street, city, state, zipCode, and country from address object
  const { street, city, state, zipCode, country } = address;
  
  // Combine components into a formatted string
  const parts: string[] = [];
  
  if (street) parts.push(street);
  
  const cityStateZip: string[] = [];
  if (city) cityStateZip.push(city);
  if (state) cityStateZip.push(state);
  if (zipCode) cityStateZip.push(zipCode);
  
  if (cityStateZip.length > 0) {
    parts.push(cityStateZip.join(', '));
  }
  
  if (country) parts.push(country);
  
  // If multiline is true, use line breaks between components
  // Otherwise use commas and spaces
  return multiline ? parts.join('\n') : parts.join(', ');
}

/**
 * Formats an array of items into a comma-separated list with optional conjunction
 *
 * @param items - Array of items to format
 * @param conjunction - Conjunction to use between last items (default: 'and')
 * @returns Formatted list string
 */
export function formatList(
  items: string[],
  conjunction: string = 'and'
): string {
  // Check if items is null, undefined, or empty
  if (!items || items.length === 0) {
    return '';
  }
  
  // If there's only one item, return it as is
  if (items.length === 1) {
    return items[0];
  }
  
  // If there are two items, join them with the conjunction
  if (items.length === 2) {
    return `${items[0]} ${conjunction} ${items[1]}`;
  }
  
  // For more than two items, join all but the last with commas
  const lastItem = items[items.length - 1];
  const otherItems = items.slice(0, -1).join(', ');
  
  // Add the conjunction before the last item
  return `${otherItems}, ${conjunction} ${lastItem}`;
}

/**
 * Formats a duration in minutes into a human-readable format (e.g., 1h 30m)
 *
 * @param minutes - Duration in minutes
 * @param verbose - Whether to use full unit names (default: false)
 * @returns Formatted duration string
 */
export function formatDuration(
  minutes: number,
  verbose: boolean = false
): string {
  // Check if minutes is null, undefined, or not a number
  if (minutes === null || minutes === undefined || isNaN(minutes)) {
    return '-';
  }
  
  // Calculate hours and remaining minutes
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  // Format hours and minutes with appropriate units
  const hourUnit = verbose ? ' hours' : 'h';
  const minuteUnit = verbose ? ' minutes' : 'm';
  
  // Build the formatted duration string
  let result = '';
  
  if (hours > 0) {
    result += `${hours}${hourUnit}`;
    if (mins > 0) result += ' ';
  }
  
  if (mins > 0 || hours === 0) {
    result += `${mins}${minuteUnit}`;
  }
  
  return result;
}

/**
 * Formats a number in compact notation (e.g., 1K, 1M) for display in space-constrained UI
 *
 * @param value - The number to format
 * @param locale - Locale to use for formatting (default: 'en-US')
 * @returns Compact formatted number
 */
export function formatCompactNumber(
  value: number | string,
  locale: string = 'en-US'
): string {
  // Check if value is null, undefined, or empty string
  if (value === null || value === undefined || value === '') {
    return '-';
  }
  
  // Convert string value to number if needed
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Check if value is a valid number
  if (isNaN(numValue)) {
    return '-';
  }
  
  // Use Intl.NumberFormat with compact notation
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(numValue);
}

/**
 * Returns singular or plural form of a word based on count
 *
 * @param count - The count to determine plurality
 * @param singular - Singular form of the word
 * @param plural - Plural form of the word (default: singular + 's')
 * @returns Appropriate form of the word
 */
export function formatPlural(
  count: number,
  singular: string,
  plural?: string
): string {
  // Check if count is exactly 1, return singular form
  if (count === 1) {
    return singular;
  }
  
  // Otherwise return plural form
  // If plural parameter is not provided, append 's' to singular form
  return plural || `${singular}s`;
}

/**
 * Formats a date as a relative time string (e.g., '5 minutes ago', 'in 3 days')
 *
 * @param date - Date to format
 * @param locale - Locale to use for formatting (default: 'en-US')
 * @returns Relative time string
 */
export function formatRelativeTime(
  date: Date | string,
  locale: string = 'en-US'
): string {
  // Check if date is valid
  if (!date) {
    return '-';
  }
  
  // Convert string date to Date object if needed
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return '-';
  }
  
  // Calculate the time difference between the date and now
  const now = new Date();
  const diffMs = dateObj.getTime() - now.getTime();
  const diffSeconds = Math.round(diffMs / 1000);
  const diffMinutes = Math.round(diffSeconds / 60);
  const diffHours = Math.round(diffMinutes / 60);
  const diffDays = Math.round(diffHours / 24);
  
  // Choose appropriate unit (seconds, minutes, hours, days, etc.)
  let unit: Intl.RelativeTimeFormatUnit;
  let value: number;
  
  if (Math.abs(diffSeconds) < 60) {
    unit = 'second';
    value = diffSeconds;
  } else if (Math.abs(diffMinutes) < 60) {
    unit = 'minute';
    value = diffMinutes;
  } else if (Math.abs(diffHours) < 24) {
    unit = 'hour';
    value = diffHours;
  } else if (Math.abs(diffDays) < 30) {
    unit = 'day';
    value = diffDays;
  } else if (Math.abs(diffDays) < 365) {
    unit = 'month';
    value = Math.round(diffDays / 30);
  } else {
    unit = 'year';
    value = Math.round(diffDays / 365);
  }
  
  // Use Intl.RelativeTimeFormat to format the relative time
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  return rtf.format(value, unit);
}

// Re-export date-fns format function for consistency
export { formatFns as format };