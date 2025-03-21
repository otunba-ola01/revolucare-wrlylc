/**
 * Document type definitions for the Revolucare platform
 * This file contains types and interfaces for document-related functionality
 */

/**
 * Enum for document types used throughout the application
 */
export enum DocumentType {
  MEDICAL_RECORD = 'medical_record',
  ASSESSMENT = 'assessment',
  CARE_PLAN = 'care_plan',
  SERVICES_PLAN = 'services_plan',
  PRESCRIPTION = 'prescription',
  INSURANCE = 'insurance',
  CONSENT_FORM = 'consent_form',
  IDENTIFICATION = 'identification',
  PROVIDER_CREDENTIAL = 'provider_credential',
  OTHER = 'other'
}

/**
 * Human-readable labels for document types
 */
export const DOCUMENT_TYPE_LABELS = {
  medical_record: 'Medical Record',
  assessment: 'Assessment',
  care_plan: 'Care Plan',
  services_plan: 'Services Plan',
  prescription: 'Prescription',
  insurance: 'Insurance',
  consent_form: 'Consent Form',
  identification: 'Identification',
  provider_credential: 'Provider Credential',
  other: 'Other'
};

/**
 * Type mapping document types to their human-readable labels
 */
export type DocumentTypeLabel = typeof DOCUMENT_TYPE_LABELS;

/**
 * Maximum document size allowed (10MB)
 */
export const DOCUMENT_MAX_SIZE = 10 * 1024 * 1024;

/**
 * Enum for document MIME types supported by the application
 */
export enum DocumentMimeType {
  PDF = 'application/pdf',
  DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  DOC = 'application/msword',
  JPEG = 'image/jpeg',
  PNG = 'image/png',
  TIFF = 'image/tiff',
  XML = 'application/xml',
  JSON = 'application/json'
}

/**
 * List of allowed MIME types for document uploads
 */
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'image/jpeg',
  'image/png',
  'image/tiff',
  'application/xml',
  'application/json'
];

/**
 * Enum for document analysis types available in the application
 */
export enum DocumentAnalysisType {
  MEDICAL_EXTRACTION = 'medical_extraction',
  TEXT_EXTRACTION = 'text_extraction',
  FORM_RECOGNITION = 'form_recognition',
  IDENTITY_VERIFICATION = 'identity_verification'
}

/**
 * Enum for document processing status values
 */
export enum DocumentStatus {
  UPLOADING = 'uploading',
  PROCESSING = 'processing',
  AVAILABLE = 'available',
  ERROR = 'error'
}

/**
 * Enum for document analysis status values
 */
export enum AnalysisStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

/**
 * Interface for document metadata properties
 */
export interface DocumentMetadata {
  title: string;
  description?: string;
  tags: string[];
  category: string;
  documentDate?: Date;
  source?: string;
  isConfidential: boolean;
}

/**
 * Interface for document data structure
 */
export interface Document {
  id: string;
  ownerId: string;
  name: string;
  type: DocumentType;
  mimeType: DocumentMimeType;
  size: number;
  metadata: DocumentMetadata;
  status: DocumentStatus;
  downloadUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface for confidence scores in AI-generated results
 */
export interface ConfidenceScore {
  score: number; // 0-100 value representing confidence percentage
  level: string; // 'low', 'medium', 'high' categorization
  factors: string[]; // factors contributing to confidence score
}

/**
 * Interface for document analysis data
 */
export interface DocumentAnalysis {
  id: string;
  documentId: string;
  analysisType: DocumentAnalysisType;
  status: AnalysisStatus;
  results: Record<string, any>; // Analysis results vary by type
  confidence: ConfidenceScore;
  processingTime: number; // in milliseconds
  createdAt: Date;
  completedAt?: Date;
}

/**
 * Interface for document upload request parameters
 */
export interface DocumentUploadRequest {
  file: File;
  type: DocumentType;
  metadata: DocumentMetadata;
  ownerId: string;
  autoAnalyze?: boolean;
}

/**
 * Interface for document analysis request parameters
 */
export interface DocumentAnalysisRequest {
  documentId: string;
  analysisType: DocumentAnalysisType;
  options?: Record<string, any>;
}

/**
 * Interface for document filtering and pagination options
 */
export interface DocumentFilterOptions {
  ownerId?: string;
  type?: DocumentType;
  status?: DocumentStatus;
  searchTerm?: string;
  tags?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

/**
 * Interface for paginated document list response
 */
export interface DocumentListResponse {
  data: Document[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Interface for signed URL response for document access
 */
export interface SignedUrlResponse {
  url: string;
  expiresAt: string;
}