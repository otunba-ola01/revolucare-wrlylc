import React from 'react';
import { PageContainer } from '../components/layout/page-container';
import { LoadingSpinner } from '../components/common/loading-spinner';
import { Skeleton } from '../components/ui/skeleton';
import { cn } from '../lib/utils/color';

/**
 * A loading component that displays a loading state while Next.js pages are being loaded.
 * This component is automatically used by Next.js App Router during page transitions and initial page loads
 * to provide visual feedback to users.
 */
export default function Loading() {
  return (
    <PageContainer>
      <div className="flex flex-col items-center justify-center py-8">
        <LoadingSpinner 
          size="lg" 
          color="primary" 
          text="Loading content..."
          className="mb-8"
          aria-label="Page is loading"
        />
        
        {/* Simple skeleton placeholders */}
        <div 
          className="w-full max-w-3xl mx-auto space-y-4" 
          aria-hidden="true"
        >
          {/* Header skeleton */}
          <Skeleton height={32} width="60%" className="mx-auto mb-6" />
          
          {/* Content area skeletons */}
          <Skeleton height={16} width="100%" />
          <Skeleton height={16} width="90%" />
          <Skeleton height={16} width="95%" />
          <Skeleton height={16} width="85%" />
          
          {/* Card skeletons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <Skeleton height={120} width="100%" rounded="lg" />
            <Skeleton height={120} width="100%" rounded="lg" />
          </div>
        </div>
      </div>
    </PageContainer>
  );
}