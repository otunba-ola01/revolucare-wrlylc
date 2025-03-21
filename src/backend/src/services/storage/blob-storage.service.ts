import { put, del, list, head, getUrl } from '@vercel/blob'; // @vercel/blob@^0.14.0
import crypto from 'crypto'; // crypto@built-in
import path from 'path'; // path@built-in
import stream from 'stream'; // stream@built-in

import { blobStorageConfig, documentStoragePaths, getStoragePathForDocumentType, signedUrlConfig } from '../../config/storage';
import { DocumentType, DocumentStorageInfo, SignedUrlOptions } from '../../types/document.types';
import { ExternalServiceType, StorageServiceConfig } from '../../interfaces/external-service.interface';
import { logger } from '../../utils/logger';
import { errorFactory } from '../../utils/error-handler';

// Default signed URL options
const DEFAULT_SIGNED_URL_OPTIONS = {
  expiresIn: signedUrlConfig.expiresIn,
  contentType: signedUrlConfig.contentType,
  responseDisposition: signedUrlConfig.responseDisposition
};

/**
 * Generates a unique storage key for a document
 * @param ownerId - Owner ID of the document
 * @param fileName - Name of the file
 * @param documentType - Type of document
 * @returns Unique storage key for the document
 */
export function generateStorageKey(ownerId: string, fileName: string, documentType: DocumentType): string {
  // Create a timestamp for uniqueness
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  // Get the storage path for the document type
  const storagePath = getStoragePathForDocumentType(documentType);
  
  // Generate a hash from owner ID and filename for additional uniqueness
  const hash = crypto.createHash('md5').update(`${ownerId}${fileName}${timestamp}`).digest('hex').substring(0, 8);
  
  // Combine all elements to create a unique key
  // Format: path/ownerid/timestamp-hash-filename
  const sanitizedFileName = path.basename(fileName).replace(/[^\w\d.-]/g, '_');
  
  return `${storagePath}/${ownerId}/${timestamp}-${hash}-${sanitizedFileName}`;
}

/**
 * Validates the blob storage configuration
 * @throws Error if configuration is invalid
 */
function validateStorageConfig(): void {
  if (!blobStorageConfig.endpoint) {
    throw new Error('Missing required BLOB_STORE_URL environment variable');
  }
  
  if (!blobStorageConfig.accessKey) {
    throw new Error('Missing required BLOB_READ_WRITE_TOKEN environment variable');
  }
  
  if (!blobStorageConfig.containerName) {
    throw new Error('Missing required STORAGE_CONTAINER_NAME environment variable');
  }
}

/**
 * Parses storage metadata into a DocumentStorageInfo object
 * @param metadata - Storage metadata
 * @returns Structured storage information
 */
function parseStorageInfo(metadata: Record<string, any>): DocumentStorageInfo {
  return {
    storageUrl: metadata.url || '',
    contentType: metadata.contentType || 'application/octet-stream',
    size: metadata.size || 0,
    etag: metadata.etag || '',
    uploadedAt: metadata.uploadedAt ? new Date(metadata.uploadedAt) : new Date()
  };
}

/**
 * Service for managing document storage operations using Vercel Blob Storage
 */
export class BlobStorageService {
  private config: StorageServiceConfig;
  private initialized: boolean = false;
  
  /**
   * Creates a new instance of BlobStorageService
   * @param config - Storage service configuration
   */
  constructor(config: StorageServiceConfig) {
    this.config = config;
    this.initialized = false;
    logger.info('BlobStorageService instantiated', { serviceType: config.serviceType });
  }
  
  /**
   * Initializes the blob storage service
   * @throws Error if initialization fails
   */
  async initialize(): Promise<void> {
    try {
      validateStorageConfig();
      this.initialized = true;
      logger.info('BlobStorageService initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize BlobStorageService', { error });
      throw error;
    }
  }
  
  /**
   * Uploads a file to blob storage
   * @param file - File buffer or readable stream
   * @param ownerId - Owner ID of the document
   * @param fileName - Name of the file
   * @param documentType - Type of document
   * @param contentType - MIME type of the file
   * @returns Storage information for the uploaded file
   */
  async uploadFile(
    file: Buffer | ReadableStream,
    ownerId: string,
    fileName: string,
    documentType: DocumentType,
    contentType: string
  ): Promise<DocumentStorageInfo> {
    this.ensureInitialized();
    
    try {
      // Generate a unique storage key
      const storageKey = generateStorageKey(ownerId, fileName, documentType);
      
      logger.debug('Uploading file to blob storage', {
        ownerId,
        fileName,
        documentType,
        contentType,
        storageKey
      });
      
      // Upload to Vercel Blob Storage
      const result = await put(storageKey, file, {
        contentType,
        access: 'private'
      });
      
      logger.info('File uploaded to blob storage successfully', {
        ownerId,
        fileName,
        storageKey,
        size: result.size
      });
      
      // Return storage information
      return parseStorageInfo(result);
    } catch (error) {
      logger.error('Error uploading file to blob storage', {
        ownerId,
        fileName,
        documentType,
        error: error instanceof Error ? error.message : String(error)
      });
      
      throw errorFactory.createError(
        'Failed to upload file to storage',
        ErrorCodes.FILE_UPLOAD_ERROR,
        { ownerId, fileName, documentType },
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
  
  /**
   * Downloads a file from blob storage
   * @param storageKey - Storage key of the file
   * @returns File data and storage information
   */
  async downloadFile(storageKey: string): Promise<{ data: Buffer; info: DocumentStorageInfo }> {
    this.ensureInitialized();
    
    try {
      logger.debug('Downloading file from blob storage', { storageKey });
      
      // Generate a signed URL for downloading
      const signedUrl = await getUrl(storageKey, {
        download: true
      });
      
      // Fetch the file content
      const response = await fetch(signedUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
      }
      
      // Get file metadata
      const metadata = await head(storageKey);
      
      // Convert response to buffer
      const data = Buffer.from(await response.arrayBuffer());
      
      logger.info('File downloaded from blob storage successfully', {
        storageKey,
        size: data.length
      });
      
      // Return file data and storage information
      return {
        data,
        info: parseStorageInfo(metadata)
      };
    } catch (error) {
      logger.error('Error downloading file from blob storage', {
        storageKey,
        error: error instanceof Error ? error.message : String(error)
      });
      
      throw errorFactory.createError(
        'Failed to download file from storage',
        ErrorCodes.DOCUMENT_PROCESSING_ERROR,
        { storageKey },
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
  
  /**
   * Deletes a file from blob storage
   * @param storageKey - Storage key of the file
   * @returns True if deletion was successful
   */
  async deleteFile(storageKey: string): Promise<boolean> {
    this.ensureInitialized();
    
    try {
      logger.debug('Deleting file from blob storage', { storageKey });
      
      // Delete from Vercel Blob Storage
      await del(storageKey);
      
      logger.info('File deleted from blob storage successfully', { storageKey });
      
      return true;
    } catch (error) {
      logger.error('Error deleting file from blob storage', {
        storageKey,
        error: error instanceof Error ? error.message : String(error)
      });
      
      throw errorFactory.createError(
        'Failed to delete file from storage',
        ErrorCodes.DOCUMENT_PROCESSING_ERROR,
        { storageKey },
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
  
  /**
   * Gets metadata for a file in blob storage
   * @param storageKey - Storage key of the file
   * @returns Storage information for the file
   */
  async getFileMetadata(storageKey: string): Promise<DocumentStorageInfo> {
    this.ensureInitialized();
    
    try {
      logger.debug('Getting file metadata from blob storage', { storageKey });
      
      // Get metadata from Vercel Blob Storage
      const metadata = await head(storageKey);
      
      logger.debug('Retrieved file metadata from blob storage', {
        storageKey,
        metadata
      });
      
      // Return storage information
      return parseStorageInfo(metadata);
    } catch (error) {
      logger.error('Error getting file metadata from blob storage', {
        storageKey,
        error: error instanceof Error ? error.message : String(error)
      });
      
      throw errorFactory.createError(
        'Failed to get file metadata from storage',
        ErrorCodes.DOCUMENT_PROCESSING_ERROR,
        { storageKey },
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
  
  /**
   * Generates a signed URL for accessing a file
   * @param storageKey - Storage key of the file
   * @param options - Options for the signed URL
   * @returns Signed URL for accessing the file
   */
  async generateSignedUrl(storageKey: string, options?: SignedUrlOptions): Promise<string> {
    this.ensureInitialized();
    
    try {
      logger.debug('Generating signed URL for blob storage file', {
        storageKey,
        options
      });
      
      // Merge provided options with defaults
      const mergedOptions = {
        ...DEFAULT_SIGNED_URL_OPTIONS,
        ...options
      };
      
      // Generate signed URL from Vercel Blob Storage
      const signedUrl = await getUrl(storageKey, {
        download: mergedOptions.responseDisposition === 'attachment',
        expires: Math.floor(Date.now() / 1000) + mergedOptions.expiresIn
      });
      
      logger.debug('Generated signed URL for blob storage file', {
        storageKey,
        expires: Math.floor(Date.now() / 1000) + mergedOptions.expiresIn
      });
      
      return signedUrl;
    } catch (error) {
      logger.error('Error generating signed URL for blob storage file', {
        storageKey,
        options,
        error: error instanceof Error ? error.message : String(error)
      });
      
      throw errorFactory.createError(
        'Failed to generate signed URL for file',
        ErrorCodes.DOCUMENT_PROCESSING_ERROR,
        { storageKey },
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
  
  /**
   * Lists files in a specific path in blob storage
   * @param prefix - Path prefix to list files from
   * @param limit - Maximum number of files to return
   * @param cursor - Pagination cursor for continuing a previous list operation
   * @returns List of files with pagination info
   */
  async listFiles(
    prefix: string,
    limit: number = 100,
    cursor?: string
  ): Promise<{ files: DocumentStorageInfo[]; hasMore: boolean; cursor?: string }> {
    this.ensureInitialized();
    
    try {
      logger.debug('Listing files in blob storage', {
        prefix,
        limit,
        cursor
      });
      
      // List files from Vercel Blob Storage
      const result = await list({
        prefix,
        limit,
        cursor
      });
      
      // Parse storage information for each file
      const files = result.blobs.map(blob => parseStorageInfo(blob));
      
      logger.info('Listed files from blob storage successfully', {
        prefix,
        count: files.length,
        hasMore: result.hasMore
      });
      
      // Return files with pagination information
      return {
        files,
        hasMore: result.hasMore,
        cursor: result.cursor
      };
    } catch (error) {
      logger.error('Error listing files from blob storage', {
        prefix,
        limit,
        cursor,
        error: error instanceof Error ? error.message : String(error)
      });
      
      throw errorFactory.createError(
        'Failed to list files from storage',
        ErrorCodes.DOCUMENT_PROCESSING_ERROR,
        { prefix },
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
  
  /**
   * Checks if a file exists in blob storage
   * @param storageKey - Storage key of the file
   * @returns True if the file exists
   */
  async checkFileExists(storageKey: string): Promise<boolean> {
    this.ensureInitialized();
    
    try {
      logger.debug('Checking if file exists in blob storage', { storageKey });
      
      // Attempt to get file metadata
      await head(storageKey);
      
      logger.debug('File exists in blob storage', { storageKey });
      
      return true;
    } catch (error) {
      // If the error is a 404, the file doesn't exist (which is not an error for this function)
      if (error instanceof Error && error.message.includes('404')) {
        logger.debug('File does not exist in blob storage', { storageKey });
        return false;
      }
      
      // For other errors, log and rethrow
      logger.error('Error checking if file exists in blob storage', {
        storageKey,
        error: error instanceof Error ? error.message : String(error)
      });
      
      throw errorFactory.createError(
        'Failed to check if file exists in storage',
        ErrorCodes.DOCUMENT_PROCESSING_ERROR,
        { storageKey },
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
  
  /**
   * Ensures the service is initialized before operations
   * @throws Error if the service is not initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw errorFactory.createInternalServerError(
        'BlobStorageService must be initialized before use',
        { serviceType: this.config.serviceType }
      );
    }
  }
}