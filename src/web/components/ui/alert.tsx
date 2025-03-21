import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority"; // v0.6.0
import { AlertCircle, Info, CheckCircle, AlertTriangle } from "lucide-react"; // v0.284.0

import { cn } from "../../lib/utils/color";

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg+div]:pl-7",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground border-border",
        info: "border-indigo-200 bg-indigo-50 text-indigo-900 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-100",
        success: "border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100",
        warning: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100",
        error: "border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    aria-live={variant === "error" ? "assertive" : "polite"}
    {...props}
  />
));
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm leading-relaxed", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

const AlertIcon = ({
  variant,
  className,
}: {
  variant?: VariantProps<typeof alertVariants>["variant"];
  className?: string;
}) => {
  let iconColorClass;
  let Icon;
  
  switch (variant) {
    case "info":
      Icon = Info;
      iconColorClass = "text-indigo-600 dark:text-indigo-400"; // Primary: indigo-600 (#4F46E5)
      break;
    case "success":
      Icon = CheckCircle;
      iconColorClass = "text-green-500 dark:text-green-400"; // Success: green-500 (#10B981)
      break;
    case "warning":
      Icon = AlertTriangle;
      iconColorClass = "text-amber-500 dark:text-amber-400"; // Warning: amber-500 (#F59E0B)
      break;
    case "error":
      Icon = AlertCircle;
      iconColorClass = "text-red-500 dark:text-red-400"; // Error: red-500 (#EF4444)
      break;
    default:
      Icon = Info;
      iconColorClass = "text-gray-500 dark:text-gray-400";
      break;
  }
  
  return <Icon className={cn("h-5 w-5", iconColorClass, className)} />;
};
AlertIcon.displayName = "AlertIcon";

export { Alert, AlertTitle, AlertDescription, AlertIcon, alertVariants };