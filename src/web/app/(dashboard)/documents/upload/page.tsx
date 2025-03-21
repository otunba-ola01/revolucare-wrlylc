"use client";

import React from 'react'; // React v18.2+
import { useRouter } from 'next/navigation'; // ^14.0.0

import { PageContainer } from '../../../components/layout/page-container'; // src/web/components/layout/page-container.tsx
import { Breadcrumbs } from '../../../components/layout/breadcrumbs'; // src/web/components/layout/breadcrumbs.tsx
import { DocumentUpload } from '../../../components/documents/document-upload'; // src/web/components/documents/document-upload.tsx
import { useAuth } from '../../../hooks/use-auth'; // src/web/hooks/use-auth.ts
import { DocumentType, DocumentAnalysisType } from '../../../types/document'; // src/web/types/document.ts
import { useState, useCallback, useEffect } from 'react'; // React v18.2+

/**
 * Next.js page component for document upload functionality
 * @returns Rendered document upload page
 */
const DocumentUploadPage: React.FC = () => {
  // Get authentication context using useAuth hook
  const { isAuthenticated, isLoading, requireAuth, user } = useAuth();

  // Get router instance using useRouter hook
  const router = useRouter();

  // Initialize state for upload success
  const [uploadSuccess, setUploadSuccess] = useState(false);

  /**
   * Define handleUploadComplete function to handle successful uploads
   */
  const handleUploadComplete = useCallback(() => {
    setUploadSuccess(true);
    // Redirect to documents list after successful upload
    router.push('/documents');
  }, [router]);

  // Check user authentication and redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !requireAuth()) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router, requireAuth]);

  // If still loading, return loading state
  if (isLoading) {
    return <div>Loading...</div>;
  }

  // If not authenticated, return null (already redirected)
  if (!isAuthenticated) {
    return null;
  }

  // Render page container with appropriate layout
  return (
    <PageContainer>
      {/* Render breadcrumbs for navigation context */}
      <Breadcrumbs />

      {/* Render page title and description */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Upload Document</h1>
        <p className="text-gray-500">
          Upload medical records and other documents for analysis.
        </p>
      </div>

      {/* Render DocumentUpload component with appropriate props */}
      <DocumentUpload
        onUploadComplete={handleUploadComplete}
        showMetadataForm={true}
        autoAnalyze={true}
        defaultType={user?.role === 'client' ? DocumentType.MEDICAL_RECORD : DocumentType.OTHER}
        analysisType={DocumentAnalysisType.MEDICAL_EXTRACTION}
        className="max-w-3xl"
      />

      {/* Provide clear instructions for document upload process */}
      <div className="mt-6 text-sm text-gray-500">
        <p>
          Accepted file types: PDF, DOC, DOCX, JPEG, PNG, TIFF, XML, JSON.
        </p>
        <p>Maximum file size: 10MB.</p>
      </div>
    </PageContainer>
  );
};

export default DocumentUploadPage;