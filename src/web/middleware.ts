/**
 * middleware.ts
 *
 * Implements Next.js middleware for route protection and authentication in the Revolucare platform.
 * This file defines the middleware configuration that runs on every request to protected routes,
 * ensuring proper authentication and authorization based on user roles.
 */

import { NextRequest, NextResponse } from 'next/server'; // next/server: ^13.4.1
import { NextFetchEvent } from 'next/server'; // next/server: ^13.4.1
import { withAuthProtection, withRoleProtection } from './lib/auth/middleware';
import { Roles } from './config/roles';

/**
 * Array of public routes that don't require authentication
 */
const PUBLIC_ROUTES = [
  '/', 
  '/auth/login', 
  '/auth/register',
  '/auth/forgot-password', 
  '/auth/reset-password', 
  '/auth/verify', 
  '/api/auth/.*'
];

/**
 * Array of routes that require administrator role
 */
const ADMIN_ROUTES = [
  '/admin/.*', 
  '/analytics/system/.*'
];

/**
 * Array of routes that require case manager role
 */
const CASE_MANAGER_ROUTES = [
  '/case-manager/.*', 
  '/analytics/care-plans/.*'
];

/**
 * Array of routes that require provider role
 */
const PROVIDER_ROUTES = [
  '/providers/availability/.*', 
  '/analytics/provider/.*'
];

/**
 * Array of routes that require client role
 */
const CLIENT_ROUTES = [
  '/client/.*'
];

/**
 * Next.js middleware function that runs on every request to protected routes
 * 
 * @param request - The NextRequest object
 * @param event - The NextFetchEvent object
 * @returns NextResponse for redirects or undefined to continue
 */
export async function middleware(
  request: NextRequest,
  event: NextFetchEvent
): Promise<NextResponse | undefined> {
  const { pathname } = request.nextUrl;

  // Check if the request path matches any of the protected routes
  
  // For public routes, allow the request to proceed without authentication
  if (PUBLIC_ROUTES.some(route => {
    if (route.endsWith('.*')) {
      const prefix = route.substring(0, route.length - 2);
      return pathname.startsWith(prefix);
    }
    return pathname === route;
  })) {
    return undefined;
  }

  // For admin-specific routes, apply role protection with ADMINISTRATOR role
  if (ADMIN_ROUTES.some(route => {
    if (route.endsWith('.*')) {
      const prefix = route.substring(0, route.length - 2);
      return pathname.startsWith(prefix);
    }
    return pathname === route;
  })) {
    return withRoleProtection(Roles.ADMINISTRATOR)(request);
  }

  // For case manager routes, apply role protection with CASE_MANAGER role
  if (CASE_MANAGER_ROUTES.some(route => {
    if (route.endsWith('.*')) {
      const prefix = route.substring(0, route.length - 2);
      return pathname.startsWith(prefix);
    }
    return pathname === route;
  })) {
    return withRoleProtection(Roles.CASE_MANAGER)(request);
  }

  // For provider routes, apply role protection with PROVIDER role
  if (PROVIDER_ROUTES.some(route => {
    if (route.endsWith('.*')) {
      const prefix = route.substring(0, route.length - 2);
      return pathname.startsWith(prefix);
    }
    return pathname === route;
  })) {
    return withRoleProtection(Roles.PROVIDER)(request);
  }

  // For client-specific routes, apply role protection with CLIENT role
  if (CLIENT_ROUTES.some(route => {
    if (route.endsWith('.*')) {
      const prefix = route.substring(0, route.length - 2);
      return pathname.startsWith(prefix);
    }
    return pathname === route;
  })) {
    return withRoleProtection(Roles.CLIENT)(request);
  }

  // For dashboard routes, apply authentication protection
  if (pathname.startsWith('/dashboard')) {
    return withAuthProtection(request);
  }

  // For all other routes, require authentication by default
  return withAuthProtection(request);
}

/**
 * Configuration object for Next.js middleware with path matchers
 */
export const config = {
  matcher: [
    // Match all paths except static files, images, favicon, and public directory
    '/((?!_next/static|_next/image|favicon.ico|public/|api/health).*)'
  ]
};