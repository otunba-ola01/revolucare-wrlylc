import React from 'react'; // v18.0+
import { useRouter } from 'next/navigation'; // v13.4.1
import {
  CalendarClock,
  FileText,
  DollarSign,
  Users,
  ChevronRight,
} from 'lucide-react'; // v0.284.0
import {
  ServicesPlan,
  ServicesPlanWithClientInfo,
} from '../../types/service-plan';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { formatCurrency } from '../../lib/utils/format';
import { formatDate } from '../../lib/utils/date';
import { cn } from '../../lib/utils/color';
import { PLAN_STATUSES } from '../../config/constants';
import { useAuth } from '../../hooks/use-auth';

/**
 * Determines the appropriate badge variant based on plan status
 * @param {string} status - Plan status
 * @returns {string} Badge variant name (default, primary, secondary, outline, success, warning, error)
 */
const getStatusBadgeVariant = (status: string): string => {
  switch (status) {
    case PLAN_STATUSES.APPROVED:
    case PLAN_STATUSES.ACTIVE:
      return 'success';
    case PLAN_STATUSES.IN_REVIEW:
    case PLAN_STATUSES.UNDER_REVIEW:
    case PLAN_STATUSES.ON_HOLD:
      return 'warning';
    case PLAN_STATUSES.REJECTED:
    case PLAN_STATUSES.CANCELLED:
    case PLAN_STATUSES.TERMINATED:
      return 'error';
    case PLAN_STATUSES.DRAFT:
      return 'outline';
    case PLAN_STATUSES.COMPLETED:
      return 'secondary';
    default:
      return 'default';
  }
};

interface ServicePlanCardProps {
  plan: ServicesPlan | ServicesPlanWithClientInfo;
  showClient?: boolean;
  showActions?: boolean;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onApprove?: () => void;
  className?: string;
}

/**
 * A card component that displays service plan information with actions
 * @param {object} props - Component props
 * @param {ServicesPlan | ServicesPlanWithClientInfo} props.plan - Service plan data
 * @param {boolean} [props.showClient=false] - Whether to display client information
 * @param {boolean} [props.showActions=true] - Whether to display action buttons
 * @param {() => void} [props.onView] - Handler for view action
 * @param {() => void} [props.onEdit] - Handler for edit action
 * @param {() => void} [props.onDelete] - Handler for delete action
 * @param {() => void} [props.onApprove] - Handler for approve action
 * @param {string} [props.className] - Optional CSS class name
 * @returns {JSX.Element} Rendered service plan card component
 */
export const ServicePlanCard: React.FC<ServicePlanCardProps> = ({
  plan,
  showClient = false,
  showActions = true,
  onView,
  onEdit,
  onDelete,
  onApprove,
  className,
}) => {
  // Get user authentication context using useAuth hook
  const auth = useAuth();

  // Get router for navigation using useRouter hook
  const router = useRouter();

  // Determine if the user has permission to edit or approve the plan based on role
  const canEdit = auth.hasRole('case_manager') || auth.hasRole('administrator');
  const canApprove = auth.hasRole('case_manager') || auth.hasRole('administrator');

  // Determine badge variant for plan status using getStatusBadgeVariant function
  const badgeVariant = getStatusBadgeVariant(plan.status);

  // Render Card component with appropriate styling
  return (
    <Card className={cn('w-full', className)}>
      {/* Render CardHeader with plan title and status badge */}
      <CardHeader>
        <CardTitle>
          {plan.title}
          <Badge variant={badgeVariant} className="ml-2">
            {plan.status}
          </Badge>
        </CardTitle>
        {/* Render CardDescription with plan description if available */}
        {plan.description && <CardDescription>{plan.description}</CardDescription>}
      </CardHeader>
      {/* Render CardContent with key plan details (client info, service count, estimated cost, dates) */}
      <CardContent>
        {showClient && (
          <div className="mb-2">
            <Users className="mr-2 h-4 w-4 inline-block" aria-hidden="true" />
            Client: {(plan as ServicesPlanWithClientInfo).clientName}
          </div>
        )}
        <div className="mb-2">
          <FileText className="mr-2 h-4 w-4 inline-block" aria-hidden="true" />
          Services: {plan.services.length}
        </div>
        <div className="mb-2">
          <DollarSign className="mr-2 h-4 w-4 inline-block" aria-hidden="true" />
          Estimated Cost: {formatCurrency(plan.estimatedCost)}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Created: {formatDate(plan.createdAt)}
        </div>
      </CardContent>
      {/* Render CardFooter with action buttons based on permissions and provided handlers */}
      <CardFooter className="flex justify-end">
        {showActions && (
          <>
            {/* Include View, Edit, Delete buttons based on showActions prop and permissions */}
            {onView && (
              <Button variant="ghost" size="sm" onClick={onView}>
                View <ChevronRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Button>
            )}
            {canEdit && onEdit && (
              <Button variant="outline" size="sm" onClick={onEdit}>
                Edit
              </Button>
            )}
            {canEdit && onDelete && (
              <Button variant="ghost" size="sm" onClick={onDelete}>
                Delete
              </Button>
            )}
            {/* Include Approve button for case managers and administrators when plan status is IN_REVIEW */}
            {canApprove && plan.status === PLAN_STATUSES.IN_REVIEW && onApprove && (
              <Button variant="primary" size="sm" onClick={onApprove}>
                Approve
              </Button>
            )}
          </>
        )}
      </CardFooter>
    </Card>
  );
};