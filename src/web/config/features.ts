/**
 * features.ts
 * 
 * Defines feature flags and feature configuration for the Revolucare web application. 
 * This file manages feature toggles, allowing for conditional enabling/disabling of features
 * across the application, as well as role-based feature access control.
 */

import { Roles } from './roles';

/**
 * Enum for feature keys in the system
 */
export enum FeatureKey {
  AI_CARE_PLAN_GENERATION = 'AI_CARE_PLAN_GENERATION',
  PROVIDER_MATCHING = 'PROVIDER_MATCHING',
  REAL_TIME_AVAILABILITY = 'REAL_TIME_AVAILABILITY',
  DOCUMENT_ANALYSIS = 'DOCUMENT_ANALYSIS',
  SERVICES_PLAN_GENERATOR = 'SERVICES_PLAN_GENERATOR',
  ANALYTICS_DASHBOARD = 'ANALYTICS_DASHBOARD',
  ADVANCED_ANALYTICS = 'ADVANCED_ANALYTICS',
  CALENDAR_INTEGRATION = 'CALENDAR_INTEGRATION',
  PAYMENT_PROCESSING = 'PAYMENT_PROCESSING',
  MULTI_FACTOR_AUTHENTICATION = 'MULTI_FACTOR_AUTHENTICATION',
  NOTIFICATIONS = 'NOTIFICATIONS',
  DARK_MODE = 'DARK_MODE'
}

/**
 * Interface defining the structure of feature configuration objects
 */
export interface FeatureConfig {
  /** Whether the feature is enabled in the system */
  enabled: boolean;
  /** Roles that are allowed to access this feature */
  allowedRoles: string[];
  /** Features that this feature depends on */
  dependencies: string[];
  /** Description of the feature */
  description: string;
}

/**
 * Feature configuration object defining the status and access control for all features
 */
export const features: Record<string, FeatureConfig> = {
  [FeatureKey.AI_CARE_PLAN_GENERATION]: {
    enabled: true,
    allowedRoles: [Roles.CASE_MANAGER, Roles.ADMINISTRATOR],
    dependencies: [FeatureKey.DOCUMENT_ANALYSIS],
    description: 'AI-powered analysis of medical records and generation of personalized care plans with options and confidence scores'
  },
  
  [FeatureKey.PROVIDER_MATCHING]: {
    enabled: true,
    allowedRoles: [Roles.CLIENT, Roles.CASE_MANAGER, Roles.ADMINISTRATOR],
    dependencies: [FeatureKey.REAL_TIME_AVAILABILITY],
    description: 'AI-driven matching of clients with appropriate providers based on needs, preferences, and compatibility'
  },
  
  [FeatureKey.REAL_TIME_AVAILABILITY]: {
    enabled: true,
    allowedRoles: [Roles.PROVIDER, Roles.CASE_MANAGER, Roles.ADMINISTRATOR, Roles.CLIENT],
    dependencies: [],
    description: 'Real-time tracking and display of provider availability, including calendar management and waiting time estimation'
  },
  
  [FeatureKey.DOCUMENT_ANALYSIS]: {
    enabled: true,
    allowedRoles: [Roles.CASE_MANAGER, Roles.ADMINISTRATOR],
    dependencies: [],
    description: 'AI analysis of uploaded medical documents to extract relevant information for care planning'
  },
  
  [FeatureKey.SERVICES_PLAN_GENERATOR]: {
    enabled: true,
    allowedRoles: [Roles.CASE_MANAGER, Roles.ADMINISTRATOR],
    dependencies: [FeatureKey.AI_CARE_PLAN_GENERATION],
    description: 'System that assesses client needs, matches appropriate services, and generates service plans with cost estimates'
  },
  
  [FeatureKey.ANALYTICS_DASHBOARD]: {
    enabled: true,
    allowedRoles: [Roles.ADMINISTRATOR, Roles.CASE_MANAGER, Roles.PROVIDER],
    dependencies: [],
    description: 'Role-specific analytics dashboards providing insights on service utilization, outcomes, and performance metrics'
  },
  
  [FeatureKey.ADVANCED_ANALYTICS]: {
    enabled: false, // Feature not enabled in MVP
    allowedRoles: [Roles.ADMINISTRATOR],
    dependencies: [FeatureKey.ANALYTICS_DASHBOARD],
    description: 'Advanced data analysis, predictive modeling, and custom report generation capabilities'
  },
  
  [FeatureKey.CALENDAR_INTEGRATION]: {
    enabled: true,
    allowedRoles: [Roles.PROVIDER, Roles.CLIENT, Roles.CASE_MANAGER, Roles.ADMINISTRATOR],
    dependencies: [FeatureKey.REAL_TIME_AVAILABILITY],
    description: 'Integration with external calendar systems (Google Calendar, Microsoft Outlook) for availability management'
  },
  
  [FeatureKey.PAYMENT_PROCESSING]: {
    enabled: true,
    allowedRoles: [Roles.CLIENT, Roles.PROVIDER, Roles.ADMINISTRATOR],
    dependencies: [],
    description: 'Secure payment processing for services, including insurance verification and billing'
  },
  
  [FeatureKey.MULTI_FACTOR_AUTHENTICATION]: {
    enabled: true,
    allowedRoles: [Roles.ADMINISTRATOR, Roles.CASE_MANAGER, Roles.PROVIDER, Roles.CLIENT],
    dependencies: [],
    description: 'Enhanced security with multi-factor authentication options including email, SMS, and authenticator apps'
  },
  
  [FeatureKey.NOTIFICATIONS]: {
    enabled: true,
    allowedRoles: [Roles.CLIENT, Roles.PROVIDER, Roles.CASE_MANAGER, Roles.ADMINISTRATOR],
    dependencies: [],
    description: 'Multi-channel notification system for alerts, reminders, and updates across the platform'
  },
  
  [FeatureKey.DARK_MODE]: {
    enabled: true,
    allowedRoles: [Roles.CLIENT, Roles.PROVIDER, Roles.CASE_MANAGER, Roles.ADMINISTRATOR],
    dependencies: [],
    description: 'Dark color theme option for reduced eye strain and accessibility'
  }
};

/**
 * Human-readable labels for feature keys for UI display
 */
export const featureLabels: Record<string, string> = {
  [FeatureKey.AI_CARE_PLAN_GENERATION]: 'AI Care Plan Generation',
  [FeatureKey.PROVIDER_MATCHING]: 'Provider Matching',
  [FeatureKey.REAL_TIME_AVAILABILITY]: 'Real-Time Availability',
  [FeatureKey.DOCUMENT_ANALYSIS]: 'Document Analysis',
  [FeatureKey.SERVICES_PLAN_GENERATOR]: 'Services Plan Generator',
  [FeatureKey.ANALYTICS_DASHBOARD]: 'Analytics Dashboard',
  [FeatureKey.ADVANCED_ANALYTICS]: 'Advanced Analytics',
  [FeatureKey.CALENDAR_INTEGRATION]: 'Calendar Integration',
  [FeatureKey.PAYMENT_PROCESSING]: 'Payment Processing',
  [FeatureKey.MULTI_FACTOR_AUTHENTICATION]: 'Multi-Factor Authentication',
  [FeatureKey.NOTIFICATIONS]: 'Notifications',
  [FeatureKey.DARK_MODE]: 'Dark Mode'
};

/**
 * Checks if a feature is enabled based on the feature key and user role
 * 
 * @param featureKey The feature key to check
 * @param userRole The user role to check against (optional)
 * @returns True if the feature is enabled for the given role, false otherwise
 */
export function isFeatureEnabled(featureKey: string, userRole?: string): boolean {
  // Check if feature exists in configuration
  const feature = features[featureKey];
  if (!feature) {
    return false;
  }
  
  // Check if feature is enabled globally
  if (!feature.enabled) {
    return false;
  }
  
  // If no role provided, just return enabled status
  if (!userRole) {
    return feature.enabled;
  }
  
  // Check if user role is allowed to access the feature
  return feature.allowedRoles.includes(userRole);
}

/**
 * Returns a list of all enabled features for a given user role
 * 
 * @param userRole The user role to get enabled features for
 * @returns Array of enabled feature keys for the given role
 */
export function getEnabledFeatures(userRole: string): string[] {
  const enabledFeatures: string[] = [];
  
  // Iterate through all features
  Object.keys(features).forEach(featureKey => {
    // Check if the feature is enabled for the user role
    if (isFeatureEnabled(featureKey, userRole)) {
      enabledFeatures.push(featureKey);
    }
  });
  
  return enabledFeatures;
}