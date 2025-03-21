import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label" // v2.0.2
import { cva, type VariantProps } from "class-variance-authority" // v0.6.0

import { cn } from "../../lib/utils/color"

/**
 * Style variants for the label component
 * Provides consistent styling across different states and sizes
 */
const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
  {
    variants: {
      variant: {
        default: "text-gray-900 dark:text-gray-100",
        error: "text-red-500 dark:text-red-400",
        disabled: "text-gray-500 dark:text-gray-400",
      },
      size: {
        default: "text-sm",
        sm: "text-xs",
        lg: "text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface LabelProps
  extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>,
    VariantProps<typeof labelVariants> {
  /**
   * Indicates if the associated form field is required
   * Displays a visual indicator (*) when true
   */
  required?: boolean
}

/**
 * Label component that implements Revolucare design system
 * Provides accessible form labels with consistent styling
 */
const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  LabelProps
>(({ className, variant, size, required, children, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants({ variant, size, className }))}
    {...props}
  >
    {children}
    {required && (
      <span
        className="ml-1 text-red-500 dark:text-red-400"
        aria-hidden="true"
      >
        *
      </span>
    )}
  </LabelPrimitive.Root>
))

Label.displayName = "Label"

export { Label, labelVariants }