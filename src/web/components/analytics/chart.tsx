import React, { useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie,
  Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine
} from 'recharts'; // ^2.6.2
import { cn } from '../../lib/utils/color';
import { formatNumber, formatPercentage } from '../../lib/utils/format';
import { ChartProps, DataPoint } from '../../types/analytics';
import { useMediaQuery } from '../../hooks/use-media-query';

/**
 * Returns an array of colors to be used in charts based on the chart type
 * @param chartType - The type of chart ('line', 'bar', 'area', or 'pie')
 * @returns Array of color hex codes
 */
const getChartColors = (chartType: 'line' | 'bar' | 'area' | 'pie'): string[] => {
  // Define colors based on the application's color palette
  const colors = {
    primary: '#4F46E5', // indigo-600
    secondary: '#EC4899', // pink-500
    accent: '#8B5CF6', // violet-500
    success: '#10B981', // green-500
    warning: '#F59E0B', // amber-500
    error: '#EF4444', // red-500
    neutral: [
      '#6B7280', // gray-500
      '#9CA3AF', // gray-400
      '#D1D5DB', // gray-300
      '#E5E7EB', // gray-200
    ],
  };

  // Return appropriate colors based on chart type
  switch (chartType) {
    case 'line':
    case 'area':
      return [colors.primary];
    case 'bar':
      return [colors.primary, colors.secondary, colors.accent, colors.success];
    case 'pie':
      return [colors.primary, colors.secondary, colors.accent, colors.success, colors.warning, ...colors.neutral];
    default:
      return [colors.primary];
  }
};

/**
 * Formats the value displayed in chart tooltips based on data type
 * @param value - The numeric value to format
 * @param unit - Optional unit to append (like '%', '$', etc.)
 * @returns Formatted value string
 */
const formatTooltipValue = (value: number, unit?: string): string => {
  if (!value && value !== 0) {
    return 'N/A';
  }
  
  if (unit === '%' || unit === 'percent' || unit === 'percentage') {
    return formatPercentage(value, 1);
  }
  
  // Format numbers with appropriate decimal places
  const decimalPlaces = Math.abs(value) < 10 ? 1 : 0;
  const formattedValue = formatNumber(value, decimalPlaces);
  
  // Add unit if it's not a percentage and exists
  if (unit && unit !== '%' && unit !== 'percent' && unit !== 'percentage') {
    return `${formattedValue} ${unit}`;
  }
  
  return formattedValue;
};

/**
 * Custom tooltip component for Recharts to display formatted values
 * @param props - Tooltip props from Recharts
 * @returns JSX.Element or null if inactive
 */
const CustomTooltip = (props: any) => {
  const { active, payload, label, unit } = props;
  
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div 
      className="bg-white p-3 border border-gray-200 rounded-md shadow-md text-sm"
      role="tooltip"
      aria-live="polite"
    >
      <p className="font-medium text-gray-900 mb-1">{label}</p>
      {payload.map((item: any, index: number) => (
        <div key={index} className="flex items-center">
          <div
            className="w-3 h-3 rounded-full mr-2"
            style={{ backgroundColor: item.color }}
            aria-hidden="true"
          />
          <span className="text-gray-500 mr-2">
            {item.name || 'Value'}:
          </span>
          <span className="font-medium text-gray-900">
            {formatTooltipValue(item.value, unit)}
          </span>
        </div>
      ))}
    </div>
  );
};

/**
 * Renders the appropriate chart component based on the chart type
 * @param props - Chart properties including data, type, dimensions, etc.
 * @returns JSX.Element for the specific chart type
 */
const renderChart = (props: ChartProps) => {
  const {
    data,
    type,
    height,
    width,
    title,
    xAxisLabel,
    yAxisLabel,
    unit,
    thresholds,
  } = props;
  
  const colors = getChartColors(type);
  
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }
  
  // Date formatter for axis labels
  const dateFormatter = (date: string) => {
    try {
      const dateObj = new Date(date);
      return dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch (error) {
      // Return original value if date parsing fails
      return date;
    }
  };
  
  switch (type) {
    case 'line':
      return (
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
          <XAxis
            dataKey="date"
            tickFormatter={dateFormatter}
            tick={{ fontSize: 12, fill: '#6B7280' }}
            tickLine={{ stroke: '#E5E7EB' }}
            axisLine={{ stroke: '#E5E7EB' }}
            label={xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -5 } : undefined}
          />
          <YAxis
            tickFormatter={(value) => formatTooltipValue(value, unit)}
            tick={{ fontSize: 12, fill: '#6B7280' }}
            tickLine={{ stroke: '#E5E7EB' }}
            axisLine={{ stroke: '#E5E7EB' }}
            label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft', offset: 10 } : undefined}
          />
          <Tooltip
            content={<CustomTooltip unit={unit} />}
            cursor={{ strokeDasharray: '3 3' }}
          />
          <Legend wrapperStyle={{ paddingTop: 10 }} />
          {thresholds?.warning && (
            <ReferenceLine
              y={thresholds.warning}
              stroke="#F59E0B"
              strokeDasharray="3 3"
              label={{ value: 'Warning', position: 'right', fill: '#F59E0B' }}
            />
          )}
          {thresholds?.critical && (
            <ReferenceLine
              y={thresholds.critical}
              stroke="#EF4444"
              strokeDasharray="3 3"
              label={{ value: 'Critical', position: 'right', fill: '#EF4444' }}
            />
          )}
          <Line
            type="monotone"
            dataKey="value"
            stroke={colors[0]}
            strokeWidth={2}
            dot={{ fill: colors[0], strokeWidth: 2, r: 4, stroke: 'white' }}
            activeDot={{ r: 6, stroke: 'white', strokeWidth: 2 }}
            name={title || 'Value'}
            isAnimationActive={true}
            animationDuration={1000}
            animationEasing="ease-in-out"
          />
        </LineChart>
      );
    
    case 'bar':
      return (
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
          <XAxis
            dataKey="date"
            tickFormatter={dateFormatter}
            tick={{ fontSize: 12, fill: '#6B7280' }}
            tickLine={{ stroke: '#E5E7EB' }}
            axisLine={{ stroke: '#E5E7EB' }}
            label={xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -5 } : undefined}
          />
          <YAxis
            tickFormatter={(value) => formatTooltipValue(value, unit)}
            tick={{ fontSize: 12, fill: '#6B7280' }}
            tickLine={{ stroke: '#E5E7EB' }}
            axisLine={{ stroke: '#E5E7EB' }}
            label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft', offset: 10 } : undefined}
          />
          <Tooltip
            content={<CustomTooltip unit={unit} />}
            cursor={{ fillOpacity: 0.1 }}
          />
          <Legend wrapperStyle={{ paddingTop: 10 }} />
          {thresholds?.warning && (
            <ReferenceLine
              y={thresholds.warning}
              stroke="#F59E0B"
              strokeDasharray="3 3"
              label={{ value: 'Warning', position: 'right', fill: '#F59E0B' }}
            />
          )}
          {thresholds?.critical && (
            <ReferenceLine
              y={thresholds.critical}
              stroke="#EF4444"
              strokeDasharray="3 3"
              label={{ value: 'Critical', position: 'right', fill: '#EF4444' }}
            />
          )}
          <Bar
            dataKey="value"
            fill={colors[0]}
            radius={[4, 4, 0, 0]}
            barSize={40}
            name={title || 'Value'}
            isAnimationActive={true}
            animationDuration={1000}
            animationEasing="ease-in-out"
          />
        </BarChart>
      );
    
    case 'area':
      return (
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
          <XAxis
            dataKey="date"
            tickFormatter={dateFormatter}
            tick={{ fontSize: 12, fill: '#6B7280' }}
            tickLine={{ stroke: '#E5E7EB' }}
            axisLine={{ stroke: '#E5E7EB' }}
            label={xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -5 } : undefined}
          />
          <YAxis
            tickFormatter={(value) => formatTooltipValue(value, unit)}
            tick={{ fontSize: 12, fill: '#6B7280' }}
            tickLine={{ stroke: '#E5E7EB' }}
            axisLine={{ stroke: '#E5E7EB' }}
            label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft', offset: 10 } : undefined}
          />
          <Tooltip
            content={<CustomTooltip unit={unit} />}
            cursor={{ strokeDasharray: '3 3' }}
          />
          <Legend wrapperStyle={{ paddingTop: 10 }} />
          {thresholds?.warning && (
            <ReferenceLine
              y={thresholds.warning}
              stroke="#F59E0B"
              strokeDasharray="3 3"
              label={{ value: 'Warning', position: 'right', fill: '#F59E0B' }}
            />
          )}
          {thresholds?.critical && (
            <ReferenceLine
              y={thresholds.critical}
              stroke="#EF4444"
              strokeDasharray="3 3"
              label={{ value: 'Critical', position: 'right', fill: '#EF4444' }}
            />
          )}
          <Area
            type="monotone"
            dataKey="value"
            stroke={colors[0]}
            fill={colors[0]}
            fillOpacity={0.2}
            name={title || 'Value'}
            isAnimationActive={true}
            animationDuration={1000}
            animationEasing="ease-in-out"
          />
        </AreaChart>
      );
    
    case 'pie':
      return (
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="date"
            cx="50%"
            cy="50%"
            outerRadius={80}
            innerRadius={0}
            label={({ date, value, percent }) => 
              `${date}: ${formatTooltipValue(value, unit)} (${(percent * 100).toFixed(0)}%)`
            }
            labelLine={true}
            isAnimationActive={true}
            animationDuration={1000}
            animationEasing="ease-in-out"
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={colors[index % colors.length]} 
                stroke="#fff"
                strokeWidth={1}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip unit={unit} />} />
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            wrapperStyle={{ paddingLeft: 10 }}
          />
        </PieChart>
      );
      
    default:
      return null;
  }
};

/**
 * A flexible chart component that renders different types of visualizations based on props
 * @param props - Chart configuration properties
 * @returns JSX.Element - Rendered chart component
 */
export const Chart: React.FC<ChartProps> = (props) => {
  const {
    data,
    type = 'line',
    height = 300,
    width,
    title,
    xAxisLabel,
    yAxisLabel,
    className,
    thresholds,
    unit,
  } = props;
  
  // Check if viewport is mobile for responsive adjustments
  const isMobile = useMediaQuery('(max-width: 640px)');
  
  // Check if data is empty
  const isEmpty = useMemo(() => {
    return !data || data.length === 0;
  }, [data]);
  
  // Handle empty data state
  if (isEmpty) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-lg bg-gray-50 border border-gray-200',
          className
        )}
        style={{ height, width: width || '100%' }}
        role="img"
        aria-label={`${title || 'Chart'} - No data available`}
      >
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }
  
  // Determine dimensions
  const chartHeight = height || 300;
  const chartWidth = width || '100%';
  
  // Add title and accessibility
  const chartTitle = title ? (
    <div className="font-medium text-gray-900 mb-2">{title}</div>
  ) : null;
  
  return (
    <div
      className={cn('chart-container', className)}
      style={{ width: chartWidth }}
      role="figure"
      aria-label={title || 'Chart'}
    >
      {chartTitle}
      <div style={{ height: chartHeight, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          {renderChart({
            ...props,
            // Hide axis labels on mobile for better readability
            xAxisLabel: isMobile ? undefined : xAxisLabel,
            yAxisLabel: isMobile ? undefined : yAxisLabel,
          })}
        </ResponsiveContainer>
      </div>
      {/* Screen reader description - hidden visually but accessible to assistive technology */}
      <div className="sr-only">
        This chart displays {title || 'data'} as a {type} chart. 
        {data && data.length > 0 && ` It contains ${data.length} data points.`}
        {xAxisLabel && ` The X-axis represents ${xAxisLabel}.`}
        {yAxisLabel && ` The Y-axis represents ${yAxisLabel}.`}
      </div>
    </div>
  );
};