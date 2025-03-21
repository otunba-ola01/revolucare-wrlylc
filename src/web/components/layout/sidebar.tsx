import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronRight, Home, FileText, Users, BarChart, FileImage, Settings } from 'lucide-react';

import { useAuth } from '../../hooks/use-auth';
import { MAIN_NAVIGATION, getNavigationForRole } from '../../config/navigation';
import { Button } from '../ui/button';
import { logoConfig } from '../../config/site';
import { cn } from '../../lib/utils/color';

interface SidebarProps {
  className?: string;
}

/**
 * Determines if a navigation link is active based on the current pathname
 * @param href - The href of the navigation link
 * @param pathname - The current pathname
 * @returns True if the link is active, false otherwise
 */
function isLinkActive(href: string, pathname: string): boolean {
  if (href === pathname) return true;
  // For nested routes, check if pathname starts with href (excluding root '/')
  if (href !== '/' && pathname?.startsWith(href)) return true;
  return false;
}

/**
 * Returns the appropriate icon component based on the navigation item icon name
 * @param iconName - The name of the icon to render
 * @returns React node representing the icon
 */
function getIconComponent(iconName: string): React.ReactNode {
  switch (iconName) {
    case 'home':
    case 'dashboard':
      return <Home className="h-5 w-5" />;
    case 'file-text':
    case 'care-plan':
    case 'services-plan':
      return <FileText className="h-5 w-5" />;
    case 'users':
    case 'providers':
      return <Users className="h-5 w-5" />;
    case 'document':
    case 'documents':
      return <FileImage className="h-5 w-5" />;
    case 'chart':
    case 'analytics':
      return <BarChart className="h-5 w-5" />;
    case 'settings':
      return <Settings className="h-5 w-5" />;
    default:
      return null;
  }
}

/**
 * Renders a navigation item with appropriate styling and behavior
 * @param item - The navigation item to render
 * @param index - The index of the item in the navigation array
 * @param isCollapsed - Whether the sidebar is collapsed
 * @returns Rendered navigation item JSX
 */
function renderNavItem(item: any, index: number, isCollapsed: boolean, pathname: string): JSX.Element {
  const active = isLinkActive(item.href, pathname);
  const icon = getIconComponent(item.icon);

  return (
    <li key={index}>
      <Link
        href={item.href}
        className={cn(
          "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
          active
            ? "bg-indigo-50 text-indigo-600"
            : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
          isCollapsed && "justify-center px-2"
        )}
        aria-current={active ? "page" : undefined}
      >
        {icon}
        {!isCollapsed && <span className="ml-3">{item.title}</span>}
      </Link>

      {/* Render nested navigation items if expanded */}
      {!isCollapsed && item.children && item.children.length > 0 && (
        <ul className="mt-1 space-y-1 pl-6">
          {item.children.map((child: any, childIndex: number) => {
            const childActive = isLinkActive(child.href, pathname);
            return (
              <li key={`${index}-${childIndex}`}>
                <Link
                  href={child.href}
                  className={cn(
                    "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    childActive
                      ? "bg-indigo-50 text-indigo-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                  aria-current={childActive ? "page" : undefined}
                >
                  <ChevronRight className="mr-2 h-4 w-4" />
                  <span>{child.title}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}

/**
 * Main sidebar component that provides vertical navigation
 * @param props - Component props including optional className
 * @returns Rendered sidebar component
 */
function Sidebar({ className }: SidebarProps): JSX.Element {
  const { user, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Collapse the sidebar on smaller screens by default
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        setIsCollapsed(window.innerWidth < 1024);
      }
    };

    // Initial check
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Function to toggle sidebar collapse state
  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Filter navigation items based on user role
  const filteredNavigation = isAuthenticated
    ? getNavigationForRole(user?.role, MAIN_NAVIGATION)
    : [];

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-gray-200 bg-white transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
        className
      )}
      aria-label="Sidebar"
    >
      {/* Sidebar header with logo and toggle button */}
      <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
        <Link href="/dashboard" className="flex items-center">
          {isCollapsed ? (
            // Show only icon when collapsed
            <Image
              src={logoConfig.mobileLogo}
              alt="Revolucare"
              width={32}
              height={32}
              className="h-8 w-8"
            />
          ) : (
            // Show full logo when expanded
            <Image
              src={logoConfig.mainLogo}
              alt="Revolucare"
              width={150}
              height={36}
              className="h-9 w-auto"
            />
          )}
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="text-gray-500 hover:text-gray-900"
        >
          {isCollapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
        </Button>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {filteredNavigation.map((item, index) => 
            renderNavItem(item, index, isCollapsed, pathname)
          )}
        </ul>
      </nav>
    </aside>
  );
}

export { Sidebar, isLinkActive, getIconComponent, renderNavItem };