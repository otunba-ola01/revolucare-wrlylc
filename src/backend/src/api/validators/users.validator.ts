/**
 * User validators for the Revolucare platform
 * This file contains Zod schemas to validate user-related API requests
 * @module validators/users
 * @version 1.0.0
 */

import { z } from 'zod'; // zod version 3.21.4
import { Roles } from '../../constants/roles';

/**
 * Validates user ID parameter in URL paths
 */
export const userIdSchema = z.object({
  id: z.string().uuid('Invalid user ID format')
});

/**
 * Validates basic user information updates
 */
export const userUpdateSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name is too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name is too long'),
  email: z.string().email('Invalid email format'),
  role: z.enum([Roles.CLIENT, Roles.PROVIDER, Roles.CASE_MANAGER, Roles.ADMINISTRATOR], {
    errorMap: () => ({ message: 'Invalid user role' })
  }).optional(),
  isVerified: z.boolean().optional()
}).strict();

/**
 * Validates address information in user profiles
 */
export const addressSchema = z.object({
  street: z.string().min(1, 'Street address is required').max(100, 'Street address is too long'),
  city: z.string().min(1, 'City is required').max(50, 'City name is too long'),
  state: z.string().min(1, 'State is required').max(50, 'State name is too long'),
  zipCode: z.string().min(1, 'ZIP code is required').max(20, 'ZIP code is too long'),
  country: z.string().min(1, 'Country is required').max(50, 'Country name is too long').default('United States')
}).strict();

/**
 * Validates emergency contact information for client profiles
 */
export const emergencyContactSchema = z.object({
  name: z.string().min(1, 'Emergency contact name is required').max(100, 'Name is too long'),
  relationship: z.string().min(1, 'Relationship is required').max(50, 'Relationship description is too long'),
  phone: z.string().min(7, 'Valid phone number is required').max(20, 'Phone number is too long'),
  email: z.string().email('Invalid email format').optional()
}).strict();

/**
 * Validates medical information for client profiles
 */
export const medicalInformationSchema = z.object({
  conditions: z.array(z.string()).default([]),
  allergies: z.array(z.string()).default([]),
  medications: z.array(z.string()).default([]),
  notes: z.string().max(1000, 'Notes are too long').optional()
}).strict();

/**
 * Validates insurance information for client profiles
 */
export const insuranceSchema = z.object({
  provider: z.string().min(1, 'Insurance provider is required').max(100, 'Provider name is too long'),
  policyNumber: z.string().min(1, 'Policy number is required').max(50, 'Policy number is too long'),
  groupNumber: z.string().max(50, 'Group number is too long').optional(),
  coverageDetails: z.record(z.string()).optional()
}).strict();

/**
 * Validates client-specific profile information
 */
export const clientProfileSchema = z.object({
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be in YYYY-MM-DD format'),
  gender: z.string().max(50, 'Gender description is too long').optional(),
  emergencyContact: emergencyContactSchema.optional(),
  medicalInformation: medicalInformationSchema.optional(),
  insurance: insuranceSchema.optional(),
  preferences: z.record(z.any()).optional()
}).strict();

/**
 * Validates provider-specific profile information
 */
export const providerProfileSchema = z.object({
  organizationName: z.string().min(1, 'Organization name is required').max(100, 'Organization name is too long'),
  licenseNumber: z.string().min(1, 'License number is required').max(50, 'License number is too long'),
  licenseExpiration: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'License expiration must be in YYYY-MM-DD format'),
  serviceTypes: z.array(z.string()).min(1, 'At least one service type is required'),
  bio: z.string().max(1000, 'Bio is too long').optional(),
  specializations: z.array(z.string()).default([]),
  insuranceAccepted: z.array(z.string()).default([])
}).strict();

/**
 * Validates case manager-specific profile information
 */
export const caseManagerProfileSchema = z.object({
  certification: z.string().min(1, 'Certification is required').max(100, 'Certification is too long'),
  specialty: z.string().min(1, 'Specialty is required').max(100, 'Specialty is too long'),
  bio: z.string().max(1000, 'Bio is too long').optional(),
  assignedClients: z.array(z.string().uuid('Invalid client ID')).default([])
}).strict();

/**
 * Validates administrator-specific profile information
 */
export const adminProfileSchema = z.object({
  department: z.string().min(1, 'Department is required').max(100, 'Department is too long'),
  permissions: z.array(z.string()).default([])
}).strict();

/**
 * Validates role-specific data based on user role
 */
export const roleSpecificDataSchema = z.object({
  client: clientProfileSchema.optional(),
  provider: providerProfileSchema.optional(),
  caseManager: caseManagerProfileSchema.optional(),
  administrator: adminProfileSchema.optional()
}).strict();

/**
 * Validates notification preferences for users
 */
export const notificationPreferencesSchema = z.object({
  email: z.boolean().default(true),
  sms: z.boolean().default(false),
  inApp: z.boolean().default(true),
  types: z.record(z.object({
    enabled: z.boolean().default(true),
    channels: z.array(z.enum(['email', 'sms', 'in_app'])).default(['email', 'in_app'])
  })).optional()
}).strict();

/**
 * Validates accessibility preferences for users
 */
export const accessibilityPreferencesSchema = z.object({
  fontSize: z.enum(['small', 'medium', 'large', 'x-large']).default('medium'),
  highContrast: z.boolean().default(false),
  reduceMotion: z.boolean().default(false),
  screenReader: z.boolean().default(false)
}).strict();

/**
 * Validates user preferences for application customization
 */
export const userPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  notifications: notificationPreferencesSchema.default({}),
  accessibility: accessibilityPreferencesSchema.default({}),
  language: z.string().default('en-US')
}).strict();

/**
 * Validates user profile update requests with role-specific profile data
 */
export const profileUpdateSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name is too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name is too long'),
  phone: z.string().min(7, 'Valid phone number is required').max(20, 'Phone number is too long').optional(),
  address: addressSchema.optional(),
  roleSpecificData: roleSpecificDataSchema.optional()
}).strict();

/**
 * Validates user search parameters for filtering and pagination
 */
export const userSearchSchema = z.object({
  query: z.string().optional(),
  role: z.enum([Roles.CLIENT, Roles.PROVIDER, Roles.CASE_MANAGER, Roles.ADMINISTRATOR]).optional(),
  isVerified: z.boolean().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
}).strict();

/**
 * Validates role parameter for role-based user queries
 */
export const userRoleSchema = z.object({
  role: z.enum([Roles.CLIENT, Roles.PROVIDER, Roles.CASE_MANAGER, Roles.ADMINISTRATOR])
}).strict();

/**
 * Validates pagination parameters for paginated endpoints
 */
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
}).strict();