import { User } from './user';
import { CarePlan } from './care-plan';
import { Document } from './document';
import { Provider } from './provider';
import { Notification } from './notification';

/**
 * Generic interface for successful API responses with data of type T
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string | null;
  timestamp: string;
}

/**
 * Interface for API error responses with detailed error information
 */
export interface ErrorResponse {
  success: boolean;
  error: ErrorDetails;
  timestamp: string;
}

/**
 * Detailed error information for API error responses
 */
export interface ErrorDetails {
  code: string;
  message: string;
  status: number;
  details: Record<string, any> | null;
  path: string | null;
}

/**
 * Interface for field-level validation errors in API responses
 */
export interface ValidationError {
  field: string;
  message: string;
  value: any;
}

/**
 * Common pagination parameters for API requests that return lists of items
 */
export interface PaginatedRequest {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

/**
 * Generic interface for paginated API responses with items of type T
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

/**
 * Pagination metadata for paginated API responses
 */
export interface PaginationInfo {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Common filtering options for API requests that return filtered lists
 */
export interface FilterOptions {
  search: string;
  filters: Record<string, any>;
  dateRange: { startDate: string; endDate: string };
}

/**
 * Configuration options for API requests
 */
export interface ApiRequestConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: any;
  params?: Record<string, any>;
  headers?: Record<string, string>;
  timeout?: number;
  withCredentials?: boolean;
}

/**
 * Common options for API requests
 */
export interface ApiOptions {
  headers?: Record<string, string>;
  timeout?: number;
  withCredentials?: boolean;
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer';
  signal?: AbortSignal;
}

/**
 * API response containing user data
 */
export interface UserResponse {
  user: User;
}

/**
 * API response containing care plan data
 */
export interface CarePlanResponse {
  carePlan: CarePlan;
}

/**
 * API response containing document data
 */
export interface DocumentResponse {
  document: Document;
}

/**
 * API response containing provider data
 */
export interface ProviderResponse {
  provider: Provider;
}

/**
 * API response containing notification data
 */
export interface NotificationResponse {
  notification: Notification;
}

/**
 * API response containing a paginated list of users
 */
export interface UsersResponse {
  users: User[];
  pagination: PaginationInfo;
}

/**
 * API response containing a paginated list of care plans
 */
export interface CarePlansResponse {
  carePlans: CarePlan[];
  pagination: PaginationInfo;
}

/**
 * API response containing a paginated list of documents
 */
export interface DocumentsResponse {
  documents: Document[];
  pagination: PaginationInfo;
}

/**
 * API response containing a paginated list of providers
 */
export interface ProvidersResponse {
  providers: Provider[];
  pagination: PaginationInfo;
}

/**
 * API response containing a paginated list of notifications
 */
export interface NotificationsResponse {
  notifications: Notification[];
  pagination: PaginationInfo;
}

/**
 * Simple success response for operations that don't return data
 */
export interface SuccessResponse {
  success: boolean;
  message: string;
}

/**
 * Response structure for API health check endpoint
 */
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  version: string;
  timestamp: string;
  services: Record<string, { status: 'up' | 'down' | 'degraded'; message?: string }>;
}

/**
 * Enum of standard error codes used in API error responses
 */
export enum ErrorCode {
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  UNPROCESSABLE_ENTITY = 'UNPROCESSABLE_ENTITY',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  GATEWAY_TIMEOUT = 'GATEWAY_TIMEOUT'
}

/**
 * Type alias for HTTP methods used in API requests
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Type alias for sort order in paginated requests
 */
export type SortOrder = 'asc' | 'desc';

/**
 * Enum of API endpoint base paths for constructing API URLs
 */
export enum ApiEndpoint {
  AUTH = '/api/auth',
  USERS = '/api/users',
  CARE_PLANS = '/api/care-plans',
  SERVICES_PLANS = '/api/services-plans',
  PROVIDERS = '/api/providers',
  DOCUMENTS = '/api/documents',
  NOTIFICATIONS = '/api/notifications',
  ANALYTICS = '/api/analytics',
  HEALTH = '/api/health'
}