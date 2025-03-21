import React from 'react';
import { PlanStatus } from '../../../backend/src/constants/plan-statuses';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils/color';

/**
 * Helper function to get the display configuration for a given plan status
 */
function getStatusConfig(status: PlanStatus): { label: string; variant: string } {
  const statusConfig: Record<PlanStatus, { label: string; variant: string }> = {
    [PlanStatus.DRAFT]: { label: 'Draft', variant: 'outline' },
    [PlanStatus.IN_REVIEW]: { label: 'In Review', variant: 'secondary' },
    [PlanStatus.APPROVED]: { label: 'Approved', variant: 'success' },
    [PlanStatus.ACTIVE]: { label: 'Active', variant: 'primary' },
    [PlanStatus.UNDER_REVIEW]: { label: 'Under Review', variant: 'secondary' },
    [PlanStatus.REVISED]: { label: 'Revised', variant: 'secondary' },
    [PlanStatus.ON_HOLD]: { label: 'On Hold', variant: 'warning' },
    [PlanStatus.COMPLETED]: { label: 'Completed', variant: 'success' },
    [PlanStatus.CANCELLED]: { label: 'Cancelled', variant: 'default' },
    [PlanStatus.REJECTED]: { label: 'Rejected', variant: 'error' },
    [PlanStatus.TERMINATED]: { label: 'Terminated', variant: 'error' },
    [PlanStatus.SUPERSEDED]: { label: 'Superseded', variant: 'default' },
  };

  return statusConfig[status] || { label: 'Unknown', variant: 'default' };
}

/**
 * A component that displays a plan's status as a styled badge with appropriate color coding.
 * The badge color corresponds to the semantic meaning of the status (e.g., success, warning, error).
 * 
 * @example
 * // Basic usage
 * <PlanStatusBadge status={PlanStatus.ACTIVE} />
 * 
 * // Without label text (useful for compact displays)
 * <PlanStatusBadge status={PlanStatus.ACTIVE} showLabel={false} />
 * 
 * // With custom size
 * <PlanStatusBadge status={PlanStatus.ACTIVE} size="sm" />
 */
export function PlanStatusBadge({
  status,
  className,
  showLabel = true,
  size = 'default',
}: {
  status: PlanStatus;
  className?: string;
  showLabel?: boolean;
  size?: 'default' | 'sm' | 'lg';
}) {
  const { label, variant } = getStatusConfig(status);

  return (
    <Badge 
      variant={variant as any}
      size={size}
      className={cn(
        !showLabel && 'w-3 h-3 p-0 rounded-full', 
        className
      )}
      title={label} // Provides tooltip for accessibility
    >
      {showLabel ? label : <span className="sr-only">{label}</span>}
    </Badge>
  );
}