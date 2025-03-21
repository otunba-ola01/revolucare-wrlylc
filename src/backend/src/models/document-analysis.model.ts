import { DocumentAnalysisType, AnalysisStatus } from '../types/document.types';
import { ConfidenceScore, AIModelType } from '../types/ai.types';

/**
 * Represents a document analysis record in the database, storing information about AI-powered
 * analysis of documents such as medical records and assessments.
 */
export class DocumentAnalysis {
  /**
   * Unique identifier for the document analysis record
   */
  public id: string;

  /**
   * ID of the document being analyzed
   */
  public documentId: string;

  /**
   * Type of analysis being performed
   */
  public analysisType: DocumentAnalysisType;

  /**
   * Current status of the analysis process
   */
  public status: AnalysisStatus;

  /**
   * Results of the analysis
   */
  public results: Record<string, any>;

  /**
   * Confidence score for the analysis results
   */
  public confidence: ConfidenceScore;

  /**
   * Time taken to process the document in milliseconds
   */
  public processingTime: number;

  /**
   * Type of AI model used for the analysis
   */
  public modelType: AIModelType;

  /**
   * When the analysis record was created
   */
  public createdAt: Date;

  /**
   * When the analysis was completed (if applicable)
   */
  public completedAt?: Date;

  /**
   * Creates a new document analysis instance
   * 
   * @param data Partial document analysis data to initialize the instance
   */
  constructor(data: Partial<DocumentAnalysis>) {
    this.id = data.id || '';
    this.documentId = data.documentId || '';
    this.analysisType = data.analysisType || 'medical_extraction' as DocumentAnalysisType;
    this.status = data.status || AnalysisStatus.PENDING;
    this.results = data.results || {};
    this.confidence = data.confidence || {
      score: 0,
      level: 'low',
      factors: []
    };
    this.processingTime = data.processingTime || 0;
    this.modelType = data.modelType || AIModelType.OPENAI_GPT4;
    this.createdAt = data.createdAt || new Date();
    this.completedAt = data.completedAt;
  }

  /**
   * Converts the document analysis object to a plain JSON object for serialization
   * 
   * @returns A plain JavaScript object representation of the document analysis
   */
  toJSON(): Record<string, any> {
    return {
      id: this.id,
      documentId: this.documentId,
      analysisType: this.analysisType,
      status: this.status,
      results: this.results,
      confidence: this.confidence,
      processingTime: this.processingTime,
      modelType: this.modelType,
      createdAt: this.createdAt.toISOString(),
      completedAt: this.completedAt ? this.completedAt.toISOString() : null
    };
  }

  /**
   * Updates the status of the document analysis
   * 
   * @param status The new analysis status
   */
  updateStatus(status: AnalysisStatus): void {
    this.status = status;
    
    if (status === AnalysisStatus.COMPLETED) {
      this.completedAt = new Date();
    }
    
    if (status === AnalysisStatus.FAILED && !this.results.error) {
      this.results.error = {
        message: 'Document analysis failed',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Updates the analysis results
   * 
   * @param results The analysis results data
   * @param confidence The confidence score for the results
   * @param processingTime The time taken to process the document in milliseconds
   */
  updateResults(results: Record<string, any>, confidence: ConfidenceScore, processingTime: number): void {
    this.results = results;
    this.confidence = confidence;
    this.processingTime = processingTime;
  }

  /**
   * Checks if the analysis is complete
   * 
   * @returns True if the analysis is complete, false otherwise
   */
  isComplete(): boolean {
    return this.status === AnalysisStatus.COMPLETED;
  }

  /**
   * Checks if the analysis is currently being processed
   * 
   * @returns True if the analysis is being processed, false otherwise
   */
  isProcessing(): boolean {
    return this.status === AnalysisStatus.PROCESSING;
  }

  /**
   * Checks if the analysis has failed
   * 
   * @returns True if the analysis has failed, false otherwise
   */
  hasFailed(): boolean {
    return this.status === AnalysisStatus.FAILED;
  }

  /**
   * Gets the error details if the analysis has failed
   * 
   * @returns Error details if available, null otherwise
   */
  getErrorDetails(): Record<string, any> | null {
    if (this.status === AnalysisStatus.FAILED && this.results?.error) {
      return this.results.error;
    }
    return null;
  }

  /**
   * Gets the confidence level of the analysis
   * 
   * @returns Confidence level if available, null otherwise
   */
  getConfidenceLevel(): string | null {
    if (this.confidence?.level) {
      return this.confidence.level;
    }
    return null;
  }
}