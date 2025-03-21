/**
 * Repository implementation for analytics data access in the Revolucare platform.
 * Provides methods to retrieve, store, and manage analytics data including metrics,
 * dashboards, and events.
 */
import { IAnalyticsRepository } from '../interfaces/analytics.interface';
import { 
  MetricsRequestDTO, 
  MetricsResponse, 
  Dashboard, 
  Metric, 
  AnalyticsEventDTO 
} from '../types/analytics.types';
import { prisma, executeWithTransaction } from '../config/database';
import { logger } from '../utils/logger';
import { METRIC_CATEGORIES, TIME_PERIODS } from '../constants/metrics';

export class AnalyticsRepository implements IAnalyticsRepository {
  constructor() {
    // Initialize the repository with default configuration
  }

  /**
   * Retrieves metrics based on the provided request parameters
   * @param request The metrics request parameters
   * @returns Promise resolving to the metrics response
   */
  async getMetrics(request: MetricsRequestDTO): Promise<MetricsResponse> {
    try {
      logger.info('Retrieving metrics', { request });
      
      // Extract parameters from the request
      const { category, types, period, startDate, endDate, filters } = request;
      
      // Validate the request parameters against allowed values
      if (!METRIC_CATEGORIES.includes(category as any)) {
        throw new Error(`Invalid metric category: ${category}`);
      }
      
      if (!TIME_PERIODS.includes(period as any)) {
        throw new Error(`Invalid time period: ${period}`);
      }
      
      // Build database queries based on the request parameters
      const query = this.buildMetricQuery(category, types, period, startDate, endDate, filters);
      
      // Execute queries to retrieve raw metric data
      const rawMetrics = await prisma.metric.findMany(query);
      
      // Process and transform the raw data into metric objects
      const metrics: Metric[] = rawMetrics.map(rawMetric => {
        // Get previous value for trend calculation
        const previousValue = rawMetric.previousValue || 0;
        const currentValue = rawMetric.value || 0;
        
        // Calculate trend and change percentage
        const { trend, changePercentage } = this.calculateTrend(currentValue, previousValue);
        
        return {
          id: rawMetric.id,
          name: rawMetric.name,
          description: rawMetric.description,
          category: rawMetric.category,
          value: currentValue,
          unit: rawMetric.unit,
          trend,
          changePercentage,
          period: rawMetric.period,
          lastUpdated: rawMetric.updatedAt
        };
      });
      
      // Return the metrics response with the processed metrics
      return {
        metrics,
        period,
        startDate,
        endDate
      };
    } catch (error) {
      logger.error('Error retrieving metrics', { 
        error: error instanceof Error ? error.message : String(error),
        request
      });
      throw error;
    }
  }
  
  /**
   * Retrieves a dashboard configuration for a specific user and role
   * @param userId The user ID
   * @param dashboardId The dashboard ID (optional)
   * @returns Promise resolving to the dashboard or null if not found
   */
  async getDashboard(userId: string, dashboardId?: string): Promise<Dashboard | null> {
    try {
      logger.info('Retrieving dashboard', { userId, dashboardId });
      
      // If dashboardId is provided, get that specific dashboard
      if (dashboardId) {
        const dashboard = await prisma.dashboard.findUnique({
          where: { id: dashboardId },
          include: { widgets: true }
        });
        
        // Check if dashboard belongs to user or is a default dashboard
        if (dashboard && (dashboard.userId === userId || dashboard.isDefault)) {
          // Update lastViewed timestamp
          await prisma.dashboard.update({
            where: { id: dashboard.id },
            data: { lastViewed: new Date() }
          });
          
          return dashboard as Dashboard;
        }
        
        return null;
      }
      
      // If no dashboardId, find user's dashboards
      const dashboard = await prisma.dashboard.findFirst({
        where: { userId },
        include: { widgets: true },
        orderBy: { lastViewed: 'desc' }
      });
      
      // If no user-specific dashboard, try to find a default
      if (!dashboard) {
        const defaultDashboard = await prisma.dashboard.findFirst({
          where: { isDefault: true },
          include: { widgets: true }
        });
        
        if (defaultDashboard) {
          await prisma.dashboard.update({
            where: { id: defaultDashboard.id },
            data: { lastViewed: new Date() }
          });
          
          return defaultDashboard as Dashboard;
        }
      } else {
        // Update lastViewed timestamp
        await prisma.dashboard.update({
          where: { id: dashboard.id },
          data: { lastViewed: new Date() }
        });
        
        return dashboard as Dashboard;
      }
      
      return null;
    } catch (error) {
      logger.error('Error retrieving dashboard', { 
        error: error instanceof Error ? error.message : String(error),
        userId,
        dashboardId
      });
      throw error;
    }
  }
  
  /**
   * Saves a dashboard configuration for a specific user and role
   * @param dashboard The dashboard to save
   * @returns Promise resolving to the saved dashboard
   */
  async saveDashboard(dashboard: Dashboard): Promise<Dashboard> {
    try {
      logger.info('Saving dashboard', { dashboardId: dashboard.id });
      
      return await executeWithTransaction(async (tx) => {
        // Check if a dashboard already exists for the user and role
        const existingDashboard = await tx.dashboard.findFirst({
          where: {
            userId: dashboard.userId,
            role: dashboard.role,
            ...(dashboard.id ? { id: dashboard.id } : {})
          }
        });
        
        let savedDashboard;
        
        if (existingDashboard) {
          // If exists, update the existing dashboard
          savedDashboard = await tx.dashboard.update({
            where: { id: existingDashboard.id },
            data: {
              title: dashboard.title,
              description: dashboard.description,
              layout: dashboard.layout,
              isDefault: dashboard.isDefault,
              updatedAt: new Date()
            }
          });
          
          // Delete existing widgets
          await tx.dashboardWidget.deleteMany({
            where: { dashboardId: existingDashboard.id }
          });
        } else {
          // If not exists, create a new dashboard record
          savedDashboard = await tx.dashboard.create({
            data: {
              userId: dashboard.userId,
              role: dashboard.role,
              title: dashboard.title,
              description: dashboard.description,
              layout: dashboard.layout,
              isDefault: dashboard.isDefault,
              lastViewed: new Date(),
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
        }
        
        // Save the dashboard widgets in a transaction
        const widgetPromises = dashboard.widgets.map(widget => 
          tx.dashboardWidget.create({
            data: {
              dashboardId: savedDashboard.id,
              title: widget.title,
              type: widget.type,
              metrics: widget.metrics,
              config: widget.config,
              position: widget.position
            }
          })
        );
        
        await Promise.all(widgetPromises);
        
        // Return the saved dashboard configuration
        return await tx.dashboard.findUnique({
          where: { id: savedDashboard.id },
          include: { widgets: true }
        }) as Dashboard;
      });
    } catch (error) {
      logger.error('Error saving dashboard', { 
        error: error instanceof Error ? error.message : String(error),
        dashboardId: dashboard.id
      });
      throw error;
    }
  }
  
  /**
   * Saves a metric value to the database
   * @param metric The metric to save
   * @returns Promise resolving to the saved metric
   */
  async saveMetric(metric: Metric): Promise<Metric> {
    try {
      logger.info('Saving metric', { metricName: metric.name, category: metric.category });
      
      // Check if the metric already exists in the database
      const existingMetric = await prisma.metric.findFirst({
        where: {
          name: metric.name,
          category: metric.category
        }
      });
      
      let savedMetric;
      
      if (existingMetric) {
        // If exists, update the existing metric
        const previousValue = existingMetric.value;
        
        savedMetric = await prisma.metric.update({
          where: { id: existingMetric.id },
          data: {
            value: metric.value,
            unit: metric.unit,
            previousValue,
            updatedAt: new Date()
          }
        });
      } else {
        // If not exists, create a new metric record
        savedMetric = await prisma.metric.create({
          data: {
            name: metric.name,
            description: metric.description,
            category: metric.category,
            value: metric.value,
            unit: metric.unit,
            period: metric.period,
            previousValue: 0,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
      }
      
      // Save historical data point for trend analysis
      await prisma.metricHistory.create({
        data: {
          metricId: savedMetric.id,
          value: metric.value,
          timestamp: new Date()
        }
      });
      
      // Calculate trend and change percentage
      const { trend, changePercentage } = this.calculateTrend(
        metric.value, 
        savedMetric.previousValue || 0
      );
      
      // Return the saved metric
      return {
        id: savedMetric.id,
        name: savedMetric.name,
        description: savedMetric.description,
        category: savedMetric.category,
        value: savedMetric.value,
        unit: savedMetric.unit,
        trend,
        changePercentage,
        period: savedMetric.period,
        lastUpdated: savedMetric.updatedAt
      };
    } catch (error) {
      logger.error('Error saving metric', { 
        error: error instanceof Error ? error.message : String(error),
        metricName: metric.name
      });
      throw error;
    }
  }
  
  /**
   * Saves an analytics event to the database
   * @param event The event to save
   * @returns Promise resolving when the event is saved
   */
  async saveEvent(event: AnalyticsEventDTO): Promise<void> {
    try {
      logger.info('Saving analytics event', { eventType: event.eventType });
      
      // Validate the event data
      if (!event.userId || !event.eventType) {
        throw new Error('Event requires userId and eventType');
      }
      
      // Create a new event record in the database
      await prisma.analyticsEvent.create({
        data: {
          userId: event.userId,
          userRole: event.userRole,
          eventType: event.eventType,
          eventData: event.eventData,
          timestamp: event.timestamp || new Date()
        }
      });
      
      // Log successful event storage
      logger.info('Successfully saved analytics event', { eventType: event.eventType });
    } catch (error) {
      logger.error('Error saving analytics event', { 
        error: error instanceof Error ? error.message : String(error),
        eventType: event.eventType
      });
      throw error;
    }
  }
  
  /**
   * Retrieves historical data for a specific metric
   * @param metricId The metric ID
   * @param startDate The start date for the history
   * @param endDate The end date for the history
   * @returns Promise resolving to an array of historical data points
   */
  async getMetricHistory(
    metricId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{ date: Date; value: number }[]> {
    try {
      logger.info('Retrieving metric history', { metricId, startDate, endDate });
      
      // Validate the input parameters
      if (!metricId) {
        throw new Error('Metric ID is required');
      }
      
      // Build a query to retrieve historical metric data
      const historyData = await prisma.metricHistory.findMany({
        where: {
          metricId,
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: { timestamp: 'asc' }
      });
      
      // Format the results as an array of data points
      return historyData.map(item => ({
        date: item.timestamp,
        value: item.value
      }));
    } catch (error) {
      logger.error('Error retrieving metric history', { 
        error: error instanceof Error ? error.message : String(error),
        metricId
      });
      throw error;
    }
  }
  
  /**
   * Builds a database query for retrieving metric data
   * @param category The metric category
   * @param types The metric types to include
   * @param period The time period
   * @param startDate The start date
   * @param endDate The end date
   * @param filters Additional filters
   * @returns Query object for Prisma
   */
  private buildMetricQuery(
    category: string,
    types: string[],
    period: string,
    startDate: Date,
    endDate: Date,
    filters: Record<string, any>
  ): object {
    // Create a base query object with time range filters
    const query: any = {
      where: {
        category,
        updatedAt: {
          gte: startDate,
          lte: endDate
        },
        period
      }
    };
    
    // Add category and type filters
    if (types && types.length > 0) {
      query.where.name = { in: types };
    }
    
    // Add custom filters from the request
    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        if (key !== 'category' && key !== 'period' && key !== 'name') {
          query.where[key] = value;
        }
      }
    }
    
    // Apply appropriate grouping based on the period
    query.orderBy = { name: 'asc' };
    
    // Return the complete query object
    return query;
  }
  
  /**
   * Calculates the trend and change percentage for a metric
   * @param currentValue The current value
   * @param previousValue The previous value
   * @returns Trend direction and percentage change
   */
  private calculateTrend(
    currentValue: number,
    previousValue: number
  ): { trend: 'up' | 'down' | 'stable'; changePercentage: number } {
    // Calculate the difference between current and previous values
    const difference = currentValue - previousValue;
    
    // Calculate the percentage change
    const changePercentage = previousValue !== 0
      ? (difference / Math.abs(previousValue)) * 100
      : (currentValue > 0 ? 100 : 0);
    
    // Determine the trend direction based on the change
    let trend: 'up' | 'down' | 'stable';
    
    if (Math.abs(changePercentage) < 1) {
      trend = 'stable';
    } else if (changePercentage > 0) {
      trend = 'up';
    } else {
      trend = 'down';
    }
    
    // Return the trend and change percentage
    return {
      trend,
      changePercentage: Math.round(changePercentage * 100) / 100 // Round to 2 decimal places
    };
  }
}