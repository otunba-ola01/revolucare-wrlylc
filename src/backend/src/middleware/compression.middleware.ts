import compression from 'compression'; // compression ^1.7.4
import express from 'express'; // express ^4.18.2

/**
 * Creates and configures the compression middleware with appropriate settings for the Revolucare application
 * 
 * Compresses HTTP responses to improve network performance and reduce bandwidth usage.
 * This is especially important for mobile clients and users with slower connections.
 * 
 * - Compresses text-based responses (HTML, JSON, CSS, JavaScript, etc.)
 * - Only compresses responses above 1KB threshold
 * - Uses compression level 6 to balance compression ratio and CPU usage
 * - Respects client-side compression preferences
 * 
 * @returns Configured compression middleware function
 */
const compressionMiddleware = (): express.RequestHandler => {
  return compression({
    // Set compression level to balance between compression ratio and CPU usage
    // Level 6 provides good compression without excessive CPU usage
    level: 6,
    
    // Only compress responses larger than 1KB
    // Small responses don't benefit significantly from compression
    threshold: 1024,
    
    // Don't compress responses for clients that don't support it
    filter: (req, res) => {
      // Skip compression if the client explicitly requests no compression
      if (req.headers['x-no-compression']) {
        return false;
      }
      
      // Use compression for standard text-based content types
      // This includes application/json, text/html, text/css, application/javascript, etc.
      return compression.filter(req, res);
    },
    
    // Improve performance for streaming responses by using optimized chunk size
    chunkSize: 16 * 1024
  });
};

export default compressionMiddleware;