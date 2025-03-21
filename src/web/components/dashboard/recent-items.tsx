import React from 'react'; // react ^18.2.0
import Link from 'next/link'; // next/link ^13.4.1
import { useRouter } from 'next/navigation'; // next/navigation ^13.4.1
import { FileText, Calendar, Users, Clock } from 'lucide-react'; // lucide-react ^0.284.0

import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardFooter,
} from '../ui/card';
import { Button } from '../ui/button';
import useAuth from '../../hooks/use-auth';
import useCarePlans from '../../hooks/use-care-plans';
import useServicesPlans from '../../hooks/use-services-plans';
import useDocuments from '../../hooks/use-documents';
import { Roles } from '../../config/roles';
import { cn } from '../../lib/utils/color';
import { formatDate } from '../../lib/utils/date';

/**
 * Props interface for the RecentItems component
 */
interface RecentItemsProps {
  className?: string;
  limit?: number;
  showViewAll?: boolean;
}

/**
 * Type definition for recent items with common properties
 */
interface RecentItemType {
  id: string;
  title: string;
  type: string;
  date: Date;
  status?: string;
}

/**
 * Component that displays recent items relevant to the user's role
 */
const RecentItems: React.FC<RecentItemsProps> = ({
  className,
  limit = 5,
  showViewAll = true,
}) => {
  // Destructure className, limit, and showViewAll from props
  const { user, isAdmin, isProvider, isClient, isCaseManager } = useAuth();
  // Use the useAuth hook to get the current user and role information
  const router = useRouter();
  // Use the useRouter hook for navigation

  const { data: carePlansData } = useCarePlans({ limit });
  // Use the useCarePlans hook to fetch recent care plans
  const { data: servicesPlansData } = useServicesPlans({ limit });
  // Use the useServicesPlans hook to fetch recent service plans
  const { documents, data: documentsData } = useDocuments().useDocumentList({ limit });
  // Use the useDocumentList hook to fetch recent documents

  // Determine which items to show based on user role
  let recentItems: RecentItemType[] = [];

  if (isClient) {
    // For CLIENT role, show care plans, service plans, and documents
    recentItems = [
      ...(carePlansData?.data?.map((plan) => ({
        id: plan.id,
        title: plan.title,
        type: 'care-plan',
        date: new Date(plan.updatedAt),
        status: plan.status,
      })) || []),
      ...(servicesPlansData?.data?.map((plan) => ({
        id: plan.id,
        title: plan.title,
        type: 'service-plan',
        date: new Date(plan.updatedAt),
        status: plan.status,
      })) || []),
      ...documents.map((doc) => ({
        id: doc.id,
        title: doc.name,
        type: 'document',
        date: new Date(doc.updatedAt),
      })),
    ];
  } else if (isProvider) {
    // For PROVIDER role, show assigned care plans and service plans
    recentItems = [
      ...(carePlansData?.data?.map((plan) => ({
        id: plan.id,
        title: plan.title,
        type: 'care-plan',
        date: new Date(plan.updatedAt),
        status: plan.status,
      })) || []),
      ...(servicesPlansData?.data?.map((plan) => ({
        id: plan.id,
        title: plan.title,
        type: 'service-plan',
        date: new Date(plan.updatedAt),
        status: plan.status,
      })) || []),
    ];
  } else if (isCaseManager) {
    // For CASE_MANAGER role, show all care plans, service plans, and documents
    recentItems = [
      ...(carePlansData?.data?.map((plan) => ({
        id: plan.id,
        title: plan.title,
        type: 'care-plan',
        date: new Date(plan.updatedAt),
        status: plan.status,
      })) || []),
      ...(servicesPlansData?.data?.map((plan) => ({
        id: plan.id,
        title: plan.title,
        type: 'service-plan',
        date: new Date(plan.updatedAt),
        status: plan.status,
      })) || []),
      ...documents.map((doc) => ({
        id: doc.id,
        title: doc.name,
        type: 'document',
        date: new Date(doc.updatedAt),
      })),
    ];
  } else if (isAdmin) {
    // For ADMINISTRATOR role, show all types of items
    recentItems = [
      ...(carePlansData?.data?.map((plan) => ({
        id: plan.id,
        title: plan.title,
        type: 'care-plan',
        date: new Date(plan.updatedAt),
        status: plan.status,
      })) || []),
      ...(servicesPlansData?.data?.map((plan) => ({
        id: plan.id,
        title: plan.title,
        type: 'service-plan',
        date: new Date(plan.updatedAt),
        status: plan.status,
      })) || []),
      ...documents.map((doc) => ({
        id: doc.id,
        title: doc.name,
        type: 'document',
        date: new Date(doc.updatedAt),
      })),
    ];
  }

  // Combine and sort items by date (most recent first)
  recentItems.sort((a, b) => b.date.getTime() - a.date.getTime());

  // Limit the number of items shown based on the limit prop
  const limitedItems = recentItems.slice(0, limit);

  return (
    <Card className={cn('col-span-2', className)}>
      {/* Render a Card component with appropriate styling */}
      <CardHeader>
        {/* Render the CardHeader with the title 'Recent Items' */}
        <CardTitle>Recent Items</CardTitle>
      </CardHeader>
      <CardContent className="pl-6">
        {/* Render the CardContent with the list of recent items */}
        {limitedItems.length > 0 ? (
          <ul>
            {limitedItems.map((item) => (
              <li key={item.id} className="mb-2 last:mb-0">
                <Link href={getItemRoute(item)} className="flex items-center space-x-2 hover:underline">
                  {/* For each item, render an appropriate icon, title, and date */}
                  {getItemIcon(item.type)}
                  <span>{item.title}</span>
                  <span className="ml-auto text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(item.date, 'MMM dd, yyyy')}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState />
        )}
        {/* Handle empty state when no items are available */}
      </CardContent>
      {showViewAll && (
        <CardFooter className="justify-end">
          {/* Render a CardFooter with a 'View All' button if showViewAll is true */}
          <Button variant="link">View All</Button>
        </CardFooter>
      )}
    </Card>
  );
  // Return the complete recent items component
};

/**
 * Helper function to get the appropriate icon for an item type
 */
const getItemIcon = (itemType: string): JSX.Element => {
  // Switch on the itemType parameter
  switch (itemType) {
    case 'document':
      // Return FileText icon for 'document' type
      return <FileText className="h-4 w-4" />;
    case 'care-plan':
      // Return Calendar icon for 'care-plan' type
      return <Calendar className="h-4 w-4" />;
    case 'service-plan':
      // Return Users icon for 'service-plan' type
      return <Users className="h-4 w-4" />;
    default:
      // Return Clock icon as default for unknown types
      return <Clock className="h-4 w-4" />;
  }
};

/**
 * Helper function to generate the route for an item
 */
const getItemRoute = (item: any): string => {
  // Switch on the item.type property
  switch (item.type) {
    case 'care-plan':
      // For 'care-plan', return '/care-plans/{id}'
      return `/care-plans/${item.id}`;
    case 'service-plan':
      // For 'service-plan', return '/services-plans/{id}'
      return `/services-plans/${item.id}`;
    case 'document':
      // For 'document', return '/documents/{id}'
      return `/documents/${item.id}`;
    default:
      // Return '#' as fallback for unknown types
      return '#';
  }
};

/**
 * Component that renders when there are no recent items
 */
const EmptyState = (): JSX.Element => {
  // Render a container with centered content
  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-4 text-center">
      {/* Display an icon representing empty state */}
      <FileText className="h-10 w-10 text-gray-400 dark:text-gray-600" />
      {/* Show a message indicating no recent items are available */}
      <p className="text-sm text-gray-500 dark:text-gray-400">
        No recent items to display.
      </p>
    </div>
  );
  // Return the complete empty state component
};

export { RecentItems };
// Component for displaying recent items in the dashboard