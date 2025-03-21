/**
 * Document Validators
 * 
 * This file defines validation schemas for document-related API requests
 * in the Revolucare platform. These schemas ensure data integrity and
 * security by validating all document operations including uploads,
 * retrieval, analysis, and management.
 */

import { z } from 'zod'; // Zod v3.21.4
import {
  DOCUMENT_TYPES,
  DOCUMENT_MIME_TYPES,
  DOCUMENT_ANALYSIS_TYPES
} from '../../constants/document-types';
import {
  DocumentType,
  DocumentMimeType,
  DocumentAnalysisType,
  DocumentStatus
} from '../../types/document.types';

/**
 * Custom validator function for document types
 * @param value The value to validate
 * @returns True if the document type is valid
 */
const validateDocumentType = (value: string): boolean => {
  return Object.values(DOCUMENT_TYPES).includes(value as DocumentType);
};

/**
 * Custom validator function for document MIME types
 * @param value The value to validate
 * @returns True if the MIME type is valid
 */
const validateMimeType = (value: string): boolean => {
  return Object.values(DOCUMENT_MIME_TYPES).includes(value as DocumentMimeType);
};

/**
 * Custom validator function for document analysis types
 * @param value The value to validate
 * @returns True if the analysis type is valid
 */
const validateAnalysisType = (value: string): boolean => {
  return Object.values(DOCUMENT_ANALYSIS_TYPES).includes(value as DocumentAnalysisType);
};

/**
 * Validation schema for document ID URL parameters
 */
export const documentIdParamSchema = z.object({
  documentId: z.string().uuid({
    message: 'Document ID must be a valid UUID'
  })
});

/**
 * Validation schema for document analysis ID URL parameters
 */
export const documentAnalysisIdParamSchema = z.object({
  analysisId: z.string().uuid({
    message: 'Analysis ID must be a valid UUID'
  })
});

/**
 * Validation schema for document metadata
 */
export const documentMetadataSchema = z.object({
  title: z.string().min(1, 'Document title is required').max(100, 'Document title too long'),
  description: z.string().max(500, 'Description too long').optional(),
  tags: z.array(z.string().min(1).max(50)).max(10, 'Maximum 10 tags allowed'),
  category: z.string().min(1, 'Category is required').max(50, 'Category too long'),
  documentDate: z.string().datetime({ message: 'Invalid date format' }).optional(),
  source: z.string().max(100, 'Source too long').optional(),
  isConfidential: z.boolean({
    invalid_type_error: 'isConfidential must be a boolean'
  })
});

/**
 * Validation schema for document upload requests
 */
export const documentUploadSchema = z.object({
  name: z.string().min(1, 'Filename is required').max(255, 'Filename too long'),
  type: z.string().refine(validateDocumentType, {
    message: 'Invalid document type'
  }),
  mimeType: z.string().refine(validateMimeType, {
    message: 'Unsupported file type'
  }),
  metadata: documentMetadataSchema,
  autoAnalyze: z.boolean().optional().default(false),
  analysisType: z.string()
    .refine(validateAnalysisType, {
      message: 'Invalid analysis type'
    })
    .optional()
});

/**
 * Validation schema for document filtering and listing
 */
export const documentFilterSchema = z.object({
  ownerId: z.string().uuid({ message: 'Owner ID must be a valid UUID' }).optional(),
  type: z.string().refine(validateDocumentType, {
    message: 'Invalid document type'
  }).optional(),
  status: z.nativeEnum(DocumentStatus).optional(),
  dateFrom: z.string().datetime({ message: 'Invalid date format' }).optional(),
  dateTo: z.string().datetime({ message: 'Invalid date format' }).optional(),
  searchTerm: z.string().max(100, 'Search term too long').optional(),
  tags: z.array(z.string()).max(10, 'Maximum 10 tags allowed').optional(),
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(20),
  sortField: z.string().optional().default('createdAt'),
  sortDirection: z.enum(['asc', 'desc']).optional().default('desc')
});

/**
 * Validation schema for document analysis requests
 */
export const documentAnalysisSchema = z.object({
  analysisType: z.string().refine(validateAnalysisType, {
    message: 'Invalid analysis type'
  }),
  priority: z.enum(['high', 'normal', 'low']).optional().default('normal'),
  options: z.record(z.any()).optional()
});

/**
 * Validation schema for document deletion requests
 */
export const documentDeleteSchema = z.object({
  documentId: z.string().uuid({
    message: 'Document ID must be a valid UUID'
  }),
  // Optional confirmation flag for critical documents
  confirm: z.boolean().optional().default(false)
});

/**
 * Validation schema for signed URL generation options
 */
export const signedUrlOptionsSchema = z.object({
  expiresIn: z.number().int().min(60).max(86400).default(3600), // 1 hour default, max 24 hours
  contentType: z.string().optional(),
  responseDisposition: z.string().optional(),
  fileName: z.string().optional()
});