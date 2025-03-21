/**
 * roles.ts
 * 
 * Defines the user role constants, role hierarchy, and role-based permissions
 * for the Revolucare web application. This file centralizes role definitions
 * to ensure consistency across authentication, authorization, and user interface
 * components.
 */

/**
 * Enum for user roles in the system
 */
export enum Roles {
  CLIENT = 'client',
  PROVIDER = 'provider',
  CASE_MANAGER = 'case_manager',
  ADMINISTRATOR = 'administrator',
}

/**
 * Human-readable labels for each role
 */
export const RoleLabels: Record<Roles, string> = {
  [Roles.CLIENT]: 'Client',
  [Roles.PROVIDER]: 'Provider',
  [Roles.CASE_MANAGER]: 'Case Manager',
  [Roles.ADMINISTRATOR]: 'Administrator',
};

/**
 * Role hierarchy defines which roles have access to functionality of other roles
 * The key is the role, and the value is an array of roles it has access to
 */
export const RoleHierarchy: Record<Roles, Roles[]> = {
  [Roles.ADMINISTRATOR]: [Roles.CASE_MANAGER, Roles.PROVIDER, Roles.CLIENT],
  [Roles.CASE_MANAGER]: [Roles.PROVIDER, Roles.CLIENT],
  [Roles.PROVIDER]: [Roles.CLIENT],
  [Roles.CLIENT]: [],
};

/**
 * Default permissions that all roles have
 */
export const DefaultRolePermissions = {
  'view:own-profile': 'View own profile',
  'edit:own-profile': 'Edit own profile',
  'view:own-documents': 'View own documents',
};

/**
 * Role-specific permissions
 * Defines the permissions each role has beyond the default permissions
 */
export const RolePermissions: Record<Roles, string[]> = {
  [Roles.CLIENT]: [
    'request:service',
    'view:own-care-plan',
    'view:own-services-plan',
    'rate:provider',
    'view:provider-profile',
    'book:appointment',
  ],
  
  [Roles.PROVIDER]: [
    'manage:availability',
    'view:assigned-clients',
    'view:client-care-plan',
    'update:service-status',
    'manage:calendar',
    'view:own-metrics',
  ],
  
  [Roles.CASE_MANAGER]: [
    'create:care-plan',
    'edit:care-plan',
    'assign:provider',
    'generate:client-reports',
    'view:client-records',
    'approve:services-plan',
    'override:provider-matching',
    'manage:client-portfolio',
  ],
  
  [Roles.ADMINISTRATOR]: [
    'manage:users',
    'configure:system',
    'view:system-metrics',
    'manage:providers',
    'access:billing',
    'generate:system-reports',
    'manage:service-catalog',
    'view:audit-logs',
  ],
};

/**
 * Checks if a user role has a specific permission
 * 
 * @param role The user role to check
 * @param permission The permission to check for
 * @returns True if the role has the permission, false otherwise
 */
export function hasPermission(role: string, permission: string): boolean {
  // Check if the role exists in RolePermissions
  if (role in RolePermissions) {
    // Check if the permission is in the role's permissions array
    if (RolePermissions[role as Roles].includes(permission)) {
      return true;
    }
  }
  
  // Check if the permission is in DefaultRolePermissions
  if (permission in DefaultRolePermissions) {
    return true;
  }
  
  return false;
}

/**
 * Checks if a user role has access to a required role (based on role hierarchy)
 * 
 * @param userRole The user's role
 * @param requiredRole The role required for access
 * @returns True if the user role has access to the required role, false otherwise
 */
export function hasRole(userRole: string, requiredRole: string): boolean {
  // Direct match
  if (userRole === requiredRole) {
    return true;
  }
  
  // Check hierarchy
  if (userRole in RoleHierarchy) {
    return RoleHierarchy[userRole as Roles].includes(requiredRole as Roles);
  }
  
  return false;
}