import React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress"; // ^1.0.3
import { cn } from "../../lib/utils/color";

/**
 * Determines the appropriate color class based on progress value
 */
function getProgressColor(value: number): string {
  if (value < 25) return "bg-red-500";
  if (value < 50) return "bg-amber-500";
  if (value < 75) return "bg-blue-500";
  return "bg-green-500";
}

/**
 * A customizable progress bar component that shows completion status
 */
const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
    value: number;
    showValue?: boolean;
    color?: "default" | "success" | "warning" | "error" | "primary" | "secondary";
    size?: "sm" | "md" | "lg";
    animated?: boolean;
  }
>(
  (
    {
      className,
      value = 0,
      showValue = false,
      color,
      size = "md",
      animated = true,
      ...props
    },
    ref
  ) => {
    // Clamp the value between 0 and 100
    const clampedValue = Math.max(0, Math.min(100, value));

    // Determine the color class based on the color prop or value
    const colorClass = color
      ? {
          default: "bg-gray-500",
          success: "bg-green-500",
          warning: "bg-amber-500",
          error: "bg-red-500",
          primary: "bg-indigo-600", // Revolucare primary color
          secondary: "bg-pink-500", // Revolucare secondary color
        }[color]
      : getProgressColor(clampedValue);

    // Determine the height class based on the size prop
    const heightClass = {
      sm: "h-1",
      md: "h-2.5",
      lg: "h-4",
    }[size];

    return (
      <div 
        className={cn(
          "relative w-full", 
          showValue && "mb-6", 
          className
        )}
      >
        <ProgressPrimitive.Root
          ref={ref}
          className={cn(
            "relative overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800",
            heightClass
          )}
          value={clampedValue}
          max={100}
          aria-label="Progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={clampedValue}
          aria-valuetext={`${clampedValue}% complete`}
          {...props}
        >
          <ProgressPrimitive.Indicator
            className={cn(
              "h-full flex-1",
              colorClass,
              animated && "transition-all duration-500 ease-in-out"
            )}
            style={{ 
              transform: `translateX(-${100 - clampedValue}%)`
            }}
          />
        </ProgressPrimitive.Root>
        {showValue && (
          <div 
            className="absolute -bottom-6 right-0 text-sm font-medium text-gray-700 dark:text-gray-300"
            aria-hidden="true"
          >
            {clampedValue}%
          </div>
        )}
      </div>
    );
  }
);

Progress.displayName = "Progress";

export { Progress };