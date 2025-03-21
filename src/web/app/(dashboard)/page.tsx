import React from 'react'; // react ^18.2.0
import { Metadata } from 'next'; // next ^14.0.0
import {
  WelcomeBanner,
  QuickActions,
  RecentItems,
  ActivityFeed,
  MetricsCard,
  StatCard,
} from '../../components/dashboard';
import { useAuth } from '../../hooks/use-auth';
import { useCarePlans } from '../../hooks/use-care-plans';
import { useServicesPlans } from '../../hooks/use-services-plans';
import { useAnalytics } from '../../hooks/use-analytics';
import { Roles } from '../../config/roles';
import { cn } from '../../lib/utils/color';

/**
 * Metadata for the dashboard page
 * @returns Page metadata object
 */
export const metadata: Metadata = {
  title: 'Dashboard | Revolucare',
  description: 'Revolucare dashboard for managing care services',
};

/**
 * Helper function to get client-specific metrics
 * @param analyticsData 
 * @returns Array of client-specific metrics
 */
const getClientMetrics = (analyticsData: any): any[] => {
  // Extract care plan completion percentage
  const carePlanCompletion = analyticsData?.carePlanCompletion || 0;

  // Extract upcoming appointment count
  const upcomingAppointments = analyticsData?.upcomingAppointments || 0;

  // Extract service utilization metrics
  const serviceUtilization = analyticsData?.serviceUtilization || {};

  // Format metrics with appropriate labels and units
  const metrics = [
    {
      name: 'Care Plan Progress',
      value: carePlanCompletion,
      unit: '%',
      description: 'Your progress towards completing your care plan',
      trend: 'up',
      changePercentage: 10,
    },
    {
      name: 'Upcoming Appointments',
      value: upcomingAppointments,
      unit: 'appointments',
      description: 'Number of appointments scheduled for the next week',
      trend: 'stable',
      changePercentage: 0,
    },
    {
      name: 'Service Utilization',
      value: serviceUtilization.totalServices || 0,
      unit: 'services',
      description: 'Total number of services utilized this month',
      trend: 'up',
      changePercentage: 5,
    },
  ];

  return metrics;
};

/**
 * Helper function to get provider-specific metrics
 * @param analyticsData 
 * @returns Array of provider-specific metrics
 */
const getProviderMetrics = (analyticsData: any): any[] => {
  // Extract active client count
  const activeClientCount = analyticsData?.activeClientCount || 0;

  // Extract appointment schedule metrics
  const appointmentSchedule = analyticsData?.appointmentSchedule || {};

  // Extract service delivery performance metrics
  const serviceDeliveryPerformance = analyticsData?.serviceDeliveryPerformance || {};

  // Format metrics with appropriate labels and units
  const metrics = [
    {
      name: 'Active Clients',
      value: activeClientCount,
      unit: 'clients',
      description: 'Number of clients currently assigned to you',
      trend: 'up',
      changePercentage: 8,
    },
    {
      name: 'Appointment Schedule',
      value: appointmentSchedule.totalAppointments || 0,
      unit: 'appointments',
      description: 'Number of appointments scheduled for the next week',
      trend: 'stable',
      changePercentage: 0,
    },
    {
      name: 'Service Delivery Performance',
      value: serviceDeliveryPerformance.onTimeDelivery || 0,
      unit: '%',
      description: 'Percentage of services delivered on time',
      trend: 'up',
      changePercentage: 3,
    },
  ];

  return metrics;
};

/**
 * Helper function to get case manager-specific metrics
 * @param analyticsData 
 * @returns Array of case manager-specific metrics
 */
const getCaseManagerMetrics = (analyticsData: any): any[] => {
  // Extract client portfolio metrics
  const clientPortfolio = analyticsData?.clientPortfolio || {};

  // Extract care plan completion rates
  const carePlanCompletionRates = analyticsData?.carePlanCompletionRates || {};

  // Extract service allocation metrics
  const serviceAllocation = analyticsData?.serviceAllocation || {};

  // Format metrics with appropriate labels and units
  const metrics = [
    {
      name: 'Client Portfolio',
      value: clientPortfolio.totalClients || 0,
      unit: 'clients',
      description: 'Number of clients in your portfolio',
      trend: 'up',
      changePercentage: 5,
    },
    {
      name: 'Care Plan Completion',
      value: carePlanCompletionRates.averageCompletion || 0,
      unit: '%',
      description: 'Average completion rate of care plans in your portfolio',
      trend: 'up',
      changePercentage: 2,
    },
    {
      name: 'Service Allocation',
      value: serviceAllocation.totalServices || 0,
      unit: 'services',
      description: 'Total number of services allocated to your clients',
      trend: 'stable',
      changePercentage: 0,
    },
  ];

  return metrics;
};

/**
 * Helper function to get administrator-specific metrics
 * @param analyticsData 
 * @returns Array of administrator-specific metrics
 */
const getAdminMetrics = (analyticsData: any): any[] => {
  // Extract system-wide user metrics
  const userMetrics = analyticsData?.userMetrics || {};

  // Extract platform activity metrics
  const platformActivity = analyticsData?.platformActivity || {};

  // Extract operational performance metrics
  const operationalPerformance = analyticsData?.operationalPerformance || {};

  // Format metrics with appropriate labels and units
  const metrics = [
    {
      name: 'Active Users',
      value: userMetrics.activeUsers || 0,
      unit: 'users',
      description: 'Number of active users on the platform',
      trend: 'up',
      changePercentage: 12,
    },
    {
      name: 'Platform Activity',
      value: platformActivity.totalActions || 0,
      unit: 'actions',
      description: 'Total number of actions performed on the platform',
      trend: 'up',
      changePercentage: 7,
    },
    {
      name: 'Operational Performance',
      value: operationalPerformance.averageResponseTime || 0,
      unit: 'ms',
      description: 'Average response time of API requests',
      trend: 'down',
      changePercentage: -5,
    },
  ];

  return metrics;
};

/**
 * The main dashboard page component that displays personalized content based on user role
 * @returns Rendered dashboard page
 */
const Dashboard: React.FC = () => {
  // Use the useAuth hook to get the current user information and role
  const { user, hasRole } = useAuth();

  // Use the useCarePlans hook to fetch care plan metrics
  const { data: carePlansData } = useCarePlans({
    clientId: user?.id,
  });

  // Use the useServicesPlans hook to fetch service plan metrics
  const { data: servicesPlansData } = useServicesPlans({
    clientId: user?.id,
  });

  // Use the useAnalytics hook to fetch role-specific analytics data
  const { data: analyticsData } = useAnalytics({
    userId: user?.id,
    role: user?.role,
  });

  // Determine which metrics to display based on user role
  let metrics: any[] = [];

  if (hasRole(Roles.CLIENT)) {
    // For CLIENT role, show care plan progress, upcoming appointments, and service utilization
    metrics = getClientMetrics(analyticsData);
  } else if (hasRole(Roles.PROVIDER)) {
    // For PROVIDER role, show client count, appointment schedule, and service delivery metrics
    metrics = getProviderMetrics(analyticsData);
  } else if (hasRole(Roles.CASE_MANAGER)) {
    // For CASE_MANAGER role, show client portfolio metrics, care plan completion rates, and service allocation
    metrics = getCaseManagerMetrics(analyticsData);
  } else if (hasRole(Roles.ADMINISTRATOR)) {
    // For ADMINISTRATOR role, show system-wide metrics, user activity, and operational statistics
    metrics = getAdminMetrics(analyticsData);
  }

  // Render the WelcomeBanner component with personalized greeting
  return (
    <main className="container relative pb-20">
      {/* Render a responsive grid layout for dashboard components */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8">
        {/* Include WelcomeBanner component with personalized greeting */}
        <WelcomeBanner />

        {/* Include QuickActions component with role-specific actions */}
        <QuickActions className="col-span-4 md:col-span-4 lg:col-span-2" />

        {/* Include RecentItems component to show recently accessed items */}
        <RecentItems className="col-span-4 md:col-span-4 lg:col-span-2" />

        {/* Include ActivityFeed component to show recent notifications */}
        <ActivityFeed className="col-span-4 md:col-span-4 lg:col-span-2" />

        {/* Render role-specific metrics using MetricsCard and StatCard components */}
        {metrics.map((metric) => (
          <MetricsCard
            key={metric.name}
            metric={metric}
            className="col-span-4 md:col-span-4 lg:col-span-2"
          />
        ))}
      </div>
    </main>
  );
  // Return the complete dashboard page with all components
};

export default Dashboard;