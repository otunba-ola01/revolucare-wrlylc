import { Job } from 'bull'; // bull@^4.10.0
import { AnalyticsRepository } from '../../repositories/analytics.repository';
import { AnalyticsEventDTO, Metric, Dashboard } from '../../types/analytics.types';
import { analyticsCache } from '../../cache/analytics.cache';
import { METRIC_CATEGORIES, TIME_PERIODS } from '../../constants/metrics';
import { logger } from '../../utils/logger';

/**
 * Processes an analytics event job by saving the event data to the repository
 * @param job The Bull job containing the event data
 * @returns Promise that resolves when the event is processed
 */
export async function processAnalyticsEvent(job: Job): Promise<void> {
  try {
    const event = job.data.event as AnalyticsEventDTO;
    
    // Validate the event data structure
    if (!event || !event.userId || !event.eventType) {
      throw new Error('Event data is missing required fields: userId and eventType are required');
    }
    
    logger.info('Processing analytics event', { 
      eventType: event.eventType, 
      userId: event.userId,
      jobId: job.id
    });
    
    // Create analytics repository instance
    const repository = new AnalyticsRepository();
    
    // Save the event using repository
    await repository.saveEvent(event);
    
    logger.info('Successfully processed analytics event', { 
      eventType: event.eventType,
      jobId: job.id
    });
  } catch (error) {
    logger.error('Error processing analytics event', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      jobId: job.id,
      data: job.data
    });
    throw error; // Rethrow to let the queue handle the failure
  }
}

/**
 * Calculates metrics for a specific category and time period
 * @param job The Bull job containing the calculation parameters
 * @returns Promise that resolves when metrics are calculated
 */
export async function calculateMetrics(job: Job): Promise<void> {
  try {
    const { category, period, startDate, endDate, filters } = job.data;
    
    // Validate the input parameters
    if (!category || !period) {
      throw new Error('Missing required parameters: category and period are required');
    }
    
    if (!METRIC_CATEGORIES.includes(category as any)) {
      throw new Error(`Invalid metric category: ${category}`);
    }
    
    if (!TIME_PERIODS.includes(period as any)) {
      throw new Error(`Invalid time period: ${period}`);
    }
    
    // Ensure dates are valid Date objects
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default to last 30 days
    const end = endDate ? new Date(endDate) : new Date();
    
    logger.info('Calculating metrics', { 
      category, 
      period, 
      startDate: start.toISOString(), 
      endDate: end.toISOString(),
      jobId: job.id
    });
    
    // Create analytics repository instance
    const repository = new AnalyticsRepository();
    
    // Build metrics request object
    const metricsRequest = {
      category,
      types: [], // Empty array to get all metrics for the category
      period,
      startDate: start,
      endDate: end,
      filters: filters || {}
    };
    
    // Retrieve raw metrics data
    const rawData = await repository.getMetrics(metricsRequest);
    logger.debug('Retrieved raw metrics data', { 
      category, 
      metricCount: rawData.metrics.length 
    });
    
    // Get list of metric types to calculate based on category
    let metricNames: string[] = [];
    switch (category) {
      case 'user':
        metricNames = ['active_users', 'new_registrations', 'session_duration', 'retention_rate'];
        break;
      case 'care_plan':
        metricNames = ['plans_created', 'completion_rate', 'goal_achievement', 'time_to_create'];
        break;
      case 'provider':
        metricNames = ['provider_count', 'availability_rate', 'booking_rate', 'rating_avg'];
        break;
      case 'service':
        metricNames = ['services_delivered', 'service_utilization', 'service_satisfaction'];
        break;
      case 'system':
        metricNames = ['api_response_time', 'error_rate', 'uptime', 'request_count'];
        break;
      case 'business':
        metricNames = ['revenue', 'client_satisfaction', 'provider_satisfaction', 'roi'];
        break;
      default:
        metricNames = [];
    }
    
    // Process and save each metric
    const processedMetrics: Metric[] = [];
    
    for (const metricName of metricNames) {
      // Calculate the current value
      const currentValue = calculateMetricValue(metricName, rawData.metrics, category);
      
      // Find the existing metric to get previous value
      const existingMetric = rawData.metrics.find(m => m.name === metricName);
      const previousValue = existingMetric?.value || 0;
      
      // Format the metric with calculated data
      const metric = formatMetric(
        metricName,
        currentValue,
        category,
        period,
        previousValue
      );
      
      // Save the metric
      const savedMetric = await repository.saveMetric(metric);
      processedMetrics.push(savedMetric);
      
      logger.debug('Saved metric', { 
        name: metricName, 
        value: currentValue, 
        category, 
        period 
      });
    }
    
    // Invalidate related cache entries
    await analyticsCache.invalidateMetrics(category, period, start, end);
    
    logger.info('Successfully calculated metrics', { 
      category, 
      period,
      metricCount: processedMetrics.length,
      jobId: job.id
    });
  } catch (error) {
    logger.error('Error calculating metrics', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      jobId: job.id,
      data: job.data
    });
    throw error;
  }
}

/**
 * Updates dashboard data for users based on newly calculated metrics
 * @param job The Bull job containing dashboard update parameters
 * @returns Promise that resolves when dashboards are updated
 */
export async function updateDashboards(job: Job): Promise<void> {
  try {
    const { userIds, roles, categories, period } = job.data;
    
    logger.info('Updating dashboards', { 
      userCount: userIds?.length || 'all',
      roles: roles || 'all',
      categories: categories || 'all',
      period: period || 'default',
      jobId: job.id
    });
    
    // Create analytics repository instance
    const repository = new AnalyticsRepository();
    
    // If specific users are specified, update only their dashboards
    if (userIds && userIds.length > 0) {
      let updatedCount = 0;
      let skippedCount = 0;
      
      for (const userId of userIds) {
        try {
          // Get the user's current dashboard
          const dashboard = await repository.getDashboard(userId);
          
          // If no dashboard exists, skip this user
          if (!dashboard) {
            logger.debug('No dashboard found for user', { userId });
            skippedCount++;
            continue;
          }
          
          // Update each widget with latest metrics
          let dashboardUpdated = false;
          
          for (const widget of dashboard.widgets) {
            // Skip widgets that don't match the categories being updated
            if (categories && categories.length > 0) {
              const widgetCategories = widget.metrics.map(m => m.split(':')[0]);
              if (!widgetCategories.some(cat => categories.includes(cat))) {
                continue;
              }
            }
            
            // Get the latest metrics for this widget
            const widgetPeriod = period || widget.config?.period || 'monthly';
            const endDate = new Date();
            let startDate: Date;
            
            // Determine start date based on period
            switch (widgetPeriod) {
              case 'daily':
                startDate = new Date(endDate);
                startDate.setDate(startDate.getDate() - 1);
                break;
              case 'weekly':
                startDate = new Date(endDate);
                startDate.setDate(startDate.getDate() - 7);
                break;
              case 'monthly':
                startDate = new Date(endDate);
                startDate.setMonth(startDate.getMonth() - 1);
                break;
              case 'quarterly':
                startDate = new Date(endDate);
                startDate.setMonth(startDate.getMonth() - 3);
                break;
              case 'yearly':
                startDate = new Date(endDate);
                startDate.setFullYear(startDate.getFullYear() - 1);
                break;
              default:
                startDate = new Date(endDate);
                startDate.setMonth(startDate.getMonth() - 1);
            }
            
            // Update widget data
            try {
              // Extract metric information
              const metricRequests = widget.metrics.map(metric => {
                const [category, name] = metric.split(':');
                return { category, name };
              });
              
              // Group metrics by category for efficient querying
              const metricsByCategory: Record<string, string[]> = {};
              metricRequests.forEach(({ category, name }) => {
                if (!metricsByCategory[category]) {
                  metricsByCategory[category] = [];
                }
                metricsByCategory[category].push(name);
              });
              
              // Get latest metrics for each category
              let latestMetrics: Metric[] = [];
              
              for (const [category, names] of Object.entries(metricsByCategory)) {
                const metricsRequest = {
                  category,
                  types: names,
                  period: widgetPeriod,
                  startDate,
                  endDate,
                  filters: widget.config?.filters || {}
                };
                
                const categoryMetrics = await repository.getMetrics(metricsRequest);
                latestMetrics = [...latestMetrics, ...categoryMetrics.metrics];
              }
              
              // Update the widget with latest data
              if (widget.config) {
                widget.config.lastUpdated = new Date();
                widget.config.data = latestMetrics;
                dashboardUpdated = true;
              } else {
                widget.config = {
                  lastUpdated: new Date(),
                  data: latestMetrics,
                  period: widgetPeriod
                };
                dashboardUpdated = true;
              }
              
              logger.debug('Updated widget data', { 
                userId, 
                widgetTitle: widget.title, 
                metricCount: latestMetrics.length 
              });
            } catch (widgetError) {
              logger.error('Error updating widget', {
                error: widgetError instanceof Error ? widgetError.message : String(widgetError),
                userId,
                widgetTitle: widget.title
              });
              // Continue with other widgets even if one fails
            }
          }
          
          // Save the updated dashboard if any widgets were updated
          if (dashboardUpdated) {
            await repository.saveDashboard(dashboard);
            
            // Invalidate the dashboard cache
            await analyticsCache.invalidateDashboard(userId);
            
            logger.debug('Successfully updated dashboard', { 
              userId, 
              widgetCount: dashboard.widgets.length 
            });
            updatedCount++;
          } else {
            logger.debug('No widgets updated for dashboard', { userId });
            skippedCount++;
          }
        } catch (userError) {
          logger.error('Error updating user dashboard', {
            error: userError instanceof Error ? userError.message : String(userError),
            userId
          });
          skippedCount++;
          // Continue with other users even if one fails
        }
      }
      
      logger.info('Completed dashboard updates', { 
        updated: updatedCount,
        skipped: skippedCount,
        total: userIds.length,
        jobId: job.id
      });
    } else if (roles && roles.length > 0) {
      // For updating all users with specific roles, we'd typically query the database
      // This would be implemented based on the application's user management system
      logger.info('Role-based dashboard update would be implemented here', { 
        roles,
        jobId: job.id
      });
      
      // Implementation would depend on how users are stored and queried
      // For now, we'll just log that this would happen
    } else {
      logger.warn('No users or roles specified for dashboard update', { jobId: job.id });
    }
  } catch (error) {
    logger.error('Error updating dashboards', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      jobId: job.id,
      data: job.data
    });
    throw error;
  }
}

/**
 * Calculates a specific metric value based on raw data
 * @param metricName The name of the metric to calculate
 * @param rawData The raw data to use for calculation
 * @param category The metric category
 * @returns Calculated metric value
 */
function calculateMetricValue(
  metricName: string,
  rawData: any[],
  category: string
): number {
  // Guard against undefined raw data
  if (!rawData || !Array.isArray(rawData)) {
    return 0;
  }
  
  switch (metricName) {
    // User metrics
    case 'active_users':
      return rawData.filter(item => item.isActive).length;
    case 'new_registrations':
      return rawData.filter(item => item.isNew).length;
    case 'session_duration':
      // Calculate average session duration
      const durations = rawData.map(item => item.duration).filter(d => d > 0);
      return durations.length > 0 
        ? durations.reduce((sum, duration) => sum + duration, 0) / durations.length 
        : 0;
    case 'retention_rate':
      if (rawData.length === 0) return 0;
      const retained = rawData.filter(item => item.isRetained).length;
      return (retained / rawData.length) * 100;
      
    // Care plan metrics
    case 'plans_created':
      return rawData.filter(item => item.isCreated).length;
    case 'completion_rate':
      if (rawData.length === 0) return 0;
      const completed = rawData.filter(item => item.isCompleted).length;
      return (completed / rawData.length) * 100;
    case 'goal_achievement':
      if (rawData.length === 0) return 0;
      const achieved = rawData.filter(item => item.isAchieved).length;
      return (achieved / rawData.length) * 100;
    case 'time_to_create':
      const times = rawData.map(item => item.timeToCreate).filter(t => t > 0);
      return times.length > 0 
        ? times.reduce((sum, time) => sum + time, 0) / times.length 
        : 0;
      
    // Provider metrics
    case 'provider_count':
      return rawData.filter(item => item.isActive).length;
    case 'availability_rate':
      if (rawData.length === 0) return 0;
      const availableHours = rawData.reduce((sum, item) => sum + (item.availableHours || 0), 0);
      const totalHours = rawData.reduce((sum, item) => sum + (item.totalHours || 0), 0);
      return totalHours > 0 ? (availableHours / totalHours) * 100 : 0;
    case 'booking_rate':
      if (rawData.length === 0) return 0;
      const booked = rawData.filter(item => item.isBooked).length;
      return (booked / rawData.length) * 100;
    case 'rating_avg':
      const ratings = rawData.map(item => item.rating).filter(r => r > 0);
      return ratings.length > 0 
        ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
        : 0;
      
    // Service metrics  
    case 'services_delivered':
      return rawData.filter(item => item.isDelivered).length;
    case 'service_utilization':
      if (rawData.length === 0) return 0;
      const utilized = rawData.filter(item => item.isUtilized).length;
      return (utilized / rawData.length) * 100;
    case 'service_satisfaction':
      const satisfactionScores = rawData.map(item => item.satisfaction).filter(s => s > 0);
      return satisfactionScores.length > 0 
        ? satisfactionScores.reduce((sum, score) => sum + score, 0) / satisfactionScores.length 
        : 0;
      
    // System metrics
    case 'api_response_time':
      const responseTimes = rawData.map(item => item.responseTime).filter(t => t > 0);
      return responseTimes.length > 0 
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
        : 0;
    case 'error_rate':
      if (rawData.length === 0) return 0;
      const errors = rawData.filter(item => item.isError).length;
      return (errors / rawData.length) * 100;
    case 'uptime':
      if (rawData.length === 0) return 0;
      const upMinutes = rawData.reduce((sum, item) => sum + (item.upMinutes || 0), 0);
      const totalMinutes = rawData.reduce((sum, item) => sum + (item.totalMinutes || 0), 0);
      return totalMinutes > 0 ? (upMinutes / totalMinutes) * 100 : 0;
    case 'request_count':
      return rawData.length;
      
    // Business metrics
    case 'revenue':
      return rawData.reduce((sum, item) => sum + (item.revenue || 0), 0);
    case 'client_satisfaction':
      const clientScores = rawData.map(item => item.clientSatisfaction).filter(s => s > 0);
      return clientScores.length > 0 
        ? clientScores.reduce((sum, score) => sum + score, 0) / clientScores.length 
        : 0;
    case 'provider_satisfaction':
      const providerScores = rawData.map(item => item.providerSatisfaction).filter(s => s > 0);
      return providerScores.length > 0 
        ? providerScores.reduce((sum, score) => sum + score, 0) / providerScores.length 
        : 0;
    case 'roi':
      const investments = rawData.reduce((sum, item) => sum + (item.investment || 0), 0);
      const returns = rawData.reduce((sum, item) => sum + (item.returns || 0), 0);
      return investments > 0 ? (returns / investments) * 100 : 0;
      
    default:
      return 0;
  }
}

/**
 * Formats a raw metric value into a structured Metric object
 * @param name The metric name
 * @param value The metric value
 * @param category The metric category
 * @param period The time period
 * @param previousValue The previous value for trend calculation
 * @returns Formatted metric object
 */
function formatMetric(
  name: string,
  value: number,
  category: string,
  period: string,
  previousValue: number
): Metric {
  // Calculate trend and change percentage
  let trend: 'up' | 'down' | 'stable';
  const difference = value - previousValue;
  const changePercentage = previousValue !== 0
    ? (difference / Math.abs(previousValue)) * 100
    : (value > 0 ? 100 : 0);
    
  if (Math.abs(changePercentage) < 1) {
    trend = 'stable';
  } else if (changePercentage > 0) {
    trend = 'up';
  } else {
    trend = 'down';
  }
  
  // Determine unit based on metric type
  let unit = 'count';
  if (name.includes('rate') || name.includes('percentage') || name.includes('roi')) {
    unit = 'percentage';
  } else if (name.includes('time') || name.includes('duration')) {
    unit = 'time';
  } else if (name.includes('revenue') || name.includes('cost')) {
    unit = 'currency';
  } else if (name.includes('avg') || name.includes('satisfaction')) {
    unit = 'score';
  }
  
  // Set appropriate thresholds based on metric type
  const thresholds: { warning?: number; critical?: number } = {};
  
  // Different metrics have different threshold meanings
  if (unit === 'percentage') {
    if (name.includes('error')) {
      // For error rates, high values are bad
      thresholds.warning = 1; // 1% error rate
      thresholds.critical = 5; // 5% error rate
    } else {
      // For other percentages (like conversion), low values are bad
      thresholds.warning = 50; // 50% is concerning
      thresholds.critical = 30; // 30% is critical
    }
  } else if (unit === 'time') {
    // For time metrics, high values are usually bad
    if (name.includes('response')) {
      thresholds.warning = 500; // 500ms
      thresholds.critical = 1000; // 1s
    }
  }
  
  // Create the metric object
  return {
    id: `${category}-${name}-${period}`, // Temporary ID, will be replaced by repository
    name,
    description: `${name.replace(/_/g, ' ')} for ${period}`,
    category,
    value,
    unit,
    trend,
    changePercentage: Math.round(changePercentage * 100) / 100, // Round to 2 decimal places
    period,
    thresholds,
    lastUpdated: new Date()
  };
}