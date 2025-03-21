import React, { useState, useEffect, useMemo } from 'react'; // react ^18.0.0
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../ui/card';
import { Progress } from '../ui/progress';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import {
  CostEstimate,
  ServiceItem,
  FundingSource,
} from '../../types/service-plan';
import {
  useEstimateServicesPlanCost,
  useEstimateServicesItemsCost,
} from '../../hooks/use-services-plans';
import { formatCurrency, formatPercentage } from '../../lib/utils/format';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'; // recharts ^2.0.0
import { RefreshCw, DollarSign, AlertCircle } from 'lucide-react'; // lucide-react ^0.284.0

/**
 * Calculates the percentage of costs covered by funding sources
 * @param estimate - CostEstimate object
 * @returns Percentage of costs covered (0-100)
 */
function calculateCoveragePercentage(estimate: CostEstimate | null): number {
  // If estimate is null or totalCost is 0, return 0
  if (!estimate || estimate.totalCost === 0) {
    return 0;
  }

  // Calculate the percentage: (coveredAmount / totalCost) * 100
  const percentage = (estimate.coveredAmount / estimate.totalCost) * 100;

  // Ensure the result is between 0 and 100
  const clampedPercentage = Math.max(0, Math.min(100, percentage));

  // Return the calculated percentage
  return clampedPercentage;
}

/**
 * Generates an array of colors for chart segments
 * @param count - Number of colors needed
 * @returns Array of color hex codes
 */
function generateChartColors(count: number): string[] {
  // Define a base set of colors from the application theme
  const baseColors = ['#4F46E5', '#EC4899', '#8B5CF6', '#3B82F6', '#10B981'];

  // If count is less than or equal to the number of base colors, return the first 'count' colors
  if (count <= baseColors.length) {
    return baseColors.slice(0, count);
  }

  // Otherwise, generate additional colors by interpolating between existing colors
  const generatedColors: string[] = [...baseColors];
  const numAdditionalColors = count - baseColors.length;

  for (let i = 0; i < numAdditionalColors; i++) {
    const colorIndex1 = i % baseColors.length;
    const colorIndex2 = (i + 1) % baseColors.length;
    // Simple interpolation (can be improved for better visual results)
    const interpolatedColor = baseColors[colorIndex1];
    generatedColors.push(interpolatedColor);
  }

  // Return the array of colors
  return generatedColors;
}

/**
 * A component that calculates and displays cost estimates for service plans
 * @param props - Component properties including servicesPlanId, clientId, services, fundingSources, onEstimateGenerated, and className
 * @returns Rendered cost estimator component
 */
export const CostEstimator: React.FC<{
  servicesPlanId?: string;
  clientId?: string;
  services?: ServiceItem[];
  fundingSources?: FundingSource[];
  onEstimateGenerated?: (estimate: CostEstimate) => void;
  className?: string;
}> = ({ servicesPlanId, clientId, services, fundingSources, onEstimateGenerated, className }) => {
  // Determine whether to use servicesPlanId or clientId+services for estimation
  const usePlanId = !!servicesPlanId;

  // Use useEstimateServicesPlanCost hook if servicesPlanId is provided
  const {
    data: estimateFromPlan,
    isLoading: isLoadingPlan,
    error: errorPlan,
    refetch: refetchPlan,
  } = useEstimateServicesPlanCost(servicesPlanId || '');

  // Use useEstimateServicesItemsCost hook if clientId and services are provided
  const {
    mutate: estimateFromItems,
    data: estimateFromItemsData,
    isLoading: isLoadingItems,
    error: errorItems,
    reset: resetItems,
  } = useEstimateServicesItemsCost();

  // Local state for cost estimate
  const [estimate, setEstimate] = useState<CostEstimate | null>(null);

  // Handle loading state by displaying skeleton components
  const isLoading = usePlanId ? isLoadingPlan : isLoadingItems;

  // Handle error state by displaying an error message
  const error = usePlanId ? errorPlan : errorItems;

  // Calculate coverage percentage using calculateCoveragePercentage function
  const coveragePercentage = useMemo(() => calculateCoveragePercentage(estimate), [estimate]);

  // Generate chart colors for service breakdown and funding breakdown charts
  const serviceChartColors = useMemo(() => generateChartColors(estimate?.serviceBreakdown.length || 0), [estimate?.serviceBreakdown]);
  const fundingChartColors = useMemo(() => generateChartColors(estimate?.fundingBreakdown.length || 0), [estimate?.fundingBreakdown]);

  // Call onEstimateGenerated callback when estimate data is available
  useEffect(() => {
    if (estimate && onEstimateGenerated) {
      onEstimateGenerated(estimate);
    }
  }, [estimate, onEstimateGenerated]);

  // Update local state when estimate data changes
  useEffect(() => {
    if (usePlanId) {
      setEstimate(estimateFromPlan || null);
    } else if (estimateFromItemsData) {
      setEstimate(estimateFromItemsData || null);
    }
  }, [estimateFromPlan, estimateFromItemsData, usePlanId]);

  // Function to handle recalculating estimates
  const handleRecalculate = () => {
    if (usePlanId) {
      refetchPlan();
    } else if (clientId && services) {
      estimateFromItems({ clientId, services });
    }
  };

  // Render a Card component with cost estimate information
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Cost Estimate</CardTitle>
        <CardDescription>
          {isLoading ? (
            <Skeleton width={200} />
          ) : error ? (
            <div className="flex items-center text-red-500">
              <AlertCircle className="mr-2 h-4 w-4" />
              {error.message}
            </div>
          ) : (
            <>
              Total Cost: {formatCurrency(estimate?.totalCost || 0)} | Covered: {formatCurrency(estimate?.coveredAmount || 0)} | Out-of-Pocket: {formatCurrency(estimate?.outOfPocketCost || 0)}
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <>
            <Skeleton height={20} width="100%" className="mb-4" />
            <Skeleton height={150} width="100%" className="mb-4" />
            <Skeleton height={100} width="100%" className="mb-4" />
          </>
        ) : error ? (
          <></>
        ) : (
          <>
            <div className="mb-4">
              Coverage: <Progress value={coveragePercentage} showValue />
            </div>

            {/* Render PieChart for service breakdown showing cost distribution by service type */}
            {estimate?.serviceBreakdown && estimate.serviceBreakdown.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Service Breakdown</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={estimate.serviceBreakdown}
                      dataKey="cost"
                      nameKey="serviceType"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      label
                    >
                      {estimate.serviceBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={serviceChartColors[index % serviceChartColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Render PieChart for funding breakdown showing coverage by funding source */}
            {estimate?.fundingBreakdown && estimate.fundingBreakdown.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Funding Breakdown</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={estimate.fundingBreakdown}
                      dataKey="amount"
                      nameKey="source"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#82ca9d"
                      label
                    >
                      {estimate.fundingBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={fundingChartColors[index % fundingChartColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Display detailed tables for service breakdown and funding breakdown */}
            {/* (Implementation for tables would go here) */}
          </>
        )}
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm" onClick={handleRecalculate} disabled={isLoading}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Recalculate
        </Button>
      </CardFooter>
    </Card>
  );
};