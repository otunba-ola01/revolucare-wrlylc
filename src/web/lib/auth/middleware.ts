/**
 * middleware.ts
 *
 * Implements authentication and authorization middleware functions for the Revolucare web application,
 * providing route protection based on authentication status and user roles. This file serves as a
 * bridge between Next.js middleware and the application's authentication requirements.
 */

import { NextRequest, NextResponse } from 'next/server'; // next/server: ^13.4.1
import { withAuth } from 'next-auth/middleware'; // next-auth/middleware: ^4.22.1
import { getSession, hasRequiredRole } from './session';
import { Roles } from '../../config/roles';

/**
 * Middleware function that protects routes requiring authentication
 * 
 * @param request NextRequest object from Next.js
 * @returns NextResponse for redirects or undefined to allow the request to proceed
 */
export async function withAuthProtection(request: NextRequest): Promise<NextResponse | undefined> {
  // Get the current user session
  const session = await getSession();
  
  // If no session exists, user is not authenticated
  if (!session) {
    // Create the callback URL to return to after login
    const callbackUrl = encodeURIComponent(request.nextUrl.pathname + request.nextUrl.search);
    
    // Redirect to login page with callback URL
    return NextResponse.redirect(
      new URL(`/auth/login?callbackUrl=${callbackUrl}`, request.url)
    );
  }
  
  // User is authenticated, allow the request to proceed
  return undefined;
}

/**
 * Middleware function that protects routes requiring specific role access
 * 
 * @param requiredRole The role required to access the route
 * @returns A middleware function that checks authentication and role authorization
 */
export function withRoleProtection(requiredRole: string) {
  return async function(request: NextRequest): Promise<NextResponse | undefined> {
    // Get the current user session
    const session = await getSession();
    
    // If no session exists, user is not authenticated
    if (!session) {
      // Create the callback URL to return to after login
      const callbackUrl = encodeURIComponent(request.nextUrl.pathname + request.nextUrl.search);
      
      // Redirect to login page with callback URL
      return NextResponse.redirect(
        new URL(`/auth/login?callbackUrl=${callbackUrl}`, request.url)
      );
    }
    
    // Check if the user has the required role
    if (!hasRequiredRole(session, requiredRole)) {
      // Determine where to redirect based on user's role
      let redirectPath = '/dashboard';
      
      // Different redirect paths based on user role
      switch (session.user?.role) {
        case Roles.CLIENT:
          redirectPath = '/client/dashboard';
          break;
        case Roles.PROVIDER:
          redirectPath = '/provider/dashboard';
          break;
        case Roles.CASE_MANAGER:
          redirectPath = '/case-manager/dashboard';
          break;
        case Roles.ADMINISTRATOR:
          redirectPath = '/admin/dashboard';
          break;
      }
      
      // Redirect to appropriate dashboard with unauthorized message
      return NextResponse.redirect(
        new URL(`${redirectPath}?unauthorized=true&requiredRole=${requiredRole}`, request.url)
      );
    }
    
    // User has the required role, allow the request to proceed
    return undefined;
  };
}