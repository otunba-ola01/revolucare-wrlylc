import { OpenAIService } from '../../src/integrations/openai'; // openai@^4.0.0
import { AzureFormRecognizerService } from '../../src/integrations/azure-form-recognizer'; // @azure/ai-form-recognizer@^4.0.0
import { CarePlanGeneratorService } from '../../src/services/ai/care-plan-generator.service';
import { DocumentAnalysisService } from '../../src/services/ai/document-analysis.service';
import { TextAnalysisService } from '../../src/services/ai/text-analysis.service';
import { ProviderMatchingService } from '../../src/services/ai/provider-matching.service';
import { AIModelType, AIServiceType, ConfidenceLevel } from '../../src/types/ai.types';
import { DOCUMENT_ANALYSIS_TYPES } from '../../src/constants/document-types';
import { mockDocuments, mockDocumentAnalyses } from '../../tests/fixtures/documents.fixture';
import { MockOpenAIService, MockAzureFormRecognizerService, MockTextAnalysisService, MockCarePlanGeneratorService, MockDocumentAnalysisService, MockProviderMatchingService } from '../../tests/mocks/ai.mock';
import { DocumentRepository } from '../../src/repositories/document.repository';
import { CarePlanRepository } from '../../src/repositories/care-plan.repository';
import { ProviderProfileRepository } from '../../src/repositories/provider-profile.repository';
import { ProviderAvailabilityRepository } from '../../src/repositories/provider-availability.repository';
import { ClientProfileRepository } from '../../src/repositories/client-profile.repository';
import { BlobStorageService } from '../../src/services/storage/blob-storage.service';
import { AnalyticsRepository } from '../../src/repositories/analytics.repository';

describe('AI Services Integration Tests', () => {
  /**
   * Sets up and initializes the OpenAI service for testing
   * @returns Promise<OpenAIService> - Initialized OpenAI service instance
   */
  const setupOpenAIService = async (): Promise<OpenAIService> => {
    // Create a new OpenAI service instance
    const openAIService = new OpenAIService();
    // Initialize the service with test configuration
    await openAIService.initialize();
    // Return the initialized service
    return openAIService;
  };

  /**
   * Sets up and initializes the Azure Form Recognizer service for testing
   * @returns Promise<AzureFormRecognizerService> - Initialized Azure Form Recognizer service instance
   */
  const setupAzureFormRecognizerService = async (): Promise<AzureFormRecognizerService> => {
    // Create a new Azure Form Recognizer service instance
    const azureFormRecognizerService = new AzureFormRecognizerService();
    // Initialize the service with test configuration
    await azureFormRecognizerService.initialize();
    // Return the initialized service
    return azureFormRecognizerService;
  };

  /**
   * Sets up and initializes the Document Analysis service for testing
   * @returns Promise<DocumentAnalysisService> - Initialized Document Analysis service instance
   */
  const setupDocumentAnalysisService = async (): Promise<DocumentAnalysisService> => {
    // Create mock dependencies (document repository, blob storage, OpenAI, Form Recognizer)
    const mockDocumentRepository = new DocumentRepository();
    const mockBlobStorageService = new BlobStorageService({
      serviceType: 'storage',
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
    });
    const mockOpenAIService = new OpenAIService();
    const mockFormRecognizerService = new AzureFormRecognizerService();

    // Create a new Document Analysis service instance with mocked dependencies
    const documentAnalysisService = new DocumentAnalysisService(
      mockDocumentRepository,
      mockBlobStorageService,
      mockOpenAIService,
      mockFormRecognizerService
    );
    // Initialize the service
    await documentAnalysisService.initialize();
    // Return the initialized service
    return documentAnalysisService;
  };

  /**
   * Sets up and initializes the Care Plan Generator service for testing
   * @returns Promise<CarePlanGeneratorService> - Initialized Care Plan Generator service instance
   */
  const setupCarePlanGeneratorService = async (): Promise<CarePlanGeneratorService> => {
    // Create mock dependencies (OpenAI service, document analysis service, care plan repository)
    const mockOpenAIService = new OpenAIService();
    const mockDocumentAnalysisService = new DocumentAnalysisService(
      new DocumentRepository(),
      new BlobStorageService({
        serviceType: 'storage',
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
      mockOpenAIService,
      new AzureFormRecognizerService()
    );
    const mockCarePlanRepository = new CarePlanRepository();

    // Create a new Care Plan Generator service instance with mocked dependencies
    const carePlanGeneratorService = new CarePlanGeneratorService(
      mockOpenAIService,
      mockDocumentAnalysisService,
      mockCarePlanRepository
    );
    // Initialize the service
    await carePlanGeneratorService.initialize();
    // Return the initialized service
    return carePlanGeneratorService;
  };

  /**
   * Sets up and initializes the Text Analysis service for testing
   * @returns Promise<TextAnalysisService> - Initialized Text Analysis service instance
   */
  const setupTextAnalysisService = async (): Promise<TextAnalysisService> => {
    // Create mock dependencies (OpenAI service, analytics repository)
    const mockOpenAIService = new OpenAIService();
    const mockAnalyticsRepository = new AnalyticsRepository();

    // Create a new Text Analysis service instance with mocked dependencies
    const textAnalysisService = new TextAnalysisService(
      mockOpenAIService,
      mockAnalyticsRepository
    );
    // Initialize the service
    await textAnalysisService.initialize();
    // Return the initialized service
    return textAnalysisService;
  };

  /**
   * Sets up and initializes the Provider Matching service for testing
   * @returns Promise<ProviderMatchingService> - Initialized Provider Matching service instance
   */
  const setupProviderMatchingService = async (): Promise<ProviderMatchingService> => {
    // Create mock dependencies (provider repository, availability repository, client repository, OpenAI service)
    const mockProviderRepository = new ProviderProfileRepository();
    const mockAvailabilityRepository = new ProviderAvailabilityRepository();
    const mockClientRepository = new ClientProfileRepository();
    const mockOpenAIService = new OpenAIService();

    // Create a new Provider Matching service instance with mocked dependencies
    const providerMatchingService = new ProviderMatchingService(
      mockProviderRepository,
      mockAvailabilityRepository,
      mockClientRepository,
      mockOpenAIService
    );
    // Initialize the service
    await providerMatchingService.initialize();
    // Return the initialized service
    return providerMatchingService;
  };
});