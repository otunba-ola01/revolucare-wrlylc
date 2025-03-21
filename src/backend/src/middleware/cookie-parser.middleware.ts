import cookieParser from 'cookie-parser'; // cookie-parser v1.4.6
import express from 'express'; // express v4.18.2

/**
 * Configures and initializes the cookie-parser middleware with appropriate security settings.
 * This middleware extracts cookies from incoming requests and makes them available in 
 * the request object for authentication, session management, and other cookie-based features.
 * 
 * Key features:
 * - Parses Cookie header and populates req.cookies
 * - Supports signed cookies with secret key (populates req.signedCookies)
 * - Helps implement secure session management for authentication
 * 
 * Security considerations:
 * - Uses signed cookies to prevent tampering
 * - Works with HTTP-only cookies to mitigate XSS attacks
 * - Supports secure cookies for HTTPS-only transmission
 * 
 * @returns Configured cookie-parser middleware function
 */
const cookieParserMiddleware = (): express.RequestHandler => {
  // The secret used for signing cookies. In a production environment,
  // this should be a strong, unique secret loaded from environment variables
  const cookieSecret = process.env.COOKIE_SECRET || 'revolucare-cookie-secret';
  
  if (process.env.NODE_ENV === 'production' && !process.env.COOKIE_SECRET) {
    // Log a warning if using default secret in production
    console.warn('WARNING: Using default cookie secret in production environment. ' +
                'This is insecure and should be changed by setting the COOKIE_SECRET environment variable.');
  }
  
  // Return the configured middleware
  // Note: Cookie security options like secure, httpOnly, sameSite, etc.
  // are set when creating cookies, not when parsing them
  return cookieParser(cookieSecret);
};

export default cookieParserMiddleware;