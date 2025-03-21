/**
 * navigation.ts
 * 
 * Defines the navigation structure for the Revolucare web application,
 * including main navigation, mobile navigation, and role-based access control
 * for navigation items. This centralized configuration ensures consistent
 * navigation across different components and user roles.
 */

import { Roles } from './roles';

/**
 * Interface defining the structure of navigation items in the application
 * Used for both main navigation and mobile navigation
 */
export interface NavigationItem {
  /** The display text for the navigation item */
  title: string;
  /** The URL the navigation item links to */
  href: string;
  /** Icon identifier to be used with the icon component */
  icon: string;
  /** Optional array of roles that can access this navigation item. If not provided, all roles can access. */
  roles?: Roles[];
  /** Optional nested navigation items */
  children?: NavigationItem[];
}

/**
 * Main navigation structure used in sidebar and header navigation
 */
export const MAIN_NAVIGATION: NavigationItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: 'dashboard',
    // Dashboard is available to all user roles
  },
  {
    title: 'Care Plans',
    href: '/care-plans',
    icon: 'health',
    roles: [Roles.CLIENT, Roles.CASE_MANAGER, Roles.ADMINISTRATOR],
    children: [
      {
        title: 'My Care Plan',
        href: '/care-plans/my-plan',
        icon: 'user-plan',
        roles: [Roles.CLIENT],
      },
      {
        title: 'Create Care Plan',
        href: '/care-plans/create',
        icon: 'plus',
        roles: [Roles.CASE_MANAGER, Roles.ADMINISTRATOR],
      },
      {
        title: 'Manage Care Plans',
        href: '/care-plans/manage',
        icon: 'list',
        roles: [Roles.CASE_MANAGER, Roles.ADMINISTRATOR],
      },
    ],
  },
  {
    title: 'Services',
    href: '/services',
    icon: 'services',
    roles: [Roles.CLIENT, Roles.PROVIDER, Roles.CASE_MANAGER, Roles.ADMINISTRATOR],
    children: [
      {
        title: 'My Services',
        href: '/services/my-services',
        icon: 'user-services',
        roles: [Roles.CLIENT],
      },
      {
        title: 'Request Service',
        href: '/services/request',
        icon: 'plus',
        roles: [Roles.CLIENT, Roles.CASE_MANAGER],
      },
      {
        title: 'Service Catalog',
        href: '/services/catalog',
        icon: 'catalog',
        roles: [Roles.CLIENT, Roles.PROVIDER, Roles.CASE_MANAGER, Roles.ADMINISTRATOR],
      },
      {
        title: 'Service Plans',
        href: '/services/plans',
        icon: 'plan',
        roles: [Roles.CASE_MANAGER, Roles.ADMINISTRATOR],
      },
    ],
  },
  {
    title: 'Providers',
    href: '/providers',
    icon: 'providers',
    roles: [Roles.CLIENT, Roles.PROVIDER, Roles.CASE_MANAGER, Roles.ADMINISTRATOR],
    children: [
      {
        title: 'Find Providers',
        href: '/providers/search',
        icon: 'search',
        roles: [Roles.CLIENT, Roles.CASE_MANAGER],
      },
      {
        title: 'My Availability',
        href: '/providers/availability',
        icon: 'calendar',
        roles: [Roles.PROVIDER],
      },
      {
        title: 'My Clients',
        href: '/providers/clients',
        icon: 'users',
        roles: [Roles.PROVIDER],
      },
      {
        title: 'Provider Directory',
        href: '/providers/directory',
        icon: 'directory',
        roles: [Roles.CASE_MANAGER, Roles.ADMINISTRATOR],
      },
    ],
  },
  {
    title: 'Appointments',
    href: '/appointments',
    icon: 'calendar',
    roles: [Roles.CLIENT, Roles.PROVIDER, Roles.CASE_MANAGER],
    children: [
      {
        title: 'My Appointments',
        href: '/appointments/my-appointments',
        icon: 'user-calendar',
        roles: [Roles.CLIENT, Roles.PROVIDER],
      },
      {
        title: 'Schedule Appointment',
        href: '/appointments/schedule',
        icon: 'plus-calendar',
        roles: [Roles.CLIENT, Roles.CASE_MANAGER],
      },
      {
        title: 'Manage Appointments',
        href: '/appointments/manage',
        icon: 'edit-calendar',
        roles: [Roles.PROVIDER, Roles.CASE_MANAGER],
      },
    ],
  },
  {
    title: 'Documents',
    href: '/documents',
    icon: 'document',
    roles: [Roles.CLIENT, Roles.PROVIDER, Roles.CASE_MANAGER, Roles.ADMINISTRATOR],
    children: [
      {
        title: 'My Documents',
        href: '/documents/my-documents',
        icon: 'folder',
        roles: [Roles.CLIENT],
      },
      {
        title: 'Upload Document',
        href: '/documents/upload',
        icon: 'upload',
        roles: [Roles.CLIENT, Roles.PROVIDER, Roles.CASE_MANAGER],
      },
      {
        title: 'Client Documents',
        href: '/documents/client-documents',
        icon: 'folder-open',
        roles: [Roles.PROVIDER, Roles.CASE_MANAGER, Roles.ADMINISTRATOR],
      },
    ],
  },
  {
    title: 'Messages',
    href: '/messages',
    icon: 'message',
    // Messages are available to all user roles
  },
  {
    title: 'Analytics',
    href: '/analytics',
    icon: 'chart',
    roles: [Roles.PROVIDER, Roles.CASE_MANAGER, Roles.ADMINISTRATOR],
    children: [
      {
        title: 'Provider Analytics',
        href: '/analytics/provider',
        icon: 'provider-chart',
        roles: [Roles.PROVIDER, Roles.ADMINISTRATOR],
      },
      {
        title: 'Client Outcomes',
        href: '/analytics/client-outcomes',
        icon: 'user-chart',
        roles: [Roles.CASE_MANAGER, Roles.ADMINISTRATOR],
      },
      {
        title: 'System Overview',
        href: '/analytics/system',
        icon: 'system-chart',
        roles: [Roles.ADMINISTRATOR],
      },
      {
        title: 'Reports',
        href: '/analytics/reports',
        icon: 'report',
        roles: [Roles.CASE_MANAGER, Roles.ADMINISTRATOR],
      },
    ],
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: 'settings',
    // Settings are available to all user roles
    children: [
      {
        title: 'Profile',
        href: '/settings/profile',
        icon: 'user',
        // Profile settings available to all users
      },
      {
        title: 'Preferences',
        href: '/settings/preferences',
        icon: 'sliders',
        // Preferences available to all users
      },
      {
        title: 'Notifications',
        href: '/settings/notifications',
        icon: 'bell',
        // Notification settings available to all users
      },
      {
        title: 'Security',
        href: '/settings/security',
        icon: 'shield',
        // Security settings available to all users
      },
      {
        title: 'System Configuration',
        href: '/settings/system',
        icon: 'cog',
        roles: [Roles.ADMINISTRATOR],
      },
      {
        title: 'User Management',
        href: '/settings/users',
        icon: 'users',
        roles: [Roles.ADMINISTRATOR],
      },
    ],
  },
];

/**
 * Simplified navigation structure optimized for mobile devices
 */
export const MOBILE_NAVIGATION: NavigationItem[] = [
  {
    title: 'Home',
    href: '/dashboard',
    icon: 'home',
    // Home is available to all user roles
  },
  {
    title: 'Care',
    href: '/care-plans',
    icon: 'health',
    roles: [Roles.CLIENT, Roles.CASE_MANAGER, Roles.ADMINISTRATOR],
  },
  {
    title: 'Services',
    href: '/services',
    icon: 'services',
    roles: [Roles.CLIENT, Roles.PROVIDER, Roles.CASE_MANAGER, Roles.ADMINISTRATOR],
  },
  {
    title: 'Calendar',
    href: '/appointments',
    icon: 'calendar',
    roles: [Roles.CLIENT, Roles.PROVIDER, Roles.CASE_MANAGER],
  },
  {
    title: 'Messages',
    href: '/messages',
    icon: 'message',
    // Messages are available to all user roles
  },
  {
    title: 'Profile',
    href: '/settings/profile',
    icon: 'user',
    // Profile is available to all user roles
  },
];

/**
 * Utility function to filter navigation items based on user role
 * 
 * @param role The user's role
 * @param navigationItems The full navigation items array
 * @returns Filtered navigation items that the user role has access to
 */
export function getNavigationForRole(role: string | null | undefined, navigationItems: NavigationItem[]): NavigationItem[] {
  if (!role) return [];

  return navigationItems
    .filter(item => !item.roles || item.roles.includes(role as Roles))
    .map(item => {
      if (item.children) {
        // Create a new object with filtered children
        return {
          ...item,
          children: getNavigationForRole(role, item.children)
        };
      }
      return item;
    });
}