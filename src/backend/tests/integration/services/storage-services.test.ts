import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

import { BlobStorageService, generateStorageKey } from '../../../src/services/storage/blob-storage.service';
import { DocumentType, DocumentStorageInfo, SignedUrlOptions } from '../../../src/types/document.types';
import { StorageServiceConfig, ExternalServiceType } from '../../../src/interfaces/external-service.interface';
import { blobStorageConfig, documentStoragePaths } from '../../../src/config/storage';
import { DOCUMENT_TYPES } from '../../../src/constants/document-types';
import { MockBlobStorageService } from '../../mocks/storage.mock';
import { mockDocuments } from '../../fixtures/documents.fixture';

// Test files and constants
const TEST_FILE_PATH = path.join(__dirname, '../../fixtures/test-files/sample.pdf');
const TEST_OWNER_ID = 'test-user-123';
const TEST_FILE_NAME = 'sample.pdf';
const TEST_CONTENT_TYPE = 'application/pdf';

/**
 * Creates a test file buffer for storage tests
 * @param size Size of the test file in bytes
 * @returns Buffer containing test data of specified size
 */
function createTestFile(size: number): Buffer {
  const buffer = Buffer.alloc(size);
  // Fill buffer with random data
  for (let i = 0; i < size; i++) {
    buffer[i] = Math.floor(Math.random() * 256);
  }
  return buffer;
}

/**
 * Creates a readable stream from a buffer for testing stream uploads
 * @param buffer Buffer to convert to a readable stream
 * @returns Readable stream containing the buffer data
 */
function createReadableStream(buffer: Buffer): Readable {
  const readable = new Readable();
  readable._read = () => {}; // Required implementation
  readable.push(buffer);
  readable.push(null); // Signal the end of the stream
  return readable;
}

describe('BlobStorageService Integration Tests', () => {
  let storageService: BlobStorageService;
  let testFileBuffer: Buffer;

  beforeAll(async () => {
    // Create storage service configuration
    const config: StorageServiceConfig = {
      serviceType: ExternalServiceType.STORAGE,
      endpoint: blobStorageConfig.endpoint,
      accessKey: blobStorageConfig.accessKey,
      containerName: blobStorageConfig.containerName,
      region: blobStorageConfig.region,
      timeout: 30000,
      retryConfig: {
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 10000,
        backoffFactor: 2,
        retryableStatusCodes: [408, 429, 500, 502, 503, 504]
      },
      enabled: true
    };

    // Initialize the storage service
    storageService = new BlobStorageService(config);
    await storageService.initialize();

    // Read or create test file
    if (fs.existsSync(TEST_FILE_PATH)) {
      testFileBuffer = fs.readFileSync(TEST_FILE_PATH);
    } else {
      // Create a test file if it doesn't exist
      testFileBuffer = createTestFile(1024 * 10); // 10KB test file
      // Create the directory if it doesn't exist
      const dir = path.dirname(TEST_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(TEST_FILE_PATH, testFileBuffer);
    }
  });

  afterAll(async () => {
    // Clean up any test files created during tests if needed
    // Note: We might want to keep the test file for reuse
  });

  it('should initialize successfully', async () => {
    expect(storageService['initialized']).toBe(true);
  });

  it('should upload a file buffer successfully', async () => {
    const result = await storageService.uploadFile(
      testFileBuffer,
      TEST_OWNER_ID,
      TEST_FILE_NAME,
      DOCUMENT_TYPES.MEDICAL_RECORD,
      TEST_CONTENT_TYPE
    );

    expect(result).toBeDefined();
    expect(result.storageUrl).toBeDefined();
    expect(result.contentType).toBe(TEST_CONTENT_TYPE);
    expect(result.size).toBe(testFileBuffer.length);
    expect(result.etag).toBeDefined();
    expect(result.uploadedAt).toBeInstanceOf(Date);
  });

  it('should upload a file stream successfully', async () => {
    const fileStream = createReadableStream(testFileBuffer);
    
    const result = await storageService.uploadFile(
      fileStream,
      TEST_OWNER_ID,
      TEST_FILE_NAME,
      DOCUMENT_TYPES.ASSESSMENT,
      TEST_CONTENT_TYPE
    );

    expect(result).toBeDefined();
    expect(result.storageUrl).toBeDefined();
    expect(result.contentType).toBe(TEST_CONTENT_TYPE);
    expect(result.size).toBe(testFileBuffer.length);
    expect(result.etag).toBeDefined();
    expect(result.uploadedAt).toBeInstanceOf(Date);
  });

  it('should download a file successfully', async () => {
    // First upload a file to get a storage key
    const uploadResult = await storageService.uploadFile(
      testFileBuffer,
      TEST_OWNER_ID,
      TEST_FILE_NAME,
      DOCUMENT_TYPES.MEDICAL_RECORD,
      TEST_CONTENT_TYPE
    );

    // Extract the storage key from the URL
    const storageUrl = uploadResult.storageUrl;
    const storageKey = new URL(storageUrl).pathname.substring(1); // Remove leading slash

    // Download the file
    const downloadResult = await storageService.downloadFile(storageKey);

    expect(downloadResult).toBeDefined();
    expect(downloadResult.data).toBeInstanceOf(Buffer);
    expect(downloadResult.data.length).toBe(testFileBuffer.length);
    expect(downloadResult.info).toBeDefined();
    expect(downloadResult.info.contentType).toBe(TEST_CONTENT_TYPE);
    expect(downloadResult.info.size).toBe(testFileBuffer.length);
  });

  it('should delete a file successfully', async () => {
    // First upload a file to get a storage key
    const uploadResult = await storageService.uploadFile(
      testFileBuffer,
      TEST_OWNER_ID,
      TEST_FILE_NAME,
      DOCUMENT_TYPES.MEDICAL_RECORD,
      TEST_CONTENT_TYPE
    );

    // Extract the storage key from the URL
    const storageUrl = uploadResult.storageUrl;
    const storageKey = new URL(storageUrl).pathname.substring(1); // Remove leading slash

    // Delete the file
    const deleteResult = await storageService.deleteFile(storageKey);
    expect(deleteResult).toBe(true);

    // Verify the file no longer exists
    const exists = await storageService.checkFileExists(storageKey);
    expect(exists).toBe(false);
  });

  it('should get file metadata successfully', async () => {
    // First upload a file to get a storage key
    const uploadResult = await storageService.uploadFile(
      testFileBuffer,
      TEST_OWNER_ID,
      TEST_FILE_NAME,
      DOCUMENT_TYPES.MEDICAL_RECORD,
      TEST_CONTENT_TYPE
    );

    // Extract the storage key from the URL
    const storageUrl = uploadResult.storageUrl;
    const storageKey = new URL(storageUrl).pathname.substring(1); // Remove leading slash

    // Get file metadata
    const metadataResult = await storageService.getFileMetadata(storageKey);

    expect(metadataResult).toBeDefined();
    expect(metadataResult.contentType).toBe(TEST_CONTENT_TYPE);
    expect(metadataResult.size).toBe(testFileBuffer.length);
    expect(metadataResult.storageUrl).toBeDefined();
    expect(metadataResult.etag).toBeDefined();
    expect(metadataResult.uploadedAt).toBeInstanceOf(Date);
  });

  it('should generate a signed URL successfully', async () => {
    // First upload a file to get a storage key
    const uploadResult = await storageService.uploadFile(
      testFileBuffer,
      TEST_OWNER_ID,
      TEST_FILE_NAME,
      DOCUMENT_TYPES.MEDICAL_RECORD,
      TEST_CONTENT_TYPE
    );

    // Extract the storage key from the URL
    const storageUrl = uploadResult.storageUrl;
    const storageKey = new URL(storageUrl).pathname.substring(1); // Remove leading slash

    // Generate signed URL
    const signedUrl = await storageService.generateSignedUrl(storageKey);

    expect(signedUrl).toBeDefined();
    expect(typeof signedUrl).toBe('string');
    expect(signedUrl).toContain(storageKey);
  });

  it('should list files with a prefix successfully', async () => {
    // Upload multiple test files with different prefixes
    const prefix1 = `${documentStoragePaths.medical_record}/${TEST_OWNER_ID}`;
    const prefix2 = `${documentStoragePaths.assessment}/${TEST_OWNER_ID}`;

    // Upload files with different prefixes
    await storageService.uploadFile(
      testFileBuffer,
      TEST_OWNER_ID,
      'file1.pdf',
      DOCUMENT_TYPES.MEDICAL_RECORD,
      TEST_CONTENT_TYPE
    );
    await storageService.uploadFile(
      testFileBuffer,
      TEST_OWNER_ID,
      'file2.pdf',
      DOCUMENT_TYPES.ASSESSMENT,
      TEST_CONTENT_TYPE
    );

    // List files with the first prefix
    const listResult1 = await storageService.listFiles(prefix1, 10);
    expect(listResult1).toBeDefined();
    expect(listResult1.files.length).toBeGreaterThan(0);
    expect(listResult1.files.every(file => file.storageUrl.includes(prefix1))).toBe(true);

    // List files with the second prefix
    const listResult2 = await storageService.listFiles(prefix2, 10);
    expect(listResult2).toBeDefined();
    expect(listResult2.files.length).toBeGreaterThan(0);
    expect(listResult2.files.every(file => file.storageUrl.includes(prefix2))).toBe(true);

    // Test pagination
    const paginationTest = await storageService.listFiles(prefix1, 1);
    if (paginationTest.hasMore) {
      const nextPage = await storageService.listFiles(prefix1, 1, paginationTest.cursor);
      expect(nextPage).toBeDefined();
      expect(nextPage.files.length).toBeGreaterThan(0);
    }
  });

  it('should check if a file exists successfully', async () => {
    // First upload a file to get a storage key
    const uploadResult = await storageService.uploadFile(
      testFileBuffer,
      TEST_OWNER_ID,
      TEST_FILE_NAME,
      DOCUMENT_TYPES.MEDICAL_RECORD,
      TEST_CONTENT_TYPE
    );

    // Extract the storage key from the URL
    const storageUrl = uploadResult.storageUrl;
    const storageKey = new URL(storageUrl).pathname.substring(1); // Remove leading slash

    // Check if file exists
    const exists = await storageService.checkFileExists(storageKey);
    expect(exists).toBe(true);

    // Check if non-existent file exists
    const nonExistentKey = storageKey + '-nonexistent';
    const nonExists = await storageService.checkFileExists(nonExistentKey);
    expect(nonExists).toBe(false);
  });

  it('should throw an error when not initialized', async () => {
    // Create a new service instance without initializing
    const uninitializedService = new BlobStorageService({
      serviceType: ExternalServiceType.STORAGE,
      endpoint: blobStorageConfig.endpoint,
      accessKey: blobStorageConfig.accessKey,
      containerName: blobStorageConfig.containerName,
      region: blobStorageConfig.region,
      timeout: 30000,
      retryConfig: {
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 10000,
        backoffFactor: 2,
        retryableStatusCodes: [408, 429, 500, 502, 503, 504]
      },
      enabled: true
    });

    // Attempt to upload a file
    await expect(
      uninitializedService.uploadFile(
        testFileBuffer,
        TEST_OWNER_ID,
        TEST_FILE_NAME,
        DOCUMENT_TYPES.MEDICAL_RECORD,
        TEST_CONTENT_TYPE
      )
    ).rejects.toThrow();

    // Attempt to download a file
    await expect(
      uninitializedService.downloadFile('test-key')
    ).rejects.toThrow();

    // Attempt to delete a file
    await expect(
      uninitializedService.deleteFile('test-key')
    ).rejects.toThrow();
  });

  it('should handle errors from the storage provider', async () => {
    // Mock an error from the storage provider
    jest.spyOn(globalThis, 'fetch').mockImplementationOnce(() => {
      throw new Error('Simulated storage provider error');
    });

    // Attempt to download a non-existent file
    await expect(
      storageService.downloadFile('non-existent-key')
    ).rejects.toThrow();

    // Restore original implementation
    jest.restoreAllMocks();
  });
});

describe('MockBlobStorageService Tests', () => {
  let mockStorageService: MockBlobStorageService;
  let testFileBuffer: Buffer;

  beforeAll(async () => {
    // Create mock storage service configuration
    const config: StorageServiceConfig = {
      serviceType: ExternalServiceType.STORAGE,
      endpoint: 'mock-endpoint',
      accessKey: 'mock-key',
      containerName: 'mock-container',
      region: 'mock-region',
      timeout: 30000,
      retryConfig: {
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 10000,
        backoffFactor: 2,
        retryableStatusCodes: [408, 429, 500, 502, 503, 504]
      },
      enabled: true
    };

    // Initialize the mock storage service
    mockStorageService = new MockBlobStorageService(config);
    await mockStorageService.initialize();

    // Create test file data
    testFileBuffer = createTestFile(1024 * 10); // 10KB test file
  });

  afterEach(() => {
    // Reset the mock storage service after each test
    mockStorageService.reset();
  });

  it('should provide the same interface as the real service', () => {
    // Check that all methods from the real service are implemented in the mock
    const mockMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(mockStorageService))
      .filter(name => typeof (mockStorageService as any)[name] === 'function');
    const expectedMethods = [
      'initialize',
      'uploadFile',
      'downloadFile',
      'deleteFile',
      'getFileMetadata',
      'generateSignedUrl',
      'listFiles',
      'checkFileExists'
    ];

    expectedMethods.forEach(method => {
      expect(mockMethods).toContain(method);
    });
  });

  it('should store and retrieve files correctly', async () => {
    // Upload a test file
    const uploadResult = await mockStorageService.uploadFile(
      testFileBuffer,
      TEST_OWNER_ID,
      TEST_FILE_NAME,
      DOCUMENT_TYPES.MEDICAL_RECORD,
      TEST_CONTENT_TYPE
    );

    // Extract the storage key from the URL
    const storageUrl = uploadResult.storageUrl;
    const storageKey = new URL(storageUrl).pathname.substring(1); // Remove leading slash

    // Download the file
    const downloadResult = await mockStorageService.downloadFile(storageKey);

    expect(downloadResult).toBeDefined();
    expect(downloadResult.data.length).toBe(testFileBuffer.length);
    expect(downloadResult.info.contentType).toBe(TEST_CONTENT_TYPE);
  });

  it('should handle file deletion correctly', async () => {
    // Upload a test file
    const uploadResult = await mockStorageService.uploadFile(
      testFileBuffer,
      TEST_OWNER_ID,
      TEST_FILE_NAME,
      DOCUMENT_TYPES.MEDICAL_RECORD,
      TEST_CONTENT_TYPE
    );

    // Extract the storage key from the URL
    const storageUrl = uploadResult.storageUrl;
    const storageKey = new URL(storageUrl).pathname.substring(1); // Remove leading slash

    // Delete the file
    const deleteResult = await mockStorageService.deleteFile(storageKey);
    expect(deleteResult).toBe(true);

    // Verify the file no longer exists
    await expect(
      mockStorageService.downloadFile(storageKey)
    ).rejects.toThrow();
  });

  it('should reset mock data when requested', async () => {
    // Upload multiple files
    await mockStorageService.uploadFile(
      testFileBuffer,
      TEST_OWNER_ID,
      'file1.pdf',
      DOCUMENT_TYPES.MEDICAL_RECORD,
      TEST_CONTENT_TYPE
    );
    await mockStorageService.uploadFile(
      testFileBuffer,
      TEST_OWNER_ID,
      'file2.pdf',
      DOCUMENT_TYPES.ASSESSMENT,
      TEST_CONTENT_TYPE
    );

    // List files to verify they exist
    const listResult = await mockStorageService.listFiles('', 10);
    expect(listResult.files.length).toBe(2);

    // Reset the mock storage
    mockStorageService.reset();

    // Verify storage is empty
    const emptyResult = await mockStorageService.listFiles('', 10);
    expect(emptyResult.files.length).toBe(0);
  });

  it('should allow setting predefined mock data', async () => {
    // Create predefined mock data
    const mockData = new Map<string, { data: Buffer; info: DocumentStorageInfo }>();
    const mockStorageInfo: DocumentStorageInfo = {
      storageUrl: 'https://mock-storage.revolucare.com/test-key',
      contentType: TEST_CONTENT_TYPE,
      size: testFileBuffer.length,
      etag: 'mock-etag',
      uploadedAt: new Date()
    };
    mockData.set('test-key', { data: testFileBuffer, info: mockStorageInfo });

    // Set the mock data
    mockStorageService.setMockData(mockData);

    // Verify the mock data is available
    const downloadResult = await mockStorageService.downloadFile('test-key');
    expect(downloadResult).toBeDefined();
    expect(downloadResult.data.length).toBe(testFileBuffer.length);
    expect(downloadResult.info.contentType).toBe(TEST_CONTENT_TYPE);
  });
});

describe('generateStorageKey Function Tests', () => {
  it('should generate consistent keys for the same inputs', () => {
    const key1 = generateStorageKey(TEST_OWNER_ID, TEST_FILE_NAME, DOCUMENT_TYPES.MEDICAL_RECORD);
    const key2 = generateStorageKey(TEST_OWNER_ID, TEST_FILE_NAME, DOCUMENT_TYPES.MEDICAL_RECORD);

    // The timestamps in the keys will be different, so we can't directly compare the entire string
    // Instead, check that the key structure is consistent
    expect(key1).toContain(documentStoragePaths.medical_record);
    expect(key1).toContain(TEST_OWNER_ID);
    expect(key1).toContain(TEST_FILE_NAME);

    // When generated simultaneously, keys should be different due to timestamps
    expect(key1).not.toBe(key2);
  });

  it('should generate different keys for different inputs', () => {
    const key1 = generateStorageKey(TEST_OWNER_ID, TEST_FILE_NAME, DOCUMENT_TYPES.MEDICAL_RECORD);
    const key2 = generateStorageKey(TEST_OWNER_ID + '-different', TEST_FILE_NAME, DOCUMENT_TYPES.MEDICAL_RECORD);
    const key3 = generateStorageKey(TEST_OWNER_ID, TEST_FILE_NAME + '-different', DOCUMENT_TYPES.MEDICAL_RECORD);
    const key4 = generateStorageKey(TEST_OWNER_ID, TEST_FILE_NAME, DOCUMENT_TYPES.ASSESSMENT);

    expect(key1).not.toBe(key2);
    expect(key1).not.toBe(key3);
    expect(key1).not.toBe(key4);
  });

  it('should include the correct document type path', () => {
    const medicalRecordKey = generateStorageKey(TEST_OWNER_ID, TEST_FILE_NAME, DOCUMENT_TYPES.MEDICAL_RECORD);
    const assessmentKey = generateStorageKey(TEST_OWNER_ID, TEST_FILE_NAME, DOCUMENT_TYPES.ASSESSMENT);
    const carePlanKey = generateStorageKey(TEST_OWNER_ID, TEST_FILE_NAME, DOCUMENT_TYPES.CARE_PLAN);

    expect(medicalRecordKey).toContain(documentStoragePaths.medical_record);
    expect(assessmentKey).toContain(documentStoragePaths.assessment);
    expect(carePlanKey).toContain(documentStoragePaths.care_plan);
  });
});