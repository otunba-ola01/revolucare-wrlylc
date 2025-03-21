/**
 * Central export file for all middleware components used in the Revolucare backend application.
 * 
 * This file aggregates middleware functions for HTTP request processing, security,
 * and performance optimization to provide a single import point for middleware configuration.
 * 
 * @module middleware
 */

// Import body parsing middleware components
import { 
  jsonBodyParser, 
  urlencodedParser, 
  bodyParserErrorHandler 
} from './body-parser.middleware';

// Import compression middleware for reducing response size
import compressionMiddleware from './compression.middleware';

// Import cookie parser middleware for handling request cookies
import cookieParserMiddleware from './cookie-parser.middleware';

// Import CORS middleware for handling cross-origin requests
import corsMiddleware from './cors.middleware';

// Import Helmet middleware for setting security-related HTTP headers
import helmetMiddleware from './helmet.middleware';

// Re-export all middleware components
export {
  // Body parsing middleware
  jsonBodyParser,
  urlencodedParser,
  bodyParserErrorHandler,
  
  // Compression middleware
  compressionMiddleware,
  
  // Cookie parsing middleware
  cookieParserMiddleware,
  
  // CORS middleware
  corsMiddleware,
  
  // Security headers middleware
  helmetMiddleware
};