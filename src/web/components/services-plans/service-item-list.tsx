import React from "react";
import { PlusCircle, Edit, Trash2 } from "lucide-react"; // v0.284.0

import { ServiceItem, ServiceItemStatus, ServiceItemFormData } from "../../types/service-plan";
import { ServiceType } from "../../config/constants";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { formatCurrency } from "../../lib/utils/format";

/**
 * Determines the appropriate badge variant based on service item status
 * @param status The ServiceItemStatus value
 * @returns The badge variant name
 */
const getStatusBadgeVariant = (status: ServiceItemStatus): string => {
  switch (status) {
    case ServiceItemStatus.PENDING:
      return "default";
    case ServiceItemStatus.ACTIVE:
    case ServiceItemStatus.COMPLETED:
      return "success";
    case ServiceItemStatus.SCHEDULED:
      return "warning";
    case ServiceItemStatus.DISCONTINUED:
      return "error";
    default:
      return "default";
  }
};

/**
 * Converts a ServiceType enum value to a human-readable label
 * @param type The ServiceType value
 * @returns Formatted service type label
 */
const getServiceTypeLabel = (type: ServiceType): string => {
  // Replace underscores with spaces and convert to title case
  return type
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

interface ServiceItemListProps {
  /**
   * Array of service items to display
   */
  items: ServiceItem[];
  /**
   * Callback function to add a new service
   */
  onAdd: () => void;
  /**
   * Callback function to edit an existing service
   */
  onEdit: (item: ServiceItem) => void;
  /**
   * Callback function to remove a service
   */
  onRemove: (itemId: string) => void;
  /**
   * Whether the list is read-only (no add, edit, delete)
   */
  readOnly?: boolean;
}

/**
 * A component that displays a list of service items and provides actions to add, edit, and remove them
 */
export const ServiceItemList: React.FC<ServiceItemListProps> = ({
  items,
  onAdd,
  onEdit,
  onRemove,
  readOnly = false,
}) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Services</span>
          <span className="text-sm text-gray-500">
            {items.length} {items.length === 1 ? "item" : "items"}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <p>No services have been added to this plan yet.</p>
            {!readOnly && (
              <p className="mt-2 text-sm">Click the "Add Service" button below to get started.</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-4 border border-gray-200 rounded-md flex flex-col sm:flex-row justify-between"
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium">{getServiceTypeLabel(item.serviceType)}</h4>
                    <Badge variant={getStatusBadgeVariant(item.status)}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{item.description}</p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div>
                      <span className="font-semibold">Frequency:</span> {item.frequency}
                    </div>
                    <div>
                      <span className="font-semibold">Duration:</span> {item.duration}
                    </div>
                    <div>
                      <span className="font-semibold">Estimated Cost:</span>{" "}
                      {formatCurrency(item.estimatedCost)}
                    </div>
                    {item.providerName && (
                      <div>
                        <span className="font-semibold">Provider:</span> {item.providerName}
                      </div>
                    )}
                  </div>
                </div>
                {!readOnly && (
                  <div className="flex items-center space-x-2 mt-4 sm:mt-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(item)}
                      aria-label={`Edit ${getServiceTypeLabel(item.serviceType)}`}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRemove(item.id)}
                      aria-label={`Remove ${getServiceTypeLabel(item.serviceType)}`}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
      {!readOnly && (
        <CardFooter>
          <Button onClick={onAdd} className="ml-auto">
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Service
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};