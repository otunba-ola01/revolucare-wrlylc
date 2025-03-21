import React, { forwardRef } from "react";

import { cn } from "../../lib/utils/color";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Set to true to indicate an error state */
  error?: boolean;
  /** Optional icon to display inside the input */
  icon?: React.ReactNode;
}

/**
 * A reusable input component that implements the Revolucare design system.
 * Supports error states, icons, and all standard input HTML attributes.
 * Designed to work seamlessly with form libraries like React Hook Form.
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, icon, ...props }, ref) => {
    return (
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-500">
            {icon}
          </div>
        )}
        <input
          className={cn(
            // Base styles
            "flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm",
            "border-gray-300 text-gray-900 placeholder:text-gray-500",
            
            // Focus styles
            "focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent",
            
            // State styles
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-100",
            error && "border-red-500 focus:ring-red-500 placeholder:text-red-400",
            
            // File input styles
            "file:border-0 file:bg-transparent file:text-sm file:font-medium",
            
            // Icon padding
            icon && "pl-10",
            
            // Custom classes passed as props
            className
          )}
          ref={ref}
          aria-invalid={error ? "true" : undefined}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = "Input";

export type { InputProps };
export { Input };