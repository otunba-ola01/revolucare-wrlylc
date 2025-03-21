/**
 * Configuration module for database connectivity in the Revolucare platform.
 * Initializes a Prisma client with appropriate connection settings, connection pooling,
 * and error handling for optimal database performance and reliability.
 * 
 * @module config/database
 */

import { PrismaClient } from '@prisma/client'; // @prisma/client@^5.0.0
import ms from 'ms'; // ms@^2.1.3
import { info, error, debug } from './logger';

/**
 * Retrieves database configuration from environment variables with sensible defaults
 * @returns Database configuration object
 */
function getDatabaseConfig() {
  // Extract database configuration from environment variables
  const config = {
    // Database connection settings
    url: process.env.DATABASE_URL,
    
    // Connection pool settings
    connectionTimeout: process.env.DATABASE_CONNECTION_TIMEOUT || '10s',
    connectionPoolMin: parseInt(process.env.DATABASE_CONNECTION_POOL_MIN || '5', 10),
    connectionPoolMax: parseInt(process.env.DATABASE_CONNECTION_POOL_MAX || '50', 10),
    connectionPoolIdleTimeout: process.env.DATABASE_CONNECTION_POOL_IDLE_TIMEOUT || '10m',
    
    // Query settings
    statementTimeout: process.env.DATABASE_STATEMENT_TIMEOUT || '30s',
    slowQueryThreshold: parseInt(process.env.DATABASE_SLOW_QUERY_THRESHOLD || '1000', 10),
    
    // Logging settings
    logQueries: process.env.DATABASE_LOG_QUERIES === 'true' || process.env.NODE_ENV === 'development',
    logSlowQueries: process.env.DATABASE_LOG_SLOW_QUERIES === 'true' || true
  };

  // Validate required configuration
  if (!config.url) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  return config;
}

/**
 * Log queries that exceed the configured threshold
 * @param params Query parameters including duration
 */
function logSlowQuery(params: any): void {
  const dbConfig = getDatabaseConfig();
  
  if (params.duration >= dbConfig.slowQueryThreshold) {
    // Log slow query with parameters and duration
    info(`Slow query detected (${params.duration}ms): ${params.query}`, {
      duration: params.duration,
      query: params.query,
      params: params.params,
      threshold: dbConfig.slowQueryThreshold
    });

    // Log additional details in development environment
    if (process.env.NODE_ENV === 'development') {
      debug('Slow query details', {
        query: params.query,
        params: params.params,
        duration: params.duration,
        timestamp: new Date().toISOString()
      });
    }
  }
}

// Get database configuration
const dbConfig = getDatabaseConfig();

// Configure Prisma client options
const prismaOptions = {
  log: [
    { level: 'error', emit: 'event' },
    ...(dbConfig.logQueries ? [{ level: 'query', emit: 'event' }] : []),
    { level: 'warn', emit: 'event' },
    { level: 'info', emit: 'event' }
  ],
  errorFormat: process.env.NODE_ENV === 'development' ? 'pretty' : 'minimal',
  // Convert connection timeout string to milliseconds
  connectionTimeout: ms(dbConfig.connectionTimeout),
  // Configure connection pool
  connectionLimit: {
    min: dbConfig.connectionPoolMin,
    max: dbConfig.connectionPoolMax,
    idle: ms(dbConfig.connectionPoolIdleTimeout)
  },
  // Convert statement timeout string to milliseconds
  statementTimeout: ms(dbConfig.statementTimeout)
};

// Create and configure Prisma client
const prisma = new PrismaClient(prismaOptions);

/**
 * Configures event listeners for the Prisma client
 * @param client The Prisma client instance
 * @returns The configured client
 */
function configurePrisma(client: PrismaClient): PrismaClient {
  // Set up query logging for slow queries
  if (dbConfig.logSlowQueries) {
    client.$on('query', logSlowQuery);
  }

  // Log all queries in development mode
  if (process.env.NODE_ENV === 'development' && dbConfig.logQueries) {
    client.$on('query', (e) => {
      debug('Query', { query: e.query, params: e.params, duration: e.duration });
    });
  }

  // Log errors
  client.$on('error', (e) => {
    error('Database error', { message: e.message, stack: e.stack });
  });

  // Log connection events in debug mode
  client.$on('info', (e) => {
    debug('Database info', { message: e.message });
  });

  // Log warnings
  client.$on('warn', (e) => {
    debug('Database warning', { message: e.message });
  });

  return client;
}

// Configure the Prisma client with event handlers
configurePrisma(prisma);

/**
 * Establishes the initial database connection
 * @returns Promise that resolves when connection is established
 */
async function connectDatabase(): Promise<void> {
  try {
    info('Connecting to database...');
    
    // Connect to the database
    await prisma.$connect();
    
    info('Successfully connected to database', {
      poolMin: dbConfig.connectionPoolMin,
      poolMax: dbConfig.connectionPoolMax,
      connectionTimeout: dbConfig.connectionTimeout,
      statementTimeout: dbConfig.statementTimeout
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown database connection error';
    error('Failed to connect to database', { error: errorMessage });
    
    // Throw the error to be handled by the application
    throw err;
  }
}

/**
 * Gracefully disconnects from the database
 * @returns Promise that resolves when disconnection is complete
 */
async function disconnectDatabase(): Promise<void> {
  try {
    info('Disconnecting from database...');
    
    // Disconnect from the database
    await prisma.$disconnect();
    
    info('Successfully disconnected from database');
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown database disconnection error';
    error('Failed to disconnect from database', { error: errorMessage });
    
    // Throw the error to be handled by the application
    throw err;
  }
}

/**
 * Executes a callback within a database transaction
 * @param callback Function to execute within the transaction
 * @returns Result of the callback execution
 */
async function executeWithTransaction<T>(callback: (prisma: PrismaClient) => Promise<T>): Promise<T> {
  info('Starting database transaction');
  
  try {
    // Execute the callback within a transaction
    const result = await prisma.$transaction(async (tx) => {
      return await callback(tx as unknown as PrismaClient);
    });
    
    info('Database transaction completed successfully');
    return result;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown transaction error';
    error('Database transaction failed', { error: errorMessage });
    
    // Throw the error to be handled by the application
    throw err;
  }
}

// Export the configured Prisma client and utility functions
export {
  prisma,
  connectDatabase,
  disconnectDatabase,
  executeWithTransaction
};