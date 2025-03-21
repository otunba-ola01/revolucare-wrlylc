import * as React from 'react';
import { Root, Thumb } from '@radix-ui/react-switch'; // v1.0.3
import { cn } from '../../lib/utils/color';

type SwitchProps = React.ComponentPropsWithoutRef<typeof Root> & {
  label?: string;
  description?: string;
  error?: string;
};

const Switch = React.forwardRef<
  React.ElementRef<typeof Root>,
  SwitchProps
>(({ className, label, description, error, id, ...props }, ref) => {
  // Generate a unique ID if one isn't provided for accessibility
  const switchId = id || React.useId();
  
  return (
    <div className="flex items-start">
      <Root
        className={cn(
          "peer relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "data-[state=checked]:bg-indigo-600 data-[state=unchecked]:bg-gray-200",
          "hover:data-[state=unchecked]:bg-gray-300",
          className
        )}
        id={switchId}
        {...props}
        ref={ref}
        aria-checked={props.checked}
        aria-invalid={!!error}
      >
        <Thumb
          className={cn(
            "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform",
            "data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
          )}
        />
      </Root>
      
      {(label || description || error) && (
        <div className="ml-3 flex flex-col">
          {label && (
            <label
              htmlFor={switchId}
              className="text-sm font-medium leading-none text-gray-900 select-none"
            >
              {label}
            </label>
          )}
          
          {description && (
            <p className="mt-1 text-sm text-gray-500">
              {description}
            </p>
          )}
          
          {error && (
            <p className="mt-1 text-sm text-red-500" id={`${switchId}-error`}>
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
});

Switch.displayName = "Switch";

export { Switch };