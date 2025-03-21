/**
 * User-related type definitions for the Revolucare platform
 * 
 * This file defines the TypeScript interfaces and types for user-related
 * data structures used throughout the application, including user profiles,
 * role-specific data models, and user preferences.
 */

import { Roles } from '../constants/roles';

/**
 * Core user entity with authentication and basic profile information
 */
export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: Roles;
  firstName: string;
  lastName: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User type without sensitive password information for safe client-side usage
 */
export type UserWithoutPassword = Omit<User, 'passwordHash'>;

/**
 * Union type for identifying a user by either ID or email
 */
export type UserIdentifier = { id: string } | { email: string };

/**
 * Structured address information used in user profiles
 */
export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

/**
 * Emergency contact information for client profiles
 */
export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email: string;
}

/**
 * Insurance information for client profiles
 */
export interface Insurance {
  provider: string;
  policyNumber: string;
  groupNumber: string;
  coverageDetails: {
    [key: string]: any;
  };
}

/**
 * Medical information for client profiles
 */
export interface MedicalInformation {
  conditions: string[];
  allergies: string[];
  medications: string[];
  notes: string;
}

/**
 * Extended profile information for users with the CLIENT role
 */
export interface ClientProfile {
  id: string;
  userId: string;
  dateOfBirth: Date | null;
  gender: string | null;
  address: Address | null;
  phone: string | null;
  emergencyContact: EmergencyContact | null;
  medicalInformation: MedicalInformation | null;
  insurance: Insurance | null;
  preferences: {
    [key: string]: any;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Extended profile information for users with the PROVIDER role
 */
export interface ProviderProfile {
  id: string;
  userId: string;
  organizationName: string;
  licenseNumber: string | null;
  licenseExpiration: Date | null;
  serviceTypes: string[];
  bio: string | null;
  specializations: string[];
  insuranceAccepted: string[];
  averageRating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Extended profile information for users with the CASE_MANAGER role
 */
export interface CaseManagerProfile {
  id: string;
  userId: string;
  certification: string | null;
  specialty: string | null;
  bio: string | null;
  assignedClients: string[] | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Extended profile information for users with the ADMINISTRATOR role
 */
export interface AdminProfile {
  id: string;
  userId: string;
  department: string | null;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Combined user and role-specific profile information
 */
export interface UserWithProfile {
  user: UserWithoutPassword;
  clientProfile: ClientProfile | null;
  providerProfile: ProviderProfile | null;
  caseManagerProfile: CaseManagerProfile | null;
  adminProfile: AdminProfile | null;
}

/**
 * User preferences for customizing the application experience
 */
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: NotificationPreferences;
  accessibility: AccessibilityPreferences;
  language: string;
}

/**
 * User preferences for notification delivery channels and types
 */
export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  inApp: boolean;
  types: Record<string, boolean>;
}

/**
 * User preferences for accessibility features
 */
export interface AccessibilityPreferences {
  fontSize: 'small' | 'medium' | 'large' | 'x-large';
  highContrast: boolean;
  reduceMotion: boolean;
  screenReader: boolean;
}