import * as React from "react"; // v18.0+
import { cn } from "../../lib/utils/color";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border border-gray-200 bg-white shadow-sm transition-all dark:border-gray-800 dark:bg-gray-950",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardHeader = ({ className, ...props }: CardHeaderProps) => (
  <div
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
);
CardHeader.displayName = "CardHeader";

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

const CardTitle = ({
  className,
  as: Comp = "h3",
  ...props
}: CardTitleProps) => (
  <Comp
    className={cn(
      "text-xl font-semibold leading-tight tracking-tight text-gray-900 dark:text-gray-50",
      className
    )}
    {...props}
  />
);
CardTitle.displayName = "CardTitle";

interface CardDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement> {}

const CardDescription = ({
  className,
  ...props
}: CardDescriptionProps) => (
  <p
    className={cn(
      "text-sm text-gray-500 dark:text-gray-400",
      className
    )}
    {...props}
  />
);
CardDescription.displayName = "CardDescription";

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardContent = ({ className, ...props }: CardContentProps) => (
  <div
    className={cn("p-6 pt-0", className)}
    {...props}
  />
);
CardContent.displayName = "CardContent";

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardFooter = ({ className, ...props }: CardFooterProps) => (
  <div
    className={cn(
      "flex items-center p-6 pt-0",
      className
    )}
    {...props}
  />
);
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
};