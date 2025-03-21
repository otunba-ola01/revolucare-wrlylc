/**
 * request.types.ts
 * 
 * This file defines TypeScript interfaces for request data structures used throughout
 * the Revolucare platform. It centralizes request type definitions to ensure consistency
 * across all API endpoints and services, providing type safety for request validation
 * and processing.
 */

import { Roles } from '../constants/roles';
import { PlanStatus } from '../constants/plan-statuses';
import { ServiceType } from '../constants/service-types';
import { DocumentType } from '../constants/document-types';
import { NotificationType } from '../constants/notification-types';

/**
 * Common pagination parameters for list endpoints
 */
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

/**
 * Login request data structure
 */
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe: boolean;
}

/**
 * User registration request data structure
 */
export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: Roles;
}

/**
 * Token refresh request data structure
 */
export interface RefreshTokenRequest {
  refreshToken: string;
}

/**
 * Password reset request data structure
 */
export interface PasswordResetRequest {
  email: string;
}

/**
 * Password reset confirmation request data structure
 */
export interface PasswordResetConfirmRequest {
  token: string;
  password: string;
}

/**
 * Email verification request data structure
 */
export interface VerifyEmailRequest {
  token: string;
}

/**
 * Password change request data structure
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/**
 * Profile update request data structure
 */
export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  phone: string;
  profileData: Record<string, any>;
}

/**
 * User preferences update request data structure
 */
export interface UpdatePreferencesRequest {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: NotificationPreferencesRequest;
  accessibility: AccessibilityPreferencesRequest;
}

/**
 * Notification preferences update request data structure
 */
export interface NotificationPreferencesRequest {
  channels: Record<string, boolean>;
  types: Record<string, { enabled: boolean; channels: string[] }>;
  quietHours: { enabled: boolean; start: string; end: string; timezone: string };
}

/**
 * Accessibility preferences update request data structure
 */
export interface AccessibilityPreferencesRequest {
  fontSize: 'small' | 'medium' | 'large' | 'x-large';
  highContrast: boolean;
  reducedMotion: boolean;
  screenReader: boolean;
}

/**
 * Care plan creation request data structure
 */
export interface CreateCarePlanDTO {
  clientId: string;
  title: string;
  description: string;
  goals: {
    description: string;
    targetDate?: Date;
    measures: string[];
  }[];
  interventions: {
    description: string;
    frequency: string;
    duration: string;
    responsibleParty: string;
  }[];
}

/**
 * Care plan update request data structure
 */
export interface UpdateCarePlanDTO {
  title: string;
  description: string;
  goals: {
    id?: string;
    description: string;
    targetDate?: Date;
    status?: string;
    measures: string[];
  }[];
  interventions: {
    id?: string;
    description: string;
    frequency: string;
    duration: string;
    responsibleParty: string;
    status?: string;
  }[];
  status: PlanStatus;
}

/**
 * Care plan approval request data structure
 */
export interface ApproveCarePlanDTO {
  approvalNotes: string;
}

/**
 * Care plan generation request data structure
 */
export interface GenerateCarePlanDTO {
  clientId: string;
  documentIds: string[];
  additionalContext: Record<string, any>;
  numberOfOptions: number;
}

/**
 * Care plan filtering parameters for list endpoints
 */
export interface CarePlanFilterParams {
  clientId: string;
  status: PlanStatus;
  createdById: string;
  fromDate: Date;
  toDate: Date;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

/**
 * Services plan creation request data structure
 */
export interface CreateServicesPlanDTO {
  clientId: string;
  title: string;
  description: string;
  needsAssessmentId: string;
  services: {
    serviceType: ServiceType;
    providerId?: string;
    description: string;
    frequency: string;
    duration: string;
    estimatedCost: number;
  }[];
  fundingSources: {
    name: string;
    type: string;
    coveragePercentage: number;
    coverageAmount: number;
  }[];
}

/**
 * Services plan update request data structure
 */
export interface UpdateServicesPlanDTO {
  title: string;
  description: string;
  services: {
    id?: string;
    serviceType: ServiceType;
    providerId?: string;
    description: string;
    frequency: string;
    duration: string;
    estimatedCost: number;
    status?: string;
  }[];
  fundingSources: {
    id?: string;
    name: string;
    type: string;
    coveragePercentage: number;
    coverageAmount: number;
    verificationStatus?: string;
  }[];
  status: PlanStatus;
}

/**
 * Services plan approval request data structure
 */
export interface ApproveServicesPlanDTO {
  approvalNotes: string;
}

/**
 * Services plan filtering parameters for list endpoints
 */
export interface ServicesPlanFilterParams {
  clientId: string;
  status: PlanStatus;
  createdById: string;
  fromDate: Date;
  toDate: Date;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

/**
 * Needs assessment creation request data structure
 */
export interface CreateNeedsAssessmentDTO {
  clientId: string;
  assessmentData: Record<string, any>;
  notes: string;
}

/**
 * Provider search parameters for search endpoints
 */
export interface ProviderSearchParams {
  serviceTypes: ServiceType[];
  location: { latitude: number; longitude: number };
  radius: number;
  availability: { startDate: Date; endDate: Date };
  insuranceAccepted: string[];
  minRating: number;
  specializations: string[];
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

/**
 * Provider matching request data structure
 */
export interface ProviderMatchingDTO {
  clientId: string;
  serviceTypes: ServiceType[];
  location: { latitude: number; longitude: number };
  radius: number;
  clientPreferences: Record<string, any>;
  requiredAvailability: { startDate: Date; endDate: Date };
  insuranceAccepted: string[];
}

/**
 * Provider profile update request data structure
 */
export interface UpdateProviderProfileDTO {
  organizationName: string;
  licenseNumber: string;
  licenseExpiration: Date;
  serviceTypes: ServiceType[];
  bio: string;
  specializations: string[];
  insuranceAccepted: string[];
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  phone: string;
}

/**
 * Provider availability update request data structure
 */
export interface UpdateAvailabilityDTO {
  providerId: string;
  slots: {
    startTime: Date;
    endTime: Date;
    status: 'available' | 'unavailable' | 'booked';
  }[];
  recurringSchedule: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    status: 'available' | 'unavailable';
  }[];
  exceptions: {
    date: Date;
    isAvailable: boolean;
    reason?: string;
  }[];
}

/**
 * Provider review creation request data structure
 */
export interface CreateProviderReviewDTO {
  providerId: string;
  rating: number;
  comment: string;
  serviceDate: Date;
  serviceType: ServiceType;
}

/**
 * Document upload request data structure
 */
export interface UploadDocumentDTO {
  name: string;
  type: DocumentType;
  metadata: {
    title: string;
    description?: string;
    tags: string[];
    category: string;
    documentDate?: Date;
    source?: string;
    isConfidential: boolean;
  };
}

/**
 * Document analysis request data structure
 */
export interface AnalyzeDocumentDTO {
  documentId: string;
  analysisType: string;
  options: Record<string, any>;
}

/**
 * Document filtering parameters for list endpoints
 */
export interface DocumentFilterParams {
  ownerId: string;
  type: DocumentType;
  category: string;
  tags: string[];
  fromDate: Date;
  toDate: Date;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

/**
 * Notification creation request data structure
 */
export interface CreateNotificationDTO {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, any>;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  channels: ('in_app' | 'email' | 'sms')[];
}

/**
 * Notification filtering parameters for list endpoints
 */
export interface NotificationFilterParams {
  userId: string;
  type: NotificationType;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  fromDate: Date;
  toDate: Date;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

/**
 * Metrics request data structure
 */
export interface MetricsRequestDTO {
  metricNames: string[];
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate: Date;
  endDate: Date;
  filters: Record<string, any>;
}

/**
 * Report generation request data structure
 */
export interface ReportRequestDTO {
  reportType: string;
  parameters: Record<string, any>;
  format: 'pdf' | 'csv' | 'excel';
  startDate: Date;
  endDate: Date;
}

/**
 * Data export request data structure
 */
export interface ExportRequestDTO {
  dataType: string;
  filters: Record<string, any>;
  format: 'csv' | 'json' | 'excel';
}

/**
 * Booking creation request data structure
 */
export interface CreateBookingDTO {
  clientId: string;
  providerId: string;
  serviceItemId: string;
  startTime: Date;
  endTime: Date;
  notes: string;
}

/**
 * Booking update request data structure
 */
export interface UpdateBookingDTO {
  startTime: Date;
  endTime: Date;
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  notes: string;
}

/**
 * Booking filtering parameters for list endpoints
 */
export interface BookingFilterParams {
  clientId: string;
  providerId: string;
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  fromDate: Date;
  toDate: Date;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}