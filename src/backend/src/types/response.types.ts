/**
 * Response type definitions for the Revolucare platform.
 * 
 * This file defines standardized response structures for all API endpoints,
 * ensuring consistent response format across the entire platform.
 */

import { ErrorCodes, ErrorCategories } from '../constants/error-codes';
import { 
  User, 
  UserContext, 
  ClientProfile, 
  ProviderProfile, 
  CaseManagerProfile, 
  AdminProfile 
} from './user.types';
import { 
  Metric, 
  Dashboard, 
  ReportResponse, 
  ExportResponse 
} from './analytics.types';
import { ValidationError } from '../interfaces/error.interface';

/**
 * Generic API response structure for all endpoints
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * Error response structure for API errors
 */
export interface ErrorResponse {
  success: boolean;
  message: string;
  error: {
    code: ErrorCodes;
    category: ErrorCategories;
    details?: Record<string, any>;
  };
  validationErrors?: ValidationError[];
}

/**
 * Paginated response structure for list endpoints
 */
export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

/**
 * Authentication response structure for login and token refresh
 */
export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    user: UserDTO;
  };
}

/**
 * Data transfer object for user information in responses
 */
export interface UserDTO {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isVerified: boolean;
  createdAt: Date;
}

/**
 * Response structure for user profile requests
 */
export interface UserProfileResponse {
  success: boolean;
  message: string;
  data: {
    user: UserDTO;
    profile: ClientProfileDTO | ProviderProfileDTO | CaseManagerProfileDTO | AdminProfileDTO;
  };
}

/**
 * Data transfer object for client profile information in responses
 */
export type ClientProfileDTO = Omit<ClientProfile, 'userId'>;

/**
 * Data transfer object for provider profile information in responses
 */
export type ProviderProfileDTO = Omit<ProviderProfile, 'userId'>;

/**
 * Data transfer object for case manager profile information in responses
 */
export type CaseManagerProfileDTO = Omit<CaseManagerProfile, 'userId'>;

/**
 * Data transfer object for admin profile information in responses
 */
export type AdminProfileDTO = Omit<AdminProfile, 'userId'>;

/**
 * Response structure for care plan requests
 */
export interface CarePlanResponse {
  success: boolean;
  message: string;
  data: CarePlanDTO;
}

/**
 * Data transfer object for care plan information in responses
 */
export interface CarePlanDTO {
  id: string;
  clientId: string;
  createdById: string;
  title: string;
  description: string;
  goals: CarePlanGoalDTO[];
  interventions: CarePlanInterventionDTO[];
  confidenceScore: number;
  status: string;
  version: number;
  previousVersionId: string | null;
  approvedBy: string | null;
  approvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Data transfer object for care plan goal information in responses
 */
export interface CarePlanGoalDTO {
  id: string;
  description: string;
  targetDate: Date | null;
  status: string;
  measures: string[];
}

/**
 * Data transfer object for care plan intervention information in responses
 */
export interface CarePlanInterventionDTO {
  id: string;
  description: string;
  frequency: string;
  duration: string;
  responsibleParty: string;
  status: string;
}

/**
 * Response structure for care plan generation requests
 */
export interface CarePlanOptionsResponse {
  success: boolean;
  message: string;
  data: {
    options: CarePlanDTO[];
    analysisResults: Record<string, any>;
  };
}

/**
 * Response structure for services plan requests
 */
export interface ServicesPlanResponse {
  success: boolean;
  message: string;
  data: ServicesPlanDTO;
}

/**
 * Data transfer object for services plan information in responses
 */
export interface ServicesPlanDTO {
  id: string;
  clientId: string;
  createdById: string;
  title: string;
  description: string;
  needsAssessmentId: string;
  services: ServiceItemDTO[];
  estimatedCost: number;
  fundingSources: FundingSourceDTO[];
  status: string;
  approvedBy: string | null;
  approvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Data transfer object for service item information in responses
 */
export interface ServiceItemDTO {
  id: string;
  serviceType: string;
  providerId: string | null;
  description: string;
  frequency: string;
  duration: string;
  estimatedCost: number;
  status: string;
}

/**
 * Data transfer object for funding source information in responses
 */
export interface FundingSourceDTO {
  id: string;
  name: string;
  type: string;
  coveragePercentage: number;
  coverageAmount: number;
  verificationStatus: string;
}

/**
 * Response structure for needs assessment requests
 */
export interface NeedsAssessmentResponse {
  success: boolean;
  message: string;
  data: NeedsAssessmentDTO;
}

/**
 * Data transfer object for needs assessment information in responses
 */
export interface NeedsAssessmentDTO {
  id: string;
  clientId: string;
  createdById: string;
  assessmentData: Record<string, any>;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Response structure for provider requests
 */
export interface ProviderResponse {
  success: boolean;
  message: string;
  data: ProviderDTO;
}

/**
 * Data transfer object for provider information in responses
 */
export interface ProviderDTO {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  organizationName: string;
  licenseNumber: string | null;
  licenseExpiration: Date | null;
  serviceTypes: string[];
  bio: string | null;
  specializations: string[];
  insuranceAccepted: string[];
  address: Record<string, any> | null;
  phone: string | null;
  averageRating: number;
  reviewCount: number;
  serviceAreas: ServiceAreaDTO[];
}

/**
 * Data transfer object for service area information in responses
 */
export interface ServiceAreaDTO {
  id: string;
  providerId: string;
  location: {
    latitude: number;
    longitude: number;
  };
  radius: number;
  description: string;
}

/**
 * Response structure for provider matching requests
 */
export interface ProviderMatchResponse {
  success: boolean;
  message: string;
  data: {
    matches: ProviderMatchDTO[];
    totalMatches: number;
  };
}

/**
 * Data transfer object for provider match information in responses
 */
export interface ProviderMatchDTO {
  provider: ProviderDTO;
  compatibilityScore: number;
  distance: number;
  nextAvailability: Date | null;
  matchFactors: Record<string, number>;
}

/**
 * Response structure for availability requests
 */
export interface AvailabilityResponse {
  success: boolean;
  message: string;
  data: AvailabilityDTO;
}

/**
 * Data transfer object for availability information in responses
 */
export interface AvailabilityDTO {
  providerId: string;
  slots: {
    id: string;
    startTime: Date;
    endTime: Date;
    status: string;
  }[];
  recurringSchedule: {
    id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    status: string;
  }[];
  exceptions: {
    id: string;
    date: Date;
    isAvailable: boolean;
    reason?: string;
  }[];
  lastUpdated: Date;
}

/**
 * Response structure for provider review requests
 */
export interface ProviderReviewResponse {
  success: boolean;
  message: string;
  data: ProviderReviewDTO;
}

/**
 * Data transfer object for provider review information in responses
 */
export interface ProviderReviewDTO {
  id: string;
  providerId: string;
  clientId: string;
  clientName: string;
  rating: number;
  comment: string;
  serviceDate: Date;
  serviceType: string;
  createdAt: Date;
}

/**
 * Response structure for document requests
 */
export interface DocumentResponse {
  success: boolean;
  message: string;
  data: DocumentDTO;
}

/**
 * Data transfer object for document information in responses
 */
export interface DocumentDTO {
  id: string;
  ownerId: string;
  name: string;
  type: string;
  mimeType: string;
  size: number;
  url: string;
  metadata: {
    title: string;
    description?: string;
    tags: string[];
    category: string;
    documentDate?: Date;
    source?: string;
    isConfidential: boolean;
  };
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Response structure for document analysis requests
 */
export interface DocumentAnalysisResponse {
  success: boolean;
  message: string;
  data: DocumentAnalysisDTO;
}

/**
 * Data transfer object for document analysis information in responses
 */
export interface DocumentAnalysisDTO {
  id: string;
  documentId: string;
  analysisType: string;
  status: string;
  results: Record<string, any>;
  confidence: number;
  processingTime: number;
  createdAt: Date;
  completedAt: Date | null;
}

/**
 * Response structure for notification requests
 */
export interface NotificationResponse {
  success: boolean;
  message: string;
  data: NotificationDTO;
}

/**
 * Data transfer object for notification information in responses
 */
export interface NotificationDTO {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, any> | null;
  priority: string;
  channels: string[];
  status: string;
  createdAt: Date;
  sentAt: Date | null;
  readAt: Date | null;
}

/**
 * Response structure for booking requests
 */
export interface BookingResponse {
  success: boolean;
  message: string;
  data: BookingDTO;
}

/**
 * Data transfer object for booking information in responses
 */
export interface BookingDTO {
  id: string;
  clientId: string;
  providerId: string;
  serviceItemId: string;
  startTime: Date;
  endTime: Date;
  status: string;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Response structure for metrics requests
 */
export interface MetricsResponse {
  success: boolean;
  message: string;
  data: {
    metrics: Metric[];
    period: string;
    startDate: Date;
    endDate: Date;
  };
}

/**
 * Response structure for dashboard requests
 */
export interface DashboardResponse {
  success: boolean;
  message: string;
  data: {
    dashboard: Dashboard;
    metrics: Metric[];
    period: string;
    startDate: Date;
    endDate: Date;
  };
}

/**
 * Response structure for report generation requests
 */
export interface ReportGenerationResponse {
  success: boolean;
  message: string;
  data: ReportResponse;
}

/**
 * Response structure for data export requests
 */
export interface ExportDataResponse {
  success: boolean;
  message: string;
  data: ExportResponse;
}