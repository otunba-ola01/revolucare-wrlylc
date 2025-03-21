import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Settings, LogOut } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '../ui/dropdown-menu';
import { useAuth } from '../../hooks/use-auth';
import { RoleLabels } from '../../config/roles';
import { cn } from '../../lib/utils/color';

/**
 * Props for the UserMenu component
 */
interface UserMenuProps {
  className?: string;
}

/**
 * Helper function to get user initials from first and last name
 */
const getUserInitials = (firstName: string | null | undefined, lastName: string | null | undefined): string => {
  const firstInitial = firstName && firstName.length > 0 ? firstName[0] : '';
  const lastInitial = lastName && lastName.length > 0 ? lastName[0] : '';
  
  if (firstInitial && lastInitial) {
    return (firstInitial + lastInitial).toUpperCase();
  } else if (firstInitial) {
    return firstInitial.toUpperCase();
  } else if (lastInitial) {
    return lastInitial.toUpperCase();
  } else {
    return 'U';
  }
};

/**
 * UserMenu component that displays the user's avatar and a dropdown menu with account-related actions
 */
const UserMenu: React.FC<UserMenuProps> = ({ className }) => {
  const { user, logout, isAuthenticated, isAdmin, isProvider, isClient, isCaseManager } = useAuth();
  const router = useRouter();

  // Handle logout action
  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // If user is not authenticated, don't render the menu
  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className={cn("h-10 w-10 rounded-full p-0", className)}>
          <Avatar>
            {user.profileImageUrl ? (
              <AvatarImage 
                src={user.profileImageUrl} 
                alt={`${user.firstName} ${user.lastName}`} 
              />
            ) : (
              <AvatarFallback>
                {getUserInitials(user.firstName, user.lastName)}
              </AvatarFallback>
            )}
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
            <p className="text-xs text-gray-500">{RoleLabels[user.role]}</p>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {/* Common options for all users */}
        <DropdownMenuItem asChild>
          <Link href="/dashboard" className="cursor-pointer w-full flex items-center">
            <User className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <Link href="/profile" className="cursor-pointer w-full flex items-center">
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <Link href="/settings" className="cursor-pointer w-full flex items-center">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        
        {/* Role-specific menu items */}
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/analytics" className="cursor-pointer w-full flex items-center">
                <span>System Analytics</span>
              </Link>
            </DropdownMenuItem>
          </>
        )}
        
        {(isCaseManager || isAdmin) && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/care-plans" className="cursor-pointer w-full flex items-center">
                <span>Care Plans</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/services-plans" className="cursor-pointer w-full flex items-center">
                <span>Service Plans</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/documents" className="cursor-pointer w-full flex items-center">
                <span>Documents</span>
              </Link>
            </DropdownMenuItem>
          </>
        )}
        
        {isProvider && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/providers/availability" className="cursor-pointer w-full flex items-center">
                <span>Manage Availability</span>
              </Link>
            </DropdownMenuItem>
          </>
        )}
        
        <DropdownMenuSeparator />
        
        {/* Logout option */}
        <DropdownMenuItem 
          className="text-red-600 focus:text-red-600 w-full flex items-center cursor-pointer" 
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export { UserMenu };