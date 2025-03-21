import React from 'react'; // react ^18.2.0
import { usePathname } from 'next/navigation'; // next/navigation ^14.0.0

import { Header } from './header';
import { Footer } from './footer';
import { Breadcrumbs } from './breadcrumbs';
import { cn } from '../../lib/utils/color';
import { useAuth } from '../../hooks/use-auth';
import { MainWrapperProps } from '../../types/component-props';

/**
 * Determines if the current page is a public page based on the pathname
 * @param pathname The current pathname
 * @returns True if the page is public, false otherwise
 */
const isPublicPage = (pathname: string): boolean => {
  // LD1: Check if pathname starts with /auth
  if (pathname.startsWith('/auth')) {
    return true;
  }

  // LD1: Check if pathname is exactly / (home page)
  if (pathname === '/') {
    return true;
  }

  // LD1: Return true if either condition is met, false otherwise
  return false;
};

/**
 * Main wrapper component that provides the layout structure for the application
 */
export const MainWrapper: React.FC<MainWrapperProps> = ({
  children,
  showHeader = true,
  showFooter = true,
  showBreadcrumbs = true,
  className,
}) => {
  // LD1: Get authentication state using useAuth hook
  const { isAuthenticated } = useAuth();

  // LD1: Get current pathname using usePathname hook
  const pathname = usePathname();

  // LD1: Determine if the current page is a public page (login, register, etc.)
  const isPublic = isPublicPage(pathname);

  // LD1: Render a div container with flex column layout
  return (
    <div className="flex flex-col min-h-screen">
      {/* LD1: Conditionally render Header component based on showHeader prop */}
      {showHeader && !isPublic && <Header />}

      {/* LD1: Render a main content container with flex-grow */}
      <main className="flex-grow">
        {/* LD1: Conditionally render Breadcrumbs component based on showBreadcrumbs prop and authentication state */}
        {showBreadcrumbs && isAuthenticated && !isPublic && <Breadcrumbs />}

        {/* LD1: Render children within the main content area with appropriate padding and max-width */}
        <div className={cn("container py-8 mx-auto max-w-7xl", className)}>
          {children}
        </div>
      </main>

      {/* LD1: Conditionally render Footer component based on showFooter prop */}
      {showFooter && <Footer />}
    </div>
  );
};