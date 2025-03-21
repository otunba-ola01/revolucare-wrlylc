import { 
  DocumentAnalysisClient, 
  AzureKeyCredential, 
  PrebuiltModels, 
  AnalyzeResult, 
  OperationError 
} from '@azure/ai-form-recognizer'; // ^4.0.0

import { azureFormRecognizerConfig } from '../config/ai';
import { 
  AIModelType, 
  ConfidenceScore, 
  ConfidenceLevel, 
  DocumentAnalysisResult 
} from '../types/ai.types';
import { 
  DocumentType, 
  DocumentAnalysisType 
} from '../types/document.types';
import { 
  DOCUMENT_ANALYSIS_TYPES 
} from '../constants/document-types';
import { errorFactory } from '../utils/error-handler';
import { logger } from '../utils/logger';

/**
 * Error codes specific to Azure Form Recognizer service
 */
const ERROR_CODES = {
  INITIALIZATION_FAILED: 'azure_form_recognizer_initialization_failed',
  INVALID_PARAMETERS: 'azure_form_recognizer_invalid_parameters',
  SERVICE_NOT_INITIALIZED: 'azure_form_recognizer_not_initialized',
  ANALYSIS_FAILED: 'azure_form_recognizer_analysis_failed',
  UNSUPPORTED_ANALYSIS_TYPE: 'azure_form_recognizer_unsupported_analysis_type',
  DOCUMENT_URL_INVALID: 'azure_form_recognizer_document_url_invalid'
};

/**
 * Threshold values for confidence level classification
 */
const CONFIDENCE_THRESHOLDS = {
  HIGH: 0.8,
  MEDIUM: 0.5
};

/**
 * Default options for Azure Form Recognizer operations
 */
const DEFAULT_OPTIONS = {
  timeout: 30000,
  maxRetries: 3,
  retryDelayMs: 1000
};

/**
 * Service that integrates with Azure Form Recognizer for document analysis
 */
class AzureFormRecognizerService {
  private client: DocumentAnalysisClient;
  private endpoint: string;
  private modelIds: Record<string, string>;
  private initialized: boolean;

  /**
   * Creates a new instance of the Azure Form Recognizer service
   */
  constructor() {
    this.initialized = false;
  }

  /**
   * Initializes the Azure Form Recognizer client with configuration
   * @returns True if initialization was successful
   */
  public async initialize(): Promise<boolean> {
    if (this.initialized) {
      logger.info('Azure Form Recognizer service already initialized');
      return true;
    }

    try {
      const apiKey = azureFormRecognizerConfig.apiKey;
      this.endpoint = azureFormRecognizerConfig.endpoint;

      if (!apiKey || !this.endpoint) {
        throw new Error('Azure Form Recognizer API key or endpoint not configured');
      }

      const credential = new AzureKeyCredential(apiKey);
      this.client = new DocumentAnalysisClient(this.endpoint, credential);
      this.modelIds = azureFormRecognizerConfig.models;
      this.initialized = true;

      logger.info('Azure Form Recognizer service initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize Azure Form Recognizer service', { error });
      throw errorFactory.createError(
        'Failed to initialize Azure Form Recognizer service',
        ERROR_CODES.INITIALIZATION_FAILED,
        { error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * Analyzes a document using the appropriate analysis type
   * 
   * @param documentId - ID of the document to analyze
   * @param documentUrl - URL to the document in storage
   * @param analysisType - Type of analysis to perform
   * @param options - Additional options for the analysis
   * @returns Results of the document analysis
   */
  public async analyzeDocument(
    documentId: string,
    documentUrl: string,
    analysisType: DocumentAnalysisType,
    options: Record<string, any> = {}
  ): Promise<DocumentAnalysisResult> {
    // Ensure service is initialized
    if (!this.initialized) {
      await this.initialize();
    }

    // Validate parameters
    if (!documentId || !documentUrl) {
      throw errorFactory.createError(
        'Document ID and URL are required for analysis',
        ERROR_CODES.INVALID_PARAMETERS
      );
    }

    // Record start time for performance tracking
    const startTime = Date.now();
    let extractedData: Record<string, any>;

    try {
      // Determine the analysis method based on analysis type
      switch (analysisType) {
        case DOCUMENT_ANALYSIS_TYPES.MEDICAL_EXTRACTION:
          extractedData = await this.extractMedicalData(documentId, documentUrl, options);
          break;
        case DOCUMENT_ANALYSIS_TYPES.TEXT_EXTRACTION:
          extractedData = await this.extractText(documentId, documentUrl, options);
          break;
        case DOCUMENT_ANALYSIS_TYPES.FORM_RECOGNITION:
          extractedData = await this.recognizeForm(documentId, documentUrl, options);
          break;
        case DOCUMENT_ANALYSIS_TYPES.IDENTITY_VERIFICATION:
          extractedData = await this.verifyIdentity(documentId, documentUrl, options);
          break;
        default:
          throw errorFactory.createError(
            `Unsupported analysis type: ${analysisType}`,
            ERROR_CODES.UNSUPPORTED_ANALYSIS_TYPE
          );
      }

      // Calculate processing time
      const processingTime = Date.now() - startTime;

      // Calculate confidence score
      const confidence = this.calculateConfidenceScore(extractedData, analysisType);

      // Return standardized result
      return {
        documentId,
        extractedData,
        confidence,
        processingTime,
        modelType: AIModelType.AZURE_FORM_RECOGNIZER
      };
    } catch (error) {
      this.handleAnalysisError(error, `Document analysis failed for type: ${analysisType}`);
    }
  }

  /**
   * Extracts medical data from healthcare documents
   * 
   * @param documentId - ID of the document to analyze
   * @param documentUrl - URL to the document in storage
   * @param options - Additional options for the extraction
   * @returns Extracted medical information
   */
  private async extractMedicalData(
    documentId: string,
    documentUrl: string,
    options: Record<string, any> = {}
  ): Promise<Record<string, any>> {
    // Ensure service is initialized
    if (!this.initialized) {
      throw errorFactory.createError(
        'Azure Form Recognizer service not initialized',
        ERROR_CODES.SERVICE_NOT_INITIALIZED
      );
    }

    // Validate document URL
    if (!this.isValidUrl(documentUrl)) {
      throw errorFactory.createError(
        'Invalid document URL provided',
        ERROR_CODES.DOCUMENT_URL_INVALID
      );
    }

    try {
      logger.info('Extracting medical data from document', { documentId });
      
      // Use Azure Form Recognizer's prebuilt healthcare model
      const poller = await this.client.beginAnalyzeDocument(
        PrebuiltModels.HealthInsuranceCard,
        documentUrl,
        options
      );
      
      const result = await poller.pollUntilDone();
      
      // Extract and structure the medical information
      const medicalData: Record<string, any> = {
        patientInfo: {},
        diagnoses: [],
        medications: [],
        procedures: [],
        vitalSigns: [],
        allergies: [],
        immunizations: []
      };
      
      // Process fields from the health insurance card model
      if (result.documents && result.documents.length > 0) {
        const document = result.documents[0];
        
        // Extract patient information
        if (document.fields.memberName) {
          medicalData.patientInfo.name = document.fields.memberName.content;
        }
        
        if (document.fields.memberId) {
          medicalData.patientInfo.memberId = document.fields.memberId.content;
        }
        
        if (document.fields.memberAddress) {
          medicalData.patientInfo.address = document.fields.memberAddress.content;
        }
        
        // Extract plan information
        if (document.fields.policyNumber) {
          medicalData.insuranceInfo = {
            policyNumber: document.fields.policyNumber.content,
            planName: document.fields.planName?.content,
            coverageType: document.fields.coverageType?.content,
            issueDate: document.fields.issueDate?.content,
            groupNumber: document.fields.groupNumber?.content
          };
        }
      }
      
      // Extract entities from the document text
      if (result.content) {
        // Process full text for additional information
        // This would typically involve more complex NLP processing
        // or using a specialized healthcare extraction model
      }
      
      // Process key-value pairs for additional information
      if (result.keyValuePairs) {
        for (const kv of result.keyValuePairs) {
          const key = kv.key?.content?.toLowerCase();
          const value = kv.value?.content;
          
          if (key && value) {
            // Map common key patterns to structured data
            if (key.includes('diagnosis') || key.includes('condition')) {
              medicalData.diagnoses.push(value);
            } else if (key.includes('medication') || key.includes('drug') || key.includes('prescription')) {
              medicalData.medications.push(value);
            } else if (key.includes('procedure') || key.includes('treatment')) {
              medicalData.procedures.push(value);
            } else if (key.includes('allergy')) {
              medicalData.allergies.push(value);
            }
          }
        }
      }
      
      logger.debug('Medical data extracted successfully', { documentId });
      return medicalData;
    } catch (error) {
      this.handleAnalysisError(error, 'Medical data extraction failed');
    }
  }

  /**
   * Extracts plain text content from documents
   * 
   * @param documentId - ID of the document to analyze
   * @param documentUrl - URL to the document in storage
   * @param options - Additional options for the extraction
   * @returns Extracted text with metadata
   */
  private async extractText(
    documentId: string,
    documentUrl: string,
    options: Record<string, any> = {}
  ): Promise<{ text: string; pages: number; confidence: number }> {
    // Ensure service is initialized
    if (!this.initialized) {
      throw errorFactory.createError(
        'Azure Form Recognizer service not initialized',
        ERROR_CODES.SERVICE_NOT_INITIALIZED
      );
    }

    // Validate document URL
    if (!this.isValidUrl(documentUrl)) {
      throw errorFactory.createError(
        'Invalid document URL provided',
        ERROR_CODES.DOCUMENT_URL_INVALID
      );
    }
    
    try {
      logger.info('Extracting text from document', { documentId });
      
      // Use Azure Form Recognizer's general document model
      const poller = await this.client.beginAnalyzeDocument(
        PrebuiltModels.PrebuiltDocument,
        documentUrl,
        options
      );
      
      const result = await poller.pollUntilDone();
      
      let fullText = '';
      let totalConfidence = 0;
      let pageCount = 0;
      
      // Process pages and extract text
      if (result.pages) {
        pageCount = result.pages.length;
        
        for (const page of result.pages) {
          // Add text from this page
          if (page.lines) {
            for (const line of page.lines) {
              fullText += line.content + '\n';
            }
          }
          
          // Track confidence scores
          if (page.spans && page.spans.length > 0) {
            // Use the average confidence of the page
            totalConfidence += page.spans.reduce((sum, span) => sum + (span.confidence || 0), 0) / page.spans.length;
          }
        }
      } else {
        // Fallback to content if pages aren't available
        fullText = result.content || '';
      }
      
      // Calculate average confidence
      const avgConfidence = pageCount > 0 ? totalConfidence / pageCount : 0.5;
      
      logger.debug('Text extracted successfully', { documentId, pageCount });
      return {
        text: fullText.trim(),
        pages: pageCount,
        confidence: avgConfidence
      };
    } catch (error) {
      this.handleAnalysisError(error, 'Text extraction failed');
    }
  }

  /**
   * Recognizes and extracts structured data from forms
   * 
   * @param documentId - ID of the document to analyze
   * @param documentUrl - URL to the document in storage
   * @param options - Additional options for the extraction
   * @returns Extracted form fields
   */
  private async recognizeForm(
    documentId: string,
    documentUrl: string,
    options: Record<string, any> = {}
  ): Promise<{ fields: Record<string, any>; confidence: number }> {
    // Ensure service is initialized
    if (!this.initialized) {
      throw errorFactory.createError(
        'Azure Form Recognizer service not initialized',
        ERROR_CODES.SERVICE_NOT_INITIALIZED
      );
    }

    // Validate document URL
    if (!this.isValidUrl(documentUrl)) {
      throw errorFactory.createError(
        'Invalid document URL provided',
        ERROR_CODES.DOCUMENT_URL_INVALID
      );
    }
    
    try {
      logger.info('Recognizing form structure', { documentId });
      
      const formType = options.formType || 'general';
      let result;
      
      // Use the appropriate model based on form type
      if (formType === 'general') {
        // Use the general form model
        const poller = await this.client.beginAnalyzeDocument(
          PrebuiltModels.PrebuiltDocument,
          documentUrl,
          options
        );
        result = await poller.pollUntilDone();
      } else if (formType === 'invoice') {
        // Use the invoice model
        const poller = await this.client.beginAnalyzeDocument(
          PrebuiltModels.Invoice,
          documentUrl,
          options
        );
        result = await poller.pollUntilDone();
      } else if (formType === 'receipt') {
        // Use the receipt model
        const poller = await this.client.beginAnalyzeDocument(
          PrebuiltModels.Receipt,
          documentUrl,
          options
        );
        result = await poller.pollUntilDone();
      } else {
        // Custom form model (would require a trained model ID)
        throw errorFactory.createError(
          `Unsupported form type: ${formType}`,
          ERROR_CODES.UNSUPPORTED_ANALYSIS_TYPE
        );
      }
      
      const fields: Record<string, any> = {};
      let totalConfidence = 0;
      let fieldCount = 0;
      
      // Extract key-value pairs
      if (result.keyValuePairs) {
        for (const kv of result.keyValuePairs) {
          if (kv.key && kv.value && kv.key.content) {
            const key = kv.key.content.replace(/\s+/g, '_').toLowerCase();
            fields[key] = kv.value.content;
            
            // Track confidence for this field
            if (kv.confidence) {
              totalConfidence += kv.confidence;
              fieldCount++;
            }
          }
        }
      }
      
      // For special form types, extract specific fields
      if (formType === 'invoice' && result.documents && result.documents.length > 0) {
        const invoice = result.documents[0];
        
        // Map specific invoice fields if available
        if (invoice.fields) {
          const invoiceFields = invoice.fields;
          fields.invoiceId = invoiceFields.invoiceId?.content;
          fields.invoiceDate = invoiceFields.invoiceDate?.content;
          fields.dueDate = invoiceFields.dueDate?.content;
          fields.vendorName = invoiceFields.vendorName?.content;
          fields.customerName = invoiceFields.customerName?.content;
          fields.totalAmount = invoiceFields.totalAmount?.content;
          
          // Track confidence for these fields
          Object.keys(invoiceFields).forEach(key => {
            if (invoiceFields[key]?.confidence) {
              totalConfidence += invoiceFields[key].confidence;
              fieldCount++;
            }
          });
        }
      }
      
      // Calculate average confidence
      const avgConfidence = fieldCount > 0 ? totalConfidence / fieldCount : 0.5;
      
      logger.debug('Form recognized successfully', { documentId, fieldCount });
      return {
        fields,
        confidence: avgConfidence
      };
    } catch (error) {
      this.handleAnalysisError(error, 'Form recognition failed');
    }
  }

  /**
   * Verifies identity documents and extracts personal information
   * 
   * @param documentId - ID of the document to analyze
   * @param documentUrl - URL to the document in storage
   * @param options - Additional options for the verification
   * @returns Identity verification results
   */
  private async verifyIdentity(
    documentId: string,
    documentUrl: string,
    options: Record<string, any> = {}
  ): Promise<{ identityInfo: Record<string, any>; isValid: boolean; confidence: number }> {
    // Ensure service is initialized
    if (!this.initialized) {
      throw errorFactory.createError(
        'Azure Form Recognizer service not initialized',
        ERROR_CODES.SERVICE_NOT_INITIALIZED
      );
    }

    // Validate document URL
    if (!this.isValidUrl(documentUrl)) {
      throw errorFactory.createError(
        'Invalid document URL provided',
        ERROR_CODES.DOCUMENT_URL_INVALID
      );
    }
    
    try {
      logger.info('Verifying identity document', { documentId });
      
      // Use Azure Form Recognizer's ID document model
      const poller = await this.client.beginAnalyzeDocument(
        PrebuiltModels.IdentityDocument,
        documentUrl,
        options
      );
      
      const result = await poller.pollUntilDone();
      
      const identityInfo: Record<string, any> = {};
      let isValid = false;
      let totalConfidence = 0;
      let fieldCount = 0;
      
      // Process ID document fields
      if (result.documents && result.documents.length > 0) {
        const idDocument = result.documents[0];
        
        // Mark as potentially valid if we have a document classification
        isValid = true;
        
        // Extract identity information
        if (idDocument.fields) {
          const fields = idDocument.fields;
          
          // Extract common identity fields
          identityInfo.firstName = fields.firstName?.content;
          identityInfo.lastName = fields.lastName?.content;
          identityInfo.documentNumber = fields.documentNumber?.content;
          identityInfo.dateOfBirth = fields.dateOfBirth?.content;
          identityInfo.expirationDate = fields.expirationDate?.content;
          identityInfo.issuingAuthority = fields.issuingAuthority?.content;
          identityInfo.country = fields.country?.content;
          identityInfo.address = fields.address?.content;
          
          // Determine document type
          identityInfo.documentType = fields.documentType?.content || 'Unknown';
          
          // Track confidence for these fields
          Object.keys(fields).forEach(key => {
            if (fields[key]?.confidence) {
              totalConfidence += fields[key].confidence;
              fieldCount++;
            }
          });
        }
      }
      
      // Calculate average confidence
      const avgConfidence = fieldCount > 0 ? totalConfidence / fieldCount : 0.5;
      
      logger.debug('Identity document verified', { documentId, isValid });
      return {
        identityInfo,
        isValid,
        confidence: avgConfidence
      };
    } catch (error) {
      this.handleAnalysisError(error, 'Identity verification failed');
    }
  }

  /**
   * Calculates a standardized confidence score for analysis results
   * 
   * @param analysisResult - The raw analysis result
   * @param analysisType - The type of analysis performed
   * @returns Standardized confidence score
   */
  private calculateConfidenceScore(
    analysisResult: Record<string, any>,
    analysisType: DocumentAnalysisType
  ): ConfidenceScore {
    // Default confidence values
    let score = 0.5;
    let level = ConfidenceLevel.MEDIUM;
    const factors: string[] = [];
    
    // Calculate score based on analysis type and result
    switch (analysisType) {
      case DOCUMENT_ANALYSIS_TYPES.MEDICAL_EXTRACTION:
        // For medical data, check completeness of critical sections
        if (analysisResult.patientInfo && Object.keys(analysisResult.patientInfo).length > 0) {
          score += 0.2;
          factors.push('Found patient information');
        }
        
        if (analysisResult.diagnoses && analysisResult.diagnoses.length > 0) {
          score += 0.2;
          factors.push('Found diagnoses');
        }
        
        if (analysisResult.medications && analysisResult.medications.length > 0) {
          score += 0.2;
          factors.push('Found medications');
        }
        
        if ('confidence' in analysisResult) {
          score = Math.min(1, (score + analysisResult.confidence) / 2);
        }
        break;
      
      case DOCUMENT_ANALYSIS_TYPES.TEXT_EXTRACTION:
        // For text extraction, use the provided confidence directly
        if ('confidence' in analysisResult) {
          score = analysisResult.confidence;
          
          if (analysisResult.pages > 0) {
            factors.push(`Processed ${analysisResult.pages} page(s)`);
          }
          
          if (analysisResult.text && analysisResult.text.length > 0) {
            factors.push(`Extracted ${analysisResult.text.length} characters`);
          }
        }
        break;
      
      case DOCUMENT_ANALYSIS_TYPES.FORM_RECOGNITION:
        // For form recognition, consider field count and confidence
        if (analysisResult.fields && Object.keys(analysisResult.fields).length > 0) {
          const fieldCount = Object.keys(analysisResult.fields).length;
          factors.push(`Extracted ${fieldCount} field(s)`);
          
          // More fields usually indicate better extraction
          score = Math.min(1, 0.3 + (fieldCount / 30));
        }
        
        if ('confidence' in analysisResult) {
          score = Math.min(1, (score + analysisResult.confidence) / 2);
        }
        break;
      
      case DOCUMENT_ANALYSIS_TYPES.IDENTITY_VERIFICATION:
        // For identity verification, consider validity and field completeness
        if (analysisResult.isValid) {
          score += 0.3;
          factors.push('Document appears valid');
        }
        
        if (analysisResult.identityInfo) {
          const criticalFields = ['firstName', 'lastName', 'documentNumber', 'dateOfBirth'];
          const presentFields = criticalFields.filter(field => 
            field in analysisResult.identityInfo && 
            analysisResult.identityInfo[field]
          );
          
          if (presentFields.length === criticalFields.length) {
            score += 0.3;
            factors.push('All critical fields present');
          } else if (presentFields.length > 0) {
            score += 0.1 + (0.05 * presentFields.length);
            factors.push(`${presentFields.length}/${criticalFields.length} critical fields present`);
          }
        }
        
        if ('confidence' in analysisResult) {
          score = Math.min(1, (score + analysisResult.confidence) / 2);
        }
        break;
    }
    
    // Ensure score is within 0-1 range
    score = Math.max(0, Math.min(1, score));
    
    // Determine confidence level based on score
    if (score >= CONFIDENCE_THRESHOLDS.HIGH) {
      level = ConfidenceLevel.HIGH;
    } else if (score >= CONFIDENCE_THRESHOLDS.MEDIUM) {
      level = ConfidenceLevel.MEDIUM;
    } else {
      level = ConfidenceLevel.LOW;
    }
    
    // If no factors were identified, add a generic one
    if (factors.length === 0) {
      factors.push('Basic analysis completed');
    }
    
    // Convert score to percentage for readability
    const scorePercentage = Math.round(score * 100);
    
    return {
      score: scorePercentage,
      level,
      factors
    };
  }

  /**
   * Handles and standardizes errors from Azure Form Recognizer
   * 
   * @param error - The error object
   * @param operation - Description of the operation that failed
   * @throws Standardized error
   */
  private handleAnalysisError(error: unknown, operation: string): never {
    logger.error(`Azure Form Recognizer error: ${operation}`, { error });
    
    if (error instanceof OperationError) {
      throw errorFactory.createError(
        `${operation}: ${error.message}`,
        ERROR_CODES.ANALYSIS_FAILED,
        {
          operationId: error.operationId,
          statusCode: error.code
        },
        error
      );
    } else if (error instanceof Error) {
      throw errorFactory.createError(
        `${operation}: ${error.message}`,
        ERROR_CODES.ANALYSIS_FAILED,
        { errorName: error.name },
        error
      );
    } else {
      throw errorFactory.createError(
        `${operation}: Unknown error occurred`,
        ERROR_CODES.ANALYSIS_FAILED,
        { error: String(error) }
      );
    }
  }

  /**
   * Validates if a string is a valid URL
   * 
   * @param url - The URL to validate
   * @returns True if the URL is valid
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Export the service class
export { AzureFormRecognizerService };

// Create and export a default instance
export default new AzureFormRecognizerService();