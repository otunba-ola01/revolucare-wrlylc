import React, { useState, useEffect, useCallback } from "react"; // v18.0.0
import { FileText, Trash2, Eye, Download, FileSearch } from "lucide-react"; // v0.284.0
import { DocumentCard } from "./document-card";
import DocumentFilter from "./document-filter";
import EmptyState from "../common/empty-state";
import Pagination from "../common/pagination";
import { Button } from "../ui/button";
import {
  Document,
  DocumentFilterOptions,
  DocumentStatus,
} from "../../types/document";
import {
  useDocumentList,
  useDocumentDelete,
  useDocumentAnalysis,
  useDocumentDownload,
} from "../../hooks/use-documents";
import { useFilter } from "../../hooks/use-filter";
import { usePagination } from "../../hooks/use-pagination";
import { cn } from "../../lib/utils/color";

/**
 * Props for the DocumentList component
 */
export interface DocumentListProps {
  /**
   * List of documents to display. If not provided, documents are fetched using useDocumentList hook.
   */
  documents?: Document[];
  /**
   * Initial filter values for the document list
   */
  initialFilters?: DocumentFilterOptions;
  /**
   * Callback fired when filters change
   */
  onFilterChange?: (filters: DocumentFilterOptions) => void;
  /**
   * Callback fired when a document is viewed
   */
  onView?: (document: Document) => void;
  /**
   * Callback fired when a document is downloaded
   */
  onDownload?: (document: Document) => void;
  /**
   * Callback fired when a document is deleted
   */
  onDelete?: (document: Document) => void;
  /**
   * Callback fired when a document is analyzed
   */
  onAnalyze?: (document: Document) => void;
  /**
   * Owner ID to filter documents by
   */
  ownerId?: string;
  /**
   * Whether to show the filter component
   */
  showFilter?: boolean;
  /**
   * Whether to show the pagination component
   */
  showPagination?: boolean;
  /**
   * Additional CSS class names
   */
  className?: string;
  /**
   * Whether the document list is loading
   */
  isLoading?: boolean;
  /**
   * Title for the empty state component
   */
  emptyStateTitle?: string;
  /**
   * Description for the empty state component
   */
  emptyStateDescription?: string;
  /**
   * Action text for the empty state component
   */
  emptyStateActionText?: string;
  /**
   * Callback for the empty state action button
   */
  onEmptyStateAction?: () => void;
}

/**
 * A component that displays a list of documents with filtering, pagination, and action capabilities
 */
const DocumentList: React.FC<DocumentListProps> = ({
  documents: initialDocuments,
  initialFilters,
  onFilterChange,
  onView,
  onDownload,
  onDelete,
  onAnalyze,
  ownerId,
  showFilter = true,
  showPagination = true,
  className,
  isLoading: propIsLoading,
  emptyStateTitle,
  emptyStateDescription,
  emptyStateActionText,
  onEmptyStateAction,
}) => {
  // Initialize filter state using useFilter hook with initialFilters
  const { filters, updateFilters: setFilters } = useFilter<DocumentFilterOptions>(
    initialFilters || {}
  );

  // Initialize pagination state using usePagination hook
  const { paginationInfo, goToPage, setPageSize } = usePagination({
    initialPage: filters.page || 1,
    initialLimit: filters.limit || 10,
    totalItems: 0, // Initial value, will be updated by useDocumentList
  });

  // Fetch document list using useDocumentList hook with filters and pagination
  const {
    documents,
    isLoading,
    isError,
    error,
    pagination,
  } = useDocumentList(
    { ...filters, ownerId, page: paginationInfo.page, limit: paginationInfo.limit },
    { enabled: !initialDocuments } // Disable query if initialDocuments are provided
  );

  // Initialize document action hooks (useDocumentDelete, useDocumentAnalysis, useDocumentDownload)
  const { mutate: deleteDocument, isLoading: isDeleteLoading } =
    useDocumentDelete();
  const { mutate: analyzeDocument, isLoading: isAnalyzeLoading } =
    useDocumentAnalysis();
  const { isGeneratingUrl: isDownloadLoading } = useDocumentDownload("");

  // Handle filter changes
  const handleFilterChange = useCallback(
    (newFilters: DocumentFilterOptions) => {
      setFilters(newFilters);
      onFilterChange?.(newFilters);
      goToPage(1); // Reset pagination to first page when filters change
    },
    [setFilters, onFilterChange, goToPage]
  );

  // Handle pagination page changes
  const handlePageChange = useCallback(
    (page: number) => {
      goToPage(page);
    },
    [goToPage]
  );

  // Handle pagination page size changes
  const handlePageSizeChange = useCallback(
    (pageSize: number) => {
      setPageSize(pageSize);
      goToPage(1); // Reset to first page when page size changes
    },
    [setPageSize, goToPage]
  );

  // Handle document view action
  const handleViewDocument = useCallback(
    (document: Document) => {
      if (onView) {
        onView(document);
      } else {
        // Generate a signed URL and open it in a new tab
        window.open(document.downloadUrl, "_blank");
      }
    },
    [onView]
  );

  // Handle document download action
  const handleDownloadDocument = useCallback(
    (document: Document) => {
      if (onDownload) {
        onDownload(document);
      } else {
        // Generate a download URL and trigger download
        window.location.href = document.downloadUrl || "";
      }
    },
    [onDownload]
  );

  // Handle document deletion action
  const handleDeleteDocument = useCallback(
    (document: Document) => {
      if (onDelete) {
        onDelete(document);
      } else {
        deleteDocument(document.id);
      }
    },
    [onDelete, deleteDocument]
  );

  // Handle document analysis action
  const handleAnalyzeDocument = useCallback(
    (document: Document) => {
      if (onAnalyze) {
        onAnalyze(document);
      } else {
        analyzeDocument({ documentId: document.id, analysisType: "medical_extraction" });
      }
    },
    [onAnalyze, analyzeDocument]
  );

  // Determine if the document list is empty
  const isEmpty = (initialDocuments ? initialDocuments.length === 0 : documents.length === 0) && !isLoading;

  // Render loading, error, or empty states appropriately
  if (propIsLoading || isLoading) {
    return <p>Loading documents...</p>;
  }

  if (isError) {
    return <p>Error: {error.message}</p>;
  }

  if (isEmpty) {
    return (
      <EmptyState
        title={emptyStateTitle || "No documents found"}
        description={
          emptyStateDescription ||
          "Upload documents to start managing your care plans"
        }
        actionText={emptyStateActionText || "Upload Document"}
        onAction={onEmptyStateAction}
      />
    );
  }

  return (
    <div className={className}>
      {showFilter && (
        <DocumentFilter
          initialFilters={filters}
          onFilterChange={handleFilterChange}
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {(initialDocuments || documents).map((document) => (
          <DocumentCard
            key={document.id}
            document={document}
            onView={handleViewDocument}
            onDownload={handleDownloadDocument}
            onDelete={handleDeleteDocument}
            onAnalyze={handleAnalyzeDocument}
            isViewLoading={false} // Implement loading states if needed
            isDownloadLoading={isDownloadLoading}
            isDeleteLoading={isDeleteLoading}
            isAnalyzeLoading={isAnalyzeLoading}
          />
        ))}
      </div>

      {showPagination && pagination && (
        <Pagination
          pagination={pagination}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          pageSizeOptions={[5, 10, 25, 50]}
        />
      )}
    </div>
  );
};

export default DocumentList;