import { 
  useQuery, 
  useMutation, 
  useQueryClient, 
  UseQueryOptions, 
  UseMutationOptions 
} from '@tanstack/react-query'; // @tanstack/react-query: ^4.29.5
import { useState, useCallback, useEffect } from 'react'; // react: ^18.2.0
import { 
  uploadDocument,
  getDocument,
  listDocuments,
  deleteDocument,
  analyzeDocument,
  getDocumentAnalysis,
  updateDocumentMetadata,
  getSignedUrl,
  getDownloadUrl
} from '../lib/api/documents';
import { 
  Document, 
  DocumentUploadRequest, 
  DocumentAnalysisRequest, 
  DocumentFilterOptions,
  DocumentListResponse,
  DocumentAnalysis,
  DocumentType,
  DocumentStatus
} from '../types/document';
import { useToast } from './use-toast';
import useAuth from './use-auth';
import { usePagination } from './use-pagination';

/**
 * Main hook that provides document management functionality for Revolucare
 * @returns Document management methods and state
 */
export function useDocuments() {
  const queryClient = useQueryClient();
  const auth = useAuth();
  const { toast } = useToast();

  return {
    // Document management hooks
    useDocumentList,
    useDocument,
    useDocumentUpload,
    useDocumentDelete,
    useDocumentAnalysis,
    useDocumentAnalysisResult,
    useDocumentMetadataUpdate,
    useDocumentDownload,
    // Current user context
    currentUserId: auth.user?.id
  };
}

/**
 * Hook for fetching and paginating document lists
 * @param filterOptions - Options for filtering and pagination
 * @param queryOptions - React Query options
 * @returns Document list query result with pagination controls
 */
export function useDocumentList(
  filterOptions: DocumentFilterOptions = {},
  queryOptions?: UseQueryOptions<DocumentListResponse>
) {
  const pagination = usePagination({
    initialPage: filterOptions.page || 1,
    initialLimit: filterOptions.limit || 10,
    totalItems: 0
  });

  // Combine pagination parameters with filter options
  const combinedOptions: DocumentFilterOptions = {
    ...filterOptions,
    page: pagination.page,
    limit: pagination.limit
  };

  const query = useQuery<DocumentListResponse>(
    ['documents', combinedOptions],
    () => listDocuments(combinedOptions),
    {
      keepPreviousData: true,
      ...queryOptions,
      onSuccess: (data) => {
        // Update pagination with the total count from the response
        if (data.pagination) {
          pagination.paginationInfo.totalItems = data.pagination.totalItems;
        }
        
        if (queryOptions?.onSuccess) {
          queryOptions.onSuccess(data);
        }
      }
    }
  );

  return {
    ...query,
    documents: query.data?.data || [],
    pagination: pagination,
    paginationInfo: query.data?.pagination
  };
}

/**
 * Hook for fetching a single document by ID
 * @param documentId - ID of the document to fetch
 * @param queryOptions - React Query options
 * @returns Document query result
 */
export function useDocument(
  documentId: string,
  queryOptions?: UseQueryOptions<Document>
) {
  return useQuery<Document>(
    ['document', documentId],
    () => getDocument(documentId),
    {
      enabled: !!documentId,
      ...queryOptions
    }
  );
}

/**
 * Hook for uploading documents
 * @param mutationOptions - React Query mutation options
 * @returns Document upload mutation result and helper functions
 */
export function useDocumentUpload(
  mutationOptions?: UseMutationOptions<Document, Error, DocumentUploadRequest>
) {
  const { toast } = useToast();
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState(0);

  const mutation = useMutation<Document, Error, DocumentUploadRequest>(
    (request) => {
      // Reset progress when starting a new upload
      setUploadProgress(0);
      
      // Set the ownerId to the current user if not provided
      const uploadRequest = {
        ...request,
        ownerId: request.ownerId || auth.user?.id || ''
      };
      
      // In a real implementation, we would track upload progress with XHR or fetch
      // Here we're simulating it with a timeout
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 5;
        });
      }, 200);
      
      return uploadDocument(uploadRequest)
        .then(result => {
          clearInterval(progressInterval);
          setUploadProgress(100);
          return result;
        })
        .catch(error => {
          clearInterval(progressInterval);
          setUploadProgress(0);
          throw error;
        });
    },
    {
      onSuccess: (data) => {
        toast({
          title: "Document uploaded successfully",
          description: `${data.name} has been uploaded`,
          variant: "success",
          duration: 5000
        });
        
        // Invalidate document list queries to refresh data
        queryClient.invalidateQueries(['documents']);
        
        if (mutationOptions?.onSuccess) {
          mutationOptions.onSuccess(data);
        }
      },
      onError: (error, variables) => {
        toast({
          title: "Failed to upload document",
          description: error.message || "An error occurred during upload",
          variant: "error",
          duration: 5000
        });
        
        if (mutationOptions?.onError) {
          mutationOptions.onError(error, variables);
        }
      },
      ...mutationOptions
    }
  );

  return {
    ...mutation,
    uploadProgress,
    // Utility method for creating upload requests
    createUploadRequest: (file: File, type: DocumentType, metadata: any): DocumentUploadRequest => ({
      file,
      type,
      metadata,
      ownerId: auth.user?.id,
      autoAnalyze: true
    })
  };
}

/**
 * Hook for deleting documents
 * @param mutationOptions - React Query mutation options
 * @returns Document deletion mutation result
 */
export function useDocumentDelete(
  mutationOptions?: UseMutationOptions<void, Error, string>
) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>(
    (documentId) => deleteDocument(documentId),
    {
      onSuccess: (_, documentId) => {
        toast({
          title: "Document deleted successfully",
          description: "The document has been permanently removed",
          variant: "success",
          duration: 5000
        });
        
        // Invalidate document list queries and the specific document query
        queryClient.invalidateQueries(['documents']);
        queryClient.invalidateQueries(['document', documentId]);
        
        if (mutationOptions?.onSuccess) {
          mutationOptions.onSuccess(_, documentId);
        }
      },
      onError: (error, documentId) => {
        toast({
          title: "Failed to delete document",
          description: error.message || "An error occurred while deleting the document",
          variant: "error",
          duration: 5000
        });
        
        if (mutationOptions?.onError) {
          mutationOptions.onError(error, documentId);
        }
      },
      ...mutationOptions
    }
  );
}

/**
 * Hook for analyzing documents
 * @param mutationOptions - React Query mutation options
 * @returns Document analysis mutation result
 */
export function useDocumentAnalysis(
  mutationOptions?: UseMutationOptions<DocumentAnalysis, Error, DocumentAnalysisRequest>
) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<DocumentAnalysis, Error, DocumentAnalysisRequest>(
    (request) => analyzeDocument(request),
    {
      onSuccess: (data, variables) => {
        toast({
          title: "Document analysis initiated",
          description: "We'll notify you when the analysis is complete",
          variant: "success",
          duration: 5000
        });
        
        // Invalidate related queries
        queryClient.invalidateQueries(['document', variables.documentId]);
        
        if (mutationOptions?.onSuccess) {
          mutationOptions.onSuccess(data, variables);
        }
      },
      onError: (error, variables) => {
        toast({
          title: "Failed to analyze document",
          description: error.message || "An error occurred during document analysis",
          variant: "error",
          duration: 5000
        });
        
        if (mutationOptions?.onError) {
          mutationOptions.onError(error, variables);
        }
      },
      ...mutationOptions
    }
  );
}

/**
 * Hook for fetching document analysis results
 * @param documentId - ID of the document
 * @param analysisId - ID of the analysis to fetch
 * @param queryOptions - React Query options
 * @returns Document analysis result query
 */
export function useDocumentAnalysisResult(
  documentId: string,
  analysisId: string,
  queryOptions?: UseQueryOptions<DocumentAnalysis>
) {
  const { toast } = useToast();

  return useQuery<DocumentAnalysis>(
    ['document-analysis', documentId, analysisId],
    () => getDocumentAnalysis(documentId, analysisId),
    {
      enabled: !!documentId && !!analysisId,
      // Poll every 5 seconds if analysis is still processing
      refetchInterval: (data) => 
        data?.status === 'pending' || data?.status === 'processing' ? 5000 : false,
      onSuccess: (data) => {
        // If analysis just completed, show a notification
        if (data.status === 'completed' && queryOptions?.enabled !== false) {
          toast({
            title: "Document analysis completed",
            description: "The analysis results are now available",
            variant: "success",
            duration: 5000
          });
        } else if (data.status === 'failed' && queryOptions?.enabled !== false) {
          toast({
            title: "Document analysis failed",
            description: "Please try analyzing the document again",
            variant: "error",
            duration: 5000
          });
        }
        
        if (queryOptions?.onSuccess) {
          queryOptions.onSuccess(data);
        }
      },
      ...queryOptions
    }
  );
}

/**
 * Hook for updating document metadata
 * @param mutationOptions - React Query mutation options
 * @returns Document metadata update mutation result
 */
export function useDocumentMetadataUpdate(
  mutationOptions?: UseMutationOptions<
    Document, 
    Error, 
    { documentId: string, metadata: Partial<Document['metadata']> }
  >
) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<
    Document, 
    Error, 
    { documentId: string, metadata: Partial<Document['metadata']> }
  >(
    ({ documentId, metadata }) => updateDocumentMetadata(documentId, metadata),
    {
      onSuccess: (data, { documentId }) => {
        toast({
          title: "Document updated successfully",
          description: "The document metadata has been updated",
          variant: "success",
          duration: 5000
        });
        
        // Invalidate queries to refresh data
        queryClient.invalidateQueries(['document', documentId]);
        queryClient.invalidateQueries(['documents']);
        
        if (mutationOptions?.onSuccess) {
          mutationOptions.onSuccess(data, { documentId, metadata: {} });
        }
      },
      onError: (error, variables) => {
        toast({
          title: "Failed to update document",
          description: error.message || "An error occurred while updating the document",
          variant: "error",
          duration: 5000
        });
        
        if (mutationOptions?.onError) {
          mutationOptions.onError(error, variables);
        }
      },
      ...mutationOptions
    }
  );
}

/**
 * Hook for generating document download URLs
 * @param documentId - ID of the document to download
 * @returns Document download functions and state
 */
export function useDocumentDownload(documentId: string) {
  const [isGeneratingUrl, setIsGeneratingUrl] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  // Get direct download URL
  const getDirectDownloadUrl = useCallback(() => {
    return getDownloadUrl(documentId);
  }, [documentId]);

  // Get signed URL with expiration
  const getDocumentSignedUrl = useCallback(async (options?: { 
    expiresIn?: number; 
    download?: boolean;
  }) => {
    try {
      setIsGeneratingUrl(true);
      setError(null);
      const response = await getSignedUrl(documentId, options);
      setSignedUrl(response.url);
      return response.url;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to generate signed URL');
      setError(error);
      toast({
        title: "Failed to generate download link",
        description: error.message,
        variant: "error",
        duration: 5000
      });
      return null;
    } finally {
      setIsGeneratingUrl(false);
    }
  }, [documentId, toast]);

  return {
    getDirectDownloadUrl,
    getSignedUrl: getDocumentSignedUrl,
    signedUrl,
    isGeneratingUrl,
    error
  };
}