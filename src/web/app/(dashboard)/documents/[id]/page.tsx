import React, { useState, useEffect } from 'react'; // react ^18.2.0
import { useRouter, useParams } from 'next/navigation'; // next/navigation ^14.0.0
import { Metadata } from 'next'; // next ^14.0.0
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@radix-ui/react-alert-dialog'; // @radix-ui/react-alert-dialog ^1.0.4
import { ChevronLeft, Trash2, Download, FileSearch } from 'lucide-react'; // lucide-react ^1.0.0
import {
  DocumentViewer, // src/web/components/documents/document-viewer.tsx
  Button, // src/web/components/ui/button.tsx
} from '@/web/components';
import {
  useDocument,
  useDocumentDelete,
  useDocumentAnalysis,
  useDocumentDownload,
} from '@/web/hooks/use-documents'; // src/web/hooks/use-documents.ts
import { useToast } from '@/web/hooks/use-toast'; // src/web/hooks/use-toast.ts
import { useAuth } from '@/web/hooks/use-auth'; // src/web/hooks/use-auth.ts
import { DocumentAnalysisType } from '@/web/types/document'; // src/web/types/document.ts

/**
 * Generates metadata for the document view page
 * @param { params } - object containing route parameters
 * @returns {Promise<Metadata>} Page metadata object
 */
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  // Extract documentId from params
  const documentId = params.id;

  // Return metadata object with dynamic title and description
  return {
    title: `Document View - ${documentId}`,
    description: `View details for document with ID ${documentId}`,
  };
}

/**
 * Main component for the document view page
 * @returns {JSX.Element} Rendered document view page
 */
const DocumentViewPage: React.FC = () => {
  // Get route parameters using useParams hook to extract documentId
  const { id: documentId } = useParams<{ id: string }>();

  // Initialize router for navigation
  const router = useRouter();

  // Get current user information using useAuth hook
  const auth = useAuth();

  // Initialize toast notification function using useToast hook
  const { toast } = useToast();

  // Fetch document data using useDocument hook with documentId
  const { data: document, isLoading, error } = useDocument(documentId);

  // Initialize document delete mutation using useDocumentDelete hook
  const { mutate: deleteDocumentMutation, isLoading: isDeleting } = useDocumentDelete({
    onSuccess: () => {
      // Show success toast on completion
      toast({
        title: 'Document deleted',
        description: 'Document has been successfully deleted.',
      });

      // Navigate back to documents list
      router.push('/dashboard/documents');
    },
    onError: (error: Error) => {
      // Handle errors with error toast
      toast({
        title: 'Error deleting document',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Initialize document analysis mutation using useDocumentAnalysis hook
  const { mutate: analyzeDocumentMutation, isLoading: isAnalyzing } = useDocumentAnalysis({
    onSuccess: () => {
      // Show success toast on completion
      toast({
        title: 'Document analysis started',
        description: 'Document analysis has been initiated.',
      });
    },
    onError: (error: Error) => {
      // Handle errors with error toast
      toast({
        title: 'Error analyzing document',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Initialize document download functionality using useDocumentDownload hook
  const { getDirectDownloadUrl, getSignedUrl, isGeneratingUrl, error: downloadError } = useDocumentDownload(documentId);

  /**
   * Handles click on the back button
   * @returns {void} No return value
   */
  const handleBackClick = () => {
    // Navigate back to the documents list page
    router.back();
  };

  /**
   * Handles document download action
   * @returns {void} No return value
   */
  const handleDownload = async () => {
    // Get download URL for the document
    const downloadUrl = getDirectDownloadUrl();

    if (!downloadUrl) {
      toast({
        title: 'Error downloading document',
        description: 'Could not generate download URL.',
        variant: 'destructive',
      });
      return;
    }

    // Trigger browser download using the URL
    window.location.href = downloadUrl;

    // Show success toast notification
    toast({
      title: 'Downloading document',
      description: 'Your download will begin shortly.',
    });
  };

  /**
   * Handles document deletion action with confirmation dialog
   * @returns {Promise<void>} Promise resolving when deletion is complete
   */
  const handleDelete = async () => {
    // Call delete mutation with document ID
    await deleteDocumentMutation(documentId);
  };

  /**
   * Handles document analysis action
   * @returns {Promise<void>} Promise resolving when analysis is initiated
   */
  const handleAnalyze = async () => {
    if (!document) return;

    // Determine appropriate analysis type based on document type
    const analysisType = DocumentAnalysisType.MEDICAL_EXTRACTION; // Default analysis type

    // Call analysis mutation with document ID and analysis type
    await analyzeDocumentMutation({ documentId: document.id, analysisType });
  };

  // Handle loading state while document is being fetched
  if (isLoading) {
    return <div>Loading document...</div>;
  }

  // Handle error state if document fetch fails
  if (error) {
    return <div>Error: {error.message}</div>;
  }

  // Handle case where document is not found
  if (!document) {
    return <div>Document not found</div>;
  }

  return (
    <div>
      <DocumentViewer
        documentId={documentId}
        onBack={handleBackClick}
        onDownload={handleDownload}
        onDelete={handleDelete}
        onAnalyze={handleAnalyze}
      />

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" size="sm">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your document from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DocumentViewPage;