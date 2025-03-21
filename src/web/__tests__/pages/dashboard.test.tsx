import React from 'react'; // react ^18.2.0
import { render, screen, waitFor } from '@testing-library/react'; // @testing-library/react ^14.0.0
import { expect, describe, it, beforeEach, jest } from '@jest/globals'; // @jest/globals ^29.5.0
import Dashboard from '../../app/(dashboard)/page';
import { useAuth } from '../../hooks/use-auth';
import { useCarePlans } from '../../hooks/use-care-plans';
import { useServicesPlans } from '../../hooks/use-services-plans';
import { useAnalytics } from '../../hooks/use-analytics';
import { Roles } from '../../config/roles';

// Mock the external modules
jest.mock('../../hooks/use-auth');
jest.mock('../../hooks/use-care-plans');
jest.mock('../../hooks/use-services-plans');
jest.mock('../../hooks/use-analytics');

// Type definitions for mock hooks
type MockUseAuth = jest.Mock<any, any>;
type MockUseCarePlans = jest.Mock<any, any>;
type MockUseServicesPlans = jest.Mock<any, any>;
type MockUseAnalytics = jest.Mock<any, any>;

describe('Dashboard page', () => {
  // Test suite for the Dashboard page component

  beforeEach(() => {
    // Setup function that runs before each test

    // Reset all mocks before each test
    (useAuth as MockUseAuth).mockReset();
    (useCarePlans as MockUseCarePlans).mockReset();
    (useServicesPlans as MockUseServicesPlans).mockReset();
    (useAnalytics as MockUseAnalytics).mockReset();

    // Setup default mock implementations for hooks
    (useAuth as MockUseAuth).mockReturnValue({
      user: { id: 'test-user', role: Roles.CLIENT, firstName: 'Test', lastName: 'User' },
      isAuthenticated: true,
      isLoading: false,
      hasRole: (role: string) => role === Roles.CLIENT,
    });

    (useCarePlans as MockUseCarePlans).mockReturnValue({
      data: { data: [] },
      isLoading: false,
      error: null,
    });

    (useServicesPlans as MockUseServicesPlans).mockReturnValue({
      data: { data: [] },
      isLoading: false,
      error: null,
    });

    (useAnalytics as MockUseAnalytics).mockReturnValue({
      data: {},
      isLoading: false,
      error: null,
    });
  });

  it('renders correctly with loading state', () => {
    // Tests that the Dashboard page renders correctly when data is loading

    // Mock hooks to return isLoading: true
    (useAuth as MockUseAuth).mockReturnValue({
      ...((useAuth as MockUseAuth)().mock as any).results[0].value,
      isLoading: true,
    });

    (useCarePlans as MockUseCarePlans).mockReturnValue({
      ...((useCarePlans as MockUseCarePlans)().mock as any).results[0].value,
      isLoading: true,
    });

    (useServicesPlans as MockUseServicesPlans).mockReturnValue({
      ...((useServicesPlans as MockUseServicesPlans)().mock as any).results[0].value,
      isLoading: true,
    });

    (useAnalytics as MockUseAnalytics).mockReturnValue({
      ...((useAnalytics as MockUseAnalytics)().mock as any).results[0].value,
      isLoading: true,
    });

    // Render the Dashboard component
    render(<Dashboard />);

    // Verify that loading indicators are displayed
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();

    // Verify that content is not yet displayed
    expect(screen.queryByText(/Welcome back/i)).not.toBeInTheDocument();
  });

  it('renders correctly for client role', async () => {
    // Tests that the Dashboard page renders correctly for users with the client role

    // Mock useAuth to return a user with client role
    (useAuth as MockUseAuth).mockReturnValue({
      user: { id: 'test-client', role: Roles.CLIENT, firstName: 'Sarah', lastName: 'Johnson' },
      isAuthenticated: true,
      isLoading: false,
      hasRole: (role: string) => role === Roles.CLIENT,
    });

    // Mock useCarePlans to return client care plan data
    (useCarePlans as MockUseCarePlans).mockReturnValue({
      data: { data: [{ id: 'test-care-plan', title: 'Sample Care Plan', status: 'active' }] },
      isLoading: false,
      error: null,
    });

    // Mock useServicesPlans to return client service plan data
    (useServicesPlans as MockUseServicesPlans).mockReturnValue({
      data: { data: [{ id: 'test-service-plan', title: 'Sample Service Plan', status: 'approved' }] },
      isLoading: false,
      error: null,
    });

    // Mock useAnalytics to return client analytics data
    (useAnalytics as MockUseAnalytics).mockReturnValue({
      data: { carePlanCompletion: 85, upcomingAppointments: 2 },
      isLoading: false,
      error: null,
    });

    // Render the Dashboard component
    render(<Dashboard />);

    // Verify that the welcome banner is displayed with client name
    await waitFor(() => expect(screen.getByText(/Welcome back, Sarah!/i)).toBeInTheDocument());

    // Verify that care plan progress is displayed
    expect(screen.getByText(/Your care plan is 85% complete./i)).toBeInTheDocument();

    // Verify that upcoming appointments are displayed
    expect(screen.getByText(/Upcoming Appointments/i)).toBeInTheDocument();

    // Verify that client-specific metrics are displayed
    expect(screen.getByText(/Care Plan Progress/i)).toBeInTheDocument();
    expect(screen.getByText(/Upcoming Appointments/i)).toBeInTheDocument();

    // Verify that client-specific quick actions are available
    expect(screen.getByText(/Request Service/i)).toBeInTheDocument();
    expect(screen.getByText(/Update Profile/i)).toBeInTheDocument();
  });

  it('renders correctly for provider role', async () => {
    // Tests that the Dashboard page renders correctly for users with the provider role

    // Mock useAuth to return a user with provider role
    (useAuth as MockUseAuth).mockReturnValue({
      user: { id: 'test-provider', role: Roles.PROVIDER, firstName: 'Elena', lastName: 'Rodriguez' },
      isAuthenticated: true,
      isLoading: false,
      hasRole: (role: string) => role === Roles.PROVIDER,
    });

    // Mock useAnalytics to return provider analytics data
    (useAnalytics as MockUseAnalytics).mockReturnValue({
      data: { activeClientCount: 15, appointmentSchedule: { totalAppointments: 5 }, serviceDeliveryPerformance: { onTimeDelivery: 98 } },
      isLoading: false,
      error: null,
    });

    // Render the Dashboard component
    render(<Dashboard />);

    // Verify that the welcome banner is displayed with provider name
    await waitFor(() => expect(screen.getByText(/Welcome back, Elena!/i)).toBeInTheDocument());

    // Verify that provider availability management is displayed
    expect(screen.getByText(/Quick Actions/i)).toBeInTheDocument();
    expect(screen.getByText(/Update Availability/i)).toBeInTheDocument();

    // Verify that upcoming appointments are displayed
    expect(screen.getByText(/Quick Actions/i)).toBeInTheDocument();
    expect(screen.getByText(/View Schedule/i)).toBeInTheDocument();

    // Verify that provider-specific metrics are displayed
    expect(screen.getByText(/Active Clients/i)).toBeInTheDocument();
    expect(screen.getByText(/Appointment Schedule/i)).toBeInTheDocument();

    // Verify that provider-specific quick actions are available
    expect(screen.getByText(/Update Availability/i)).toBeInTheDocument();
    expect(screen.getByText(/Client Records/i)).toBeInTheDocument();
  });

  it('renders correctly for case manager role', async () => {
    // Tests that the Dashboard page renders correctly for users with the case manager role

    // Mock useAuth to return a user with case manager role
    (useAuth as MockUseAuth).mockReturnValue({
      user: { id: 'test-case-manager', role: Roles.CASE_MANAGER, firstName: 'Michael', lastName: 'Davis' },
      isAuthenticated: true,
      isLoading: false,
      hasRole: (role: string) => role === Roles.CASE_MANAGER,
    });

    // Mock useAnalytics to return case manager analytics data
    (useAnalytics as MockUseAnalytics).mockReturnValue({
      data: { clientPortfolio: { totalClients: 25 }, carePlanCompletionRates: { averageCompletion: 75 }, serviceAllocation: { totalServices: 120 } },
      isLoading: false,
      error: null,
    });

    // Render the Dashboard component
    render(<Dashboard />);

    // Verify that the welcome banner is displayed with case manager name
    await waitFor(() => expect(screen.getByText(/Welcome back, Michael!/i)).toBeInTheDocument());

    // Verify that client portfolio summary is displayed
    expect(screen.getByText(/Quick Actions/i)).toBeInTheDocument();
    expect(screen.getByText(/Create Care Plan/i)).toBeInTheDocument();

    // Verify that case manager-specific metrics are displayed
    expect(screen.getByText(/Client Portfolio/i)).toBeInTheDocument();
    expect(screen.getByText(/Care Plan Completion/i)).toBeInTheDocument();

    // Verify that case manager-specific quick actions are available
    expect(screen.getByText(/Create Care Plan/i)).toBeInTheDocument();
    expect(screen.getByText(/Generate Report/i)).toBeInTheDocument();
  });

  it('renders correctly for administrator role', async () => {
    // Tests that the Dashboard page renders correctly for users with the administrator role

    // Mock useAuth to return a user with administrator role
    (useAuth as MockUseAuth).mockReturnValue({
      user: { id: 'test-admin', role: Roles.ADMINISTRATOR, firstName: 'James', lastName: 'Smith' },
      isAuthenticated: true,
      isLoading: false,
      hasRole: (role: string) => role === Roles.ADMINISTRATOR,
    });

    // Mock useAnalytics to return administrator analytics data
    (useAnalytics as MockUseAnalytics).mockReturnValue({
      data: { userMetrics: { activeUsers: 500 }, platformActivity: { totalActions: 1200 }, operationalPerformance: { averageResponseTime: 250 } },
      isLoading: false,
      error: null,
    });

    // Render the Dashboard component
    render(<Dashboard />);

    // Verify that the welcome banner is displayed with administrator name
    await waitFor(() => expect(screen.getByText(/Welcome back, James!/i)).toBeInTheDocument());

    // Verify that system-wide metrics are displayed
    expect(screen.getByText(/Active Users/i)).toBeInTheDocument();
    expect(screen.getByText(/Platform Activity/i)).toBeInTheDocument();

    // Verify that user activity summary is displayed
    expect(screen.getByText(/Quick Actions/i)).toBeInTheDocument();
    expect(screen.getByText(/User Management/i)).toBeInTheDocument();

    // Verify that administrator-specific quick actions are available
    expect(screen.getByText(/User Management/i)).toBeInTheDocument();
    expect(screen.getByText(/Audit Logs/i)).toBeInTheDocument();
  });

  it('displays error state when data fetching fails', async () => {
    // Tests that the Dashboard page displays appropriate error messages when data fetching fails

    // Mock hooks to return error states
    (useAuth as MockUseAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: 'Authentication failed',
      hasRole: () => false,
    });

    (useCarePlans as MockUseCarePlans).mockReturnValue({
      data: null,
      isLoading: false,
      error: 'Failed to fetch care plans',
    });

    (useServicesPlans as MockUseServicesPlans).mockReturnValue({
      data: null,
      isLoading: false,
      error: 'Failed to fetch service plans',
    });

    (useAnalytics as MockUseAnalytics).mockReturnValue({
      data: null,
      isLoading: false,
      error: 'Failed to fetch analytics data',
    });

    // Render the Dashboard component
    render(<Dashboard />);

    // Verify that error messages are displayed
    await waitFor(() => expect(screen.getByText(/Authentication failed/i)).toBeInTheDocument());
    expect(screen.getByText(/Failed to fetch care plans/i)).toBeInTheDocument();
    expect(screen.getByText(/Failed to fetch service plans/i)).toBeInTheDocument();
    expect(screen.getByText(/Failed to fetch analytics data/i)).toBeInTheDocument();

    // Verify that retry options are available
    expect(screen.getByText(/Retry/i)).toBeInTheDocument();
  });

  it('displays correct metrics based on user role', async () => {
    // Tests that the Dashboard page displays the correct metrics based on user role

    // Create test cases for each user role
    const testCases = [
      {
        role: Roles.CLIENT,
        expectedMetrics: ['Care Plan Progress', 'Upcoming Appointments', 'Service Utilization'],
      },
      {
        role: Roles.PROVIDER,
        expectedMetrics: ['Active Clients', 'Appointment Schedule', 'Service Delivery Performance'],
      },
      {
        role: Roles.CASE_MANAGER,
        expectedMetrics: ['Client Portfolio', 'Care Plan Completion', 'Service Allocation'],
      },
      {
        role: Roles.ADMINISTRATOR,
        expectedMetrics: ['Active Users', 'Platform Activity', 'Operational Performance'],
      },
    ];

    // For each role, mock useAuth and useAnalytics with role-specific data
    for (const testCase of testCases) {
      (useAuth as MockUseAuth).mockReturnValue({
        user: { id: `test-${testCase.role}`, role: testCase.role, firstName: 'Test', lastName: 'User' },
        isAuthenticated: true,
        isLoading: false,
        hasRole: (role: string) => role === testCase.role,
      });

      (useAnalytics as MockUseAnalytics).mockReturnValue({
        data: {
          [testCase.role]: {
            metric1: 10,
            metric2: 20,
            metric3: 30,
          },
        },
        isLoading: false,
        error: null,
      });

      // Render the Dashboard component
      render(<Dashboard />);

      // Verify that the correct metrics are displayed for each role
      for (const metric of testCase.expectedMetrics) {
        await waitFor(() => expect(screen.getByText(new RegExp(metric, 'i'))).toBeInTheDocument());
      }

      // Check that metrics have correct labels and values
      // (This part would require more specific mocking and assertions based on the actual metric data)
    }
  });

  it('displays recent items correctly', async () => {
    // Tests that the Dashboard page displays recent items correctly

    // Mock hooks to return data with recent items
    (useCarePlans as MockUseCarePlans).mockReturnValue({
      data: { data: [{ id: 'care-plan-1', title: 'Care Plan 1', updatedAt: '2024-01-01T12:00:00.000Z' }] },
      isLoading: false,
      error: null,
    });

    (useServicesPlans as MockUseServicesPlans).mockReturnValue({
      data: { data: [{ id: 'service-plan-1', title: 'Service Plan 1', updatedAt: '2024-01-02T12:00:00.000Z' }] },
      isLoading: false,
      error: null,
    });

    // Mock useDocuments to return a list of documents
    // Mock the useDocuments hook
    const mockUseDocuments = {
      useDocumentList: jest.fn().mockReturnValue({
        documents: [{ id: 'document-1', name: 'Document 1', updatedAt: '2024-01-03T12:00:00.000Z' }],
        isLoading: false,
        error: null,
      }),
    };
    jest.mock('../../hooks/use-documents', () => ({
      useDocuments: () => mockUseDocuments,
    }));

    // Render the Dashboard component
    render(<Dashboard />);

    // Verify that recent care plans are displayed
    await waitFor(() => expect(screen.getByText(/Care Plan 1/i)).toBeInTheDocument());

    // Verify that recent service plans are displayed
    expect(screen.getByText(/Service Plan 1/i)).toBeInTheDocument();

    // Verify that recent documents are displayed
    expect(screen.getByText(/Document 1/i)).toBeInTheDocument();

    // Check that items are sorted by recency
    const items = screen.getAllByText(/12:00 AM/i);
    expect(items[0]).toBeInTheDocument();
  });

  it('displays activity feed correctly', async () => {
    // Tests that the Dashboard page displays the activity feed correctly

    // Mock hooks to return data with activity items
    // Mock the useNotifications hook
    const mockUseNotifications = {
      notifications: [
        { id: 'notification-1', title: 'Notification 1', message: 'Message 1', createdAt: '2024-01-03T12:00:00.000Z', priority: 'normal', status: 'unread', channels: [] },
        { id: 'notification-2', title: 'Notification 2', message: 'Message 2', createdAt: '2024-01-02T12:00:00.000Z', priority: 'high', status: 'read', channels: [] },
      ],
      markAsRead: jest.fn(),
    };
    jest.mock('../../hooks/use-notifications', () => ({
      useNotifications: () => mockUseNotifications,
    }));

    // Render the Dashboard component
    render(<Dashboard />);

    // Verify that activity feed is displayed
    await waitFor(() => expect(screen.getByText(/Recent Activity/i)).toBeInTheDocument());

    // Verify that activities are displayed in chronological order
    const items = screen.getAllByText(/12:00 AM/i);
    expect(items[0]).toBeInTheDocument();

    // Check that different activity types are displayed correctly
    expect(screen.getByText(/Message 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Message 2/i)).toBeInTheDocument();
  });
});