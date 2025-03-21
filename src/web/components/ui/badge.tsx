import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority"; // v0.6.0
import { cn } from "../../lib/utils/color";

export const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-gray-100 text-gray-800 hover:bg-gray-200 focus:ring-gray-500",
        primary: "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500",
        secondary: "bg-pink-500 text-white hover:bg-pink-600 focus:ring-pink-400",
        outline: "border border-gray-200 text-gray-700 hover:bg-gray-100 focus:ring-gray-500",
        success: "bg-green-500 text-white hover:bg-green-600 focus:ring-green-400",
        warning: "bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-400",
        error: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-400",
      },
      size: {
        default: "h-6",
        sm: "h-5 px-1.5 text-[10px]",
        lg: "h-7 px-3 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

/**
 * A versatile badge component for displaying status, categories, or labels.
 * Follows the Revolucare design system and ensures accessibility.
 */
function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}

export { Badge };