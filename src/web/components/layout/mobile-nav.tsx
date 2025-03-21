import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FileText, Users, BarChart, FileImage, Settings, LogIn } from 'lucide-react';
import { useAuth } from '../../hooks/use-auth';
import { MOBILE_NAVIGATION, getNavigationForRole } from '../../config/navigation';
import { cn } from '../../lib/utils/color';
import { Button } from '../ui/button';

/**
 * Mobile navigation component that provides a simplified navigation bar
 * for small screens in the Revolucare platform. This component is fixed
 * to the bottom of the screen on mobile devices.
 */
const MobileNav: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const pathname = usePathname();
  
  // Get navigation items filtered by user role
  const navItems = React.useMemo(() => {
    return getNavigationForRole(user?.role, MOBILE_NAVIGATION);
  }, [user?.role]);

  /**
   * Determines if a navigation link is active based on the current pathname
   * @param href - The link href to check
   * @param pathname - The current pathname
   */
  const isLinkActive = (href: string, pathname: string): boolean => {
    // Exact match
    if (href === pathname) return true;
    
    // For nested routes, check if pathname starts with href (except for the root route)
    if (href !== '/' && pathname.startsWith(href)) return true;
    
    return false;
  };

  /**
   * Returns the appropriate icon component based on the navigation item icon name
   * @param iconName - The icon name from the navigation configuration
   */
  const getIconComponent = (iconName: string): React.ReactNode => {
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
      case 'chart':
      case 'analytics':
        return <BarChart className="h-5 w-5" />;
      case 'document':
      case 'documents':
        return <FileImage className="h-5 w-5" />;
      case 'settings':
        return <Settings className="h-5 w-5" />;
      case 'login':
        return <LogIn className="h-5 w-5" />;
      default:
        return null;
    }
  };

  // If user is not authenticated, show a simplified navigation with login option
  if (!isAuthenticated) {
    return (
      <nav className="fixed bottom-0 left-0 z-10 w-full bg-white border-t border-gray-200 md:hidden" aria-label="Mobile navigation">
        <div className="flex justify-center">
          <Link href="/login" passHref>
            <Button variant="ghost" className="flex flex-col items-center py-3 px-5">
              <LogIn className="h-5 w-5 mb-1" />
              <span className="text-xs">Login</span>
            </Button>
          </Link>
        </div>
      </nav>
    );
  }

  return (
    <nav className="fixed bottom-0 left-0 z-10 w-full bg-white border-t border-gray-200 md:hidden" aria-label="Mobile navigation">
      <div className="flex justify-around items-center">
        {navItems.map((item) => {
          const isActive = isLinkActive(item.href, pathname);
          return (
            <Link key={item.href} href={item.href} passHref>
              <Button 
                variant="ghost" 
                className={cn(
                  "flex flex-col items-center py-3 px-2 flex-1",
                  isActive 
                    ? "text-indigo-600 border-t-2 border-indigo-600 -mt-[2px]" 
                    : "text-gray-600"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                {getIconComponent(item.icon)}
                <span className="text-xs mt-1">{item.title}</span>
              </Button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;