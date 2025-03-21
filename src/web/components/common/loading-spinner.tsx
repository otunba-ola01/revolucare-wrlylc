import React from 'react';
import { Loader2 } from 'lucide-react'; // v0.284.0
import { cn } from '../../lib/utils/color';

/**
 * A component that displays an animated loading spinner with customizable size and color
 */
export function LoadingSpinner({
  size = 'md',
  color = 'primary',
  className,
  text,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'white' | 'gray';
  className?: string;
  text?: string;
}) {
  // Size classes for the spinner
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  // Color classes for the spinner and text
  const colorClasses = {
    primary: 'text-indigo-600',
    secondary: 'text-pink-500',
    white: 'text-white',
    gray: 'text-gray-500',
  };

  // Text size classes based on spinner size
  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
  };

  return (
    <div 
      className={cn(
        'flex items-center justify-center space-x-2',
        className
      )}
      role="status"
      aria-live="polite"
      {...props}
    >
      <Loader2 
        className={cn(
          'animate-spin',
          sizeClasses[size],
          colorClasses[color]
        )} 
      />
      {text && (
        <span className={cn(
          'font-medium',
          textSizeClasses[size],
          colorClasses[color]
        )}>
          {text}
        </span>
      )}
      <span className="sr-only">Loading...</span>
    </div>
  );
}