'use client';

import React, { useState, useEffect, useCallback } from 'react'; // react ^18.2.0
import {
  Bell,
  CheckCircle,
  AlertCircle,
  Clock,
  Trash2,
  Filter,
  Search,
  X,
} from 'lucide-react'; // lucide-react ^0.284.0

import { PageContainer } from '../../../components/layout/page-container';
import { useNotifications } from '../../../hooks/use-notifications';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '../../../components/ui/tabs';
import { LoadingSpinner } from '../../../components/common/loading-spinner';
import EmptyState from '../../../components/common/empty-state';
import Pagination from '../../../components/common/pagination';
import { formatDistanceToNow } from '../../../lib/utils/date';
import { cn } from '../../../lib/utils/color';
import {
  NotificationCategory,
  NotificationPriority,
  NotificationStatus,
} from '../../../types/notification';

/**
 * Page component for displaying and managing user notifications
 * @returns Rendered notifications page
 */
const NotificationsPage: React.FC = () => {
  // LD1: Initialize state for current page, page size, active tab, and search term
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [activeTab, setActiveTab] = useState<NotificationCategory>('system');
  const [searchTerm, setSearchTerm] = useState('');

  // LD2: Get notifications data and functions using the useNotifications hook
  const {
    notifications,
    unreadCount,
    stats,
    preferences,
    isLoading,
    error,
    filters,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updatePreferences,
    setFilters,
  } = useNotifications();

  // IE1: Set up effect to fetch notifications when page, page size, or active tab changes
  useEffect(() => {
    fetchNotifications({
      page: currentPage,
      limit: pageSize,
      category: activeTab,
      search: searchTerm,
    });
  }, [currentPage, pageSize, activeTab, searchTerm, fetchNotifications]);

  // LD2: Create handler functions for pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // LD2: Create handler function for tab changes
  const handleTabChange = (tab: NotificationCategory) => {
    setActiveTab(tab);
    setCurrentPage(1); // Reset to first page when changing tabs
  };

  // LD2: Create handler function for marking notifications as read
  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id);
      //IE1: Re-fetch notifications to update the list
      await fetchNotifications({
        page: currentPage,
        limit: pageSize,
        category: activeTab,
        search: searchTerm,
      });
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // LD2: Create handler function for deleting notifications
  const handleDeleteNotification = async (id: string) => {
    try {
      await deleteNotification(id);
      //IE1: Re-fetch notifications to update the list
      await fetchNotifications({
        page: currentPage,
        limit: pageSize,
        category: activeTab,
        search: searchTerm,
      });
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  // LD2: Create handler function for marking all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      //IE1: Re-fetch notifications to update the list
      await fetchNotifications({
        page: currentPage,
        limit: pageSize,
        category: activeTab,
        search: searchTerm,
      });
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  // LD2: Create handler function for searching notifications
  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1); // Reset to first page when searching
  };

  // S1: Render page title and description
  return (
    <PageContainer>
      <div className="md:flex md:items-center md:justify-between space-y-2 md:space-y-0">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Notifications
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Manage your in-app notifications
          </p>
        </div>
      </div>

      {/* LD2: Render notification statistics summary */}
      {stats && (
        <NotificationStats stats={stats} onMarkAllAsRead={handleMarkAllAsRead} />
      )}

      {/* LD2: Render tabs for filtering notifications by category */}
      <Tabs defaultValue="system" className="mt-4" value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="appointment">Appointment</TabsTrigger>
          <TabsTrigger value="care_plan">Care Plan</TabsTrigger>
          <TabsTrigger value="service_plan">Service Plan</TabsTrigger>
          <TabsTrigger value="message">Message</TabsTrigger>
        </TabsList>
        <TabsContent value="system">
          {/* LD2: Render search and filter controls */}
          <NotificationFilters searchTerm={searchTerm} onSearchChange={handleSearchChange} onFilterChange={setFilters} activeFilters={filters} />

          {/* LD2: Render loading state when fetching notifications */}
          {isLoading ? (
            <div className="flex justify-center py-6">
              <LoadingSpinner text="Loading notifications..." />
            </div>
          ) : notifications && notifications.length > 0 ? (
            <div>
              {/* LD2: Render notification list with cards for each notification */}
              {notifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onDelete={handleDeleteNotification}
                />
              ))}

              {/* LD2: Render pagination controls for navigating through notifications */}
              <Pagination
                pagination={{
                  page: currentPage,
                  limit: pageSize,
                  totalItems: stats?.total || 0,
                  totalPages: Math.ceil((stats?.total || 0) / pageSize),
                  hasNextPage: currentPage < Math.ceil((stats?.total || 0) / pageSize),
                  hasPreviousPage: currentPage > 1,
                }}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                pageSizeOptions={[10, 20, 50]}
              />
            </div>
          ) : (
            // LD2: Render empty state when no notifications exist
            <EmptyState title="No System Notifications" description="You don't have any system notifications." />
          )}
        </TabsContent>
        <TabsContent value="appointment">
          <EmptyState title="No Appointment Notifications" description="You don't have any appointment notifications." />
        </TabsContent>
        <TabsContent value="care_plan">
          <EmptyState title="No Care Plan Notifications" description="You don't have any care plan notifications." />
        </TabsContent>
        <TabsContent value="service_plan">
          <EmptyState title="No Service Plan Notifications" description="You don't have any service plan notifications." />
        </TabsContent>
        <TabsContent value="message">
          <EmptyState title="No Message Notifications" description="You don't have any message notifications." />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
};

/**
 * Component for displaying a single notification with actions
 * @param object { notification, onMarkAsRead, onDelete }
 * @returns Rendered notification card
 */
const NotificationCard: React.FC<{
  notification: any;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}> = ({ notification, onMarkAsRead, onDelete }) => {
  // LD2: Destructure notification properties (id, title, message, priority, status, createdAt, etc.)
  const { id, title, message, priority, status, createdAt } = notification;

  // LD2: Format the notification timestamp using formatDistanceToNow
  const formattedTimestamp = formatDistanceToNow(new Date(createdAt), {
    addSuffix: true,
  });

  // LD2: Determine appropriate styling based on notification priority and status
  const priorityColor =
    priority === 'urgent'
      ? 'text-red-500'
      : priority === 'high'
      ? 'text-orange-500'
      : priority === 'normal'
      ? 'text-gray-500 dark:text-gray-400'
      : 'text-blue-500';

  const isRead = status === 'read';

  // S1: Render a Card component with appropriate styling
  return (
    <Card className={cn('mb-4', isRead ? 'opacity-50' : 'bg-white dark:bg-gray-900')}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        {/* LD2: Display notification title, message, and metadata in the card */}
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        <div className="flex items-center space-x-2">
          {/* LD2: Render action buttons for marking as read and deleting */}
          {!isRead && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onMarkAsRead(id)}
              aria-label="Mark as read"
            >
              <CheckCircle className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(id)}
            aria-label="Delete notification"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription>
          {message}
          <div className="flex items-center space-x-2 text-xs mt-2">
            {/* LD2: Apply different styling for read vs. unread notifications */}
            <span className={priorityColor}>
              {priority === 'urgent' && <AlertCircle className="h-3 w-3 inline-block mr-1" />}
              {priority === 'high' && <Bell className="h-3 w-3 inline-block mr-1" />}
              {priority !== 'normal' && priority !== 'low' && priority}
            </span>
            <Clock className="h-3 w-3 inline-block" />
            <span className="text-gray-400">{formattedTimestamp}</span>
          </div>
        </CardDescription>
      </CardContent>
    </Card>
  );
};

/**
 * Component for filtering and searching notifications
 * @param object { searchTerm, onSearchChange, onFilterChange, activeFilters }
 * @returns Rendered filters component
 */
const NotificationFilters: React.FC<{
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onFilterChange: (filters: any) => void;
  activeFilters: any;
}> = ({ searchTerm, onSearchChange, onFilterChange, activeFilters }) => {
  // LD2: Render search input with search icon
  return (
    <div className="flex items-center space-x-4">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
        <input
          type="search"
          placeholder="Search notifications..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-8 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onSearchChange('')}
            className="absolute right-2 top-2 h-6 w-6"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {/* LD2: Render filter dropdowns for status, priority, and date range */}
      {/* TODO: Implement filter dropdowns */}
    </div>
  );
};

/**
 * Component for displaying notification statistics
 * @param object { stats, onMarkAllAsRead }
 * @returns Rendered stats component
 */
const NotificationStats: React.FC<{
  stats: any;
  onMarkAllAsRead: () => void;
}> = ({ stats, onMarkAllAsRead }) => {
  // LD2: Display total notification count
  return (
    <div className="flex items-center justify-between mt-4">
      <div>
        Total Notifications: {stats.total} | Unread: {stats.unread}
      </div>
      {/* LD2: Render 'Mark All as Read' button if there are unread notifications */}
      {stats.unread > 0 && (
        <Button variant="secondary" size="sm" onClick={onMarkAllAsRead}>
          Mark All as Read
        </Button>
      )}
    </div>
  );
};

// IE3: Export the NotificationsPage component as the default export
export default NotificationsPage;