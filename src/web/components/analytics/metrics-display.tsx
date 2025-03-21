import React, { useMemo } from 'react';
import { cn } from '../../lib/utils/color';
import { formatNumber, formatPercentage } from '../../lib/utils/format';
import { Metric, MetricsDisplayProps } from '../../types/analytics';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import Chart from './chart';
import MetricsCard from '../dashboard/metrics-card';
import LoadingSpinner from '../common/loading-spinner';
import ErrorMessage from '../common/error-message';
import { useMediaQuery } from '../../hooks/use-media-query';

/**
 * Groups an array of metrics by their category property
 * @param metrics Array of metrics to group
 * @returns Object with category keys and arrays of metrics
 */
const groupMetricsByCategory = (metrics: Metric[]): Record<string, Metric[]> => {
  return metrics.reduce((result, metric) => {
    const category = metric.category || 'Uncategorized';
    if (!result[category]) {
      result[category] = [];
    }
    result[category].push(metric);
    return result;
  }, {} as Record<string, Metric[]>);
};

/**
 * Component that displays a collection of metrics with appropriate visualizations, trends, and formatting.
 * Supports grouping by category, responsive layouts, and various display options.
 */
const MetricsDisplay: React.FC<MetricsDisplayProps> = ({
  metrics,
  loading = false,
  error = false,
  title,
  description,
  className,
  groupByCategory = false,
  columns = 3,
  showCharts = true,
  compact = false,
  onMetricClick,
}) => {
  // Check if we're on a mobile viewport
  const isMobile = useMediaQuery('(max-width: 640px)');
  
  // Group metrics by category if requested
  const groupedMetrics = useMemo(() => {
    if (!groupByCategory || !metrics) return null;
    return groupMetricsByCategory(metrics);
  }, [groupByCategory, metrics]);
  
  // Handle loading state
  if (loading) {
    return (
      <section 
        className={cn("w-full", className)}
        aria-busy="true"
        aria-label={title || "Metrics Display"}
      >
        <Card>
          <CardContent className="flex items-center justify-center h-40">
            <LoadingSpinner text="Loading metrics..." />
          </CardContent>
        </Card>
      </section>
    );
  }
  
  // Handle error state
  if (error) {
    return (
      <section
        className={cn("w-full", className)}
        aria-label={title || "Metrics Display"}
      >
        <Card>
          <CardContent className="p-6">
            <ErrorMessage 
              error={typeof error === 'string' ? error : "Failed to load metrics"} 
            />
          </CardContent>
        </Card>
      </section>
    );
  }
  
  // Handle empty metrics
  if (!metrics || metrics.length === 0) {
    return (
      <section
        className={cn("w-full", className)}
        aria-label={title || "Metrics Display"}
      >
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            No metrics available
          </CardContent>
        </Card>
      </section>
    );
  }
  
  // Determine grid columns based on props and screen size
  const gridColumns = isMobile 
    ? 1 
    : Math.min(columns, metrics.length);
  
  const gridClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }[gridColumns] || 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
  
  // Render metrics grouped by category
  if (groupByCategory && groupedMetrics) {
    return (
      <section 
        className={cn("space-y-8", className)}
        aria-label={title || "Metrics by Category"}
      >
        {title && (
          <header>
            <h2 className="text-2xl font-bold" id="metrics-title">{title}</h2>
            {description && (
              <p className="text-gray-500 mt-1" id="metrics-description">
                {description}
              </p>
            )}
          </header>
        )}
        
        {Object.entries(groupedMetrics).map(([category, categoryMetrics]) => (
          <div 
            key={category} 
            className="space-y-4"
            role="region"
            aria-label={`${category} metrics`}
          >
            <h3 className="text-xl font-semibold">{category}</h3>
            <div 
              className={cn("grid gap-4", gridClass)}
              role="list"
              aria-label={`${category} metrics list`}
            >
              {categoryMetrics.map((metric) => (
                <div key={metric.id} role="listitem">
                  <MetricsCard
                    metric={metric}
                    showChart={showCharts}
                    compact={compact}
                    onClick={onMetricClick}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    );
  }
  
  // Render metrics in a simple grid
  return (
    <section 
      className={cn("space-y-6", className)}
      aria-label={title || "Metrics Display"}
      aria-describedby={description ? "metrics-description" : undefined}
    >
      {title && (
        <header>
          <h2 className="text-2xl font-bold" id="metrics-title">{title}</h2>
          {description && (
            <p className="text-gray-500 mt-1" id="metrics-description">
              {description}
            </p>
          )}
        </header>
      )}
      
      <div 
        className={cn("grid gap-4", gridClass)}
        role="list"
        aria-label="Metrics list"
      >
        {metrics.map((metric) => (
          <div key={metric.id} role="listitem">
            <MetricsCard
              metric={metric}
              showChart={showCharts}
              compact={compact}
              onClick={onMetricClick}
            />
          </div>
        ))}
      </div>
    </section>
  );
};

export default MetricsDisplay;