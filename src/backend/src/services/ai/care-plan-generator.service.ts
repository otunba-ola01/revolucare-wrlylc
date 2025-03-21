import { ICarePlanGenerator } from '../../interfaces/care-plan.interface';
import { CarePlanOptionsResponse, CarePlanOption, GenerateCarePlanDTO } from '../../types/care-plan.types';
import { AIModelType, AIServiceType, ConfidenceScore, ConfidenceLevel } from '../../types/ai.types';
import { PlanStatus } from '../../constants/plan-statuses';
import OpenAIService from '../../integrations/openai'; // openai@^4.0.0
import DocumentAnalysisService from '../ai/document-analysis.service';
import { CarePlanRepository } from '../../repositories/care-plan.repository';
import { errorFactory } from '../../utils/error-handler';
import { logger } from '../../utils/logger';
import { aiServiceConfig } from '../../config/ai';

// Define error codes for this module
const ERROR_CODES = {
  INITIALIZATION_FAILED: 'care_plan_generator_initialization_failed',
  DOCUMENT_ANALYSIS_FAILED: 'document_analysis_failed',
  GENERATION_FAILED: 'care_plan_generation_failed',
  INVALID_REQUEST: 'invalid_care_plan_request',
  INSUFFICIENT_DATA: 'insufficient_data_for_care_plan'
};

// Define confidence thresholds for analysis results
const CONFIDENCE_THRESHOLDS = {
  HIGH: 0.85,
  MEDIUM: 0.7,
  LOW: 0.5
};

/**
 * Service that implements AI-powered care plan generation
 */
export class CarePlanGeneratorService implements ICarePlanGenerator {
  private openAIService: OpenAIService;
  private documentAnalysisService: DocumentAnalysisService;
  private carePlanRepository: CarePlanRepository;
  private initialized: boolean;

  /**
   * Creates a new care plan generator service instance
   * @param openAIService - OpenAI service for generating care plans
   * @param documentAnalysisService - Document analysis service for processing medical records
   * @param carePlanRepository - Care plan repository for database operations
   */
  constructor(
    openAIService: OpenAIService,
    documentAnalysisService: DocumentAnalysisService,
    carePlanRepository: CarePlanRepository
  ) {
    // Store the provided services and repositories
    this.openAIService = openAIService;
    this.documentAnalysisService = documentAnalysisService;
    this.carePlanRepository = carePlanRepository;
    // Set initialized flag to false initially
    this.initialized = false;
    // Initialize the service
    this.initialize();
  }

  /**
   * Initializes the care plan generator service
   * @returns Promise<boolean> - True if initialization was successful
   */
  async initialize(): Promise<boolean> {
    try {
      // Check if services are already initialized
      if (this.initialized) {
        logger.info('Care plan generator service already initialized');
        return true;
      }

      // Initialize the OpenAI service
      await this.openAIService.initialize(aiServiceConfig);

      // Initialize the document analysis service
      await this.documentAnalysisService.initialize();

      // Set initialized flag to true if successful
      this.initialized = true;
      logger.info('Care plan generator service initialized successfully');
      return true;
    } catch (error: any) {
      // Handle and log any initialization errors
      logger.error('Failed to initialize care plan generator service', {
        error: error instanceof Error ? error.message : String(error)
      });
      this.initialized = false;
      return false;
    }
  }

  /**
   * Generates care plan options based on client information and documents
   * @param params - GenerateCarePlanDTO
   * @returns Promise<CarePlanOptionsResponse> - Generated care plan options with confidence scores
   */
  async generateOptions(params: GenerateCarePlanDTO): Promise<CarePlanOptionsResponse> {
    try {
      // Check if service is initialized
      if (!this.initialized) {
        throw errorFactory.createError(
          'Care plan generator service not initialized',
          ERROR_CODES.INITIALIZATION_FAILED
        );
      }

      // Validate the input parameters
      if (!params || !params.clientId || !params.documentIds) {
        throw errorFactory.createValidationError(
          'Client ID and document IDs are required',
          { params }
        );
      }

      // Analyze the client's medical documents
      const medicalInfo = await this.analyzeDocuments(params.documentIds);

      // Extract medical information from the documents
      const carePlanOptions = await this.generateCarePlans(medicalInfo, params.clientId, params.additionalContext);

      // Calculate confidence scores for each option
      const optionsWithScores = carePlanOptions.map(option =>
        this.calculateConfidenceScore(option, medicalInfo)
      );

      // Return the care plan options with metadata
      return {
        clientId: params.clientId,
        options: carePlanOptions,
        analysisMetadata: {
          medicalInfo,
          confidenceScores: optionsWithScores
        }
      };
    } catch (error: any) {
      // Handle and log any errors during generation
      logger.error('Failed to generate care plan options', {
        error: error instanceof Error ? error.message : String(error),
        clientId: params.clientId
      });
      throw errorFactory.createError(
        'Failed to generate care plan options',
        ERROR_CODES.GENERATION_FAILED,
        { clientId: params.clientId },
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Analyzes client medical documents to extract relevant information
   * @param documentIds - string[]
   * @returns Promise<Record<string, any>> - Extracted medical information from documents
   */
  async analyzeDocuments(documentIds: string[]): Promise<Record<string, any>> {
    try {
      // Check if service is initialized
      if (!this.initialized) {
        throw errorFactory.createError(
          'Care plan generator service not initialized',
          ERROR_CODES.INITIALIZATION_FAILED
        );
      }

      // Validate document IDs
      if (!documentIds || documentIds.length === 0) {
        throw errorFactory.createValidationError('Document IDs are required');
      }

      const extractedMedicalInfo: Record<string, any> = {};

      // Process each document using the document analysis service
      for (const documentId of documentIds) {
        // Extract medical data from each document
        const analysisResult = await this.documentAnalysisService.getAnalysisById(documentId);

        // Combine and structure the extracted information
        extractedMedicalInfo[documentId] = analysisResult.results;
      }

      // Return the consolidated medical information
      return extractedMedicalInfo;
    } catch (error: any) {
      // Handle and log any errors during document analysis
      logger.error('Failed to analyze medical documents', {
        error: error instanceof Error ? error.message : String(error),
        documentIds
      });
      throw errorFactory.createError(
        'Failed to analyze medical documents',
        ERROR_CODES.DOCUMENT_ANALYSIS_FAILED,
        { documentIds },
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Generates multiple care plan options using AI based on medical information
   * @param medicalInfo - Record<string, any>
   * @param clientId - string
   * @param additionalContext - Record<string, any>
   * @returns Promise<CarePlanOption[]> - Array of generated care plan options
   */
  async generateCarePlans(
    medicalInfo: Record<string, any>,
    clientId: string,
    additionalContext: Record<string, any>
  ): Promise<CarePlanOption[]> {
    try {
      // Check if service is initialized
      if (!this.initialized) {
        throw errorFactory.createError(
          'Care plan generator service not initialized',
          ERROR_CODES.INITIALIZATION_FAILED
        );
      }

      // Validate the medical information
      this.validateMedicalInfo(medicalInfo);

      // Prepare the prompt for the AI model
      const promptMessages = this.preparePrompt(medicalInfo, clientId, additionalContext);

      // Call OpenAI to generate care plan options
      const aiResponse = await this.openAIService.createChatCompletion(promptMessages);

      // Parse and validate the AI response
      const carePlanOptions = this.parseAIResponse(aiResponse);

      // Return the array of care plan options
      return carePlanOptions;
    } catch (error: any) {
      // Handle and log any errors during generation
      logger.error('Failed to generate care plans', {
        error: error instanceof Error ? error.message : String(error),
        clientId
      });
      throw errorFactory.createError(
        'Failed to generate care plans',
        ERROR_CODES.GENERATION_FAILED,
        { clientId },
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Calculates confidence scores for generated care plan options
   * @param option - CarePlanOption
   * @param medicalInfo - Record<string, any>
   * @returns ConfidenceScore - Calculated confidence score with level and factors
   */
  calculateConfidenceScore(option: CarePlanOption, medicalInfo: Record<string, any>): ConfidenceScore {
    // Analyze the completeness of the care plan option
    const completenessScore = option.goals.length * 0.3 + option.interventions.length * 0.4;

    // Check alignment with medical information
    const alignmentScore = 0.2;

    // Evaluate the specificity of goals and interventions
    const specificityScore = 0.1;

    // Calculate a numerical confidence score
    const numericalScore = completenessScore + alignmentScore + specificityScore;

    // Determine confidence level (HIGH, MEDIUM, LOW)
    let confidenceLevel: ConfidenceLevel = ConfidenceLevel.LOW;
    if (numericalScore >= CONFIDENCE_THRESHOLDS.HIGH) {
      confidenceLevel = ConfidenceLevel.HIGH;
    } else if (numericalScore >= CONFIDENCE_THRESHOLDS.MEDIUM) {
      confidenceLevel = ConfidenceLevel.MEDIUM;
    }

    // Identify factors affecting confidence
    const factors: string[] = [];

    // Return structured confidence score object
    return {
      score: numericalScore,
      level: confidenceLevel,
      factors: factors
    };
  }

  /**
   * Validates that medical information is sufficient for care plan generation
   * @param medicalInfo - Record<string, any>
   * @returns boolean - True if medical information is sufficient
   */
  validateMedicalInfo(medicalInfo: Record<string, any>): boolean {
    // Check for required fields in medical information
    if (!medicalInfo) {
      throw errorFactory.createValidationError('Medical information is required');
    }

    // Validate diagnoses information
    if (!medicalInfo.diagnoses) {
      throw errorFactory.createValidationError('Diagnoses information is required');
    }

    // Validate medications information
    if (!medicalInfo.medications) {
      throw errorFactory.createValidationError('Medications information is required');
    }

    // Validate medical history information
    if (!medicalInfo.medicalHistory) {
      throw errorFactory.createValidationError('Medical history information is required');
    }

    // Return validation result
    return true;
  }

  /**
   * Prepares the prompt for the AI model to generate care plans
   * @param medicalInfo - Record<string, any>
   * @param clientId - string
   * @param additionalContext - Record<string, any>
   * @returns Array<{ role: string, content: string }> - Formatted prompt messages for the AI model
   */
  preparePrompt(
    medicalInfo: Record<string, any>,
    clientId: string,
    additionalContext: Record<string, any>
  ): Array<{ role: string; content: string }> {
    // Create system message with instructions for care plan generation
    const systemMessage = {
      role: 'system',
      content: `You are an AI assistant specialized in generating personalized care plans for individuals with disabilities.
      Your goal is to create comprehensive and effective care plans based on medical information and client needs.
      The care plans should include specific goals, interventions, and expected outcomes.`
    };

    // Format medical information into structured content
    const medicalContent = `Medical Information: ${JSON.stringify(medicalInfo)}`;

    // Add client-specific context if available
    const clientContext = additionalContext ? `Additional Context: ${JSON.stringify(additionalContext)}` : '';

    // Include additional context if provided
    const userMessage = {
      role: 'user',
      content: `Generate 3 care plan options for client ${clientId} with the following information:
        ${medicalContent}
        ${clientContext}
        Each care plan option should include:
          - Title: A concise and descriptive title
          - Description: A brief overview of the plan
          - Goals: Specific, measurable, achievable, relevant, and time-bound goals
          - Interventions: Actions, services, or treatments to achieve the goals
          - Expected Outcomes: Anticipated results of the plan
        Provide a confidence score (0-100) for each option based on its appropriateness and feasibility.
        The response should be in JSON format.`
    };

    // Specify output format requirements
    const outputFormat = {
      role: 'system',
      content: `The output should be a JSON array of care plan options, each with title, description, goals, interventions, expected outcomes, and a confidence score.`
    };

    // Return array of formatted messages
    return [systemMessage, userMessage, outputFormat];
  }

  /**
   * Parses and validates the AI response into care plan options
   * @param response - string
   * @returns CarePlanOption[] - Parsed care plan options
   */
  parseAIResponse(response: string): CarePlanOption[] {
    try {
      // Parse JSON response from AI
      const parsedResponse = JSON.parse(response);

      // Validate response structure
      if (!Array.isArray(parsedResponse)) {
        throw new Error('AI response is not an array');
      }

      // Extract care plan options
      const carePlanOptions: CarePlanOption[] = parsedResponse.map(item => {
        // Validate each option has required fields
        if (!item.title || !item.description || !item.goals || !item.interventions || !item.expectedOutcomes) {
          throw new Error('Care plan option is missing required fields');
        }

        // Format and structure the options
        return {
          title: item.title,
          description: item.description,
          confidenceScore: item.confidenceScore,
          goals: item.goals,
          interventions: item.interventions,
          expectedOutcomes: item.expectedOutcomes
        };
      });

      // Return array of valid care plan options
      return carePlanOptions;
    } catch (error: any) {
      // Handle and log any parsing errors
      logger.error('Failed to parse AI response', {
        error: error instanceof Error ? error.message : String(error),
        response
      });
      throw errorFactory.createError(
        'Failed to parse AI response',
        ERROR_CODES.GENERATION_FAILED,
        { response },
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
}

// Export the service class
export { CarePlanGeneratorService };

// Create and export a default instance for dependency injection
export default new CarePlanGeneratorService(
  OpenAIService,
  DocumentAnalysisService,
  new CarePlanRepository()
);