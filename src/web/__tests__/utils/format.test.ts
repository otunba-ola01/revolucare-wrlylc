import { 
  formatNumber, 
  formatCurrency, 
  formatPercentage, 
  formatFileSize, 
  formatPhoneNumber, 
  formatAddress, 
  formatList, 
  formatDuration, 
  formatCompactNumber, 
  formatPlural, 
  formatRelativeTime 
} from '../../../lib/utils/format';
import { expect, describe, it, beforeEach } from '@jest/globals'; // @jest/globals v29.5.0

describe('formatNumber', () => {
  it('formats numbers with default decimal places', () => {
    expect(formatNumber(1000)).toBe('1,000');
    expect(formatNumber(1000.5)).toBe('1,001'); // Rounded with default 0 decimal places
    expect(formatNumber(1234567)).toBe('1,234,567');
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(-1000)).toBe('-1,000');
  });

  it('formats numbers with specified decimal places', () => {
    expect(formatNumber(1000, 2)).toBe('1,000.00');
    expect(formatNumber(1000.5, 2)).toBe('1,000.50');
    expect(formatNumber(1000.567, 2)).toBe('1,000.57'); // Rounded to 2 decimal places
    expect(formatNumber(1000.567, 3)).toBe('1,000.567');
    expect(formatNumber(0, 2)).toBe('0.00');
  });

  it('formats numbers according to different locale conventions', () => {
    // German uses period as thousand separator and comma for decimal
    expect(formatNumber(1234567.89, 2, 'de-DE')).toBe('1.234.567,89');
    
    // French uses space as thousand separator and comma for decimal
    expect(formatNumber(1234567.89, 2, 'fr-FR')).toBe('1 234 567,89');
    
    // Indian numbering system groups first 3 digits, then 2 digits
    expect(formatNumber(1234567, 0, 'en-IN')).toBe('12,34,567');
  });

  it('handles string inputs', () => {
    expect(formatNumber('1000')).toBe('1,000');
    expect(formatNumber('1000.5', 2)).toBe('1,000.50');
    expect(formatNumber('1234567')).toBe('1,234,567');
  });

  it('handles null, undefined, and invalid inputs', () => {
    expect(formatNumber(null as any)).toBe('-');
    expect(formatNumber(undefined as any)).toBe('-');
    expect(formatNumber('')).toBe('-');
    expect(formatNumber('not a number')).toBe('-');
  });
});

describe('formatCurrency', () => {
  it('formats currency with default currency code (USD)', () => {
    expect(formatCurrency(1000)).toBe('$1,000.00');
    expect(formatCurrency(1000.5)).toBe('$1,000.50');
    expect(formatCurrency(0)).toBe('$0.00');
    expect(formatCurrency(-1000)).toBe('-$1,000.00');
  });

  it('formats currency with specified currency code', () => {
    expect(formatCurrency(1000, 'EUR')).toBe('€1,000.00');
    expect(formatCurrency(1000, 'GBP')).toBe('£1,000.00');
    expect(formatCurrency(1000, 'JPY')).toBe('¥1,000'); // JPY typically doesn't use decimal places
  });

  it('handles string inputs for currency', () => {
    expect(formatCurrency('1000')).toBe('$1,000.00');
    expect(formatCurrency('1000.5')).toBe('$1,000.50');
  });

  it('handles null, undefined, and invalid inputs for currency', () => {
    expect(formatCurrency(null as any)).toBe('-');
    expect(formatCurrency(undefined as any)).toBe('-');
    expect(formatCurrency('')).toBe('-');
    expect(formatCurrency('not a number')).toBe('-');
  });
});

describe('formatPercentage', () => {
  it('formats percentages with default decimal places', () => {
    expect(formatPercentage(0.5)).toBe('50%');
    expect(formatPercentage(1)).toBe('100%');
    expect(formatPercentage(0.123)).toBe('12%'); // Rounded with default 0 decimal places
    expect(formatPercentage(0)).toBe('0%');
  });

  it('formats percentages with specified decimal places', () => {
    expect(formatPercentage(0.5, 2)).toBe('50.00%');
    expect(formatPercentage(0.123, 2)).toBe('12.30%');
    expect(formatPercentage(0.1234, 3)).toBe('12.340%');
  });
});

describe('formatFileSize', () => {
  it('formats file sizes with appropriate units', () => {
    expect(formatFileSize(0)).toBe('0 Bytes');
    expect(formatFileSize(500)).toBe('500 Bytes');
    expect(formatFileSize(1024)).toBe('1.00 KB');
    expect(formatFileSize(1536)).toBe('1.50 KB');
    expect(formatFileSize(1048576)).toBe('1.00 MB');
    expect(formatFileSize(1073741824)).toBe('1.00 GB');
    expect(formatFileSize(1099511627776)).toBe('1.00 TB');
  });

  it('handles edge cases for file sizes', () => {
    expect(formatFileSize(-1)).toBe('-');
    expect(formatFileSize(NaN)).toBe('-');
    expect(formatFileSize(null as any)).toBe('-');
    expect(formatFileSize(undefined as any)).toBe('-');
  });
});

describe('formatPhoneNumber', () => {
  it('formats phone numbers with default format', () => {
    expect(formatPhoneNumber('1234567890')).toBe('(123) 456-7890');
    expect(formatPhoneNumber('123-456-7890')).toBe('(123) 456-7890');
    expect(formatPhoneNumber('(123) 456-7890')).toBe('(123) 456-7890');
  });

  it('formats phone numbers with custom format', () => {
    expect(formatPhoneNumber('1234567890', '###-###-####')).toBe('123-456-7890');
    expect(formatPhoneNumber('1234567890', '+# (###) ###-####')).toBe('+1 (234) 567-890');
  });

  it('handles inputs that are too short for the format', () => {
    expect(formatPhoneNumber('123')).toBe('123'); // Too short for default format, returns original
    expect(formatPhoneNumber('123456')).toBe('(123) 456'); // Partial formatting
  });
});

describe('formatAddress', () => {
  it('formats addresses as single line by default', () => {
    expect(formatAddress({
      street: '123 Main St',
      city: 'Springfield',
      state: 'IL',
      zipCode: '62704',
      country: 'USA'
    })).toBe('123 Main St, Springfield, IL, 62704, USA');
  });

  it('formats addresses as multi-line when specified', () => {
    expect(formatAddress({
      street: '123 Main St',
      city: 'Springfield',
      state: 'IL',
      zipCode: '62704',
      country: 'USA'
    }, true)).toBe('123 Main St\nSpringfield, IL, 62704\nUSA');
  });

  it('handles partial address information', () => {
    expect(formatAddress({
      street: '123 Main St',
      city: 'Springfield'
    })).toBe('123 Main St, Springfield');

    expect(formatAddress({
      city: 'Springfield',
      state: 'IL',
      country: 'USA'
    })).toBe('Springfield, IL, USA');
  });
});

describe('formatList', () => {
  it('formats lists with default conjunction', () => {
    expect(formatList(['apple'])).toBe('apple');
    expect(formatList(['apple', 'banana'])).toBe('apple and banana');
    expect(formatList(['apple', 'banana', 'orange'])).toBe('apple, banana, and orange');
  });

  it('formats lists with custom conjunction', () => {
    expect(formatList(['apple', 'banana'], 'or')).toBe('apple or banana');
    expect(formatList(['apple', 'banana', 'orange'], 'or')).toBe('apple, banana, or orange');
  });
});

describe('formatDuration', () => {
  it('formats durations with compact units by default', () => {
    expect(formatDuration(30)).toBe('30m');
    expect(formatDuration(60)).toBe('1h');
    expect(formatDuration(90)).toBe('1h 30m');
    expect(formatDuration(120)).toBe('2h');
    expect(formatDuration(0)).toBe('0m');
  });

  it('formats durations with verbose units when specified', () => {
    expect(formatDuration(30, true)).toBe('30 minutes');
    expect(formatDuration(60, true)).toBe('1 hours');
    expect(formatDuration(90, true)).toBe('1 hours 30 minutes');
    expect(formatDuration(0, true)).toBe('0 minutes');
  });
});

describe('formatCompactNumber', () => {
  it('formats numbers in compact notation', () => {
    expect(formatCompactNumber(1000)).toBe('1K');
    expect(formatCompactNumber(1500)).toBe('1.5K');
    expect(formatCompactNumber(1000000)).toBe('1M');
    expect(formatCompactNumber(1500000)).toBe('1.5M');
    expect(formatCompactNumber(1000000000)).toBe('1B');
  });
});

describe('formatPlural', () => {
  it('returns singular form for count of 1', () => {
    expect(formatPlural(1, 'item')).toBe('item');
    expect(formatPlural(1, 'box', 'boxes')).toBe('box');
  });

  it('returns plural form for counts other than 1', () => {
    expect(formatPlural(0, 'item')).toBe('items');
    expect(formatPlural(2, 'item')).toBe('items');
    expect(formatPlural(0, 'box', 'boxes')).toBe('boxes');
    expect(formatPlural(2, 'box', 'boxes')).toBe('boxes');
  });

  it('uses default plural form when not provided', () => {
    expect(formatPlural(2, 'item')).toBe('items');
    expect(formatPlural(0, 'apple')).toBe('apples');
  });
});

describe('formatRelativeTime', () => {
  it('formats dates as relative time strings', () => {
    const now = new Date();
    
    // Test past dates
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    expect(formatRelativeTime(fiveMinutesAgo)).toMatch(/5 minutes ago|5 minutes ago/);
    
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    expect(formatRelativeTime(twoHoursAgo)).toMatch(/2 hours ago|2 hours ago/);
    
    // Test future dates
    const inThreeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    expect(formatRelativeTime(inThreeDays)).toMatch(/in 3 days|3 days from now/);
  });

  it('handles string date inputs', () => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    expect(formatRelativeTime(yesterday.toISOString())).toMatch(/yesterday|1 day ago/);
  });

  it('handles invalid date inputs', () => {
    expect(formatRelativeTime(null as any)).toBe('-');
    expect(formatRelativeTime(undefined as any)).toBe('-');
    expect(formatRelativeTime('not a date')).toBe('-');
  });
});