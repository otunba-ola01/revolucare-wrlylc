import { Request, Response, NextFunction } from 'express'; // express@^4.18.2
import { analyticsController } from '../../../src/api/controllers/analytics.controller'; // Import the analytics controller to be tested
import { AnalyticsService } from '../../../src/services/analytics.service'; // Import the analytics service for mocking
import { AnalyticsRepository } from '../../../src/repositories/analytics.repository'; // Import the analytics repository for mocking
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
} from '../../../src/types/analytics.types'; // Import type definitions for analytics request and response objects
import { Roles } from '../../../src/constants/roles'; // Import roles enum for user role values in test fixtures
import { mockUsers } from '../../fixtures/users.fixture'; // Import mock user data for testing
import { logger } from '../../../src/utils/logger'; // Import logger utility for mocking

// Define global mocks for request, response, next, and authenticated request
const mockRequest = jest.fn() as jest.Mocked<Request>;
const mockResponse = { 
  status: jest.fn().mockReturnThis(), 
  json: jest.fn().mockReturnThis(), 
  send: jest.fn().mockReturnThis() 
} as unknown as Response;
const mockNext = jest.fn() as NextFunction;
const mockAuthenticatedRequest = { 
  user: { 
    userId: 'test-user-id', 
    email: 'test@example.com', 
    role: Roles.ADMINISTRATOR, 
    isVerified: true, 
    permissions: [] 
  } 
} as any;

// Create a mock instance of the AnalyticsService
const mockAnalyticsService = new AnalyticsService(new AnalyticsRepository());

/**
 * Test suite for the analytics controller
 */
describe('analytics controller', () => {
  /**
   * Set up test environment before each test
   */
  beforeEach(() => {
    // Reset all mocks to ensure clean test environment
    jest.clearAllMocks();

    // Mock the analytics service methods
    jest.spyOn(mockAnalyticsService, 'getMetrics');
    jest.spyOn(mockAnalyticsService, 'getDashboard');
    jest.spyOn(mockAnalyticsService, 'generateReport');
    jest.spyOn(mockAnalyticsService, 'exportData');
    jest.spyOn(mockAnalyticsService, 'trackEvent');

    // Mock the logger methods to prevent console output during tests
    jest.spyOn(logger, 'info');
    jest.spyOn(logger, 'error');
  });

  /**
   * Clean up after each test
   */
  afterEach(() => {
    // Restore all mocks to their original implementations
    jest.restoreAllMocks();
  });

  /**
   * Test suite for the getMetrics controller method
   */
  describe('getMetrics', () => {
    /**
     * Tests that getMetrics returns metrics with 200 status on success
     */
    it('should return metrics with 200 status', async () => {
      // Create mock metrics response
      const mockMetricsResponse: MetricsResponse = {
        metrics: [{ 
          id: 'metric-1', 
          name: 'active_users', 
          description: 'Number of active users', 
          category: 'user', 
          value: 100, 
          unit: 'count', 
          trend: 'up', 
          changePercentage: 10, 
          period: 'monthly', 
          lastUpdated: new Date() 
        }],
        period: 'monthly',
        startDate: new Date(),
        endDate: new Date()
      };

      // Mock analytics service getMetrics to return the mock response
      (jest.spyOn(mockAnalyticsService, 'getMetrics') as jest.SpyInstance).mockResolvedValue(mockMetricsResponse);

      // Create mock request with query parameters
      mockRequest.query = { category: 'user', period: 'monthly' };

      // Call the controller method
      await analyticsController.getMetrics(mockRequest as any, mockResponse, mockNext);

      // Verify analytics service was called with correct parameters
      expect(mockAnalyticsService.getMetrics).toHaveBeenCalledWith({
        category: 'user',
        types: [],
        period: 'monthly',
        startDate: undefined,
        endDate: undefined,
        filters: {}
      });

      // Verify response status was set to 200
      expect(mockResponse.status).toHaveBeenCalledWith(200);

      // Verify response json was called with the mock metrics
      expect(mockResponse.json).toHaveBeenCalledWith(mockMetricsResponse);
    });

    /**
     * Tests that getMetrics properly handles service errors
     */
    it('should handle service errors', async () => {
      // Mock analytics service getMetrics to throw an error
      (jest.spyOn(mockAnalyticsService, 'getMetrics') as jest.SpyInstance).mockRejectedValue(new Error('Service error'));

      // Create mock request with query parameters
      mockRequest.query = { category: 'user', period: 'monthly' };

      // Call the controller method
      await analyticsController.getMetrics(mockRequest as any, mockResponse, mockNext);

      // Verify next function was called with the error
      expect(mockNext).toHaveBeenCalledWith(new Error('Service error'));
    });
  });

  /**
   * Test suite for the getDashboard controller method
   */
  describe('getDashboard', () => {
    /**
     * Tests that getDashboard returns dashboard with 200 status on success
     */
    it('should return dashboard with 200 status', async () => {
      // Create mock dashboard response
      const mockDashboardResponse: DashboardResponse = {
        dashboard: {
          id: 'dashboard-1',
          userId: 'test-user-id',
          role: Roles.ADMINISTRATOR,
          title: 'Admin Dashboard',
          description: 'Admin dashboard description',
          widgets: [],
          layout: { columns: 12, rowHeight: 50, padding: 10, config: {} },
          isDefault: true,
          lastViewed: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        metrics: [],
        period: 'monthly',
        startDate: new Date(),
        endDate: new Date()
      };

      // Mock analytics service getDashboard to return the mock response
      (jest.spyOn(mockAnalyticsService, 'getDashboard') as jest.SpyInstance).mockResolvedValue(mockDashboardResponse);

      // Create mock authenticated request with user context
      (mockRequest as any).user = mockAuthenticatedRequest.user;
      mockRequest.query = { period: 'monthly' };

      // Call the controller method
      await analyticsController.getDashboard(mockRequest as any, mockResponse, mockNext);

      // Verify analytics service was called with correct parameters including user context
      expect(mockAnalyticsService.getDashboard).toHaveBeenCalledWith({
        userId: 'test-user-id',
        role: Roles.ADMINISTRATOR,
        period: 'monthly',
        startDate: undefined,
        endDate: undefined
      });

      // Verify response status was set to 200
      expect(mockResponse.status).toHaveBeenCalledWith(200);

      // Verify response json was called with the mock dashboard
      expect(mockResponse.json).toHaveBeenCalledWith(mockDashboardResponse);
    });

    /**
     * Tests that getDashboard properly handles service errors
     */
    it('should handle service errors for dashboard', async () => {
      // Mock analytics service getDashboard to throw an error
      (jest.spyOn(mockAnalyticsService, 'getDashboard') as jest.SpyInstance).mockRejectedValue(new Error('Service error'));

      // Create mock authenticated request
      (mockRequest as any).user = mockAuthenticatedRequest.user;
      mockRequest.query = { period: 'monthly' };

      // Call the controller method
      await analyticsController.getDashboard(mockRequest as any, mockResponse, mockNext);

      // Verify next function was called with the error
      expect(mockNext).toHaveBeenCalledWith(new Error('Service error'));
    });
  });

  /**
   * Test suite for the generateReport controller method
   */
  describe('generateReport', () => {
    /**
     * Tests that generateReport returns report with 200 status on success
     */
    it('should generate report with 200 status', async () => {
      // Create mock report response
      const mockReportResponse: ReportResponse = {
        id: 'report-1',
        name: 'User Report',
        format: 'pdf',
        url: 'http://example.com/report.pdf',
        expiresAt: new Date(),
        createdAt: new Date()
      };

      // Mock analytics service generateReport to return the mock response
      (jest.spyOn(mockAnalyticsService, 'generateReport') as jest.SpyInstance).mockResolvedValue(mockReportResponse);

      // Create mock authenticated request with report parameters in body
      (mockRequest as any).user = mockAuthenticatedRequest.user;
      mockRequest.body = { 
        name: 'User Report', 
        description: 'Report of user activity', 
        categories: ['user'], 
        metrics: [], 
        period: 'monthly', 
        startDate: new Date(), 
        endDate: new Date(), 
        format: 'pdf', 
        filters: {} 
      };

      // Call the controller method
      await analyticsController.generateReport(mockRequest as any, mockResponse, mockNext);

      // Verify analytics service was called with correct parameters
      expect(mockAnalyticsService.generateReport).toHaveBeenCalledWith({
        name: 'User Report',
        description: 'Report of user activity',
        categories: ['user'],
        metrics: [],
        period: 'monthly',
        startDate: new Date(),
        endDate: new Date(),
        format: 'pdf',
        filters: {},
        userId: 'test-user-id'
      });

      // Verify response status was set to 200
      expect(mockResponse.status).toHaveBeenCalledWith(200);

      // Verify response json was called with the mock report
      expect(mockResponse.json).toHaveBeenCalledWith(mockReportResponse);
    });

    /**
     * Tests that generateReport properly handles service errors
     */
    it('should handle service errors for report generation', async () => {
      // Mock analytics service generateReport to throw an error
      (jest.spyOn(mockAnalyticsService, 'generateReport') as jest.SpyInstance).mockRejectedValue(new Error('Service error'));

      // Create mock authenticated request with report parameters
      (mockRequest as any).user = mockAuthenticatedRequest.user;
      mockRequest.body = { 
        name: 'User Report', 
        description: 'Report of user activity', 
        categories: ['user'], 
        metrics: [], 
        period: 'monthly', 
        startDate: new Date(), 
        endDate: new Date(), 
        format: 'pdf', 
        filters: {} 
      };

      // Call the controller method
      await analyticsController.generateReport(mockRequest as any, mockResponse, mockNext);

      // Verify next function was called with the error
      expect(mockNext).toHaveBeenCalledWith(new Error('Service error'));
    });
  });

  /**
   * Test suite for the exportData controller method
   */
  describe('exportData', () => {
    /**
     * Tests that exportData returns export response with 200 status on success
     */
    it('should export data with 200 status', async () => {
      // Create mock export response
      const mockExportResponse: ExportResponse = {
        exportUrl: 'http://example.com/export.csv',
        expiresAt: new Date()
      };

      // Mock analytics service exportData to return the mock response
      (jest.spyOn(mockAnalyticsService, 'exportData') as jest.SpyInstance).mockResolvedValue(mockExportResponse);

      // Create mock authenticated request with export parameters in body
      (mockRequest as any).user = mockAuthenticatedRequest.user;
      mockRequest.body = { 
        dataType: 'user_activity', 
        filters: {}, 
        format: 'csv' 
      };

      // Call the controller method
      await analyticsController.exportData(mockRequest as any, mockResponse, mockNext);

      // Verify analytics service was called with correct parameters
      expect(mockAnalyticsService.exportData).toHaveBeenCalledWith({
        dataType: 'user_activity',
        filters: {},
        format: 'csv',
        userId: 'test-user-id'
      });

      // Verify response status was set to 200
      expect(mockResponse.status).toHaveBeenCalledWith(200);

      // Verify response json was called with the mock export response
      expect(mockResponse.json).toHaveBeenCalledWith(mockExportResponse);
    });

    /**
     * Tests that exportData properly handles service errors
     */
    it('should handle service errors for data export', async () => {
      // Mock analytics service exportData to throw an error
      (jest.spyOn(mockAnalyticsService, 'exportData') as jest.SpyInstance).mockRejectedValue(new Error('Service error'));

      // Create mock authenticated request with export parameters
      (mockRequest as any).user = mockAuthenticatedRequest.user;
      mockRequest.body = { 
        dataType: 'user_activity', 
        filters: {}, 
        format: 'csv' 
      };

      // Call the controller method
      await analyticsController.exportData(mockRequest as any, mockResponse, mockNext);

      // Verify next function was called with the error
      expect(mockNext).toHaveBeenCalledWith(new Error('Service error'));
    });
  });

  /**
   * Test suite for the trackEvent controller method
   */
  describe('trackEvent', () => {
    /**
     * Tests that trackEvent returns 202 status on successful event tracking
     */
    it('should track event with 202 status', async () => {
      // Mock analytics service trackEvent to resolve successfully
      (jest.spyOn(mockAnalyticsService, 'trackEvent') as jest.SpyInstance).mockResolvedValue(undefined);

      // Create mock authenticated request with event data in body
      (mockRequest as any).user = mockAuthenticatedRequest.user;
      mockRequest.body = { 
        eventType: 'user_login', 
        eventData: { location: 'US' } 
      };

      // Call the controller method
      await analyticsController.trackEvent(mockRequest as any, mockResponse, mockNext);

      // Verify analytics service was called with correct parameters including user context
      expect(mockAnalyticsService.trackEvent).toHaveBeenCalledWith({
        userId: 'test-user-id',
        userRole: Roles.ADMINISTRATOR,
        eventType: 'user_login',
        eventData: { location: 'US' },
        timestamp: expect.any(Date)
      });

      // Verify response status was set to 202
      expect(mockResponse.status).toHaveBeenCalledWith(202);

      // Verify response json was called with success message
      expect(mockResponse.send).toHaveBeenCalled();
    });

    /**
     * Tests that trackEvent properly handles service errors
     */
    it('should handle service errors for event tracking', async () => {
      // Mock analytics service trackEvent to throw an error
      (jest.spyOn(mockAnalyticsService, 'trackEvent') as jest.SpyInstance).mockRejectedValue(new Error('Service error'));

      // Create mock authenticated request with event data
      (mockRequest as any).user = mockAuthenticatedRequest.user;
      mockRequest.body = { 
        eventType: 'user_login', 
        eventData: { location: 'US' } 
      };

      // Call the controller method
      await analyticsController.trackEvent(mockRequest as any, mockResponse, mockNext);

      // Verify next function was called with the error
      expect(mockNext).toHaveBeenCalledWith(new Error('Service error'));
    });
  });
});