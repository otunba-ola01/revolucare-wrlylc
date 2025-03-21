import helmet from 'helmet'; // helmet: ^6.0.1
import type { RequestHandler } from 'express'; // express: ^4.18.2

/**
 * Creates and configures the Helmet middleware with appropriate security settings
 * for the Revolucare application
 * 
 * @returns Configured Helmet middleware function
 */
const helmetMiddleware = (): RequestHandler => {
  return helmet({
    // Configure Content Security Policy (CSP) to prevent XSS attacks
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'", "https://api.revolucare.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    
    // Configure Cross-Origin Resource Policy
    crossOriginResourcePolicy: { policy: 'same-origin' },
    
    // Configure Cross-Origin Opener Policy
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    
    // Configure Cross-Origin Embedder Policy (disabled to allow loading resources from different origins)
    crossOriginEmbedderPolicy: false,
    
    // Configure Referrer Policy to control information sent in the Referer header
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin',
    },
    
    // Configure HSTS (HTTP Strict Transport Security) for secure connections
    hsts: {
      maxAge: 15552000, // 180 days in seconds
      includeSubDomains: true,
      preload: true,
    },
    
    // Enable X-Frame-Options to prevent clickjacking
    frameguard: { action: 'deny' },
    
    // Enable X-Content-Type-Options to prevent MIME type sniffing
    noSniff: true,
    
    // Enable X-XSS-Protection header for older browsers
    xssFilter: true,
    
    // Disable X-Powered-By header to avoid exposing technology stack
    hidePoweredBy: true,
  });
};

export default helmetMiddleware;