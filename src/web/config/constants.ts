/**
 * Global constants for the Revolucare web application
 * This file centralizes configuration values used throughout the application
 * to ensure consistency across components and features.
 */

/**
 * API endpoint paths for all backend services
 */
export const API_ENDPOINTS = {
  // Authentication endpoints
  AUTH: {
    REGISTER: '/api/auth/register',
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
    PASSWORD_RESET: '/api/auth/password-reset',
    PASSWORD_RESET_CONFIRM: '/api/auth/password-reset/confirm',
  },
  
  // User management endpoints
  USERS: {
    PROFILE: '/api/users/profile',
    PREFERENCES: '/api/users/preferences',
    DOCUMENTS: '/api/users/documents',
  },
  
  // Care plan endpoints
  CARE_PLANS: {
    ANALYZE: '/api/care-plans/analyze',
    GENERATE: '/api/care-plans/generate',
    BASE: '/api/care-plans',
    BY_ID: '/api/care-plans/:id',
    APPROVE: '/api/care-plans/:id/approve',
    HISTORY: '/api/care-plans/:id/history',
  },
  
  // Services plan endpoints
  SERVICES_PLANS: {
    ASSESS: '/api/services-plans/assess',
    GENERATE: '/api/services-plans/generate',
    BASE: '/api/services-plans',
    BY_ID: '/api/services-plans/:id',
    COSTS: '/api/services-plans/:id/costs',
    FUNDING: '/api/services-plans/:id/funding',
    PROVIDERS: '/api/services-plans/providers',
  },
  
  // Provider endpoints
  PROVIDERS: {
    SEARCH: '/api/providers/search',
    BASE: '/api/providers',
    BY_ID: '/api/providers/:id',
    AVAILABILITY: '/api/providers/availability',
    MATCH: '/api/providers/match',
    REVIEWS: '/api/providers/:id/reviews',
  },
  
  // Document endpoints
  DOCUMENTS: {
    UPLOAD: '/api/documents/upload',
    BASE: '/api/documents',
    BY_ID: '/api/documents/:id',
    ANALYZE: '/api/documents/:id/analyze',
  },
  
  // Notification endpoints
  NOTIFICATIONS: {
    BASE: '/api/notifications',
    MARK_READ: '/api/notifications/:id/read',
    PREFERENCES: '/api/notifications/preferences',
  },
  
  // Analytics endpoints
  ANALYTICS: {
    DASHBOARD: '/api/analytics/dashboard',
    METRICS: '/api/analytics/metrics',
    REPORTS: '/api/analytics/reports',
    EXPORT: '/api/analytics/export',
  },
};

/**
 * Pagination settings for data tables and lists
 */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  DEFAULT_PAGE: 1,
  PAGE_SIZE_OPTIONS: [5, 10, 25, 50, 100],
  MAX_PAGE_SIZE: 100,
};

/**
 * Date and time format strings for consistent date display
 */
export const DATE_FORMATS = {
  DISPLAY_DATE: 'MMM DD, YYYY',  // e.g., Jan 01, 2023
  DISPLAY_DATETIME: 'MMM DD, YYYY h:mm A',  // e.g., Jan 01, 2023 2:30 PM
  DISPLAY_TIME: 'h:mm A',  // e.g., 2:30 PM
  API_DATE: 'YYYY-MM-DD',  // ISO format for API requests
  CALENDAR_DATE: 'YYYY-MM-DD',  // ISO format for calendar components
};

/**
 * Validation rules and constraints for form inputs
 */
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 12,
  PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/,
  EMAIL_REGEX: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  PHONE_REGEX: /^\(\d{3}\) \d{3}-\d{4}$/,
  ZIP_CODE_REGEX: /^\d{5}(-\d{4})?$/,
  MAX_FILE_SIZE: 10 * 1024 * 1024,  // 10MB in bytes
};

/**
 * Timeout values for various operations in milliseconds
 */
export const TIMEOUTS = {
  API_REQUEST: 30000,  // 30 seconds
  DEBOUNCE: 300,  // 300 milliseconds
  TOAST_DURATION: 5000,  // 5 seconds
  SESSION_EXPIRY_WARNING: 5 * 60 * 1000,  // 5 minutes
  ANIMATION_DURATION: 300,  // 300 milliseconds
};

/**
 * Keys for browser local storage items
 */
export const LOCAL_STORAGE_KEYS = {
  THEME: 'revolucare-theme',
  LANGUAGE: 'revolucare-language',
  USER_PREFERENCES: 'revolucare-user-preferences',
  LAST_VIEWED_CARE_PLAN: 'revolucare-last-care-plan',
  LAST_VIEWED_SERVICE_PLAN: 'revolucare-last-service-plan',
};

/**
 * Status constants for care plans and service plans
 * Based on the state transition diagram from the technical specification
 */
export const PLAN_STATUSES = {
  DRAFT: 'draft',
  IN_REVIEW: 'in_review',
  APPROVED: 'approved',
  ACTIVE: 'active',
  UNDER_REVIEW: 'under_review',
  REVISED: 'revised',
  ON_HOLD: 'on_hold',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REJECTED: 'rejected',
  TERMINATED: 'terminated',
  SUPERSEDED: 'superseded',
};

/**
 * Service type constants for service plans and provider matching
 */
export const SERVICE_TYPES = {
  PHYSICAL_THERAPY: 'physical_therapy',
  OCCUPATIONAL_THERAPY: 'occupational_therapy',
  SPEECH_THERAPY: 'speech_therapy',
  BEHAVIORAL_THERAPY: 'behavioral_therapy',
  COUNSELING: 'counseling',
  HOME_HEALTH_AIDE: 'home_health_aide',
  PERSONAL_CARE_ASSISTANT: 'personal_care_assistant',
  RESPITE_CARE: 'respite_care',
  TRANSPORTATION: 'transportation',
  MEAL_DELIVERY: 'meal_delivery',
  NUTRITIONAL_COUNSELING: 'nutritional_counseling',
  MEDICATION_MANAGEMENT: 'medication_management',
  ASSISTIVE_TECHNOLOGY: 'assistive_technology',
  HOME_MODIFICATION: 'home_modification',
  VOCATIONAL_REHABILITATION: 'vocational_rehabilitation',
  RECREATIONAL_THERAPY: 'recreational_therapy',
  SUPPORT_GROUP: 'support_group',
  CASE_MANAGEMENT: 'case_management',
  INITIAL_ASSESSMENT: 'initial_assessment',
  FOLLOW_UP_CONSULTATION: 'follow_up_consultation',
};

/**
 * Human-readable labels for service types
 */
export const SERVICE_TYPE_LABELS = {
  PHYSICAL_THERAPY: 'Physical Therapy',
  OCCUPATIONAL_THERAPY: 'Occupational Therapy',
  SPEECH_THERAPY: 'Speech Therapy',
  BEHAVIORAL_THERAPY: 'Behavioral Therapy',
  COUNSELING: 'Counseling',
  HOME_HEALTH_AIDE: 'Home Health Aide',
  PERSONAL_CARE_ASSISTANT: 'Personal Care Assistant',
  RESPITE_CARE: 'Respite Care',
  TRANSPORTATION: 'Transportation',
  MEAL_DELIVERY: 'Meal Delivery',
  NUTRITIONAL_COUNSELING: 'Nutritional Counseling',
  MEDICATION_MANAGEMENT: 'Medication Management',
  ASSISTIVE_TECHNOLOGY: 'Assistive Technology',
  HOME_MODIFICATION: 'Home Modification',
  VOCATIONAL_REHABILITATION: 'Vocational Rehabilitation',
  RECREATIONAL_THERAPY: 'Recreational Therapy',
  SUPPORT_GROUP: 'Support Group',
  CASE_MANAGEMENT: 'Case Management',
  INITIAL_ASSESSMENT: 'Initial Assessment',
  FOLLOW_UP_CONSULTATION: 'Follow-up Consultation',
};

/**
 * Document type constants for document management
 */
export const DOCUMENT_TYPES = {
  MEDICAL_RECORD: 'medical_record',
  ASSESSMENT: 'assessment',
  CARE_PLAN: 'care_plan',
  SERVICES_PLAN: 'services_plan',
  PRESCRIPTION: 'prescription',
  INSURANCE: 'insurance',
  CONSENT_FORM: 'consent_form',
  IDENTIFICATION: 'identification',
  PROVIDER_CREDENTIAL: 'provider_credential',
  OTHER: 'other',
};

/**
 * Human-readable labels for document types
 */
export const DOCUMENT_TYPE_LABELS = {
  MEDICAL_RECORD: 'Medical Record',
  ASSESSMENT: 'Assessment',
  CARE_PLAN: 'Care Plan',
  SERVICES_PLAN: 'Services Plan',
  PRESCRIPTION: 'Prescription',
  INSURANCE: 'Insurance Documentation',
  CONSENT_FORM: 'Consent Form',
  IDENTIFICATION: 'Identification Document',
  PROVIDER_CREDENTIAL: 'Provider Credential',
  OTHER: 'Other Document',
};

/**
 * Notification type constants for the notification system
 */
export const NOTIFICATION_TYPES = {
  APPOINTMENT_REMINDER: 'appointment_reminder',
  CARE_PLAN_CREATED: 'care_plan_created',
  CARE_PLAN_UPDATED: 'care_plan_updated',
  CARE_PLAN_APPROVED: 'care_plan_approved',
  SERVICE_PLAN_CREATED: 'service_plan_created',
  SERVICE_PLAN_UPDATED: 'service_plan_updated',
  SERVICE_PLAN_APPROVED: 'service_plan_approved',
  PROVIDER_MATCHED: 'provider_matched',
  PROVIDER_AVAILABILITY: 'provider_availability',
  DOCUMENT_UPLOADED: 'document_uploaded',
  DOCUMENT_ANALYZED: 'document_analyzed',
  MESSAGE_RECEIVED: 'message_received',
  PAYMENT_PROCESSED: 'payment_processed',
  PAYMENT_FAILED: 'payment_failed',
  ACCOUNT_CREATED: 'account_created',
  ACCOUNT_VERIFIED: 'account_verified',
  PASSWORD_RESET: 'password_reset',
  SYSTEM_UPDATE: 'system_update',
};

/**
 * Priority levels for notifications
 */
export const NOTIFICATION_PRIORITIES = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent',
};

/**
 * Standardized error messages for the application
 */
export const ERROR_MESSAGES = {
  GENERIC_ERROR: 'An error occurred. Please try again.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  AUTHENTICATION_ERROR: 'Authentication failed. Please log in again.',
  AUTHORIZATION_ERROR: 'You do not have permission to perform this action.',
  NOT_FOUND_ERROR: 'The requested resource was not found.',
  SERVER_ERROR: 'A server error occurred. Please try again later.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  TIMEOUT_ERROR: 'The request timed out. Please try again.',
};

/**
 * Standardized success messages for the application
 */
export const SUCCESS_MESSAGES = {
  SAVE_SUCCESS: 'Changes saved successfully.',
  UPDATE_SUCCESS: 'Updated successfully.',
  DELETE_SUCCESS: 'Deleted successfully.',
  CREATE_SUCCESS: 'Created successfully.',
  UPLOAD_SUCCESS: 'Uploaded successfully.',
  SUBMIT_SUCCESS: 'Submitted successfully.',
};

/**
 * Analytics metric types for the analytics dashboard
 */
export const ANALYTICS_METRICS = {
  USER_ACTIVITY: 'user_activity',
  CARE_PLAN_COMPLETION: 'care_plan_completion',
  PROVIDER_PERFORMANCE: 'provider_performance',
  SERVICE_UTILIZATION: 'service_utilization',
  CLIENT_OUTCOMES: 'client_outcomes',
  SYSTEM_HEALTH: 'system_health',
};

/**
 * User role constants for role-based access control
 */
export const ROLES = {
  CLIENT: 'client',
  PROVIDER: 'provider',
  CASE_MANAGER: 'case_manager',
  ADMINISTRATOR: 'administrator',
};

/**
 * Application route paths for navigation
 */
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  CARE_PLANS: '/care-plans',
  SERVICES_PLANS: '/services-plans',
  PROVIDERS: '/providers',
  DOCUMENTS: '/documents',
  PROFILE: '/profile',
  NOTIFICATIONS: '/notifications',
  SETTINGS: '/settings',
  ANALYTICS: '/analytics',
};