import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip" // ^1.0.6

import { cn } from "../../lib/utils/color"

/**
 * Provider component that manages tooltip state and behavior across the application
 */
export const TooltipProvider: React.FC<TooltipPrimitive.TooltipProviderProps> = ({
  ...props
}) => (
  <TooltipPrimitive.Provider
    delayDuration={100}
    skipDelayDuration={300}
    {...props}
  />
)
TooltipProvider.displayName = "TooltipProvider"

/**
 * Root tooltip component that wraps Radix UI's Tooltip primitive
 */
export const Tooltip: React.FC<TooltipPrimitive.TooltipProps> = ({ ...props }) => (
  <TooltipPrimitive.Root {...props} />
)
Tooltip.displayName = "Tooltip"

/**
 * Component that triggers the tooltip to show on hover or focus
 */
export const TooltipTrigger = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Trigger>,
  TooltipPrimitive.TooltipTriggerProps
>(({ ...props }, ref) => (
  <TooltipPrimitive.Trigger ref={ref} {...props} />
))
TooltipTrigger.displayName = "TooltipTrigger"

/**
 * Props for the TooltipContent component
 */
export type TooltipContentProps = TooltipPrimitive.TooltipContentProps & {
  sideOffset?: number
}

/**
 * Component that contains the tooltip content with styling
 */
export const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  TooltipContentProps
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      // Base styles
      "z-50 overflow-hidden rounded-md border border-indigo-700",
      // Colors from Revolucare design system
      "bg-indigo-600 text-white",
      // Text styling
      "text-sm font-medium leading-none tracking-tight",
      // Padding and dimensions
      "px-3 py-2",
      // Animation with subtle transitions
      "animate-in fade-in-50 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 duration-200",
      // Shadow for depth
      "shadow-lg",
      // Custom classes
      className
    )}
    {...props}
  />
))
TooltipContent.displayName = "TooltipContent"