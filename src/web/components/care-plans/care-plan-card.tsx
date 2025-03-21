import React from 'react'; // v18.2.0
import { useRouter } from 'next/navigation'; // ^13.4.1
import { Eye, Edit, Trash2, FileText, CheckCircle } from 'lucide-react'; // ^0.284.0

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../ui/card';
import { Button } from '../ui/button';
import { PlanStatusBadge } from './plan-status';
import { ConfidenceScore } from './confidence-score';
import { CarePlanWithClientInfo } from '../../types/care-plan';
import useAuth from '../../hooks/use-auth';
import { useDeleteCarePlan } from '../../hooks/use-care-plans';
import { cn } from '../../lib/utils/color';
import { formatDate } from '../../lib/utils/date';
import { ROUTES } from '../../config/constants';

/**
 * Truncates text to a specified length and adds ellipsis if needed
 * @param text The text to truncate
 * @param maxLength The maximum length of the text
 * @returns Truncated text with ellipsis if needed
 */
const truncateText = (text: string, maxLength: number): string => {
  // Check if text is longer than maxLength
  if (text.length > maxLength) {
    // If yes, truncate to maxLength and add ellipsis
    return text.substring(0, maxLength) + '...';
  }
  // If no, return the original text
  return text;
};

/**
 * Interface defining the props for the CarePlanCard component.
 * It includes the care plan data, optional class names,
 * and a callback function for when a care plan is deleted.
 */
interface CarePlanCardProps {
  /**
   * The care plan data to display
   */
  carePlan: CarePlanWithClientInfo;
  /**
   * Additional CSS class names (optional)
   */
  className?: string;
  /**
   * Callback function when a care plan is deleted (optional)
   */
  onDelete?: () => void;
  /**
   * Whether to show client information (defaults to true)
   */
  showClient?: boolean;
  /**
   * Whether to show action buttons (defaults to true)
   */
  showActions?: boolean;
  /**
   * Whether to use a compact layout (defaults to false)
   */
  compact?: boolean;
}

/**
 * A component that displays care plan information in a card format with actions for viewing, editing, or deleting the plan
 * @param props - The props for the component, including the care plan data and optional class names
 * @returns A React element representing the care plan card
 */
export const CarePlanCard: React.FC<CarePlanCardProps> = ({
  carePlan,
  className,
  onDelete,
  showClient = true,
  showActions = true,
  compact = false,
}) => {
  // Get the router for navigation
  const router = useRouter();

  // Get the user and permissions from useAuth hook
  const { hasPermission } = useAuth();

  // Get the deleteMutation from useDeleteCarePlan hook
  const deleteMutation = useDeleteCarePlan();

  // Define handleView function to navigate to care plan details page
  const handleView = () => {
    router.push(`${ROUTES.CARE_PLANS}/${carePlan.id}`);
  };

  // Define handleEdit function to navigate to care plan edit page
  const handleEdit = () => {
    router.push(`${ROUTES.CARE_PLANS}/${carePlan.id}/edit`);
  };

  // Define handleDelete function to confirm and delete the care plan
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this care plan?')) {
      await deleteMutation.mutateAsync(carePlan.id);
      if (onDelete) {
        onDelete();
      }
    }
  };

  // Format the creation date using formatDate utility
  const creationDate = formatDate(carePlan.createdAt, 'MMMM dd, yyyy');

  // Truncate the description text for display
  const truncatedDescription = truncateText(carePlan.description, 150);

  // Render the Card component with appropriate styling
  return (
    <Card className={cn('w-full', className)}>
      {/* Render CardHeader with title, client name, and creation date */}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base">{carePlan.title}</CardTitle>
        <PlanStatusBadge status={carePlan.status} size="sm" />
      </CardHeader>

      {/* Render CardContent with description, status badge, and confidence score */}
      <CardContent>
        {showClient && (
          <CardDescription className="mb-2">
            Client: {carePlan.client.firstName} {carePlan.client.lastName}
          </CardDescription>
        )}
        <CardDescription>{truncatedDescription}</CardDescription>
        <ConfidenceScore score={carePlan.confidenceScore} className="mt-4" />
      </CardContent>

      {/* Render CardFooter with action buttons based on user permissions */}
      {showActions && (
        <CardFooter className="flex justify-end gap-2">
          {/* Include View button for all users */}
          <Button variant="ghost" size="sm" onClick={handleView}>
            <Eye className="mr-2 h-4 w-4" />
            View
          </Button>

          {/* Include Edit button for users with edit permissions */}
          {hasPermission('edit:care-plan') && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleEdit}
              disabled={deleteMutation.isLoading}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}

          {/* Include Delete button for users with delete permissions */}
          {hasPermission('delete:care-plan') && (
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              disabled={deleteMutation.isLoading}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {deleteMutation.isLoading ? 'Deleting...' : 'Delete'}
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
};