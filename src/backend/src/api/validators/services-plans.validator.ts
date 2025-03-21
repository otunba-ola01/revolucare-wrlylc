/**
 * Services Plan Validation Schemas
 * 
 * This module defines Zod validation schemas for services plan-related requests
 * in the Revolucare platform. These schemas ensure that all services plan operations
 * receive properly formatted and valid data before processing.
 */

import { z } from 'zod'; // zod@3.21.4
import { PlanStatus } from '../../constants/plan-statuses';
import { ServiceType } from '../../constants/service-types';
import { validateId } from '../../utils/validation';

/**
 * Schema for validating needs assessment creation data
 */
export const createNeedsAssessmentSchema = z.object({
  clientId: z.string()
    .refine(validateId, {
      message: 'Client ID is required and must be a valid UUID'
    }),
  assessmentData: z.record(z.any())
    .refine(data => data && Object.keys(data).length > 0, {
      message: 'Assessment data is required'
    }),
  notes: z.string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional(),
});

/**
 * Schema for validating service item creation data within a services plan
 */
export const createServiceItemSchema = z.object({
  serviceType: z.nativeEnum(ServiceType, {
    errorMap: () => ({ message: 'Service type is required and must be a valid service type' })
  }),
  providerId: z.string()
    .refine(id => !id || validateId(id), {
      message: 'Provider ID must be a valid UUID'
    })
    .optional(),
  description: z.string()
    .min(10, 'Description is required and must be between 10-500 characters')
    .max(500, 'Description must be less than 500 characters'),
  frequency: z.string()
    .min(3, 'Frequency is required and must be between 3-100 characters')
    .max(100, 'Frequency must be less than 100 characters'),
  duration: z.string()
    .min(3, 'Duration is required and must be between 3-100 characters')
    .max(100, 'Duration must be less than 100 characters'),
  estimatedCost: z.number()
    .positive('Estimated cost is required and must be a positive number'),
});

/**
 * Schema for validating funding source creation data within a services plan
 */
export const createFundingSourceSchema = z.object({
  name: z.string()
    .min(3, 'Name is required and must be between 3-100 characters')
    .max(100, 'Name must be less than 100 characters'),
  type: z.enum(['insurance', 'medicaid', 'medicare', 'private_pay', 'grant', 'other'], {
    errorMap: () => ({ message: 'Type is required and must be a valid funding source type' })
  }),
  coveragePercentage: z.number()
    .min(0, 'Coverage percentage is required and must be between 0-100')
    .max(100, 'Coverage percentage must be between 0-100'),
  coverageAmount: z.number()
    .positive('Coverage amount is required and must be a positive number'),
  details: z.record(z.any())
    .optional(),
});

/**
 * Schema for validating services plan creation data
 */
export const createServicesPlanSchema = z.object({
  clientId: z.string()
    .refine(validateId, {
      message: 'Client ID is required and must be a valid UUID'
    }),
  carePlanId: z.string()
    .refine(id => !id || validateId(id), {
      message: 'Care plan ID must be a valid UUID'
    })
    .optional(),
  title: z.string()
    .min(3, 'Title is required and must be between 3-100 characters')
    .max(100, 'Title must be less than 100 characters'),
  description: z.string()
    .min(10, 'Description is required and must be between 10-1000 characters')
    .max(1000, 'Description must be less than 1000 characters'),
  needsAssessmentId: z.string()
    .refine(validateId, {
      message: 'Needs assessment ID is required and must be a valid UUID'
    }),
  serviceItems: z.array(createServiceItemSchema)
    .min(1, 'At least one service item is required'),
  fundingSources: z.array(createFundingSourceSchema)
    .optional(),
});

/**
 * Schema for validating service item update data
 */
export const updateServiceItemSchema = z.object({
  id: z.string()
    .refine(validateId, {
      message: 'Service item ID is required and must be a valid UUID'
    }),
  serviceType: z.nativeEnum(ServiceType, {
    errorMap: () => ({ message: 'Service type must be a valid service type' })
  })
  .optional(),
  providerId: z.string()
    .refine(id => !id || validateId(id), {
      message: 'Provider ID must be a valid UUID'
    })
    .optional(),
  description: z.string()
    .min(10, 'Description must be between 10-500 characters')
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  frequency: z.string()
    .min(3, 'Frequency must be between 3-100 characters')
    .max(100, 'Frequency must be less than 100 characters')
    .optional(),
  duration: z.string()
    .min(3, 'Duration must be between 3-100 characters')
    .max(100, 'Duration must be less than 100 characters')
    .optional(),
  estimatedCost: z.number()
    .positive('Estimated cost must be a positive number')
    .optional(),
  status: z.enum(['pending', 'scheduled', 'active', 'completed', 'discontinued'], {
    errorMap: () => ({ message: 'Status must be a valid service item status' })
  })
  .optional(),
});

/**
 * Schema for validating funding source update data
 */
export const updateFundingSourceSchema = z.object({
  id: z.string()
    .refine(validateId, {
      message: 'Funding source ID is required and must be a valid UUID'
    }),
  name: z.string()
    .min(3, 'Name must be between 3-100 characters')
    .max(100, 'Name must be less than 100 characters')
    .optional(),
  type: z.enum(['insurance', 'medicaid', 'medicare', 'private_pay', 'grant', 'other'], {
    errorMap: () => ({ message: 'Type must be a valid funding source type' })
  })
  .optional(),
  coveragePercentage: z.number()
    .min(0, 'Coverage percentage must be between 0-100')
    .max(100, 'Coverage percentage must be between 0-100')
    .optional(),
  coverageAmount: z.number()
    .positive('Coverage amount must be a positive number')
    .optional(),
  verificationStatus: z.enum(['pending', 'verified', 'denied'], {
    errorMap: () => ({ message: 'Verification status must be a valid status' })
  })
  .optional(),
  details: z.record(z.any())
    .optional(),
});

/**
 * Schema for validating services plan update data
 */
export const updateServicesPlanSchema = z.object({
  title: z.string()
    .min(3, 'Title must be between 3-100 characters')
    .max(100, 'Title must be less than 100 characters')
    .optional(),
  description: z.string()
    .min(10, 'Description must be between 10-1000 characters')
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
  status: z.nativeEnum(PlanStatus, {
    errorMap: () => ({ message: 'Status must be a valid plan status' })
  })
  .optional(),
  serviceItems: z.array(updateServiceItemSchema)
    .min(1, 'At least one service item is required if service items are provided')
    .optional(),
  fundingSources: z.array(updateFundingSourceSchema)
    .optional(),
});

/**
 * Schema for validating services plan approval data
 */
export const approveServicesPlanSchema = z.object({
  notes: z.string()
    .max(500, 'Approval notes must be less than 500 characters')
    .optional(),
});

/**
 * Schema for validating AI services plan generation data
 */
export const generateServicesPlanSchema = z.object({
  clientId: z.string()
    .refine(validateId, {
      message: 'Client ID is required and must be a valid UUID'
    }),
  carePlanId: z.string()
    .refine(id => !id || validateId(id), {
      message: 'Care plan ID must be a valid UUID'
    })
    .optional(),
  needsAssessmentId: z.string()
    .refine(validateId, {
      message: 'Needs assessment ID is required and must be a valid UUID'
    }),
  preferences: z.record(z.any())
    .optional(),
});

/**
 * Schema for validating services plan URL parameters
 */
export const servicesPlanParamsSchema = z.object({
  id: z.string()
    .refine(validateId, {
      message: 'Services plan ID is required and must be a valid UUID'
    }),
});

/**
 * Schema for validating services plan filter and pagination parameters
 */
export const servicesPlanFilterSchema = z.object({
  clientId: z.string()
    .refine(id => !id || validateId(id), {
      message: 'Client ID must be a valid UUID'
    })
    .optional(),
  status: z.nativeEnum(PlanStatus, {
    errorMap: () => ({ message: 'Status must be a valid plan status' })
  })
  .optional(),
  createdById: z.string()
    .refine(id => !id || validateId(id), {
      message: 'Creator ID must be a valid UUID'
    })
    .optional(),
  approvedById: z.string()
    .refine(id => !id || validateId(id), {
      message: 'Approver ID must be a valid UUID'
    })
    .optional(),
  serviceType: z.nativeEnum(ServiceType, {
    errorMap: () => ({ message: 'Service type must be a valid service type' })
  })
  .optional(),
  providerId: z.string()
    .refine(id => !id || validateId(id), {
      message: 'Provider ID must be a valid UUID'
    })
    .optional(),
  startDate: z.string()
    .refine(date => !date || !isNaN(Date.parse(date)), {
      message: 'Start date must be a valid date'
    })
    .optional(),
  endDate: z.string()
    .refine(date => !date || !isNaN(Date.parse(date)), {
      message: 'End date must be a valid date'
    })
    .optional(),
  search: z.string()
    .optional(),
  page: z.number()
    .int('Page must be a positive integer')
    .positive('Page must be a positive integer')
    .default(1),
  limit: z.number()
    .int('Limit must be a positive integer')
    .positive('Limit must be a positive integer')
    .max(100, 'Limit must be less than or equal to 100')
    .default(10),
  sortBy: z.enum(['createdAt', 'updatedAt', 'title', 'status'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc'])
    .default('desc'),
});