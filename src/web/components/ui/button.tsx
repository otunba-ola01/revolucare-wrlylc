import * as React from "react" // v18.0+
import { Slot } from "@radix-ui/react-slot" // v1.0.2
import { cva, type VariantProps } from "class-variance-authority" // v0.6.0
import { Loader2 } from "lucide-react" // v0.284.0

import { cn } from "../../lib/utils/color"

/**
 * Defines style variants for the button component using class-variance-authority
 */
export const buttonVariants = cva(
  // Base styles for all buttons
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // Primary button (main CTA)
        primary: "bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800",
        // Secondary button
        secondary: "bg-pink-500 text-white hover:bg-pink-600 active:bg-pink-700",
        // Outline button
        outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100",
        // Ghost button (transparent)
        ghost: "text-gray-700 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200",
        // Link button
        link: "text-indigo-600 underline-offset-4 hover:underline p-0 h-auto",
        // Danger button for destructive actions
        danger: "bg-red-500 text-white hover:bg-red-600 active:bg-red-700",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3 py-1 text-xs",
        lg: "h-11 px-8 py-3 text-base",
        icon: "h-10 w-10 p-2", // For square icon buttons
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

// Button component props interface
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * If true, the button will render its children using Radix UI's Slot component
   */
  asChild?: boolean
  /**
   * If true, the button will show a loading spinner
   */
  isLoading?: boolean
  /**
   * Text to display while loading (defaults to children if not provided)
   */
  loadingText?: string
}

/**
 * Button component for user interactions
 * Supports various styles, sizes, loading states, and composition with other components
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    asChild = false, 
    isLoading = false, 
    loadingText, 
    children, 
    disabled, 
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    // Determine if button is disabled (either explicitly or due to loading)
    const isDisabled = isLoading || disabled
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isDisabled}
        aria-disabled={isDisabled || undefined}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            {loadingText || children}
          </>
        ) : (
          children
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }