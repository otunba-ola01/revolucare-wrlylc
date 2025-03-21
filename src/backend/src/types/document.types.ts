/**
 * Document Types
 * 
 * This file defines TypeScript types and interfaces for document-related functionality
 * in the Revolucare platform. It includes type definitions for document types, statuses,
 * metadata, and analysis operations used across the document management system.
 */

import { 
  DOCUMENT_TYPES, 
  DOCUMENT_MIME_TYPES, 
  DOCUMENT_ANALYSIS_TYPES 
} from '../constants/document-types';
import { ConfidenceScore } from './ai.types';

/**
 * Type definition for document types based on the document type constants
 */
export type DocumentType = typeof DOCUMENT_TYPES[keyof typeof DOCUMENT_TYPES];

/**
 * Type definition for document MIME types based on the MIME type constants
 */
export type DocumentMimeType = typeof DOCUMENT_MIME_TYPES[keyof typeof DOCUMENT_MIME_TYPES];

/**
 * Type definition for document analysis types based on the analysis type constants
 */
export type DocumentAnalysisType = typeof DOCUMENT_ANALYSIS_TYPES[keyof typeof DOCUMENT_ANALYSIS_TYPES];

/**
 * Enum for document processing status values
 */
export enum DocumentStatus {
  /** Document is currently being uploaded */
  UPLOADING = 'uploading',
  
  /** Document is being processed */
  PROCESSING = 'processing',
  
  /** Document is available for use */
  AVAILABLE = 'available',
  
  /** Error occurred during upload or processing */
  ERROR = 'error'
}

/**
 * Enum for document analysis status values
 */
export enum AnalysisStatus {
  /** Analysis is scheduled but not yet started */
  PENDING = 'pending',
  
  /** Analysis is currently in progress */
  PROCESSING = 'processing',
  
  /** Analysis has been successfully completed */
  COMPLETED = 'completed',
  
  /** Analysis failed to complete */
  FAILED = 'failed'
}

/**
 * Interface for document metadata properties
 */
export interface DocumentMetadata {
  /** Title of the document */
  title: string;
  
  /** Optional description of the document content */
  description?: string;
  
  /** Array of tags for categorization and search */
  tags: string[];
  
  /** Document category for classification */
  category: string;
  
  /** Date associated with the document content */
  documentDate?: Date;
  
  /** Source or origin of the document */
  source?: string;
  
  /** Indicates if document contains confidential information */
  isConfidential: boolean;
}

/**
 * Interface for document filtering criteria
 */
export interface DocumentFilter {
  /** Filter by document owner ID */
  ownerId?: string;
  
  /** Filter by document type */
  type?: DocumentType;
  
  /** Filter by document status */
  status?: DocumentStatus;
  
  /** Filter by document created date range (start) */
  dateFrom?: Date;
  
  /** Filter by document created date range (end) */
  dateTo?: Date;
  
  /** Search term for text search within documents */
  searchTerm?: string;
  
  /** Filter by document tags */
  tags?: string[];
}

/**
 * Interface for document sorting options
 */
export interface DocumentSortOptions {
  /** Field to sort by (e.g., 'createdAt', 'name', etc.) */
  field: string;
  
  /** Sort direction */
  direction: 'asc' | 'desc';
}

/**
 * Interface for document pagination options
 */
export interface DocumentPaginationOptions {
  /** Page number (1-based) */
  page: number;
  
  /** Number of items per page */
  limit: number;
  
  /** Sort options */
  sort?: DocumentSortOptions;
}

/**
 * Interface for document upload options
 */
export interface DocumentUploadOptions {
  /** ID of the document owner (user) */
  ownerId: string;
  
  /** Document filename */
  name: string;
  
  /** Document type category */
  type: DocumentType;
  
  /** Document metadata */
  metadata: DocumentMetadata;
  
  /** Whether to automatically analyze the document after upload */
  autoAnalyze?: boolean;
  
  /** Type of analysis to perform if autoAnalyze is true */
  analysisType?: DocumentAnalysisType;
}

/**
 * Interface for document analysis options
 */
export interface DocumentAnalysisOptions {
  /** Type of analysis to perform */
  analysisType: DocumentAnalysisType;
  
  /** Processing priority */
  priority?: 'high' | 'normal' | 'low';
  
  /** Additional options specific to the analysis type */
  extractionOptions?: Record<string, any>;
}

/**
 * Interface for document analysis request parameters
 */
export interface DocumentAnalysisRequest {
  /** ID of the document to analyze */
  documentId: string;
  
  /** Type of analysis to perform */
  analysisType: DocumentAnalysisType;
  
  /** Additional options for the analysis */
  options?: Record<string, any>;
}

/**
 * Interface for document analysis response data
 */
export interface DocumentAnalysisResponse {
  /** Unique identifier for the analysis record */
  id: string;
  
  /** ID of the analyzed document */
  documentId: string;
  
  /** Type of analysis performed */
  analysisType: DocumentAnalysisType;
  
  /** Current status of the analysis */
  status: AnalysisStatus;
  
  /** Analysis results data */
  results: Record<string, any>;
  
  /** Confidence score for the analysis results */
  confidence: ConfidenceScore;
  
  /** Processing time in milliseconds */
  processingTime: number;
  
  /** When the analysis was initiated */
  createdAt: Date;
  
  /** When the analysis was completed (if applicable) */
  completedAt?: Date;
}

/**
 * Interface for document response data returned to clients
 */
export interface DocumentResponse {
  /** Unique identifier for the document */
  id: string;
  
  /** ID of the document owner */
  ownerId: string;
  
  /** Document filename */
  name: string;
  
  /** Document type category */
  type: DocumentType;
  
  /** Document MIME type */
  mimeType: DocumentMimeType;
  
  /** File size in bytes */
  size: number;
  
  /** Document metadata */
  metadata: DocumentMetadata;
  
  /** Current document status */
  status: DocumentStatus;
  
  /** Analysis results if available */
  analysisResults?: DocumentAnalysisResponse[];
  
  /** Temporary download URL (if requested) */
  downloadUrl?: string;
  
  /** When the document was created */
  createdAt: Date;
  
  /** When the document was last updated */
  updatedAt: Date;
}

/**
 * Interface for paginated document response data
 */
export interface PaginatedDocumentResponse {
  /** Array of document data */
  data: DocumentResponse[];
  
  /** Pagination information */
  pagination: {
    /** Current page number */
    page: number;
    
    /** Items per page */
    limit: number;
    
    /** Total number of items matching the query */
    total: number;
    
    /** Total number of pages */
    totalPages: number;
  };
}

/**
 * Interface for document storage information
 */
export interface DocumentStorageInfo {
  /** Storage URL or path */
  storageUrl: string;
  
  /** Content type of the stored document */
  contentType: string;
  
  /** Size in bytes */
  size: number;
  
  /** ETag for version control */
  etag: string;
  
  /** When the document was uploaded to storage */
  uploadedAt: Date;
}

/**
 * Interface for signed URL generation options
 */
export interface SignedUrlOptions {
  /** URL expiration time in seconds */
  expiresIn: number;
  
  /** Content type for upload/download */
  contentType?: string;
  
  /** Response content disposition header */
  responseDisposition?: string;
}