import { Roles } from '../config/roles';

/**
 * Type alias for user roles to maintain consistent naming convention in the frontend
 */
export type UserRole = Roles;

/**
 * Core user interface with authentication and basic profile information
 */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isVerified: boolean;
  profileComplete: boolean;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

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
  coverageDetails: Record<string, any>;
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
  dateOfBirth: string | null;
  gender: string | null;
  address: Address | null;
  phone: string | null;
  emergencyContact: EmergencyContact | null;
  medicalInformation: MedicalInformation | null;
  insurance: Insurance | null;
  preferences: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Extended profile information for users with the PROVIDER role
 */
export interface ProviderProfile {
  id: string;
  userId: string;
  organizationName: string;
  licenseNumber: string | null;
  licenseExpiration: string | null;
  serviceTypes: string[];
  bio: string | null;
  specializations: string[];
  insuranceAccepted: string[];
  averageRating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
  updatedAt: string;
}

/**
 * Extended profile information for users with the ADMINISTRATOR role
 */
export interface AdminProfile {
  id: string;
  userId: string;
  department: string | null;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Combined user and role-specific profile information
 */
export interface UserWithProfile {
  user: User;
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

/**
 * Request structure for updating user profile information
 */
export interface ProfileUpdateRequest {
  firstName: string;
  lastName: string;
  profileData: Partial<ClientProfile | ProviderProfile | CaseManagerProfile | AdminProfile>;
}

/**
 * Response structure for profile-related operations
 */
export interface ProfileResponse {
  user: User;
  profile: ClientProfile | ProviderProfile | CaseManagerProfile | AdminProfile | null;
  success: boolean;
  message: string;
}