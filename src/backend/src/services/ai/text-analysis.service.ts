/**
 * Service that provides text analysis capabilities using AI models for the Revolucare platform.
 * Handles various text analysis tasks including medical text extraction, sentiment analysis,
 * entity recognition, and summarization to support care plan generation, document analysis,
 * and other AI-powered features.
 */

import { 
  TextAnalysisRequest, 
  TextAnalysisResult, 
  AIModelType, 
  AIServiceType,
  ConfidenceScore,
  ConfidenceLevel
} from '../../types/ai.types';
import OpenAIService from '../../integrations/openai';
import { aiServiceConfig } from '../../config/ai';
import { logger } from '../../utils/logger';
import { errorFactory } from '../../utils/error-handler';
import AnalyticsRepository from '../../repositories/analytics.repository';

/**
 * Service class that provides text analysis capabilities using AI models
 */
class TextAnalysisService {
  private openAIService: OpenAIService;
  private analyticsRepository: AnalyticsRepository;
  private initialized: boolean;

  /**
   * Creates a new TextAnalysisService instance
   * @param openAIService - OpenAI service for AI capabilities
   * @param analyticsRepository - Repository for tracking usage metrics
   */
  constructor(openAIService: OpenAIService, analyticsRepository: AnalyticsRepository) {
    this.openAIService = openAIService;
    this.analyticsRepository = analyticsRepository;
    this.initialized = false;
  }

  /**
   * Initializes the text analysis service
   * @returns Promise resolving to initialization status
   */
  async initialize(): Promise<boolean> {
    try {
      // Check if already initialized
      if (this.initialized) {
        logger.info('Text analysis service already initialized');
        return true;
      }

      // Initialize the OpenAI service
      await this.openAIService.initialize(aiServiceConfig);
      
      this.initialized = true;
      logger.info('Text analysis service initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize text analysis service', {
        error: error instanceof Error ? error.message : String(error)
      });
      
      this.initialized = false;
      return false;
    }
  }

  /**
   * Analyzes text using the specified model and analysis type
   * @param request - The analysis request parameters
   * @returns Promise resolving to analysis result with confidence score
   */
  async analyzeText(request: TextAnalysisRequest): Promise<TextAnalysisResult> {
    try {
      // Ensure service is initialized
      if (!this.initialized) {
        await this.initialize();
      }

      // Validate request parameters
      if (!request.text) {
        throw errorFactory.createValidationError(
          'Text content is required for analysis',
          { field: 'text', provided: request.text }
        );
      }

      if (!request.analysisType) {
        throw errorFactory.createValidationError(
          'Analysis type is required',
          { field: 'analysisType', provided: request.analysisType }
        );
      }

      // Default model type if not provided
      const modelType = request.modelType || AIModelType.OPENAI_GPT35_TURBO;
      
      // Start timing for performance tracking
      const startTime = Date.now();
      
      // Select the appropriate analysis method based on the analysis type
      let result: Record<string, any>;
      
      switch (request.analysisType) {
        case 'entity_extraction':
          result = await this.extractEntities(
            request.text, 
            modelType, 
            request.options || {}
          );
          break;
        case 'sentiment_analysis':
          result = await this.analyzeSentiment(
            request.text, 
            modelType, 
            request.options || {}
          );
          break;
        case 'text_summarization':
          result = await this.summarizeText(
            request.text, 
            modelType, 
            request.options || {}
          );
          break;
        case 'medical_extraction':
          result = await this.extractMedicalInfo(
            request.text, 
            modelType, 
            request.options || {}
          );
          break;
        default:
          throw errorFactory.createValidationError(
            `Unsupported analysis type: ${request.analysisType}`,
            { field: 'analysisType', provided: request.analysisType }
          );
      }
      
      // Calculate processing time
      const processingTime = Date.now() - startTime;
      
      // Calculate confidence score
      const confidence = this.calculateConfidenceScore(result, request.analysisType);
      
      // Track usage metrics
      await this.trackUsage(
        request.analysisType,
        modelType,
        processingTime,
        request.options?.userId || 'anonymous'
      );
      
      // Return the analysis result
      return {
        result,
        confidence,
        processingTime,
        modelType
      };
    } catch (error) {
      // Create a standardized error response
      const aiError = errorFactory.createError(
        error instanceof Error ? error.message : 'Text analysis failed',
        error instanceof Error && 'code' in error 
          ? (error as any).code 
          : 'AI_SERVICE_ERROR',
        { analysisType: request.analysisType },
        error instanceof Error ? error : undefined
      );
      
      // Log the error
      logger.error('Text analysis error', {
        error: aiError.message,
        analysisType: request.analysisType,
        modelType: request.modelType
      });
      
      throw aiError;
    }
  }

  /**
   * Extracts named entities from text (e.g., medical conditions, medications, treatments)
   * @param text - The text to analyze
   * @param modelType - The AI model to use
   * @param options - Additional options for the extraction
   * @returns Promise resolving to extracted entities categorized by type
   */
  async extractEntities(
    text: string,
    modelType: AIModelType,
    options: Record<string, any>
  ): Promise<Record<string, any>> {
    try {
      // Prepare the prompt for entity extraction
      const prompt = `
        Extract all named entities from the following text. 
        Categorize them into the following types: medical conditions, medications, treatments, procedures, 
        healthcare providers, dates, organizations, and other important entities.
        
        For each entity, provide the entity text, its category, and any relevant attributes like dosage for medications.
        
        Text to analyze:
        ${text}
        
        Return the results as a structured JSON object with categories as keys and arrays of entities as values.
      `;
      
      // Call OpenAI with the prepared prompt
      const response = await this.openAIService.createChatCompletion(
        [
          { role: 'system', content: 'You are a medical entity extraction assistant that identifies and categorizes entities in medical text.' },
          { role: 'user', content: prompt }
        ],
        modelType,
        { temperature: 0.3, ...options } // Lower temperature for more deterministic results
      );
      
      // Parse the response to extract JSON
      let extractedEntities;
      try {
        // Attempt to parse any JSON in the response
        const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                         response.match(/\{[\s\S]*\}/);
                         
        if (jsonMatch) {
          extractedEntities = JSON.parse(jsonMatch[0].replace(/```json\n|```/g, ''));
        } else {
          // If no JSON format detected, create a simple categorization
          extractedEntities = {
            uncategorized: [{ entity: response, category: 'general' }]
          };
        }
      } catch (parseError) {
        logger.warn('Failed to parse entity extraction response as JSON', {
          error: parseError instanceof Error ? parseError.message : String(parseError),
          response
        });
        
        // Return a simplified structure if parsing fails
        extractedEntities = {
          raw_response: response,
          parsing_error: 'Failed to parse structured entities'
        };
      }
      
      return {
        entities: extractedEntities,
        meta: {
          modelType,
          analysisType: 'entity_extraction',
          textLength: text.length
        }
      };
    } catch (error) {
      logger.error('Entity extraction error', {
        error: error instanceof Error ? error.message : String(error),
        modelType
      });
      
      throw errorFactory.createError(
        'Failed to extract entities from text',
        'AI_SERVICE_ERROR',
        { modelType },
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Analyzes the sentiment and emotional tone of text
   * @param text - The text to analyze
   * @param modelType - The AI model to use
   * @param options - Additional options for the analysis
   * @returns Promise resolving to sentiment analysis results
   */
  async analyzeSentiment(
    text: string,
    modelType: AIModelType,
    options: Record<string, any>
  ): Promise<Record<string, any>> {
    try {
      // Prepare the prompt for sentiment analysis
      const prompt = `
        Analyze the sentiment and emotional tone of the following text.
        Provide an overall sentiment score between -1.0 (very negative) and 1.0 (very positive),
        sentiment category (negative, neutral, positive), 
        emotional tones detected (e.g., joy, sadness, anger, fear, etc.),
        and confidence level in the analysis.
        
        Also identify any significant sentiment shifts within the text.
        
        Text to analyze:
        ${text}
        
        Return the results as a structured JSON object.
      `;
      
      // Call OpenAI with the prepared prompt
      const response = await this.openAIService.createChatCompletion(
        [
          { role: 'system', content: 'You are a sentiment analysis assistant that evaluates the emotional tone and sentiment of text.' },
          { role: 'user', content: prompt }
        ],
        modelType,
        { temperature: 0.3, ...options } // Lower temperature for more deterministic results
      );
      
      // Parse the response to extract JSON
      let sentimentAnalysis;
      try {
        // Attempt to parse any JSON in the response
        const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                         response.match(/\{[\s\S]*\}/);
                         
        if (jsonMatch) {
          sentimentAnalysis = JSON.parse(jsonMatch[0].replace(/```json\n|```/g, ''));
        } else {
          // If no JSON format detected, create a simple analysis
          sentimentAnalysis = {
            raw_analysis: response,
            structured_format: false
          };
        }
      } catch (parseError) {
        logger.warn('Failed to parse sentiment analysis response as JSON', {
          error: parseError instanceof Error ? parseError.message : String(parseError),
          response
        });
        
        // Return a simplified structure if parsing fails
        sentimentAnalysis = {
          raw_response: response,
          parsing_error: 'Failed to parse structured sentiment analysis'
        };
      }
      
      return {
        sentiment: sentimentAnalysis,
        meta: {
          modelType,
          analysisType: 'sentiment_analysis',
          textLength: text.length
        }
      };
    } catch (error) {
      logger.error('Sentiment analysis error', {
        error: error instanceof Error ? error.message : String(error),
        modelType
      });
      
      throw errorFactory.createError(
        'Failed to analyze sentiment of text',
        'AI_SERVICE_ERROR',
        { modelType },
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Generates a concise summary of longer text
   * @param text - The text to summarize
   * @param modelType - The AI model to use
   * @param options - Additional options for the summarization
   * @returns Promise resolving to text summary with key points
   */
  async summarizeText(
    text: string,
    modelType: AIModelType,
    options: Record<string, any>
  ): Promise<Record<string, any>> {
    try {
      // Determine summary length based on options or default
      const summaryLength = options.summaryLength || 'medium';
      let lengthInstruction;
      
      switch (summaryLength) {
        case 'short':
          lengthInstruction = 'Create a very concise summary in 1-2 sentences.';
          break;
        case 'medium':
          lengthInstruction = 'Create a comprehensive summary in 3-5 sentences.';
          break;
        case 'long':
          lengthInstruction = 'Create a detailed summary with all key points in 1-2 paragraphs.';
          break;
        default:
          lengthInstruction = 'Create a comprehensive summary in 3-5 sentences.';
      }
      
      // Prepare the prompt for text summarization
      const prompt = `
        Summarize the following text, focusing on the most important information.
        ${lengthInstruction}
        Also extract 3-5 key points from the text in a bullet point format.
        
        Text to summarize:
        ${text}
        
        Return the results as a structured JSON object with 'summary' and 'keyPoints' fields.
      `;
      
      // Call OpenAI with the prepared prompt
      const response = await this.openAIService.createChatCompletion(
        [
          { role: 'system', content: 'You are a summarization assistant that creates concise and accurate summaries of longer texts.' },
          { role: 'user', content: prompt }
        ],
        modelType,
        { 
          temperature: 0.3, // Lower temperature for more deterministic results
          max_tokens: options.max_tokens || 500,
          ...options 
        }
      );
      
      // Parse the response to extract JSON
      let summaryResult;
      try {
        // Attempt to parse any JSON in the response
        const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                         response.match(/\{[\s\S]*\}/);
                         
        if (jsonMatch) {
          summaryResult = JSON.parse(jsonMatch[0].replace(/```json\n|```/g, ''));
        } else {
          // If no JSON format detected, create a structured result
          const parts = response.split(/Key[ -]Points:|\n\n/);
          
          summaryResult = {
            summary: parts[0].trim(),
            keyPoints: parts.length > 1 
              ? parts[1].split(/\n-|\n•/).filter(p => p.trim()).map(p => p.trim())
              : ['No key points identified']
          };
        }
      } catch (parseError) {
        logger.warn('Failed to parse summary response as JSON', {
          error: parseError instanceof Error ? parseError.message : String(parseError),
          response
        });
        
        // Return a simplified structure if parsing fails
        summaryResult = {
          summary: response.slice(0, Math.min(response.length, 1000)),
          keyPoints: ['Parsing structured format failed'],
          raw_response: response
        };
      }
      
      return {
        summary: summaryResult,
        meta: {
          modelType,
          analysisType: 'text_summarization',
          textLength: text.length,
          compressionRatio: text.length > 0 ? 
            (summaryResult.summary?.length || 0) / text.length : 0
        }
      };
    } catch (error) {
      logger.error('Text summarization error', {
        error: error instanceof Error ? error.message : String(error),
        modelType
      });
      
      throw errorFactory.createError(
        'Failed to summarize text',
        'AI_SERVICE_ERROR',
        { modelType },
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Extracts structured medical information from clinical text
   * @param text - The clinical text to analyze
   * @param modelType - The AI model to use
   * @param options - Additional options for the extraction
   * @returns Promise resolving to structured medical information
   */
  async extractMedicalInfo(
    text: string,
    modelType: AIModelType,
    options: Record<string, any>
  ): Promise<Record<string, any>> {
    try {
      // Prepare the prompt for medical information extraction
      const prompt = `
        Extract structured medical information from the following clinical text.
        Include the following categories where present:
        
        - Diagnoses and conditions
        - Medications (with dosage and frequency if available)
        - Allergies
        - Vital signs and measurements
        - Lab results
        - Procedures and treatments
        - Family history
        - Social history
        - Plans and recommendations
        
        Clinical text:
        ${text}
        
        Return the results as a structured JSON object with categories as keys and extracted information as values.
      `;
      
      // Call OpenAI with the prepared prompt
      const response = await this.openAIService.createChatCompletion(
        [
          { role: 'system', content: 'You are a medical information extraction assistant that identifies and structures clinical information from medical texts.' },
          { role: 'user', content: prompt }
        ],
        modelType,
        { 
          temperature: 0.2, // Very low temperature for more deterministic results
          ...options 
        }
      );
      
      // Parse the response to extract JSON
      let medicalInfo;
      try {
        // Attempt to parse any JSON in the response
        const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                         response.match(/\{[\s\S]*\}/);
                         
        if (jsonMatch) {
          medicalInfo = JSON.parse(jsonMatch[0].replace(/```json\n|```/g, ''));
        } else {
          // If no JSON format detected, create a basic structure
          const sections = response.split(/\n\n|\n(?=[A-Z])/);
          medicalInfo = sections.reduce((acc, section) => {
            const match = section.match(/^(.*?):(.*)/s);
            if (match) {
              const [, key, value] = match;
              acc[key.trim().toLowerCase().replace(/\s+/g, '_')] = value.trim();
            }
            return acc;
          }, {});
        }
      } catch (parseError) {
        logger.warn('Failed to parse medical extraction response as JSON', {
          error: parseError instanceof Error ? parseError.message : String(parseError),
          response
        });
        
        // Return a simplified structure if parsing fails
        medicalInfo = {
          raw_response: response,
          parsing_error: 'Failed to parse structured medical information'
        };
      }
      
      return {
        medical_information: medicalInfo,
        meta: {
          modelType,
          analysisType: 'medical_extraction',
          textLength: text.length
        }
      };
    } catch (error) {
      logger.error('Medical information extraction error', {
        error: error instanceof Error ? error.message : String(error),
        modelType
      });
      
      throw errorFactory.createError(
        'Failed to extract medical information from text',
        'AI_SERVICE_ERROR',
        { modelType },
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Generates vector embeddings for text for similarity comparison
   * @param text - The text to generate embeddings for
   * @param options - Additional options for the embedding generation
   * @returns Promise resolving to vector embeddings for the input text
   */
  async generateEmbeddings(
    text: string | string[],
    options: Record<string, any> = {}
  ): Promise<number[][]> {
    try {
      // Ensure service is initialized
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Validate input text
      if (!text || (Array.isArray(text) && text.length === 0)) {
        throw errorFactory.createValidationError(
          'Text input is required for generating embeddings',
          { field: 'text', provided: text }
        );
      }
      
      // Start timing for performance tracking
      const startTime = Date.now();
      
      // Call OpenAI to generate embeddings
      const embeddings = await this.openAIService.createEmbedding(text, options);
      
      // Calculate processing time
      const processingTime = Date.now() - startTime;
      
      // Track usage metrics
      await this.trackUsage(
        'embedding_generation',
        AIModelType.OPENAI_GPT35_TURBO, // Using as placeholder for embedding model
        processingTime,
        options.userId || 'anonymous'
      );
      
      // Log successful embedding generation
      logger.debug('Embeddings generated successfully', {
        inputType: Array.isArray(text) ? 'array' : 'string',
        count: Array.isArray(text) ? text.length : 1,
        dimensions: embeddings[0]?.length || 0,
        processingTime
      });
      
      return embeddings;
    } catch (error) {
      logger.error('Embedding generation error', {
        error: error instanceof Error ? error.message : String(error)
      });
      
      throw errorFactory.createError(
        'Failed to generate embeddings',
        'AI_SERVICE_ERROR',
        { inputType: Array.isArray(text) ? 'array' : 'string' },
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Calculates a confidence score for analysis results
   * @param result - The analysis result to score
   * @param analysisType - The type of analysis performed
   * @returns Confidence score with numeric value and level
   */
  private calculateConfidenceScore(
    result: Record<string, any>,
    analysisType: string
  ): ConfidenceScore {
    // Initialize default confidence factors
    const factors: string[] = [];
    
    // Start with a base score
    let score = 85; // Default base score of 85 out of 100
    
    // Adjust score based on result completeness and quality
    if (!result || Object.keys(result).length === 0) {
      score = 0;
      factors.push('Empty result');
    } else {
      // Check for error indicators in the result
      if (result.parsing_error || result.error) {
        score -= 40;
        factors.push('Parsing errors detected');
      }
      
      // Check for raw response fallback
      if (result.raw_response) {
        score -= 20;
        factors.push('Unstructured response format');
      }
      
      // Analyze based on analysis type
      switch (analysisType) {
        case 'entity_extraction':
          if (result.entities) {
            const entityCount = this.countEntities(result.entities);
            if (entityCount === 0) {
              score -= 30;
              factors.push('No entities detected');
            } else if (entityCount < 3) {
              score -= 10;
              factors.push('Few entities detected');
            } else {
              factors.push(`${entityCount} entities detected`);
            }
          }
          break;
          
        case 'sentiment_analysis':
          if (result.sentiment) {
            // Check for confidence field in the result if available
            if (result.sentiment.confidence) {
              score = Math.min(score, result.sentiment.confidence * 100);
              factors.push('Model-provided confidence score');
            }
            
            // Check if sentiment is neutral, which may indicate uncertainty
            if (result.sentiment.category === 'neutral' || 
                Math.abs(result.sentiment.score || 0) < 0.2) {
              score -= 5;
              factors.push('Neutral sentiment may indicate uncertainty');
            }
          }
          break;
          
        case 'text_summarization':
          if (result.summary) {
            // Judge summary quality based on length ratio
            const compressionRatio = result.meta?.compressionRatio || 0;
            if (compressionRatio > 0.8) {
              score -= 15;
              factors.push('Summary not significantly shorter than original text');
            } else if (compressionRatio < 0.05) {
              score -= 10;
              factors.push('Summary may be too short compared to original text');
            }
            
            // Check for key points
            if (!result.summary.keyPoints || result.summary.keyPoints.length === 0) {
              score -= 10;
              factors.push('No key points identified');
            }
          }
          break;
          
        case 'medical_extraction':
          if (result.medical_information) {
            // Count categories with content
            const populatedCategories = Object.values(result.medical_information)
              .filter(v => v && typeof v === 'string' ? v.trim().length > 0 : !!v)
              .length;
              
            if (populatedCategories === 0) {
              score -= 40;
              factors.push('No medical information detected');
            } else if (populatedCategories < 3) {
              score -= 20;
              factors.push('Limited medical information detected');
            } else {
              factors.push(`${populatedCategories} information categories populated`);
            }
          }
          break;
          
        default:
          // Generic analysis for other types
          break;
      }
    }
    
    // Ensure score is within valid range
    score = Math.max(0, Math.min(100, score));
    
    // Determine confidence level based on score
    let level: ConfidenceLevel;
    if (score >= 80) {
      level = ConfidenceLevel.HIGH;
    } else if (score >= 50) {
      level = ConfidenceLevel.MEDIUM;
    } else {
      level = ConfidenceLevel.LOW;
    }
    
    // Add level-based factor
    factors.push(`${level.charAt(0).toUpperCase() + level.slice(1)} confidence threshold`);
    
    return {
      score,
      level,
      factors
    };
  }

  /**
   * Counts the total number of entities in an extraction result
   * @param entities - The extracted entities object
   * @returns Total number of entities
   */
  private countEntities(entities: Record<string, any>): number {
    if (!entities) return 0;
    
    let count = 0;
    for (const category in entities) {
      if (Array.isArray(entities[category])) {
        count += entities[category].length;
      }
    }
    return count;
  }

  /**
   * Tracks usage metrics for text analysis operations
   * @param analysisType - Type of analysis performed
   * @param modelType - AI model used
   * @param processingTime - Time taken for processing in milliseconds
   * @param userId - ID of the user who performed the analysis
   */
  private async trackUsage(
    analysisType: string,
    modelType: AIModelType,
    processingTime: number,
    userId: string
  ): Promise<void> {
    try {
      // Create analytics event with usage data
      const event = {
        userId,
        userRole: 'system', // Default role when not provided
        eventType: 'ai_text_analysis',
        eventData: {
          analysisType,
          modelType,
          processingTime,
          timestamp: new Date().toISOString()
        },
        timestamp: new Date()
      };
      
      // Save the event to the analytics repository
      await this.analyticsRepository.saveEvent(event);
      
      // Log usage information
      logger.debug('Text analysis usage tracked', {
        analysisType,
        modelType,
        processingTime
      });
    } catch (error) {
      // Log error but don't fail the operation
      logger.warn('Failed to track text analysis usage', {
        error: error instanceof Error ? error.message : String(error),
        analysisType,
        modelType
      });
    }
  }
}

export { TextAnalysisService };
export default TextAnalysisService;