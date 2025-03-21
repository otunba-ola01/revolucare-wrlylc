/**
 * Storage Configuration Module
 * 
 * This module provides configuration for document storage in the Revolucare platform.
 * It defines storage parameters, paths, and options for secure document management
 * using Vercel Blob Storage.
 */

// dotenv v16.0.3
import dotenv from 'dotenv';

// Initialize environment variables
dotenv.config();

/**
 * Blob storage connection configuration
 */
export const blobStorageConfig = {
  endpoint: process.env.BLOB_STORE_URL || '',
  accessKey: process.env.BLOB_READ_WRITE_TOKEN || '',
  containerName: process.env.STORAGE_CONTAINER_NAME || 'revolucare-documents',
  region: 'auto'
};

/**
 * Storage limitations configuration
 */
export const storageLimits = {
  // Default maximum file size in MB
  maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB || '25', 10),
  
  // Allowed file types
  allowedMimeTypes: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'image/jpeg',
    'image/png',
    'image/tiff',
    'application/xml',
    'application/json'
  ],
  
  // Document type specific size limits in MB
  documentTypeLimits: {
    medical_record: 50,
    assessment: 30,
    care_plan: 20,
    services_plan: 20,
    prescription: 10,
    insurance: 15,
    consent_form: 10,
    identification: 10,
    provider_credential: 25,
    other: 15
  }
};

/**
 * Document storage path mapping
 */
export const documentStoragePaths = {
  medical_record: 'medical-records',
  assessment: 'assessments',
  care_plan: 'care-plans',
  services_plan: 'services-plans',
  prescription: 'prescriptions',
  insurance: 'insurance',
  consent_form: 'consent-forms',
  identification: 'identification',
  provider_credential: 'provider-credentials',
  other: 'other-documents'
};

/**
 * Default signed URL configuration
 */
export const signedUrlConfig = {
  // Default URL expiration in seconds (from minutes)
  expiresIn: parseInt(process.env.SIGNED_URL_EXPIRATION_MINUTES || '60', 10) * 60,
  contentType: 'application/octet-stream',
  responseDisposition: 'attachment'
};

/**
 * Validates that required storage configuration values are present
 * @throws Error if any required configuration is missing
 */
export function validateStorageConfig(): void {
  if (!blobStorageConfig.endpoint) {
    throw new Error('Missing required BLOB_STORE_URL environment variable');
  }
  
  if (!blobStorageConfig.accessKey) {
    throw new Error('Missing required BLOB_READ_WRITE_TOKEN environment variable');
  }
  
  // Log successful validation
  console.log('Storage configuration validated successfully');
}

/**
 * Returns the storage path for a specific document type
 * @param documentType The type of document
 * @returns The storage path for the document type
 */
export function getStoragePathForDocumentType(documentType: string): string {
  if (documentType in documentStoragePaths) {
    return documentStoragePaths[documentType as keyof typeof documentStoragePaths];
  }
  
  // Default to other-documents if document type not found
  return documentStoragePaths.other;
}

/**
 * Returns the maximum file size allowed for a specific document type
 * @param documentType The type of document
 * @returns Maximum file size in MB
 */
export function getMaxFileSizeForDocumentType(documentType: string): number {
  if (documentType in storageLimits.documentTypeLimits) {
    return storageLimits.documentTypeLimits[documentType as keyof typeof storageLimits.documentTypeLimits];
  }
  
  // Default to general max file size if document type not found
  return storageLimits.maxFileSizeMB;
}