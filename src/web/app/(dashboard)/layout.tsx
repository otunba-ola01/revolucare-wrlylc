import React, { useEffect } from 'react'; // React, { useEffect } ^18.2.0
import { useRouter, usePathname } from 'next/navigation'; // { useRouter, usePathname } ^14.0.0
import { Sidebar } from '../../../components/layout/sidebar'; // { Sidebar }
import { Header } from '../../../components/layout/header'; // { Header }
import { PageContainer } from '../../../components/layout/page-container'; // { PageContainer }
import { AuthProvider } from '../../../lib/state/auth-provider'; // { AuthProvider }
import { ThemeProvider } from '../../../lib/state/theme-provider'; // { ThemeProvider }
import { NotificationProvider } from '../../../lib/state/notification-provider'; // { NotificationProvider }
import { useAuth } from '../../../hooks/use-auth'; // { useAuth }

/**
 * Interface defining the props for the DashboardLayout component.
 */
interface DashboardLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout component for dashboard pages that ensures authentication and provides consistent structure.
 * @param {object} { children } - React children to render within the layout.
 * @returns {JSX.Element} Rendered dashboard layout with children.
 */
const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  // LD1: Get router and pathname using Next.js hooks
  const router = useRouter();
  const pathname = usePathname();

  // LD1: Get authentication state and functions using useAuth hook
  const { isAuthenticated, isLoading } = useAuth();

  // LD1: Use useEffect to check authentication status on mount and path change
  useEffect(() => {
    // Check if the user is not authenticated and not loading
    if (!isAuthenticated && !isLoading) {
      // Redirect to the login page
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router, pathname]);

  // LD1: If still loading, return a loading state
  if (isLoading) {
    return <div>Loading...</div>;
  }

  // LD1: If not authenticated, return null to prevent rendering the layout
  if (!isAuthenticated) {
    return null;
  }

  // LD1: Render providers (AuthProvider, ThemeProvider, NotificationProvider) for state management
  return (
    <AuthProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <NotificationProvider>
          {/* LD1: Render a responsive layout with grid structure */}
          <div className="flex h-screen antialiased text-gray-900 bg-gray-50 dark:bg-gray-900 dark:text-gray-200">
            {/* LD1: Include Sidebar component for navigation */}
            <Sidebar />

            <div className="flex flex-col flex-1 overflow-x-hidden">
              {/* LD1: Include Header component for top navigation */}
              <Header />

              {/* LD1: Render main content area with children wrapped in PageContainer */}
              <main className="flex-1 overflow-y-auto">
                <PageContainer>
                  {children}
                </PageContainer>
              </main>
            </div>
          </div>
        </NotificationProvider>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default DashboardLayout;