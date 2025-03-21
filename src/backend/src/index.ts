/**
 * Main entry point for the Revolucare backend application.
 * Initializes the server, sets up event handlers, and handles graceful shutdown.
 * 
 * This file serves as the bootstrap for the entire backend service, establishing
 * database connections, setting up event systems, and handling graceful shutdown.
 */

import dotenv from 'dotenv'; // dotenv@16.0.3
import { startServer, shutdownServer } from './server';
import { logger } from './config/logger';

// Global variables
const NODE_ENV = process.env.NODE_ENV || 'development';
let server: any = null;

/**
 * Main application bootstrap function that initializes the server and sets up process signal handlers
 * @returns Promise that resolves when the application is fully initialized
 */
async function main(): Promise<void> {
  try {
    // Load environment variables from .env file
    dotenv.config();
    
    logger.info(`Starting Revolucare backend in ${NODE_ENV} environment`, {
      version: process.env.npm_package_version,
      nodeVersion: process.version
    });
    
    // Start the server
    server = await startServer();
    
    // Set up signal handlers for graceful shutdown
    setupSignalHandlers();
    
    logger.info('Revolucare backend initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize Revolucare backend', { error });
    process.exit(1);
  }
}

/**
 * Sets up process signal handlers for graceful application shutdown
 */
function setupSignalHandlers(): void {
  // Handle SIGTERM signal (e.g. from Kubernetes, Docker, etc.)
  process.on('SIGTERM', async () => {
    await handleShutdownSignal('SIGTERM');
  });
  
  // Handle SIGINT signal (e.g. Ctrl+C)
  process.on('SIGINT', async () => {
    await handleShutdownSignal('SIGINT');
  });
  
  // Handle uncaught exceptions
  process.on('uncaughtException', handleUncaughtException);
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', handleUnhandledRejection);
}

/**
 * Handles shutdown signals by gracefully terminating the application
 * @param signal The signal that triggered the shutdown
 * @returns Promise that resolves when shutdown is complete
 */
async function handleShutdownSignal(signal: string): Promise<void> {
  logger.info(`Received ${signal} signal. Shutting down gracefully...`);
  
  try {
    if (server) {
      await shutdownServer(server);
    }
    logger.info('Server shutdown completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Error during server shutdown', { error });
    process.exit(1);
  }
}

/**
 * Handles uncaught exceptions in the application
 * @param error The uncaught exception error
 */
function handleUncaughtException(error: Error): void {
  logger.error('Uncaught exception', { error });
  
  if (server) {
    shutdownServer(server)
      .then(() => {
        logger.info('Server shutdown completed after uncaught exception');
        process.exit(1);
      })
      .catch((shutdownError) => {
        logger.error('Error during server shutdown after uncaught exception', { error: shutdownError });
        process.exit(1);
      });
  } else {
    process.exit(1);
  }
}

/**
 * Handles unhandled promise rejections in the application
 * @param reason The reason for the unhandled rejection
 */
function handleUnhandledRejection(reason: Error): void {
  logger.error('Unhandled promise rejection', { error: reason });
  
  if (server) {
    shutdownServer(server)
      .then(() => {
        logger.info('Server shutdown completed after unhandled rejection');
        process.exit(1);
      })
      .catch((shutdownError) => {
        logger.error('Error during server shutdown after unhandled rejection', { error: shutdownError });
        process.exit(1);
      });
  } else {
    process.exit(1);
  }
}

// Start the application
main();