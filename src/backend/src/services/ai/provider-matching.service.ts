import {
  IProviderMatchingService,
  ProviderProfileRepository,
  ProviderAvailabilityRepository,
  ClientProfileRepository,
} from '../../interfaces/provider.interface';
import {
  ProviderMatchingCriteria,
  ProviderMatch,
  MatchFactor,
  ProviderProfile,
} from '../../types/provider.types';
import { ClientProfile } from '../../types/user.types';
import { OpenAIService } from '../../integrations/openai';
import { AIModelType, AIServiceType, ConfidenceScore, ProviderMatchingResult } from '../../types/ai.types';
import { calculateHaversineDistance, isPointInServiceArea } from '../../utils/geo';
import { logger } from '../../utils/logger';
import { errorFactory } from '../../utils/error-handler';

/**
 * Determines the weight of a specific match factor based on factor name
 * @param factorName
 * @returns Weight value between 0 and 1
 */
const getMatchFactorWeight = (factorName: string): number => {
  // Define a mapping of factor names to weight values
  const factorWeights: { [key: string]: number } = {
    serviceMatch: 0.8,
    locationProximity: 0.7,
    specializationMatch: 0.6,
    experience: 0.5,
    insuranceCompatibility: 0.4,
    preferenceMatch: 0.3,
  };

  // Return the weight for the given factor name
  if (factorWeights[factorName] !== undefined) {
    return factorWeights[factorName];
  }

  // Return default weight of 0.5 if factor name is not found in the mapping
  return 0.5;
};

/**
 * Normalizes a raw score to a value between 0 and 1
 * @param score
 * @param min
 * @param max
 * @returns Normalized score between 0 and 1
 */
const normalizeScore = (score: number, min: number, max: number): number => {
  // Ensure score is within min and max bounds
  const boundedScore = Math.max(min, Math.min(max, score));

  // Calculate normalized score using (score - min) / (max - min)
  const normalizedScore = (boundedScore - min) / (max - min);

  // Return the normalized score, clamped between 0 and 1
  return Math.max(0, Math.min(1, normalizedScore));
};

/**
 * Service that implements AI-powered provider matching functionality
 */
export class ProviderMatchingService implements IProviderMatchingService {
  /**
   * Creates a new ProviderMatchingService instance
   * @param providerRepository
   * @param availabilityRepository
   * @param clientRepository
   * @param aiService
   */
  constructor(
    private providerRepository: ProviderProfileRepository,
    private availabilityRepository: ProviderAvailabilityRepository,
    private clientRepository: ClientProfileRepository,
    private aiService: OpenAIService
  ) {
    // Store the provided repositories and services as instance properties
    this.providerRepository = providerRepository;
    this.availabilityRepository = availabilityRepository;
    this.clientRepository = clientRepository;
    this.aiService = aiService;
    // Initialize the service with dependencies
    logger.info('ProviderMatchingService initialized');
  }

  /**
   * Matches providers to a client based on specified criteria
   * @param criteria
   * @returns Array of matched providers with compatibility scores
   */
  async matchProviders(criteria: ProviderMatchingCriteria): Promise<ProviderMatch[]> {
    logger.info('Matching providers to client', { clientId: criteria.clientId });

    // Validate the matching criteria
    if (!criteria || !criteria.clientId) {
      throw errorFactory.createValidationError('Invalid matching criteria: Client ID is required');
    }

    // Retrieve the client profile using clientId from criteria
    const client = await this.clientRepository.findByUserId(criteria.clientId);
    if (!client) {
      throw errorFactory.createNotFoundError(`Client profile not found for ID: ${criteria.clientId}`);
    }

    // Find providers that offer the requested service types
    let providers = await this.providerRepository.findProvidersWithServiceType(criteria.serviceTypes[0]);

    // Filter providers by location if location criteria provided
    if (criteria.location && criteria.distance) {
      providers = providers.filter(provider => {
        if (!provider.address) return false;
        return isPointInServiceArea({
          location: criteria.location,
          radius: criteria.distance,
          zipCodes: [],
          id: '',
          providerId: '',
          createdAt: new Date(),
          updatedAt: new Date()
        }, provider.address);
      });
    }

    // Filter providers by availability if availability criteria provided
    if (criteria.availability) {
      providers = providers.filter(provider => {
        // TODO: Implement availability check
        return true;
      });
    }

    // Filter providers by insurance if insurance criteria provided
    if (criteria.insurance) {
      providers = providers.filter(provider => provider.insuranceAccepted.includes(criteria.insurance!));
    }

    // Calculate compatibility scores for each provider
    const providerMatches: ProviderMatch[] = [];
    for (const provider of providers) {
      const { score, factors } = await this.calculateCompatibilityScore(client, provider, criteria);
      providerMatches.push({
        provider,
        compatibilityScore: score,
        matchFactors: factors,
        availableSlots: [], // TODO: Fetch available time slots
        distance: 0 // TODO: Calculate distance
      });
    }

    // Sort providers by compatibility score (highest first)
    providerMatches.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    // Fetch available time slots for top providers
    // TODO: Implement available time slots

    logger.info('Provider matching completed', {
      clientId: criteria.clientId,
      matchesFound: providerMatches.length
    });

    // Return the sorted provider matches with compatibility scores and available slots
    return providerMatches;
  }

  /**
   * Calculates the compatibility score between a client and provider
   * @param client
   * @param provider
   * @param criteria
   * @returns Compatibility score and contributing factors
   */
  async calculateCompatibilityScore(
    client: ClientProfile,
    provider: ProviderProfile,
    criteria: ProviderMatchingCriteria
  ): Promise<{ score: number; factors: MatchFactor[] }> {
    logger.debug('Calculating compatibility score', {
      clientId: client.userId,
      providerId: provider.userId
    });

    // Initialize array to store match factors
    const factors: MatchFactor[] = [];

    // Calculate service match factor (how well provider services match client needs)
    const serviceMatchFactor = this.calculateServiceMatchFactor(
      criteria.serviceTypes,
      provider.serviceTypes
    );
    factors.push(serviceMatchFactor);

    // Calculate location proximity factor if location criteria provided
    let locationProximityFactor: MatchFactor | null = null;
    if (criteria.location && provider.address) {
      locationProximityFactor = this.calculateLocationFactor(
        criteria.location,
        provider.address,
        criteria.distance!
      );
      factors.push(locationProximityFactor);
    }

    // Calculate specialization match factor (how well provider specializations match client needs)
    const specializationMatchFactor = this.calculateSpecializationFactor(
      client.medicalInformation?.conditions || [],
      provider.specializations
    );
    factors.push(specializationMatchFactor);

    // Calculate experience factor based on provider review count and rating
    const experienceFactor = this.calculateExperienceFactor(provider.reviewCount, provider.averageRating);
    factors.push(experienceFactor);

    // Calculate insurance compatibility factor if insurance criteria provided
    let insuranceCompatibilityFactor: MatchFactor | null = null;
    if (criteria.insurance) {
      insuranceCompatibilityFactor = this.calculateInsuranceFactor(criteria.insurance, provider.insuranceAccepted);
      factors.push(insuranceCompatibilityFactor);
    }

    // Calculate preference match factors (gender, language, etc.) if preferences provided
    const preferenceMatchFactors = this.calculatePreferenceFactor(criteria, provider, client);
    factors.push(...preferenceMatchFactors);

    // Use AI to enhance matching with additional insights if available
    // const { enhancedFactors, confidenceScore } = await this.enhanceMatchingWithAI(client, provider, criteria, factors);
    // factors.push(...enhancedFactors);

    // Calculate weighted average of all factors to determine overall compatibility score
    let totalScore = 0;
    let totalWeight = 0;
    for (const factor of factors) {
      const weight = getMatchFactorWeight(factor.name);
      totalScore += factor.score * weight;
      totalWeight += weight;
    }
    const overallScore = totalWeight > 0 ? totalScore / totalWeight : 0;

    logger.debug('Compatibility score calculated', {
      clientId: client.userId,
      providerId: provider.userId,
      overallScore,
      factors: factors.map(f => ({ name: f.name, score: f.score }))
    });

    // Return the overall score and individual factors
    return { score: overallScore, factors };
  }

  /**
   * Gets the match factors that contribute to compatibility scores
   * @returns Array of match factors with descriptions and weights
   */
  async getMatchFactors(): Promise<{ name: string; description: string; weight: number }[]> {
    // Define the standard match factors used in the matching algorithm
    const matchFactors = [
      {
        name: 'serviceMatch',
        description: 'How well the provider offers the services the client needs',
      },
      {
        name: 'locationProximity',
        description: 'How close the provider is to the client',
      },
      {
        name: 'specializationMatch',
        description: 'How well the provider specializes in the client\'s conditions',
      },
      {
        name: 'experience',
        description: 'The provider\'s experience and reputation',
      },
      {
        name: 'insuranceCompatibility',
        description: 'Whether the provider accepts the client\'s insurance',
      },
      {
        name: 'preferenceMatch',
        description: 'How well the provider matches the client\'s preferences',
      },
    ];

    // Assign weights to each factor using getMatchFactorWeight
    const weightedFactors = matchFactors.map(factor => ({
      ...factor,
      weight: getMatchFactorWeight(factor.name)
    }));

    // Return the array of match factors with descriptions and weights
    return weightedFactors;
  }

  /**
   * Enhances provider matching using AI insights
   * @param client
   * @param provider
   * @param criteria
   * @param baseFactors
   * @returns Enhanced match factors and confidence score
   */
  async enhanceMatchingWithAI(
    client: ClientProfile,
    provider: ProviderProfile,
    criteria: ProviderMatchingCriteria,
    baseFactors: MatchFactor[]
  ): Promise<{ enhancedFactors: MatchFactor[]; confidenceScore: ConfidenceScore }> {
    // Prepare context data combining client profile, provider profile, and criteria
    const contextData = {
      clientProfile: client,
      providerProfile: provider,
      criteria
    };

    // Format the data for AI processing
    const prompt = `Analyze the match potential between a client and provider.
      Client: ${JSON.stringify(client)}
      Provider: ${JSON.stringify(provider)}
      Criteria: ${JSON.stringify(criteria)}
      Base Factors: ${JSON.stringify(baseFactors)}
      Provide additional insights and a confidence score for the match.`;

    // Call OpenAI service to analyze the match potential
    const aiResponse = await this.aiService.createChatCompletion(
      [{ role: 'user', content: prompt }],
      AIModelType.OPENAI_GPT35_TURBO
    );

    // Parse AI response to extract additional insights
    const aiInsights = JSON.parse(aiResponse);

    // Create new match factors based on AI insights
    const aiFactors: MatchFactor[] = aiInsights.factors.map((factor: any) => ({
      name: factor.name,
      score: factor.score,
      weight: getMatchFactorWeight(factor.name),
      description: factor.description
    }));

    // Calculate confidence score for the AI-enhanced matching
    const confidenceScore: ConfidenceScore = {
      score: aiInsights.confidenceScore,
      level: aiInsights.confidenceLevel,
      factors: aiInsights.confidenceFactors
    };

    // Combine base factors with AI-generated factors
    const enhancedFactors = [...baseFactors, ...aiFactors];

    // Return enhanced factors and confidence score
    return { enhancedFactors, confidenceScore };
  }

  /**
   * Calculates how well a provider's services match client needs
   * @param requiredServices
   * @param providerServices
   * @returns Service match factor with score and description
   */
  calculateServiceMatchFactor(requiredServices: string[], providerServices: string[]): MatchFactor {
    // Count how many required services are offered by the provider
    const matchedServices = requiredServices.filter(service => providerServices.includes(service));
    const matchedCount = matchedServices.length;

    // Calculate match percentage (services offered / services required)
    const matchPercentage = requiredServices.length > 0 ? matchedCount / requiredServices.length : 0;

    // Normalize the score between 0 and 1
    const normalizedScore = normalizeScore(matchPercentage, 0, 1);

    // Create and return a MatchFactor object with the score and description
    return {
      name: 'serviceMatch',
      score: normalizedScore,
      weight: getMatchFactorWeight('serviceMatch'),
      description: `Provider offers ${matchedCount} of ${requiredServices.length} required services`
    };
  }

  /**
   * Calculates the location proximity factor between client and provider
   * @param clientLocation
   * @param providerLocation
   * @param preferredDistance
   * @returns Location proximity factor with score and description
   */
  calculateLocationFactor(
    clientLocation: { latitude: number; longitude: number },
    providerLocation: { latitude: number; longitude: number },
    preferredDistance: number
  ): MatchFactor {
    // Calculate the distance between client and provider using calculateHaversineDistance
    const distance = calculateHaversineDistance(clientLocation, providerLocation);

    // Normalize the distance score based on preferred distance
    const normalizedDistance = normalizeScore(distance, 0, preferredDistance);

    // Invert the normalized score (closer = higher score)
    const proximityScore = 1 - normalizedDistance;

    // Create and return a MatchFactor object with the score and description
    return {
      name: 'locationProximity',
      score: proximityScore,
      weight: getMatchFactorWeight('locationProximity'),
      description: `Provider is ${distance} miles away from client (preferred distance: ${preferredDistance} miles)`
    };
  }

  /**
   * Calculates how well provider specializations match client needs
   * @param clientConditions
   * @param providerSpecializations
   * @returns Specialization match factor with score and description
   */
  calculateSpecializationFactor(clientConditions: string[], providerSpecializations: string[]): MatchFactor {
    // Map client conditions to relevant specializations
    const relevantSpecializations = clientConditions.map(condition => {
      // TODO: Implement mapping logic
      return condition;
    });

    // Count how many relevant specializations the provider has
    const matchedSpecializations = relevantSpecializations.filter(specialization =>
      providerSpecializations.includes(specialization)
    );
    const matchedCount = matchedSpecializations.length;

    // Calculate match percentage based on specialization overlap
    const matchPercentage =
      relevantSpecializations.length > 0 ? matchedCount / relevantSpecializations.length : 0;

    // Normalize the score between 0 and 1
    const normalizedScore = normalizeScore(matchPercentage, 0, 1);

    // Create and return a MatchFactor object with the score and description
    return {
      name: 'specializationMatch',
      score: normalizedScore,
      weight: getMatchFactorWeight('specializationMatch'),
      description: `Provider specializes in ${matchedCount} of ${relevantSpecializations.length} relevant areas`
    };
  }

  /**
   * Calculates the experience factor based on provider reviews and ratings
   * @param reviewCount
   * @param averageRating
   * @returns Experience factor with score and description
   */
  calculateExperienceFactor(reviewCount: number, averageRating: number): MatchFactor {
    // Normalize review count (more reviews = higher score)
    const normalizedReviewCount = normalizeScore(reviewCount, 0, 100);

    // Normalize average rating (higher rating = higher score)
    const normalizedRating = normalizeScore(averageRating, 1, 5);

    // Combine normalized scores with weighted average
    const experienceScore = 0.6 * normalizedRating + 0.4 * normalizedReviewCount;

    // Create and return a MatchFactor object with the score and description
    return {
      name: 'experience',
      score: experienceScore,
      weight: getMatchFactorWeight('experience'),
      description: `Provider has ${reviewCount} reviews with an average rating of ${averageRating}`
    };
  }

  /**
   * Calculates the insurance compatibility factor
   * @param clientInsurance
   * @param acceptedInsurance
   * @returns Insurance compatibility factor with score and description
   */
  calculateInsuranceFactor(clientInsurance: string, acceptedInsurance: string[]): MatchFactor {
    // Check if the provider accepts the client's insurance
    const acceptsInsurance = acceptedInsurance.includes(clientInsurance);

    // Set score to 1 if insurance is accepted, 0 if not
    const insuranceScore = acceptsInsurance ? 1 : 0;

    // Create and return a MatchFactor object with the score and description
    return {
      name: 'insuranceCompatibility',
      score: insuranceScore,
      weight: getMatchFactorWeight('insuranceCompatibility'),
      description: acceptsInsurance ? 'Provider accepts client\'s insurance' : 'Provider does not accept client\'s insurance'
    };
  }

  /**
   * Calculates preference match factors (gender, language, etc.)
   * @param criteria
   * @param provider
   * @param client
   * @returns Array of preference match factors
   */
  calculatePreferenceFactor(
    criteria: ProviderMatchingCriteria,
    provider: ProviderProfile,
    client: ClientProfile
  ): MatchFactor[] {
    const preferenceFactors: MatchFactor[] = [];

    // Calculate gender preference match if specified
    if (criteria.genderPreference) {
      // TODO: Implement gender preference matching
    }

    // Calculate language preference match if specified
    if (criteria.languagePreference) {
      // TODO: Implement language preference matching
    }

    // Calculate experience level match if specified
    if (criteria.experienceLevel) {
      // TODO: Implement experience level matching
    }

    // Calculate additional preference matches from criteria
    // TODO: Implement additional preference matching

    return preferenceFactors;
  }

  /**
   * Gets available time slots for a provider within a date range
   * @param providerId
   * @param dateRange
   * @param serviceType
   * @returns Array of available time slots
   */
  async getProviderAvailability(providerId: string, dateRange: any, serviceType: string): Promise<any[]> {
    // Call availabilityRepository to find available time slots
    const availableTimeSlots = await this.availabilityRepository.findAvailableTimeSlots(
      providerId,
      dateRange,
      serviceType as ServiceType
    );

    // Filter slots by date range and service type
    const filteredSlots = availableTimeSlots.filter(
      slot => slot.startTime >= dateRange.startDate && slot.endTime <= dateRange.endDate && slot.serviceType === serviceType
    );

    // Return the filtered time slots
    return filteredSlots;
  }
}

// Export the service class
export { ProviderMatchingService };

// Create and export a default instance for dependency injection
export default new ProviderMatchingService(
  new ProviderProfileRepository(),
  new ProviderAvailabilityRepository(),
  new ClientProfileRepository(),
  new OpenAIService()
);