import React, { useState, useEffect, useRef } from 'react'; // react ^18.2.0
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../ui/tabs';
import {
  Document,
  DocumentType,
  DocumentStatus,
  DocumentMimeType,
  DocumentAnalysis,
  DOCUMENT_TYPE_LABELS,
} from '../../types/document';
import {
  useDocument,
  useDocumentAnalysisResult,
  useDocumentDownload,
} from '../../hooks/use-documents';
import { formatFileSize } from '../../lib/utils/format';
import { formatDate } from '../../lib/utils/date';
import { cn } from '../../lib/utils/color';
import {
  FileIcon,
  FileTextIcon,
  Download,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  RotateCw,
  ChevronLeft
} from 'lucide-react'; // lucide-react ^0.284.0
import { Document as PDFDocument, Page as PDFPage, pdfjs } from 'react-pdf'; // react-pdf ^7.3.3

// Set the PDF.js worker URL (required for react-pdf)
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

/**
 * Props for the DocumentViewer component
 */
interface DocumentViewerProps {
  documentId: string;
  analysisId?: string;
  onBack?: () => void;
  onDownload?: (document: Document) => void;
  onDelete?: (document: Document) => void;
  onAnalyze?: (document: Document) => void;
  className?: string;
}

/**
 * Returns the appropriate icon component based on document status
 * @param status DocumentStatus
 * @returns Icon component for the status
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
 * @param status DocumentStatus
 * @returns Tailwind CSS color class
 */
const getStatusColor = (status: DocumentStatus): string => {
  switch (status) {
    case DocumentStatus.AVAILABLE:
      return 'text-green-500';
    case DocumentStatus.UPLOADING:
      return 'text-yellow-500';
    case DocumentStatus.PROCESSING:
      return 'text-blue-500';
    case DocumentStatus.ERROR:
      return 'text-red-500';
    default:
      return 'text-gray-500';
  }
};

/**
 * Renders the appropriate document content based on MIME type
 * @param document Document
 * @param url string
 * @returns Rendered document content
 */
const renderDocumentContent = (document: Document, url: string): JSX.Element => {
  switch (document.mimeType) {
    case DocumentMimeType.PDF:
      return (
        <div>
          <PDFDocument file={url}>
            <PDFPage pageNumber={1} />
          </PDFDocument>
        </div>
      );
    case DocumentMimeType.JPEG:
    case DocumentMimeType.PNG:
      return <img src={url} alt={document.name} className="max-w-full" />;
    case DocumentMimeType.DOCX:
    case DocumentMimeType.DOC:
    case DocumentMimeType.TXT:
      return (
        <iframe
          src={url}
          title={document.name}
          className="w-full h-96 border-none"
        />
      );
    default:
      return (
        <div>
          <p>Unsupported document type. Please download to view.</p>
        </div>
      );
  }
};

/**
 * Component for viewing document content with metadata, status information, and action buttons
 * @param props DocumentViewerProps
 * @returns Rendered document viewer component
 */
export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  documentId,
  analysisId,
  onBack,
  onDownload,
  onDelete,
  onAnalyze,
  className,
}) => {
  // Fetch document data using the useDocument hook
  const { data: document, isLoading: isDocumentLoading, error: documentError } =
    useDocument(documentId);

  // Fetch document analysis results using the useDocumentAnalysisResult hook
  const { data: analysis, isLoading: isAnalysisLoading, error: analysisError } =
    useDocumentAnalysisResult(documentId, analysisId || '');

  // Use the useDocumentDownload hook to get download functionality
  const { getDirectDownloadUrl } = useDocumentDownload(documentId);

  // State for PDF rendering
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);

  // State for active tab (document or analysis)
  const [activeTab, setActiveTab] = useState('document');

  // Get document URL
  const url = document ? getDirectDownloadUrl() : '';

  // Handle loading states
  if (isDocumentLoading) {
    return <Card>Loading document...</Card>;
  }

  if (documentError) {
    return <Card>Error loading document: {documentError.message}</Card>;
  }

  if (!document) {
    return <Card>Document not found.</Card>;
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack} className="mr-2">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          )}
          {document.name}
        </CardTitle>
        <Badge variant="outline">
          {DOCUMENT_TYPE_LABELS[document.type]}
        </Badge>
      </CardHeader>
      <Tabs defaultValue="document" className="space-y-4">
        <TabsList>
          <TabsTrigger value="document">Document</TabsTrigger>
          {analysis && (
            <TabsTrigger value="analysis">Analysis Results</TabsTrigger>
          )}
        </TabsList>
        <TabsContent value="document">
          <CardContent>
            {url ? (
              renderDocumentContent(document, url)
            ) : (
              <p>Error: Could not generate download URL.</p>
            )}
          </CardContent>
        </TabsContent>
        {analysis && (
          <TabsContent value="analysis">
            <CardContent>
              {isAnalysisLoading ? (
                <p>Loading analysis results...</p>
              ) : analysisError ? (
                <p>Error loading analysis: {analysisError.message}</p>
              ) : (
                <pre>{JSON.stringify(analysis.results, null, 2)}</pre>
              )}
            </CardContent>
          </TabsContent>
        )}
      </Tabs>
      <CardFooter className="flex justify-between">
        <div>
          Size: {formatFileSize(document.size)} | Uploaded:{' '}
          {formatDate(document.createdAt, 'MMM d, yyyy')} | Status:{' '}
          <span className={cn('inline-flex items-center font-medium', getStatusColor(document.status))}>
            <Eye className="mr-1.5 h-4 w-4" />
            {document.status}
          </span>
        </div>
        <div>
          {onDownload && (
            <Button variant="secondary" size="sm" onClick={() => onDownload(document)}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" size="sm" onClick={() => onDelete(document)}>
              Delete
            </Button>
          )}
          {onAnalyze && document.status === DocumentStatus.AVAILABLE && (
            <Button variant="outline" size="sm" onClick={() => onAnalyze(document)}>
              Analyze
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};