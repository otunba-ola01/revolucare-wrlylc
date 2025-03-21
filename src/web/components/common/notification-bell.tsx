import React, { useState, useEffect } from 'react'; // react ^18.2.0
import { Bell } from 'lucide-react'; // lucide-react ^0.284.0
import { useRouter } from 'next/navigation'; // next/navigation ^14.0.0

import { useNotifications } from '../../hooks/use-notifications';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { formatDistanceToNow } from '../../lib/utils/date';
import { cn } from '../../lib/utils/color';

/**
 * Props for the NotificationBell component
 */
interface NotificationBellProps {
  className?: string;
}

/**
 * A component that displays a bell icon with an unread notification count badge and a dropdown menu of recent notifications
 * @param props - The props object
 * @returns Rendered notification bell component with dropdown
 */
export const NotificationBell: React.FC<NotificationBellProps> = ({ className }) => {
  // LD1: Get notifications data and functions using the useNotifications hook
  const { notifications, unreadCount, isLoading, error, markAsRead, markAllAsRead } = useNotifications();

  // LD1: Get the router for navigation using useRouter
  const router = useRouter();

  // LD1: Set up state for tracking if the dropdown is open
  const [isOpen, setIsOpen] = useState(false);

  // LD1: Create a function to handle clicking on a notification
  const handleNotificationClick = async (id: string) => {
    // IE1: Call markAsRead function from useNotifications
    await markAsRead(id);
    setIsOpen(false);
  };

  // LD1: Create a function to view all notifications
  const handleViewAll = () => {
    // IE2: Navigate to the notifications page
    router.push('/notifications');
    setIsOpen(false);
  };

  // LD1: Handle marking all notifications as read
  const handleMarkAllAsRead = async () => {
    // IE1: Call markAllAsRead function from useNotifications
    await markAllAsRead();
    setIsOpen(false);
  };

  // LD1: Render the DropdownMenu component with the bell icon as trigger
  return (
    <DropdownMenu onOpenChange={setIsOpen} open={isOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={cn(className, "relative")} aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {/* LD1: Render the unread count badge if there are unread notifications */}
          {unreadCount > 0 && (
            <Badge variant="primary" size="sm" className="absolute -top-1 -right-1 rounded-full px-1">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      {/* LD1: Render the dropdown content with recent notifications */}
      <DropdownMenuContent className="w-80 sm:w-96" align="end" forceMount>
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isLoading && <DropdownMenuItem disabled>Loading notifications...</DropdownMenuItem>}
        {error && <DropdownMenuItem disabled>Error: {error}</DropdownMenuItem>}
        {!isLoading && !error && notifications && notifications.length > 0 ? (
          notifications.slice(0, 5).map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              onClick={() => handleNotificationClick(notification.id)}
              className={cn(notification.status !== 'read' && 'font-semibold')}
            >
              <div className="flex flex-col space-y-1">
                <p className="text-sm">{notification.title}</p>
                <p className="text-xs text-gray-500">
                  {formatDistanceToNow(notification.createdAt)} ago
                </p>
              </div>
            </DropdownMenuItem>
          ))
        ) : (
          !isLoading && !error && (
            <DropdownMenuItem disabled>
              No notifications
            </DropdownMenuItem>
          )
        )}
        {/* LD1: Include options to mark all as read and view all notifications */}
        {!isLoading && !error && notifications && notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleMarkAllAsRead}>
              Mark All as Read
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleViewAll}>View All Notifications</DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};