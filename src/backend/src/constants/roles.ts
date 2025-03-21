/**
 * roles.ts
 * 
 * This file defines the user role constants and role hierarchy for the Revolucare platform.
 * It centralizes role definitions to ensure consistency across authentication, authorization,
 * and user management components.
 */

/**
 * Enum defining the available user roles in the system.
 * These roles are used for user registration, authentication, and authorization.
 */
export enum Roles {
  CLIENT = 'client',
  PROVIDER = 'provider',
  CASE_MANAGER = 'case_manager',
  ADMINISTRATOR = 'administrator'
}

/**
 * Defines the hierarchical relationship between roles for authorization checks.
 * Each role inherits permissions from roles listed in its array.
 * For example, ADMINISTRATOR inherits all permissions from CASE_MANAGER, PROVIDER, and CLIENT.
 */
export const RoleHierarchy: Record<Roles, Roles[]> = {
  [Roles.ADMINISTRATOR]: [Roles.CASE_MANAGER, Roles.PROVIDER, Roles.CLIENT],
  [Roles.CASE_MANAGER]: [Roles.PROVIDER, Roles.CLIENT],
  [Roles.PROVIDER]: [Roles.CLIENT],
  [Roles.CLIENT]: []
};

/**
 * Default permissions that all authenticated users have access to regardless of role.
 * These are baseline permissions for any authenticated user in the system.
 */
export const DefaultRolePermissions = {
  'view:own-profile': 'view:own-profile',
  'edit:own-profile': 'edit:own-profile',
  'view:own-documents': 'view:own-documents'
};

/**
 * Maps each role to its specific permissions for fine-grained access control.
 * These permissions are in addition to those inherited through the role hierarchy.
 * The permission format follows a resource:action pattern for clarity and consistency.
 */
export const RolePermissions: Record<Roles, string[]> = {
  [Roles.CLIENT]: [
    'request:services',
    'view:own-care-plans',
    'view:own-service-plans',
    'rate:providers',
    'view:matched-providers',
    'schedule:appointments',
    'upload:own-documents',
    'view:own-notifications',
    'provide:feedback',
    'cancel:own-appointments'
  ],
  
  [Roles.PROVIDER]: [
    'manage:availability',
    'view:assigned-clients',
    'update:service-status',
    'manage:own-calendar',
    'view:own-reviews',
    'respond:to-booking-requests',
    'upload:service-documents',
    'view:own-schedule',
    'message:assigned-clients',
    'view:service-history'
  ],
  
  [Roles.CASE_MANAGER]: [
    'create:care-plans',
    'edit:care-plans',
    'assign:providers',
    'generate:reports',
    'override:matching',
    'view:client-records',
    'create:service-plans',
    'assess:client-needs',
    'monitor:client-outcomes',
    'approve:service-requests',
    'message:clients',
    'message:providers',
    'view:client-analytics'
  ],
  
  [Roles.ADMINISTRATOR]: [
    'manage:users',
    'view:all-records',
    'configure:system',
    'access:analytics',
    'manage:permissions',
    'view:audit-logs',
    'delete:records',
    'manage:providers',
    'manage:services',
    'generate:system-reports',
    'override:system-settings',
    'manage:case-managers',
    'view:system-health',
    'configure:notifications',
    'manage:integrations'
  ]
};