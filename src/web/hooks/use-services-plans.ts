import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { 
  ServicesPlan, 
  ServicesPlanWithClientInfo, 
  NeedsAssessment, 
  ServicesPlanFormData, 
  NeedsAssessmentFormData,
  ServicesPlanOption,
  ServicesPlanGenerationParams,
  ServicesPlanApprovalData,
  ServicesPlanFilterParams,
  CostEstimate,
  FundingSourceInfo 
} from '../types/service-plan';

import { ApiResponse, ErrorResponse, PaginatedResponse } from '../types/api';

import {
  getServicesPlan,
  getServicesPlansList,
  createServicesPlan,
  updateServicesPlan,
  deleteServicesPlan,
  approveServicesPlan,
  rejectServicesPlan,
  generateServicesPlanOptions,
  getNeedsAssessment,
  getClientNeedsAssessments,
  createNeedsAssessment,
  updateNeedsAssessment,
  deleteNeedsAssessment,
  estimateServicesPlanCost,
  estimateServicesItemsCost,
  getClientFundingSources,
  getClientServicePlans
} from '../lib/api/services-plans';

import { useAuth } from './use-auth';
import { useToast } from './use-toast';

import {
  servicesPlanFormSchema,
  needsAssessmentFormSchema,
  servicesPlanApprovalSchema,
  servicesPlanGenerationSchema,
  servicesPlanFilterSchema
} from '../lib/schemas/service-plan';

/**
 * Hook for fetching a paginated list of service plans with filtering options
 */
export function useServicesPlans(
  filterParams: ServicesPlanFilterParams,
  options = {}
) {
  // Validate filter parameters
  try {
    servicesPlanFilterSchema.parse(filterParams);
  } catch (error) {
    console.error('Invalid filter parameters:', error);
  }

  return useQuery({
    queryKey: ['servicesPlans', filterParams],
    queryFn: () => getServicesPlansList(filterParams),
    ...options
  });
}

/**
 * Hook for fetching a single service plan by ID
 */
export function useServicesPlan(id: string, options = {}) {
  return useQuery({
    queryKey: ['servicesPlan', id],
    queryFn: () => getServicesPlan(id),
    enabled: !!id,
    ...options
  });
}

/**
 * Hook for fetching all service plans for a specific client
 */
export function useClientServicesPlans(clientId: string, options = {}) {
  return useQuery({
    queryKey: ['clientServicesPlans', clientId],
    queryFn: () => getClientServicePlans(clientId),
    enabled: !!clientId,
    ...options
  });
}

/**
 * Hook for fetching a single needs assessment by ID
 */
export function useNeedsAssessment(id: string, options = {}) {
  return useQuery({
    queryKey: ['needsAssessment', id],
    queryFn: () => getNeedsAssessment(id),
    enabled: !!id,
    ...options
  });
}

/**
 * Hook for fetching all needs assessments for a specific client
 */
export function useClientNeedsAssessments(clientId: string, options = {}) {
  return useQuery({
    queryKey: ['clientNeedsAssessments', clientId],
    queryFn: () => getClientNeedsAssessments(clientId),
    enabled: !!clientId,
    ...options
  });
}

/**
 * Hook for creating a new service plan
 */
export function useCreateServicesPlan(options = {}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: ServicesPlanFormData) => {
      try {
        servicesPlanFormSchema.parse(data);
      } catch (error) {
        console.error('Validation error:', error);
        throw error;
      }
      return createServicesPlan(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicesPlans'] });
      toast({
        title: 'Success',
        description: 'Service plan created successfully',
        variant: 'success',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to create service plan: ${error.message}`,
        variant: 'error',
      });
    },
    ...options
  });
}

/**
 * Hook for updating an existing service plan
 */
export function useUpdateServicesPlan(options = {}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ServicesPlanFormData }) => {
      try {
        servicesPlanFormSchema.parse(data);
      } catch (error) {
        console.error('Validation error:', error);
        throw error;
      }
      return updateServicesPlan(id, data);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['servicesPlans'] });
      queryClient.invalidateQueries({ queryKey: ['servicesPlan', variables.id] });
      toast({
        title: 'Success',
        description: 'Service plan updated successfully',
        variant: 'success',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to update service plan: ${error.message}`,
        variant: 'error',
      });
    },
    ...options
  });
}

/**
 * Hook for approving a service plan
 */
export function useApproveServicesPlan(options = {}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ServicesPlanApprovalData }) => {
      try {
        servicesPlanApprovalSchema.parse({ ...data, status: 'approved' });
      } catch (error) {
        console.error('Validation error:', error);
        throw error;
      }
      return approveServicesPlan(id, data);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['servicesPlans'] });
      queryClient.invalidateQueries({ queryKey: ['servicesPlan', variables.id] });
      toast({
        title: 'Success',
        description: 'Service plan approved successfully',
        variant: 'success',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to approve service plan: ${error.message}`,
        variant: 'error',
      });
    },
    ...options
  });
}

/**
 * Hook for rejecting a service plan
 */
export function useRejectServicesPlan(options = {}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ServicesPlanApprovalData }) => {
      try {
        servicesPlanApprovalSchema.parse({ ...data, status: 'rejected' });
      } catch (error) {
        console.error('Validation error:', error);
        throw error;
      }
      return rejectServicesPlan(id, data);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['servicesPlans'] });
      queryClient.invalidateQueries({ queryKey: ['servicesPlan', variables.id] });
      toast({
        title: 'Success',
        description: 'Service plan rejected successfully',
        variant: 'success',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to reject service plan: ${error.message}`,
        variant: 'error',
      });
    },
    ...options
  });
}

/**
 * Hook for deleting a service plan
 */
export function useDeleteServicesPlan(options = {}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const router = useRouter();

  return useMutation({
    mutationFn: (id: string) => deleteServicesPlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicesPlans'] });
      toast({
        title: 'Success',
        description: 'Service plan deleted successfully',
        variant: 'success',
      });
      router.push('/services-plans');
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to delete service plan: ${error.message}`,
        variant: 'error',
      });
    },
    ...options
  });
}

/**
 * Hook for creating a new needs assessment
 */
export function useCreateNeedsAssessment(options = {}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: NeedsAssessmentFormData) => {
      try {
        needsAssessmentFormSchema.parse(data);
      } catch (error) {
        console.error('Validation error:', error);
        throw error;
      }
      return createNeedsAssessment(data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['clientNeedsAssessments', data.clientId] });
      toast({
        title: 'Success',
        description: 'Needs assessment created successfully',
        variant: 'success',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to create needs assessment: ${error.message}`,
        variant: 'error',
      });
    },
    ...options
  });
}

/**
 * Hook for updating an existing needs assessment
 */
export function useUpdateNeedsAssessment(options = {}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: NeedsAssessmentFormData }) => {
      try {
        needsAssessmentFormSchema.parse(data);
      } catch (error) {
        console.error('Validation error:', error);
        throw error;
      }
      return updateNeedsAssessment(id, data);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['needsAssessment', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['clientNeedsAssessments', data.clientId] });
      toast({
        title: 'Success',
        description: 'Needs assessment updated successfully',
        variant: 'success',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to update needs assessment: ${error.message}`,
        variant: 'error',
      });
    },
    ...options
  });
}

/**
 * Hook for deleting a needs assessment
 */
export function useDeleteNeedsAssessment(options = {}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const router = useRouter();

  return useMutation({
    mutationFn: (id: string) => deleteNeedsAssessment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientNeedsAssessments'] });
      toast({
        title: 'Success',
        description: 'Needs assessment deleted successfully',
        variant: 'success',
      });
      router.back();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to delete needs assessment: ${error.message}`,
        variant: 'error',
      });
    },
    ...options
  });
}

/**
 * Hook for generating AI-powered service plan options
 */
export function useGenerateServicesPlanOptions(options = {}) {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (params: ServicesPlanGenerationParams) => {
      try {
        servicesPlanGenerationSchema.parse(params);
      } catch (error) {
        console.error('Validation error:', error);
        throw error;
      }
      return generateServicesPlanOptions(params);
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Service plan options generated successfully',
        variant: 'success',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to generate service plan options: ${error.message}`,
        variant: 'error',
      });
    },
    ...options
  });
}

/**
 * Hook for estimating the cost of a service plan
 */
export function useEstimateServicesPlanCost(servicesPlanId: string, options = {}) {
  return useQuery({
    queryKey: ['servicesPlanCost', servicesPlanId],
    queryFn: () => estimateServicesPlanCost(servicesPlanId),
    enabled: !!servicesPlanId,
    ...options
  });
}

/**
 * Hook for estimating the cost of service items for a client
 */
export function useEstimateServicesItemsCost(options = {}) {
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ clientId, services }: { clientId: string; services: any[] }) => {
      return estimateServicesItemsCost(clientId, services);
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Cost estimate generated successfully',
        variant: 'success',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to generate cost estimate: ${error.message}`,
        variant: 'error',
      });
    },
    ...options
  });
}

/**
 * Hook for fetching potential funding sources for a client
 */
export function useClientFundingSources(clientId: string, options = {}) {
  return useQuery({
    queryKey: ['clientFundingSources', clientId],
    queryFn: () => getClientFundingSources(clientId),
    enabled: !!clientId,
    ...options
  });
}