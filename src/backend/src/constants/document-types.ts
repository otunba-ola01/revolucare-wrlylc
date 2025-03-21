/**
 * Document Types Constants
 * 
 * This file defines constants for document types, MIME types, and analysis types
 * used throughout the Revolucare platform's document management system.
 * 
 * These constants provide standardized values for categorizing and processing
 * various healthcare documents such as medical records, assessments, care plans,
 * and other related files.
 */

/**
 * Document type constants used for categorizing different kinds of healthcare documents
 */
export const DOCUMENT_TYPES = {
  /**
   * Medical records including patient history, lab results, physician notes, etc.
   */
  MEDICAL_RECORD: 'medical_record',
  
  /**
   * Assessment documents including evaluations, questionnaires, screening tools, etc.
   */
  ASSESSMENT: 'assessment',
  
  /**
   * Care plan documents outlining patient goals, interventions, and expected outcomes
   */
  CARE_PLAN: 'care_plan',
  
  /**
   * Service plan documents detailing specific services, providers, and schedules
   */
  SERVICES_PLAN: 'services_plan',
  
  /**
   * Prescription documents for medications or treatments
   */
  PRESCRIPTION: 'prescription',
  
  /**
   * Insurance-related documents including cards, EOBs, coverage details, etc.
   */
  INSURANCE: 'insurance',
  
  /**
   * Consent forms and authorization documents
   */
  CONSENT_FORM: 'consent_form',
  
  /**
   * Identification documents such as driver's license, passport, etc.
   */
  IDENTIFICATION: 'identification',
  
  /**
   * Provider credential documents including licenses, certifications, etc.
   */
  PROVIDER_CREDENTIAL: 'provider_credential',
  
  /**
   * Miscellaneous documents that don't fit other categories
   */
  OTHER: 'other'
} as const;

/**
 * MIME type constants for supported document formats
 */
export const DOCUMENT_MIME_TYPES = {
  /**
   * PDF document format
   */
  PDF: 'application/pdf',
  
  /**
   * Microsoft Word document format (DOCX)
   */
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  
  /**
   * Microsoft Word document format (DOC)
   */
  DOC: 'application/msword',
  
  /**
   * JPEG image format
   */
  JPEG: 'image/jpeg',
  
  /**
   * PNG image format
   */
  PNG: 'image/png',
  
  /**
   * TIFF image format
   */
  TIFF: 'image/tiff',
  
  /**
   * XML document format
   */
  XML: 'application/xml',
  
  /**
   * JSON document format
   */
  JSON: 'application/json'
} as const;

/**
 * Document analysis type constants for different processing operations
 */
export const DOCUMENT_ANALYSIS_TYPES = {
  /**
   * Extraction of medical data from clinical documents
   */
  MEDICAL_EXTRACTION: 'medical_extraction',
  
  /**
   * Basic text extraction from documents
   */
  TEXT_EXTRACTION: 'text_extraction',
  
  /**
   * Structured data extraction from forms
   */
  FORM_RECOGNITION: 'form_recognition',
  
  /**
   * Verification of identity documents
   */
  IDENTITY_VERIFICATION: 'identity_verification'
} as const;