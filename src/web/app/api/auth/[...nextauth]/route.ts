/**
 * NextAuth.js API Route Handler
 * 
 * This file implements the Next.js API route handler for NextAuth.js authentication in the Revolucare platform.
 * It serves as the entry point for all authentication-related requests, including:
 * - User login with credentials or OAuth providers
 * - Registration and account creation
 * - Session management and validation
 * - Token refresh and rotation
 * - OAuth callback processing
 */

import NextAuth from 'next-auth'; // next-auth: ^4.22.1
import { authOptions } from '../../../../lib/auth/auth-options';

/**
 * The NextAuth.js handler configured with the application's auth options
 * This handler processes all authentication-related requests
 */
const handler = NextAuth(authOptions);

/**
 * Export GET handler for:
 * - Retrieving session data
 * - Processing OAuth callbacks
 * - CSRF protection
 * - Checking authentication status
 */
export { handler as GET };

/**
 * Export POST handler for:
 * - Login with credentials
 * - Token refresh
 * - Logout requests
 * - OAuth token exchange
 */
export { handler as POST };