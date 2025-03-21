import { z } from 'zod';
import { UserRole } from '../../types/user';

// Regular expressions for validation
const phoneRegex = /^\+?[1-9]\d{1,14}$/; // E.164 standard for phone numbers
const zipCodeRegex = /^\d{5}(-\d{4})?$/; // US ZIP code format

// Date of birth validation schema
const dateOfBirthSchema = z.string().refine((value) => {
  // Check if value is a valid date
  const date = new Date(value);
  if (isNaN(date.getTime())) return false;
  
  // Check if the person is at least 18 years old
  const today = new Date();
  const eighteenYearsAgo = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  return date <= eighteenYearsAgo;
}, { message: 'You must be at least 18 years old and provide a valid date' });

// Address validation schema
export const addressSchema = z.object({
  street: z.string()
    .min(3, 'Street address must be at least 3 characters')
    .max(100, 'Street address cannot exceed 100 characters')
    .nonempty('Street address is required'),
  city: z.string()
    .min(2, 'City must be at least 2 characters')
    .max(50, 'City cannot exceed 50 characters')
    .nonempty('City is required'),
  state: z.string()
    .length(2, 'State must be a 2-letter code')
    .nonempty('State is required'),
  zipCode: z.string()
    .regex(zipCodeRegex, 'Please enter a valid ZIP code')
    .nonempty('ZIP code is required'),
  country: z.string().default('United States').optional(),
});

// Emergency contact validation schema
export const emergencyContactSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters')
    .nonempty('Emergency contact name is required'),
  relationship: z.string()
    .min(2, 'Relationship must be at least 2 characters')
    .max(50, 'Relationship cannot exceed 50 characters')
    .nonempty('Relationship is required'),
  phone: z.string()
    .regex(phoneRegex, 'Please enter a valid phone number')
    .nonempty('Phone number is required'),
  email: z.string()
    .email('Please enter a valid email address')
    .optional(),
});

// Insurance validation schema
export const insuranceSchema = z.object({
  provider: z.string()
    .min(2, 'Provider name must be at least 2 characters')
    .max(100, 'Provider name cannot exceed 100 characters')
    .nonempty('Insurance provider is required'),
  policyNumber: z.string()
    .min(5, 'Policy number must be at least 5 characters')
    .max(50, 'Policy number cannot exceed 50 characters')
    .nonempty('Policy number is required'),
  groupNumber: z.string()
    .max(50, 'Group number cannot exceed 50 characters')
    .optional(),
  coverageDetails: z.record(z.any()).optional().default({}),
});

// Medical information validation schema
export const medicalInformationSchema = z.object({
  conditions: z.array(z.string()).optional().default([]),
  allergies: z.array(z.string()).optional().default([]),
  medications: z.array(z.string()).optional().default([]),
  notes: z.string()
    .max(1000, 'Notes cannot exceed 1000 characters')
    .optional(),
});

// Client profile validation schema
export const clientProfileSchema = z.object({
  dateOfBirth: dateOfBirthSchema
    .nonempty('Date of birth is required'),
  gender: z.enum(['male', 'female', 'non-binary', 'prefer-not-to-say', 'other'], {
    errorMap: () => ({ message: 'Please select a valid gender' })
  }).optional().nullable(),
  address: addressSchema.optional().nullable(),
  phone: z.string()
    .regex(phoneRegex, 'Please enter a valid phone number')
    .optional().nullable(),
  emergencyContact: emergencyContactSchema.optional().nullable(),
  medicalInformation: medicalInformationSchema.optional().nullable(),
  insurance: insuranceSchema.optional().nullable(),
  preferences: z.record(z.any()).optional().nullable().default({}),
});

// Provider profile validation schema
export const providerProfileSchema = z.object({
  organizationName: z.string()
    .min(2, 'Organization name must be at least 2 characters')
    .max(100, 'Organization name cannot exceed 100 characters')
    .nonempty('Organization name is required'),
  licenseNumber: z.string()
    .min(5, 'License number must be at least 5 characters')
    .max(50, 'License number cannot exceed 50 characters')
    .optional().nullable(),
  licenseExpiration: z.string()
    .refine((value) => {
      if (!value) return true; // Optional field
      const date = new Date(value);
      return !isNaN(date.getTime()) && date > new Date();
    }, 'Please enter a valid expiration date in the future')
    .optional().nullable(),
  serviceTypes: z.array(z.string())
    .min(1, 'Please select at least one service type'),
  bio: z.string()
    .max(1000, 'Bio cannot exceed 1000 characters')
    .optional().nullable(),
  specializations: z.array(z.string()).optional().default([]),
  insuranceAccepted: z.array(z.string()).optional().default([]),
});

// Case manager profile validation schema
export const caseManagerProfileSchema = z.object({
  certification: z.string()
    .max(100, 'Certification cannot exceed 100 characters')
    .optional().nullable(),
  specialty: z.string()
    .max(100, 'Specialty cannot exceed 100 characters')
    .optional().nullable(),
  bio: z.string()
    .max(1000, 'Bio cannot exceed 1000 characters')
    .optional().nullable(),
});

// Administrator profile validation schema
export const adminProfileSchema = z.object({
  department: z.string()
    .max(100, 'Department cannot exceed 100 characters')
    .optional().nullable(),
  permissions: z.array(z.string()).optional().default([]),
});

// Profile update validation schema
export const profileUpdateSchema = z.object({
  firstName: z.string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name cannot exceed 50 characters')
    .nonempty('First name is required'),
  lastName: z.string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name cannot exceed 50 characters')
    .nonempty('Last name is required'),
  profileData: z.union([
    clientProfileSchema,
    providerProfileSchema,
    caseManagerProfileSchema,
    adminProfileSchema
  ]).optional(),
}).refine(data => {
  // This validation would typically check that the profileData matches the user's role
  // In a real implementation, this would receive the user's role as context
  // and validate the profileData against the appropriate schema
  if (!data.profileData) return true;
  
  // In a complete implementation, we would do something like:
  // const role = context.userRole;
  // switch(role) {
  //   case UserRole.CLIENT:
  //     return clientProfileSchema.safeParse(data.profileData).success;
  //   case UserRole.PROVIDER:
  //     return providerProfileSchema.safeParse(data.profileData).success;
  //   ...etc
  // }
  
  return true;
}, { message: 'Invalid profile data for user role' });