import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs"; // ^1.0.4
import { cn } from "../../lib/utils/color";

/**
 * Root Tabs component that manages the tabs state
 */
const Tabs = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Root
    className={cn("w-full", className)}
    {...props}
    ref={ref}
  />
));
Tabs.displayName = TabsPrimitive.Root.displayName;

/**
 * Component that contains the tab triggers with appropriate styling
 */
const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-start rounded-md bg-gray-50 p-1 text-gray-600",
      "dark:bg-gray-800 dark:text-gray-300",
      "w-full sm:w-auto overflow-x-auto",
      "border border-gray-200 dark:border-gray-700",
      className
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

/**
 * Component that triggers a tab to be selected when clicked
 */
const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      // Base styles
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5",
      "text-sm font-medium transition-all duration-200",
      
      // Default state
      "text-gray-700 hover:text-indigo-600",
      "dark:text-gray-300 dark:hover:text-indigo-400",
      
      // Focus state
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2",
      "dark:focus-visible:ring-indigo-400 dark:ring-offset-gray-900",
      
      // Active state
      "data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm",
      "dark:data-[state=active]:bg-gray-800 dark:data-[state=active]:text-indigo-400",
      
      // Bottom border for active state
      "relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:scale-x-0 after:bg-indigo-600 after:transition-transform",
      "data-[state=active]:after:scale-x-100",
      "dark:after:bg-indigo-400",
      
      // Disabled state
      "disabled:pointer-events-none disabled:opacity-50",
      
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

/**
 * Component that contains the content for a specific tab
 */
const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      // Base styles
      "mt-2 focus-visible:outline-none",
      "ring-offset-white dark:ring-offset-gray-950",
      
      // Focus styles
      "focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2",
      "dark:focus-visible:ring-indigo-400",
      
      // Transition
      "transition-opacity duration-200",
      "data-[state=inactive]:opacity-0 data-[state=active]:opacity-100",
      
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };