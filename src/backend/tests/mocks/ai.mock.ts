import { 
  AIModelType, 
  AIServiceType, 
  ConfidenceScore, 
  ConfidenceLevel, 
  TextAnalysisRequest, 
  TextAnalysisResult, 
  DocumentAnalysisResult, 
  ProviderMatchingResult 
} from '../../src/types/ai.types';
import { DOCUMENT_ANALYSIS_TYPES } from '../../src/constants/document-types';
import jest from 'jest'; // v^29.0.0

/**
 * Default factors used in confidence score calculations
 */
const DEFAULT_CONFIDENCE_FACTORS = ['data_quality', 'model_confidence', 'input_completeness'];

/**
 * Threshold values for confidence level classification
 */
const CONFIDENCE_THRESHOLDS = {
  HIGH: 0.8,
  MEDIUM: 0.6,
  LOW: 0.4
};

/**
 * Creates a mock confidence score object with specified score value
 * 
 * @param score - Numerical confidence score (0-100)
 * @param factors - Factors that contributed to the confidence score
 * @returns A mock confidence score object
 */
export function createMockConfidenceScore(
  score: number, 
  factors: string[] = DEFAULT_CONFIDENCE_FACTORS
): ConfidenceScore {
  let level: ConfidenceLevel;
  
  if (score >= CONFIDENCE_THRESHOLDS.HIGH * 100) {
    level = ConfidenceLevel.HIGH;
  } else if (score >= CONFIDENCE_THRESHOLDS.MEDIUM * 100) {
    level = ConfidenceLevel.MEDIUM;
  } else if (score >= CONFIDENCE_THRESHOLDS.LOW * 100) {
    level = ConfidenceLevel.LOW;
  } else {
    level = ConfidenceLevel.LOW;
  }
  
  return {
    score,
    level,
    factors: factors.slice(0, Math.min(factors.length, 3)) // Limit to max 3 factors
  };
}

/**
 * Creates a mock text analysis result with specified parameters
 * 
 * @param result - The analysis result data
 * @param confidenceScore - Numerical confidence score (0-100)
 * @param modelType - The AI model type used for analysis
 * @returns A mock text analysis result
 */
export function createMockTextAnalysisResult(
  result: Record<string, any>,
  confidenceScore: number = 85,
  modelType: AIModelType = AIModelType.OPENAI_GPT4
): TextAnalysisResult {
  return {
    result,
    confidence: createMockConfidenceScore(confidenceScore),
    processingTime: Math.floor(Math.random() * 1000) + 500, // Random time between 500-1500ms
    modelType
  };
}

/**
 * Creates a mock document analysis result with specified parameters
 * 
 * @param documentId - ID of the analyzed document
 * @param extractedData - Data extracted from the document
 * @param confidenceScore - Numerical confidence score (0-100)
 * @param modelType - The AI model type used for analysis
 * @returns A mock document analysis result
 */
export function createMockDocumentAnalysisResult(
  documentId: string,
  extractedData: Record<string, any>,
  confidenceScore: number = 85,
  modelType: AIModelType = AIModelType.AZURE_FORM_RECOGNIZER
): DocumentAnalysisResult {
  return {
    documentId,
    extractedData,
    confidence: createMockConfidenceScore(confidenceScore),
    processingTime: Math.floor(Math.random() * 2000) + 1000, // Random time between 1000-3000ms
    modelType
  };
}

/**
 * Creates a mock provider matching result with specified parameters
 * 
 * @param providerId - ID of the matched provider
 * @param clientId - ID of the client being matched
 * @param compatibilityScore - Overall compatibility score (0-100)
 * @param matchFactors - Individual factors that contributed to the match score
 * @returns A mock provider matching result
 */
export function createMockProviderMatchingResult(
  providerId: string,
  clientId: string,
  compatibilityScore: number = 85,
  matchFactors: Array<{ factor: string; score: number; weight: number }> = []
): ProviderMatchingResult {
  // Generate default match factors if none provided
  if (matchFactors.length === 0) {
    matchFactors = [
      { factor: 'specialty_match', score: 90, weight: 0.3 },
      { factor: 'location_proximity', score: 85, weight: 0.2 },
      { factor: 'availability', score: 80, weight: 0.2 },
      { factor: 'experience', score: 75, weight: 0.15 },
      { factor: 'client_preference', score: 85, weight: 0.15 }
    ];
  }
  
  return {
    providerId,
    clientId,
    compatibilityScore,
    matchFactors,
    confidence: createMockConfidenceScore(compatibilityScore)
  };
}

/**
 * Mock implementation of the OpenAI service for testing
 */
export class MockOpenAIService {
  initialized: boolean;
  config: Record<string, any>;
  mockResponses: Record<string, any>;

  /**
   * Creates a new MockOpenAIService instance
   * 
   * @param mockResponses - Custom mock responses for testing
   */
  constructor(mockResponses: Record<string, any> = {}) {
    this.mockResponses = mockResponses;
    this.initialized = false;
    this.config = {};
  }

  /**
   * Initializes the mock OpenAI service
   * 
   * @param config - Configuration options
   * @returns Promise resolving to true
   */
  async initialize(config: Record<string, any> = {}): Promise<boolean> {
    this.config = config;
    this.initialized = true;
    return true;
  }

  /**
   * Mock implementation of createChatCompletion
   * 
   * @param messages - Array of message objects with role and content
   * @param modelType - The AI model to use
   * @param options - Additional options for the completion
   * @returns Promise resolving to the completion text
   */
  async createChatCompletion(
    messages: Array<{ role: string, content: string }>,
    modelType: AIModelType = AIModelType.OPENAI_GPT4,
    options: Record<string, any> = {}
  ): Promise<string> {
    if (!this.initialized) {
      throw new Error('OpenAI service not initialized');
    }
    
    // Check if we should simulate a failure
    if (options.simulateFailure) {
      throw new Error('Simulated OpenAI failure');
    }
    
    // Try to find a matching mock response based on the content of the last message
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && this.mockResponses.completions) {
      for (const pattern in this.mockResponses.completions) {
        if (lastMessage.content.includes(pattern)) {
          return this.mockResponses.completions[pattern];
        }
      }
    }
    
    // Return a default mock response based on the model type
    if (modelType === AIModelType.OPENAI_GPT4) {
      return "This is a mock completion from GPT-4. The quality of this response would be higher in a real implementation.";
    } else {
      return "This is a mock completion from GPT-3.5 Turbo. The response is generated for testing purposes.";
    }
  }

  /**
   * Mock implementation of createEmbedding
   * 
   * @param input - Text or array of texts to embed
   * @param options - Additional options for the embedding
   * @returns Promise resolving to embedding vectors
   */
  async createEmbedding(
    input: string | string[],
    options: Record<string, any> = {}
  ): Promise<number[][]> {
    if (!this.initialized) {
      throw new Error('OpenAI service not initialized');
    }
    
    // Check if we should simulate a failure
    if (options.simulateFailure) {
      throw new Error('Simulated OpenAI failure');
    }
    
    // Convert input to array if it's a string
    const inputs = Array.isArray(input) ? input : [input];
    
    // Generate mock embedding vectors (using deterministic method based on input length)
    return inputs.map(text => {
      // Generate a vector with dimensionality based on input length or default to 10
      const dimensions = options.dimensions || 10;
      return Array.from({ length: dimensions }, (_, i) => {
        // Generate a deterministic but seemingly random value based on text and position
        const seed = text.length * (i + 1);
        return (Math.sin(seed) + 1) / 2; // Values between 0 and 1
      });
    });
  }

  /**
   * Mock implementation of validateWebhook
   * 
   * @param payload - Webhook payload
   * @param headers - Request headers
   * @returns Promise resolving to true if webhook is valid
   */
  async validateWebhook(
    payload: Record<string, any>,
    headers: Record<string, string>
  ): Promise<boolean> {
    // For testing purposes, always return true unless configured to fail
    if (payload.simulateInvalidWebhook) {
      return false;
    }
    return true;
  }

  /**
   * Mock implementation of getStatus
   * 
   * @returns Promise resolving to service status information
   */
  async getStatus(): Promise<{ status: string, details: Record<string, any> }> {
    // For testing purposes, return available status unless configured to be unavailable
    if (this.config.simulateUnavailable) {
      return {
        status: 'unavailable',
        details: {
          reason: 'Simulated unavailability for testing',
          estimatedResolution: 'Unknown'
        }
      };
    }
    
    return {
      status: 'available',
      details: {
        version: '1.0.0',
        uptime: '99.9%',
        rateLimitRemaining: 1000
      }
    };
  }

  /**
   * Mock implementation of generic request method
   * 
   * @param endpoint - API endpoint
   * @param params - Request parameters
   * @param method - HTTP method
   * @returns Promise resolving to API response
   */
  async request(
    endpoint: string,
    params: Record<string, any> = {},
    method: string = 'POST'
  ): Promise<Record<string, any>> {
    if (!this.initialized) {
      throw new Error('OpenAI service not initialized');
    }
    
    // Check if we should simulate a failure
    if (params.simulateFailure) {
      throw new Error(`Simulated OpenAI failure for endpoint: ${endpoint}`);
    }
    
    // Try to find a matching mock response based on the endpoint
    if (this.mockResponses[endpoint]) {
      return this.mockResponses[endpoint];
    }
    
    // Return a default mock response
    return {
      success: true,
      data: {
        message: `Mock response for ${endpoint}`,
        method: method,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Sets or updates mock responses for testing
   * 
   * @param responses - New mock responses
   */
  setMockResponses(responses: Record<string, any>): void {
    this.mockResponses = { ...this.mockResponses, ...responses };
  }
}

/**
 * Mock implementation of the Azure Form Recognizer service for testing
 */
export class MockAzureFormRecognizerService {
  initialized: boolean;
  mockResponses: Record<string, any>;

  /**
   * Creates a new MockAzureFormRecognizerService instance
   * 
   * @param mockResponses - Custom mock responses for testing
   */
  constructor(mockResponses: Record<string, any> = {}) {
    this.mockResponses = mockResponses;
    this.initialized = false;
  }

  /**
   * Initializes the mock Azure Form Recognizer service
   * 
   * @returns Promise resolving to true
   */
  async initialize(): Promise<boolean> {
    this.initialized = true;
    return true;
  }

  /**
   * Mock implementation of analyzeDocument
   * 
   * @param documentId - Document ID
   * @param documentUrl - URL to the document
   * @param analysisType - Type of analysis to perform
   * @param options - Additional options for the analysis
   * @returns Promise resolving to document analysis result
   */
  async analyzeDocument(
    documentId: string,
    documentUrl: string,
    analysisType: string,
    options: Record<string, any> = {}
  ): Promise<DocumentAnalysisResult> {
    if (!this.initialized) {
      throw new Error('Azure Form Recognizer service not initialized');
    }
    
    // Check if we should simulate a failure
    if (options.simulateFailure) {
      throw new Error('Simulated Azure Form Recognizer failure');
    }
    
    // Determine which specific analysis method to call based on the analysisType
    switch (analysisType) {
      case DOCUMENT_ANALYSIS_TYPES.MEDICAL_EXTRACTION:
        const medicalData = await this.extractMedicalData(documentId, documentUrl, options);
        return createMockDocumentAnalysisResult(
          documentId,
          medicalData,
          options.confidenceScore || 90,
          AIModelType.AZURE_FORM_RECOGNIZER
        );
      
      case DOCUMENT_ANALYSIS_TYPES.TEXT_EXTRACTION:
        const textData = await this.extractText(documentId, documentUrl, options);
        return createMockDocumentAnalysisResult(
          documentId,
          { text: textData.text, pages: textData.pages },
          textData.confidence,
          AIModelType.AZURE_FORM_RECOGNIZER
        );
      
      case DOCUMENT_ANALYSIS_TYPES.FORM_RECOGNITION:
        const formData = await this.recognizeForm(documentId, documentUrl, options);
        return createMockDocumentAnalysisResult(
          documentId,
          { fields: formData.fields },
          formData.confidence,
          AIModelType.AZURE_FORM_RECOGNIZER
        );
      
      case DOCUMENT_ANALYSIS_TYPES.IDENTITY_VERIFICATION:
        const identityData = await this.verifyIdentity(documentId, documentUrl, options);
        return createMockDocumentAnalysisResult(
          documentId,
          { 
            identityInfo: identityData.identityInfo,
            isValid: identityData.isValid
          },
          identityData.confidence,
          AIModelType.AZURE_FORM_RECOGNIZER
        );
      
      default:
        throw new Error(`Unsupported analysis type: ${analysisType}`);
    }
  }

  /**
   * Mock implementation of extractMedicalData
   * 
   * @param documentId - Document ID
   * @param documentUrl - URL to the document
   * @param options - Additional options
   * @returns Promise resolving to extracted medical data
   */
  async extractMedicalData(
    documentId: string,
    documentUrl: string,
    options: Record<string, any> = {}
  ): Promise<Record<string, any>> {
    if (!this.initialized) {
      throw new Error('Azure Form Recognizer service not initialized');
    }
    
    // Check if we should simulate a failure
    if (options.simulateFailure) {
      throw new Error('Simulated Azure Form Recognizer failure');
    }
    
    // Try to find a matching mock response based on the documentId
    if (this.mockResponses.medicalData && this.mockResponses.medicalData[documentId]) {
      return this.mockResponses.medicalData[documentId];
    }
    
    // Return default mock medical data
    return {
      patientInfo: {
        name: 'John Doe',
        dob: '1980-01-15',
        gender: 'Male',
        mrn: '12345678'
      },
      diagnoses: [
        {
          code: 'F41.1',
          description: 'Generalized Anxiety Disorder',
          date: '2022-03-15'
        },
        {
          code: 'I10',
          description: 'Essential Hypertension',
          date: '2021-07-22'
        }
      ],
      medications: [
        {
          name: 'Lisinopril',
          dosage: '10mg',
          frequency: 'Daily',
          startDate: '2021-07-22'
        },
        {
          name: 'Sertraline',
          dosage: '50mg',
          frequency: 'Daily',
          startDate: '2022-03-18'
        }
      ],
      allergies: [
        {
          allergen: 'Penicillin',
          reaction: 'Rash',
          severity: 'Moderate'
        }
      ],
      vitalSigns: {
        height: '180 cm',
        weight: '75 kg',
        bloodPressure: '120/80 mmHg',
        heartRate: '72 bpm',
        temperature: '36.6 C'
      }
    };
  }

  /**
   * Mock implementation of extractText
   * 
   * @param documentId - Document ID
   * @param documentUrl - URL to the document
   * @param options - Additional options
   * @returns Promise resolving to extracted text data
   */
  async extractText(
    documentId: string,
    documentUrl: string,
    options: Record<string, any> = {}
  ): Promise<{ text: string; pages: number; confidence: number }> {
    if (!this.initialized) {
      throw new Error('Azure Form Recognizer service not initialized');
    }
    
    // Check if we should simulate a failure
    if (options.simulateFailure) {
      throw new Error('Simulated Azure Form Recognizer failure');
    }
    
    // Try to find a matching mock response based on the documentId
    if (this.mockResponses.textExtraction && this.mockResponses.textExtraction[documentId]) {
      return this.mockResponses.textExtraction[documentId];
    }
    
    // Return default mock text extraction data
    return {
      text: 'This is sample extracted text from a document. It would contain multiple paragraphs and potentially span several pages in a real implementation. The content would be specific to the document being analyzed.',
      pages: 3,
      confidence: 92
    };
  }

  /**
   * Mock implementation of recognizeForm
   * 
   * @param documentId - Document ID
   * @param documentUrl - URL to the document
   * @param options - Additional options
   * @returns Promise resolving to form recognition data
   */
  async recognizeForm(
    documentId: string,
    documentUrl: string,
    options: Record<string, any> = {}
  ): Promise<{ fields: Record<string, any>; confidence: number }> {
    if (!this.initialized) {
      throw new Error('Azure Form Recognizer service not initialized');
    }
    
    // Check if we should simulate a failure
    if (options.simulateFailure) {
      throw new Error('Simulated Azure Form Recognizer failure');
    }
    
    // Try to find a matching mock response based on the documentId
    if (this.mockResponses.formRecognition && this.mockResponses.formRecognition[documentId]) {
      return this.mockResponses.formRecognition[documentId];
    }
    
    // Return default mock form recognition data
    return {
      fields: {
        firstName: { text: 'John', confidence: 0.95 },
        lastName: { text: 'Doe', confidence: 0.97 },
        email: { text: 'john.doe@example.com', confidence: 0.92 },
        phone: { text: '555-123-4567', confidence: 0.89 },
        address: { text: '123 Main St, Anytown, USA', confidence: 0.85 },
        signature: { detected: true, confidence: 0.93 }
      },
      confidence: 88
    };
  }

  /**
   * Mock implementation of verifyIdentity
   * 
   * @param documentId - Document ID
   * @param documentUrl - URL to the document
   * @param options - Additional options
   * @returns Promise resolving to identity verification data
   */
  async verifyIdentity(
    documentId: string,
    documentUrl: string,
    options: Record<string, any> = {}
  ): Promise<{ identityInfo: Record<string, any>; isValid: boolean; confidence: number }> {
    if (!this.initialized) {
      throw new Error('Azure Form Recognizer service not initialized');
    }
    
    // Check if we should simulate a failure
    if (options.simulateFailure) {
      throw new Error('Simulated Azure Form Recognizer failure');
    }
    
    // Try to find a matching mock response based on the documentId
    if (this.mockResponses.identityVerification && this.mockResponses.identityVerification[documentId]) {
      return this.mockResponses.identityVerification[documentId];
    }
    
    // Return default mock identity verification data
    return {
      identityInfo: {
        documentType: 'Driver License',
        documentNumber: 'DL12345678',
        fullName: 'John Smith Doe',
        dateOfBirth: '1980-05-15',
        expirationDate: '2025-05-15',
        issuingAuthority: 'State Department of Motor Vehicles',
        address: '123 Main Street, Anytown, USA 12345'
      },
      isValid: true,
      confidence: 94
    };
  }

  /**
   * Sets or updates mock responses for testing
   * 
   * @param responses - New mock responses
   */
  setMockResponses(responses: Record<string, any>): void {
    this.mockResponses = { ...this.mockResponses, ...responses };
  }
}

/**
 * Mock implementation of the Text Analysis service for testing
 */
export class MockTextAnalysisService {
  initialized: boolean;
  openAIService: MockOpenAIService;
  mockResponses: Record<string, any>;

  /**
   * Creates a new MockTextAnalysisService instance
   * 
   * @param openAIService - Mock OpenAI service instance
   * @param mockResponses - Custom mock responses for testing
   */
  constructor(
    openAIService: MockOpenAIService,
    mockResponses: Record<string, any> = {}
  ) {
    this.openAIService = openAIService;
    this.mockResponses = mockResponses;
    this.initialized = false;
  }

  /**
   * Initializes the mock Text Analysis service
   * 
   * @returns Promise resolving to true
   */
  async initialize(): Promise<boolean> {
    this.initialized = true;
    return true;
  }

  /**
   * Mock implementation of analyzeText
   * 
   * @param request - Text analysis request
   * @returns Promise resolving to text analysis result
   */
  async analyzeText(request: TextAnalysisRequest): Promise<TextAnalysisResult> {
    if (!this.initialized) {
      throw new Error('Text Analysis service not initialized');
    }
    
    // Check if we should simulate a failure
    if (request.options?.simulateFailure) {
      throw new Error('Simulated Text Analysis failure');
    }
    
    // Determine which specific analysis method to call based on the analysisType
    switch (request.analysisType) {
      case 'entity_extraction':
        const entities = await this.extractEntities(request.text, request.modelType, request.options);
        return createMockTextAnalysisResult(entities, 88, request.modelType);
      
      case 'sentiment_analysis':
        const sentiment = await this.analyzeSentiment(request.text, request.modelType, request.options);
        return createMockTextAnalysisResult(sentiment, 90, request.modelType);
      
      case 'text_summarization':
        const summary = await this.summarizeText(request.text, request.modelType, request.options);
        return createMockTextAnalysisResult(summary, 85, request.modelType);
      
      case 'medical_info_extraction':
        const medicalInfo = await this.extractMedicalInfo(request.text, request.modelType, request.options);
        return createMockTextAnalysisResult(medicalInfo, 92, request.modelType);
      
      default:
        throw new Error(`Unsupported analysis type: ${request.analysisType}`);
    }
  }

  /**
   * Mock implementation of extractEntities
   * 
   * @param text - Text to analyze
   * @param modelType - AI model to use
   * @param options - Additional options
   * @returns Promise resolving to extracted entities
   */
  async extractEntities(
    text: string,
    modelType: AIModelType = AIModelType.OPENAI_GPT4,
    options: Record<string, any> = {}
  ): Promise<Record<string, any>> {
    if (!this.initialized) {
      throw new Error('Text Analysis service not initialized');
    }
    
    // Check if we should simulate a failure
    if (options.simulateFailure) {
      throw new Error('Simulated Text Analysis failure');
    }
    
    // Try to find a matching mock response based on text pattern
    if (this.mockResponses.entities) {
      for (const pattern in this.mockResponses.entities) {
        if (text.includes(pattern)) {
          return this.mockResponses.entities[pattern];
        }
      }
    }
    
    // Return default mock entities
    return {
      entities: [
        {
          text: 'John Smith',
          type: 'PERSON',
          offset: 10,
          length: 10,
          confidence: 0.95
        },
        {
          text: 'New York',
          type: 'LOCATION',
          offset: 35,
          length: 8,
          confidence: 0.92
        },
        {
          text: 'May 15, 2023',
          type: 'DATE',
          offset: 60,
          length: 12,
          confidence: 0.98
        }
      ],
      statistics: {
        totalEntities: 3,
        uniqueEntityTypes: 3
      }
    };
  }

  /**
   * Mock implementation of analyzeSentiment
   * 
   * @param text - Text to analyze
   * @param modelType - AI model to use
   * @param options - Additional options
   * @returns Promise resolving to sentiment analysis
   */
  async analyzeSentiment(
    text: string,
    modelType: AIModelType = AIModelType.OPENAI_GPT4,
    options: Record<string, any> = {}
  ): Promise<Record<string, any>> {
    if (!this.initialized) {
      throw new Error('Text Analysis service not initialized');
    }
    
    // Check if we should simulate a failure
    if (options.simulateFailure) {
      throw new Error('Simulated Text Analysis failure');
    }
    
    // Try to find a matching mock response based on text pattern
    if (this.mockResponses.sentiment) {
      for (const pattern in this.mockResponses.sentiment) {
        if (text.includes(pattern)) {
          return this.mockResponses.sentiment[pattern];
        }
      }
    }
    
    // Return default mock sentiment analysis
    // Simple heuristic: check for positive/negative words to determine sentiment
    const hasPositive = /good|great|excellent|happy|pleased|satisfied/i.test(text);
    const hasNegative = /bad|poor|terrible|unhappy|disappointed|frustrated/i.test(text);
    
    let sentiment;
    if (hasPositive && !hasNegative) {
      sentiment = 'positive';
    } else if (hasNegative && !hasPositive) {
      sentiment = 'negative';
    } else if (hasPositive && hasNegative) {
      sentiment = 'mixed';
    } else {
      sentiment = 'neutral';
    }
    
    return {
      sentiment,
      confidence: {
        positive: sentiment === 'positive' ? 0.8 : sentiment === 'mixed' ? 0.4 : 0.1,
        negative: sentiment === 'negative' ? 0.8 : sentiment === 'mixed' ? 0.4 : 0.1,
        neutral: sentiment === 'neutral' ? 0.8 : 0.2
      },
      sentences: [
        {
          text: text.substring(0, Math.min(50, text.length)),
          sentiment: sentiment,
          confidence: 0.85
        }
      ]
    };
  }

  /**
   * Mock implementation of summarizeText
   * 
   * @param text - Text to summarize
   * @param modelType - AI model to use
   * @param options - Additional options
   * @returns Promise resolving to text summary
   */
  async summarizeText(
    text: string,
    modelType: AIModelType = AIModelType.OPENAI_GPT4,
    options: Record<string, any> = {}
  ): Promise<Record<string, any>> {
    if (!this.initialized) {
      throw new Error('Text Analysis service not initialized');
    }
    
    // Check if we should simulate a failure
    if (options.simulateFailure) {
      throw new Error('Simulated Text Analysis failure');
    }
    
    // Try to find a matching mock response based on text pattern
    if (this.mockResponses.summary) {
      for (const pattern in this.mockResponses.summary) {
        if (text.includes(pattern)) {
          return this.mockResponses.summary[pattern];
        }
      }
    }
    
    // Return default mock summary
    const wordCount = text.split(/\s+/).length;
    const summaryWordCount = Math.max(10, Math.floor(wordCount / 5));
    
    return {
      summary: `This is a mock summary of the provided text. It contains approximately ${summaryWordCount} words, which is about 20% of the original text. The summary would capture the main points and key information in a real implementation.`,
      originalLength: wordCount,
      summaryLength: summaryWordCount,
      compressionRatio: (summaryWordCount / wordCount).toFixed(2)
    };
  }

  /**
   * Mock implementation of extractMedicalInfo
   * 
   * @param text - Text to analyze
   * @param modelType - AI model to use
   * @param options - Additional options
   * @returns Promise resolving to medical information
   */
  async extractMedicalInfo(
    text: string,
    modelType: AIModelType = AIModelType.OPENAI_GPT4,
    options: Record<string, any> = {}
  ): Promise<Record<string, any>> {
    if (!this.initialized) {
      throw new Error('Text Analysis service not initialized');
    }
    
    // Check if we should simulate a failure
    if (options.simulateFailure) {
      throw new Error('Simulated Text Analysis failure');
    }
    
    // Try to find a matching mock response based on text pattern
    if (this.mockResponses.medicalInfo) {
      for (const pattern in this.mockResponses.medicalInfo) {
        if (text.includes(pattern)) {
          return this.mockResponses.medicalInfo[pattern];
        }
      }
    }
    
    // Return default mock medical information
    return {
      conditions: [
        {
          name: 'Multiple Sclerosis',
          icd10Code: 'G35',
          mentions: 3,
          confidence: 0.95
        },
        {
          name: 'Fatigue',
          icd10Code: 'R53.83',
          mentions: 2,
          confidence: 0.88
        }
      ],
      medications: [
        {
          name: 'Tecfidera',
          genericName: 'dimethyl fumarate',
          dosage: '240mg',
          frequency: 'twice daily',
          mentions: 2,
          confidence: 0.93
        },
        {
          name: 'Baclofen',
          genericName: 'baclofen',
          dosage: '10mg',
          frequency: 'three times daily',
          mentions: 1,
          confidence: 0.91
        }
      ],
      procedures: [
        {
          name: 'MRI',
          date: null,
          mentions: 1,
          confidence: 0.89
        }
      ],
      allergies: [
        {
          allergen: 'Penicillin',
          reaction: 'Rash',
          mentions: 1,
          confidence: 0.94
        }
      ]
    };
  }

  /**
   * Mock implementation of generateEmbeddings
   * 
   * @param text - Text or array of texts to embed
   * @param options - Additional options
   * @returns Promise resolving to embedding vectors
   */
  async generateEmbeddings(
    text: string | string[],
    options: Record<string, any> = {}
  ): Promise<number[][]> {
    if (!this.initialized) {
      throw new Error('Text Analysis service not initialized');
    }
    
    // Check if we should simulate a failure
    if (options.simulateFailure) {
      throw new Error('Simulated Text Analysis failure');
    }
    
    // Delegate to the OpenAI service's createEmbedding method
    return this.openAIService.createEmbedding(text, options);
  }

  /**
   * Sets or updates mock responses for testing
   * 
   * @param responses - New mock responses
   */
  setMockResponses(responses: Record<string, any>): void {
    this.mockResponses = { ...this.mockResponses, ...responses };
  }
}

/**
 * Mock implementation of the Care Plan Generator service for testing
 */
export class MockCarePlanGeneratorService {
  initialized: boolean;
  openAIService: MockOpenAIService;
  mockResponses: Record<string, any>;

  /**
   * Creates a new MockCarePlanGeneratorService instance
   * 
   * @param openAIService - Mock OpenAI service instance
   * @param mockResponses - Custom mock responses for testing
   */
  constructor(
    openAIService: MockOpenAIService,
    mockResponses: Record<string, any> = {}
  ) {
    this.openAIService = openAIService;
    this.mockResponses = mockResponses;
    this.initialized = false;
  }

  /**
   * Initializes the mock Care Plan Generator service
   * 
   * @returns Promise resolving to true
   */
  async initialize(): Promise<boolean> {
    this.initialized = true;
    return true;
  }

  /**
   * Mock implementation of generateOptions
   * 
   * @param params - Parameters for care plan generation
   * @returns Promise resolving to care plan options
   */
  async generateOptions(params: Record<string, any>): Promise<Record<string, any>> {
    if (!this.initialized) {
      throw new Error('Care Plan Generator service not initialized');
    }
    
    // Check if we should simulate a failure
    if (params.simulateFailure) {
      throw new Error('Simulated Care Plan Generator failure');
    }
    
    // Try to find a matching mock response based on clientId
    if (this.mockResponses.options && this.mockResponses.options[params.clientId]) {
      return this.mockResponses.options[params.clientId];
    }
    
    // Return default mock care plan options
    return {
      clientId: params.clientId || 'default-client',
      options: [
        {
          id: 'option-1',
          title: 'Comprehensive MS Management',
          description: 'A holistic approach focusing on mobility, fatigue management, and overall wellness',
          confidenceScore: 95,
          goals: [
            {
              id: 'goal-1',
              description: 'Improve mobility and balance',
              targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
              measures: ['10% improvement in timed walking test', 'Reduction in falls']
            },
            {
              id: 'goal-2',
              description: 'Reduce fatigue symptoms',
              targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
              measures: ['Improved fatigue severity scale score', 'Increased daily activity levels']
            },
            {
              id: 'goal-3',
              description: 'Enhance quality of life',
              targetDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
              measures: ['Improvement in quality of life assessment', 'Patient self-reported satisfaction']
            }
          ],
          interventions: [
            {
              id: 'intervention-1',
              description: 'Physical Therapy',
              frequency: '2x weekly',
              duration: '12 weeks',
              responsibleParty: 'Physical Therapist'
            },
            {
              id: 'intervention-2',
              description: 'Occupational Therapy',
              frequency: '1x weekly',
              duration: '8 weeks',
              responsibleParty: 'Occupational Therapist'
            },
            {
              id: 'intervention-3',
              description: 'Medication Management',
              frequency: 'Monthly review',
              duration: 'Ongoing',
              responsibleParty: 'Neurologist'
            },
            {
              id: 'intervention-4',
              description: 'Nutritional Counseling',
              frequency: 'Initial + 2 follow-ups',
              duration: '3 months',
              responsibleParty: 'Dietitian'
            }
          ]
        },
        {
          id: 'option-2',
          title: 'Focused Physical Rehabilitation',
          description: 'Intensive focus on physical mobility improvement and strength building',
          confidenceScore: 87,
          goals: [
            {
              id: 'goal-1',
              description: 'Improve core and lower extremity strength',
              targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
              measures: ['30% improvement in strength assessment', 'Improved posture']
            },
            {
              id: 'goal-2',
              description: 'Enhance balance and coordination',
              targetDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
              measures: ['Reduction in fall risk assessment score', 'Improved balance test results']
            }
          ],
          interventions: [
            {
              id: 'intervention-1',
              description: 'Intensive Physical Therapy',
              frequency: '3x weekly',
              duration: '10 weeks',
              responsibleParty: 'Physical Therapist'
            },
            {
              id: 'intervention-2',
              description: 'Home Exercise Program',
              frequency: 'Daily',
              duration: 'Ongoing',
              responsibleParty: 'Client with PT oversight'
            },
            {
              id: 'intervention-3',
              description: 'Assistive Device Assessment',
              frequency: 'One-time evaluation',
              duration: '1 day',
              responsibleParty: 'Physical Therapist'
            }
          ]
        },
        {
          id: 'option-3',
          title: 'Holistic Wellness Approach',
          description: 'Balanced approach addressing physical and emotional wellbeing',
          confidenceScore: 82,
          goals: [
            {
              id: 'goal-1',
              description: 'Develop coping strategies',
              targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
              measures: ['Reduced anxiety/depression scores', 'Increased resilience measures']
            },
            {
              id: 'goal-2',
              description: 'Improve energy management',
              targetDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
              measures: ['Documented energy conservation techniques', 'Reduced fatigue impact']
            }
          ],
          interventions: [
            {
              id: 'intervention-1',
              description: 'Psychological Counseling',
              frequency: 'Bi-weekly',
              duration: '12 weeks',
              responsibleParty: 'Psychologist'
            },
            {
              id: 'intervention-2',
              description: 'Mindfulness Training',
              frequency: 'Weekly',
              duration: '8 weeks',
              responsibleParty: 'Mindfulness Instructor'
            },
            {
              id: 'intervention-3',
              description: 'Physical Therapy',
              frequency: '1x weekly',
              duration: '8 weeks',
              responsibleParty: 'Physical Therapist'
            }
          ]
        }
      ],
      metadata: {
        generatedAt: new Date().toISOString(),
        modelVersion: '1.0.0',
        analysisFactors: ['medical_history', 'current_symptoms', 'treatment_response', 'client_preferences']
      }
    };
  }

  /**
   * Mock implementation of analyzeDocuments
   * 
   * @param documentIds - IDs of documents to analyze
   * @returns Promise resolving to document analysis results
   */
  async analyzeDocuments(documentIds: string[]): Promise<Record<string, any>> {
    if (!this.initialized) {
      throw new Error('Care Plan Generator service not initialized');
    }
    
    // Check if we should simulate a failure
    if (documentIds.includes('simulate-failure')) {
      throw new Error('Simulated Care Plan Generator failure');
    }
    
    // Try to find a matching mock response based on documentIds
    const documentIdsKey = documentIds.sort().join(',');
    if (this.mockResponses.documents && this.mockResponses.documents[documentIdsKey]) {
      return this.mockResponses.documents[documentIdsKey];
    }
    
    // Return default mock document analysis
    return {
      documentIds,
      extractedInformation: {
        diagnoses: [
          {
            condition: 'Multiple Sclerosis',
            icd10Code: 'G35',
            diagnosisDate: '2018-05-10',
            diagnosingProvider: 'Dr. Emily Neurologist',
            notes: 'Relapsing-remitting type, confirmed via MRI'
          },
          {
            condition: 'Anxiety',
            icd10Code: 'F41.9',
            diagnosisDate: '2019-02-15',
            diagnosingProvider: 'Dr. Thomas Psychiatrist',
            notes: 'Related to MS diagnosis and life changes'
          }
        ],
        medications: [
          {
            name: 'Tecfidera',
            genericName: 'dimethyl fumarate',
            dosage: '240mg',
            frequency: 'twice daily',
            startDate: '2018-06-20',
            prescribedBy: 'Dr. Emily Neurologist'
          },
          {
            name: 'Baclofen',
            genericName: 'baclofen',
            dosage: '10mg',
            frequency: 'three times daily',
            startDate: '2019-03-05',
            prescribedBy: 'Dr. Emily Neurologist'
          }
        ],
        allergies: [
          {
            allergen: 'Penicillin',
            reaction: 'Rash',
            severity: 'Moderate',
            documentedDate: '2010-04-22'
          }
        ],
        functionalStatus: {
          mobility: 'Ambulatory with occasional assistance',
          adl: 'Independent with some difficulty',
          cognition: 'Mild cognitive fatigue reported',
          balance: 'Moderate impairment, increased fall risk'
        },
        socialDeterminants: {
          housing: 'Stable housing',
          transportation: 'Has access to reliable transportation',
          socialSupport: 'Lives with spouse, supportive family nearby',
          employment: 'Working part-time, accommodations in place'
        },
        preferences: {
          treatmentGoals: 'Maintain independence, manage symptoms, continue working',
          communicationPreferences: 'Prefers email communications, afternoon appointments',
          culturalConsiderations: 'None specifically noted'
        }
      },
      analysisMetadata: {
        confidenceScore: 92,
        documentQuality: 'High',
        completeness: 'Comprehensive',
        processingTime: 1250,
        modelVersion: '1.0.0'
      }
    };
  }

  /**
   * Sets or updates mock responses for testing
   * 
   * @param responses - New mock responses
   */
  setMockResponses(responses: Record<string, any>): void {
    this.mockResponses = { ...this.mockResponses, ...responses };
  }
}

/**
 * Mock implementation of the Document Analysis service for testing
 */
export class MockDocumentAnalysisService {
  initialized: boolean;
  formRecognizerService: MockAzureFormRecognizerService;
  mockResponses: Record<string, any>;

  /**
   * Creates a new MockDocumentAnalysisService instance
   * 
   * @param formRecognizerService - Mock Form Recognizer service instance
   * @param mockResponses - Custom mock responses for testing
   */
  constructor(
    formRecognizerService: MockAzureFormRecognizerService,
    mockResponses: Record<string, any> = {}
  ) {
    this.formRecognizerService = formRecognizerService;
    this.mockResponses = mockResponses;
    this.initialized = false;
  }

  /**
   * Initializes the mock Document Analysis service
   * 
   * @returns Promise resolving to true
   */
  async initialize(): Promise<boolean> {
    this.initialized = true;
    return true;
  }

  /**
   * Mock implementation of analyzeDocument
   * 
   * @param params - Parameters for document analysis
   * @returns Promise resolving to document analysis response
   */
  async analyzeDocument(params: Record<string, any>): Promise<Record<string, any>> {
    if (!this.initialized) {
      throw new Error('Document Analysis service not initialized');
    }
    
    // Check if we should simulate a failure
    if (params.simulateFailure) {
      throw new Error('Simulated Document Analysis failure');
    }
    
    // Try to find a matching mock response based on documentId and analysisType
    const responseKey = `${params.documentId}-${params.analysisType}`;
    if (this.mockResponses.analysis && this.mockResponses.analysis[responseKey]) {
      return this.mockResponses.analysis[responseKey];
    }
    
    // Return default mock analysis response
    const analysisId = `analysis-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    
    return {
      analysisId,
      documentId: params.documentId,
      analysisType: params.analysisType,
      status: 'completed',
      startedAt: new Date(Date.now() - 5000).toISOString(),
      completedAt: new Date().toISOString(),
      result: {
        confidence: 88,
        processingTimeMs: 4823,
        extractedContent: {
          pages: 5,
          textContent: 'This is a sample of extracted text content...',
          formFields: {
            // Content would vary based on analysisType
            name: 'John Doe',
            documentDate: '2023-04-15'
          }
        }
      }
    };
  }

  /**
   * Mock implementation of getAnalysisById
   * 
   * @param analysisId - ID of the analysis to retrieve
   * @returns Promise resolving to analysis result
   */
  async getAnalysisById(analysisId: string): Promise<Record<string, any>> {
    if (!this.initialized) {
      throw new Error('Document Analysis service not initialized');
    }
    
    // Check if we should simulate a failure
    if (analysisId === 'simulate-failure') {
      throw new Error('Simulated Document Analysis failure');
    }
    
    // Try to find a matching mock response based on analysisId
    if (this.mockResponses.analysisById && this.mockResponses.analysisById[analysisId]) {
      return this.mockResponses.analysisById[analysisId];
    }
    
    // Return default mock analysis
    return {
      analysisId,
      documentId: 'doc-12345',
      analysisType: DOCUMENT_ANALYSIS_TYPES.MEDICAL_EXTRACTION,
      status: 'completed',
      startedAt: new Date(Date.now() - 5000).toISOString(),
      completedAt: new Date().toISOString(),
      result: {
        confidence: 90,
        processingTimeMs: 3245,
        extractedContent: {
          medicalData: {
            patientInfo: {
              name: 'John Doe',
              dob: '1980-01-15',
              gender: 'Male',
              mrn: '12345678'
            },
            diagnoses: [
              {
                condition: 'Multiple Sclerosis',
                icd10Code: 'G35',
                diagnosisDate: '2018-05-10'
              }
            ],
            medications: [
              {
                name: 'Tecfidera',
                dosage: '240mg',
                frequency: 'twice daily'
              }
            ]
          }
        }
      }
    };
  }

  /**
   * Mock implementation of extractMedicalData
   * 
   * @param documentId - Document ID
   * @param documentUrl - URL to the document
   * @param options - Additional options
   * @returns Promise resolving to document analysis result
   */
  async extractMedicalData(
    documentId: string,
    documentUrl: string,
    options: Record<string, any> = {}
  ): Promise<DocumentAnalysisResult> {
    if (!this.initialized) {
      throw new Error('Document Analysis service not initialized');
    }
    
    // Check if we should simulate a failure
    if (options.simulateFailure) {
      throw new Error('Simulated Document Analysis failure');
    }
    
    // Delegate to the Form Recognizer service
    const medicalData = await this.formRecognizerService.extractMedicalData(documentId, documentUrl, options);
    
    return createMockDocumentAnalysisResult(
      documentId,
      medicalData,
      options.confidenceScore || 90,
      AIModelType.AZURE_FORM_RECOGNIZER
    );
  }

  /**
   * Mock implementation of extractText
   * 
   * @param documentId - Document ID
   * @param documentUrl - URL to the document
   * @param options - Additional options
   * @returns Promise resolving to document analysis result
   */
  async extractText(
    documentId: string,
    documentUrl: string,
    options: Record<string, any> = {}
  ): Promise<DocumentAnalysisResult> {
    if (!this.initialized) {
      throw new Error('Document Analysis service not initialized');
    }
    
    // Check if we should simulate a failure
    if (options.simulateFailure) {
      throw new Error('Simulated Document Analysis failure');
    }
    
    // Delegate to the Form Recognizer service
    const textData = await this.formRecognizerService.extractText(documentId, documentUrl, options);
    
    return createMockDocumentAnalysisResult(
      documentId,
      { text: textData.text, pages: textData.pages },
      textData.confidence,
      AIModelType.AZURE_FORM_RECOGNIZER
    );
  }

  /**
   * Mock implementation of recognizeForm
   * 
   * @param documentId - Document ID
   * @param documentUrl - URL to the document
   * @param options - Additional options
   * @returns Promise resolving to document analysis result
   */
  async recognizeForm(
    documentId: string,
    documentUrl: string,
    options: Record<string, any> = {}
  ): Promise<DocumentAnalysisResult> {
    if (!this.initialized) {
      throw new Error('Document Analysis service not initialized');
    }
    
    // Check if we should simulate a failure
    if (options.simulateFailure) {
      throw new Error('Simulated Document Analysis failure');
    }
    
    // Delegate to the Form Recognizer service
    const formData = await this.formRecognizerService.recognizeForm(documentId, documentUrl, options);
    
    return createMockDocumentAnalysisResult(
      documentId,
      { fields: formData.fields },
      formData.confidence,
      AIModelType.AZURE_FORM_RECOGNIZER
    );
  }

  /**
   * Mock implementation of verifyIdentity
   * 
   * @param documentId - Document ID
   * @param documentUrl - URL to the document
   * @param options - Additional options
   * @returns Promise resolving to document analysis result
   */
  async verifyIdentity(
    documentId: string,
    documentUrl: string,
    options: Record<string, any> = {}
  ): Promise<DocumentAnalysisResult> {
    if (!this.initialized) {
      throw new Error('Document Analysis service not initialized');
    }
    
    // Check if we should simulate a failure
    if (options.simulateFailure) {
      throw new Error('Simulated Document Analysis failure');
    }
    
    // Delegate to the Form Recognizer service
    const identityData = await this.formRecognizerService.verifyIdentity(documentId, documentUrl, options);
    
    return createMockDocumentAnalysisResult(
      documentId,
      { 
        identityInfo: identityData.identityInfo,
        isValid: identityData.isValid
      },
      identityData.confidence,
      AIModelType.AZURE_FORM_RECOGNIZER
    );
  }

  /**
   * Sets or updates mock responses for testing
   * 
   * @param responses - New mock responses
   */
  setMockResponses(responses: Record<string, any>): void {
    this.mockResponses = { ...this.mockResponses, ...responses };
  }
}

/**
 * Mock implementation of the Provider Matching service for testing
 */
export class MockProviderMatchingService {
  initialized: boolean;
  openAIService: MockOpenAIService;
  mockResponses: Record<string, any>;

  /**
   * Creates a new MockProviderMatchingService instance
   * 
   * @param openAIService - Mock OpenAI service instance
   * @param mockResponses - Custom mock responses for testing
   */
  constructor(
    openAIService: MockOpenAIService,
    mockResponses: Record<string, any> = {}
  ) {
    this.openAIService = openAIService;
    this.mockResponses = mockResponses;
    this.initialized = false;
  }

  /**
   * Initializes the mock Provider Matching service
   * 
   * @returns Promise resolving to true
   */
  async initialize(): Promise<boolean> {
    this.initialized = true;
    return true;
  }

  /**
   * Mock implementation of matchProviders
   * 
   * @param criteria - Matching criteria
   * @returns Promise resolving to provider matches
   */
  async matchProviders(criteria: Record<string, any>): Promise<Array<Record<string, any>>> {
    if (!this.initialized) {
      throw new Error('Provider Matching service not initialized');
    }
    
    // Check if we should simulate a failure
    if (criteria.simulateFailure) {
      throw new Error('Simulated Provider Matching failure');
    }
    
    // Try to find a matching mock response based on clientId and serviceTypes
    const clientId = criteria.clientId || 'default';
    const serviceTypes = criteria.serviceTypes ? criteria.serviceTypes.sort().join(',') : 'all';
    const responseKey = `${clientId}-${serviceTypes}`;
    
    if (this.mockResponses.matches && this.mockResponses.matches[responseKey]) {
      return this.mockResponses.matches[responseKey];
    }
    
    // Return default mock provider matches
    return [
      {
        providerId: 'provider-1',
        name: 'Dr. Emily Lee',
        specialties: ['Physical Therapy', 'Neurological Rehabilitation'],
        locationDistance: 3.2,
        availability: {
          nextAvailable: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          slots: [
            { date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), duration: 60 },
            { date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), duration: 60 }
          ]
        },
        ratings: {
          average: 4.8,
          count: 42
        },
        compatibility: {
          score: 95,
          factors: [
            { factor: 'specialty_match', score: 98, weight: 0.3 },
            { factor: 'location_proximity', score: 90, weight: 0.2 },
            { factor: 'availability', score: 95, weight: 0.2 },
            { factor: 'experience_level', score: 94, weight: 0.15 },
            { factor: 'client_preference', score: 96, weight: 0.15 }
          ]
        }
      },
      {
        providerId: 'provider-2',
        name: 'Dr. James Wilson',
        specialties: ['Physical Therapy', 'Sports Rehabilitation'],
        locationDistance: 5.7,
        availability: {
          nextAvailable: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          slots: [
            { date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), duration: 60 },
            { date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(), duration: 60 }
          ]
        },
        ratings: {
          average: 4.2,
          count: 28
        },
        compatibility: {
          score: 87,
          factors: [
            { factor: 'specialty_match', score: 85, weight: 0.3 },
            { factor: 'location_proximity', score: 80, weight: 0.2 },
            { factor: 'availability', score: 90, weight: 0.2 },
            { factor: 'experience_level', score: 92, weight: 0.15 },
            { factor: 'client_preference', score: 88, weight: 0.15 }
          ]
        }
      },
      {
        providerId: 'provider-3',
        name: 'Dr. Robert Chen',
        specialties: ['Physical Therapy', 'Geriatric Rehabilitation'],
        locationDistance: 8.3,
        availability: {
          nextAvailable: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          slots: [
            { date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), duration: 60 },
            { date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), duration: 60 }
          ]
        },
        ratings: {
          average: 4.1,
          count: 19
        },
        compatibility: {
          score: 82,
          factors: [
            { factor: 'specialty_match', score: 75, weight: 0.3 },
            { factor: 'location_proximity', score: 70, weight: 0.2 },
            { factor: 'availability', score: 75, weight: 0.2 },
            { factor: 'experience_level', score: 95, weight: 0.15 },
            { factor: 'client_preference', score: 85, weight: 0.15 }
          ]
        }
      }
    ];
  }

  /**
   * Mock implementation of calculateCompatibilityScore
   * 
   * @param client - Client data
   * @param provider - Provider data
   * @param criteria - Matching criteria
   * @returns Promise resolving to compatibility score
   */
  async calculateCompatibilityScore(
    client: Record<string, any>,
    provider: Record<string, any>,
    criteria: Record<string, any> = {}
  ): Promise<{ score: number; factors: Array<{ factor: string; score: number; weight: number }> }> {
    if (!this.initialized) {
      throw new Error('Provider Matching service not initialized');
    }
    
    // Check if we should simulate a failure
    if (criteria.simulateFailure) {
      throw new Error('Simulated Provider Matching failure');
    }
    
    // Try to find a matching mock response based on client.id and provider.id
    const responseKey = `${client.id}-${provider.id}`;
    if (this.mockResponses.compatibility && this.mockResponses.compatibility[responseKey]) {
      return this.mockResponses.compatibility[responseKey];
    }
    
    // Generate a deterministic but seemingly random score based on client and provider IDs
    const clientId = client.id || 'default-client';
    const providerId = provider.id || 'default-provider';
    const seed = (clientId.charCodeAt(0) || 1) * (providerId.charCodeAt(0) || 2);
    const baseScore = (Math.sin(seed) + 1) / 2 * 25 + 70; // Score between 70-95
    
    // Return default mock compatibility score
    return {
      score: Math.round(baseScore),
      factors: [
        { factor: 'specialty_match', score: Math.round(baseScore + 5), weight: 0.3 },
        { factor: 'location_proximity', score: Math.round(baseScore - 5), weight: 0.2 },
        { factor: 'availability', score: Math.round(baseScore + 2), weight: 0.2 },
        { factor: 'experience_level', score: Math.round(baseScore + 3), weight: 0.15 },
        { factor: 'client_preference', score: Math.round(baseScore - 2), weight: 0.15 }
      ]
    };
  }

  /**
   * Mock implementation of getMatchFactors
   * 
   * @returns Promise resolving to match factors
   */
  async getMatchFactors(): Promise<Array<{ name: string; description: string; weight: number }>> {
    if (!this.initialized) {
      throw new Error('Provider Matching service not initialized');
    }
    
    // Return mock match factors from the mockResponses if available
    if (this.mockResponses.factors && this.mockResponses.factors.length > 0) {
      return this.mockResponses.factors;
    }
    
    // Return default mock match factors
    return [
      {
        name: 'specialty_match',
        description: 'Match between provider specialties and client needs',
        weight: 0.3
      },
      {
        name: 'location_proximity',
        description: 'Geographic distance between provider and client',
        weight: 0.2
      },
      {
        name: 'availability',
        description: 'Provider availability matching client preferred times',
        weight: 0.2
      },
      {
        name: 'experience_level',
        description: 'Provider experience with client\'s specific conditions',
        weight: 0.15
      },
      {
        name: 'client_preference',
        description: 'Alignment with client\'s stated preferences',
        weight: 0.15
      }
    ];
  }

  /**
   * Sets or updates mock responses for testing
   * 
   * @param responses - New mock responses
   */
  setMockResponses(responses: Record<string, any>): void {
    this.mockResponses = { ...this.mockResponses, ...responses };
  }
}

/**
 * Default empty mock responses for all AI services
 */
export const DEFAULT_MOCK_RESPONSES = {
  openai: {
    completions: {},
    embeddings: {}
  },
  formRecognizer: {
    medicalData: {},
    textExtraction: {},
    formRecognition: {},
    identityVerification: {}
  },
  textAnalysis: {
    entities: {},
    sentiment: {},
    summary: {},
    medicalInfo: {}
  },
  carePlanGenerator: {
    options: {},
    documents: {}
  },
  documentAnalysis: {
    analysis: {},
    analysisById: {}
  },
  providerMatching: {
    matches: {},
    compatibility: {},
    factors: []
  }
};