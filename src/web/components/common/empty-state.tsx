import React from "react";
import { FileQuestion, Search, AlertCircle } from "lucide-react"; // v0.284.0
import { cn } from "../../lib/utils/color";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";

/**
 * Props interface for the EmptyState component
 */
export interface EmptyStateProps {
  /** The title to display in the empty state (required) */
  title: string;
  /** Optional description text */
  description?: string;
  /** Optional custom icon to display */
  icon?: React.ReactNode;
  /** Text for the action button */
  actionText?: string;
  /** Function to call when the action button is clicked */
  onAction?: () => void;
  /** Visual variant of the empty state */
  variant?: 'no-data' | 'no-results' | 'error' | 'empty';
  /** Additional CSS classes */
  className?: string;
  /** Optional children for custom content */
  children?: React.ReactNode;
}

/**
 * A component that displays an empty state with customizable icon, title, description, and action button
 */
const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({
    title,
    description,
    icon,
    actionText,
    onAction,
    variant = 'empty',
    className,
    children,
  }, ref) => {
    // Determine which icon to display based on the variant
    let displayIcon = icon;
    if (!displayIcon) {
      switch (variant) {
        case 'no-data':
          displayIcon = <FileQuestion size={48} />;
          break;
        case 'no-results':
          displayIcon = <Search size={48} />;
          break;
        case 'error':
          displayIcon = <AlertCircle size={48} />;
          break;
        default:
          displayIcon = <FileQuestion size={48} />;
      }
    }

    // Determine icon color based on variant
    const iconColorClass = 
      variant === 'error' ? "text-red-500" : 
      variant === 'no-results' ? "text-amber-500" : 
      "text-indigo-600";
    
    // Set appropriate ARIA role based on variant
    const ariaRole = variant === 'error' ? 'alert' : 'status';

    return (
      <Card 
        ref={ref}
        className={cn(
          "w-full flex flex-col items-center justify-center p-6 py-8 my-4",
          variant === 'error' ? "border-red-200" : "",
          className
        )}
        role={ariaRole}
      >
        <CardContent className="flex flex-col items-center text-center w-full max-w-md mx-auto">
          <div className={cn("mb-4", iconColorClass)} aria-hidden="true">
            {displayIcon}
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-2">
            {title}
          </h3>
          
          {description && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {description}
            </p>
          )}
          
          {children && <div className="mt-4 w-full">{children}</div>}
          
          {actionText && onAction && (
            <Button 
              onClick={onAction} 
              className="mt-6"
              variant={variant === 'error' ? 'danger' : 'primary'}
            >
              {actionText}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }
);

EmptyState.displayName = "EmptyState";

export default EmptyState;