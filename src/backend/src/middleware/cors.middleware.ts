import cors from 'cors'; // ^2.8.5
import { RequestHandler } from 'express'; // ^4.18.2

/**
 * Creates and configures the CORS middleware with appropriate security settings
 * for the Revolucare application. This controls which domains can access the API,
 * what HTTP methods are allowed, and what headers can be included in requests.
 * 
 * @returns {RequestHandler} Configured CORS middleware function
 */
const corsMiddleware = (): RequestHandler => {
  // Define allowed origins based on environment
  const allowedOrigins = process.env.NODE_ENV === 'production'
    ? [
        'https://revolucare.com',
        'https://www.revolucare.com',
        'https://app.revolucare.com',
        // Add any other production domains here
      ]
    : [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:8000',
        'http://127.0.0.1:8000',
      ];

  // Configure CORS options
  const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, etc)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        // Block requests from unauthorized origins
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-Access-Token',
      'X-CSRF-Token',
    ],
    exposedHeaders: ['Content-Disposition'],
    credentials: true,
    maxAge: 86400, // 24 hours
    preflightContinue: false,
    optionsSuccessStatus: 204,
  };

  // Return the configured CORS middleware
  return cors(corsOptions);
};

export default corsMiddleware;