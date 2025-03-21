/**
 * Document Validation Schemas
 * 
 * This file defines Zod validation schemas for document-related forms and operations
 * in the Revolucare web application. It centralizes validation logic for document uploads,
 * metadata, filtering, and analysis to ensure consistent validation across the application.
 */

import { z } from 'zod'; // zod v3.21.4
import {
  DocumentType,
  DocumentMimeType,
  DocumentAnalysisType,
  DocumentStatus,
  DOCUMENT_MAX_SIZE,
  ALLOWED_MIME_TYPES
} from '../../types/document';

/**
 * Schema for document metadata validation
 */
export const documentMetadataSchema = z.object({
  title: z.string()
    .min(2, 'Title must be at least 2 characters')
    .max(100, 'Title cannot exceed 100 characters')
    .required('Document title is required'),
  description: z.string()
    .max(500, 'Description cannot exceed 500 characters')
    .optional(),
  tags: z.array(z.string().min(1).max(50))
    .max(10, 'Cannot have more than 10 tags')
    .optional()
    .default([]),
  category: z.string()
    .max(50, 'Category cannot exceed 50 characters')
    .optional(),
  documentDate: z.preprocess(
    (val) => val ? new Date(val) : undefined,
    z.date().optional()
  ),
  source: z.string()
    .max(100, 'Source cannot exceed 100 characters')
    .optional(),
  isConfidential: z.boolean()
    .default(false)
    .optional()
});

/**
 * Schema for document upload requests
 */
export const documentUploadSchema = z.object({
  file: z.instanceof(File, 'Please select a valid file')
    .refine(
      (file) => file.size <= DOCUMENT_MAX_SIZE,
      `File size must be less than ${DOCUMENT_MAX_SIZE / (1024 * 1024)}MB`
    )
    .refine(
      (file) => ALLOWED_MIME_TYPES.includes(file.type),
      'File type not supported'
    ),
  type: z.nativeEnum(DocumentType, {
    errorMap: () => ({ message: 'Please select a valid document type' })
  }),
  metadata: z.lazy(() => documentMetadataSchema).optional(),
  ownerId: z.string()
    .uuid('Invalid owner ID format')
    .optional(),
  autoAnalyze: z.boolean()
    .default(false)
    .optional()
});

/**
 * Schema for document filtering and listing
 */
export const documentFilterSchema = z.object({
  ownerId: z.string()
    .uuid('Invalid owner ID format')
    .optional(),
  type: z.nativeEnum(DocumentType, {
    errorMap: () => ({ message: 'Invalid document type' })
  }).optional(),
  status: z.nativeEnum(DocumentStatus, {
    errorMap: () => ({ message: 'Invalid document status' })
  }).optional(),
  searchTerm: z.string()
    .max(100, 'Search term too long')
    .optional(),
  tags: z.array(z.string())
    .optional(),
  dateFrom: z.preprocess(
    (val) => val ? new Date(val) : undefined,
    z.date().optional()
  ),
  dateTo: z.preprocess(
    (val) => val ? new Date(val) : undefined,
    z.date().optional()
  ),
  page: z.number()
    .int()
    .positive()
    .default(1)
    .optional(),
  limit: z.number()
    .int()
    .positive()
    .max(100)
    .default(20)
    .optional(),
  sortBy: z.string()
    .default('createdAt')
    .optional(),
  sortDirection: z.enum(['asc', 'desc'])
    .default('desc')
    .optional()
});

/**
 * Schema for document analysis requests
 */
export const documentAnalysisSchema = z.object({
  documentId: z.string()
    .uuid('Invalid document ID format')
    .required('Document ID is required'),
  analysisType: z.nativeEnum(DocumentAnalysisType, {
    errorMap: () => ({ message: 'Invalid analysis type' })
  }).required('Analysis type is required'),
  options: z.record(z.string(), z.any())
    .optional()
});

/**
 * Schema for document update requests
 */
export const documentUpdateSchema = z.object({
  metadata: z.lazy(() => documentMetadataSchema)
    .optional(),
  type: z.nativeEnum(DocumentType, {
    errorMap: () => ({ message: 'Invalid document type' })
  }).optional()
});