import React, { useState } from "react";
import { PlusIcon, TrashIcon } from "lucide-react"; // v0.284.0
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../ui/select";
import { Badge } from "../ui/badge";
import { InterventionStatus } from "../../types/care-plan";
import { cn } from "../../lib/utils/color";

/**
 * Props for the InterventionList component
 */
interface InterventionListProps {
  /**
   * Array of intervention objects to display and manage
   */
  interventions: Array<{
    id?: string;
    description: string;
    frequency: string;
    duration: string;
    responsibleParty: string;
    status?: InterventionStatus;
  }>;
  /**
   * Callback function when a new intervention is added
   */
  onAddIntervention: () => void;
  /**
   * Callback function when an intervention is removed
   */
  onRemoveIntervention: (index: number) => void;
  /**
   * Callback function when an intervention is updated
   */
  onUpdateIntervention: (
    index: number,
    intervention: {
      id?: string;
      description: string;
      frequency: string;
      duration: string;
      responsibleParty: string;
      status?: InterventionStatus;
    }
  ) => void;
  /**
   * Whether the component should be in read-only mode
   */
  readOnly?: boolean;
  /**
   * Optional CSS class name for styling
   */
  className?: string;
}

/**
 * Determines the badge variant based on intervention status
 */
const getStatusBadgeVariant = (status: InterventionStatus): string => {
  switch (status) {
    case InterventionStatus.PENDING:
      return "outline";
    case InterventionStatus.ACTIVE:
      return "secondary";
    case InterventionStatus.COMPLETED:
      return "success";
    case InterventionStatus.DISCONTINUED:
      return "destructive";
    default:
      return "outline";
  }
};

/**
 * Component for displaying and managing a list of interventions within a care plan.
 * Allows users to view, add, edit, and remove interventions with their associated details.
 */
const InterventionList: React.FC<InterventionListProps> = ({
  interventions,
  onAddIntervention,
  onRemoveIntervention,
  onUpdateIntervention,
  readOnly = false,
  className,
}) => {
  // Create a default empty intervention when needed
  const defaultIntervention = {
    description: "",
    frequency: "",
    duration: "",
    responsibleParty: "",
    status: InterventionStatus.PENDING,
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>Interventions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {interventions.length === 0 ? (
          <div className="text-center py-4 text-gray-500 text-sm">
            No interventions added yet. Add interventions to implement this care plan.
          </div>
        ) : (
          <div className="space-y-6">
            {interventions.map((intervention, index) => (
              <div
                key={intervention.id || `intervention-${index}`}
                className="p-4 border border-gray-200 rounded-md"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex space-x-2 items-center">
                    {intervention.status && (
                      <Badge variant={getStatusBadgeVariant(intervention.status)}>
                        {intervention.status.charAt(0).toUpperCase() + intervention.status.slice(1)}
                      </Badge>
                    )}
                  </div>
                  {!readOnly && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRemoveIntervention(index)}
                      className="h-8 w-8 p-0"
                      aria-label="Remove intervention"
                    >
                      <TrashIcon className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    {readOnly ? (
                      <p className="text-sm py-2">{intervention.description}</p>
                    ) : (
                      <Textarea
                        value={intervention.description}
                        onChange={(e) =>
                          onUpdateIntervention(index, {
                            ...intervention,
                            description: e.target.value,
                          })
                        }
                        placeholder="Describe the intervention in detail"
                        className="w-full"
                      />
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Frequency
                      </label>
                      {readOnly ? (
                        <p className="text-sm py-2">{intervention.frequency}</p>
                      ) : (
                        <Input
                          value={intervention.frequency}
                          onChange={(e) =>
                            onUpdateIntervention(index, {
                              ...intervention,
                              frequency: e.target.value,
                            })
                          }
                          placeholder="E.g., Daily, Weekly, 3x per week"
                        />
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Duration
                      </label>
                      {readOnly ? (
                        <p className="text-sm py-2">{intervention.duration}</p>
                      ) : (
                        <Input
                          value={intervention.duration}
                          onChange={(e) =>
                            onUpdateIntervention(index, {
                              ...intervention,
                              duration: e.target.value,
                            })
                          }
                          placeholder="E.g., 30 minutes, 12 weeks"
                        />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Responsible Party
                      </label>
                      {readOnly ? (
                        <p className="text-sm py-2">{intervention.responsibleParty}</p>
                      ) : (
                        <Input
                          value={intervention.responsibleParty}
                          onChange={(e) =>
                            onUpdateIntervention(index, {
                              ...intervention,
                              responsibleParty: e.target.value,
                            })
                          }
                          placeholder="Person or role responsible"
                        />
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      {readOnly ? (
                        <p className="text-sm py-2">
                          {intervention.status
                            ? intervention.status.charAt(0).toUpperCase() +
                              intervention.status.slice(1)
                            : "Pending"}
                        </p>
                      ) : (
                        <Select
                          value={intervention.status || InterventionStatus.PENDING}
                          onValueChange={(value) =>
                            onUpdateIntervention(index, {
                              ...intervention,
                              status: value as InterventionStatus,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={InterventionStatus.PENDING}>Pending</SelectItem>
                            <SelectItem value={InterventionStatus.ACTIVE}>Active</SelectItem>
                            <SelectItem value={InterventionStatus.COMPLETED}>Completed</SelectItem>
                            <SelectItem value={InterventionStatus.DISCONTINUED}>
                              Discontinued
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!readOnly && (
          <Button
            onClick={onAddIntervention}
            variant="outline"
            className="w-full mt-4"
            type="button"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Intervention
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export { InterventionList };