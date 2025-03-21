import { v4 as uuidv4 } from 'uuid'; // v9.0.0
import { 
  Availability, 
  TimeSlot, 
  RecurringSchedule, 
  AvailabilityException,
  DayOfWeek,
  DateRange,
} from '../types/provider.types';
import { ServiceType, DefaultServiceDurations } from '../constants/service-types';

/**
 * Generates time slots based on recurring schedule patterns for a date range
 * 
 * @param recurringSchedule - Array of recurring schedule patterns
 * @param dateRange - Date range to generate slots for
 * @param providerId - ID of the provider
 * @returns Array of generated time slots based on the recurring schedule
 */
export function generateTimeSlots(
  recurringSchedule: RecurringSchedule[],
  dateRange: DateRange,
  providerId: string
): TimeSlot[] {
  const result: TimeSlot[] = [];
  
  // Calculate the number of days in the date range
  const startDate = new Date(dateRange.startDate);
  const endDate = new Date(dateRange.endDate);
  
  // Generate slots for each day in the date range
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    // Get day of week for current date
    const dayOfWeek = getDayOfWeekFromDate(currentDate);
    
    // Find recurring schedules that match this day of week
    const matchingSchedules = recurringSchedule.filter(
      schedule => schedule.dayOfWeek === dayOfWeek
    );
    
    // Generate slots for each matching schedule
    for (const schedule of matchingSchedules) {
      const startTime = parseTimeString(schedule.startTime);
      const endTime = parseTimeString(schedule.endTime);
      
      // Create slots for each service type in this schedule
      for (const serviceType of schedule.serviceTypes) {
        // Get default duration for this service type
        const durationMinutes = DefaultServiceDurations[serviceType];
        
        // Calculate how many slots can fit in this schedule
        let slotStartTime = new Date(currentDate);
        slotStartTime.setHours(startTime.hours, startTime.minutes, 0, 0);
        
        let slotEndTime = new Date(currentDate);
        slotEndTime.setHours(startTime.hours, startTime.minutes + durationMinutes, 0, 0);
        
        const scheduleEndTime = new Date(currentDate);
        scheduleEndTime.setHours(endTime.hours, endTime.minutes, 0, 0);
        
        // Create slots while they fit within the schedule end time
        while (slotEndTime <= scheduleEndTime) {
          const timeSlot: TimeSlot = {
            id: uuidv4(),
            providerId,
            startTime: new Date(slotStartTime),
            endTime: new Date(slotEndTime),
            serviceType,
            isBooked: false,
            bookingId: null
          };
          
          result.push(timeSlot);
          
          // Move to next slot
          slotStartTime = new Date(slotEndTime);
          slotEndTime = new Date(slotStartTime);
          slotEndTime.setMinutes(slotStartTime.getMinutes() + durationMinutes);
        }
      }
    }
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return result;
}

/**
 * Maps JavaScript Date's day of week to the DayOfWeek enum
 * 
 * @param date - Date to get day of week from
 * @returns DayOfWeek enum value corresponding to the date
 */
function getDayOfWeekFromDate(date: Date): DayOfWeek {
  const dayMap: Record<number, DayOfWeek> = {
    0: DayOfWeek.SUNDAY,
    1: DayOfWeek.MONDAY,
    2: DayOfWeek.TUESDAY,
    3: DayOfWeek.WEDNESDAY,
    4: DayOfWeek.THURSDAY,
    5: DayOfWeek.FRIDAY,
    6: DayOfWeek.SATURDAY,
  };
  return dayMap[date.getDay()];
}

/**
 * Applies availability exceptions to a set of time slots
 * 
 * @param timeSlots - Array of time slots to apply exceptions to
 * @param exceptions - Array of availability exceptions
 * @returns Modified time slots with exceptions applied
 */
export function applyExceptions(
  timeSlots: TimeSlot[],
  exceptions: AvailabilityException[]
): TimeSlot[] {
  // Create a copy of the time slots array
  let result = [...timeSlots];
  
  // Apply each exception
  for (const exception of exceptions) {
    const exceptionDate = new Date(exception.date);
    exceptionDate.setHours(0, 0, 0, 0);
    
    // If the provider is not available on this date, remove all time slots for this date
    if (!exception.isAvailable) {
      result = result.filter(slot => {
        const slotDate = new Date(slot.startTime);
        slotDate.setHours(0, 0, 0, 0);
        return slotDate.getTime() !== exceptionDate.getTime();
      });
    }
    
    // If there are alternative slots defined, add them to the result
    if (exception.alternativeSlots && exception.alternativeSlots.length > 0) {
      result = [...result, ...exception.alternativeSlots];
    }
  }
  
  return result;
}

/**
 * Checks if a time slot conflicts with existing time slots
 * 
 * @param newSlot - The new time slot to check
 * @param existingSlots - Array of existing time slots to check against
 * @returns True if there is a conflict, false otherwise
 */
export function isTimeSlotConflict(newSlot: TimeSlot, existingSlots: TimeSlot[]): boolean {
  return existingSlots.some(existingSlot => {
    // Check for overlap: newSlot starts before existingSlot ends AND newSlot ends after existingSlot starts
    return (
      newSlot.startTime < existingSlot.endTime &&
      newSlot.endTime > existingSlot.startTime
    );
  });
}

/**
 * Parses a time string (HH:MM) into hours and minutes
 * 
 * @param timeString - Time string in format "HH:MM"
 * @returns Object containing hours and minutes
 */
export function parseTimeString(timeString: string): { hours: number; minutes: number } {
  const [hoursStr, minutesStr] = timeString.split(':');
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);
  
  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error(`Invalid time format: ${timeString}. Expected format: "HH:MM"`);
  }
  
  return { hours, minutes };
}

/**
 * Model representing a time slot in provider availability
 */
export class TimeSlotModel implements TimeSlot {
  id: string;
  providerId: string;
  startTime: Date;
  endTime: Date;
  serviceType: ServiceType;
  isBooked: boolean;
  bookingId: string | null;
  
  /**
   * Creates a new time slot model instance
   * 
   * @param data - Partial time slot data to initialize with
   */
  constructor(data: Partial<TimeSlot> = {}) {
    this.id = data.id || uuidv4();
    this.providerId = data.providerId || '';
    this.startTime = data.startTime ? new Date(data.startTime) : new Date();
    this.endTime = data.endTime ? new Date(data.endTime) : new Date();
    this.serviceType = data.serviceType || ServiceType.INITIAL_ASSESSMENT;
    this.isBooked = data.isBooked || false;
    this.bookingId = data.bookingId || null;
  }
  
  /**
   * Validates the time slot data
   * 
   * @returns True if the time slot is valid, false otherwise
   */
  validate(): boolean {
    if (!this.providerId) {
      return false;
    }
    
    if (!(this.startTime instanceof Date) || !(this.endTime instanceof Date)) {
      return false;
    }
    
    if (this.startTime >= this.endTime) {
      return false;
    }
    
    if (!Object.values(ServiceType).includes(this.serviceType)) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Gets the duration of the time slot in minutes
   * 
   * @returns Duration in minutes
   */
  getDuration(): number {
    return (this.endTime.getTime() - this.startTime.getTime()) / (1000 * 60);
  }
  
  /**
   * Checks if this time slot overlaps with another time slot
   * 
   * @param otherSlot - Time slot to check for overlap
   * @returns True if the slots overlap, false otherwise
   */
  overlaps(otherSlot: TimeSlot): boolean {
    return (
      this.startTime < otherSlot.endTime &&
      this.endTime > otherSlot.startTime
    );
  }
  
  /**
   * Marks the time slot as booked
   * 
   * @param bookingId - ID of the booking
   * @returns True if the booking was successful, false if already booked
   */
  book(bookingId: string): boolean {
    if (this.isBooked) {
      return false;
    }
    
    this.isBooked = true;
    this.bookingId = bookingId;
    return true;
  }
  
  /**
   * Marks the time slot as not booked
   * 
   * @returns True if the unbooking was successful, false if not booked
   */
  unbook(): boolean {
    if (!this.isBooked) {
      return false;
    }
    
    this.isBooked = false;
    this.bookingId = null;
    return true;
  }
  
  /**
   * Converts the time slot model to a plain JSON object
   * 
   * @returns Plain JavaScript object representation of the time slot
   */
  toJSON(): TimeSlot {
    return {
      id: this.id,
      providerId: this.providerId,
      startTime: this.startTime,
      endTime: this.endTime,
      serviceType: this.serviceType,
      isBooked: this.isBooked,
      bookingId: this.bookingId
    };
  }
}

/**
 * Model class representing provider availability in the system
 */
export class ProviderAvailabilityModel implements Availability {
  providerId: string;
  slots: TimeSlot[];
  recurringSchedule: RecurringSchedule[];
  exceptions: AvailabilityException[];
  lastUpdated: Date;
  
  /**
   * Creates a new provider availability model instance
   * 
   * @param data - Partial availability data to initialize with
   */
  constructor(data: Partial<Availability> = {}) {
    this.providerId = data.providerId || '';
    this.slots = data.slots || [];
    this.recurringSchedule = data.recurringSchedule || [];
    this.exceptions = data.exceptions || [];
    this.lastUpdated = data.lastUpdated ? new Date(data.lastUpdated) : new Date();
    
    // Convert string dates to Date objects if needed
    this.slots = this.slots.map(slot => ({
      ...slot,
      startTime: slot.startTime instanceof Date ? slot.startTime : new Date(slot.startTime),
      endTime: slot.endTime instanceof Date ? slot.endTime : new Date(slot.endTime)
    }));
    
    this.exceptions = this.exceptions.map(exception => ({
      ...exception,
      date: exception.date instanceof Date ? exception.date : new Date(exception.date),
      alternativeSlots: exception.alternativeSlots ? exception.alternativeSlots.map(slot => ({
        ...slot,
        startTime: slot.startTime instanceof Date ? slot.startTime : new Date(slot.startTime),
        endTime: slot.endTime instanceof Date ? slot.endTime : new Date(slot.endTime)
      })) : null
    }));
  }
  
  /**
   * Validates the provider availability data
   * 
   * @returns True if the availability is valid, false otherwise
   */
  validate(): boolean {
    if (!this.providerId) {
      return false;
    }
    
    // Validate time slots
    for (const slot of this.slots) {
      const timeSlotModel = new TimeSlotModel(slot);
      if (!timeSlotModel.validate()) {
        return false;
      }
    }
    
    // Validate recurring schedules
    for (const schedule of this.recurringSchedule) {
      if (!schedule.providerId || schedule.providerId !== this.providerId) {
        return false;
      }
      
      if (!Object.values(DayOfWeek).includes(schedule.dayOfWeek)) {
        return false;
      }
      
      try {
        const startTime = parseTimeString(schedule.startTime);
        const endTime = parseTimeString(schedule.endTime);
        
        if (startTime.hours > endTime.hours || 
            (startTime.hours === endTime.hours && startTime.minutes >= endTime.minutes)) {
          return false;
        }
      } catch (error) {
        return false;
      }
      
      if (!schedule.serviceTypes || schedule.serviceTypes.length === 0) {
        return false;
      }
      
      for (const serviceType of schedule.serviceTypes) {
        if (!Object.values(ServiceType).includes(serviceType)) {
          return false;
        }
      }
    }
    
    // Validate exceptions
    for (const exception of this.exceptions) {
      if (!exception.providerId || exception.providerId !== this.providerId) {
        return false;
      }
      
      if (!(exception.date instanceof Date)) {
        return false;
      }
      
      if (exception.isAvailable === true && exception.alternativeSlots) {
        for (const slot of exception.alternativeSlots) {
          const timeSlotModel = new TimeSlotModel(slot);
          if (!timeSlotModel.validate()) {
            return false;
          }
        }
      }
    }
    
    return true;
  }
  
  /**
   * Converts the availability model to a plain JSON object
   * 
   * @returns Plain JavaScript object representation of the availability
   */
  toJSON(): Availability {
    return {
      providerId: this.providerId,
      slots: this.slots,
      recurringSchedule: this.recurringSchedule,
      exceptions: this.exceptions,
      lastUpdated: this.lastUpdated
    };
  }
  
  /**
   * Creates an availability model from a plain JSON object
   * 
   * @param json - Plain JSON object
   * @returns A new availability model instance
   */
  static fromJSON(json: any): ProviderAvailabilityModel {
    // Convert date strings to Date objects
    const data = { ...json };
    
    if (typeof data.lastUpdated === 'string') {
      data.lastUpdated = new Date(data.lastUpdated);
    }
    
    if (data.slots && Array.isArray(data.slots)) {
      data.slots = data.slots.map((slot: any) => ({
        ...slot,
        startTime: typeof slot.startTime === 'string' ? new Date(slot.startTime) : slot.startTime,
        endTime: typeof slot.endTime === 'string' ? new Date(slot.endTime) : slot.endTime
      }));
    }
    
    if (data.exceptions && Array.isArray(data.exceptions)) {
      data.exceptions = data.exceptions.map((exception: any) => ({
        ...exception,
        date: typeof exception.date === 'string' ? new Date(exception.date) : exception.date,
        alternativeSlots: exception.alternativeSlots ? exception.alternativeSlots.map((slot: any) => ({
          ...slot,
          startTime: typeof slot.startTime === 'string' ? new Date(slot.startTime) : slot.startTime,
          endTime: typeof slot.endTime === 'string' ? new Date(slot.endTime) : slot.endTime
        })) : null
      }));
    }
    
    return new ProviderAvailabilityModel(data);
  }
  
  /**
   * Adds a new time slot to the availability
   * 
   * @param timeSlot - Time slot to add
   * @returns True if the slot was added, false if there was a conflict
   */
  addTimeSlot(timeSlot: TimeSlot): boolean {
    // Check for conflicts with existing time slots
    if (isTimeSlotConflict(timeSlot, this.slots)) {
      return false;
    }
    
    // Add the time slot
    this.slots.push({
      ...timeSlot,
      providerId: this.providerId
    });
    
    // Update lastUpdated timestamp
    this.lastUpdated = new Date();
    
    return true;
  }
  
  /**
   * Removes a time slot from the availability
   * 
   * @param timeSlotId - ID of the time slot to remove
   * @returns True if the slot was removed, false if not found
   */
  removeTimeSlot(timeSlotId: string): boolean {
    const initialLength = this.slots.length;
    this.slots = this.slots.filter(slot => slot.id !== timeSlotId);
    
    if (this.slots.length < initialLength) {
      // Update lastUpdated timestamp
      this.lastUpdated = new Date();
      return true;
    }
    
    return false;
  }
  
  /**
   * Adds a recurring schedule entry to the availability
   * 
   * @param schedule - Recurring schedule to add
   * @returns True if the schedule was added successfully
   */
  addRecurringSchedule(schedule: RecurringSchedule): boolean {
    // Validate the schedule
    if (!schedule.id) {
      schedule.id = uuidv4();
    }
    
    schedule.providerId = this.providerId;
    
    // Add the schedule
    this.recurringSchedule.push(schedule);
    
    // Update lastUpdated timestamp
    this.lastUpdated = new Date();
    
    return true;
  }
  
  /**
   * Removes a recurring schedule entry from the availability
   * 
   * @param scheduleId - ID of the schedule to remove
   * @returns True if the schedule was removed, false if not found
   */
  removeRecurringSchedule(scheduleId: string): boolean {
    const initialLength = this.recurringSchedule.length;
    this.recurringSchedule = this.recurringSchedule.filter(schedule => schedule.id !== scheduleId);
    
    if (this.recurringSchedule.length < initialLength) {
      // Update lastUpdated timestamp
      this.lastUpdated = new Date();
      return true;
    }
    
    return false;
  }
  
  /**
   * Adds an availability exception to the availability
   * 
   * @param exception - Exception to add
   * @returns True if the exception was added successfully
   */
  addException(exception: AvailabilityException): boolean {
    // Validate the exception
    if (!exception.id) {
      exception.id = uuidv4();
    }
    
    exception.providerId = this.providerId;
    
    // Add the exception
    this.exceptions.push(exception);
    
    // Update lastUpdated timestamp
    this.lastUpdated = new Date();
    
    return true;
  }
  
  /**
   * Removes an availability exception from the availability
   * 
   * @param exceptionId - ID of the exception to remove
   * @returns True if the exception was removed, false if not found
   */
  removeException(exceptionId: string): boolean {
    const initialLength = this.exceptions.length;
    this.exceptions = this.exceptions.filter(exception => exception.id !== exceptionId);
    
    if (this.exceptions.length < initialLength) {
      // Update lastUpdated timestamp
      this.lastUpdated = new Date();
      return true;
    }
    
    return false;
  }
  
  /**
   * Gets available time slots for a date range
   * 
   * @param dateRange - Date range to get available slots for
   * @param serviceType - Optional service type to filter by
   * @returns Array of available time slots
   */
  getAvailableTimeSlots(dateRange: DateRange, serviceType?: ServiceType): TimeSlot[] {
    // Generate time slots from recurring schedule
    const generatedSlots = generateTimeSlots(
      this.recurringSchedule,
      dateRange,
      this.providerId
    );
    
    // Apply exceptions to the generated slots
    let availableSlots = applyExceptions(generatedSlots, this.exceptions);
    
    // Add existing slots that are not booked and within the date range
    const existingAvailableSlots = this.slots.filter(slot => {
      const isWithinRange = slot.startTime >= dateRange.startDate && slot.endTime <= dateRange.endDate;
      const isAvailable = !slot.isBooked;
      return isWithinRange && isAvailable;
    });
    
    availableSlots = [...availableSlots, ...existingAvailableSlots];
    
    // Filter by service type if specified
    if (serviceType) {
      availableSlots = availableSlots.filter(slot => slot.serviceType === serviceType);
    }
    
    // Sort by start time
    availableSlots.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    
    return availableSlots;
  }
  
  /**
   * Checks if the provider is available for a specific time slot
   * 
   * @param startTime - Start time of the slot
   * @param endTime - End time of the slot
   * @param serviceType - Service type
   * @returns True if the provider is available, false otherwise
   */
  isAvailable(startTime: Date, endTime: Date, serviceType: ServiceType): boolean {
    // Create a test slot
    const testSlot: TimeSlot = {
      id: 'test',
      providerId: this.providerId,
      startTime,
      endTime,
      serviceType,
      isBooked: false,
      bookingId: null
    };
    
    // Check for conflicts with existing booked slots
    const bookedSlots = this.slots.filter(slot => slot.isBooked);
    if (isTimeSlotConflict(testSlot, bookedSlots)) {
      return false;
    }
    
    // Check for exceptions
    const exceptionDate = new Date(startTime);
    exceptionDate.setHours(0, 0, 0, 0);
    
    const relevantException = this.exceptions.find(exception => {
      const exDate = new Date(exception.date);
      exDate.setHours(0, 0, 0, 0);
      return exDate.getTime() === exceptionDate.getTime();
    });
    
    if (relevantException) {
      if (!relevantException.isAvailable) {
        return false;
      }
      
      // If there are alternative slots, check if the requested time is within one of them
      if (relevantException.alternativeSlots && relevantException.alternativeSlots.length > 0) {
        return relevantException.alternativeSlots.some(slot => {
          return (
            slot.serviceType === serviceType &&
            slot.startTime <= startTime &&
            slot.endTime >= endTime &&
            !slot.isBooked
          );
        });
      }
    }
    
    // Check if there's a recurring schedule that covers this time slot
    const dayOfWeek = getDayOfWeekFromDate(startTime);
    const startHour = startTime.getHours();
    const startMinute = startTime.getMinutes();
    const endHour = endTime.getHours();
    const endMinute = endTime.getMinutes();
    
    return this.recurringSchedule.some(schedule => {
      if (schedule.dayOfWeek !== dayOfWeek) {
        return false;
      }
      
      if (!schedule.serviceTypes.includes(serviceType)) {
        return false;
      }
      
      try {
        const schStart = parseTimeString(schedule.startTime);
        const schEnd = parseTimeString(schedule.endTime);
        
        // Check if the requested time slot is within the schedule time range
        if (
          (startHour > schStart.hours || (startHour === schStart.hours && startMinute >= schStart.minutes)) &&
          (endHour < schEnd.hours || (endHour === schEnd.hours && endMinute <= schEnd.minutes))
        ) {
          return true;
        }
      } catch (error) {
        return false;
      }
      
      return false;
    });
  }
}