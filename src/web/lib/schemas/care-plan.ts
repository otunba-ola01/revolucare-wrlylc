import { z } from 'zod';
import { PlanStatus } from '../../../backend/src/constants/plan-statuses';
import { GoalStatus, InterventionStatus } from '../../types/care-plan';

/**
 * Maximum allowed length for care plan titles
 */
export const MAX_TITLE_LENGTH = 100;

/**
 * Maximum allowed length for care plan descriptions
 */
export const MAX_DESCRIPTION_LENGTH = 1000;

/**
 * Maximum number of goals allowed in a care plan
 */
export const MAX_GOALS = 20;

/**
 * Maximum number of interventions allowed in a care plan
 */
export const MAX_INTERVENTIONS = 30;

/**
 * Maximum allowed length for care plan approval notes
 */
export const MAX_APPROVAL_NOTES_LENGTH = 500;

/**
 * Schema for validating care plan goals
 * Used within the care plan form and for individual goal validations
 */
export const carePlanGoalSchema = z.object({
  id: z.string().optional(),
  description: z.string()
    .min(5, 'Goal description must be at least 5 characters')
    .max(200, 'Goal description cannot exceed 200 characters')
    .required('Goal description is required'),
  targetDate: z.union([z.string(), z.date(), z.null()]).optional().nullable(),
  status: z.nativeEnum(GoalStatus, { 
    errorMap: () => ({ message: 'Please select a valid goal status' }) 
  }).optional().default(GoalStatus.PENDING),
  measures: z.array(
    z.string()
      .min(3, 'Measure must be at least 3 characters')
      .max(100, 'Measure cannot exceed 100 characters')
  ).min(1, 'At least one measure is required').default([])
});

/**
 * Schema for validating care plan interventions
 * Used within the care plan form and for individual intervention validations
 */
export const carePlanInterventionSchema = z.object({
  id: z.string().optional(),
  description: z.string()
    .min(5, 'Intervention description must be at least 5 characters')
    .max(200, 'Intervention description cannot exceed 200 characters')
    .required('Intervention description is required'),
  frequency: z.string()
    .min(2, 'Frequency must be at least 2 characters')
    .max(50, 'Frequency cannot exceed 50 characters')
    .required('Frequency is required'),
  duration: z.string()
    .min(2, 'Duration must be at least 2 characters')
    .max(50, 'Duration cannot exceed 50 characters')
    .required('Duration is required'),
  responsibleParty: z.string()
    .min(2, 'Responsible party must be at least 2 characters')
    .max(100, 'Responsible party cannot exceed 100 characters')
    .required('Responsible party is required'),
  status: z.nativeEnum(InterventionStatus, {
    errorMap: () => ({ message: 'Please select a valid intervention status' })
  }).optional().default(InterventionStatus.PENDING)
});

/**
 * Schema for validating care plan creation and editing form
 * Used when creating a new care plan or updating an existing one
 */
export const carePlanFormSchema = z.object({
  clientId: z.string().required('Client is required'),
  title: z.string()
    .min(5, 'Title must be at least 5 characters')
    .max(MAX_TITLE_LENGTH, `Title cannot exceed ${MAX_TITLE_LENGTH} characters`)
    .required('Title is required'),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(MAX_DESCRIPTION_LENGTH, `Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters`)
    .required('Description is required'),
  goals: z.array(carePlanGoalSchema)
    .min(1, 'At least one goal is required')
    .max(MAX_GOALS, `Cannot exceed ${MAX_GOALS} goals`),
  interventions: z.array(carePlanInterventionSchema)
    .min(1, 'At least one intervention is required')
    .max(MAX_INTERVENTIONS, `Cannot exceed ${MAX_INTERVENTIONS} interventions`),
  status: z.nativeEnum(PlanStatus, {
    errorMap: () => ({ message: 'Please select a valid status' })
  }).default(PlanStatus.DRAFT)
});

/**
 * Schema for validating care plan approval/rejection
 * Used when case managers or administrators review care plans
 */
export const carePlanApprovalSchema = z.object({
  approvalNotes: z.string()
    .max(MAX_APPROVAL_NOTES_LENGTH, `Approval notes cannot exceed ${MAX_APPROVAL_NOTES_LENGTH} characters`)
    .optional(),
  status: z.nativeEnum(PlanStatus)
    .refine(val => val === PlanStatus.APPROVED || val === PlanStatus.REJECTED, 
      'Status must be either APPROVED or REJECTED')
    .required('Status is required')
});

/**
 * Schema for validating AI-powered care plan generation requests
 * Used when initiating the AI-assisted care plan creation process
 */
export const carePlanGenerationSchema = z.object({
  clientId: z.string().required('Client ID is required'),
  documentIds: z.array(z.string()).min(1, 'At least one document is required'),
  additionalContext: z.record(z.string(), z.any()).optional().default({}),
  includeOptions: z.boolean().default(true),
  optionsCount: z.number()
    .min(1, 'Options count must be at least 1')
    .max(5, 'Options count cannot exceed 5')
    .default(3)
});

/**
 * Schema for validating care plan filtering and pagination
 * Used when searching and listing care plans
 */
export const carePlanFilterSchema = z.object({
  clientId: z.string().optional(),
  status: z.nativeEnum(PlanStatus, {
    errorMap: () => ({ message: 'Invalid status' })
  }).optional(),
  createdById: z.string().optional(),
  approvedById: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  search: z.string().optional(),
  page: z.number()
    .min(1, 'Page must be at least 1')
    .default(1)
    .optional(),
  limit: z.number()
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(10)
    .optional(),
  sortBy: z.string().default('createdAt').optional(),
  sortOrder: z.string()
    .refine(val => val === 'asc' || val === 'desc', 'Sort order must be either asc or desc')
    .default('desc')
    .optional()
}).refine(data => !(data.fromDate && data.toDate) || new Date(data.fromDate) <= new Date(data.toDate), {
  message: 'From date must be before or equal to to date',
  path: ['fromDate']
});