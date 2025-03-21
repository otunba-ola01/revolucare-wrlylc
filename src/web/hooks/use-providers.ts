import { useState, useEffect, useCallback, useMemo } from 'react'; // react ^18.2.0
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; // @tanstack/react-query ^5.0.0
import { useRouter } from 'next/navigation'; // next/navigation ^13.4.1
import {
  Provider,
  ProviderProfileUpdateDTO,
  ProviderAvailability,
  ProviderAvailabilityUpdateDTO,
  ProviderSearchCriteria,
  ProviderMatchingCriteria,
  ProviderMatch,
  ServiceArea,
  ProviderReview,
  ReviewSubmissionDTO,
  TimeSlot,
  DateRange,
  GeoLocation,
  CalendarSyncRequest,
  CalendarSyncResponse
} from '../types/provider';
import { ApiResponse, ErrorResponse } from '../types/api';
import {
  getProviderProfile,
  updateProviderProfile,
  getAvailability,
  updateAvailability,
  searchProviders,
  matchProviders,
  getProviderReviews,
  submitReview,
  getServiceAreas,
  updateServiceAreas,
  syncCalendar,
  checkAvailability,
  findAvailableProviders
} from '../lib/api/providers';
import useAuth from './use-auth';
import { useToast } from './use-toast';
import {
  providerProfileSchema,
  providerUpdateSchema,
  providerAvailabilitySchema,
  providerSearchSchema,
  providerMatchingSchema,
  reviewSubmissionSchema,
  serviceAreaSchema
} from '../lib/schemas/provider';

/**
 * Hook for fetching a paginated list of providers with filtering options
 * @param searchCriteria - search criteria
 * @param options - options
 * @returns Query result with providers data, loading state, and error information
 */
export const useProviders = (
  searchCriteria: ProviderSearchCriteria,
  options: { enabled: boolean } = { enabled: true }
) => {
  // Validate search criteria using providerSearchSchema
  const validatedSearchCriteria = providerSearchSchema.parse(searchCriteria);

  // Use React Query's useQuery hook to fetch providers
  const { data, isLoading, error, refetch } = useQuery<{ providers: Provider[]; total: number; page: number; limit: number }, ErrorResponse>({
    queryKey: ['providers', validatedSearchCriteria],
    queryFn: () => searchProviders(validatedSearchCriteria),
    enabled: options.enabled,
    staleTime: 60 * 1000, // 60 seconds
    // Handle API errors and transform the response
    onError: (err: ErrorResponse) => {
      console.error('Error fetching providers:', err);
    },
    select: (response) => ({
      providers: response.providers,
      total: response.total,
      page: response.page,
      limit: response.limit,
    }),
  });

  // Return the query result with providers data, loading state, and error information
  return {
    providers: data?.providers || [],
    total: data?.total || 0,
    page: data?.page || 1,
    limit: data?.limit || 10,
    isLoading,
    error,
    refetch,
  };
};

/**
 * Hook for fetching a single provider by ID
 * @param id - id
 * @param options - options
 * @returns Query result with provider data, loading state, and error information
 */
export const useProvider = (
  id: string,
  options: { includeServiceAreas?: boolean, includeReviews?: boolean, includeAvailability?: boolean } = {}
) => {
  // Use React Query's useQuery hook to fetch a provider by ID with specified options
  const { data, isLoading, error } = useQuery<Provider, ErrorResponse>({
    queryKey: ['provider', id, options],
    queryFn: () => getProviderProfile(id, options),
    staleTime: 60 * 1000, // 60 seconds
    // Handle API errors and transform the response
    onError: (err: ErrorResponse) => {
      console.error(`Error fetching provider with ID ${id}:`, err);
    },
  });

  // Return the query result with provider data, loading state, and error information
  return {
    provider: data || null,
    isLoading,
    error,
  };
};

/**
 * Hook for fetching a provider's availability information
 * @param id - id
 * @param options - options
 * @returns Query result with availability data, loading state, and error information
 */
export const useProviderAvailability = (
  id: string,
  options: { startDate?: Date | string, endDate?: Date | string, serviceType?: string } = {}
) => {
  // Use React Query's useQuery hook to fetch provider availability
  const { data, isLoading, error } = useQuery<ProviderAvailability, ErrorResponse>({
    queryKey: ['providerAvailability', id, options],
    queryFn: () => getAvailability(id, options),
    staleTime: 60 * 1000, // 60 seconds
    // Handle API errors and transform the response
    onError: (err: ErrorResponse) => {
      console.error(`Error fetching availability for provider with ID ${id}:`, err);
    },
  });

  // Return the query result with availability data, loading state, and error information
  return {
    availability: data || null,
    isLoading,
    error,
  };
};

/**
 * Hook for fetching reviews for a specific provider
 * @param id - id
 * @param options - options
 * @returns Query result with reviews data, loading state, and error information
 */
export const useProviderReviews = (
  id: string,
  options: { page?: number, limit?: number, sortBy?: string, sortOrder?: 'asc' | 'desc', minRating?: number, serviceType?: string } = {}
) => {
  // Use React Query's useQuery hook to fetch provider reviews
  const { data, isLoading, error } = useQuery<{ reviews: ProviderReview[]; total: number; page: number; limit: number }, ErrorResponse>({
    queryKey: ['providerReviews', id, options],
    queryFn: () => getProviderReviews(id, options),
    staleTime: 60 * 1000, // 60 seconds
    // Handle API errors and transform the response
    onError: (err: ErrorResponse) => {
      console.error(`Error fetching reviews for provider with ID ${id}:`, err);
    },
  });

  // Return the query result with reviews data, loading state, and error information
  return {
    reviews: data?.reviews || [],
    total: data?.total || 0,
    page: data?.page || 1,
    limit: data?.limit || 10,
    isLoading,
    error,
  };
};

/**
 * Hook for fetching service areas for a specific provider
 * @param id - id
 * @returns Query result with service areas data, loading state, and error information
 */
export const useServiceAreas = (id: string) => {
  // Use React Query's useQuery hook to fetch provider service areas
  const { data, isLoading, error } = useQuery<ServiceArea[], ErrorResponse>({
    queryKey: ['serviceAreas', id],
    queryFn: () => getServiceAreas(id),
    staleTime: 60 * 1000, // 60 seconds
    // Handle API errors and transform the response
    onError: (err: ErrorResponse) => {
      console.error(`Error fetching service areas for provider with ID ${id}:`, err);
    },
  });

  // Return the query result with service areas data, loading state, and error information
  return {
    serviceAreas: data || [],
    isLoading,
    error,
  };
};

/**
 * Hook for finding providers with availability in a specified date range
 * @param params - params
 * @returns Query result with available providers data, loading state, and error information
 */
export const useAvailableProviders = (params: { startDate: Date | string, endDate: Date | string, serviceType?: string }) => {
  // Use React Query's useQuery hook to find available providers
  const { data, isLoading, error } = useQuery<Provider[], ErrorResponse>({
    queryKey: ['availableProviders', params],
    queryFn: () => findAvailableProviders(params),
    staleTime: 60 * 1000, // 60 seconds
    // Handle API errors and transform the response
    onError: (err: ErrorResponse) => {
      console.error('Error fetching available providers:', err);
    },
  });

  // Return the query result with available providers data, loading state, and error information
  return {
    availableProviders: data || [],
    isLoading,
    error,
  };
};

/**
 * Hook for checking if a provider is available for a specific time slot
 * @param id - id
 * @param params - params
 * @returns Query result with availability check data, loading state, and error information
 */
export const useCheckAvailability = (
  id: string,
  params: { startTime: Date | string, endTime: Date | string, serviceType: string }
) => {
  // Use React Query's useQuery hook to check provider availability
  const { data, isLoading, error } = useQuery<{ available: boolean; conflictingBookings?: TimeSlot[] }, ErrorResponse>({
    queryKey: ['checkAvailability', id, params],
    queryFn: () => checkAvailability(id, params),
    staleTime: 60 * 1000, // 60 seconds
    // Handle API errors and transform the response
    onError: (err: ErrorResponse) => {
      console.error(`Error checking availability for provider with ID ${id}:`, err);
    },
  });

  // Return the query result with availability check data, loading state, and error information
  return {
    availability: data || null,
    isLoading,
    error,
  };
};

/**
 * Hook for matching providers to a client based on specified criteria
 * @param criteria - criteria
 * @returns Query result with provider matches data, loading state, and error information
 */
export const useMatchProviders = (criteria: ProviderMatchingCriteria) => {
  // Validate matching criteria using providerMatchingSchema
  const validatedCriteria = providerMatchingSchema.parse(criteria);

  // Use React Query's useQuery hook to match providers
  const { data, isLoading, error } = useQuery<{ matches: ProviderMatch[]; total: number }, ErrorResponse>({
    queryKey: ['matchProviders', validatedCriteria],
    queryFn: () => matchProviders(validatedCriteria),
    staleTime: 60 * 1000, // 60 seconds
    // Handle API errors and transform the response
    onError: (err: ErrorResponse) => {
      console.error('Error matching providers:', err);
    },
  });

  // Return the query result with provider matches data, loading state, and error information
  return {
    matches: data?.matches || [],
    total: data?.total || 0,
    isLoading,
    error,
  };
};

/**
 * Hook for updating a provider's profile information
 * @param options - options
 * @returns Mutation result with update function, loading state, and error information
 */
export const useUpdateProviderProfile = (options: {
  onSuccess?: (data: Provider) => void;
  onError?: (error: ErrorResponse) => void;
} = {}) => {
  // Get the query client for cache invalidation
  const queryClient = useQueryClient();
  // Get the toast notification functions for user feedback
  const { toast } = useToast();

  // Use React Query's useMutation hook to update a provider profile
  const mutation = useMutation<Provider, ErrorResponse, { id: string; data: ProviderProfileUpdateDTO }>({
    mutationFn: ({ id, data }) => {
      // Validate profile data using providerUpdateSchema before submission
      const validatedData = providerUpdateSchema.parse(data);
      return updateProviderProfile(id, validatedData);
    },
    // Handle success by invalidating provider cache and showing success toast
    onSuccess: (data: Provider) => {
      queryClient.invalidateQueries({ queryKey: ['provider', data.id] });
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
        variant: 'success',
      });
      options.onSuccess?.(data);
    },
    // Handle errors by showing error toast
    onError: (error: ErrorResponse) => {
      toast({
        title: 'Error updating profile',
        description: error.error.message,
        variant: 'error',
      });
      options.onError?.(error);
    },
  });

  // Return the mutation result with update function, loading state, and error information
  return {
    updateProviderProfile: mutation.mutate,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
};

/**
 * Hook for updating a provider's availability information
 * @param options - options
 * @returns Mutation result with update function, loading state, and error information
 */
export const useUpdateAvailability = (options: {
  onSuccess?: (data: ProviderAvailability) => void;
  onError?: (error: ErrorResponse) => void;
} = {}) => {
  // Get the query client for cache invalidation
  const queryClient = useQueryClient();
  // Get the toast notification functions for user feedback
  const { toast } = useToast();

  // Use React Query's useMutation hook to update provider availability
  const mutation = useMutation<ProviderAvailability, ErrorResponse, { id: string; data: ProviderAvailabilityUpdateDTO }>({
    mutationFn: ({ id, data }) => {
      // Validate availability data using providerAvailabilitySchema before submission
      const validatedData = providerAvailabilitySchema.parse(data);
      return updateAvailability(id, validatedData);
    },
    // Handle success by invalidating availability cache and showing success toast
    onSuccess: (data: ProviderAvailability) => {
      queryClient.invalidateQueries({ queryKey: ['providerAvailability', data.providerId] });
      toast({
        title: 'Availability updated',
        description: 'Your availability has been updated successfully.',
        variant: 'success',
      });
      options.onSuccess?.(data);
    },
    // Handle errors by showing error toast
    onError: (error: ErrorResponse) => {
      toast({
        title: 'Error updating availability',
        description: error.error.message,
        variant: 'error',
      });
      options.onError?.(error);
    },
  });

  // Return the mutation result with update function, loading state, and error information
  return {
    updateAvailability: mutation.mutate,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
};

/**
 * Hook for updating service areas for a specific provider
 * @param options - options
 * @returns Mutation result with update function, loading state, and error information
 */
export const useUpdateServiceAreas = (options: {
  onSuccess?: () => void;
  onError?: (error: ErrorResponse) => void;
} = {}) => {
  // Get the query client for cache invalidation
  const queryClient = useQueryClient();
  // Get the toast notification functions for user feedback
  const { toast } = useToast();

  // Use React Query's useMutation hook to update service areas
  const mutation = useMutation<ServiceArea[], ErrorResponse, { id: string; data: ServiceArea[] }>({
    mutationFn: ({ id, data }) => {
      // Validate service areas data using serviceAreaSchema before submission
      data.forEach(serviceArea => serviceAreaSchema.parse(serviceArea));
      return updateServiceAreas(id, data);
    },
    // Handle success by invalidating service areas cache and showing success toast
    onSuccess: () => {
      toast({
        title: 'Service areas updated',
        description: 'Your service areas have been updated successfully.',
        variant: 'success',
      });
      options.onSuccess?.();
    },
    // Handle errors by showing error toast
    onError: (error: ErrorResponse) => {
      toast({
        title: 'Error updating service areas',
        description: error.error.message,
        variant: 'error',
      });
      options.onError?.(error);
    },
    onSettled: (data, error, variables) => {
        if (variables?.id) {
            queryClient.invalidateQueries({ queryKey: ['serviceAreas', variables.id] });
        }
    }
  });

  // Return the mutation result with update function, loading state, and error information
  return {
    updateServiceAreas: mutation.mutate,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
};

/**
 * Hook for submitting a new review for a provider
 * @param options - options
 * @returns Mutation result with submit function, loading state, and error information
 */
export const useSubmitReview = (options: {
  onSuccess?: () => void;
  onError?: (error: ErrorResponse) => void;
} = {}) => {
  // Get the query client for cache invalidation
  const queryClient = useQueryClient();
  // Get the toast notification functions for user feedback
  const { toast } = useToast();

  // Use React Query's useMutation hook to submit a review
  const mutation = useMutation<ProviderReview, ErrorResponse, ReviewSubmissionDTO>({
    mutationFn: (data) => {
      // Validate review data using reviewSubmissionSchema before submission
      reviewSubmissionSchema.parse(data);
      return submitReview(data);
    },
    // Handle success by invalidating reviews cache and showing success toast
    onSuccess: () => {
      toast({
        title: 'Review submitted',
        description: 'Your review has been submitted successfully.',
        variant: 'success',
      });
      options.onSuccess?.();
    },
    // Handle errors by showing error toast
    onError: (error: ErrorResponse) => {
      toast({
        title: 'Error submitting review',
        description: error.error.message,
        variant: 'error',
      });
      options.onError?.(error);
    },
    onSettled: (data, error, variables) => {
        if (variables?.providerId) {
            queryClient.invalidateQueries({ queryKey: ['providerReviews', variables.providerId] });
        }
    }
  });

  // Return the mutation result with submit function, loading state, and error information
  return {
    submitReview: mutation.mutate,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
};

/**
 * Hook for synchronizing a provider's availability with their external calendar
 * @param options - options
 * @returns Mutation result with sync function, loading state, and error information
 */
export const useSyncCalendar = (options: {
  onSuccess?: (data: CalendarSyncResponse) => void;
  onError?: (error: ErrorResponse) => void;
} = {}) => {
  // Get the query client for cache invalidation
  const queryClient = useQueryClient();
  // Get the toast notification functions for user feedback
  const { toast } = useToast();

  // Use React Query's useMutation hook to sync calendar
  const mutation = useMutation<CalendarSyncResponse, ErrorResponse, { id: string; data: CalendarSyncRequest }>({
    mutationFn: ({ id, data }) => {
      return syncCalendar(id, data);
    },
    // Handle success by invalidating availability cache and showing success toast
    onSuccess: (data: CalendarSyncResponse) => {
      toast({
        title: 'Calendar synced',
        description: data.message || 'Calendar synced successfully.',
        variant: 'success',
      });
      options.onSuccess?.(data);
    },
    // Handle errors by showing error toast
    onError: (error: ErrorResponse) => {
      toast({
        title: 'Error syncing calendar',
        description: error.error.message,
        variant: 'error',
      });
      options.onError?.(error);
    },
    onSettled: (data, error, variables) => {
        if (variables?.id) {
            queryClient.invalidateQueries({ queryKey: ['providerAvailability', variables.id] });
        }
    }
  });

  // Return the mutation result with sync function, loading state, and error information
  return {
    syncCalendar: mutation.mutate,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
};