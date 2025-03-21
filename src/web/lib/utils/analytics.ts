import { format } from 'date-fns'; // v2.30.0
import { 
  Metric, 
  DataPoint, 
  MetricTrend, 
  TimePeriod 
} from '../../types/analytics';
import { formatDate, getDateRangeForPeriod } from './date';

/**
 * Calculates the trend direction and percentage change for a metric based on current and previous values
 * @param currentValue Current metric value
 * @param previousValue Previous metric value
 * @returns Object containing the trend direction and percentage change
 */
export function calculateMetricTrend(
  currentValue: number,
  previousValue: number
): { trend: MetricTrend; changePercentage: number } {
  // Avoid division by zero
  if (previousValue === 0) {
    return { trend: 'stable', changePercentage: 0 };
  }

  // Calculate percentage change
  const change = ((currentValue - previousValue) / previousValue) * 100;
  
  // Determine trend direction
  let trend: MetricTrend = 'stable';
  if (change > 0) {
    trend = 'up';
  } else if (change < 0) {
    trend = 'down';
  }
  
  // Return with absolute percentage change
  return { trend, changePercentage: Math.abs(change) };
}

/**
 * Formats a metric value based on its unit and precision
 * @param value Metric value
 * @param unit Unit of measurement
 * @param precision Number of decimal places
 * @returns Formatted metric value with appropriate unit
 */
export function formatMetricValue(
  value: number,
  unit: string,
  precision: number = 2
): string {
  if (value === undefined || value === null) {
    return 'N/A';
  }

  const formattedValue = value.toFixed(precision);

  switch (unit) {
    case '%':
      return `${formattedValue}%`;
    case '$':
      return `$${formattedValue}`;
    case 'ms':
      return `${formattedValue}ms`;
    case 'sec':
      return `${formattedValue}s`;
    case 'min':
      return `${formattedValue}min`;
    case 'hr':
      return `${formattedValue}hr`;
    case 'day':
      return `${formattedValue} days`;
    default:
      return unit ? `${formattedValue} ${unit}` : formattedValue;
  }
}

/**
 * Determines the appropriate color for a metric based on its value and thresholds
 * @param value Metric value
 * @param thresholds Warning and critical thresholds
 * @param isHigherBetter Whether higher values are better
 * @returns CSS color class name for the metric
 */
export function getMetricColor(
  value: number,
  thresholds: { warning: number | null; critical: number | null } = { warning: null, critical: null },
  isHigherBetter: boolean = true
): string {
  // If thresholds are not provided, return default color
  if (!thresholds.warning && !thresholds.critical) {
    return 'text-gray-700';
  }

  if (isHigherBetter) {
    // For metrics where higher is better (e.g., satisfaction score)
    if (thresholds.critical !== null && value <= thresholds.critical) {
      return 'text-red-500';
    }
    if (thresholds.warning !== null && value <= thresholds.warning) {
      return 'text-amber-500';
    }
    return 'text-green-500';
  } else {
    // For metrics where lower is better (e.g., error rate)
    if (thresholds.critical !== null && value >= thresholds.critical) {
      return 'text-red-500';
    }
    if (thresholds.warning !== null && value >= thresholds.warning) {
      return 'text-amber-500';
    }
    return 'text-green-500';
  }
}

/**
 * Returns the appropriate icon and color for a metric trend
 * @param trend Trend direction
 * @param isHigherBetter Whether higher values are better
 * @returns Object containing the icon and color class for the trend
 */
export function getTrendIcon(
  trend: MetricTrend,
  isHigherBetter: boolean = true
): { icon: string; color: string } {
  if (trend === 'up') {
    return {
      icon: '↑',
      color: isHigherBetter ? 'text-green-500' : 'text-red-500'
    };
  } else if (trend === 'down') {
    return {
      icon: '↓',
      color: isHigherBetter ? 'text-red-500' : 'text-green-500'
    };
  } else {
    return {
      icon: '→',
      color: 'text-gray-500'
    };
  }
}

/**
 * Prepares time-series data for chart visualization
 * @param dataPoints Array of data points
 * @param options Optional configuration options
 * @returns Processed data ready for chart visualization
 */
export function prepareChartData(
  dataPoints: DataPoint[],
  options: {
    timeFormat?: string;
    aggregation?: 'sum' | 'average' | 'min' | 'max';
    smoothing?: number;
    unit?: string;
    precision?: number;
  } = {}
): object {
  if (!dataPoints || dataPoints.length === 0) {
    return { labels: [], datasets: [{ data: [] }] };
  }
  
  // Sort data points by date
  const sortedData = [...dataPoints].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  // Format dates
  const timeFormat = options.timeFormat || 'MMM d';
  const labels = sortedData.map(point => formatDate(new Date(point.date), timeFormat));
  
  // Process values
  let values = sortedData.map(point => point.value);
  
  // Apply aggregation if specified
  if (options.aggregation && dataPoints.length > 1) {
    if (options.aggregation === 'sum') {
      const sum = values.reduce((acc, val) => acc + val, 0);
      values = values.map(() => sum);
    } else if (options.aggregation === 'average') {
      const avg = values.reduce((acc, val) => acc + val, 0) / values.length;
      values = values.map(() => avg);
    } else if (options.aggregation === 'min') {
      const min = Math.min(...values);
      values = values.map(() => min);
    } else if (options.aggregation === 'max') {
      const max = Math.max(...values);
      values = values.map(() => max);
    }
  }
  
  // Apply smoothing if specified (moving average)
  if (options.smoothing && options.smoothing > 0 && dataPoints.length > options.smoothing) {
    const windowSize = options.smoothing;
    const smoothedValues = [];
    
    for (let i = 0; i < values.length; i++) {
      const windowStart = Math.max(0, i - windowSize + 1);
      const windowEnd = i + 1;
      const windowValues = values.slice(windowStart, windowEnd);
      const sum = windowValues.reduce((acc, val) => acc + val, 0);
      smoothedValues.push(sum / windowValues.length);
    }
    
    values = smoothedValues;
  }
  
  // Format values based on unit and precision
  const formattedValues = values.map(value => {
    if (options.unit) {
      return formatMetricValue(value, options.unit, options.precision);
    }
    return value;
  });
  
  return {
    labels,
    datasets: [{
      data: values,
      formattedData: formattedValues
    }]
  };
}

/**
 * Aggregates multiple metrics into a single value based on the specified method
 * @param metrics Array of metrics to aggregate
 * @param aggregationMethod Method to use for aggregation
 * @returns Aggregated metric value
 */
export function aggregateMetrics(
  metrics: Metric[],
  aggregationMethod: 'sum' | 'average' | 'min' | 'max' | 'count' = 'average'
): number {
  // Filter out metrics with null or undefined values
  const validMetrics = metrics.filter(metric => 
    metric.value !== undefined && metric.value !== null
  );
  
  if (validMetrics.length === 0) {
    return 0;
  }
  
  const values = validMetrics.map(metric => metric.value);
  
  switch (aggregationMethod) {
    case 'sum':
      return values.reduce((sum, value) => sum + value, 0);
    case 'min':
      return Math.min(...values);
    case 'max':
      return Math.max(...values);
    case 'count':
      return validMetrics.length;
    case 'average':
    default:
      return values.reduce((sum, value) => sum + value, 0) / values.length;
  }
}

/**
 * Gets the start and end dates for a specified time period
 * @param period Time period (daily, weekly, monthly, etc.)
 * @param referenceDate Reference date for the period calculation
 * @returns Object containing start and end dates for the period
 */
export function getDateRangeFromPeriod(
  period: TimePeriod,
  referenceDate: Date = new Date()
): { startDate: Date; endDate: Date } {
  const { start, end } = getDateRangeForPeriod(referenceDate, period);
  return { startDate: start, endDate: end };
}

/**
 * Formats a metric object for display in the UI
 * @param metric Metric to format
 * @returns Formatted metric with display-ready properties
 */
export function formatMetricForDisplay(metric: Metric): object {
  const formattedValue = formatMetricValue(metric.value, metric.unit);
  const color = getMetricColor(
    metric.value, 
    metric.thresholds, 
    // Assume metrics with percentage change are better when higher,
    // unless their name indicates otherwise (like 'error', 'latency', etc.)
    !metric.name.toLowerCase().includes('error') && 
    !metric.name.toLowerCase().includes('latency') && 
    !metric.name.toLowerCase().includes('time')
  );
  
  const trendInfo = getTrendIcon(
    metric.trend, 
    // Same assumption as above
    !metric.name.toLowerCase().includes('error') && 
    !metric.name.toLowerCase().includes('latency') && 
    !metric.name.toLowerCase().includes('time')
  );
  
  return {
    ...metric,
    formattedValue,
    color,
    trendIcon: trendInfo.icon,
    trendColor: trendInfo.color,
    formattedLastUpdated: metric.lastUpdated ? 
      formatDate(new Date(metric.lastUpdated), 'MMM d, yyyy h:mm a') : 
      'Unknown'
  };
}

/**
 * Groups an array of metrics by their category
 * @param metrics Array of metrics to group
 * @returns Object with categories as keys and arrays of metrics as values
 */
export function groupMetricsByCategory(metrics: Metric[]): Record<string, Metric[]> {
  return metrics.reduce((grouped, metric) => {
    const category = metric.category;
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(metric);
    return grouped;
  }, {} as Record<string, Metric[]>);
}