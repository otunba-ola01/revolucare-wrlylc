import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar"; // v1.0.3
import { cn } from "../../lib/utils/color";

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      "inline-flex items-center justify-center align-middle",
      className
    )}
    {...props}
  />
));

Avatar.displayName = "Avatar";

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("h-full w-full object-cover", className)}
    {...props}
  />
));

AvatarImage.displayName = "AvatarImage";

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, delayMs = 600, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full",
      "bg-indigo-100 text-indigo-700 font-medium",
      className
    )}
    delayMs={delayMs}
    {...props}
  />
));

AvatarFallback.displayName = "AvatarFallback";

export { Avatar, AvatarImage, AvatarFallback };