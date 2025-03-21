import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '../../lib/utils/color';
import { useAuth } from '../../hooks/use-auth';
import { titleCaseString, camelCaseToTitleCase } from '../../lib/utils/string';

interface BreadcrumbsProps {
  className?: string;
}

interface BreadcrumbItem {
  href: string;
  label: string;
  isCurrent?: boolean;
}

/**
 * Renders a breadcrumb navigation component based on the current URL path
 */
export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ className }) => {
  const pathname = usePathname();
  const { isClient, isProvider, isCaseManager, isAdmin } = useAuth();

  // Get the correct home link based on user role
  const homeLink = React.useMemo(() => {
    if (isAdmin) return '/admin/dashboard';
    if (isCaseManager) return '/case-manager/dashboard';
    if (isProvider) return '/provider/dashboard';
    if (isClient) return '/client/dashboard';
    return '/dashboard'; // Default fallback
  }, [isAdmin, isCaseManager, isProvider, isClient]);

  // Generate breadcrumb items from the current pathname
  const breadcrumbs = React.useMemo(() => {
    return generateBreadcrumbs(pathname);
  }, [pathname]);

  // If there are no breadcrumbs, don't render the component
  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "flex items-center text-sm text-gray-600 py-2 overflow-x-auto",
        className
      )}
    >
      <ol className="flex items-center flex-nowrap min-w-0">
        <li className="flex items-center flex-shrink-0">
          <Link
            href={homeLink}
            className="flex items-center text-gray-500 hover:text-indigo-600 transition-colors"
            aria-label="Home"
          >
            <Home size={16} />
          </Link>
        </li>
        
        {breadcrumbs.map((breadcrumb, index) => (
          <li
            key={breadcrumb.href}
            className="flex items-center flex-shrink-0"
            aria-current={breadcrumb.isCurrent ? "page" : undefined}
          >
            <ChevronRight size={16} className="mx-2 text-gray-400" aria-hidden="true" />
            {breadcrumb.isCurrent ? (
              <span className="font-medium text-gray-900 truncate max-w-[200px]" title={breadcrumb.label}>
                {breadcrumb.label}
              </span>
            ) : (
              <Link
                href={breadcrumb.href}
                className="text-gray-500 hover:text-indigo-600 transition-colors truncate max-w-[200px]"
                title={breadcrumb.label}
              >
                {breadcrumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

/**
 * Generates breadcrumb items from the current pathname
 */
function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  // If pathname is root or main dashboard, return empty array
  if (pathname === '/' || pathname === '/dashboard' ||
      pathname.match(/^\/(admin|client|provider|case-manager)\/dashboard$/)) {
    return [];
  }
  
  // Split the pathname into segments and filter out empty segments
  const segments = pathname.split('/').filter(Boolean);
  
  // Handle role-specific dashboard segments like /admin/dashboard, /client/dashboard etc.
  let startIndex = 0;
  if (segments.length >= 2 && 
      ['admin', 'client', 'provider', 'case-manager'].includes(segments[0]) && 
      segments[1] === 'dashboard') {
    startIndex = 2; // Skip both role and dashboard segments
  } else if (segments.length > 0 && segments[0] === 'dashboard') {
    startIndex = 1; // Skip just the dashboard segment
  }
  
  // If no segments left after removing dashboard, return empty array
  if (segments.length <= startIndex) {
    return [];
  }
  
  // Build up the breadcrumb items
  return segments.slice(startIndex).map((segment, index) => {
    // Build the href for this breadcrumb
    const href = `/${segments.slice(0, startIndex + index + 1).join('/')}`;
    
    // Format segment into a readable label
    const label = formatBreadcrumbLabel(segment);
    
    // Check if this is the current page (last segment)
    const isCurrent = startIndex + index === segments.length - 1;
    
    return {
      href,
      label,
      isCurrent
    };
  });
}

/**
 * Formats a URL segment into a human-readable label
 */
function formatBreadcrumbLabel(segment: string): string {
  // Handle dynamic route parameters (e.g. [id] becomes "Details")
  if (segment.startsWith('[') && segment.endsWith(']')) {
    const paramName = segment.slice(1, -1);
    
    // Common parameter names and their human-readable equivalents
    if (paramName === 'id') return 'Details';
    if (paramName === 'clientId') return 'Client Details';
    if (paramName === 'providerId') return 'Provider Details';
    if (paramName === 'planId') return 'Plan Details';
    if (paramName === 'documentId') return 'Document Details';
    if (paramName === 'notificationId') return 'Notification Details';
    
    // For other parameters, just format the parameter name
    return titleCaseString(paramName.replace(/[-_]/g, ' '));
  }
  
  // Special case mappings for common segments
  const specialCases: Record<string, string> = {
    'care-plans': 'Care Plans',
    'services-plans': 'Services Plans',
    'settings': 'Settings',
    'profile': 'Profile',
    'notifications': 'Notifications',
    'documents': 'Documents',
    'providers': 'Providers',
    'analytics': 'Analytics',
    'admin': 'Admin',
    'client': 'Client',
    'provider': 'Provider',
    'case-manager': 'Case Manager',
  };
  
  if (specialCases[segment]) {
    return specialCases[segment];
  }
  
  // Replace hyphens and underscores with spaces
  let label = segment.replace(/[-_]/g, ' ');
  
  // Check if the segment is camelCase
  if (/[a-z][A-Z]/.test(segment)) {
    return camelCaseToTitleCase(segment);
  }
  
  // Otherwise, just title case the segment
  return titleCaseString(label);
}