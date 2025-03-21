import { DocumentType, DocumentStorageInfo, SignedUrlOptions } from '../../src/types/document.types';
import { StorageServiceConfig, ExternalServiceType } from '../../src/interfaces/external-service.interface';
import { documentStoragePaths, getStoragePathForDocumentType, signedUrlConfig } from '../../src/config/storage';
import { logger } from '../../src/utils/logger';
import { errorFactory } from '../../src/utils/error-handler';
import * as crypto from 'crypto'; // built-in

/**
 * Default options for signed URL generation, matching the real implementation
 */
const DEFAULT_SIGNED_URL_OPTIONS: SignedUrlOptions = {
  expiresIn: signedUrlConfig.expiresIn,
  contentType: signedUrlConfig.contentType,
  responseDisposition: signedUrlConfig.responseDisposition
};

/**
 * In-memory storage for mock file data
 */
const mockStorageData = new Map<string, { data: Buffer; info: DocumentStorageInfo }>();

/**
 * Generates a unique storage key for a document in the mock storage
 * 
 * @param ownerId - Owner ID of the document
 * @param fileName - Name of the file
 * @param documentType - Type of document
 * @returns Unique storage key for the document
 */
export function generateMockStorageKey(ownerId: string, fileName: string, documentType: DocumentType): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const path = getStoragePathForDocumentType(documentType);
  const hash = crypto.createHash('md5').update(`${ownerId}${fileName}${timestamp}`).digest('hex').substring(0, 8);
  
  return `${path}/${ownerId}/${timestamp}-${hash}-${fileName}`;
}

/**
 * Creates mock storage information for a document
 * 
 * @param storageKey - Storage key for the document
 * @param contentType - Content type of the document
 * @param size - Size of the document in bytes
 * @returns Mock storage information
 */
export function createMockStorageInfo(storageKey: string, contentType: string, size: number): DocumentStorageInfo {
  const mockUrl = `https://mock-storage.revolucare.com/${storageKey}`;
  const etag = crypto.randomBytes(8).toString('hex');
  
  return {
    storageUrl: mockUrl,
    contentType,
    size,
    etag,
    uploadedAt: new Date()
  };
}

/**
 * Mock implementation of the BlobStorageService for testing purposes
 * This class simulates the behavior of the Vercel Blob Storage service without making real API calls
 */
export class MockBlobStorageService {
  private config: StorageServiceConfig;
  private initialized: boolean = false;
  private storageData: Map<string, { data: Buffer; info: DocumentStorageInfo }>;

  /**
   * Creates a new instance of the mock blob storage service
   * 
   * @param config - Storage service configuration
   */
  constructor(config: StorageServiceConfig) {
    this.config = config;
    this.storageData = mockStorageData;
    this.initialized = false;

    logger.info('MockBlobStorageService initialized', {
      serviceType: ExternalServiceType.STORAGE,
      isMock: true
    });
  }

  /**
   * Initializes the mock blob storage service
   * 
   * @returns Promise that resolves when initialization is complete
   */
  async initialize(): Promise<void> {
    this.initialized = true;
    logger.info('MockBlobStorageService successfully initialized');
  }

  /**
   * Simulates uploading a file to blob storage
   * 
   * @param file - File data as Buffer or ReadableStream
   * @param ownerId - Owner ID of the document
   * @param fileName - Name of the file
   * @param documentType - Type of document
   * @param contentType - Content type of the file
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

    // Convert ReadableStream to Buffer if needed
    let fileBuffer: Buffer;
    if (Buffer.isBuffer(file)) {
      fileBuffer = file;
    } else {
      // In a real implementation, we would need to convert ReadableStream to Buffer
      // For the mock, we'll just create a simple buffer
      fileBuffer = Buffer.from('Mock data for ReadableStream');
    }

    // Generate a unique storage key
    const storageKey = generateMockStorageKey(ownerId, fileName, documentType);
    
    // Create storage info
    const storageInfo = createMockStorageInfo(storageKey, contentType, fileBuffer.length);
    
    // Store in our mock storage
    this.storageData.set(storageKey, {
      data: fileBuffer,
      info: storageInfo
    });

    logger.info('File uploaded to mock storage', {
      storageKey,
      fileName,
      documentType,
      size: fileBuffer.length
    });

    return storageInfo;
  }

  /**
   * Simulates downloading a file from blob storage
   * 
   * @param storageKey - Key of the file to download
   * @returns File data and storage information
   */
  async downloadFile(storageKey: string): Promise<{ data: Buffer; info: DocumentStorageInfo }> {
    this.ensureInitialized();

    // Check if file exists
    if (!this.storageData.has(storageKey)) {
      throw errorFactory.createNotFoundError(`File not found in mock storage: ${storageKey}`, {
        storageKey
      });
    }

    const fileData = this.storageData.get(storageKey)!;
    
    logger.info('File downloaded from mock storage', { storageKey });
    
    return fileData;
  }

  /**
   * Simulates deleting a file from blob storage
   * 
   * @param storageKey - Key of the file to delete
   * @returns True if deletion was successful
   */
  async deleteFile(storageKey: string): Promise<boolean> {
    this.ensureInitialized();

    // Check if file exists
    if (!this.storageData.has(storageKey)) {
      throw errorFactory.createNotFoundError(`File not found in mock storage: ${storageKey}`, {
        storageKey
      });
    }

    // Delete the file
    this.storageData.delete(storageKey);
    
    logger.info('File deleted from mock storage', { storageKey });
    
    return true;
  }

  /**
   * Simulates getting metadata for a file in blob storage
   * 
   * @param storageKey - Key of the file to get metadata for
   * @returns Storage information for the file
   */
  async getFileMetadata(storageKey: string): Promise<DocumentStorageInfo> {
    this.ensureInitialized();

    // Check if file exists
    if (!this.storageData.has(storageKey)) {
      throw errorFactory.createNotFoundError(`File not found in mock storage: ${storageKey}`, {
        storageKey
      });
    }

    const fileData = this.storageData.get(storageKey)!;
    
    logger.info('File metadata retrieved from mock storage', { storageKey });
    
    return fileData.info;
  }

  /**
   * Simulates generating a signed URL for accessing a file
   * 
   * @param storageKey - Key of the file to generate URL for
   * @param options - Options for URL generation
   * @returns Mock signed URL
   */
  async generateSignedUrl(storageKey: string, options?: SignedUrlOptions): Promise<string> {
    this.ensureInitialized();

    // Check if file exists
    if (!this.storageData.has(storageKey)) {
      throw errorFactory.createNotFoundError(`File not found in mock storage: ${storageKey}`, {
        storageKey
      });
    }

    // Merge options with defaults
    const mergedOptions = {
      ...DEFAULT_SIGNED_URL_OPTIONS,
      ...options
    };

    // Generate a mock signed URL
    const expiresAt = Math.floor(Date.now() / 1000) + mergedOptions.expiresIn;
    const mockSignedUrl = `https://mock-storage.revolucare.com/${storageKey}?signature=mockSignature&expires=${expiresAt}`;
    
    logger.info('Signed URL generated for mock storage', { 
      storageKey,
      expiresAt: new Date(expiresAt * 1000).toISOString()
    });
    
    return mockSignedUrl;
  }

  /**
   * Simulates listing files in blob storage with pagination
   * 
   * @param prefix - Path prefix to filter files
   * @param limit - Maximum number of files to return
   * @param cursor - Pagination cursor
   * @returns List of files with pagination information
   */
  async listFiles(
    prefix: string,
    limit: number = 100,
    cursor?: string
  ): Promise<{ files: DocumentStorageInfo[]; hasMore: boolean; cursor?: string }> {
    this.ensureInitialized();

    // Filter files by prefix
    const matchingFiles: [string, { data: Buffer; info: DocumentStorageInfo }][] = 
      Array.from(this.storageData.entries())
        .filter(([key]) => key.startsWith(prefix));
    
    // Sort by upload date
    matchingFiles.sort((a, b) => 
      a[1].info.uploadedAt.getTime() - b[1].info.uploadedAt.getTime());
    
    // Apply pagination
    let startIndex = 0;
    if (cursor) {
      startIndex = matchingFiles.findIndex(([key]) => key === cursor) + 1;
      if (startIndex <= 0) startIndex = 0;
    }
    
    const paginatedFiles = matchingFiles.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < matchingFiles.length;
    
    // Create next cursor if there are more results
    const nextCursor = hasMore ? paginatedFiles[paginatedFiles.length - 1][0] : undefined;
    
    // Extract storage info
    const files = paginatedFiles.map(([_, file]) => file.info);
    
    logger.info('Files listed from mock storage', { 
      prefix, 
      limit, 
      count: files.length,
      hasMore
    });
    
    return {
      files,
      hasMore,
      cursor: nextCursor
    };
  }

  /**
   * Simulates checking if a file exists in blob storage
   * 
   * @param storageKey - Key of the file to check
   * @returns True if the file exists
   */
  async checkFileExists(storageKey: string): Promise<boolean> {
    this.ensureInitialized();
    
    const exists = this.storageData.has(storageKey);
    
    logger.debug('Checked file existence in mock storage', { 
      storageKey, 
      exists 
    });
    
    return exists;
  }

  /**
   * Ensures the service is initialized before operations
   * @throws Error if the service is not initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw errorFactory.createInternalServerError('MockBlobStorageService not initialized');
    }
  }

  /**
   * Resets the mock storage data - useful for tests
   */
  reset(): void {
    this.storageData.clear();
    logger.debug('Mock storage data has been reset');
  }

  /**
   * Sets predefined mock data for testing specific scenarios
   * 
   * @param mockData - Map of mock storage data
   */
  setMockData(mockData: Map<string, { data: Buffer; info: DocumentStorageInfo }>): void {
    this.storageData = mockData;
    logger.debug('Mock storage data has been set', { count: mockData.size });
  }
}