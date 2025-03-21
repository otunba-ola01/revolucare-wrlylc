import {
  Document,
  DocumentAnalysis,
  DocumentType,
  DocumentMimeType,
  DocumentStatus,
  DocumentAnalysisType,
  AnalysisStatus,
  DocumentMetadata,
  DocumentResponse,
  DocumentAnalysisResponse,
  PaginatedDocumentResponse
} from '../types/document.types';

/**
 * Interface defining parameters for document upload operations
 */
export interface DocumentUploadParams {
  /** Document content as Buffer or ReadableStream */
  file: Buffer | ReadableStream;
  
  /** ID of the user who owns this document */
  ownerId: string;
  
  /** Filename of the document */
  name: string;
  
  /** Type of document (e.g., medical_record, assessment) */
  type: DocumentType;
  
  /** MIME type of the document (e.g., application/pdf) */
  mimeType: DocumentMimeType;
  
  /** Size of the document in bytes */
  size: number;
  
  /** Document metadata including title, description, tags, etc. */
  metadata: DocumentMetadata;
  
  /** Whether to automatically analyze the document after upload */
  autoAnalyze?: boolean;
  
  /** Type of analysis to perform if autoAnalyze is true */
  analysisType?: DocumentAnalysisType;
}

/**
 * Interface defining parameters for querying documents
 */
export interface DocumentQueryParams {
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
  
  /** Page number for pagination (1-based) */
  page?: number;
  
  /** Number of items per page */
  limit?: number;
  
  /** Field to sort by */
  sortBy?: string;
  
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Interface defining parameters for document analysis
 */
export interface DocumentAnalysisParams {
  /** ID of the document to analyze */
  documentId: string;
  
  /** Type of analysis to perform */
  analysisType: DocumentAnalysisType;
  
  /** Additional options for the analysis */
  options?: Record<string, any>;
  
  /** Processing priority */
  priority?: 'high' | 'normal' | 'low';
}

/**
 * Interface defining parameters for updating document metadata
 */
export interface DocumentMetadataUpdateParams {
  /** Title of the document */
  title?: string;
  
  /** Description of the document content */
  description?: string;
  
  /** Array of tags for categorization and search */
  tags?: string[];
  
  /** Document category for classification */
  category?: string;
  
  /** Date associated with the document content */
  documentDate?: Date;
  
  /** Source or origin of the document */
  source?: string;
  
  /** Indicates if document contains confidential information */
  isConfidential?: boolean;
}

/**
 * Interface defining options for generating signed URLs
 */
export interface SignedUrlOptions {
  /** URL expiration time in seconds */
  expiresIn: number;
  
  /** Content type for upload/download */
  contentType?: string;
  
  /** Response content disposition header */
  responseDisposition?: string;
}

/**
 * Interface defining document service operations
 */
export interface IDocumentService {
  /**
   * Uploads a new document to the system
   * @param params Parameters for document upload
   * @returns Uploaded document information
   */
  uploadDocument(params: DocumentUploadParams): Promise<DocumentResponse>;
  
  /**
   * Retrieves document information by ID
   * @param id Document ID
   * @param includeAnalysis Whether to include analysis results
   * @returns Document information
   */
  getDocument(id: string, includeAnalysis?: boolean): Promise<DocumentResponse>;
  
  /**
   * Lists documents based on query parameters
   * @param params Query parameters for filtering, sorting, and pagination
   * @returns Paginated list of documents
   */
  listDocuments(params: DocumentQueryParams): Promise<PaginatedDocumentResponse>;
  
  /**
   * Deletes a document by ID
   * @param id Document ID
   * @returns Success status
   */
  deleteDocument(id: string): Promise<boolean>;
  
  /**
   * Initiates document analysis
   * @param params Parameters for document analysis
   * @returns Analysis information
   */
  analyzeDocument(params: DocumentAnalysisParams): Promise<DocumentAnalysisResponse>;
  
  /**
   * Retrieves document analysis results
   * @param analysisId Analysis ID
   * @returns Analysis information
   */
  getDocumentAnalysis(analysisId: string): Promise<DocumentAnalysisResponse>;
  
  /**
   * Updates document metadata
   * @param id Document ID
   * @param metadata Updated metadata fields
   * @returns Updated document information
   */
  updateDocumentMetadata(id: string, metadata: DocumentMetadataUpdateParams): Promise<DocumentResponse>;
  
  /**
   * Generates a signed URL for document access
   * @param id Document ID
   * @param options URL generation options
   * @returns Signed URL
   */
  generateSignedUrl(id: string, options: SignedUrlOptions): Promise<string>;
  
  /**
   * Downloads document content
   * @param id Document ID
   * @returns Document content and metadata
   */
  downloadDocument(id: string): Promise<{ content: Buffer; name: string; mimeType: string }>;
}

/**
 * Interface defining document repository operations
 */
export interface IDocumentRepository {
  /**
   * Creates a new document record
   * @param document Document data
   * @returns Created document
   */
  create(document: Partial<Document>): Promise<Document>;
  
  /**
   * Finds a document by ID
   * @param id Document ID
   * @returns Document or null if not found
   */
  findById(id: string): Promise<Document | null>;
  
  /**
   * Finds all documents matching the query parameters
   * @param params Query parameters
   * @returns Paginated list of documents
   */
  findAll(params: DocumentQueryParams): Promise<{ data: Document[]; total: number }>;
  
  /**
   * Updates a document
   * @param id Document ID
   * @param data Update data
   * @returns Updated document
   */
  update(id: string, data: Partial<Document>): Promise<Document>;
  
  /**
   * Deletes a document
   * @param id Document ID
   * @returns Success status
   */
  delete(id: string): Promise<boolean>;
  
  /**
   * Creates a document analysis record
   * @param analysis Analysis data
   * @returns Created analysis record
   */
  createAnalysis(analysis: Partial<DocumentAnalysis>): Promise<DocumentAnalysis>;
  
  /**
   * Finds a document analysis record by ID
   * @param id Analysis ID
   * @returns Analysis record or null if not found
   */
  findAnalysisById(id: string): Promise<DocumentAnalysis | null>;
  
  /**
   * Updates a document analysis record
   * @param id Analysis ID
   * @param data Update data
   * @returns Updated analysis record
   */
  updateAnalysis(id: string, data: Partial<DocumentAnalysis>): Promise<DocumentAnalysis>;
  
  /**
   * Finds all analysis records for a document
   * @param documentId Document ID
   * @returns Array of analysis records
   */
  findAnalysesByDocumentId(documentId: string): Promise<DocumentAnalysis[]>;
}