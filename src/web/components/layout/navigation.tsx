import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';

import { useAuth } from '../../hooks/use-auth';
import { MAIN_NAVIGATION, getNavigationForRole } from '../../config/navigation';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils/color';

interface NavigationProps {
  className?: string;
}

/**
 * Main navigation component that renders the horizontal navigation menu
 */
export const Navigation: React.FC<NavigationProps> = ({ className }) => {
  const { user, isAuthenticated } = useAuth();
  const pathname = usePathname();

  // Get navigation items based on user role
  const navigationItems = isAuthenticated 
    ? getNavigationForRole(user?.role, MAIN_NAVIGATION)
    : MAIN_NAVIGATION.filter(item => !item.roles); // Only public routes if not authenticated

  return (
    <nav 
      className={cn("hidden md:flex items-center space-x-4", className)} 
      aria-label="Main navigation"
    >
      {navigationItems.map((item, index) => 
        renderNavItem(item, index, pathname)
      )}
    </nav>
  );
};

/**
 * Determines if a navigation link is active based on the current pathname
 */
function isLinkActive(href: string, pathname: string): boolean {
  // Exact match
  if (href === pathname) return true;
  
  // For nested routes, check if pathname starts with href (but not just '/')
  if (href !== '/' && pathname.startsWith(href)) return true;
  
  return false;
}

/**
 * Renders a navigation item with appropriate styling and behavior
 */
function renderNavItem(item: any, index: number, pathname: string) {
  const isActive = isLinkActive(item.href, pathname);
  const hasChildren = item.children && item.children.length > 0;
  
  if (!hasChildren) {
    // Simple link, no dropdown
    return (
      <Link
        key={index}
        href={item.href}
        className={cn(
          "px-3 py-2 text-sm font-medium rounded-md transition-colors",
          isActive 
            ? "text-indigo-700 bg-indigo-50" 
            : "text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
        )}
        aria-current={isActive ? 'page' : undefined}
      >
        {item.title}
      </Link>
    );
  } else {
    // Item with dropdown
    return renderDropdown(item, isActive, pathname, index);
  }
}

/**
 * Renders a dropdown menu for navigation items with children
 */
function renderDropdown(item: any, isActive: boolean, pathname: string, key: number) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);
  
  // Handle ESC key to close dropdown
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen]);
  
  const toggleDropdown = () => setIsOpen(!isOpen);
  
  return (
    <div className="relative" ref={dropdownRef} key={key}>
      <Button
        variant="ghost"
        className={cn(
          "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors gap-1",
          isActive
            ? "text-indigo-700 bg-indigo-50"
            : "text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
        )}
        onClick={toggleDropdown}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleDropdown();
          }
        }}
        aria-expanded={isOpen}
        aria-haspopup="true"
        id={`nav-dropdown-${key}`}
      >
        {item.title}
        <ChevronDown 
          className={cn("h-4 w-4 transition-transform", isOpen && "transform rotate-180")}
          aria-hidden="true"
        />
      </Button>
      
      {isOpen && (
        <div
          className="absolute left-0 mt-1 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby={`nav-dropdown-${key}`}
        >
          <div className="py-1" role="none">
            {item.children.map((child: any, childIndex: number) => {
              const isChildActive = isLinkActive(child.href, pathname);
              
              return (
                <Link
                  key={childIndex}
                  href={child.href}
                  className={cn(
                    "block px-4 py-2 text-sm transition-colors",
                    isChildActive
                      ? "text-indigo-700 bg-indigo-50"
                      : "text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                  )}
                  role="menuitem"
                  onClick={() => setIsOpen(false)}
                  aria-current={isChildActive ? 'page' : undefined}
                >
                  {child.title}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default Navigation;