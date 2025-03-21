/**
 * Utility module that provides file processing functionality for the Revolucare platform,
 * including file validation, type detection, path generation, and metadata extraction.
 * It serves as a central utility for handling document files throughout the application.
 * 
 * @module utils/file-processor
 */

import path from 'path'; // built-in
import crypto from 'crypto'; // built-in
import mime from 'mime'; // mime@3.0.0
import fileType from 'file-type'; // file-type@18.0.0

import { DocumentType, DocumentMimeType } from '../types/document.types';
import { DOCUMENT_MIME_TYPES } from '../constants/document-types';
import { 
  documentStoragePaths, 
  storageLimits,
  getStoragePathForDocumentType,
  getMaxFileSizeForDocumentType
} from '../config/storage';
import { errorFactory } from './error-handler';
import logger from './logger';

/**
 * Error codes specific to file processing operations
 */
const ERROR_CODES = {
  INVALID_FILE_TYPE: 'invalid_file_type',
  FILE_TOO_LARGE: 'file_too_large',
  FILE_PROCESSING_ERROR: 'file_processing_error',
  VIRUS_DETECTED: 'virus_detected'
};

/**
 * Validates a file against size and type constraints
 * 
 * @param fileBuffer - The file buffer to validate
 * @param fileName - The name of the file
 * @param documentType - The type of document for context-specific validation
 * @returns A promise resolving to an object containing validation status and metadata
 */
export async function validateFile(
  fileBuffer: Buffer,
  fileName: string,
  documentType: DocumentType
): Promise<{ valid: boolean; mimeType: DocumentMimeType; size: number; error?: Error }> {
  try {
    // Check if file buffer is provided
    if (!fileBuffer || !Buffer.isBuffer(fileBuffer)) {
      throw errorFactory.createValidationError(
        'Invalid file data provided', 
        { fileBuffer: 'File data must be a valid buffer' }
      );
    }

    // Get file size in bytes
    const fileSize = fileBuffer.length;
    
    // Get maximum allowed file size for document type
    const maxFileSize = getMaxFileSizeForDocumentType(documentType) * 1024 * 1024; // Convert MB to bytes
    
    // Validate file size
    if (fileSize > maxFileSize) {
      const error = errorFactory.createValidationError(
        `File size exceeds the maximum allowed size of ${maxFileSize / (1024 * 1024)}MB`,
        { 
          code: ERROR_CODES.FILE_TOO_LARGE,
          actualSize: fileSize,
          maxSize: maxFileSize
        }
      );
      return { valid: false, mimeType: '' as DocumentMimeType, size: fileSize, error };
    }
    
    // Detect file MIME type
    const detectedMimeType = await detectFileType(fileBuffer, fileName);
    
    // Validate MIME type
    if (!detectedMimeType || !storageLimits.allowedMimeTypes.includes(detectedMimeType)) {
      const error = errorFactory.createValidationError(
        'File type not supported',
        {
          code: ERROR_CODES.INVALID_FILE_TYPE,
          detectedType: detectedMimeType,
          allowedTypes: storageLimits.allowedMimeTypes
        }
      );
      return { valid: false, mimeType: detectedMimeType || '' as DocumentMimeType, size: fileSize, error };
    }
    
    // Return successful validation result
    return {
      valid: true,
      mimeType: detectedMimeType,
      size: fileSize
    };
  } catch (error) {
    logger.error('Error validating file', { 
      fileName, 
      documentType, 
      error: error instanceof Error ? error.message : String(error) 
    });
    
    return {
      valid: false,
      mimeType: '' as DocumentMimeType,
      size: fileBuffer ? fileBuffer.length : 0,
      error: error instanceof Error 
        ? error 
        : errorFactory.createError(
            'Failed to validate file',
            'DOCUMENT_PROCESSING_ERROR',
            { originalError: String(error) }
          )
    };
  }
}

/**
 * Detects the MIME type of a file from its buffer
 * 
 * @param fileBuffer - The file buffer to analyze
 * @param fileName - The name of the file (used as fallback for MIME detection)
 * @returns A promise resolving to the detected MIME type or null if not detected
 */
export async function detectFileType(
  fileBuffer: Buffer,
  fileName: string
): Promise<DocumentMimeType | null> {
  try {
    // First try to detect MIME type from file content
    const result = await fileType.fileTypeFromBuffer(fileBuffer);
    
    if (result) {
      const detectedMimeType = result.mime;
      
      // Check if detected MIME type is allowed
      if (Object.values(DOCUMENT_MIME_TYPES).includes(detectedMimeType as DocumentMimeType)) {
        return detectedMimeType as DocumentMimeType;
      }
    }
    
    // Fallback to extension-based detection if content-based detection fails
    const extension = path.extname(fileName).toLowerCase();
    if (extension) {
      const mimeTypeFromExt = mime.getType(extension);
      
      if (mimeTypeFromExt && Object.values(DOCUMENT_MIME_TYPES).includes(mimeTypeFromExt as DocumentMimeType)) {
        return mimeTypeFromExt as DocumentMimeType;
      }
    }
    
    // Couldn't determine a valid MIME type
    logger.warn('Could not detect a valid MIME type for file', { fileName });
    return null;
  } catch (error) {
    logger.error('Error detecting file type', { 
      fileName, 
      error: error instanceof Error ? error.message : String(error) 
    });
    return null;
  }
}

/**
 * Generates a storage path for a document based on type and owner
 * 
 * @param documentType - The type of document
 * @param ownerId - ID of the document owner
 * @param fileName - Original filename
 * @returns Storage path for the document
 */
export function getStoragePathForDocument(
  documentType: DocumentType,
  ownerId: string,
  fileName: string
): string {
  // Get base storage path for document type
  const basePath = getStoragePathForDocumentType(documentType);
  
  // Sanitize the filename
  const sanitizedFileName = sanitizeFileName(fileName);
  
  // Generate a unique filename with timestamp to prevent collisions
  const timestamp = Date.now();
  const uniqueFileName = `${path.parse(sanitizedFileName).name}-${timestamp}${path.parse(sanitizedFileName).ext}`;
  
  // Combine path segments
  return path.join(basePath, ownerId, uniqueFileName);
}

/**
 * Sanitizes a filename to remove invalid characters and security risks
 * 
 * @param fileName - The filename to sanitize
 * @returns Sanitized filename
 */
export function sanitizeFileName(fileName: string): string {
  if (!fileName) {
    return 'unnamed_file';
  }
  
  // Get file extension
  const fileExt = path.extname(fileName);
  
  // Get file name without extension
  let baseName = path.basename(fileName, fileExt);
  
  // Remove path traversal sequences and invalid characters
  baseName = baseName
    .replace(/\.\./g, '') // Remove path traversal sequences
    .replace(/[/\\?%*:|"<>]/g, '-') // Replace invalid filename characters
    .trim();
  
  // Limit filename length
  if (baseName.length > 100) {
    baseName = baseName.substring(0, 100);
  }
  
  // Ensure we have at least some valid characters in the filename
  if (!baseName) {
    baseName = 'unnamed_file';
  }
  
  // Ensure filename has extension if it had one originally
  return fileExt ? `${baseName}${fileExt}` : baseName;
}

/**
 * Generates a cryptographic hash of a file buffer
 * 
 * @param fileBuffer - The file buffer to hash
 * @param algorithm - The hash algorithm to use (default: sha256)
 * @returns Hexadecimal hash string
 */
export function generateFileHash(
  fileBuffer: Buffer,
  algorithm = 'sha256'
): string {
  try {
    const hash = crypto.createHash(algorithm);
    hash.update(fileBuffer);
    return hash.digest('hex');
  } catch (error) {
    logger.error('Error generating file hash', { 
      algorithm, 
      error: error instanceof Error ? error.message : String(error) 
    });
    
    // Return a placeholder hash in case of error
    return 'error-generating-hash';
  }
}

/**
 * Extracts basic metadata from a file buffer
 * 
 * @param fileBuffer - The file buffer to analyze
 * @param mimeType - The MIME type of the file
 * @param fileName - The name of the file
 * @returns A promise resolving to extracted metadata
 */
export async function extractMetadataFromFile(
  fileBuffer: Buffer,
  mimeType: DocumentMimeType,
  fileName: string
): Promise<{ size: number; hash: string; mimeType: DocumentMimeType; extension: string }> {
  try {
    // Calculate file size
    const size = fileBuffer.length;
    
    // Generate file hash for integrity verification
    const hash = generateFileHash(fileBuffer);
    
    // Extract file extension
    const extension = path.extname(fileName).toLowerCase().substring(1); // Remove the dot
    
    // Return metadata object
    return {
      size,
      hash,
      mimeType,
      extension
    };
  } catch (error) {
    logger.error('Error extracting file metadata', { 
      fileName, 
      mimeType, 
      error: error instanceof Error ? error.message : String(error) 
    });
    
    // Return basic metadata even in case of error
    return {
      size: fileBuffer.length,
      hash: generateFileHash(fileBuffer),
      mimeType,
      extension: path.extname(fileName).toLowerCase().substring(1)
    };
  }
}

/**
 * Scans a file buffer for potential security threats
 * This is a basic implementation that should be replaced with a proper virus scanning service in production
 * 
 * @param fileBuffer - The file buffer to scan
 * @returns A promise resolving to scan results
 */
export async function scanFileForViruses(
  fileBuffer: Buffer
): Promise<{ safe: boolean; threats: string[] }> {
  try {
    logger.info('Scanning file for security threats', { size: fileBuffer.length });
    
    // In a real implementation, we would connect to an external virus scanning service
    // For now, we implement basic security checks
    
    // Check for executable file markers (simplified example)
    const threats: string[] = [];
    const fileStart = fileBuffer.slice(0, Math.min(fileBuffer.length, 100)).toString('hex');
    
    // Check for executable file headers (very basic check - not comprehensive)
    if (fileStart.startsWith('4d5a') || // MZ header for Windows executables
        fileStart.startsWith('7f454c46') || // ELF header for Linux executables
        fileStart.includes('3c736372697074')) { // <script tag in hex
      threats.push('Potentially malicious executable code detected');
    }
    
    // Very basic content scanning for suspicious patterns (for demonstration)
    const fileContent = fileBuffer.toString('utf-8', 0, Math.min(fileBuffer.length, 1000));
    if (fileContent.includes('<script>') || 
        fileContent.includes('eval(') || 
        fileContent.includes('fromCharCode(')) {
      threats.push('Potentially malicious script content detected');
    }
    
    // In production, integrate with a proper virus scanning service:
    // const scanResult = await virusScanningService.scanBuffer(fileBuffer);
    // return scanResult;
    
    logger.info('File scan completed', { 
      safe: threats.length === 0,
      threatCount: threats.length
    });
    
    return {
      safe: threats.length === 0,
      threats
    };
  } catch (error) {
    logger.error('Error scanning file for threats', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    
    // In case of scanning error, we treat the file as potentially unsafe
    return {
      safe: false,
      threats: ['Error during security scan, treating file as potentially unsafe']
    };
  }
}