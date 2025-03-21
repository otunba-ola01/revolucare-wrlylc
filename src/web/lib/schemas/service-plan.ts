import { z } from 'zod'; // zod version 3.0+
import { PlanStatus } from '../../config/constants';
import { ServiceType } from '../../config/constants';
import { ServiceItemStatus, FundingSourceType, VerificationStatus } from '../../types/service-plan';

// Maximum allowed lengths and counts
export const MAX_TITLE_LENGTH = 100;
export const MAX_DESCRIPTION_LENGTH = 1000;
export const MAX_SERVICES = 30;
export const MAX_FUNDING_SOURCES = 10;
export const MAX_APPROVAL_NOTES_LENGTH = 500;
export const MAX_ASSESSMENT_NOTES_LENGTH = 2000;

// Schema for a service item within a service plan
export const serviceItemSchema = z.object({
  id: z.string().optional(),
  serviceType: z.nativeEnum(ServiceType, { errorMap: () => ({ message: 'Please select a valid service type' }) })
    .required('Service type is required'),
  providerId: z.string().nullable().optional(),
  description: z.string()
    .required('Description is required')
    .min(5, 'Description must be at least 5 characters')
    .max(200, 'Description cannot exceed 200 characters'),
  frequency: z.string()
    .required('Frequency is required')
    .min(2, 'Frequency must be at least 2 characters')
    .max(50, 'Frequency cannot exceed 50 characters'),
  duration: z.string()
    .required('Duration is required')
    .min(2, 'Duration must be at least 2 characters')
    .max(50, 'Duration cannot exceed 50 characters'),
  estimatedCost: z.number()
    .min(0, 'Cost cannot be negative')
    .required('Estimated cost is required'),
  status: z.nativeEnum(ServiceItemStatus, { errorMap: () => ({ message: 'Please select a valid status' }) })
    .default(ServiceItemStatus.PENDING),
});

// Schema for a funding source within a service plan
export const fundingSourceSchema = z.object({
  id: z.string().optional(),
  name: z.string()
    .required('Funding source name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters'),
  type: z.nativeEnum(FundingSourceType, { errorMap: () => ({ message: 'Please select a valid funding source type' }) })
    .required('Funding source type is required'),
  coveragePercentage: z.number()
    .min(0, 'Coverage percentage cannot be negative')
    .max(100, 'Coverage percentage cannot exceed 100%')
    .required('Coverage percentage is required'),
  coverageAmount: z.number()
    .min(0, 'Coverage amount cannot be negative')
    .required('Coverage amount is required'),
  verificationStatus: z.nativeEnum(VerificationStatus, { errorMap: () => ({ message: 'Please select a valid verification status' }) })
    .default(VerificationStatus.PENDING),
  details: z.record(z.string(), z.any()).nullable().optional(),
});

// Schema for creating or updating a service plan
export const servicesPlanFormSchema = z.object({
  clientId: z.string().required('Client is required'),
  carePlanId: z.string().nullable().optional(),
  title: z.string()
    .required('Title is required')
    .min(5, 'Title must be at least 5 characters')
    .max(MAX_TITLE_LENGTH, `Title cannot exceed ${MAX_TITLE_LENGTH} characters`),
  description: z.string()
    .required('Description is required')
    .min(10, 'Description must be at least 10 characters')
    .max(MAX_DESCRIPTION_LENGTH, `Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters`),
  needsAssessmentId: z.string().required('Needs assessment is required'),
  status: z.nativeEnum(PlanStatus, { errorMap: () => ({ message: 'Please select a valid status' }) })
    .default(PlanStatus.DRAFT),
  services: z.array(serviceItemSchema)
    .min(1, 'At least one service is required')
    .max(MAX_SERVICES, `Cannot exceed ${MAX_SERVICES} services`),
  fundingSources: z.array(fundingSourceSchema)
    .optional()
    .default([])
    .max(MAX_FUNDING_SOURCES, `Cannot exceed ${MAX_FUNDING_SOURCES} funding sources`),
});

// Schema for creating or updating a needs assessment
export const needsAssessmentFormSchema = z.object({
  clientId: z.string().required('Client is required'),
  assessmentData: z.record(z.string(), z.any()).required('Assessment data is required'),
  notes: z.string()
    .optional()
    .max(MAX_ASSESSMENT_NOTES_LENGTH, `Notes cannot exceed ${MAX_ASSESSMENT_NOTES_LENGTH} characters`),
});

// Schema for approving or rejecting a service plan
export const servicesPlanApprovalSchema = z.object({
  approvalNotes: z.string()
    .optional()
    .max(MAX_APPROVAL_NOTES_LENGTH, `Approval notes cannot exceed ${MAX_APPROVAL_NOTES_LENGTH} characters`),
  status: z.nativeEnum(PlanStatus, { errorMap: () => ({ message: 'Please select a valid status' }) })
    .required('Status is required')
    .refine(val => val === PlanStatus.APPROVED || val === PlanStatus.REJECTED, 'Status must be either APPROVED or REJECTED'),
});

// Schema for generating AI-powered service plans
export const servicesPlanGenerationSchema = z.object({
  clientId: z.string().required('Client ID is required'),
  needsAssessmentId: z.string().required('Needs assessment ID is required'),
  carePlanId: z.string().nullable().optional(),
  additionalContext: z.record(z.string(), z.any()).optional().default({}),
  optionsCount: z.number()
    .min(1, 'Options count must be at least 1')
    .max(5, 'Options count cannot exceed 5')
    .default(3),
});

// Schema for filtering and paginating service plans
export const servicesPlanFilterSchema = z.object({
  clientId: z.string().optional(),
  status: z.nativeEnum(PlanStatus, { errorMap: () => ({ message: 'Invalid status' }) }).optional(),
  createdById: z.string().optional(),
  approvedById: z.string().optional(),
  serviceType: z.nativeEnum(ServiceType, { errorMap: () => ({ message: 'Invalid service type' }) }).optional(),
  providerId: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  search: z.string().optional(),
  page: z.number().min(1, 'Page must be at least 1').default(1).optional(),
  limit: z.number().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(10).optional(),
  sortBy: z.string().default('createdAt').optional(),
  sortOrder: z.string()
    .optional()
    .refine(val => val === 'asc' || val === 'desc', 'Sort order must be either asc or desc')
    .default('desc'),
}).refine(
  data => !(data.fromDate && data.toDate) || new Date(data.fromDate) <= new Date(data.toDate),
  {
    message: 'From date must be before or equal to to date',
    path: ['fromDate'],
  }
);

// Schema for requesting cost estimates
export const costEstimateRequestSchema = z.object({
  servicesPlanId: z.string().optional(),
  clientId: z.string().required('Client ID is required'),
  services: z.array(serviceItemSchema).optional(),
  fundingSources: z.array(fundingSourceSchema).optional(),
}).refine(
  data => data.servicesPlanId || (data.services && data.services.length > 0),
  {
    message: 'Either servicesPlanId or services must be provided',
    path: ['services'],
  }
);