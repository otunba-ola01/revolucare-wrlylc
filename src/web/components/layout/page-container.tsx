import React from 'react';
import { cn } from '../../lib/utils/color';

/**
 * Props for the PageContainer component
 */
interface PageContainerProps {
  /** Content to render inside the container */
  children: React.ReactNode;
  /** Additional CSS classes to apply to the container */
  className?: string;
  /** Maximum width constraint (Tailwind class) */
  maxWidth?: string;
  /** Padding to apply (Tailwind classes, can include responsive variants) */
  padding?: string;
}

/**
 * A layout component that provides a standardized container for page content.
 * Handles proper spacing, width constraints, and responsive behavior for
 * consistent page layouts across the application.
 * 
 * Used across the platform to maintain consistent layout patterns and spacing.
 */
export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  className,
  maxWidth = 'max-w-7xl',
  padding = 'p-4 md:p-6 lg:p-8',
}) => {
  return (
    <div
      className={cn(
        // Center the container horizontally and use full available width
        'mx-auto w-full',
        // Apply configurable padding with responsive defaults
        padding,
        // Apply configurable maximum width constraint
        maxWidth,
        // Apply any additional custom classes
        className
      )}
    >
      {children}
    </div>
  );
};