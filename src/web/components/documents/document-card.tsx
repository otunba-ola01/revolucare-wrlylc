import React from "react"; // v18.2.0
import Link from "next/link"; // v13.4.0
import { FileIcon, FileTextIcon, Eye, Download, Trash2, AlertCircle, CheckCircle, Clock, RotateCw } from "lucide-react"; // v0.284.0

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "../ui/card";
import { Button } from "../ui/button";
import { Document, DocumentType, DocumentStatus, DOCUMENT_TYPE_LABELS } from "../../types/document";
import { formatFileSize } from "../../lib/utils/format";
import { formatDate } from "../../lib/utils/date";
import { cn } from "../../lib/utils/color";

/**
 * Returns the appropriate icon component based on document status
 */
const getStatusIcon = (status: DocumentStatus): React.ElementType => {
  switch (status) {
    case DocumentStatus.AVAILABLE:
      return CheckCircle;
    case DocumentStatus.UPLOADING:
      return Clock;
    case DocumentStatus.PROCESSING:
      return RotateCw;
    case DocumentStatus.ERROR:
      return AlertCircle;
    default:
      return FileIcon;
  }
};

/**
 * Returns the appropriate color class based on document status
 */
const getStatusColor = (status: DocumentStatus): string => {
  switch (status) {
    case DocumentStatus.AVAILABLE:
      return "text-green-500";
    case DocumentStatus.UPLOADING:
      return "text-yellow-500";
    case DocumentStatus.PROCESSING:
      return "text-blue-500";
    case DocumentStatus.ERROR:
      return "text-red-500";
    default:
      return "text-gray-500";
  }
};

/**
 * Props for the DocumentCard component
 */
interface DocumentCardProps {
  document: Document;
  onView?: (document: Document) => void;
  onDownload?: (document: Document) => void;
  onDelete?: (document: Document) => void;
  onAnalyze?: (document: Document) => void;
  isViewLoading?: boolean;
  isDownloadLoading?: boolean;
  isDeleteLoading?: boolean;
  isAnalyzeLoading?: boolean;
  className?: string;
}

/**
 * A reusable card component for displaying document information
 * Supports view, download, delete, and analyze actions based on document status
 */
export const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  onView,
  onDownload,
  onDelete,
  onAnalyze,
  isViewLoading = false,
  isDownloadLoading = false,
  isDeleteLoading = false,
  isAnalyzeLoading = false,
  className,
  ...props
}) => {
  const StatusIcon = getStatusIcon(document.status);
  const statusColor = getStatusColor(document.status);
  const formattedSize = formatFileSize(document.size);
  const formattedDate = formatDate(document.createdAt, "MMM d, yyyy");
  const documentTypeLabel = DOCUMENT_TYPE_LABELS[document.type as keyof typeof DOCUMENT_TYPE_LABELS] || "Document";

  return (
    <Card className={cn("transition-all hover:shadow-md", className)} {...props}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold truncate mr-2" title={document.name}>
            {document.name}
          </CardTitle>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-100">
            {documentTypeLabel}
          </span>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-2 gap-2 text-sm mb-2">
          <div className="flex items-center text-gray-500">
            <FileTextIcon className="h-4 w-4 mr-1" />
            <span>{formattedSize}</span>
          </div>
          <div className="flex items-center text-gray-500">
            <Clock className="h-4 w-4 mr-1" />
            <span>{formattedDate}</span>
          </div>
        </div>
        
        <div className="flex items-center mt-2">
          <StatusIcon className={cn("h-4 w-4 mr-1.5", statusColor)} />
          <span className={cn("text-sm font-medium", statusColor)}>
            {document.status === DocumentStatus.AVAILABLE ? "Available" : 
             document.status === DocumentStatus.UPLOADING ? "Uploading" :
             document.status === DocumentStatus.PROCESSING ? "Processing" : "Error"}
          </span>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between pt-2">
        <div className="flex space-x-2">
          {onView && (document.status === DocumentStatus.AVAILABLE) && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onView(document)}
              disabled={isViewLoading}
              aria-label={`View ${document.name}`}
              isLoading={isViewLoading}
              loadingText="Viewing"
            >
              {!isViewLoading && <Eye className="h-4 w-4 mr-1" />}
              View
            </Button>
          )}
          
          {onDownload && (document.status === DocumentStatus.AVAILABLE) && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onDownload(document)}
              disabled={isDownloadLoading}
              aria-label={`Download ${document.name}`}
              isLoading={isDownloadLoading}
              loadingText="Downloading"
            >
              {!isDownloadLoading && <Download className="h-4 w-4 mr-1" />}
              Download
            </Button>
          )}
        </div>
        
        <div className="flex space-x-2">
          {onAnalyze && (document.status === DocumentStatus.AVAILABLE) && (
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => onAnalyze(document)}
              disabled={isAnalyzeLoading}
              aria-label={`Analyze ${document.name}`}
              isLoading={isAnalyzeLoading}
              loadingText="Analyzing"
            >
              {!isAnalyzeLoading && <RotateCw className="h-4 w-4 mr-1" />}
              Analyze
            </Button>
          )}
          
          {onDelete && (
            <Button 
              variant="outline" 
              size="sm"
              className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
              onClick={() => onDelete(document)}
              disabled={isDeleteLoading || document.status === DocumentStatus.UPLOADING}
              aria-label={`Delete ${document.name}`}
              isLoading={isDeleteLoading}
              loadingText="Deleting"
            >
              {!isDeleteLoading && <Trash2 className="h-4 w-4 mr-1" />}
              Delete
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};