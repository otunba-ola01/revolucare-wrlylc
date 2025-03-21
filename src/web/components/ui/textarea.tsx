import React, { forwardRef } from "react";
import { cn } from "../../lib/utils/color";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          // Base styles - following Revolucare design system
          "flex min-h-[80px] w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white",
          // Focus styles - using primary indigo-600 color from design system
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2",
          // Placeholder styles
          "placeholder:text-gray-500",
          // Error styles - using error red-500 color from design system
          error && "border-red-500 focus-visible:ring-red-500",
          // Disabled styles
          props.disabled && "cursor-not-allowed opacity-50 bg-gray-50",
          // Pass through any additional classes
          className
        )}
        ref={ref}
        aria-invalid={error ? "true" : undefined}
        {...props}
      />
    );
  }
);

// Set display name for better debugging experience
Textarea.displayName = "Textarea";

export { Textarea };