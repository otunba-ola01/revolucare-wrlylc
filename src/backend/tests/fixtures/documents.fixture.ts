/**
 * Document Test Fixtures
 *
 * This file provides mock document data for testing purposes, including various document types,
 * statuses, and analysis results that match the structure defined in document types and models.
 */

import {
  DOCUMENT_TYPES,
  DOCUMENT_MIME_TYPES,
  DOCUMENT_ANALYSIS_TYPES
} from '../../src/constants/document-types';

import {
  DocumentStatus,
  AnalysisStatus,
  DocumentType,
  DocumentMimeType,
  DocumentAnalysisType,
  DocumentMetadata,
  DocumentUploadOptions,
  DocumentAnalysisOptions
} from '../../src/types/document.types';

import {
  ConfidenceLevel,
  AIModelType
} from '../../src/types/ai.types';

import { mockUsers } from './users.fixture';

/**
 * Interface for document objects used in tests
 */
interface Document {
  id: string;
  ownerId: string;
  name: string;
  type: DocumentType;
  mimeType: DocumentMimeType;
  size: number;
  storageUrl: string;
  metadata: DocumentMetadata;
  status: DocumentStatus;
  analysisResults?: DocumentAnalysis[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface for document analysis results
 */
interface DocumentAnalysis {
  id: string;
  documentId: string;
  analysisType: DocumentAnalysisType;
  status: AnalysisStatus;
  results: Record<string, any>;
  confidence: ConfidenceScore;
  processingTime: number;
  createdAt: Date;
  completedAt?: Date;
}

/**
 * Interface for confidence scores
 */
interface ConfidenceScore {
  score: number;
  level: ConfidenceLevel;
  factors: string[];
}

/**
 * Generates a mock document for testing
 *
 * @param overrides - Properties to override in the default mock document
 * @returns A mock document with default values overridden by provided values
 */
export const generateMockDocument = (overrides: Partial<Document> = {}): Document => {
  const defaultDocument: Document = {
    id: `doc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    ownerId: mockUsers[0].id,
    name: 'Medical_Record.pdf',
    type: DOCUMENT_TYPES.MEDICAL_RECORD,
    mimeType: DOCUMENT_MIME_TYPES.PDF,
    size: 1024 * 1024 * 2, // 2MB
    storageUrl: `https://storage.revolucare.com/documents/${mockUsers[0].id}/Medical_Record.pdf`,
    metadata: {
      title: 'Medical Record',
      description: 'Patient medical history and recent lab results',
      tags: ['medical', 'history', 'lab-results'],
      category: 'clinical',
      documentDate: new Date('2023-01-15'),
      source: 'General Hospital',
      isConfidential: true
    },
    status: DocumentStatus.AVAILABLE,
    analysisResults: [],
    createdAt: new Date('2023-05-10T14:30:00Z'),
    updatedAt: new Date('2023-05-10T14:35:00Z')
  };

  return {
    ...defaultDocument,
    ...overrides
  };
};

/**
 * Generates mock document metadata for testing
 *
 * @param overrides - Properties to override in the default mock document metadata
 * @returns Mock document metadata with default values overridden by provided values
 */
export const generateMockDocumentMetadata = (overrides: Partial<DocumentMetadata> = {}): DocumentMetadata => {
  const defaultMetadata: DocumentMetadata = {
    title: 'Test Document',
    description: 'This is a test document for unit testing',
    tags: ['test', 'fixture', 'document'],
    category: 'testing',
    documentDate: new Date('2023-05-01'),
    source: 'Test Suite',
    isConfidential: false
  };

  return {
    ...defaultMetadata,
    ...overrides
  };
};

/**
 * Generates a mock document analysis for testing
 *
 * @param overrides - Properties to override in the default mock document analysis
 * @returns A mock document analysis with default values overridden by provided values
 */
export const generateMockDocumentAnalysis = (overrides: Partial<DocumentAnalysis> = {}): DocumentAnalysis => {
  const defaultAnalysis: DocumentAnalysis = {
    id: `analysis-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    documentId: `doc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    analysisType: DOCUMENT_ANALYSIS_TYPES.MEDICAL_EXTRACTION,
    status: AnalysisStatus.COMPLETED,
    results: {
      diagnoses: [
        { name: 'Multiple Sclerosis', confidence: 0.95, code: 'G35' },
        { name: 'Chronic Fatigue', confidence: 0.87, code: 'R53.82' }
      ],
      medications: [
        { name: 'Tecfidera', dosage: '240mg', frequency: 'twice daily' },
        { name: 'Baclofen', dosage: '10mg', frequency: 'three times daily' },
        { name: 'Vitamin D', dosage: '2000IU', frequency: 'once daily' }
      ],
      allergies: [
        { name: 'Penicillin', severity: 'High' },
        { name: 'Sulfa drugs', severity: 'Moderate' }
      ],
      procedures: [],
      vitalSigns: {
        bloodPressure: '120/80',
        heartRate: 72,
        temperature: 98.6
      }
    },
    confidence: {
      score: 92,
      level: ConfidenceLevel.HIGH,
      factors: ['Clear document text', 'Structured format', 'Known medical terminology']
    },
    processingTime: 2345, // milliseconds
    createdAt: new Date('2023-05-10T14:36:00Z'),
    completedAt: new Date('2023-05-10T14:36:02Z')
  };

  return {
    ...defaultAnalysis,
    ...overrides
  };
};

/**
 * Generates a mock confidence score for testing
 *
 * @param overrides - Properties to override in the default mock confidence score
 * @returns A mock confidence score with default values overridden by provided values
 */
export const generateMockConfidenceScore = (overrides: Partial<ConfidenceScore> = {}): ConfidenceScore => {
  const defaultConfidenceScore: ConfidenceScore = {
    score: 85,
    level: ConfidenceLevel.HIGH,
    factors: ['Document quality', 'Structured data', 'Recognized terminology']
  };

  return {
    ...defaultConfidenceScore,
    ...overrides
  };
};

/**
 * Generates mock document upload options for testing
 *
 * @param overrides - Properties to override in the default mock document upload options
 * @returns Mock document upload options with default values overridden by provided values
 */
export const generateMockDocumentUploadOptions = (overrides: Partial<DocumentUploadOptions> = {}): DocumentUploadOptions => {
  const defaultUploadOptions: DocumentUploadOptions = {
    ownerId: mockUsers[0].id,
    name: 'Test_Document.pdf',
    type: DOCUMENT_TYPES.MEDICAL_RECORD,
    metadata: generateMockDocumentMetadata(),
    autoAnalyze: true,
    analysisType: DOCUMENT_ANALYSIS_TYPES.MEDICAL_EXTRACTION
  };

  return {
    ...defaultUploadOptions,
    ...overrides
  };
};

/**
 * Generates mock document analysis options for testing
 *
 * @param overrides - Properties to override in the default mock document analysis options
 * @returns Mock document analysis options with default values overridden by provided values
 */
export const generateMockDocumentAnalysisOptions = (overrides: Partial<DocumentAnalysisOptions> = {}): DocumentAnalysisOptions => {
  const defaultAnalysisOptions: DocumentAnalysisOptions = {
    analysisType: DOCUMENT_ANALYSIS_TYPES.MEDICAL_EXTRACTION,
    priority: 'normal',
    extractionOptions: {
      includeDiagnoses: true,
      includeMedications: true,
      includeAllergies: true,
      includeProcedures: true,
      includeVitalSigns: true
    }
  };

  return {
    ...defaultAnalysisOptions,
    ...overrides
  };
};

// Array of pre-defined mock documents with different types and statuses
export const mockDocuments: Document[] = [
  // Medical record document - Available status
  generateMockDocument({
    id: 'doc-medical-record-1',
    ownerId: mockUsers[0].id,
    name: 'Medical_History.pdf',
    type: DOCUMENT_TYPES.MEDICAL_RECORD,
    mimeType: DOCUMENT_MIME_TYPES.PDF,
    status: DocumentStatus.AVAILABLE
  }),
  
  // Medical record document - Processing status
  generateMockDocument({
    id: 'doc-medical-record-2',
    ownerId: mockUsers[0].id,
    name: 'Lab_Results.pdf',
    type: DOCUMENT_TYPES.MEDICAL_RECORD,
    mimeType: DOCUMENT_MIME_TYPES.PDF,
    status: DocumentStatus.PROCESSING,
    analysisResults: undefined
  }),
  
  // Assessment document
  generateMockDocument({
    id: 'doc-assessment-1',
    ownerId: mockUsers[0].id,
    name: 'Functional_Assessment.docx',
    type: DOCUMENT_TYPES.ASSESSMENT,
    mimeType: DOCUMENT_MIME_TYPES.DOCX,
    status: DocumentStatus.AVAILABLE,
    metadata: {
      title: 'Functional Assessment',
      description: 'Comprehensive functional assessment report',
      tags: ['assessment', 'functional', 'mobility'],
      category: 'clinical',
      documentDate: new Date('2023-04-20'),
      source: 'Rehab Center',
      isConfidential: true
    }
  }),
  
  // Care plan document
  generateMockDocument({
    id: 'doc-care-plan-1',
    ownerId: mockUsers[0].id,
    name: 'Care_Plan_2023.pdf',
    type: DOCUMENT_TYPES.CARE_PLAN,
    mimeType: DOCUMENT_MIME_TYPES.PDF,
    status: DocumentStatus.AVAILABLE,
    metadata: {
      title: 'Annual Care Plan',
      description: 'Comprehensive care plan for 2023',
      tags: ['care-plan', 'annual', '2023'],
      category: 'planning',
      documentDate: new Date('2023-01-05'),
      source: 'Care Management Team',
      isConfidential: true
    }
  }),
  
  // Services plan document
  generateMockDocument({
    id: 'doc-services-plan-1',
    ownerId: mockUsers[0].id,
    name: 'Services_Plan_Q2_2023.pdf',
    type: DOCUMENT_TYPES.SERVICES_PLAN,
    mimeType: DOCUMENT_MIME_TYPES.PDF,
    status: DocumentStatus.AVAILABLE,
    metadata: {
      title: 'Q2 2023 Services Plan',
      description: 'Service delivery plan for Q2 2023',
      tags: ['services', 'plan', 'q2', '2023'],
      category: 'planning',
      documentDate: new Date('2023-04-01'),
      source: 'Care Management Team',
      isConfidential: true
    }
  }),
  
  // Document with error status
  generateMockDocument({
    id: 'doc-error-1',
    ownerId: mockUsers[0].id,
    name: 'Corrupted_File.pdf',
    type: DOCUMENT_TYPES.OTHER,
    mimeType: DOCUMENT_MIME_TYPES.PDF,
    status: DocumentStatus.ERROR,
    metadata: {
      title: 'Corrupted File',
      description: 'This file could not be processed',
      tags: ['error', 'corrupted'],
      category: 'other',
      documentDate: new Date('2023-05-03'),
      source: 'User Upload',
      isConfidential: false
    }
  }),
  
  // Image document
  generateMockDocument({
    id: 'doc-image-1',
    ownerId: mockUsers[0].id,
    name: 'Insurance_Card.jpeg',
    type: DOCUMENT_TYPES.INSURANCE,
    mimeType: DOCUMENT_MIME_TYPES.JPEG,
    size: 500 * 1024, // 500KB
    status: DocumentStatus.AVAILABLE,
    metadata: {
      title: 'Insurance Card',
      description: 'Front and back of insurance card',
      tags: ['insurance', 'card', 'coverage'],
      category: 'administrative',
      documentDate: new Date('2023-03-15'),
      source: 'User Upload',
      isConfidential: true
    }
  }),
  
  // Document for another user
  generateMockDocument({
    id: 'doc-other-user-1',
    ownerId: mockUsers[1].id,
    name: 'Medical_History.pdf',
    type: DOCUMENT_TYPES.MEDICAL_RECORD,
    mimeType: DOCUMENT_MIME_TYPES.PDF,
    status: DocumentStatus.AVAILABLE,
    metadata: {
      title: 'Medical History',
      description: 'Complete medical history',
      tags: ['medical', 'history'],
      category: 'clinical',
      documentDate: new Date('2023-02-10'),
      source: 'Primary Care Physician',
      isConfidential: true
    }
  })
];

// Array of pre-defined mock document metadata for testing
export const mockDocumentMetadata: DocumentMetadata[] = [
  // Medical record metadata
  generateMockDocumentMetadata({
    title: 'Medical History',
    description: 'Complete patient medical history',
    tags: ['medical', 'history', 'clinical'],
    category: 'clinical',
    documentDate: new Date('2023-01-10'),
    source: 'General Hospital',
    isConfidential: true
  }),
  
  // Assessment metadata
  generateMockDocumentMetadata({
    title: 'Functional Assessment',
    description: 'Evaluation of functional capabilities',
    tags: ['assessment', 'functional', 'evaluation'],
    category: 'clinical',
    documentDate: new Date('2023-02-15'),
    source: 'Rehabilitation Center',
    isConfidential: true
  }),
  
  // Care plan metadata
  generateMockDocumentMetadata({
    title: 'Care Plan',
    description: 'Comprehensive care plan with goals and interventions',
    tags: ['care', 'plan', 'goals'],
    category: 'planning',
    documentDate: new Date('2023-03-01'),
    source: 'Care Management Team',
    isConfidential: true
  }),
  
  // Non-confidential document metadata
  generateMockDocumentMetadata({
    title: 'Service Information',
    description: 'General information about available services',
    tags: ['services', 'information', 'public'],
    category: 'informational',
    documentDate: new Date('2023-04-01'),
    source: 'Revolucare',
    isConfidential: false
  })
];

// Array of pre-defined mock document analyses with different statuses
export const mockDocumentAnalyses: DocumentAnalysis[] = [
  // Completed medical extraction analysis
  generateMockDocumentAnalysis({
    id: 'analysis-medical-1',
    documentId: 'doc-medical-record-1',
    analysisType: DOCUMENT_ANALYSIS_TYPES.MEDICAL_EXTRACTION,
    status: AnalysisStatus.COMPLETED,
    results: {
      diagnoses: [
        { name: 'Multiple Sclerosis', confidence: 0.95, code: 'G35' },
        { name: 'Chronic Fatigue', confidence: 0.87, code: 'R53.82' }
      ],
      medications: [
        { name: 'Tecfidera', dosage: '240mg', frequency: 'twice daily' },
        { name: 'Baclofen', dosage: '10mg', frequency: 'three times daily' }
      ],
      allergies: ['Penicillin', 'Sulfa drugs'],
      vitalSigns: {
        bloodPressure: '120/80',
        heartRate: 72,
        temperature: 98.6
      }
    },
    confidence: {
      score: 92,
      level: ConfidenceLevel.HIGH,
      factors: ['Clear document text', 'Structured format', 'Known medical terminology']
    }
  }),
  
  // Processing analysis
  generateMockDocumentAnalysis({
    id: 'analysis-medical-2',
    documentId: 'doc-medical-record-2',
    analysisType: DOCUMENT_ANALYSIS_TYPES.MEDICAL_EXTRACTION,
    status: AnalysisStatus.PROCESSING,
    results: {},
    confidence: {
      score: 0,
      level: ConfidenceLevel.LOW,
      factors: []
    },
    completedAt: undefined
  }),
  
  // Completed text extraction analysis
  generateMockDocumentAnalysis({
    id: 'analysis-text-1',
    documentId: 'doc-assessment-1',
    analysisType: DOCUMENT_ANALYSIS_TYPES.TEXT_EXTRACTION,
    status: AnalysisStatus.COMPLETED,
    results: {
      text: "This is the extracted text content from the document. It contains assessment findings and recommendations.",
      pageCount: 5,
      wordCount: 1250
    },
    confidence: {
      score: 88,
      level: ConfidenceLevel.HIGH,
      factors: ['Clear text', 'Good document quality']
    }
  }),
  
  // Failed analysis
  generateMockDocumentAnalysis({
    id: 'analysis-failed-1',
    documentId: 'doc-error-1',
    analysisType: DOCUMENT_ANALYSIS_TYPES.MEDICAL_EXTRACTION,
    status: AnalysisStatus.FAILED,
    results: {
      error: 'Document could not be processed due to corruption'
    },
    confidence: {
      score: 0,
      level: ConfidenceLevel.LOW,
      factors: ['Corrupted file', 'Unreadable content']
    }
  }),
  
  // Form recognition analysis
  generateMockDocumentAnalysis({
    id: 'analysis-form-1',
    documentId: 'doc-image-1',
    analysisType: DOCUMENT_ANALYSIS_TYPES.FORM_RECOGNITION,
    status: AnalysisStatus.COMPLETED,
    results: {
      fields: {
        insuranceName: 'Blue Cross Blue Shield',
        memberId: 'XYZ123456789',
        groupNumber: 'GRP987654321',
        effectiveDate: '01/01/2023',
        planType: 'PPO'
      }
    },
    confidence: {
      score: 83,
      level: ConfidenceLevel.MEDIUM,
      factors: ['Image quality', 'Recognized form layout']
    }
  })
];

// Array of pre-defined mock confidence scores for testing
export const mockConfidenceScores: ConfidenceScore[] = [
  // High confidence score
  generateMockConfidenceScore({
    score: 95,
    level: ConfidenceLevel.HIGH,
    factors: ['Clear document', 'Structured format', 'Common medical terms']
  }),
  
  // Medium confidence score
  generateMockConfidenceScore({
    score: 75,
    level: ConfidenceLevel.MEDIUM,
    factors: ['Partial information', 'Some unclear sections']
  }),
  
  // Low confidence score
  generateMockConfidenceScore({
    score: 45,
    level: ConfidenceLevel.LOW,
    factors: ['Poor document quality', 'Missing information', 'Inconsistent formatting']
  })
];

// Array of pre-defined mock document upload options for testing
export const mockDocumentUploadOptions: DocumentUploadOptions[] = [
  // Medical record upload with auto-analysis
  generateMockDocumentUploadOptions({
    ownerId: mockUsers[0].id,
    name: 'Medical_History.pdf',
    type: DOCUMENT_TYPES.MEDICAL_RECORD,
    metadata: mockDocumentMetadata[0],
    autoAnalyze: true,
    analysisType: DOCUMENT_ANALYSIS_TYPES.MEDICAL_EXTRACTION
  }),
  
  // Assessment upload without auto-analysis
  generateMockDocumentUploadOptions({
    ownerId: mockUsers[0].id,
    name: 'Functional_Assessment.docx',
    type: DOCUMENT_TYPES.ASSESSMENT,
    metadata: mockDocumentMetadata[1],
    autoAnalyze: false
  }),
  
  // Care plan upload with auto-analysis
  generateMockDocumentUploadOptions({
    ownerId: mockUsers[0].id,
    name: 'Care_Plan_2023.pdf',
    type: DOCUMENT_TYPES.CARE_PLAN,
    metadata: mockDocumentMetadata[2],
    autoAnalyze: true,
    analysisType: DOCUMENT_ANALYSIS_TYPES.TEXT_EXTRACTION
  })
];

// Array of pre-defined mock document analysis options for testing
export const mockDocumentAnalysisOptions: DocumentAnalysisOptions[] = [
  // Medical extraction options
  generateMockDocumentAnalysisOptions({
    analysisType: DOCUMENT_ANALYSIS_TYPES.MEDICAL_EXTRACTION,
    priority: 'high',
    extractionOptions: {
      includeDiagnoses: true,
      includeMedications: true,
      includeAllergies: true,
      includeProcedures: true,
      includeVitalSigns: true
    }
  }),
  
  // Text extraction options
  generateMockDocumentAnalysisOptions({
    analysisType: DOCUMENT_ANALYSIS_TYPES.TEXT_EXTRACTION,
    priority: 'normal',
    extractionOptions: {
      includeMetadata: true,
      formatResults: true
    }
  }),
  
  // Form recognition options
  generateMockDocumentAnalysisOptions({
    analysisType: DOCUMENT_ANALYSIS_TYPES.FORM_RECOGNITION,
    priority: 'normal',
    extractionOptions: {
      formType: 'insurance_card',
      extractFields: ['insuranceName', 'memberId', 'groupNumber', 'effectiveDate', 'planType']
    }
  })
];