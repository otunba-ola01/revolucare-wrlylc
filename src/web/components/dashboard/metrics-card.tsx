import React from "react";
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../ui/card";
import { Badge } from "../ui/badge";
import Chart from "../analytics/chart";
import { formatNumber, formatPercentage, formatCurrency } from "../../lib/utils/format";
import { cn } from "../../lib/utils/color";
import { Metric } from "../../types/analytics";

/**
 * Props interface for the MetricsCard component
 */
interface MetricsCardProps {
  /** The metric data to display in the card */
  metric: Metric;
  /** Whether to show a chart of historical data if available */
  showChart?: boolean;
  /** Whether to display the card in compact mode with less padding and smaller text */
  compact?: boolean;
  /** Optional additional CSS classes to apply to the card */
  className?: string;
  /** Optional click handler for the card */
  onClick?: (metric: Metric) => void;
}

/**
 * Component that displays a metric card with name, value, trend, and optional chart
 * Used in dashboard and analytics sections to visualize individual metrics
 */
const MetricsCard: React.FC<MetricsCardProps> = ({
  metric,
  showChart = true,
  compact = false,
  className,
  onClick,
}) => {
  // Determine the trend icon based on the metric's trend direction
  const TrendIcon = React.useMemo(() => {
    switch (metric.trend) {
      case "up":
        return ArrowUpIcon;
      case "down":
        return ArrowDownIcon;
      case "stable":
      default:
        return MinusIcon;
    }
  }, [metric.trend]);

  // Determine if the trend is positive based on the context of the metric
  // For some metrics like error rates or costs, a downward trend is positive
  const isTrendPositive = React.useMemo(() => {
    // These metrics are positive when decreasing
    const negativeMetrics = [
      "error",
      "cost",
      "expense",
      "time",
      "latency",
      "wait",
      "delay",
    ];
    
    // Check if metric name or category contains any negative metric indicators
    const isNegativeMetric = negativeMetrics.some(
      term => 
        metric.name.toLowerCase().includes(term) || 
        (metric.category && metric.category.toLowerCase().includes(term))
    );
    
    // For negative metrics, down is good; for positive metrics, up is good
    return isNegativeMetric ? metric.trend === "down" : metric.trend === "up";
  }, [metric.name, metric.category, metric.trend]);

  // Determine badge color based on trend and whether it's positive
  const badgeVariant = React.useMemo(() => {
    if (metric.trend === "stable") return "secondary";
    return isTrendPositive ? "success" : "error";
  }, [metric.trend, isTrendPositive]);

  // Format the value based on the unit type
  const formattedValue = React.useMemo(() => {
    if (
      metric.unit === "%" ||
      metric.unit === "percent" ||
      metric.unit === "percentage"
    ) {
      // For percentages, show 1 decimal place for values < 10, otherwise none
      const decimalPlaces = Math.abs(metric.value) < 10 ? 1 : 0;
      return formatPercentage(metric.value, decimalPlaces);
    } else if (
      metric.unit === "$" ||
      metric.unit === "USD" ||
      metric.unit === "currency"
    ) {
      return formatCurrency(metric.value);
    } else {
      // For regular numbers, adjust decimal places based on magnitude
      const decimalPlaces = Math.abs(metric.value) < 10 ? 1 : 0;
      return formatNumber(metric.value, decimalPlaces);
    }
  }, [metric.value, metric.unit]);

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all hover:shadow-md",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick ? () => onClick(metric) : undefined}
      aria-label={`${metric.name} metric: ${formattedValue}`}
    >
      <CardHeader className={cn(compact ? "p-4" : "p-6")}>
        <CardTitle className={cn(compact ? "text-base" : "text-xl")}>
          {metric.name}
        </CardTitle>
        {metric.description && (
          <CardDescription>{metric.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className={cn(compact ? "p-4 pt-0" : "p-6 pt-0")}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p
            className={cn(
              "font-semibold",
              compact ? "text-2xl" : "text-3xl"
            )}
          >
            {formattedValue}
            {metric.unit && !["$", "USD", "currency", "%", "percent", "percentage"].includes(metric.unit) && (
              <span className="ml-1 text-sm font-normal text-gray-500 dark:text-gray-400">
                {metric.unit}
              </span>
            )}
          </p>
          <Badge variant={badgeVariant} className="flex items-center gap-1">
            <TrendIcon className="h-3 w-3" aria-hidden="true" />
            <span>{Math.abs(metric.changePercentage).toFixed(1)}%</span>
          </Badge>
        </div>

        {showChart && metric.historicalData && metric.historicalData.length > 0 && (
          <div className={cn("mt-4", compact ? "h-20" : "h-32")}>
            <Chart
              data={metric.historicalData}
              type="line"
              height={compact ? 80 : 128}
              thresholds={metric.thresholds}
              unit={metric.unit}
              title={`${metric.name} trend`}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MetricsCard;