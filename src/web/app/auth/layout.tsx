import React from 'react'; // React v18.2.0
import Image from 'next/image'; // next/image ^14.0.0
import Link from 'next/link'; // next/link ^14.0.0

import { PageContainer } from '../../components/layout/page-container';
import { Header } from '../../components/layout/header';
import { Footer } from '../../components/layout/footer';
import { siteConfig } from '../../config/site';

/**
 * Metadata configuration for authentication pages
 * Provides SEO metadata for authentication pages
 */
export const metadata = {
  description: 'Authentication | Revolucare',
  title: 'Authentication | Revolucare',
};

/**
 * Layout component for authentication-related pages
 * Provides a dedicated layout for authentication-related pages with appropriate UI elements
 */
interface AuthLayoutProps {
  children: React.ReactNode;
}

/**
 * AuthLayout component that provides a simplified, focused UI without the full application navigation.
 * It ensures a clean, distraction-free environment for authentication flows while maintaining the application's design system.
 */
const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Render a simplified header with only the logo and no navigation */}
      <Header />

      {/* Render a main content area with the PageContainer component */}
      <main className="flex-grow flex items-center justify-center">
        {/* Apply authentication-specific styling with centered content and appropriate spacing */}
        <PageContainer className="flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 max-w-md">
          {/* Render the children (authentication forms) within the container */}
          {children}
        </PageContainer>
      </main>

      {/* Render a simplified footer with legal links and copyright information */}
      <Footer className="mt-auto" />
    </div>
  );
};

export default AuthLayout;