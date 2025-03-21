/**
 * AI Service Configuration
 *
 * This file contains configuration settings for the AI services used in the Revolucare platform,
 * including OpenAI for care plan generation and text analysis, and Azure Form Recognizer for 
 * document analysis. It defines API keys, model parameters, and default options.
 */

import { AIModelType, AIModelConfig } from '../types/ai.types';
import { AIServiceConfig, ExternalServiceType } from '../interfaces/external-service.interface';
// Import dotenv for loading environment variables (version ^16.0.3)
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

/**
 * Default options for OpenAI model requests
 */
export const DEFAULT_OPENAI_MODEL_OPTIONS = {
  temperature: 0.7,
  top_p: 1,
  frequency_penalty: 0,
  presence_penalty: 0
};

/**
 * Configuration for GPT-4 model
 * Used for high-complexity tasks like care plan generation with highest accuracy
 */
export const GPT4_CONFIG: AIModelConfig = {
  modelId: 'gpt-4',
  version: 'latest',
  defaultOptions: {
    ...DEFAULT_OPENAI_MODEL_OPTIONS,
    max_tokens: 4000,
  },
  maxTokens: 8192,
  costPerToken: 0.00003, // $0.03 per 1000 tokens
};

/**
 * Configuration for GPT-3.5 Turbo model
 * Used for less complex tasks and where lower cost is preferred
 */
export const GPT35_TURBO_CONFIG: AIModelConfig = {
  modelId: 'gpt-3.5-turbo',
  version: 'latest',
  defaultOptions: {
    ...DEFAULT_OPENAI_MODEL_OPTIONS,
    max_tokens: 2000,
  },
  maxTokens: 4096,
  costPerToken: 0.000002, // $0.002 per 1000 tokens
};

/**
 * Configuration for Azure Form Recognizer model
 * Used for medical document analysis and data extraction
 */
export const FORM_RECOGNIZER_CONFIG: AIModelConfig = {
  modelId: 'prebuilt-document',
  version: 'latest',
  defaultOptions: {},
  maxTokens: 0, // Not applicable for Form Recognizer
  costPerToken: 0, // Custom pricing model
};

/**
 * Configuration for text embedding model
 * Used for semantic search and provider matching algorithms
 */
export const EMBEDDING_MODEL_CONFIG: AIModelConfig = {
  modelId: 'text-embedding-ada-002',
  version: 'latest',
  defaultOptions: {},
  maxTokens: 8191,
  costPerToken: 0.0000001, // $0.0001 per 1000 tokens
};

/**
 * Loads AI configuration from environment variables
 * @returns AI service configuration object
 */
function loadAIConfig(): AIServiceConfig {
  // Ensure environment variables are loaded
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }

  // Extract OpenAI API key from environment variables
  const openAIApiKey = process.env.OPENAI_API_KEY;
  // Extract OpenAI organization ID from environment variables
  const openAIOrganizationId = process.env.OPENAI_ORGANIZATION_ID || '';
  // Extract Azure Form Recognizer key from environment variables
  const azureFormRecognizerKey = process.env.AZURE_FORM_RECOGNIZER_KEY || '';
  // Extract Azure Form Recognizer endpoint from environment variables
  const azureFormRecognizerEndpoint = process.env.AZURE_FORM_RECOGNIZER_ENDPOINT || '';

  // Construct and return the AI service configuration object
  return {
    serviceType: ExternalServiceType.AI,
    apiKey: openAIApiKey,
    organizationId: openAIOrganizationId,
    models: {
      [AIModelType.OPENAI_GPT4]: GPT4_CONFIG,
      [AIModelType.OPENAI_GPT35_TURBO]: GPT35_TURBO_CONFIG,
      [AIModelType.AZURE_FORM_RECOGNIZER]: FORM_RECOGNIZER_CONFIG,
    },
    endpoint: 'https://api.openai.com/v1',
    timeout: 60000, // 60 seconds
    retryConfig: {
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 10000,
      backoffFactor: 2,
      retryableStatusCodes: [429, 500, 502, 503, 504]
    },
    enabled: true
  };
}

/**
 * Configuration for OpenAI services
 */
export const openAIConfig = {
  apiKey: process.env.OPENAI_API_KEY || '',
  organizationId: process.env.OPENAI_ORGANIZATION_ID || '',
  models: {
    [AIModelType.OPENAI_GPT4]: GPT4_CONFIG,
    [AIModelType.OPENAI_GPT35_TURBO]: GPT35_TURBO_CONFIG,
  },
};

/**
 * Configuration for Azure Form Recognizer services
 */
export const azureFormRecognizerConfig = {
  apiKey: process.env.AZURE_FORM_RECOGNIZER_KEY || '',
  endpoint: process.env.AZURE_FORM_RECOGNIZER_ENDPOINT || '',
  models: {
    'document-analysis': FORM_RECOGNIZER_CONFIG,
  },
};

/**
 * Combined AI service configuration for external service integration
 */
export const aiServiceConfig = loadAIConfig();

/**
 * Default export of the AI service configuration
 */
export default aiServiceConfig;