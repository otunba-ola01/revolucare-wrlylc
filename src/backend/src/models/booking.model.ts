import { PrismaClient } from '@prisma/client'; // v5.0+

/**
 * Enum representing the possible statuses of a booking throughout its lifecycle.
 * Tracks the state of appointments from creation through to completion.
 */
export enum BookingStatus {
  SCHEDULED = 'SCHEDULED',       // Booking has been scheduled but not yet started
  IN_PROGRESS = 'IN_PROGRESS',   // Service is currently being delivered
  COMPLETED = 'COMPLETED',       // Service has been completed successfully
  CANCELLED = 'CANCELLED',       // Booking was cancelled before service delivery
  RESCHEDULED = 'RESCHEDULED',   // Booking was rescheduled to a different time
  NO_SHOW = 'NO_SHOW',           // Client did not show up for the appointment
  INTERRUPTED = 'INTERRUPTED'    // Service delivery was interrupted and not completed
}

/**
 * Interface representing a booking entity in the Revolucare platform.
 * Maps to the database schema for bookings and contains all appointment information.
 */
export interface Booking {
  id: string;                        // Unique identifier for the booking
  clientId: string;                  // Reference to the client who booked the service
  providerId: string;                // Reference to the provider who will deliver the service
  serviceItemId: string | null;      // Optional reference to a specific service item from a service plan
  startTime: Date;                   // Start time of the appointment
  endTime: Date;                     // End time of the appointment
  status: BookingStatus;             // Current status of the booking
  notes: string | null;              // Optional notes about the booking
  cancellationReason: string | null; // Reason for cancellation if status is CANCELLED
  cancelledBy: string | null;        // ID of the user who cancelled the booking
  location: Record<string, any> | null; // Location information for the appointment (flexible structure)
  rescheduledToId: string | null;    // ID of the new booking if this one was rescheduled
  createdAt: Date;                   // Timestamp when the booking was created
  updatedAt: Date;                   // Timestamp when the booking was last updated
}

/**
 * Data transfer object for creating a new booking.
 * Contains all required fields to create a valid booking record.
 */
export interface CreateBookingDTO {
  clientId: string;                 // ID of the client receiving service
  providerId: string;               // ID of the provider delivering service
  serviceItemId: string | null;     // Optional reference to a service item
  startTime: Date;                  // Appointment start time
  endTime: Date;                    // Appointment end time
  notes: string | null;             // Optional booking notes
  location: Record<string, any> | null; // Optional location information
}

/**
 * Data transfer object for updating an existing booking.
 * All fields are optional to allow partial updates.
 */
export interface UpdateBookingDTO {
  startTime?: Date;                 // New appointment start time
  endTime?: Date;                   // New appointment end time
  notes?: string | null;            // Updated notes
  location?: Record<string, any> | null; // Updated location information
}

/**
 * Parameters for filtering and paginating booking queries.
 * Used for finding bookings that match specific criteria.
 */
export interface BookingFilterParams {
  clientId?: string;                // Filter by client ID
  providerId?: string;              // Filter by provider ID
  serviceItemId?: string;           // Filter by service item ID
  status?: BookingStatus;           // Filter by booking status
  startDate?: Date;                 // Filter by start date range (inclusive)
  endDate?: Date;                   // Filter by end date range (inclusive)
  page: number;                     // Page number for pagination (1-based)
  limit: number;                    // Number of items per page
  sortBy: string;                   // Field to sort by (e.g., 'startTime')
  sortOrder: 'asc' | 'desc';        // Sort direction
}

/**
 * Response structure for a detailed booking view.
 * Includes related client and provider information for UI display.
 */
export interface BookingResponse {
  booking: Booking;                 // The complete booking details
  client: {                         // Minimal client information
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  provider: {                       // Minimal provider information
    id: string;
    firstName: string;
    lastName: string;
    organizationName: string;
  };
  serviceItem: {                    // Minimal service item information (if applicable)
    id: string;
    serviceType: string;
    description: string;
  } | null;
}

/**
 * Response structure for paginated booking lists.
 * Includes pagination metadata for UI rendering.
 */
export interface BookingListResponse {
  bookings: Booking[];              // Array of bookings on the current page
  total: number;                    // Total number of bookings matching the filter
  page: number;                     // Current page number
  limit: number;                    // Items per page
  totalPages: number;               // Total number of pages
}

/**
 * Information required for cancelling a booking.
 * Captures the reason and the person who initiated the cancellation.
 */
export interface CancellationInfo {
  reason: string;                   // Reason for cancellation
  cancelledBy: string;              // ID of the user who cancelled
}

/**
 * Information required for rescheduling a booking.
 * Links the original booking to its replacement.
 */
export interface RescheduleInfo {
  newBookingId: string;             // ID of the new booking created from reschedule
  reason: string | null;            // Optional reason for reschedule
}