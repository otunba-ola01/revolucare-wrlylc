/**
 * Zod validation schemas for care plan-related API requests
 * 
 * This file defines validation schemas for all care plan operations including creation,
 * updates, approvals, and filtering. These schemas ensure that all data sent to 
 * the API conforms to the expected formats and business rules before processing.
 */

import { z } from 'zod'; // zod@3.22.2
import { PlanStatus } from '../../constants/plan-statuses';
import { GoalStatus, InterventionStatus } from '../../types/care-plan.types';
import { validateId } from '../../utils/validation';

/**
 * Schema for validating care plan creation requests
 * 
 * Enforces required fields and validation rules for creating a new care plan,
 * including goals and interventions with their respective requirements.
 */
export const createCarePlanSchema = z.object({
  // Client for whom the care plan is being created
  clientId: z.string().refine(validateId, {
    message: 'Client ID is required and must be a valid UUID'
  }),
  
  // Title of the care plan
  title: z.string().min(3, {
    message: 'Title is required and must be at least 3 characters'
  }).max(100, {
    message: 'Title must not exceed 100 characters'
  }),
  
  // Detailed description of the care plan
  description: z.string().min(10, {
    message: 'Description is required and must be at least 10 characters'
  }).max(1000, {
    message: 'Description must not exceed 1000 characters'
  }),
  
  // Array of goals to be achieved through the care plan
  goals: z.array(
    z.object({
      description: z.string().min(10, {
        message: 'Goal description is required and must be at least 10 characters'
      }).max(500, {
        message: 'Goal description must not exceed 500 characters'
      }),
      targetDate: z.coerce.date().optional().refine(
        date => !date || date > new Date(), {
          message: 'Target date must be in the future'
        }
      ),
      status: z.nativeEnum(GoalStatus).optional().default(GoalStatus.PENDING),
      measures: z.array(
        z.string().min(5, {
          message: 'Each measure must be at least 5 characters'
        }).max(200, {
          message: 'Each measure must not exceed 200 characters'
        })
      ).min(1, {
        message: 'At least one measure is required for each goal'
      })
    })
  ).min(1, {
    message: 'At least one goal is required'
  }),
  
  // Array of interventions to implement the care plan
  interventions: z.array(
    z.object({
      description: z.string().min(10, {
        message: 'Intervention description is required and must be at least 10 characters'
      }).max(500, {
        message: 'Intervention description must not exceed 500 characters'
      }),
      frequency: z.string().min(3, {
        message: 'Frequency is required and must be at least 3 characters'
      }).max(100, {
        message: 'Frequency must not exceed 100 characters'
      }),
      duration: z.string().min(3, {
        message: 'Duration is required and must be at least 3 characters'
      }).max(100, {
        message: 'Duration must not exceed 100 characters'
      }),
      responsibleParty: z.string().min(3, {
        message: 'Responsible party is required and must be at least 3 characters'
      }).max(100, {
        message: 'Responsible party must not exceed 100 characters'
      }),
      status: z.nativeEnum(InterventionStatus).optional().default(InterventionStatus.PENDING),
    })
  ).min(1, {
    message: 'At least one intervention is required'
  })
});

/**
 * Schema for validating care plan update requests
 * 
 * All fields are optional since updates may modify only specific aspects
 * of a care plan, but all provided fields must meet validation requirements.
 */
export const updateCarePlanSchema = z.object({
  // Optional updated title
  title: z.string().min(3, {
    message: 'Title must be at least 3 characters'
  }).max(100, {
    message: 'Title must not exceed 100 characters'
  }).optional(),
  
  // Optional updated description
  description: z.string().min(10, {
    message: 'Description must be at least 10 characters'
  }).max(1000, {
    message: 'Description must not exceed 1000 characters'
  }).optional(),
  
  // Optional updated status
  status: z.nativeEnum(PlanStatus).optional(),
  
  // Optional updated goals array
  goals: z.array(
    z.object({
      // Optional ID for existing goals being updated
      id: z.string().refine(validateId, {
        message: 'Goal ID must be a valid UUID'
      }).optional(),
      description: z.string().min(10, {
        message: 'Goal description is required and must be at least 10 characters'
      }).max(500, {
        message: 'Goal description must not exceed 500 characters'
      }),
      targetDate: z.coerce.date().optional().refine(
        date => !date || date > new Date(), {
          message: 'Target date must be in the future'
        }
      ),
      status: z.nativeEnum(GoalStatus).optional(),
      measures: z.array(
        z.string().min(5, {
          message: 'Each measure must be at least 5 characters'
        }).max(200, {
          message: 'Each measure must not exceed 200 characters'
        })
      ).min(1, {
        message: 'At least one measure is required for each goal'
      })
    })
  ).min(1, {
    message: 'At least one goal is required if goals are provided'
  }).optional(),
  
  // Optional updated interventions array
  interventions: z.array(
    z.object({
      // Optional ID for existing interventions being updated
      id: z.string().refine(validateId, {
        message: 'Intervention ID must be a valid UUID'
      }).optional(),
      description: z.string().min(10, {
        message: 'Intervention description is required and must be at least 10 characters'
      }).max(500, {
        message: 'Intervention description must not exceed 500 characters'
      }),
      frequency: z.string().min(3, {
        message: 'Frequency is required and must be at least 3 characters'
      }).max(100, {
        message: 'Frequency must not exceed 100 characters'
      }),
      duration: z.string().min(3, {
        message: 'Duration is required and must be at least 3 characters'
      }).max(100, {
        message: 'Duration must not exceed 100 characters'
      }),
      responsibleParty: z.string().min(3, {
        message: 'Responsible party is required and must be at least 3 characters'
      }).max(100, {
        message: 'Responsible party must not exceed 100 characters'
      }),
      status: z.nativeEnum(InterventionStatus).optional()
    })
  ).min(1, {
    message: 'At least one intervention is required if interventions are provided'
  }).optional()
});

/**
 * Schema for validating care plan approval requests
 * 
 * Validates the approval notes that can be included when approving a care plan.
 */
export const approveCarePlanSchema = z.object({
  // Optional notes from the approver
  approvalNotes: z.string().max(500, {
    message: 'Approval notes must not exceed 500 characters'
  }).optional()
});

/**
 * Schema for validating AI care plan generation requests
 * 
 * Validates the required inputs for generating care plan options using AI.
 */
export const generateCarePlanSchema = z.object({
  // Client for whom to generate the care plan
  clientId: z.string().refine(validateId, {
    message: 'Client ID is required and must be a valid UUID'
  }),
  
  // Document IDs to analyze for care plan generation
  documentIds: z.array(
    z.string().refine(validateId, {
      message: 'Each document ID must be a valid UUID'
    })
  ).min(1, {
    message: 'At least one document ID is required'
  }),
  
  // Optional additional context to guide AI generation
  additionalContext: z.record(z.any()).optional()
});

/**
 * Schema for validating care plan URL parameters
 * 
 * Validates parameters used in URL paths for care plan endpoints.
 */
export const carePlanParamsSchema = z.object({
  // Care plan ID in URL params
  id: z.string().refine(validateId, {
    message: 'Care plan ID is required and must be a valid UUID'
  })
});

/**
 * Schema for validating care plan filter and pagination parameters
 * 
 * Validates query parameters used for filtering and paginating care plan lists.
 */
export const carePlanFilterSchema = z.object({
  // Optional client ID filter
  clientId: z.string().refine(validateId, {
    message: 'Client ID must be a valid UUID'
  }).optional(),
  
  // Optional status filter
  status: z.nativeEnum(PlanStatus).optional(),
  
  // Optional creator ID filter
  createdById: z.string().refine(validateId, {
    message: 'Creator ID must be a valid UUID'
  }).optional(),
  
  // Optional approver ID filter
  approvedById: z.string().refine(validateId, {
    message: 'Approver ID must be a valid UUID'
  }).optional(),
  
  // Optional date range filters
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  
  // Optional text search filter
  search: z.string().optional(),
  
  // Pagination parameters
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  
  // Sorting parameters
  sortBy: z.enum(['createdAt', 'updatedAt', 'title', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});