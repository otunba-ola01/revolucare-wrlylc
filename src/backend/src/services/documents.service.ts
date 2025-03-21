import path from 'path'; // built-in
import stream from 'stream'; // built-in
import {
  IDocumentService,
  DocumentUploadParams,
  DocumentQueryParams,
  DocumentAnalysisParams,
  DocumentMetadataUpdateParams,
  SignedUrlOptions,
} from '../interfaces/document.interface';
import { Document } from '../models/document.model';
import { DocumentRepository } from '../repositories/document.repository';
import { BlobStorageService } from './storage/blob-storage.service';
import { DocumentAnalysisService } from './ai/document-analysis.service';
import {
  DocumentType,
  DocumentMimeType,
  DocumentStatus,
  DocumentMetadata,
  DocumentResponse,
  DocumentAnalysisResponse,
  PaginatedDocumentResponse,
} from '../types/document.types';
import { DOCUMENT_TYPES, DOCUMENT_MIME_TYPES } from '../constants/document-types';
import { errorFactory } from '../utils/error-handler';
import { logger } from '../utils/logger';
import { fileProcessor } from '../utils/file-processor';

// Define error codes for this module
const ERROR_CODES = {
  DOCUMENT_NOT_FOUND: 'document_not_found',
  DOCUMENT_UPLOAD_FAILED: 'document_upload_failed',
  DOCUMENT_DOWNLOAD_FAILED: 'document_download_failed',
  DOCUMENT_DELETE_FAILED: 'document_delete_failed',
  INVALID_DOCUMENT_TYPE: 'invalid_document_type',
  INVALID_DOCUMENT_FORMAT: 'invalid_document_format',
  ANALYSIS_NOT_FOUND: 'analysis_not_found',
};

// Default signed URL options
const DEFAULT_SIGNED_URL_OPTIONS = {
  expiresIn: 3600,
  contentType: 'application/octet-stream',
  responseDisposition: 'inline',
};

/**
 * Formats a document model into a standardized response object
 * @param document - The document model to format
 * @param downloadUrl - The download URL for the document
 * @returns Formatted document response
 */
function formatDocumentResponse(
  document: Document,
  downloadUrl?: string,
): DocumentResponse {
  // Extract relevant properties from document model
  const { id, ownerId, name, type, mimeType, size, storageUrl, metadata, status, createdAt, updatedAt } = document;

  // Add download URL to response
  const response: DocumentResponse = {
    id,
    ownerId,
    name,
    type,
    mimeType,
    size,
    metadata,
    status,
    createdAt,
    updatedAt,
    downloadUrl,
  };

  // Format dates as ISO strings
  if (response.createdAt instanceof Date) {
    response.createdAt = response.createdAt.toISOString() as any;
  }
  if (response.updatedAt instanceof Date) {
    response.updatedAt = response.updatedAt.toISOString() as any;
  }

  // Return formatted response object
  return response;
}

/**
 * Validates that a document type is supported
 * @param type - The document type to validate
 * @returns True if valid, throws error if invalid
 */
function validateDocumentType(type: string): boolean {
  // Check if type exists in DOCUMENT_TYPES
  if (Object.values(DOCUMENT_TYPES).includes(type as DocumentType)) {
    return true; // If valid, return true
  }

  // If invalid, throw validation error with appropriate message
  throw errorFactory.createValidationError(
    `Invalid document type: ${type}`,
    { type },
  );
}

/**
 * Validates that a MIME type is supported
 * @param mimeType - The MIME type to validate
 * @returns True if valid, throws error if invalid
 */
function validateMimeType(mimeType: string): boolean {
  // Check if mimeType exists in DOCUMENT_MIME_TYPES
  if (Object.values(DOCUMENT_MIME_TYPES).includes(mimeType as DocumentMimeType)) {
    return true; // If valid, return true
  }

  // If invalid, throw validation error with appropriate message
  throw errorFactory.createValidationError(
    `Invalid MIME type: ${mimeType}`,
    { mimeType },
  );
}

/**
 * Service for managing document operations in the Revolucare platform
 */
export class DocumentService implements IDocumentService {
  /**
   * Creates a new document service instance
   * @param documentRepository - The document repository for database operations
   * @param storageService - The blob storage service for document storage operations
   * @param analysisService - The document analysis service for AI-powered document analysis
   */
  constructor(
    private documentRepository: DocumentRepository,
    private storageService: BlobStorageService,
    private analysisService: DocumentAnalysisService,
  ) {
    // Store the provided repositories and services
    this.documentRepository = documentRepository;
    this.storageService = storageService;
    this.analysisService = analysisService;

    // Initialize the service dependencies
    logger.info('DocumentService instantiated');
  }

  /**
   * Uploads a document to the system
   * @param params - Parameters for document upload
   * @returns Uploaded document information
   */
  async uploadDocument(
    params: DocumentUploadParams,
  ): Promise<DocumentResponse> {
    try {
      logger.info('Uploading document', {
        ownerId: params.ownerId,
        name: params.name,
        type: params.type,
      });

      // Validate document type and MIME type
      validateDocumentType(params.type);
      validateMimeType(params.mimeType);

      // Sanitize file name for security
      const sanitizedFileName = fileProcessor.sanitizeFileName(params.name);

      // Create document record with UPLOADING status
      const document = await this.documentRepository.create({
        ownerId: params.ownerId,
        name: sanitizedFileName,
        type: params.type,
        mimeType: params.mimeType,
        size: params.size,
        status: DocumentStatus.UPLOADING,
        metadata: params.metadata,
      });

      // Upload file to blob storage
      const storageInfo = await this.storageService.uploadFile(
        params.file,
        params.ownerId,
        sanitizedFileName,
        params.type,
        params.mimeType,
      );

      // Update document record with storage URL and AVAILABLE status
      await this.documentRepository.update(document.id, {
        storageUrl: storageInfo.storageUrl,
        status: DocumentStatus.AVAILABLE,
      });

      // If autoAnalyze is true, initiate document analysis
      if (params.autoAnalyze && params.analysisType) {
        await this.analyzeDocument({
          documentId: document.id,
          analysisType: params.analysisType,
        });
      }

      // Generate signed URL for document access
      const signedUrl = await this.generateSignedUrl(document.id, {
        expiresIn: 3600,
      });

      logger.info('Document uploaded successfully', { documentId: document.id });

      // Return formatted document response
      return formatDocumentResponse(document, signedUrl);
    } catch (err) {
      logger.error('Failed to upload document', { error: err, params });

      // Handle errors by updating document status and rethrowing
      if (err instanceof Error && (err as any).code === 'DOCUMENT_NOT_FOUND') {
        throw err;
      }
      throw errorFactory.createError(
        'Failed to upload document',
        ERROR_CODES.DOCUMENT_UPLOAD_FAILED,
        { params },
        err as Error,
      );
    }
  }

  /**
   * Retrieves a document by ID
   * @param documentId - The ID of the document to retrieve
   * @returns Document information
   */
  async getDocument(documentId: string): Promise<DocumentResponse> {
    try {
      logger.info('Retrieving document', { documentId });

      // Validate document ID
      if (!documentId) {
        throw errorFactory.createValidationError('Document ID is required');
      }

      // Retrieve document from repository
      const document = await this.documentRepository.findById(documentId);

      // If not found, throw NotFoundError
      if (!document) {
        throw errorFactory.createNotFoundError('Document not found', {
          documentId,
        });
      }

      // Generate signed URL for document access
      const signedUrl = await this.generateSignedUrl(document.id, {
        expiresIn: 3600,
      });

      logger.info('Document retrieved successfully', { documentId });

      // Return formatted document response
      return formatDocumentResponse(document, signedUrl);
    } catch (err) {
      logger.error('Failed to retrieve document', { error: err, documentId });
      throw err;
    }
  }

  /**
   * Lists documents based on query parameters
   * @param params - Query parameters for filtering, sorting, and pagination
   * @returns Paginated list of documents
   */
  async listDocuments(
    params: DocumentQueryParams,
  ): Promise<PaginatedDocumentResponse> {
    try {
      logger.info('Listing documents', { params });

      // Validate query parameters
      if (params.page && params.page < 1) {
        throw errorFactory.createValidationError('Page must be greater than 0');
      }
      if (params.limit && params.limit < 1) {
        throw errorFactory.createValidationError('Limit must be greater than 0');
      }

      // Retrieve documents from repository with pagination
      const { data, total } = await this.documentRepository.findAll(params);

      // Generate signed URLs for each document
      const documentsWithUrls = await Promise.all(
        data.map(async (document) => {
          const signedUrl = await this.generateSignedUrl(document.id, {
            expiresIn: 3600,
          });
          return formatDocumentResponse(document, signedUrl);
        }),
      );

      // Calculate pagination metadata
      const page = params.page || 1;
      const limit = params.limit || 20;
      const totalPages = Math.ceil(total / limit);

      logger.info('Documents listed successfully', { count: data.length, total });

      // Return paginated response with documents and pagination metadata
      return {
        data: documentsWithUrls,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (err) {
      logger.error('Failed to list documents', { error: err, params });
      throw err;
    }
  }

  /**
   * Deletes a document from the system
   * @param documentId - The ID of the document to delete
   * @param permanent - Whether to permanently delete the file from storage
   * @returns Success status
   */
  async deleteDocument(documentId: string, permanent: boolean = false): Promise<boolean> {
    try {
      logger.info('Deleting document', { documentId, permanent });

      // Validate document ID
      if (!documentId) {
        throw errorFactory.createValidationError('Document ID is required');
      }

      // Retrieve document from repository
      const document = await this.documentRepository.findById(documentId);

      // If not found, throw NotFoundError
      if (!document) {
        throw errorFactory.createNotFoundError('Document not found', {
          documentId,
        });
      }

      // If permanent is true, delete file from blob storage
      if (permanent) {
        await this.storageService.deleteFile(document.storageUrl);
      }

      // Delete document record from repository
      await this.documentRepository.delete(documentId);

      logger.info('Document deleted successfully', { documentId, permanent });

      // Return true indicating successful deletion
      return true;
    } catch (err) {
      logger.error('Failed to delete document', { error: err, documentId, permanent });
      throw err;
    }
  }

  /**
   * Initiates document analysis
   * @param params - Parameters for document analysis
   * @returns Analysis results or status
   */
  async analyzeDocument(
    params: DocumentAnalysisParams,
  ): Promise<DocumentAnalysisResponse> {
    try {
      logger.info('Initiating document analysis', {
        documentId: params.documentId,
        analysisType: params.analysisType,
      });

      // Validate document ID and analysis type
      if (!params.documentId) {
        throw errorFactory.createValidationError('Document ID is required');
      }
      if (!params.analysisType) {
        throw errorFactory.createValidationError('Analysis type is required');
      }

      // Retrieve document from repository
      const document = await this.documentRepository.findById(params.documentId);

      // If not found, throw NotFoundError
      if (!document) {
        throw errorFactory.createNotFoundError('Document not found', {
          documentId: params.documentId,
        });
      }

      // Check if document is in AVAILABLE status
      if (document.status !== DocumentStatus.AVAILABLE) {
        throw errorFactory.createError(
          'Document is not available for analysis',
          ERROR_CODES.DOCUMENT_PROCESSING_ERROR,
          { documentId: params.documentId, status: document.status },
        );
      }

      // Call analysis service to analyze document
      const analysisResults = await this.analysisService.analyzeDocument(params);

      logger.info('Document analysis initiated successfully', {
        documentId: params.documentId,
        analysisType: params.analysisType,
      });

      // Return analysis response
      return analysisResults;
    } catch (err) {
      logger.error('Failed to initiate document analysis', { error: err, params });
      throw err;
    }
  }

  /**
   * Retrieves document analysis results
   * @param documentId - The ID of the document to retrieve analysis results for
   * @param analysisId - The ID of the analysis to retrieve
   * @returns Analysis results
   */
  async getDocumentAnalysis(
    documentId: string,
    analysisId: string,
  ): Promise<DocumentAnalysisResponse> {
    try {
      logger.info('Retrieving document analysis', { documentId, analysisId });

      // Validate document ID and analysis ID
      if (!documentId) {
        throw errorFactory.createValidationError('Document ID is required');
      }
      if (!analysisId) {
        throw errorFactory.createValidationError('Analysis ID is required');
      }

      // Retrieve document from repository
      const document = await this.documentRepository.findById(documentId);

      // If not found, throw NotFoundError
      if (!document) {
        throw errorFactory.createNotFoundError('Document not found', {
          documentId,
        });
      }

      // Retrieve analysis from analysis service
      const analysisResults = await this.analysisService.getAnalysisById(analysisId);

      logger.info('Document analysis retrieved successfully', { documentId, analysisId });

      // Return analysis response
      return analysisResults;
    } catch (err) {
      logger.error('Failed to retrieve document analysis', { error: err, documentId, analysisId });
      throw err;
    }
  }

  /**
   * Updates document metadata
   * @param documentId - The ID of the document to update
   * @param metadata - The new metadata to set on the document
   * @returns Updated document information
   */
  async updateDocumentMetadata(
    documentId: string,
    metadata: DocumentMetadataUpdateParams,
  ): Promise<DocumentResponse> {
    try {
      logger.info('Updating document metadata', { documentId, metadata });

      // Validate document ID and metadata
      if (!documentId) {
        throw errorFactory.createValidationError('Document ID is required');
      }
      if (!metadata) {
        throw errorFactory.createValidationError('Metadata is required');
      }

      // Retrieve document from repository
      const document = await this.documentRepository.findById(documentId);

      // If not found, throw NotFoundError
      if (!document) {
        throw errorFactory.createNotFoundError('Document not found', {
          documentId,
        });
      }

      // Update document metadata
      await this.documentRepository.update(documentId, { metadata });

      // Generate signed URL for document access
      const signedUrl = await this.generateSignedUrl(documentId, {
        expiresIn: 3600,
      });

      logger.info('Document metadata updated successfully', { documentId });

      // Return formatted document response
      return formatDocumentResponse(document, signedUrl);
    } catch (err) {
      logger.error('Failed to update document metadata', { error: err, documentId, metadata });
      throw err;
    }
  }

  /**
   * Generates a signed URL for document access
   * @param documentId - The ID of the document to generate a signed URL for
   * @param options - Options for the signed URL
   * @returns Signed URL for document access
   */
  async generateSignedUrl(
    documentId: string,
    options: SignedUrlOptions,
  ): Promise<string> {
    try {
      logger.info('Generating signed URL for document', { documentId, options });

      // Validate document ID
      if (!documentId) {
        throw errorFactory.createValidationError('Document ID is required');
      }

      // Retrieve document from repository
      const document = await this.documentRepository.findById(documentId);

      // If not found, throw NotFoundError
      if (!document) {
        throw errorFactory.createNotFoundError('Document not found', {
          documentId,
        });
      }

      // Merge provided options with defaults
      const mergedOptions = {
        ...DEFAULT_SIGNED_URL_OPTIONS,
        ...options,
      };

      // Call storage service to generate signed URL
      const signedUrl = await this.storageService.generateSignedUrl(
        document.storageUrl,
        mergedOptions,
      );

      logger.info('Signed URL generated successfully', { documentId, signedUrl });

      // Return signed URL
      return signedUrl;
    } catch (err) {
      logger.error('Failed to generate signed URL', { error: err, documentId, options });
      throw err;
    }
  }

  /**
   * Downloads a document
   * @param documentId - The ID of the document to download
   * @returns Document data and metadata
   */
  async downloadDocument(
    documentId: string,
  ): Promise<{ data: Buffer; contentType: string; fileName: string }> {
    try {
      logger.info('Downloading document', { documentId });

      // Validate document ID
      if (!documentId) {
        throw errorFactory.createValidationError('Document ID is required');
      }

      // Retrieve document from repository
      const document = await this.documentRepository.findById(documentId);

      // If not found, throw NotFoundError
      if (!document) {
        throw errorFactory.createNotFoundError('Document not found', {
          documentId,
        });
      }

      // Call storage service to download file
      const { data, info } = await this.storageService.downloadFile(document.storageUrl);

      logger.info('Document downloaded successfully', { documentId });

      // Return file data with content type and file name
      return {
        data,
        contentType: info.contentType,
        fileName: document.name,
      };
    } catch (err) {
      logger.error('Failed to download document', { error: err, documentId });
      throw err;
    }
  }

  /**
   * Validates that a document exists and is available
   * @param documentId - The ID of the document to validate
   * @returns The validated document
   */
  async validateDocument(documentId: string): Promise<Document> {
    try {
      logger.debug('Validating document', { documentId });

      // Retrieve document from repository
      const document = await this.documentRepository.findById(documentId);

      // If not found, throw NotFoundError
      if (!document) {
        throw errorFactory.createNotFoundError('Document not found', {
          documentId,
        });
      }

      // Return the document if found
      return document;
    } catch (err) {
      logger.error('Failed to validate document', { error: err, documentId });
      throw err;
    }
  }
}

// Export the service class
export { DocumentService };

// Create and export a default instance for dependency injection
export default new DocumentService(
  new DocumentRepository(),
  new BlobStorageService({
    serviceType: 'storage',
    endpoint: '',
    accessKey: '',
    containerName: '',
    region: '',
    timeout: 30000,
    retryConfig: {
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 10000,
      backoffFactor: 2,
      retryableStatusCodes: [408, 429, 500, 502, 503, 504],
    },
    enabled: true,
  }),
  new DocumentAnalysisService(
    new DocumentRepository(),
    new BlobStorageService({
      serviceType: 'storage',
      endpoint: '',
      accessKey: '',
      containerName: '',
      region: '',
      timeout: 30000,
      retryConfig: {
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 10000,
        backoffFactor: 2,
        retryableStatusCodes: [408, 429, 500, 502, 503, 504],
      },
      enabled: true,
    }),
    new OpenAIService(),
    new AzureFormRecognizerService(),
  ),
);