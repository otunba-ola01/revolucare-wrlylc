/**
 * Type definitions barrel file for the Revolucare platform
 * 
 * This file serves as a centralized export point for all TypeScript types and interfaces
 * defined across the application. By re-exporting all types from their respective files,
 * it simplifies imports in other files and ensures consistent type usage throughout the application.
 * 
 * @module types
 */

// Export all AI-related type definitions
export * from './ai.types';

// Export all analytics-related type definitions
export * from './analytics.types';

// Export all care plan-related type definitions
export * from './care-plan.types';

// Export all document-related type definitions
export * from './document.types';

// Export all notification-related type definitions
export * from './notification.types';

// Export all provider-related type definitions
export * from './provider.types';

// Export all request-related type definitions
export * from './request.types';

// Export all response-related type definitions
export * from './response.types';

// Export all services plan-related type definitions
export * from './services-plan.types';

// Export all user-related type definitions
export * from './user.types';