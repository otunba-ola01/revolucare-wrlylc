import * as React from 'react';
import { ArrowUpIcon, ArrowDownIcon, MinusIcon, InfoIcon } from 'lucide-react'; // v0.284.0
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { formatNumber, formatPercentage, formatCurrency } from '../../lib/utils/format';
import { cn } from '../../lib/utils/color';

export interface StatCardProps {
  /** The title or label of the statistic */
  title: string;
  /** The value of the statistic to display */
  value: number | string;
  /** Optional description or subtitle for the statistic */
  description?: string;
  /** Optional trend direction to display with an icon */
  trend?: 'up' | 'down' | 'stable';
  /** The unit type of the value for proper formatting */
  unit?: 'number' | 'percentage' | 'currency';
  /** Optional percentage change to display alongside the trend */
  change?: number;
  /** Optional tooltip text to provide additional context */
  tooltip?: string;
  /** Optional additional CSS classes to apply to the card */
  className?: string;
  /** Optional click handler for the card */
  onClick?: () => void;
  /** Optional flag to indicate if an upward trend is positive (default: true) */
  isPositive?: boolean;
}

/**
 * StatCard Component
 * 
 * A reusable component for displaying statistics in card format on dashboards.
 * The component provides a simple, clean visualization of key metrics with optional
 * trend indicators and tooltips for additional context.
 *
 * Features:
 * - Formatted statistic value with support for numbers, percentages, and currency
 * - Optional trend indicator with directional arrow and percentage change
 * - Color-coded trends based on positive/negative context
 * - Optional tooltip for additional information
 * - Clickable card with hover effects when onClick is provided
 * - Responsive and accessible design
 */
export function StatCard({
  title,
  value,
  description,
  trend,
  unit = 'number',
  change,
  tooltip,
  className,
  onClick,
  isPositive = true
}: StatCardProps): JSX.Element {
  // Determine trend icon
  const TrendIcon = React.useMemo(() => {
    if (trend === 'up') return ArrowUpIcon;
    if (trend === 'down') return ArrowDownIcon;
    return MinusIcon;
  }, [trend]);

  // Determine trend badge color based on trend direction and whether increasing is positive
  const trendColor = React.useMemo(() => {
    if (!trend) return 'default';
    if (trend === 'stable') return 'secondary';
    
    const isPositiveTrend = (trend === 'up' && isPositive) || (trend === 'down' && !isPositive);
    return isPositiveTrend ? 'success' : 'error';
  }, [trend, isPositive]);

  // Format value based on unit type
  const formattedValue = React.useMemo(() => {
    if (value === undefined || value === null) return '-';
    
    try {
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      
      if (isNaN(numValue)) return '-';
      
      if (unit === 'percentage') return formatPercentage(numValue);
      if (unit === 'currency') return formatCurrency(numValue);
      return formatNumber(numValue);
    } catch (error) {
      console.error('Error formatting stat value:', error);
      return '-';
    }
  }, [value, unit]);

  return (
    <Card 
      className={cn(
        "overflow-hidden", 
        onClick && "cursor-pointer hover:shadow-md transition-shadow", 
        className
      )}
      onClick={onClick}
      {...(onClick ? { 
        role: "button", 
        tabIndex: 0,
        onKeyDown: (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        }
      } : {})}
    >
      <CardContent className="p-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {tooltip ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 cursor-help">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          {title}
                        </span>
                        <InfoIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>{tooltip}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {title}
                </span>
              )}
            </div>
            
            {trend && (
              <Badge 
                variant={trendColor} 
                size="sm" 
                className="flex items-center gap-1"
              >
                <TrendIcon className="h-3 w-3" aria-hidden="true" />
                {change !== undefined && (
                  <span>{formatPercentage(change, 1)}</span>
                )}
              </Badge>
            )}
          </div>
          
          <div className="text-3xl font-bold text-gray-900 dark:text-gray-50">
            {formattedValue}
          </div>
          
          {description && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}