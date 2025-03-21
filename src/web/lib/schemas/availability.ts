import { z } from 'zod';
import { DayOfWeek, ServiceType } from '../../types/provider';

// Constants for validation
export const MIN_SLOT_DURATION = 15; // Minimum duration for a time slot in minutes
export const MAX_SLOT_DURATION = 480; // Maximum duration for a time slot in minutes (8 hours)
export const MIN_WORKING_HOURS = 1; // Minimum working hours per day
export const MAX_WORKING_HOURS = 24; // Maximum working hours per day

/**
 * Schema for individual time slots in provider availability
 * Validates start/end times, service type, and booking status
 */
export const timeSlotSchema = z.object({
  id: z.string().optional(),
  providerId: z.string().optional(),
  startTime: z.string().or(z.instanceof(Date)).required('Start time is required'),
  endTime: z.string().or(z.instanceof(Date)).required('End time is required'),
  serviceType: z.enum(Object.values(ServiceType) as [string, ...string[]], 'Please select a valid service type').required('Service type is required'),
  isBooked: z.boolean().optional().default(false),
  bookingId: z.string().nullable().optional(),
}).refine(data => new Date(data.endTime) > new Date(data.startTime), {
  message: 'End time must be after start time',
  path: ['endTime']
});

/**
 * Schema for recurring availability schedules
 * Defines patterns for provider recurring weekly availability
 */
export const recurringScheduleSchema = z.object({
  id: z.string().optional(),
  providerId: z.string().optional(),
  dayOfWeek: z.enum(Object.values(DayOfWeek) as [string, ...string[]], 'Please select a valid day of week').required('Day of week is required'),
  startTime: z.string().required('Start time is required'),
  endTime: z.string().required('End time is required'),
  serviceTypes: z.array(z.enum(Object.values(ServiceType) as [string, ...string[]])).min(1, 'At least one service type is required'),
}).refine(data => data.endTime > data.startTime, {
  message: 'End time must be after start time',
  path: ['endTime']
});

/**
 * Schema for availability exceptions like time off or holidays
 * Allows providers to mark specific dates as unavailable or with modified availability
 */
export const availabilityExceptionSchema = z.object({
  id: z.string().optional(),
  providerId: z.string().optional(),
  date: z.string().or(z.instanceof(Date)).required('Date is required'),
  isAvailable: z.boolean().default(false),
  reason: z.string().nullable().optional(),
  alternativeSlots: z.array(timeSlotSchema).nullable().optional(),
});

/**
 * Schema for provider working hours form
 * Defines regular working schedule for each day of the week
 */
export const workingHoursSchema = z.object({
  monday: z.object({
    enabled: z.boolean().default(true),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
  }),
  tuesday: z.object({
    enabled: z.boolean().default(true),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
  }),
  wednesday: z.object({
    enabled: z.boolean().default(true),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
  }),
  thursday: z.object({
    enabled: z.boolean().default(true),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
  }),
  friday: z.object({
    enabled: z.boolean().default(true),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
  }),
  saturday: z.object({
    enabled: z.boolean().default(false),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
  }),
  sunday: z.object({
    enabled: z.boolean().default(false),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
  }),
  defaultServiceTypes: z.array(z.enum(Object.values(ServiceType) as [string, ...string[]])).min(1, 'At least one service type is required'),
  breakTime: z.object({
    enabled: z.boolean().default(true),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
  }),
}).refine(
  data => {
    // For each day that is enabled, ensure that start and end times are provided and valid
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    return days.every(day => {
      const dayData = data[day as keyof typeof data];
      // If day is not enabled, we don't need to validate times
      if (!dayData.enabled) return true;
      // If day is enabled, we need valid start and end times
      return !!dayData.startTime && !!dayData.endTime && dayData.endTime > dayData.startTime;
    });
  },
  {
    message: 'Working hours must be valid for enabled days',
  }
);

/**
 * Schema for provider time off request form
 * Allows providers to schedule planned absences
 */
export const timeOffSchema = z.object({
  startDate: z.string().or(z.instanceof(Date)).required('Start date is required'),
  endDate: z.string().or(z.instanceof(Date)).required('End date is required'),
  allDay: z.boolean().default(true),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  reason: z.string().min(2, 'Reason must be at least 2 characters').max(200, 'Reason cannot exceed 200 characters').optional(),
}).refine(data => new Date(data.endDate) >= new Date(data.startDate), {
  message: 'End date must be on or after start date',
  path: ['endDate']
}).refine(data => data.allDay || (data.startTime && data.endTime && data.endTime > data.startTime), {
  message: 'Time range required when not all day',
  path: ['startTime']
});

/**
 * Schema for updating provider availability
 * Combines slots, recurring schedules, and exceptions for comprehensive availability management
 */
export const availabilityUpdateSchema = z.object({
  slots: z.array(timeSlotSchema.partial()).optional(),
  recurringSchedule: z.array(recurringScheduleSchema.partial()).optional(),
  exceptions: z.array(availabilityExceptionSchema.partial()).optional(),
});

/**
 * Schema for calendar synchronization options
 * Enables integration with external calendar services
 */
export const calendarSyncSchema = z.object({
  calendarType: z.enum(['google', 'microsoft', 'apple'], 'Please select a valid calendar type').required('Calendar type is required'),
  syncDirection: z.enum(['import', 'export', 'both'], 'Please select a valid sync direction').default('both'),
  dateRange: z.object({
    startDate: z.string().or(z.instanceof(Date)).required('Start date is required'),
    endDate: z.string().or(z.instanceof(Date)).required('End date is required'),
  }),
}).refine(data => new Date(data.dateRange.endDate) > new Date(data.dateRange.startDate), {
  message: 'End date must be after start date',
  path: ['dateRange']
});