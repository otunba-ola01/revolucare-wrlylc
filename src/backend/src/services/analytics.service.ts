import { IAnalyticsService, IAnalyticsRepository, IAnalyticsCache } from '../interfaces/analytics.interface';
import { 
  MetricsRequestDTO, 
  MetricsResponse, 
  DashboardRequestDTO, 
  DashboardResponse, 
  ReportRequestDTO, 
  ReportResponse, 
  ExportRequestDTO, 
  ExportResponse, 
  AnalyticsEventDTO, 
  Dashboard, 
  Metric 
} from '../types/analytics.types';
import { analyticsCache } from '../cache/analytics.cache';
import { METRIC_CATEGORIES, TIME_PERIODS, DEFAULT_METRIC_TTL, DEFAULT_DASHBOARD_TTL } from '../constants/metrics';
import { logger } from '../utils/logger';
import { BlobStorageService } from './storage/blob-storage.service';
import Queue from 'bull'; // bull@^4.10.0

/**
 * Service implementation for analytics functionality in the Revolucare platform.
 * Provides methods for retrieving metrics, generating dashboards, creating reports,
 * exporting data, and tracking analytics events.
 */
export class AnalyticsService implements IAnalyticsService {
  private repository: IAnalyticsRepository;
  private storageService: BlobStorageService;
  private analyticsQueue: Queue.Queue;
  private readonly ANALYTICS_EVENT_JOB: string;
  private readonly CALCULATE_METRICS_JOB: string;

  /**
   * Initializes a new instance of the AnalyticsService class
   * @param repository The analytics repository for data access
   */
  constructor(repository: IAnalyticsRepository) {
    this.repository = repository;
    this.storageService = new BlobStorageService({
      serviceType: 'storage',
      timeout: 30000,
      retryConfig: {
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 10000,
        backoffFactor: 2,
        retryableStatusCodes: [408, 429, 500, 502, 503, 504]
      },
      enabled: true,
      endpoint: process.env.BLOB_STORE_URL || '',
      accessKey: process.env.BLOB_READ_WRITE_TOKEN || '',
      containerName: process.env.STORAGE_CONTAINER_NAME || 'revolucare-documents',
      region: 'auto'
    });
    
    // Initialize the analytics queue for background processing
    this.analyticsQueue = new Queue('analytics', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD,
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000
        },
        removeOnComplete: true,
        removeOnFail: false
      }
    });
    
    // Define job name constants
    this.ANALYTICS_EVENT_JOB = 'analytics:event';
    this.CALCULATE_METRICS_JOB = 'analytics:calculateMetrics';
    
    logger.info('AnalyticsService initialized');
  }

  /**
   * Retrieves metrics based on the provided request parameters
   * @param request The metrics request parameters
   * @returns Promise resolving to metrics response
   */
  async getMetrics(request: MetricsRequestDTO): Promise<MetricsResponse> {
    try {
      // Validate request parameters
      this.validateMetricsRequest(request);
      
      logger.debug('Getting metrics', { 
        category: request.category, 
        period: request.period 
      });
      
      // Try to get from cache first
      const cachedMetrics = await analyticsCache.getMetrics(
        request.category,
        request.period,
        request.startDate,
        request.endDate
      );
      
      if (cachedMetrics) {
        logger.debug('Returning cached metrics', { 
          category: request.category, 
          period: request.period 
        });
        return cachedMetrics;
      }
      
      // Cache miss, get from repository
      logger.debug('Cache miss, fetching metrics from repository', { 
        category: request.category, 
        period: request.period 
      });
      
      const metricsResponse = await this.repository.getMetrics(request);
      
      // Cache the result
      await analyticsCache.setMetrics(
        request,
        metricsResponse,
        DEFAULT_METRIC_TTL
      );
      
      logger.info('Successfully retrieved metrics', { 
        category: request.category, 
        period: request.period,
        metricCount: metricsResponse.metrics.length 
      });
      
      return metricsResponse;
    } catch (error) {
      logger.error('Error retrieving metrics', { 
        error: error instanceof Error ? error.message : String(error),
        category: request.category,
        period: request.period
      });
      throw error;
    }
  }

  /**
   * Retrieves a dashboard configuration and its associated metrics
   * @param request The dashboard request parameters
   * @returns Promise resolving to dashboard response
   */
  async getDashboard(request: DashboardRequestDTO): Promise<DashboardResponse> {
    try {
      const { userId, role, period } = request;
      
      logger.debug('Getting dashboard', { userId, role, period });
      
      // Try to get from cache first
      const cachedDashboard = await analyticsCache.getDashboard(userId);
      
      if (cachedDashboard) {
        logger.debug('Returning cached dashboard', { userId, role });
        return cachedDashboard;
      }
      
      // Cache miss, get from repository
      logger.debug('Cache miss, fetching dashboard from repository', { userId, role });
      
      // Retrieve dashboard configuration
      let dashboard = await this.repository.getDashboard(userId);
      
      // If no dashboard exists, create a default one
      if (!dashboard) {
        logger.info('No dashboard found for user, creating default dashboard', { userId, role });
        dashboard = this.createDefaultDashboard(userId, role);
        await this.repository.saveDashboard(dashboard);
      }
      
      // Fetch metrics for each widget in the dashboard
      const metrics: Metric[] = [];
      
      for (const widget of dashboard.widgets) {
        // Skip widgets without metrics
        if (!widget.metrics || widget.metrics.length === 0) {
          continue;
        }
        
        // Prepare metrics request for the widget
        const metricsRequest: MetricsRequestDTO = {
          category: widget.config.category || 'user',
          types: widget.metrics,
          period: period || 'monthly',
          startDate: request.startDate,
          endDate: request.endDate,
          filters: widget.config.filters || {}
        };
        
        try {
          // Get metrics for this widget
          const widgetMetrics = await this.getMetrics(metricsRequest);
          metrics.push(...widgetMetrics.metrics);
        } catch (error) {
          logger.warn('Failed to get metrics for widget', { 
            widgetId: widget.id,
            error: error instanceof Error ? error.message : String(error)
          });
          // Continue with other widgets even if one fails
        }
      }
      
      // Assemble the dashboard response
      const dashboardResponse: DashboardResponse = {
        dashboard,
        metrics,
        period: request.period,
        startDate: request.startDate,
        endDate: request.endDate
      };
      
      // Cache the dashboard response
      await analyticsCache.setDashboard(
        dashboardResponse,
        userId,
        role,
        DEFAULT_DASHBOARD_TTL
      );
      
      logger.info('Successfully retrieved dashboard', { 
        userId, 
        role,
        widgetCount: dashboard.widgets.length,
        metricCount: metrics.length
      });
      
      return dashboardResponse;
    } catch (error) {
      logger.error('Error retrieving dashboard', { 
        error: error instanceof Error ? error.message : String(error),
        userId: request.userId,
        role: request.role
      });
      throw error;
    }
  }

  /**
   * Generates a custom report based on provided criteria
   * @param request The report generation request parameters
   * @returns Promise resolving to report response
   */
  async generateReport(request: ReportRequestDTO): Promise<ReportResponse> {
    try {
      const { name, description, categories, metrics, period, startDate, endDate, format, filters } = request;
      
      logger.debug('Generating report', { name, categories, format });
      
      // Validate request parameters
      if (!name || !format || !categories || !Array.isArray(categories) || categories.length === 0) {
        throw new Error('Invalid report request parameters');
      }
      
      // Get metrics data for each category
      const allMetrics: Metric[] = [];
      
      for (const category of categories) {
        // Prepare metrics request
        const metricsRequest: MetricsRequestDTO = {
          category,
          types: metrics || [],
          period,
          startDate,
          endDate,
          filters
        };
        
        try {
          // Get metrics for this category
          const categoryMetrics = await this.getMetrics(metricsRequest);
          allMetrics.push(...categoryMetrics.metrics);
        } catch (error) {
          logger.warn('Failed to get metrics for category in report', { 
            category,
            error: error instanceof Error ? error.message : String(error)
          });
          // Continue with other categories even if one fails
        }
      }
      
      // Generate the report file
      const reportBuffer = await this.generateReportFile(allMetrics, format, name, description);
      
      // Upload the report file to blob storage
      const timestamp = new Date().toISOString().replace(/[-:.]/g, '');
      const fileName = `${name.replace(/\s+/g, '_')}_${timestamp}.${format}`;
      
      const uploadResult = await this.storageService.uploadFile(
        reportBuffer,
        request.userId || 'system',
        fileName,
        'other',
        format === 'pdf' ? 'application/pdf' : 
          format === 'csv' ? 'text/csv' : 
          format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 
          'application/json'
      );
      
      // Generate a signed URL for downloading the report
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // URL valid for 24 hours
      
      const url = await this.storageService.generateSignedUrl(uploadResult.storageUrl, {
        expiresIn: 86400, // 24 hours in seconds
        contentType: uploadResult.contentType,
        responseDisposition: 'attachment'
      });
      
      // Create the report response
      const reportResponse: ReportResponse = {
        id: timestamp,
        name,
        format,
        url,
        expiresAt,
        createdAt: new Date()
      };
      
      logger.info('Successfully generated report', { 
        name, 
        format,
        metricCount: allMetrics.length,
        size: uploadResult.size
      });
      
      return reportResponse;
    } catch (error) {
      logger.error('Error generating report', { 
        error: error instanceof Error ? error.message : String(error),
        name: request.name,
        format: request.format
      });
      throw error;
    }
  }

  /**
   * Exports data in the requested format based on provided parameters
   * @param request The data export request parameters
   * @returns Promise resolving to export response
   */
  async exportData(request: ExportRequestDTO): Promise<ExportResponse> {
    try {
      const { dataType, filters, format } = request;
      
      logger.debug('Exporting data', { dataType, format });
      
      // Validate request parameters
      if (!dataType || !format) {
        throw new Error('Invalid export request parameters');
      }
      
      // Retrieve data based on data type and filters
      let exportData: any[];
      
      switch (dataType) {
        case 'user_activity':
          // Retrieve user activity data
          exportData = await this.repository.getUserActivityData(filters);
          break;
        case 'provider_performance':
          // Retrieve provider performance data
          exportData = await this.repository.getProviderPerformanceData(filters);
          break;
        case 'care_plan_outcomes':
          // Retrieve care plan outcome data
          exportData = await this.repository.getCarePlanOutcomeData(filters);
          break;
        case 'service_utilization':
          // Retrieve service utilization data
          exportData = await this.repository.getServiceUtilizationData(filters);
          break;
        default:
          throw new Error(`Unsupported data type: ${dataType}`);
      }
      
      // Generate the export file
      let exportBuffer: Buffer;
      let contentType: string;
      
      switch (format) {
        case 'csv':
          exportBuffer = this.generateCSVExport(exportData);
          contentType = 'text/csv';
          break;
        case 'excel':
          exportBuffer = await this.generateExcelExport(exportData);
          contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;
        case 'json':
          exportBuffer = Buffer.from(JSON.stringify(exportData, null, 2));
          contentType = 'application/json';
          break;
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
      
      // Upload the export file to blob storage
      const timestamp = new Date().toISOString().replace(/[-:.]/g, '');
      const fileName = `${dataType}_export_${timestamp}.${format}`;
      
      const uploadResult = await this.storageService.uploadFile(
        exportBuffer,
        request.userId || 'system',
        fileName,
        'other',
        contentType
      );
      
      // Generate a signed URL for downloading the export
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // URL valid for 24 hours
      
      const exportUrl = await this.storageService.generateSignedUrl(uploadResult.storageUrl, {
        expiresIn: 86400, // 24 hours in seconds
        contentType: uploadResult.contentType,
        responseDisposition: 'attachment'
      });
      
      logger.info('Successfully exported data', { 
        dataType, 
        format,
        recordCount: exportData.length,
        size: uploadResult.size
      });
      
      return {
        exportUrl,
        expiresAt
      };
    } catch (error) {
      logger.error('Error exporting data', { 
        error: error instanceof Error ? error.message : String(error),
        dataType: request.dataType,
        format: request.format
      });
      throw error;
    }
  }

  /**
   * Tracks an analytics event and updates related metrics
   * @param event The analytics event data
   * @returns Promise that resolves when the event is tracked
   */
  async trackEvent(event: AnalyticsEventDTO): Promise<void> {
    try {
      // Validate event data
      if (!event.userId || !event.eventType) {
        throw new Error('Invalid event data: userId and eventType are required');
      }
      
      // Ensure timestamp is set
      if (!event.timestamp) {
        event.timestamp = new Date();
      }
      
      logger.debug('Tracking analytics event', {
        userId: event.userId,
        eventType: event.eventType
      });
      
      // Add event to the processing queue
      await this.analyticsQueue.add(this.ANALYTICS_EVENT_JOB, { event }, {
        priority: 10,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000
        }
      });
      
      logger.debug('Successfully queued analytics event', {
        userId: event.userId,
        eventType: event.eventType
      });
    } catch (error) {
      logger.error('Error tracking analytics event', {
        error: error instanceof Error ? error.message : String(error),
        userId: event.userId,
        eventType: event.eventType
      });
      
      // Re-throw the error to be handled by the caller
      throw error;
    }
  }
  
  /**
   * Queues a background job to calculate metrics for a specific category and period
   * @param category The metric category
   * @param period The time period
   * @param startDate The start date
   * @param endDate The end date
   * @returns Promise that resolves when the job is queued
   */
  async calculateMetrics(
    category: string,
    period: string,
    startDate: Date,
    endDate: Date
  ): Promise<void> {
    try {
      // Validate parameters
      if (!category || !period) {
        throw new Error('Invalid parameters: category and period are required');
      }
      
      logger.debug('Queuing metrics calculation job', {
        category,
        period
      });
      
      // Add job to the processing queue
      await this.analyticsQueue.add(this.CALCULATE_METRICS_JOB, {
        category,
        period,
        startDate,
        endDate
      }, {
        priority: 5,
        attempts: 2,
        backoff: {
          type: 'fixed',
          delay: 10000
        }
      });
      
      logger.debug('Successfully queued metrics calculation job', {
        category,
        period
      });
    } catch (error) {
      logger.error('Error queuing metrics calculation job', {
        error: error instanceof Error ? error.message : String(error),
        category,
        period
      });
      
      // Re-throw the error to be handled by the caller
      throw error;
    }
  }
  
  /**
   * Validates a metrics request against allowed values
   * @param request The metrics request to validate
   * @returns True if the request is valid
   * @throws Error if validation fails
   */
  private validateMetricsRequest(request: MetricsRequestDTO): boolean {
    // Check for required fields
    if (!request.category || !request.period) {
      throw new Error('Missing required parameters: category and period are required');
    }
    
    // Check if category is valid
    if (!METRIC_CATEGORIES.includes(request.category as any)) {
      throw new Error(`Invalid category: ${request.category}. Must be one of: ${METRIC_CATEGORIES.join(', ')}`);
    }
    
    // Check if period is valid
    if (!TIME_PERIODS.includes(request.period as any)) {
      throw new Error(`Invalid period: ${request.period}. Must be one of: ${TIME_PERIODS.join(', ')}`);
    }
    
    // Check date range
    if (request.startDate && request.endDate) {
      const start = new Date(request.startDate);
      const end = new Date(request.endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new Error('Invalid date format for startDate or endDate');
      }
      
      if (start > end) {
        throw new Error('startDate must be before endDate');
      }
    }
    
    return true;
  }
  
  /**
   * Formats raw metric data into structured Metric objects
   * @param rawMetrics Raw metric data from repository
   * @param category Metric category
   * @param period Time period
   * @returns Array of formatted metrics
   */
  private formatMetrics(rawMetrics: any[], category: string, period: string): Metric[] {
    return rawMetrics.map(raw => {
      // Calculate trend and change percentage by comparing with previous value if available
      let trend: 'up' | 'down' | 'stable' = 'stable';
      let changePercentage = 0;
      
      if (raw.previousValue !== undefined && raw.previousValue !== null) {
        const currentValue = raw.value || 0;
        const previousValue = raw.previousValue || 0;
        
        if (currentValue > previousValue) {
          trend = 'up';
          changePercentage = previousValue === 0 ? 100 : ((currentValue - previousValue) / previousValue) * 100;
        } else if (currentValue < previousValue) {
          trend = 'down';
          changePercentage = previousValue === 0 ? 0 : ((previousValue - currentValue) / previousValue) * 100;
        }
        
        // Round to 1 decimal place
        changePercentage = Math.round(changePercentage * 10) / 10;
      }
      
      const metric: Metric = {
        id: raw.id || `${category}-${raw.name}-${Date.now()}`,
        name: raw.name,
        description: raw.description || `${raw.name} for ${period} period`,
        category,
        value: raw.value || 0,
        unit: raw.unit || 'count',
        trend,
        changePercentage,
        period,
        lastUpdated: raw.lastUpdated || new Date()
      };
      
      // Add thresholds if available
      if (raw.thresholds) {
        metric.thresholds = raw.thresholds;
      }
      
      // Add historical data if available
      if (raw.historicalData) {
        metric.historicalData = raw.historicalData;
      }
      
      return metric;
    });
  }
  
  /**
   * Generates a report file in the requested format
   * @param metrics Metrics data to include in the report
   * @param format Report file format
   * @param name Report name
   * @param description Report description
   * @returns Promise resolving to the report file buffer
   */
  private async generateReportFile(
    metrics: Metric[],
    format: string,
    name: string,
    description: string
  ): Promise<Buffer> {
    switch (format) {
      case 'pdf':
        return this.generatePDFReport(metrics, name, description);
      case 'csv':
        return this.generateCSVReport(metrics);
      case 'excel':
        return this.generateExcelReport(metrics, name, description);
      case 'json':
        return Buffer.from(JSON.stringify({
          name,
          description,
          generatedAt: new Date().toISOString(),
          metrics
        }, null, 2));
      default:
        throw new Error(`Unsupported report format: ${format}`);
    }
  }
  
  /**
   * Generates a PDF report with metrics data
   * @param metrics Metrics data to include
   * @param name Report name
   * @param description Report description
   * @returns Promise resolving to PDF buffer
   */
  private async generatePDFReport(metrics: Metric[], name: string, description: string): Promise<Buffer> {
    // In a real implementation, this would use a PDF generation library
    // like PDFKit, jsPDF, or react-pdf
    
    // For this example, we'll just return a placeholder buffer
    // with a message indicating what would be generated
    const placeholder = `PDF Report: ${name}\n${description}\n\nMetrics: ${metrics.length}`;
    return Buffer.from(placeholder);
  }
  
  /**
   * Generates a CSV report with metrics data
   * @param metrics Metrics data to include
   * @returns CSV buffer
   */
  private generateCSVReport(metrics: Metric[]): Buffer {
    // Generate CSV headers
    const headers = [
      'ID', 'Name', 'Description', 'Category', 'Value', 'Unit', 
      'Trend', 'Change %', 'Period', 'Last Updated'
    ].join(',');
    
    // Generate CSV rows
    const rows = metrics.map(metric => {
      return [
        metric.id,
        `"${metric.name.replace(/"/g, '""')}"`,
        `"${metric.description.replace(/"/g, '""')}"`,
        metric.category,
        metric.value,
        metric.unit,
        metric.trend,
        metric.changePercentage,
        metric.period,
        metric.lastUpdated.toISOString()
      ].join(',');
    });
    
    // Combine headers and rows
    const csv = [headers, ...rows].join('\n');
    
    return Buffer.from(csv);
  }
  
  /**
   * Generates an Excel report with metrics data
   * @param metrics Metrics data to include
   * @param name Report name
   * @param description Report description
   * @returns Promise resolving to Excel buffer
   */
  private async generateExcelReport(metrics: Metric[], name: string, description: string): Promise<Buffer> {
    // In a real implementation, this would use a library like ExcelJS
    // to create a properly formatted Excel file
    
    // For this example, we'll just return a placeholder buffer
    // with a message indicating what would be generated
    const placeholder = `Excel Report: ${name}\n${description}\n\nMetrics: ${metrics.length}`;
    return Buffer.from(placeholder);
  }
  
  /**
   * Generates a CSV export file
   * @param data Data to export
   * @returns CSV buffer
   */
  private generateCSVExport(data: any[]): Buffer {
    if (!data || data.length === 0) {
      return Buffer.from('No data');
    }
    
    // Generate CSV headers using the keys from the first object
    const headers = Object.keys(data[0]).join(',');
    
    // Generate CSV rows
    const rows = data.map(item => {
      return Object.values(item).map(value => {
        // Handle string values that might contain commas or quotes
        if (typeof value === 'string') {
          return `"${value.replace(/"/g, '""')}"`;
        }
        // Handle date values
        if (value instanceof Date) {
          return value.toISOString();
        }
        // Handle null/undefined
        if (value === null || value === undefined) {
          return '';
        }
        // Handle everything else
        return String(value);
      }).join(',');
    });
    
    // Combine headers and rows
    const csv = [headers, ...rows].join('\n');
    
    return Buffer.from(csv);
  }
  
  /**
   * Generates an Excel export file
   * @param data Data to export
   * @returns Promise resolving to Excel buffer
   */
  private async generateExcelExport(data: any[]): Promise<Buffer> {
    // In a real implementation, this would use a library like ExcelJS
    // to create a properly formatted Excel file
    
    // For this example, we'll just return a placeholder buffer
    // with a message indicating what would be generated
    const placeholder = `Excel Export\n\nRecords: ${data.length}`;
    return Buffer.from(placeholder);
  }
  
  /**
   * Calculates start and end dates based on a time period
   * @param period The time period
   * @returns Date range for the specified period
   */
  private getDateRangeForPeriod(period: string): { startDate: Date; endDate: Date } {
    const endDate = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'daily':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarterly':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'yearly':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        // Default to monthly
        startDate.setMonth(startDate.getMonth() - 1);
    }
    
    return { startDate, endDate };
  }
  
  /**
   * Creates a default dashboard configuration for a specific role
   * @param userId User ID
   * @param role User role
   * @returns Default dashboard configuration
   */
  private createDefaultDashboard(userId: string, role: string): Dashboard {
    const now = new Date();
    
    const dashboard: Dashboard = {
      id: `default-${userId}-${now.getTime()}`,
      userId,
      role: role as any,
      title: `${role.charAt(0).toUpperCase() + role.slice(1)} Dashboard`,
      description: `Default dashboard for ${role} role`,
      widgets: [],
      layout: {
        columns: 12,
        rowHeight: 50,
        padding: 10,
        config: {}
      },
      isDefault: true,
      lastViewed: now,
      createdAt: now,
      updatedAt: now
    };
    
    // Add role-specific widgets
    switch (role) {
      case 'client':
        // Client dashboard
        dashboard.widgets = [
          {
            id: `widget-care-plan-progress-${now.getTime()}`,
            title: 'Care Plan Progress',
            type: 'gauge',
            metrics: ['completion_rate'],
            config: {
              category: 'care_plan',
              thresholds: { warning: 60, critical: 40 },
              filters: {}
            },
            position: { x: 0, y: 0, w: 6, h: 4 }
          },
          {
            id: `widget-upcoming-appointments-${now.getTime()}`,
            title: 'Upcoming Appointments',
            type: 'table',
            metrics: ['appointment_count'],
            config: {
              category: 'service',
              displayLimit: 5,
              filters: {}
            },
            position: { x: 6, y: 0, w: 6, h: 4 }
          },
          {
            id: `widget-provider-ratings-${now.getTime()}`,
            title: 'Provider Ratings',
            type: 'bar_chart',
            metrics: ['rating_avg'],
            config: {
              category: 'provider',
              filters: {}
            },
            position: { x: 0, y: 4, w: 12, h: 4 }
          }
        ];
        break;
        
      case 'provider':
        // Provider dashboard
        dashboard.widgets = [
          {
            id: `widget-client-metrics-${now.getTime()}`,
            title: 'Client Metrics',
            type: 'stat_card',
            metrics: ['active_clients', 'new_clients'],
            config: {
              category: 'user',
              filters: {}
            },
            position: { x: 0, y: 0, w: 6, h: 3 }
          },
          {
            id: `widget-service-delivery-${now.getTime()}`,
            title: 'Service Delivery',
            type: 'line_chart',
            metrics: ['services_delivered', 'service_completion'],
            config: {
              category: 'service',
              filters: {}
            },
            position: { x: 6, y: 0, w: 6, h: 3 }
          },
          {
            id: `widget-ratings-${now.getTime()}`,
            title: 'Your Ratings',
            type: 'bar_chart',
            metrics: ['rating_avg'],
            config: {
              category: 'provider',
              filters: {}
            },
            position: { x: 0, y: 3, w: 6, h: 4 }
          },
          {
            id: `widget-availability-${now.getTime()}`,
            title: 'Availability Utilization',
            type: 'pie_chart',
            metrics: ['availability_rate', 'booking_rate'],
            config: {
              category: 'provider',
              filters: {}
            },
            position: { x: 6, y: 3, w: 6, h: 4 }
          }
        ];
        break;
        
      case 'case_manager':
        // Case manager dashboard
        dashboard.widgets = [
          {
            id: `widget-client-overview-${now.getTime()}`,
            title: 'Client Overview',
            type: 'stat_card',
            metrics: ['active_users', 'new_registrations'],
            config: {
              category: 'user',
              filters: {}
            },
            position: { x: 0, y: 0, w: 6, h: 3 }
          },
          {
            id: `widget-care-plan-effectiveness-${now.getTime()}`,
            title: 'Care Plan Effectiveness',
            type: 'line_chart',
            metrics: ['goal_achievement', 'plans_created'],
            config: {
              category: 'care_plan',
              filters: {}
            },
            position: { x: 6, y: 0, w: 6, h: 3 }
          },
          {
            id: `widget-service-utilization-${now.getTime()}`,
            title: 'Service Utilization',
            type: 'bar_chart',
            metrics: ['service_utilization', 'services_delivered'],
            config: {
              category: 'service',
              filters: {}
            },
            position: { x: 0, y: 3, w: 6, h: 4 }
          },
          {
            id: `widget-provider-performance-${now.getTime()}`,
            title: 'Provider Performance',
            type: 'table',
            metrics: ['provider_count', 'rating_avg'],
            config: {
              category: 'provider',
              displayLimit: 10,
              filters: {}
            },
            position: { x: 6, y: 3, w: 6, h: 4 }
          }
        ];
        break;
        
      case 'administrator':
        // Administrator dashboard
        dashboard.widgets = [
          {
            id: `widget-system-health-${now.getTime()}`,
            title: 'System Health',
            type: 'stat_card',
            metrics: ['api_response_time', 'error_rate', 'uptime'],
            config: {
              category: 'system',
              filters: {}
            },
            position: { x: 0, y: 0, w: 6, h: 3 }
          },
          {
            id: `widget-user-activity-${now.getTime()}`,
            title: 'User Activity',
            type: 'line_chart',
            metrics: ['active_users', 'session_duration'],
            config: {
              category: 'user',
              filters: {}
            },
            position: { x: 6, y: 0, w: 6, h: 3 }
          },
          {
            id: `widget-services-${now.getTime()}`,
            title: 'Service Distribution',
            type: 'pie_chart',
            metrics: ['services_delivered', 'service_utilization'],
            config: {
              category: 'service',
              filters: {}
            },
            position: { x: 0, y: 3, w: 6, h: 4 }
          },
          {
            id: `widget-business-metrics-${now.getTime()}`,
            title: 'Business Metrics',
            type: 'bar_chart',
            metrics: ['revenue', 'cost_savings'],
            config: {
              category: 'business',
              filters: {}
            },
            position: { x: 6, y: 3, w: 6, h: 4 }
          }
        ];
        break;
        
      default:
        // Default dashboard for any other role
        dashboard.widgets = [
          {
            id: `widget-general-metrics-${now.getTime()}`,
            title: 'General Metrics',
            type: 'stat_card',
            metrics: ['active_users', 'services_delivered'],
            config: {
              category: 'user',
              filters: {}
            },
            position: { x: 0, y: 0, w: 12, h: 3 }
          }
        ];
    }
    
    return dashboard;
  }
}