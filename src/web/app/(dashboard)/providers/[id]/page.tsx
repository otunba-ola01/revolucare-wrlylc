import React from 'react'; // React library for building UI components. Version: ^18.2.0
import { Metadata } from 'next'; // Next.js metadata type for SEO. Version: ^14.0.0
import { notFound } from 'next/navigation'; // Next.js function to show 404 page. Version: ^14.0.0

import { Breadcrumbs } from '../../../../components/layout/breadcrumbs'; // Navigation breadcrumbs. Path: src/web/components/layout/breadcrumbs.tsx
import { ProviderProfile } from '../../../../components/providers/provider-profile'; // Main component for displaying provider details. Path: src/web/components/providers/provider-profile.tsx
import { LoadingSpinner } from '../../../../components/common/loading-spinner'; // Loading indicator. Path: src/web/components/common/loading-spinner.tsx
import { EmptyState } from '../../../../components/common/empty-state'; // Display when provider not found. Path: src/web/components/common/empty-state.tsx
import { useProvider } from '../../../../hooks/use-providers'; // Hook for fetching provider data. Path: src/web/hooks/use-providers.ts
import { useAuth } from '../../../../hooks/use-auth'; // Hook for accessing authentication state. Path: src/web/hooks/use-auth.ts

/**
 * Generates metadata for the provider detail page including title and description
 * @param   { params }
 * @returns {Promise<Metadata>} Page metadata including title and description
 */
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  // Extract provider ID from params
  const providerId = params.id;

  // Fetch basic provider data using the ID
  // Note: In a real application, you might want to fetch only the necessary data for metadata
  // to optimize performance.
  // const { provider } = await getProviderMetadata(providerId);

  // If provider is found, create a title with provider name
  const title = `Provider Details - Revolucare`;

  // Create description with provider organization and services
  const description = `View details for provider ${providerId} on Revolucare.`;

  // Return metadata object with title, description, and other SEO properties
  return {
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: description,
    },
  };
}

/**
 * Main page component for displaying provider details
 * @param   { params }
 * @returns {JSX.Element} Rendered provider detail page
 */
const ProviderDetailPage: React.FC<{ params: { id: string } }> = ({ params }) => {
  // Extract provider ID from params
  const providerId = params.id;

  // Get authentication state and user role using useAuth hook
  const { isLoading: authLoading } = useAuth();

  // Fetch provider data using useProvider hook with the ID
  const { provider, isLoading, error } = useProvider(providerId);

  // Handle loading state with LoadingSpinner component
  if (isLoading || authLoading) {
    return (
      <div>
        <LoadingSpinner text="Loading provider details..." />
      </div>
    );
  }

  // Handle error state with EmptyState component
  if (error) {
    return (
      <div>
        <EmptyState
          title="Error Loading Provider"
          description="Failed to load provider details. Please try again later."
        />
      </div>
    );
  }

  // If provider not found, call notFound() to show 404 page
  if (!provider) {
    notFound();
  }

  // Render page layout with Breadcrumbs for navigation
  return (
    <div>
      <Breadcrumbs />

      {/* Render page title with provider name */}
      <h1 className="text-2xl font-bold mb-4">{provider.organizationName}</h1>

      {/* Render ProviderProfile component with provider data */}
      <ProviderProfile providerId={providerId} />
    </div>
  );
};

export default ProviderDetailPage;