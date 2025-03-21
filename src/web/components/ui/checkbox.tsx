"use client"

import * as React from "react" // React 18.2.0
import * as CheckboxPrimitive from "@radix-ui/react-checkbox" // @radix-ui/react-checkbox 1.0.4
import { CheckIcon } from "lucide-react" // lucide-react 0.284.0

import { cn } from "../../lib/utils/color"

/**
 * An accessible checkbox component following the Revolucare design system
 */
const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> & {
    label?: string
    description?: string
    error?: string
  }
>(({ className, label, description, error, ...props }, ref) => (
  <div className="flex flex-col space-y-1">
    <div className="flex items-center space-x-2">
      <CheckboxPrimitive.Root
        ref={ref}
        className={cn(
          "peer h-4 w-4 shrink-0 rounded-sm border border-gray-300 shadow",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600",
          "data-[state=checked]:text-white",
          "transition-colors duration-200",
          error ? "border-red-500" : "border-gray-300",
          className
        )}
        {...props}
      >
        <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
          <CheckIcon className="h-3.5 w-3.5" />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      {label && (
        <label
          htmlFor={props.id}
          className={cn(
            "text-sm font-medium leading-none",
            "peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
            error ? "text-red-600" : "text-gray-900"
          )}
        >
          {label}
        </label>
      )}
    </div>
    
    {description && (
      <p className="text-sm text-gray-500 ml-6">{description}</p>
    )}
    
    {error && (
      <p className="text-sm font-medium text-red-500 ml-6">{error}</p>
    )}
  </div>
))

Checkbox.displayName = "Checkbox"

export { Checkbox }