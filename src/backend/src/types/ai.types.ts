/**
 * AI Types
 * 
 * This file defines TypeScript types and interfaces for AI-related functionality
 * in the Revolucare platform. It includes type definitions for AI models, 
 * confidence scores, service types, and request/response objects used across
 * various AI services including care plan generation, document analysis, 
 * provider matching, and text analysis.
 */

/**
 * Types of AI models used throughout the platform
 */
export enum AIModelType {
  OPENAI_GPT4 = 'openai-gpt4',
  OPENAI_GPT35_TURBO = 'openai-gpt35-turbo',
  AZURE_FORM_RECOGNIZER = 'azure-form-recognizer'
}

/**
 * Types of AI services available in the platform
 */
export enum AIServiceType {
  CARE_PLAN_GENERATION = 'care-plan-generation',
  DOCUMENT_ANALYSIS = 'document-analysis',
  PROVIDER_MATCHING = 'provider-matching',
  TEXT_ANALYSIS = 'text-analysis'
}

/**
 * Confidence level classifications for AI analysis results
 */
export enum ConfidenceLevel {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

/**
 * Interface for representing confidence scores in AI-generated results
 */
export interface ConfidenceScore {
  /**
   * Numerical confidence score (0-100)
   */
  score: number;
  
  /**
   * Categorized confidence level
   */
  level: ConfidenceLevel;
  
  /**
   * Factors that contributed to the confidence score
   */
  factors: string[];
}

/**
 * Interface for AI model configuration settings
 */
export interface AIModelConfig {
  /**
   * Unique identifier for the AI model
   */
  modelId: string;
  
  /**
   * Version of the AI model
   */
  version: string;
  
  /**
   * Default options for the AI model
   */
  defaultOptions: Record<string, any>;
  
  /**
   * Maximum tokens the model can process
   */
  maxTokens: number;
  
  /**
   * Cost per token for usage tracking
   */
  costPerToken: number;
}

/**
 * Interface for standardized AI service errors
 */
export interface AIServiceError {
  /**
   * Error code
   */
  code: string;
  
  /**
   * Human-readable error message
   */
  message: string;
  
  /**
   * Additional error details
   */
  details: Record<string, any>;
  
  /**
   * Original error object from the service
   */
  originalError: Error;
  
  /**
   * Type of AI service that generated the error
   */
  serviceType: AIServiceType;
}

/**
 * Interface for text analysis request parameters
 */
export interface TextAnalysisRequest {
  /**
   * Text content to analyze
   */
  text: string;
  
  /**
   * Type of analysis to perform
   */
  analysisType: string;
  
  /**
   * AI model to use for analysis
   */
  modelType: AIModelType;
  
  /**
   * Additional options for the analysis
   */
  options: Record<string, any>;
}

/**
 * Interface for text analysis results
 */
export interface TextAnalysisResult {
  /**
   * Analysis result data
   */
  result: Record<string, any>;
  
  /**
   * Confidence score for the analysis
   */
  confidence: ConfidenceScore;
  
  /**
   * Time taken to process the request in milliseconds
   */
  processingTime: number;
  
  /**
   * Model type used for the analysis
   */
  modelType: AIModelType;
}

/**
 * Interface for document analysis results
 */
export interface DocumentAnalysisResult {
  /**
   * ID of the analyzed document
   */
  documentId: string;
  
  /**
   * Data extracted from the document
   */
  extractedData: Record<string, any>;
  
  /**
   * Confidence score for the extraction
   */
  confidence: ConfidenceScore;
  
  /**
   * Time taken to process the document in milliseconds
   */
  processingTime: number;
  
  /**
   * Model type used for the analysis
   */
  modelType: AIModelType;
}

/**
 * Interface for provider matching results
 */
export interface ProviderMatchingResult {
  /**
   * ID of the matched provider
   */
  providerId: string;
  
  /**
   * ID of the client being matched
   */
  clientId: string;
  
  /**
   * Overall compatibility score (0-100)
   */
  compatibilityScore: number;
  
  /**
   * Individual factors that contributed to the match score
   */
  matchFactors: Array<{
    factor: string;
    score: number;
    weight: number;
  }>;
  
  /**
   * Confidence score for the match
   */
  confidence: ConfidenceScore;
}

/**
 * Interface for tracking AI service usage metrics
 */
export interface AIUsageMetrics {
  /**
   * Type of AI service used
   */
  serviceType: AIServiceType;
  
  /**
   * Type of AI model used
   */
  modelType: AIModelType;
  
  /**
   * Number of tokens used in the request
   */
  tokensUsed: number;
  
  /**
   * Time taken to process the request in milliseconds
   */
  processingTime: number;
  
  /**
   * Estimated cost of the AI service usage
   */
  estimatedCost: number;
  
  /**
   * Timestamp when the service was used
   */
  timestamp: Date;
  
  /**
   * ID of the user who initiated the request
   */
  userId: string;
}