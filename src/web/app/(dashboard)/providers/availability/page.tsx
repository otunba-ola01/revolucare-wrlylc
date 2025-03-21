import React from 'react'; // react ^18.2.0
import { Metadata } from 'next'; // next ^14.0.0
import { useRouter, useSearchParams } from 'next/navigation'; // next/navigation ^14.0.0
import { CalendarDays, List } from 'lucide-react'; // lucide-react ^4.0.0
import { useState, useEffect } from 'react'; // react ^18.2.0
import { AvailabilityCalendar } from '../../../../components/providers/availability-calendar'; // internal
import { PageContainer } from '../../../../components/layout/page-container'; // internal
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../components/ui/card'; // internal
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs'; // internal
import { useAuth } from '../../../../hooks/use-auth'; // internal

/**
 * Generates metadata for the availability page
 * @returns Page metadata object
 */
export const generateMetadata = (): Metadata => {
  // Return metadata object with title and description for the availability page
  return {
    title: 'Availability',
    description: 'Manage your availability settings',
  };
};

/**
 * Main component for the provider availability management page
 */
const AvailabilityPage: React.FC = () => {
  // Get current user from useAuth hook
  const { user, requireAuth } = useAuth();

  // Get router and search params from Next.js hooks
  const router = useRouter();
  const searchParams = useSearchParams();

  // Set up state for active tab (calendar or list view)
  const [activeTab, setActiveTab] = useState<'calendar' | 'list'>(
    (searchParams.get('view') as 'calendar' | 'list') || 'calendar'
  );

  useEffect(() => {
    if (!requireAuth()) {
      router.push('/login');
    }
  }, [requireAuth, router]);

  // Check if user is a provider, redirect if not
  useEffect(() => {
    if (user && user.role !== 'provider') {
      router.push('/dashboard');
    }
  }, [user, router]);

  // Handle tab change and update URL query parameter
  const handleTabChange = (tab: 'calendar' | 'list') => {
    setActiveTab(tab);
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set('view', tab);
    router.push(`/providers/availability?${newSearchParams.toString()}`);
  };

  if (!user) {
    return null;
  }

  // Render page container with header and description
  // Render tabs component with calendar and list view options
  // Render availability calendar component with appropriate props
  // Pass provider ID from user context to availability calendar
  return (
    <PageContainer>
      <Card>
        <CardHeader>
          <CardTitle>Availability</CardTitle>
          <CardDescription>
            Manage your availability for appointments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={activeTab} onValueChange={handleTabChange}>
            <TabsList>
              <TabsTrigger value="calendar">
                <CalendarDays className="mr-2 h-4 w-4" />
                Calendar
              </TabsTrigger>
              <TabsTrigger value="list">
                <List className="mr-2 h-4 w-4" />
                List
              </TabsTrigger>
            </TabsList>
            <TabsContent value="calendar">
              <AvailabilityCalendar
                providerId={user.id}
                initialView="calendar"
              />
            </TabsContent>
            <TabsContent value="list">
              <AvailabilityCalendar
                providerId={user.id}
                initialView="list"
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </PageContainer>
  );
};

export default AvailabilityPage;