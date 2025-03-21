import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { 
  CarePlan, 
  CarePlanFormData, 
  CarePlanOption, 
  CarePlanOptionsResponse, 
  CarePlanGenerationParams, 
  CarePlanFilterParams,
  CarePlanWithClientInfo,
  PaginatedCarePlansResponse,
  CarePlanHistoryData,
  CarePlanApprovalData
} from '../types/care-plan';
import { ApiResponse, ErrorResponse } from '../types/api';
import { 
  getCarePlans, 
  getCarePlanById, 
  createCarePlan, 
  updateCarePlan, 
  deleteCarePlan, 
  approveCarePlan, 
  getCarePlanHistory, 
  generateCarePlanOptions 
} from '../lib/api/care-plans';
import { useAuth } from './use-auth';
import { useToast } from './use-toast';
import { 
  carePlanFormSchema, 
  carePlanApprovalSchema, 
  carePlanGenerationSchema,
  carePlanFilterSchema 
} from '../lib/schemas/care-plan';

/**
 * Hook for fetching a paginated list of care plans with filtering options
 * 
 * @param filterParams - Filter parameters for care plans query
 * @param options - Additional query options
 * @returns Query result with care plans data, loading state, and error information
 */
export function useCarePlans(
  filterParams: Partial<CarePlanFilterParams> = {},
  options?: { enabled?: boolean }
) {
  // Validate and transform filter parameters
  const validatedParams = useMemo(() => {
    try {
      return carePlanFilterSchema.parse(filterParams);
    } catch (error) {
      console.error('Invalid care plan filter params:', error);
      // Return default values for required fields if validation fails
      return {
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc' as const
      };
    }
  }, [filterParams]);

  // Create a stable query key based on validated parameters
  const queryKey = useMemo(() => 
    ['care-plans', validatedParams], 
    [validatedParams]
  );

  // Fetch care plans using React Query
  return useQuery({
    queryKey,
    queryFn: () => getCarePlans(validatedParams as CarePlanFilterParams),
    enabled: options?.enabled !== false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}

/**
 * Hook for fetching a single care plan by ID
 * 
 * @param id - The care plan ID to fetch
 * @param options - Additional query options
 * @returns Query result with care plan data, loading state, and error information
 */
export function useCarePlan(
  id: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: ['care-plan', id],
    queryFn: () => getCarePlanById(id),
    enabled: !!id && options?.enabled !== false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}

/**
 * Hook for fetching the version history of a care plan
 * 
 * @param id - The care plan ID to fetch history for
 * @param options - Additional query options
 * @returns Query result with care plan history data, loading state, and error information
 */
export function useCarePlanHistory(
  id: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: ['care-plan-history', id],
    queryFn: () => getCarePlanHistory(id),
    enabled: !!id && options?.enabled !== false,
    staleTime: 30 * 60 * 1000, // 30 minutes
    retry: 1,
  });
}

/**
 * Hook for creating a new care plan
 * 
 * @param options - Additional mutation options
 * @returns Mutation result with create function, loading state, and error information
 */
export function useCreateCarePlan(options?: {
  onSuccess?: (data: CarePlan) => void;
  onError?: (error: ErrorResponse) => void;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: CarePlanFormData) => {
      // Validate the form data
      const validatedData = carePlanFormSchema.parse(data);
      return createCarePlan(validatedData);
    },
    onSuccess: (data) => {
      // Invalidate care plans query to refetch the list
      queryClient.invalidateQueries({
        queryKey: ['care-plans'],
      });
      
      // Invalidate specific care plan query if it exists
      queryClient.invalidateQueries({
        queryKey: ['care-plan', data.id],
      });
      
      // Show success toast
      toast({
        title: "Care plan created",
        description: "The care plan was created successfully.",
        variant: "success",
        duration: 5000,
      });
      
      // Call onSuccess callback if provided
      if (options?.onSuccess) {
        options.onSuccess(data);
      }
    },
    onError: (error: ErrorResponse) => {
      // Show error toast
      toast({
        title: "Failed to create care plan",
        description: error.error?.message || "An error occurred while creating the care plan.",
        variant: "error",
        duration: 7000,
      });
      
      // Call onError callback if provided
      if (options?.onError) {
        options.onError(error);
      }
    },
  });
}

/**
 * Hook for updating an existing care plan
 * 
 * @param options - Additional mutation options
 * @returns Mutation result with update function, loading state, and error information
 */
export function useUpdateCarePlan(options?: {
  onSuccess?: (data: CarePlan) => void;
  onError?: (error: ErrorResponse) => void;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CarePlanFormData }) => {
      // Validate the form data
      const validatedData = carePlanFormSchema.parse(data);
      return updateCarePlan(id, validatedData);
    },
    onSuccess: (data) => {
      // Invalidate care plans query to refetch the list
      queryClient.invalidateQueries({
        queryKey: ['care-plans'],
      });
      
      // Invalidate specific care plan query
      queryClient.invalidateQueries({
        queryKey: ['care-plan', data.id],
      });
      
      // Show success toast
      toast({
        title: "Care plan updated",
        description: "The care plan was updated successfully.",
        variant: "success",
        duration: 5000,
      });
      
      // Call onSuccess callback if provided
      if (options?.onSuccess) {
        options.onSuccess(data);
      }
    },
    onError: (error: ErrorResponse) => {
      // Show error toast
      toast({
        title: "Failed to update care plan",
        description: error.error?.message || "An error occurred while updating the care plan.",
        variant: "error",
        duration: 7000,
      });
      
      // Call onError callback if provided
      if (options?.onError) {
        options.onError(error);
      }
    },
  });
}

/**
 * Hook for approving or rejecting a care plan
 * 
 * @param options - Additional mutation options
 * @returns Mutation result with approve function, loading state, and error information
 */
export function useApproveCarePlan(options?: {
  onSuccess?: (data: CarePlan) => void;
  onError?: (error: ErrorResponse) => void;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CarePlanApprovalData }) => {
      // Validate the approval data
      const validatedData = carePlanApprovalSchema.parse(data);
      return approveCarePlan(id, validatedData);
    },
    onSuccess: (data) => {
      // Invalidate care plans query to refetch the list
      queryClient.invalidateQueries({
        queryKey: ['care-plans'],
      });
      
      // Invalidate specific care plan query
      queryClient.invalidateQueries({
        queryKey: ['care-plan', data.id],
      });
      
      // Determine action type for message
      const actionType = data.status === 'approved' ? 'approved' : 'rejected';
      
      // Show success toast
      toast({
        title: `Care plan ${actionType}`,
        description: `The care plan was ${actionType} successfully.`,
        variant: "success",
        duration: 5000,
      });
      
      // Call onSuccess callback if provided
      if (options?.onSuccess) {
        options.onSuccess(data);
      }
    },
    onError: (error: ErrorResponse) => {
      // Show error toast
      toast({
        title: "Action failed",
        description: error.error?.message || "An error occurred while processing your request.",
        variant: "error",
        duration: 7000,
      });
      
      // Call onError callback if provided
      if (options?.onError) {
        options.onError(error);
      }
    },
  });
}

/**
 * Hook for deleting a care plan
 * 
 * @param options - Additional mutation options
 * @returns Mutation result with delete function, loading state, and error information
 */
export function useDeleteCarePlan(options?: {
  onSuccess?: () => void;
  onError?: (error: ErrorResponse) => void;
  redirectPath?: string;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const router = useRouter();

  return useMutation({
    mutationFn: (id: string) => deleteCarePlan(id),
    onSuccess: () => {
      // Invalidate care plans query to refetch the list
      queryClient.invalidateQueries({
        queryKey: ['care-plans'],
      });
      
      // Show success toast
      toast({
        title: "Care plan deleted",
        description: "The care plan was deleted successfully.",
        variant: "success",
        duration: 5000,
      });
      
      // Redirect if path provided
      if (options?.redirectPath) {
        router.push(options.redirectPath);
      }
      
      // Call onSuccess callback if provided
      if (options?.onSuccess) {
        options.onSuccess();
      }
    },
    onError: (error: ErrorResponse) => {
      // Show error toast
      toast({
        title: "Failed to delete care plan",
        description: error.error?.message || "An error occurred while deleting the care plan.",
        variant: "error",
        duration: 7000,
      });
      
      // Call onError callback if provided
      if (options?.onError) {
        options.onError(error);
      }
    },
  });
}

/**
 * Hook for generating AI-powered care plan options
 * 
 * @param options - Additional mutation options
 * @returns Mutation result with generate function, loading state, and error information
 */
export function useGenerateCarePlanOptions(options?: {
  onSuccess?: (data: CarePlanOptionsResponse) => void;
  onError?: (error: ErrorResponse) => void;
}) {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: CarePlanGenerationParams) => {
      // Validate the generation parameters
      const validatedParams = carePlanGenerationSchema.parse(params);
      return generateCarePlanOptions(validatedParams);
    },
    onSuccess: (data) => {
      // Show success toast
      toast({
        title: "Care plan options generated",
        description: `${data.options.length} care plan options have been generated.`,
        variant: "success",
        duration: 5000,
      });
      
      // Call onSuccess callback if provided
      if (options?.onSuccess) {
        options.onSuccess(data);
      }
    },
    onError: (error: ErrorResponse) => {
      // Show error toast
      toast({
        title: "Failed to generate care plan options",
        description: error.error?.message || "An error occurred while generating care plan options.",
        variant: "error",
        duration: 7000,
      });
      
      // Call onError callback if provided
      if (options?.onError) {
        options.onError(error);
      }
    },
  });
}