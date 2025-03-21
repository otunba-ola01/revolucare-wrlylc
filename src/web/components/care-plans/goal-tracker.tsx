import React, { useState, useMemo, useCallback } from 'react'; // react ^18.2.0
import {
  CarePlan,
  CarePlanGoal,
  GoalStatus,
} from '../../../types/care-plan'; // Import care plan type definitions for type safety
import { useUpdateCarePlan } from '../../../hooks/use-care-plans'; // Import hook for updating care plan data
import { Progress } from '../../ui/progress'; // Import progress bar component for goal completion visualization
import { Button } from '../../ui/button'; // Import button component for goal status actions
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  
} from '../../ui/card'; // Import card components for goal display layout
import { Badge } from '../../ui/badge'; // Import badge component for goal status display
import { cn } from '../../../lib/utils/color'; // Import utility for conditionally joining class names

interface GoalTrackerProps {
  carePlan: CarePlan;
  readOnly?: boolean;
  onGoalUpdate?: (updatedCarePlan: CarePlan) => void;
  className?: string;
}

/**
 * Determines the appropriate badge variant based on goal status
 * @param status - GoalStatus
 * @returns Badge variant name (primary, success, warning, or outline)
 */
const getGoalStatusBadgeVariant = (status: GoalStatus): string => {
  switch (status) {
    case GoalStatus.IN_PROGRESS:
      return 'primary';
    case GoalStatus.ACHIEVED:
      return 'success';
    case GoalStatus.PENDING:
      return 'warning';
    case GoalStatus.DISCONTINUED:
      return 'outline';
    default:
      return 'outline';
  }
};

/**
 * Calculates the percentage of completed goals in a care plan
 * @param goals - CarePlanGoal[]
 * @returns Percentage of goals that are marked as achieved (0-100)
 */
const calculateGoalCompletion = (goals: CarePlanGoal[]): number => {
  if (!goals || goals.length === 0) {
    return 0;
  }

  const achievedGoals = goals.filter((goal) => goal.status === GoalStatus.ACHIEVED).length;
  const completionPercentage = (achievedGoals / goals.length) * 100;
  return Math.round(completionPercentage);
};

/**
 * A component that displays and tracks the progress of goals within a care plan
 * @param props - { carePlan: CarePlan; readOnly?: boolean; onGoalUpdate?: (updatedCarePlan: CarePlan) => void; className?: string; }
 * @returns Rendered goal tracker component
 */
export const GoalTracker: React.FC<GoalTrackerProps> = ({
  carePlan,
  readOnly = false,
  onGoalUpdate,
  className,
}) => {
  // Track any goals being edited
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

  // Get the mutation function for updating goals
  const { mutate: updateCarePlanMutation, isLoading: isUpdatingGoal } = useUpdateCarePlan();

  // Calculate the overall goal completion
  const goalCompletion = useMemo(() => calculateGoalCompletion(carePlan.goals), [carePlan.goals]);

  /**
   * Updates the status of a goal and triggers a care plan update
   * @param goalId - string
   * @param newStatus - GoalStatus
   */
  const handleStatusChange = useCallback(
    (goalId: string, newStatus: GoalStatus) => {
      // Find the goal to update
      const goalToUpdate = carePlan.goals.find((goal) => goal.id === goalId);

      if (!goalToUpdate) {
        console.error(`Goal with ID ${goalId} not found`);
        return;
      }

      // Create a new care plan with the updated goal
      const updatedCarePlan: CarePlan = {
        ...carePlan,
        goals: carePlan.goals.map((goal) =>
          goal.id === goalId ? { ...goal, status: newStatus } : goal
        ),
      };

      // Call the update mutation
      updateCarePlanMutation(
        { id: carePlan.id, data: updatedCarePlan },
        {
          onSuccess: (updatedCarePlanData) => {
            // Clear editing state
            setEditingGoalId(null);

            // Call the optional callback
            onGoalUpdate?.(updatedCarePlanData);
          },
          onError: (error) => {
            console.error('Failed to update care plan:', error);
            // Handle error appropriately (e.g., display an error message)
          },
        }
      );
    },
    [carePlan, updateCarePlanMutation, onGoalUpdate]
  );

  // Group goals by status for display
  const pendingGoals = useMemo(() => carePlan.goals.filter((goal) => goal.status === GoalStatus.PENDING), [carePlan.goals]);
  const inProgressGoals = useMemo(() => carePlan.goals.filter((goal) => goal.status === GoalStatus.IN_PROGRESS), [carePlan.goals]);
  const achievedGoals = useMemo(() => carePlan.goals.filter((goal) => goal.status === GoalStatus.ACHIEVED), [carePlan.goals]);
  const discontinuedGoals = useMemo(() => carePlan.goals.filter((goal) => goal.status === GoalStatus.DISCONTINUED), [carePlan.goals]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Care Plan Goals</CardTitle>
      </CardHeader>
      <CardContent>
        <Progress value={goalCompletion} showValue />

        {/* Pending Goals */}
        {pendingGoals.length > 0 && (
          <div className="mb-4">
            <h4 className="mb-2 font-semibold">Pending Goals</h4>
            {pendingGoals.map((goal) => (
              <div key={goal.id} className="mb-2">
                <p className="text-sm">{goal.description}</p>
                <p className="text-xs text-gray-500">
                  Measures: {goal.measures.join(', ')}
                </p>
                <Badge variant={getGoalStatusBadgeVariant(goal.status)}>{goal.status}</Badge>
                {!readOnly && (
                  <div className="mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange(goal.id, GoalStatus.IN_PROGRESS)}
                      disabled={isUpdatingGoal || editingGoalId === goal.id}
                    >
                      {isUpdatingGoal && editingGoalId === goal.id ? 'Updating...' : 'Mark In Progress'}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* In Progress Goals */}
        {inProgressGoals.length > 0 && (
          <div className="mb-4">
            <h4 className="mb-2 font-semibold">In Progress Goals</h4>
            {inProgressGoals.map((goal) => (
              <div key={goal.id} className="mb-2">
                <p className="text-sm">{goal.description}</p>
                <p className="text-xs text-gray-500">
                  Measures: {goal.measures.join(', ')}
                </p>
                <Badge variant={getGoalStatusBadgeVariant(goal.status)}>{goal.status}</Badge>
                {!readOnly && (
                  <div className="mt-2">
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => handleStatusChange(goal.id, GoalStatus.ACHIEVED)}
                      disabled={isUpdatingGoal || editingGoalId === goal.id}
                    >
                      {isUpdatingGoal && editingGoalId === goal.id ? 'Updating...' : 'Mark Achieved'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange(goal.id, GoalStatus.DISCONTINUED)}
                      disabled={isUpdatingGoal || editingGoalId === goal.id}
                    >
                      {isUpdatingGoal && editingGoalId === goal.id ? 'Updating...' : 'Discontinue'}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Achieved Goals */}
        {achievedGoals.length > 0 && (
          <div className="mb-4">
            <h4 className="mb-2 font-semibold">Achieved Goals</h4>
            {achievedGoals.map((goal) => (
              <div key={goal.id} className="mb-2">
                <p className="line-through text-sm">{goal.description}</p>
                <p className="line-through text-xs text-gray-500">
                  Measures: {goal.measures.join(', ')}
                </p>
                <Badge variant={getGoalStatusBadgeVariant(goal.status)}>{goal.status}</Badge>
              </div>
            ))}
          </div>
        )}

        {/* Discontinued Goals */}
        {discontinuedGoals.length > 0 && (
          <div className="mb-4">
            <h4 className="mb-2 font-semibold">Discontinued Goals</h4>
            {discontinuedGoals.map((goal) => (
              <div key={goal.id} className="mb-2">
                <p className="line-through text-sm">{goal.description}</p>
                <p className="line-through text-xs text-gray-500">
                  Measures: {goal.measures.join(', ')}
                </p>
                <Badge variant={getGoalStatusBadgeVariant(goal.status)}>{goal.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter>
        {readOnly && <p className="text-sm text-gray-500">This care plan is read-only.</p>}
      </CardFooter>
    </Card>
  );
};