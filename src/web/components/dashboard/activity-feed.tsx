import React from 'react'; // v18.0+
import { Bell, CheckCircle, Clock, ExternalLink } from 'lucide-react'; // v0.284.0
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { useNotifications } from '../../hooks/use-notifications';
import {
  Notification,
  NotificationPriority,
} from '../../types/notification';
import { cn } from '../../lib/utils/color';
import { formatDate } from '../../lib/utils/date';

/**
 * Props interface for the ActivityFeed component
 */
interface ActivityFeedProps {
  className?: string;
  limit?: number;
  showViewAll?: boolean;
}

/**
 * Component that displays a chronological feed of user activities and notifications
 */
export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  className,
  limit = 5,
  showViewAll = true,
}) => {
  // Use the useNotifications hook to fetch notifications and related functions
  const { notifications, markAsRead } = useNotifications();

  // Filter notifications to show only the most recent ones based on the limit prop
  const recentNotifications = notifications ? notifications.slice(0, limit) : [];

  // Component that renders a single notification item in the feed
  const NotificationItem: React.FC<{ notification: Notification; onMarkAsRead: (id: string) => void }> = ({
    notification,
    onMarkAsRead,
  }) => {
    // Determine the appropriate badge variant based on notification priority
    const badgeVariant = getPriorityBadgeVariant(notification.priority);

    // Format the notification timestamp as a relative time string
    const timeAgo = formatDate(notification.createdAt, 'MMM d, yyyy h:mm a');

    return (
      <div
        className={cn(
          'flex items-start space-x-4 py-3 border-b last:border-none',
          notification.status === 'read' ? 'opacity-50' : 'opacity-100'
        )}
      >
        {/* Icon based on notification type (replace with actual icons) */}
        {notification.type === 'appointment_reminder' ? (
          <Clock className="h-5 w-5 text-gray-500 dark:text-gray-400" />
        ) : (
          <Bell className="h-5 w-5 text-gray-500 dark:text-gray-400" />
        )}
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">{notification.title}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{timeAgo}</div>
          </div>
          <div className="text-sm text-gray-700 dark:text-gray-300">{notification.message}</div>
          <div className="mt-2 flex items-center space-x-2">
            {/* Action buttons for marking as read and viewing details */}
            <Button variant="ghost" size="sm" onClick={() => onMarkAsRead(notification.id)}>
              Mark as Read
            </Button>
            <Button variant="link" size="sm">
              View Details <ExternalLink className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
        <Badge variant={badgeVariant}>{notification.priority}</Badge>
      </div>
    );
  };

  // Component that renders when there are no notifications to display
  const EmptyState: React.FC = () => {
    return (
      <div className="text-center py-6">
        <CheckCircle className="mx-auto h-8 w-8 text-gray-400 dark:text-gray-500" />
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          No recent activity.
        </p>
      </div>
    );
  };

  // Render the activity feed component
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {recentNotifications.length > 0 ? (
          recentNotifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={markAsRead}
            />
          ))
        ) : (
          <EmptyState />
        )}
      </CardContent>
      {showViewAll && (
        <CardFooter className="justify-end">
          <Button variant="link">View All</Button>
        </CardFooter>
      )}
    </Card>
  );
};

/**
 * Helper function to determine the badge variant based on notification priority
 */
function getPriorityBadgeVariant(priority: NotificationPriority): string {
  switch (priority) {
    case 'urgent':
      return 'error';
    case 'high':
      return 'warning';
    case 'normal':
      return 'default';
    case 'low':
      return 'outline';
    default:
      return 'secondary';
  }
}

/**
 * Helper function to format a timestamp as a relative time string
 */
function getTimeAgo(timestamp: string): string {
  // Parse the timestamp string to a Date object
  const date = new Date(timestamp);

  // Calculate the time difference between now and the timestamp
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  // Format the difference as a human-readable string (e.g., '5 minutes ago', '2 hours ago')
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 60) {
    return `${minutes} minutes ago`;
  } else if (hours < 24) {
    return `${hours} hours ago`;
  } else {
    return `${days} days ago`;
  }
}