import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider"; // v1.1.2
import { cn } from "../../lib/utils/color";

export interface SliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  /** Color variant of the slider */
  color?: 'default' | 'primary' | 'secondary' | 'accent';
  /** Size variant of the slider */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to display the current value */
  showValue?: boolean;
  /** How to display the current value */
  valueDisplay?: 'tooltip' | 'label' | 'none';
  /** Function to format the displayed value */
  formatValue?: (value: number) => string;
  /** Marks to display along the slider track */
  marks?: { value: number; label?: string }[];
}

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({
  className,
  color = "primary",
  size = "md",
  showValue = false,
  valueDisplay = "tooltip",
  formatValue,
  marks,
  ...props
}, ref) => {
  // Default format function if none provided
  const formatValueFn = React.useCallback(
    (value: number) => (formatValue ? formatValue(value) : `${value}`),
    [formatValue]
  );
  
  // Current values for display - handle both array and single values
  const values = props.value ?? props.defaultValue ?? [0];
  const currentValues = Array.isArray(values) ? values : [values];
  
  // Calculate spacing needed for marks if present
  const hasMarkLabels = marks?.some(mark => mark.label);
  
  return (
    <div className={cn(
      "relative", 
      hasMarkLabels && "pb-6",
      className
    )}>
      <SliderPrimitive.Root
        ref={ref}
        className={cn(
          "relative flex w-full touch-none select-none items-center",
          props.disabled && "opacity-50 cursor-not-allowed"
        )}
        {...props}
      >
        {/* Render marks if provided */}
        {marks && marks.length > 0 && (
          <div className="absolute w-full pointer-events-none" aria-hidden="true">
            {marks.map((mark) => {
              // Calculate percentage position
              const percent = ((mark.value - (props.min ?? 0)) / ((props.max ?? 100) - (props.min ?? 0))) * 100;
              
              return (
                <React.Fragment key={mark.value}>
                  <div
                    className={cn(
                      "absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neutral-400 dark:bg-neutral-500",
                      {
                        "h-1 w-1": size === "sm",
                        "h-1 w-1": size === "md",
                        "h-1.5 w-1.5": size === "lg"
                      }
                    )}
                    style={{ left: `${percent}%` }}
                  />
                  {mark.label && (
                    <div 
                      className="absolute text-xs text-neutral-500 dark:text-neutral-400"
                      style={{ 
                        left: `${percent}%`, 
                        top: "calc(100% + 0.5rem)",
                        transform: "translateX(-50%)"
                      }}
                    >
                      {mark.label}
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}
        
        <SliderPrimitive.Track
          className={cn(
            "relative rounded-full bg-neutral-200 dark:bg-neutral-700 w-full",
            {
              "h-1": size === "sm",
              "h-2": size === "md",
              "h-3": size === "lg"
            }
          )}
        >
          <SliderPrimitive.Range
            className={cn(
              "absolute h-full rounded-full",
              {
                "bg-neutral-600 dark:bg-neutral-400": color === "default",
                "bg-primary-600 dark:bg-primary-500": color === "primary",
                "bg-secondary-600 dark:bg-secondary-500": color === "secondary",
                "bg-accent-600 dark:bg-accent-500": color === "accent"
              }
            )}
          />
        </SliderPrimitive.Track>
        
        {currentValues.map((value, index) => (
          <SliderPrimitive.Thumb
            key={index}
            className={cn(
              "block rounded-full border-2 bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
              {
                "h-3 w-3": size === "sm",
                "h-5 w-5": size === "md",
                "h-6 w-6": size === "lg",
                
                "border-neutral-600 focus:ring-neutral-500 dark:border-neutral-400 dark:focus:ring-neutral-400": color === "default",
                "border-primary-600 focus:ring-primary-500 dark:border-primary-500 dark:focus:ring-primary-400": color === "primary",
                "border-secondary-600 focus:ring-secondary-500 dark:border-secondary-500 dark:focus:ring-secondary-400": color === "secondary",
                "border-accent-600 focus:ring-accent-500 dark:border-accent-500 dark:focus:ring-accent-400": color === "accent"
              },
              showValue && valueDisplay === "tooltip" && "group relative"
            )}
            aria-label={`Value ${formatValueFn(value)}`}
            aria-valuetext={formatValueFn(value)}
          >
            {showValue && valueDisplay === "tooltip" && (
              <div 
                className="absolute -top-8 left-1/2 -translate-x-1/2 rounded bg-neutral-800 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 dark:bg-neutral-700"
                role="tooltip"
              >
                {formatValueFn(value)}
              </div>
            )}
          </SliderPrimitive.Thumb>
        ))}
      </SliderPrimitive.Root>
      
      {/* Value label */}
      {showValue && valueDisplay === "label" && (
        <div 
          className="mt-2 text-sm text-center text-neutral-600 dark:text-neutral-300"
          aria-live="polite"
          aria-atomic="true"
        >
          {currentValues.length === 1
            ? formatValueFn(currentValues[0])
            : `${formatValueFn(currentValues[0])} - ${formatValueFn(currentValues[currentValues.length - 1])}`}
        </div>
      )}
    </div>
  );
});

Slider.displayName = "Slider";

export { Slider };