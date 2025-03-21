/**
 * Integration module that provides a service wrapper for OpenAI API interactions in the Revolucare platform.
 * This module implements a standardized interface for making requests to OpenAI's models,
 * handling authentication, error management, and response processing for various AI-powered features
 * including care plan generation, document analysis, and provider matching.
 */

import { AIModelType, AIServiceType } from '../types/ai.types';
import { 
  ExternalServiceInterface, 
  AIServiceConfig, 
  BaseServiceConfig, 
  WebhookPayload,
  ExternalServiceType 
} from '../interfaces/external-service.interface';
import { openAIConfig } from '../config/ai';
import { errorFactory } from '../utils/error-handler';
import { logger } from '../utils/logger';
import OpenAI from 'openai'; // openai@^4.0.0

/**
 * Service class that provides a wrapper for OpenAI API interactions
 */
class OpenAIService implements ExternalServiceInterface {
  private client: OpenAI;
  private config: AIServiceConfig;
  private initialized: boolean;

  /**
   * Creates a new OpenAIService instance
   * @param config - Configuration for the OpenAI service
   */
  constructor(config?: AIServiceConfig) {
    this.config = config || {
      serviceType: ExternalServiceType.AI,
      apiKey: openAIConfig.apiKey,
      organizationId: openAIConfig.organizationId,
      models: openAIConfig.models,
      endpoint: 'https://api.openai.com/v1',
      timeout: 60000,
      retryConfig: {
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 10000,
        backoffFactor: 2,
        retryableStatusCodes: [429, 500, 502, 503, 504]
      },
      enabled: true
    };
    this.initialized = false;
  }

  /**
   * Initializes the OpenAI service with configuration
   * @param config - Configuration for the service
   */
  async initialize(config: BaseServiceConfig): Promise<void> {
    try {
      // If already initialized, return
      if (this.initialized) {
        logger.info('OpenAI service already initialized');
        return;
      }

      // If config is provided and is of type AIServiceConfig, update this.config
      if (config.serviceType === ExternalServiceType.AI) {
        this.config = {
          ...this.config,
          ...config as AIServiceConfig
        };
      }

      // Validate configuration
      if (!this.config.apiKey) {
        throw new Error('OpenAI API key is required');
      }

      // Create OpenAI client instance
      this.client = new OpenAI({
        apiKey: this.config.apiKey,
        organization: this.config.organizationId,
        timeout: this.config.timeout,
        maxRetries: this.config.retryConfig.maxRetries
      });

      this.initialized = true;
      logger.info('OpenAI service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize OpenAI service', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      this.initialized = false;
      throw this.handleError(error as Error, 'initialize');
    }
  }

  /**
   * Creates a chat completion using OpenAI's chat models
   * @param messages - Array of messages in the conversation
   * @param modelType - Type of model to use for completion
   * @param options - Additional options for the completion request
   * @returns Promise resolving to the generated completion text
   */
  async createChatCompletion(
    messages: Array<{ role: string; content: string }>,
    modelType: AIModelType = AIModelType.OPENAI_GPT35_TURBO,
    options: Record<string, any> = {}
  ): Promise<string> {
    try {
      // Ensure service is initialized
      if (!this.initialized) {
        await this.initialize(this.config);
      }

      // Validate input parameters
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        throw new Error('Messages array is required and must not be empty');
      }

      // Get model configuration based on modelType
      const modelConfig = this.getModelConfig(modelType);
      
      // Start tracking response time
      const startTime = Date.now();

      // Merge default options with provided options
      const requestOptions = {
        ...modelConfig.defaultOptions,
        ...options
      };

      // Prepare request parameters
      const requestParams = {
        model: modelConfig.modelId,
        messages,
        ...requestOptions
      };

      // Make API request
      const response = await this.client.chat.completions.create(requestParams);

      // End tracking response time
      const endTime = Date.now();
      const processingTime = endTime - startTime;

      // Extract completion text from response
      const completionText = response.choices[0]?.message?.content || '';

      // Track token usage
      if (response.usage) {
        this.trackUsage(
          modelType,
          response.usage.prompt_tokens,
          response.usage.completion_tokens,
          AIServiceType.CARE_PLAN_GENERATION
        );
      }

      // Log success
      logger.debug('Chat completion created successfully', {
        modelType,
        processingTime,
        promptTokens: response.usage?.prompt_tokens,
        completionTokens: response.usage?.completion_tokens
      });

      return completionText;
    } catch (error) {
      return this.handleError(error as Error, 'createChatCompletion');
    }
  }

  /**
   * Creates embeddings for text using OpenAI's embedding models
   * @param input - Text or array of texts to embed
   * @param options - Additional options for the embedding request
   * @returns Promise resolving to the generated embeddings
   */
  async createEmbedding(
    input: string | string[],
    options: Record<string, any> = {}
  ): Promise<number[][]> {
    try {
      // Ensure service is initialized
      if (!this.initialized) {
        await this.initialize(this.config);
      }

      // Validate input parameters
      if (!input || (Array.isArray(input) && input.length === 0)) {
        throw new Error('Input text is required and must not be empty');
      }

      // Get embedding model configuration
      const embeddingModel = "text-embedding-ada-002"; // Default embedding model

      // Start tracking response time
      const startTime = Date.now();

      // Prepare request parameters
      const requestParams = {
        model: embeddingModel,
        input: input,
        ...options
      };

      // Make API request
      const response = await this.client.embeddings.create(requestParams);

      // End tracking response time
      const endTime = Date.now();
      const processingTime = endTime - startTime;

      // Extract embeddings from response
      const embeddings = response.data.map(item => item.embedding);

      // Track token usage if available
      if (response.usage) {
        this.trackUsage(
          AIModelType.OPENAI_GPT35_TURBO, // Using as a placeholder for embedding model
          response.usage.prompt_tokens,
          0, // No completion tokens for embeddings
          AIServiceType.PROVIDER_MATCHING
        );
      }

      // Log success
      logger.debug('Embeddings created successfully', {
        embeddingModel,
        processingTime,
        inputCount: Array.isArray(input) ? input.length : 1,
        promptTokens: response.usage?.prompt_tokens
      });

      return embeddings;
    } catch (error) {
      return this.handleError(error as Error, 'createEmbedding');
    }
  }

  /**
   * Validates OpenAI webhook payloads
   * @param payload - The webhook payload to validate
   * @returns Promise resolving to true if webhook is valid
   */
  async validateWebhook(payload: WebhookPayload): Promise<boolean> {
    try {
      // Ensure service is initialized
      if (!this.initialized) {
        await this.initialize(this.config);
      }

      // Extract body and headers from the payload
      const { body, headers, timestamp } = payload;

      // OpenAI doesn't currently provide webhook signature verification
      // This is a placeholder for future implementation

      // For now, validate basic payload structure
      if (!body || typeof body !== 'object') {
        logger.warn('Invalid webhook payload format', { payload });
        return false;
      }

      // Check for required webhook fields (customize based on OpenAI's webhook format)
      if (!body.id || !body.object) {
        logger.warn('Missing required fields in webhook payload', { payload });
        return false;
      }

      logger.info('Webhook validated successfully', { 
        webhookId: body.id,
        webhookObject: body.object,
        timestamp
      });
      
      return true;
    } catch (error) {
      logger.error('Error validating webhook', { 
        error: error instanceof Error ? error.message : String(error),
        payload: JSON.stringify(payload)
      });
      return false;
    }
  }

  /**
   * Gets the current status of the OpenAI service
   * @returns Promise resolving to the service status
   */
  async getStatus(): Promise<{ status: string; details: Record<string, any> }> {
    try {
      // Ensure service is initialized
      if (!this.initialized) {
        await this.initialize(this.config);
      }

      // Make a lightweight API request to check availability
      // OpenAI doesn't have a dedicated status endpoint, so we'll use models list
      const response = await this.client.models.list();

      return {
        status: 'available',
        details: {
          modelsAvailable: response.data.length,
          latency: 0, // We could calculate this if needed
          quotaRemaining: 'unknown' // OpenAI doesn't provide this directly
        }
      };
    } catch (error) {
      logger.error('Error checking OpenAI service status', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      
      return {
        status: 'unavailable',
        details: {
          error: error instanceof Error ? error.message : String(error),
          lastChecked: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Makes a generic request to the OpenAI API
   * @param endpoint - The API endpoint to request
   * @param payload - Request payload
   * @param options - Additional request options
   * @returns Promise resolving to the API response
   */
  async request<T>(
    endpoint: string,
    payload?: Record<string, any>,
    options?: Record<string, any>
  ): Promise<T> {
    try {
      // Ensure service is initialized
      if (!this.initialized) {
        await this.initialize(this.config);
      }

      // Validate input parameters
      if (!endpoint) {
        throw new Error('Endpoint is required for OpenAI API request');
      }

      // For OpenAI client v4, we need to handle endpoints differently
      // This implementation will vary based on the specific endpoint needed
      let response;
      
      // Merge options with default configuration
      const requestOptions = {
        ...options
      };
      
      switch (endpoint) {
        case 'chat.completions':
          response = await this.client.chat.completions.create({
            ...payload,
            ...requestOptions
          });
          break;
        case 'embeddings':
          response = await this.client.embeddings.create({
            ...payload,
            ...requestOptions
          });
          break;
        case 'models.list':
          response = await this.client.models.list();
          break;
        default:
          throw new Error(`Unsupported endpoint: ${endpoint}`);
      }

      return response as unknown as T;
    } catch (error) {
      return this.handleError(error as Error, `request:${endpoint}`);
    }
  }

  /**
   * Handles and formats OpenAI API errors
   * @param error - The error to handle
   * @param operation - The operation that caused the error
   * @returns Never returns, always throws a formatted error
   */
  private handleError(error: Error, operation: string): never {
    let errorMessage = error.message || 'Unknown error occurred';
    let errorCode = 'AI_SERVICE_ERROR';
    let statusCode = 500;
    let errorDetails: Record<string, any> = {};

    // Extract details from OpenAI error if available
    if (error instanceof OpenAI.APIError) {
      errorMessage = error.message;
      statusCode = error.status || 500;
      
      // Map specific OpenAI error types
      if (error.code === 'insufficient_quota') {
        errorCode = 'RATE_LIMIT_EXCEEDED';
        errorMessage = 'OpenAI API quota exceeded';
      } else if (error.code === 'invalid_request_error') {
        errorCode = 'VALIDATION_ERROR';
      } else if (error.code === 'context_length_exceeded') {
        errorCode = 'VALIDATION_ERROR';
        errorMessage = 'Input too long for model context window';
      }
      
      // Add error details
      errorDetails = {
        openaiError: {
          type: error.type,
          code: error.code,
          param: error.param
        },
        operation
      };
    } else {
      // Generic error handling
      errorDetails = { operation };
    }

    // Log the error
    logger.error(`OpenAI service error during ${operation}`, {
      error: errorMessage,
      details: errorDetails
    });

    // Create and throw a standardized error
    throw errorFactory.createError(
      errorMessage,
      errorCode as any,
      errorDetails,
      error
    );
  }

  /**
   * Gets the configuration for a specific AI model
   * @param modelType - The type of AI model
   * @returns The model configuration
   */
  private getModelConfig(modelType: AIModelType): any {
    // Get model configuration from openAIConfig
    const modelConfig = openAIConfig.models[modelType];
    
    // If model configuration doesn't exist, use a default
    if (!modelConfig) {
      logger.warn(`Model configuration not found for ${modelType}, using GPT-3.5 Turbo as fallback`);
      return openAIConfig.models[AIModelType.OPENAI_GPT35_TURBO];
    }
    
    return modelConfig;
  }

  /**
   * Tracks token usage and costs for OpenAI API calls
   * @param modelType - Type of model used
   * @param promptTokens - Number of prompt tokens used
   * @param completionTokens - Number of completion tokens used
   * @param serviceType - Type of AI service
   */
  private trackUsage(
    modelType: AIModelType,
    promptTokens: number,
    completionTokens: number,
    serviceType: AIServiceType
  ): void {
    // Get model configuration
    const modelConfig = this.getModelConfig(modelType);
    
    // Calculate total tokens
    const totalTokens = promptTokens + completionTokens;
    
    // Calculate estimated cost
    // This is a simplified calculation and might need adjustment based on OpenAI's pricing
    const estimatedCost = totalTokens * modelConfig.costPerToken;
    
    // Log usage metrics
    logger.info('OpenAI API usage tracked', {
      modelType,
      serviceType,
      promptTokens,
      completionTokens,
      totalTokens,
      estimatedCost: `$${estimatedCost.toFixed(6)}`
    });
    
    // Here we could store the usage data in a database for analytics
    // This would be an async operation and not blocking the response
  }
}

// Export the service class
export { OpenAIService };

// Create and export a default instance for dependency injection
export default new OpenAIService();