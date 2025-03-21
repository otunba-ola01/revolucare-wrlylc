import React from 'react';
import { cn } from '../../lib/utils/color';

/**
 * A component that displays an animated loading placeholder with customizable dimensions.
 * Improves perceived performance by providing visual feedback during content loading.
 */
export function Skeleton({
  width,
  height,
  className,
  rounded = 'md',
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  width?: string | number;
  height?: string | number;
  className?: string;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
}) {
  // Determine border radius classes based on the rounded prop
  const radiusClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  };
  
  const radiusClass = radiusClasses[rounded];
  
  // Convert number values to pixel strings for width and height
  const widthStyle = typeof width === 'number' ? `${width}px` : width;
  const heightStyle = typeof height === 'number' ? `${height}px` : height;
  
  return (
    <div
      className={cn(
        'animate-pulse bg-gray-200 dark:bg-gray-700',
        radiusClass,
        className
      )}
      style={{
        width: widthStyle || '100%',
        height: heightStyle || '1rem',
      }}
      aria-hidden="true"
      {...props}
    />
  );
}