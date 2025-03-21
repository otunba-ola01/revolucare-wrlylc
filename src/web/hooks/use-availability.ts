import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query'; // @tanstack/react-query: ^4.29.5
import { useToast } from '@chakra-ui/react'; // @chakra-ui/react: ^2.6.1
import { 
  getAvailability, 
  updateAvailability, 
  checkAvailability, 
  syncCalendar 
} from '../lib/api/providers';
import { 
  ProviderAvailability, 
  ProviderAvailabilityUpdateDTO, 
  TimeSlot, 
  DateRange,
  CalendarSyncRequest,
  CalendarSyncResponse
} from '../../types/provider';
import { useAuth } from './use-auth';

/**
 * Custom hook that provides provider availability data for a specific date range
 * 
 * @param providerId The ID of the provider to fetch availability for
 * @param dateRange Optional date range to filter availability
 * @param options Optional React Query options
 * @returns Provider availability data, loading state, and error state
 */
export function useAvailability(
  providerId: string,
  dateRange?: DateRange,
  options?: UseQueryOptions<ProviderAvailability>
) {
  return useQuery<ProviderAvailability>(
    ['availability', providerId, dateRange],
    () => getAvailability(providerId, {
      startDate: dateRange?.startDate,
      endDate: dateRange?.endDate
    }),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      ...options,
    }
  );
}

/**
 * Custom hook that provides functionality to update provider availability
 * 
 * @returns Mutation function, loading state, and error state
 */
export function useUpdateAvailability() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const toast = useToast();

  return useMutation<
    ProviderAvailability,
    Error,
    { providerId: string; data: ProviderAvailabilityUpdateDTO }
  >(
    ({ providerId, data }) => updateAvailability(providerId, data),
    {
      onSuccess: (data, variables) => {
        // Invalidate and refetch availability queries
        queryClient.invalidateQueries(['availability', variables.providerId]);
        
        toast({
          title: 'Availability updated',
          description: 'Your availability has been updated successfully.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      },
      onError: (error) => {
        toast({
          title: 'Failed to update availability',
          description: error.message || 'An error occurred while updating your availability.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      },
    }
  );
}

/**
 * Custom hook that provides functionality to check if a specific time slot is available
 * 
 * @param providerId The ID of the provider to check availability for
 * @returns Mutation function, loading state, and error state
 */
export function useCheckTimeSlotAvailability(providerId: string) {
  return useMutation<
    { available: boolean; conflictingBookings?: TimeSlot[] },
    Error,
    { startTime: Date | string; endTime: Date | string; serviceType: string }
  >(
    (params) => checkAvailability(providerId, params)
  );
}

/**
 * Custom hook that provides functionality to synchronize provider calendar with external services
 * 
 * @returns Mutation function, loading state, and error state
 */
export function useSyncCalendar() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation<
    CalendarSyncResponse,
    Error,
    { providerId: string; data: CalendarSyncRequest }
  >(
    ({ providerId, data }) => syncCalendar(providerId, data),
    {
      onSuccess: (data, variables) => {
        // Invalidate and refetch availability queries
        queryClient.invalidateQueries(['availability', variables.providerId]);
        
        toast({
          title: 'Calendar synchronized',
          description: `${data.syncedEvents} events synced successfully${data.conflictingEvents > 0 ? `, ${data.conflictingEvents} conflicts detected` : ''}.`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      },
      onError: (error) => {
        toast({
          title: 'Failed to sync calendar',
          description: error.message || 'An error occurred while synchronizing your calendar.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      },
    }
  );
}

/**
 * Custom hook that provides filtered time slots based on date and service type
 * 
 * @param availability Provider availability data
 * @param filters Filters to apply (date and service type)
 * @returns Filtered time slots matching the criteria
 */
export function useAvailableTimeSlots(
  availability: ProviderAvailability | undefined,
  filters: { date?: Date, serviceType?: string }
): TimeSlot[] {
  if (!availability) {
    return [];
  }

  // Get all slots
  let slots = [...availability.slots];

  // Filter by date if provided
  if (filters.date) {
    const filterDate = new Date(filters.date);
    const filterDateString = filterDate.toISOString().split('T')[0]; // Get YYYY-MM-DD
    
    slots = slots.filter(slot => {
      const slotDate = new Date(slot.startTime).toISOString().split('T')[0];
      return slotDate === filterDateString;
    });
  }

  // Filter by service type if provided
  if (filters.serviceType) {
    slots = slots.filter(slot => slot.serviceType === filters.serviceType);
  }

  // Filter out already booked slots
  slots = slots.filter(slot => !slot.isBooked);

  // Sort time slots by start time
  slots.sort((a, b) => 
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  return slots;
}

export {
  useAvailability,
  useUpdateAvailability,
  useCheckTimeSlotAvailability,
  useSyncCalendar,
  useAvailableTimeSlots
};