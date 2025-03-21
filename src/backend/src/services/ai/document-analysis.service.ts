import {
  DocumentAnalysisType,
  AnalysisStatus,
  DocumentAnalysisResponse,
} from '../../types/document.types';
import { DocumentAnalysisParams } from '../../interfaces/document.interface';
import { DOCUMENT_ANALYSIS_TYPES } from '../../constants/document-types';
import {
  AIModelType,
  ConfidenceScore,
  ConfidenceLevel,
  DocumentAnalysisResult,
} from '../../types/ai.types';
import { Document } from '../../models/document.model';
import { DocumentAnalysis } from '../../models/document-analysis.model';
import { DocumentRepository } from '../../repositories/document.repository';
import { BlobStorageService } from '../storage/blob-storage.service';
import { OpenAIService } from '../../integrations/openai';
import { AzureFormRecognizerService } from '../../integrations/azure-form-recognizer';
import { errorFactory } from '../../utils/error-handler';
import { logger } from '../../utils/logger';

// Define error codes for this module
const ERROR_CODES = {
  DOCUMENT_NOT_FOUND: 'document_not_found',
  ANALYSIS_NOT_FOUND: 'analysis_not_found',
  INVALID_ANALYSIS_TYPE: 'invalid_analysis_type',
  ANALYSIS_FAILED: 'analysis_failed',
  DOCUMENT_DOWNLOAD_FAILED: 'document_download_failed',
  INVALID_DOCUMENT_FORMAT: 'invalid_document_format',
};

// Define confidence thresholds for analysis results
const CONFIDENCE_THRESHOLDS = {
  HIGH: 0.8,
  MEDIUM: 0.5,
};

/**
 * Service for analyzing documents using AI models to extract structured information
 */
export class DocumentAnalysisService {
  constructor(
    private documentRepository: DocumentRepository,
    private storageService: BlobStorageService,
    private openAIService: OpenAIService,
    private formRecognizerService: AzureFormRecognizerService,
  ) {
    logger.info('DocumentAnalysisService instantiated');
  }

  /**
   * Analyzes a document using AI services
   * @param params - Parameters for document analysis
   * @returns Analysis results
   */
  async analyzeDocument(
    params: DocumentAnalysisParams,
  ): Promise<DocumentAnalysisResponse> {
    try {
      logger.info('Starting document analysis', {
        documentId: params.documentId,
        analysisType: params.analysisType,
      });

      // 1. Validate analysis parameters
      if (!params.documentId || !params.analysisType) {
        throw errorFactory.createValidationError(
          'Document ID and analysis type are required',
          { params },
        );
      }

      // 2. Retrieve document from repository
      const document = await this.validateDocument(params.documentId);

      // 3. Create analysis record with PENDING status
      const analysis = await this.documentRepository.createAnalysis({
        documentId: document.id,
        analysisType: params.analysisType,
        status: AnalysisStatus.PENDING,
      });

      // 4. Update analysis status to PROCESSING
      await analysis.updateStatus(AnalysisStatus.PROCESSING);
      await this.documentRepository.updateAnalysis(analysis.id, {
        status: analysis.status,
      });

      // 5. Generate a signed URL for the document
      const signedUrl = await this.storageService.generateSignedUrl(
        document.storageUrl,
      );

      // 6. Determine appropriate AI model for analysis
      const aiModelType = this.determineAIModel(document, params.analysisType);

      // 7. Perform analysis based on analysis type
      let analysisResult: DocumentAnalysisResult;
      switch (params.analysisType) {
        case DOCUMENT_ANALYSIS_TYPES.MEDICAL_EXTRACTION:
          analysisResult = await this.formRecognizerService.extractMedicalData(
            document.id,
            signedUrl,
            params.options,
          );
          break;
        case DOCUMENT_ANALYSIS_TYPES.TEXT_EXTRACTION:
          analysisResult = await this.formRecognizerService.extractText(
            document.id,
            signedUrl,
            params.options,
          );
          break;
        case DOCUMENT_ANALYSIS_TYPES.FORM_RECOGNITION:
          analysisResult = await this.formRecognizerService.recognizeForm(
            document.id,
            signedUrl,
            params.options,
          );
          break;
        case DOCUMENT_ANALYSIS_TYPES.IDENTITY_VERIFICATION:
          analysisResult = await this.formRecognizerService.verifyIdentity(
            document.id,
            signedUrl,
            params.options,
          );
          break;
        default:
          throw errorFactory.createValidationError(
            `Unsupported analysis type: ${params.analysisType}`,
            { analysisType: params.analysisType },
          );
      }

      // 8. Update analysis record with results and COMPLETED status
      await analysis.updateResults(
        analysisResult.extractedData,
        analysisResult.confidence,
        analysisResult.processingTime,
      );
      analysis.modelType = analysisResult.modelType;
      analysis.updateStatus(AnalysisStatus.COMPLETED);
      await this.documentRepository.updateAnalysis(analysis.id, {
        status: analysis.status,
        results: analysis.results,
        confidence: analysis.confidence,
        processingTime: analysis.processingTime,
        modelType: analysis.modelType,
        completedAt: new Date(),
      });

      logger.info('Document analysis completed successfully', {
        documentId: document.id,
        analysisType: params.analysisType,
        analysisId: analysis.id,
      });

      // 9. Return formatted analysis response
      return this.formatAnalysisResponse(analysis);
    } catch (err: any) {
      // 10. Handle errors by updating status to FAILED and rethrowing
      await this.handleAnalysisError(err, analysis);
      throw err; // Re-throw the error to be caught by the caller
    }
  }

  /**
   * Retrieves an analysis by its ID
   * @param analysisId - ID of the analysis to retrieve
   * @returns Analysis results
   */
  async getAnalysisById(analysisId: string): Promise<DocumentAnalysisResponse> {
    try {
      logger.info('Retrieving document analysis by ID', { analysisId });

      // 1. Validate analysis ID
      if (!analysisId) {
        throw errorFactory.createValidationError('Analysis ID is required');
      }

      // 2. Retrieve analysis from repository
      const analysis = await this.documentRepository.findAnalysisById(
        analysisId,
      );

      // 3. If not found, throw NotFoundError
      if (!analysis) {
        throw errorFactory.createNotFoundError(
          'Document analysis not found',
          { analysisId },
        );
      }

      // 4. Return formatted analysis response
      return this.formatAnalysisResponse(analysis);
    } catch (err) {
      logger.error('Failed to retrieve document analysis by ID', {
        error: err,
        analysisId,
      });
      throw err;
    }
  }

  /**
   * Extracts medical information from healthcare documents
   * @param documentId - ID of the document to analyze
   * @param documentUrl - URL to the document in storage
   * @param options - Additional options for the extraction
   * @returns Extracted medical data
   */
  async extractMedicalData(
    documentId: string,
    documentUrl: string,
    options: Record<string, any> = {},
  ): Promise<DocumentAnalysisResult> {
    // Implementation details for medical data extraction
    throw new Error('Method not implemented.');
  }

  /**
   * Extracts text content from documents
   * @param documentId - ID of the document to analyze
   * @param documentUrl - URL to the document in storage
   * @param options - Additional options for the extraction
   * @returns Extracted text content
   */
  async extractText(
    documentId: string,
    documentUrl: string,
    options: Record<string, any> = {},
  ): Promise<DocumentAnalysisResult> {
    // Implementation details for text extraction
    throw new Error('Method not implemented.');
  }

  /**
   * Recognizes and extracts structured data from forms
   * @param documentId - ID of the document to analyze
   * @param documentUrl - URL to the document in storage
   * @param options - Additional options for the extraction
   * @returns Extracted form data
   */
  async recognizeForm(
    documentId: string,
    documentUrl: string,
    options: Record<string, any> = {},
  ): Promise<DocumentAnalysisResult> {
    // Implementation details for form recognition
    throw new Error('Method not implemented.');
  }

  /**
   * Verifies identity documents and extracts personal information
   * @param documentId - ID of the document to analyze
   * @param documentUrl - URL to the document in storage
   * @param options - Additional options for the verification
   * @returns Identity verification results
   */
  async verifyIdentity(
    documentId: string,
    documentUrl: string,
    options: Record<string, any> = {},
  ): Promise<DocumentAnalysisResult> {
    // Implementation details for identity verification
    throw new Error('Method not implemented.');
  }

  /**
   * Enhances extracted data using OpenAI for better understanding and structure
   * @param extractedData - The data extracted from the document
   * @param analysisType - The type of analysis performed
   * @returns Enhanced data
   */
  async enhanceWithAI(
    extractedData: Record<string, any>,
    analysisType: DocumentAnalysisType,
  ): Promise<Record<string, any>> {
    // Implementation details for AI enhancement
    throw new Error('Method not implemented.');
  }

  /**
   * Validates that a document exists and is available for analysis
   * @param documentId - ID of the document to validate
   * @returns The validated document
   */
  async validateDocument(documentId: string): Promise<Document> {
    try {
      logger.debug('Validating document', { documentId });

      // 1. Retrieve document from repository
      const document = await this.documentRepository.findById(documentId);

      // 2. If not found, throw NotFoundError
      if (!document) {
        throw errorFactory.createNotFoundError('Document not found', {
          documentId,
        });
      }

      // 3. Check if document is in AVAILABLE status
      if (document.status !== AnalysisStatus.COMPLETED) {
        throw errorFactory.createError(
          'Document is not available for analysis',
          ERROR_CODES.ANALYSIS_FAILED,
          { documentId, status: document.status },
        );
      }

      // 4. Return the document if valid
      return document;
    } catch (err) {
      logger.error('Failed to validate document', { error: err, documentId });
      throw err;
    }
  }

  /**
   * Handles errors during document analysis
   * @param error - The error to handle
   * @param analysis - The DocumentAnalysis object
   */
  async handleAnalysisError(error: any, analysis: DocumentAnalysis): Promise<void> {
    try {
      logger.error('Handling document analysis error', {
        error: error instanceof Error ? error.message : String(error),
        analysisId: analysis.id,
      });

      // 1. Log the error details
      logger.error('Document analysis failed', {
        analysisId: analysis.id,
        error: error instanceof Error ? error.message : String(error),
      });

      // 2. Update analysis status to FAILED
      analysis.updateStatus(AnalysisStatus.FAILED);

      // 3. Store error details in analysis results
      analysis.results = {
        error: {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : null,
        },
      };

      // 4. Save updated analysis to repository
      await this.documentRepository.updateAnalysis(analysis.id, {
        status: analysis.status,
        results: analysis.results,
      });
    } catch (updateError) {
      logger.error('Failed to update analysis status to FAILED', {
        analysisId: analysis.id,
        updateError:
          updateError instanceof Error
            ? updateError.message
            : String(updateError),
      });
    }
  }

  /**
   * Determines the appropriate AI model to use based on document type and analysis type
   * @param document - The document being analyzed
   * @param analysisType - The type of analysis to perform
   * @returns The AI model type to use for analysis
   */
  determineAIModel(
    document: Document,
    analysisType: DocumentAnalysisType,
  ): AIModelType {
    logger.debug('Determining AI model for document analysis', {
      documentType: document.type,
      analysisType,
    });

    // 1. Check document type and MIME type
    const { type: documentType, mimeType } = document;

    // 2. For medical records with MEDICAL_EXTRACTION, use AZURE_FORM_RECOGNIZER
    if (
      documentType === 'medical_record' &&
      analysisType === DOCUMENT_ANALYSIS_TYPES.MEDICAL_EXTRACTION
    ) {
      return AIModelType.AZURE_FORM_RECOGNIZER;
    }

    // 3. For text-based documents with TEXT_EXTRACTION, use OPENAI_GPT4
    if (
      mimeType.startsWith('text/') &&
      analysisType === DOCUMENT_ANALYSIS_TYPES.TEXT_EXTRACTION
    ) {
      return AIModelType.OPENAI_GPT4;
    }

    // 4. For form documents with FORM_RECOGNITION, use AZURE_FORM_RECOGNIZER
    if (
      documentType === 'form' &&
      analysisType === DOCUMENT_ANALYSIS_TYPES.FORM_RECOGNITION
    ) {
      return AIModelType.AZURE_FORM_RECOGNIZER;
    }

    // 5. For identity documents with IDENTITY_VERIFICATION, use AZURE_FORM_RECOGNIZER
    if (
      documentType === 'identification' &&
      analysisType === DOCUMENT_ANALYSIS_TYPES.IDENTITY_VERIFICATION
    ) {
      return AIModelType.AZURE_FORM_RECOGNIZER;
    }

    // 6. Default to OPENAI_GPT35_TURBO for other combinations
    return AIModelType.OPENAI_GPT35_TURBO;
  }

  /**
   * Calculates a standardized confidence score based on analysis results
   * @param rawScore - The raw confidence score from the AI service
   * @param factors - Factors that contributed to the confidence score
   * @returns Standardized confidence score object
   */
  calculateConfidenceScore(
    rawScore: number,
    factors: string[],
  ): ConfidenceScore {
    logger.debug('Calculating confidence score', { rawScore, factors });

    // 1. Normalize raw score to 0-1 range if needed
    const normalizedScore = Math.max(0, Math.min(1, rawScore));

    // 2. Determine confidence level based on thresholds
    let level: ConfidenceLevel = ConfidenceLevel.LOW;
    if (normalizedScore >= CONFIDENCE_THRESHOLDS.HIGH) {
      level = ConfidenceLevel.HIGH;
    } else if (normalizedScore >= CONFIDENCE_THRESHOLDS.MEDIUM) {
      level = ConfidenceLevel.MEDIUM;
    }

    // 3. Create and return ConfidenceScore object with score, level, and factors
    const confidenceScore: ConfidenceScore = {
      score: normalizedScore * 100, // Convert to percentage
      level,
      factors,
    };

    return confidenceScore;
  }

  /**
   * Formats analysis results into a standardized response format
   * @param analysis - The DocumentAnalysis object
   * @returns Formatted analysis response
   */
  formatAnalysisResponse(analysis: DocumentAnalysis): DocumentAnalysisResponse {
    logger.debug('Formatting analysis response', { analysisId: analysis.id });

    // 1. Extract relevant properties from analysis object
    const { id, documentId, analysisType, status, results, confidence, processingTime, createdAt, completedAt } = analysis;

    // 2. Format dates as ISO strings
    const formattedCreatedAt = createdAt.toISOString();
    const formattedCompletedAt = completedAt ? completedAt.toISOString() : null;

    // 3. Return formatted response object
    const formattedResponse: DocumentAnalysisResponse = {
      id,
      documentId,
      analysisType,
      status,
      results,
      confidence,
      processingTime,
      createdAt: formattedCreatedAt,
      completedAt: formattedCompletedAt,
    };

    return formattedResponse;
  }
}

// Export the service class
export { DocumentAnalysisService };

// Create and export a default instance for dependency injection
export default new DocumentAnalysisService(
  new DocumentRepository(),
  new BlobStorageService({
    serviceType: ExternalServiceType.STORAGE,
    endpoint: '',
    accessKey: '',
    containerName: '',
    region: '',
    timeout: 30000,
    retryConfig: {
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 10000,
      backoffFactor: 2,
      retryableStatusCodes: [408, 429, 500, 502, 503, 504],
    },
    enabled: true,
  }),
  new OpenAIService(),
  new AzureFormRecognizerService(),
);