/**
 * Date and time utility functions for the Revolucare backend
 * 
 * This file provides consistent date and time handling across the application,
 * supporting provider availability, care plan timelines, and scheduling features.
 */

import { format, parse, addDays, addWeeks, addMonths, subDays, subWeeks, subMonths, 
  isValid, isBefore, isAfter, isSameDay, differenceInDays, differenceInMinutes,
  startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  getDay, parseISO, setHours, setMinutes } from 'date-fns'; // v^2.30.0
import { DateRange, TimeSlot, DayOfWeek } from '../types/provider.types';

/**
 * Formats a date using the specified format string
 * 
 * @param date - The date to format
 * @param formatString - The format string to use (date-fns format)
 * @returns Formatted date string
 */
export const formatDate = (date: Date | string | number, formatString: string): string => {
  if (!isValid(new Date(date))) {
    return '';
  }
  return format(new Date(date), formatString);
};

/**
 * Parses a date string into a Date object using the specified format
 * 
 * @param dateString - The date string to parse
 * @param formatString - The format string to use (date-fns format)
 * @returns Parsed Date object or null if invalid
 */
export const parseDate = (dateString: string, formatString: string): Date | null => {
  try {
    const parsedDate = parse(dateString, formatString, new Date());
    return isValid(parsedDate) ? parsedDate : null;
  } catch (error) {
    return null;
  }
};

/**
 * Parses a time string (HH:MM) into hours and minutes
 * 
 * @param timeString - Time string in 24-hour format (HH:MM)
 * @returns Object containing hours and minutes, or null if invalid
 */
export const parseTimeString = (timeString: string): { hours: number; minutes: number } | null => {
  const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
  
  if (!timeRegex.test(timeString)) {
    return null;
  }
  
  const [hours, minutes] = timeString.split(':').map(Number);
  
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }
  
  return { hours, minutes };
};

/**
 * Creates a new Date object with the specified date and time
 * 
 * @param date - Base date
 * @param timeString - Time string in 24-hour format (HH:MM)
 * @returns New Date object with the specified time, or null if invalid
 */
export const createDateWithTime = (date: Date, timeString: string): Date | null => {
  const time = parseTimeString(timeString);
  
  if (!time) {
    return null;
  }
  
  const newDate = new Date(date);
  newDate.setHours(time.hours);
  newDate.setMinutes(time.minutes);
  newDate.setSeconds(0);
  newDate.setMilliseconds(0);
  
  return newDate;
};

/**
 * Formats a time range with start and end times
 * 
 * @param startTime - Start time
 * @param endTime - End time
 * @param formatString - Format string to use (date-fns format)
 * @returns Formatted time range string
 */
export const formatTimeRange = (startTime: Date, endTime: Date, formatString: string): string => {
  const formattedStart = format(startTime, formatString);
  const formattedEnd = format(endTime, formatString);
  
  return `${formattedStart} - ${formattedEnd}`;
};

/**
 * Gets the day of week enum value from a Date object
 * 
 * @param date - Date to get day of week from
 * @returns Day of week enum value
 */
export const getDayOfWeekFromDate = (date: Date): DayOfWeek => {
  const dayIndex = getDay(date);
  
  // JavaScript getDay returns 0 for Sunday, but our enum starts with Monday
  // Map the JavaScript day index to our DayOfWeek enum
  const dayMapping: Record<number, DayOfWeek> = {
    0: DayOfWeek.SUNDAY,
    1: DayOfWeek.MONDAY,
    2: DayOfWeek.TUESDAY,
    3: DayOfWeek.WEDNESDAY,
    4: DayOfWeek.THURSDAY,
    5: DayOfWeek.FRIDAY,
    6: DayOfWeek.SATURDAY
  };
  
  return dayMapping[dayIndex];
};

/**
 * Gets the next date that falls on the specified day of week
 * 
 * @param dayOfWeek - Target day of week
 * @param startDate - Starting date (defaults to today)
 * @returns Next date that falls on the specified day of week
 */
export const getDateFromDayOfWeek = (dayOfWeek: DayOfWeek, startDate: Date = new Date()): Date => {
  const currentDayIndex = getDay(startDate);
  
  // Get the target day index
  const dayMapping: Record<DayOfWeek, number> = {
    [DayOfWeek.SUNDAY]: 0,
    [DayOfWeek.MONDAY]: 1,
    [DayOfWeek.TUESDAY]: 2,
    [DayOfWeek.WEDNESDAY]: 3,
    [DayOfWeek.THURSDAY]: 4,
    [DayOfWeek.FRIDAY]: 5,
    [DayOfWeek.SATURDAY]: 6
  };
  
  const targetDayIndex = dayMapping[dayOfWeek];
  
  // Calculate days to add
  let daysToAdd = targetDayIndex - currentDayIndex;
  
  // If target day is before current day or the same day, add 7 days to get next occurrence
  if (daysToAdd <= 0) {
    daysToAdd += 7;
  }
  
  return addDays(startDate, daysToAdd);
};

/**
 * Generates an array of dates between start and end dates
 * 
 * @param dateRange - Object containing start and end dates
 * @returns Array of dates in the range
 */
export const generateDateRange = (dateRange: DateRange): Date[] => {
  const { startDate, endDate } = dateRange;
  const dates: Date[] = [];
  
  const daysDifference = differenceInDays(endDate, startDate);
  
  for (let i = 0; i <= daysDifference; i++) {
    dates.push(addDays(startDate, i));
  }
  
  return dates;
};

/**
 * Generates time slots for a given date range based on recurring schedule
 * 
 * @param dateRange - Date range to generate slots for
 * @param recurringSchedule - Recurring availability schedule
 * @param durationMinutes - Duration of each slot in minutes
 * @param bufferMinutes - Buffer time between slots in minutes
 * @returns Array of generated time slots
 */
export const generateTimeSlots = (
  dateRange: DateRange,
  recurringSchedule: Array<{ dayOfWeek: DayOfWeek; startTime: string; endTime: string; }>,
  durationMinutes: number,
  bufferMinutes: number
): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const dates = generateDateRange(dateRange);
  
  // For each date in the range
  dates.forEach(date => {
    const dayOfWeek = getDayOfWeekFromDate(date);
    
    // Find matching schedule entries for this day of week
    const scheduleEntries = recurringSchedule.filter(entry => entry.dayOfWeek === dayOfWeek);
    
    // For each matching entry, generate slots
    scheduleEntries.forEach(entry => {
      const startTime = createDateWithTime(date, entry.startTime);
      const endTime = createDateWithTime(date, entry.endTime);
      
      if (!startTime || !endTime) {
        return;
      }
      
      // Calculate slot interval (duration + buffer)
      const slotInterval = durationMinutes + bufferMinutes;
      
      // Create slots from start time to end time
      let currentStartTime = new Date(startTime);
      
      while (isBefore(currentStartTime, endTime)) {
        // Calculate the end time for this slot
        const currentEndTime = new Date(currentStartTime);
        currentEndTime.setMinutes(currentEndTime.getMinutes() + durationMinutes);
        
        // Only add the slot if it fits within the schedule end time
        if (isBefore(currentEndTime, endTime) || isSameDay(currentEndTime, endTime)) {
          slots.push({
            id: `slot-${currentStartTime.toISOString()}`, // Generate a unique ID
            providerId: '', // This will be set by the calling function
            startTime: currentStartTime,
            endTime: currentEndTime,
            serviceType: null!, // This will be set by the calling function
            isBooked: false,
            bookingId: null
          });
        }
        
        // Move to the next slot start time
        currentStartTime = new Date(currentStartTime);
        currentStartTime.setMinutes(currentStartTime.getMinutes() + slotInterval);
      }
    });
  });
  
  return slots;
};

/**
 * Checks if a time slot is available (not overlapping with existing bookings)
 * 
 * @param startTime - Start time of the slot to check
 * @param endTime - End time of the slot to check
 * @param existingTimeSlots - Array of existing time slots to check against
 * @returns True if the time slot is available, false otherwise
 */
export const isTimeSlotAvailable = (
  startTime: Date,
  endTime: Date,
  existingTimeSlots: TimeSlot[]
): boolean => {
  // Check if the proposed time slot overlaps with any existing booked slots
  for (const slot of existingTimeSlots) {
    if (slot.isBooked && isOverlapping(startTime, endTime, slot.startTime, slot.endTime)) {
      return false;
    }
  }
  
  return true;
};

/**
 * Checks if two time ranges overlap
 * 
 * @param start1 - Start of first range
 * @param end1 - End of first range
 * @param start2 - Start of second range
 * @param end2 - End of second range
 * @returns True if the time ranges overlap, false otherwise
 */
export const isOverlapping = (
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean => {
  return isBefore(start1, end2) && isBefore(start2, end1);
};

/**
 * Calculates the duration between two dates in minutes
 * 
 * @param startTime - Start time
 * @param endTime - End time
 * @returns Duration in minutes
 */
export const calculateDuration = (startTime: Date, endTime: Date): number => {
  return Math.abs(differenceInMinutes(endTime, startTime));
};

/**
 * Gets the start and end dates for a specified period (day, week, month, quarter, year)
 * 
 * @param period - Period type (day, week, month, quarter, year)
 * @param referenceDate - Reference date
 * @returns Object containing start and end dates for the period
 */
export const getDateRangeForPeriod = (period: string, referenceDate: Date = new Date()): DateRange => {
  switch (period.toLowerCase()) {
    case 'day':
      return {
        startDate: startOfDay(referenceDate),
        endDate: endOfDay(referenceDate)
      };
    case 'week':
      return {
        startDate: startOfWeek(referenceDate, { weekStartsOn: 1 }), // Week starts on Monday
        endDate: endOfWeek(referenceDate, { weekStartsOn: 1 })
      };
    case 'month':
      return {
        startDate: startOfMonth(referenceDate),
        endDate: endOfMonth(referenceDate)
      };
    case 'quarter': {
      const currentMonth = referenceDate.getMonth();
      const quarterStartMonth = Math.floor(currentMonth / 3) * 3;
      
      const quarterStart = new Date(referenceDate);
      quarterStart.setMonth(quarterStartMonth);
      quarterStart.setDate(1);
      
      const quarterEnd = new Date(quarterStart);
      quarterEnd.setMonth(quarterStartMonth + 3);
      quarterEnd.setDate(0);
      
      return {
        startDate: startOfDay(quarterStart),
        endDate: endOfDay(quarterEnd)
      };
    }
    case 'year': {
      const yearStart = new Date(referenceDate.getFullYear(), 0, 1);
      const yearEnd = new Date(referenceDate.getFullYear(), 11, 31);
      
      return {
        startDate: startOfDay(yearStart),
        endDate: endOfDay(yearEnd)
      };
    }
    default:
      // If period is not recognized, return the reference date as both start and end
      return {
        startDate: referenceDate,
        endDate: referenceDate
      };
  }
};

/**
 * Checks if a date is a business day (not a weekend)
 * 
 * @param date - Date to check
 * @returns True if the date is a business day, false otherwise
 */
export const isBusinessDay = (date: Date): boolean => {
  const day = getDay(date);
  // 0 is Sunday, 6 is Saturday
  return day !== 0 && day !== 6;
};

/**
 * Adds a specified number of business days to a date
 * 
 * @param date - Starting date
 * @param days - Number of business days to add
 * @returns New date after adding business days
 */
export const addBusinessDays = (date: Date, days: number): Date => {
  let businessDaysAdded = 0;
  let currentDate = new Date(date);
  
  while (businessDaysAdded < days) {
    currentDate = addDays(currentDate, 1);
    if (isBusinessDay(currentDate)) {
      businessDaysAdded++;
    }
  }
  
  return currentDate;
};

/**
 * Calculates age in years from a birth date
 * 
 * @param birthDate - Birth date
 * @returns Age in years
 */
export const getAgeFromDate = (birthDate: Date): number => {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();
  
  // Adjust age if birthday hasn't occurred yet this year
  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Gets the week number (1-53) for a given date
 * 
 * @param date - Date to get week number for
 * @returns Week number (1-53)
 */
export const getWeekNumber = (date: Date): number => {
  // Create a copy of the date
  const d = new Date(date);
  
  // Set to the first day of the year
  d.setMonth(0, 1);
  
  // Get the day of the week (0-6)
  const firstDayOfYear = d.getDay();
  
  // Calculate the offset for the first week
  const firstWeekOffset = firstDayOfYear <= 4 ? firstDayOfYear : 7 - firstDayOfYear;
  
  // Calculate days between the date and the first day of the year
  const daysSinceFirstDay = differenceInDays(date, d);
  
  // Calculate week number
  const weekNumber = Math.ceil((daysSinceFirstDay + firstWeekOffset) / 7);
  
  return weekNumber;
};

/**
 * Gets the quarter (1-4) for a given date
 * 
 * @param date - Date to get quarter for
 * @returns Quarter number (1-4)
 */
export const getQuarterFromDate = (date: Date): number => {
  const month = date.getMonth();
  return Math.floor(month / 3) + 1;
};