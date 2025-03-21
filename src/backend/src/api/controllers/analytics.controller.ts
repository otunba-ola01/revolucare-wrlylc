/**
 * Controller implementation for analytics-related API endpoints in the Revolucare platform.
 * This controller handles requests for metrics, dashboards, reports, data exports, and event tracking, delegating business logic to the analytics service.
 */
import { Request, Response, NextFunction } from 'express'; // express@^4.18.2
import { AnalyticsService } from '../../services/analytics.service'; // Import the analytics service for handling business logic
import { AnalyticsRepository } from '../../repositories/analytics.repository'; // Import the analytics repository for dependency injection
import { 
  MetricsRequestDTO, 
  MetricsResponse, 
  DashboardRequestDTO, 
  DashboardResponse, 
  ReportRequestDTO, 
  ReportResponse, 
  ExportRequestDTO, 
  ExportResponse, 
  AnalyticsEventDTO 
} from '../../types/analytics.types'; // Import type definitions for analytics request and response objects
import { AuthenticatedRequest } from '../../interfaces/auth.interface'; // Import authenticated request interface for type safety
import { logger } from '../../utils/logger'; // Import logger utility for request and error logging

// Create a new instance of the AnalyticsService with the AnalyticsRepository
const analyticsService = new AnalyticsService(new AnalyticsRepository());

/**
 * Handles requests for analytics metrics based on provided query parameters
 * @param req Express Request object
 * @param res Express Response object
 * @param next Express NextFunction for error handling
 * @returns Sends HTTP response with metrics data
 */
const getMetrics = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Log the start of the metrics retrieval process
    logger.info('Starting metrics retrieval process', { userId: req.user?.userId });

    // Extract query parameters from request
    const { category, types, period, startDate, endDate, ...filters } = req.query;

    // Create MetricsRequestDTO from query parameters
    const metricsRequest: MetricsRequestDTO = {
      category: category as string,
      types: types ? (Array.isArray(types) ? types : [types as string]) : [],
      period: period as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      filters: filters || {}
    };

    // Add user context from authenticated request if applicable
    if (req.user) {
      logger.debug('Adding user context to metrics request', { userId: req.user.userId, role: req.user.role });
    }

    // Call analyticsService.getMetrics with the request DTO
    const metricsResponse: MetricsResponse = await analyticsService.getMetrics(metricsRequest);

    // Return metrics response with 200 OK status
    res.status(200).json(metricsResponse);

    // Log successful metrics retrieval
    logger.info('Successfully retrieved metrics', { 
      userId: req.user?.userId, 
      category: metricsRequest.category, 
      period: metricsRequest.period,
      metricCount: metricsResponse.metrics.length 
    });
  } catch (error) {
    // Log the error with details
    logger.error('Error retrieving metrics', { 
      error: error instanceof Error ? error.message : String(error),
      userId: req.user?.userId,
      category: req.query.category,
      period: req.query.period
    });

    // Handle and propagate any errors to the error middleware
    next(error);
  }
};

/**
 * Handles requests for analytics dashboards with associated metrics
 * @param req Express Request object
 * @param res Express Response object
 * @param next Express NextFunction for error handling
 * @returns Sends HTTP response with dashboard data
 */
const getDashboard = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Log the start of the dashboard retrieval process
    logger.info('Starting dashboard retrieval process', { userId: req.user?.userId });

    // Extract query parameters from request
    const { period, startDate, endDate } = req.query;

    // Create DashboardRequestDTO from query parameters
    const dashboardRequest: DashboardRequestDTO = {
      userId: req.user.userId,
      role: req.user.role,
      period: period as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    };

    // Call analyticsService.getDashboard with the request DTO
    const dashboardResponse: DashboardResponse = await analyticsService.getDashboard(dashboardRequest);

    // Return dashboard response with 200 OK status
    res.status(200).json(dashboardResponse);

    // Log successful dashboard retrieval
    logger.info('Successfully retrieved dashboard', { 
      userId: req.user?.userId, 
      role: req.user.role,
      widgetCount: dashboardResponse.dashboard.widgets.length,
      metricCount: dashboardResponse.metrics.length
    });
  } catch (error) {
    // Log the error with details
    logger.error('Error retrieving dashboard', { 
      error: error instanceof Error ? error.message : String(error),
      userId: req.user?.userId,
      role: req.user.role
    });

    // Handle and propagate any errors to the error middleware
    next(error);
  }
};

/**
 * Handles requests to generate custom analytics reports
 * @param req Express Request object
 * @param res Express Response object
 * @param next Express NextFunction for error handling
 * @returns Sends HTTP response with report generation result
 */
const generateReport = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Log the start of the report generation process
    logger.info('Starting report generation process', { userId: req.user?.userId });

    // Extract report parameters from request body
    const { name, description, categories, metrics, period, startDate, endDate, format, filters } = req.body;

    // Create ReportRequestDTO from request body
    const reportRequest: ReportRequestDTO = {
      name,
      description,
      categories,
      metrics,
      period,
      startDate,
      endDate,
      format,
      filters,
      userId: req.user.userId
    };

    // Call analyticsService.generateReport with the request DTO
    const reportResponse: ReportResponse = await analyticsService.generateReport(reportRequest);

    // Return report response with 200 OK status and download URL
    res.status(200).json(reportResponse);

    // Log successful report generation
    logger.info('Successfully generated report', { 
      userId: req.user?.userId, 
      name: reportRequest.name, 
      format: reportRequest.format,
      reportId: reportResponse.id
    });
  } catch (error) {
    // Log the error with details
    logger.error('Error generating report', { 
      error: error instanceof Error ? error.message : String(error),
      userId: req.user?.userId,
      name: req.body.name,
      format: req.body.format
    });

    // Handle and propagate any errors to the error middleware
    next(error);
  }
};

/**
 * Handles requests to export data in various formats
 * @param req Express Request object
 * @param res Express Response object
 * @param next Express NextFunction for error handling
 * @returns Sends HTTP response with export result
 */
const exportData = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Log the start of the data export process
    logger.info('Starting data export process', { userId: req.user?.userId });

    // Extract export parameters from request body
    const { dataType, filters, format } = req.body;

    // Create ExportRequestDTO from request body
    const exportRequest: ExportRequestDTO = {
      dataType,
      filters,
      format,
      userId: req.user.userId
    };

    // Call analyticsService.exportData with the request DTO
    const exportResponse: ExportResponse = await analyticsService.exportData(exportRequest);

    // Return export response with 200 OK status and download URL
    res.status(200).json(exportResponse);

    // Log successful data export
    logger.info('Successfully exported data', { 
      userId: req.user?.userId, 
      dataType: exportRequest.dataType, 
      format: exportRequest.format,
      exportUrl: exportResponse.exportUrl
    });
  } catch (error) {
    // Log the error with details
    logger.error('Error exporting data', { 
      error: error instanceof Error ? error.message : String(error),
      userId: req.user?.userId,
      dataType: req.body.dataType,
      format: req.body.format
    });

    // Handle and propagate any errors to the error middleware
    next(error);
  }
};

/**
 * Handles requests to track analytics events
 * @param req Express Request object
 * @param res Express Response object
 * @param next Express NextFunction for error handling
 * @returns Sends HTTP response confirming event tracking
 */
const trackEvent = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Log the start of the event tracking process
    logger.info('Starting event tracking process', { userId: req.user?.userId });

    // Extract event data from request body
    const { eventType, eventData } = req.body;

    // Create AnalyticsEventDTO from request body
    const analyticsEvent: AnalyticsEventDTO = {
      userId: req.user.userId,
      userRole: req.user.role,
      eventType,
      eventData,
      timestamp: new Date() // Set timestamp to current date
    };

    // Call analyticsService.trackEvent with the event DTO
    await analyticsService.trackEvent(analyticsEvent);

    // Return success response with 202 Accepted status
    res.status(202).send();

    // Log successful event tracking
    logger.info('Successfully tracked event', { 
      userId: req.user?.userId, 
      eventType: analyticsEvent.eventType 
    });
  } catch (error) {
    // Log the error with details
    logger.error('Error tracking event', { 
      error: error instanceof Error ? error.message : String(error),
      userId: req.user?.userId,
      eventType: req.body.eventType
    });

    // Handle and propagate any errors to the error middleware
    next(error);
  }
};

// Export controller functions for analytics-related API endpoints
export default {
  getMetrics,
  getDashboard,
  generateReport,
  exportData,
  trackEvent
};