import React from "react";
import { AlertCircle } from "lucide-react"; // v0.284.0
import { cn } from "../../lib/utils/color";
import { Alert, AlertIcon } from "../ui/alert";
import { getFormErrorMessage } from "../../lib/utils/form";

/**
 * A component for displaying error messages with consistent styling and accessibility features
 */
export const ErrorMessage: React.FC<
  React.HTMLAttributes<HTMLDivElement> & {
    /** Error message or object to display */
    error?: string | Error | Record<string, any> | null;
    /** Additional CSS class names */
    className?: string;
    /** Whether to show the error icon */
    showIcon?: boolean;
  }
> = ({ error, className, showIcon = true, ...props }) => {
  // Extract a human-readable error message
  let errorMessage: string | undefined;

  if (typeof error === "string") {
    errorMessage = error;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else if (error && typeof error === "object") {
    errorMessage = getFormErrorMessage(error);
  }

  // If there's no error message, don't render anything
  if (!errorMessage) {
    return null;
  }

  return (
    <Alert
      variant="error"
      className={cn("text-sm text-red-500", className)}
      aria-live="assertive"
      {...props}
    >
      {showIcon && <AlertIcon variant="error" />}
      {errorMessage}
    </Alert>
  );
};