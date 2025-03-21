import {
  format,
  parse,
  isValid,
  addDays,
  addMinutes,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  isSameDay,
  differenceInMinutes,
  isAfter,
  isBefore,
  parseISO
} from 'date-fns'; // v2.30.0

/**
 * Formats a date object or string into a specified format
 * @param date The date to format
 * @param formatString The format string to use
 * @returns Formatted date string
 */
export function formatDate(date: Date | string, formatString: string = 'yyyy-MM-dd'): string {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return '';
    return format(dateObj, formatString);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}

/**
 * Parses a date string into a Date object
 * @param dateString The date string to parse
 * @param formatString The format string to use
 * @returns Parsed Date object or null if invalid
 */
export function parseDate(dateString: string, formatString: string = 'yyyy-MM-dd'): Date | null {
  try {
    const parsedDate = parse(dateString, formatString, new Date());
    return isValid(parsedDate) ? parsedDate : null;
  } catch (error) {
    console.error('Error parsing date:', error);
    return null;
  }
}

/**
 * Gets the start and end dates for a specified period (day, week, month) around a reference date
 * @param date Reference date
 * @param period Period type ('day', 'week', 'month')
 * @returns Object with start and end dates
 */
export function getDateRangeForPeriod(date: Date, period: string = 'day'): { start: Date; end: Date } {
  const referenceDate = new Date(date);
  
  switch (period.toLowerCase()) {
    case 'day':
      return {
        start: startOfDay(referenceDate),
        end: endOfDay(referenceDate)
      };
    case 'week':
      return {
        start: startOfWeek(referenceDate, { weekStartsOn: 0 }), // 0 = Sunday
        end: endOfWeek(referenceDate, { weekStartsOn: 0 })
      };
    case 'month':
      return {
        start: startOfMonth(referenceDate),
        end: endOfMonth(referenceDate)
      };
    default:
      return {
        start: startOfDay(referenceDate),
        end: endOfDay(referenceDate)
      };
  }
}

/**
 * Generates time slots for a given date range based on provider availability
 * @param dateRange Object with start and end dates
 * @param options Options for time slot generation (start time, end time, duration, buffer)
 * @returns Array of time slot objects with start and end times
 */
export function getTimeSlots(
  dateRange: { start: Date; end: Date },
  options: { startTime: string; endTime: string; duration: number; bufferTime: number }
): Array<{ start: Date; end: Date }> {
  const { start, end } = dateRange;
  const { startTime, endTime, duration, bufferTime } = options;
  
  // Parse start and end times
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  const slots: Array<{ start: Date; end: Date }> = [];
  let currentDate = new Date(start);
  
  // Loop through each day in the range
  while (currentDate <= end) {
    // Set start and end times for the current day
    const dayStart = new Date(currentDate);
    dayStart.setHours(startHour, startMinute, 0, 0);
    
    const dayEnd = new Date(currentDate);
    dayEnd.setHours(endHour, endMinute, 0, 0);
    
    // Generate slots for the current day
    let slotStart = new Date(dayStart);
    while (slotStart < dayEnd) {
      const slotEnd = addMinutes(slotStart, duration);
      
      // Only add slot if it ends before or at the day end time
      if (slotEnd <= dayEnd) {
        slots.push({
          start: new Date(slotStart),
          end: new Date(slotEnd)
        });
      }
      
      // Move to next slot start time (add duration + buffer)
      slotStart = addMinutes(slotStart, duration + bufferTime);
    }
    
    // Move to next day
    currentDate = addDays(currentDate, 1);
    currentDate.setHours(0, 0, 0, 0);
  }
  
  return slots;
}

/**
 * Checks if two time intervals overlap
 * @param interval1 First time interval
 * @param interval2 Second time interval
 * @returns True if intervals overlap, false otherwise
 */
export function isOverlapping(
  interval1: { start: Date; end: Date },
  interval2: { start: Date; end: Date }
): boolean {
  return (
    isAfter(interval1.end, interval2.start) &&
    isBefore(interval1.start, interval2.end)
  );
}

/**
 * Gets the name of a weekday from a number (0-6) or date
 * @param dayOrDate Day number (0-6, Sunday to Saturday) or Date object
 * @param formatType Format type ('long', 'short', 'narrow')
 * @returns Name of the weekday
 */
export function getWeekDayName(
  dayOrDate: Date | number, 
  formatType: 'long' | 'short' | 'narrow' = 'long'
): string {
  const day = dayOrDate instanceof Date ? dayOrDate.getDay() : dayOrDate;
  
  // Create a date for the day of week (using the first week of 2023 as reference)
  const date = new Date(2023, 0, day + 1); // January 1, 2023 was a Sunday (day 0)
  
  return new Intl.DateTimeFormat('en-US', { weekday: formatType }).format(date);
}

/**
 * Gets the name of a month from a number (0-11) or date
 * @param monthOrDate Month number (0-11, January to December) or Date object
 * @param formatType Format type ('long', 'short', 'narrow')
 * @returns Name of the month
 */
export function getMonthName(
  monthOrDate: Date | number,
  formatType: 'long' | 'short' | 'narrow' = 'long'
): string {
  const month = monthOrDate instanceof Date ? monthOrDate.getMonth() : monthOrDate;
  
  // Create a date for the month (using 2023 as reference)
  const date = new Date(2023, month, 1);
  
  return new Intl.DateTimeFormat('en-US', { month: formatType }).format(date);
}

/**
 * Formats a time string or Date object into a readable time format
 * @param time Time to format (Date object or string in HH:MM format)
 * @param formatString Format string to use
 * @returns Formatted time string
 */
export function formatTime(time: Date | string, formatString: string = 'h:mm a'): string {
  if (!time) return '';
  
  try {
    let timeDate: Date;
    
    if (typeof time === 'string') {
      // If time is a string in HH:MM format
      const [hours, minutes] = time.split(':').map(Number);
      timeDate = new Date();
      timeDate.setHours(hours, minutes, 0, 0);
    } else {
      timeDate = time;
    }
    
    if (!isValid(timeDate)) return '';
    return format(timeDate, formatString);
  } catch (error) {
    console.error('Error formatting time:', error);
    return '';
  }
}

/**
 * Calculates the duration between two dates or times in minutes
 * @param start Start date/time
 * @param end End date/time
 * @returns Duration in minutes
 */
export function calculateDuration(start: Date | string, end: Date | string): number {
  try {
    const startDate = typeof start === 'string' ? parseISO(start) : start;
    const endDate = typeof end === 'string' ? parseISO(end) : end;
    
    return Math.abs(differenceInMinutes(endDate, startDate));
  } catch (error) {
    console.error('Error calculating duration:', error);
    return 0;
  }
}

/**
 * Checks if a date is within a specified date range
 * @param date Date to check
 * @param dateRange Object with start and end dates
 * @returns True if date is within range, false otherwise
 */
export function isDateInRange(date: Date, dateRange: { start: Date; end: Date }): boolean {
  return isWithinInterval(date, { 
    start: dateRange.start, 
    end: dateRange.end 
  });
}

/**
 * Returns a human-readable relative date label (Today, Tomorrow, Yesterday, or formatted date)
 * @param date Date to get label for
 * @returns Relative date label
 */
export function getRelativeDateLabel(date: Date): string {
  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);
  const yesterday = addDays(today, -1);
  
  if (isSameDay(date, today)) {
    return 'Today';
  } else if (isSameDay(date, tomorrow)) {
    return 'Tomorrow';
  } else if (isSameDay(date, yesterday)) {
    return 'Yesterday';
  } else {
    return formatDate(date, 'MMM d, yyyy');
  }
}

/**
 * Combines a date string and time string into a single Date object
 * @param dateString Date string in yyyy-MM-dd format
 * @param timeString Time string in HH:MM format
 * @returns Combined date and time as Date object
 */
export function getDateTimeFromStrings(dateString: string, timeString: string): Date {
  const date = parseDate(dateString) || new Date();
  const [hours, minutes] = timeString.split(':').map(Number);
  
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  
  return result;
}

/**
 * Creates a formatted time range label from start and end times
 * @param startTime Start time
 * @param endTime End time
 * @returns Formatted time range (e.g., '9:00 AM - 5:00 PM')
 */
export function getTimeRangeLabel(startTime: Date | string, endTime: Date | string): string {
  const formattedStart = formatTime(startTime);
  const formattedEnd = formatTime(endTime);
  
  return `${formattedStart} - ${formattedEnd}`;
}