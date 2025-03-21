/**
 * Service Types for the Revolucare platform
 * 
 * This file defines all available service types and their related information,
 * including human-readable labels, descriptions, categories, and default durations.
 * It serves as the central reference for all service-related functionality.
 */

/**
 * Enum of all service types available in the Revolucare platform
 */
export enum ServiceType {
  PHYSICAL_THERAPY = 'physical_therapy',
  OCCUPATIONAL_THERAPY = 'occupational_therapy',
  SPEECH_THERAPY = 'speech_therapy',
  BEHAVIORAL_THERAPY = 'behavioral_therapy',
  COUNSELING = 'counseling',
  HOME_HEALTH_AIDE = 'home_health_aide',
  PERSONAL_CARE_ASSISTANT = 'personal_care_assistant',
  RESPITE_CARE = 'respite_care',
  TRANSPORTATION = 'transportation',
  MEAL_DELIVERY = 'meal_delivery',
  NUTRITIONAL_COUNSELING = 'nutritional_counseling',
  MEDICATION_MANAGEMENT = 'medication_management',
  ASSISTIVE_TECHNOLOGY = 'assistive_technology',
  HOME_MODIFICATION = 'home_modification',
  VOCATIONAL_REHABILITATION = 'vocational_rehabilitation',
  RECREATIONAL_THERAPY = 'recreational_therapy',
  SUPPORT_GROUP = 'support_group',
  CASE_MANAGEMENT = 'case_management',
  INITIAL_ASSESSMENT = 'initial_assessment',
  FOLLOW_UP_CONSULTATION = 'follow_up_consultation'
}

/**
 * Human-readable labels for each service type
 */
export const ServiceTypeLabels: Record<ServiceType, string> = {
  [ServiceType.PHYSICAL_THERAPY]: 'Physical Therapy',
  [ServiceType.OCCUPATIONAL_THERAPY]: 'Occupational Therapy',
  [ServiceType.SPEECH_THERAPY]: 'Speech Therapy',
  [ServiceType.BEHAVIORAL_THERAPY]: 'Behavioral Therapy',
  [ServiceType.COUNSELING]: 'Counseling',
  [ServiceType.HOME_HEALTH_AIDE]: 'Home Health Aide',
  [ServiceType.PERSONAL_CARE_ASSISTANT]: 'Personal Care Assistant',
  [ServiceType.RESPITE_CARE]: 'Respite Care',
  [ServiceType.TRANSPORTATION]: 'Transportation',
  [ServiceType.MEAL_DELIVERY]: 'Meal Delivery',
  [ServiceType.NUTRITIONAL_COUNSELING]: 'Nutritional Counseling',
  [ServiceType.MEDICATION_MANAGEMENT]: 'Medication Management',
  [ServiceType.ASSISTIVE_TECHNOLOGY]: 'Assistive Technology',
  [ServiceType.HOME_MODIFICATION]: 'Home Modification',
  [ServiceType.VOCATIONAL_REHABILITATION]: 'Vocational Rehabilitation',
  [ServiceType.RECREATIONAL_THERAPY]: 'Recreational Therapy',
  [ServiceType.SUPPORT_GROUP]: 'Support Group',
  [ServiceType.CASE_MANAGEMENT]: 'Case Management',
  [ServiceType.INITIAL_ASSESSMENT]: 'Initial Assessment',
  [ServiceType.FOLLOW_UP_CONSULTATION]: 'Follow-up Consultation'
};

/**
 * Detailed descriptions of each service type
 */
export const ServiceTypeDescriptions: Record<ServiceType, string> = {
  [ServiceType.PHYSICAL_THERAPY]: 'Therapeutic exercises and techniques to help patients regain or improve physical abilities, mobility, and strength.',
  [ServiceType.OCCUPATIONAL_THERAPY]: 'Therapy focused on helping individuals develop, recover, and maintain the skills needed for daily living and working.',
  [ServiceType.SPEECH_THERAPY]: 'Assessment and treatment of communication problems and speech disorders to improve language, speech, and swallowing abilities.',
  [ServiceType.BEHAVIORAL_THERAPY]: 'Therapy focused on identifying and changing potentially self-destructive or unhealthy behaviors, improving emotional regulation and coping skills.',
  [ServiceType.COUNSELING]: 'Professional guidance to help individuals address emotional, mental, or behavioral issues and improve well-being.',
  [ServiceType.HOME_HEALTH_AIDE]: 'Assistance with health-related tasks, personal care, and light household duties for individuals in their homes.',
  [ServiceType.PERSONAL_CARE_ASSISTANT]: 'Non-medical assistance with daily activities such as bathing, dressing, meal preparation, and medication reminders.',
  [ServiceType.RESPITE_CARE]: 'Temporary relief for primary caregivers, providing short-term breaks while ensuring continued care for the individual.',
  [ServiceType.TRANSPORTATION]: 'Non-emergency transportation services to medical appointments, therapy sessions, and other essential activities.',
  [ServiceType.MEAL_DELIVERY]: 'Preparation and delivery of nutritious meals to individuals who are unable to shop for or prepare their own food.',
  [ServiceType.NUTRITIONAL_COUNSELING]: 'Professional guidance on nutrition and dietary choices to improve health outcomes and manage medical conditions.',
  [ServiceType.MEDICATION_MANAGEMENT]: 'Services to ensure safe and effective medication use, including medication reviews, organization, and reminders.',
  [ServiceType.ASSISTIVE_TECHNOLOGY]: 'Assessment, recommendation, and training on devices and equipment that increase functional capabilities for individuals with disabilities.',
  [ServiceType.HOME_MODIFICATION]: 'Structural changes to homes to improve accessibility, safety, and independence for individuals with physical limitations.',
  [ServiceType.VOCATIONAL_REHABILITATION]: 'Services to help individuals with disabilities prepare for, obtain, maintain, or regain employment.',
  [ServiceType.RECREATIONAL_THERAPY]: 'Therapy using recreational activities to improve or maintain physical, mental, and emotional well-being.',
  [ServiceType.SUPPORT_GROUP]: 'Organized meetings where individuals with similar experiences can share challenges, successes, and coping strategies.',
  [ServiceType.CASE_MANAGEMENT]: 'Coordination of services and resources to meet an individual\'s health and human service needs.',
  [ServiceType.INITIAL_ASSESSMENT]: 'Comprehensive evaluation to determine health status, functional capabilities, needs, and appropriate service recommendations.',
  [ServiceType.FOLLOW_UP_CONSULTATION]: 'Subsequent appointment to review progress, adjust care plans, and address any new concerns or changes in condition.'
};

/**
 * Service categories grouping related service types
 */
export const ServiceCategories = {
  THERAPY: [
    ServiceType.PHYSICAL_THERAPY,
    ServiceType.OCCUPATIONAL_THERAPY,
    ServiceType.SPEECH_THERAPY,
    ServiceType.BEHAVIORAL_THERAPY,
    ServiceType.COUNSELING,
    ServiceType.RECREATIONAL_THERAPY
  ],
  HOME_CARE: [
    ServiceType.HOME_HEALTH_AIDE,
    ServiceType.PERSONAL_CARE_ASSISTANT,
    ServiceType.RESPITE_CARE,
    ServiceType.HOME_MODIFICATION
  ],
  SUPPORT_SERVICES: [
    ServiceType.TRANSPORTATION,
    ServiceType.MEAL_DELIVERY,
    ServiceType.NUTRITIONAL_COUNSELING,
    ServiceType.SUPPORT_GROUP,
    ServiceType.VOCATIONAL_REHABILITATION,
    ServiceType.ASSISTIVE_TECHNOLOGY
  ],
  MEDICAL: [
    ServiceType.MEDICATION_MANAGEMENT
  ],
  ASSESSMENT: [
    ServiceType.INITIAL_ASSESSMENT,
    ServiceType.FOLLOW_UP_CONSULTATION,
    ServiceType.CASE_MANAGEMENT
  ]
};

/**
 * Default duration in minutes for each service type
 */
export const DefaultServiceDurations: Record<ServiceType, number> = {
  [ServiceType.PHYSICAL_THERAPY]: 60,
  [ServiceType.OCCUPATIONAL_THERAPY]: 60,
  [ServiceType.SPEECH_THERAPY]: 45,
  [ServiceType.BEHAVIORAL_THERAPY]: 50,
  [ServiceType.COUNSELING]: 50,
  [ServiceType.HOME_HEALTH_AIDE]: 120,
  [ServiceType.PERSONAL_CARE_ASSISTANT]: 120,
  [ServiceType.RESPITE_CARE]: 240,
  [ServiceType.TRANSPORTATION]: 60,
  [ServiceType.MEAL_DELIVERY]: 30,
  [ServiceType.NUTRITIONAL_COUNSELING]: 45,
  [ServiceType.MEDICATION_MANAGEMENT]: 30,
  [ServiceType.ASSISTIVE_TECHNOLOGY]: 60,
  [ServiceType.HOME_MODIFICATION]: 120,
  [ServiceType.VOCATIONAL_REHABILITATION]: 60,
  [ServiceType.RECREATIONAL_THERAPY]: 60,
  [ServiceType.SUPPORT_GROUP]: 90,
  [ServiceType.CASE_MANAGEMENT]: 45,
  [ServiceType.INITIAL_ASSESSMENT]: 90,
  [ServiceType.FOLLOW_UP_CONSULTATION]: 30
};

/**
 * Determines which category a service type belongs to
 * 
 * @param serviceType - The service type to find the category for
 * @returns The category name or undefined if not found
 */
export const getCategoryForServiceType = (serviceType: ServiceType): string | undefined => {
  for (const [category, types] of Object.entries(ServiceCategories)) {
    if (types.includes(serviceType)) {
      return category;
    }
  }
  return undefined;
};

/**
 * Gets all service types within a specific category
 * 
 * @param category - The category name to find service types for
 * @returns Array of service types in the specified category
 */
export const getServiceTypesByCategory = (category: string): ServiceType[] => {
  return ServiceCategories[category as keyof typeof ServiceCategories] || [];
};

/**
 * Gets all available service types
 * 
 * @returns Array of all service types
 */
export const getAllServiceTypes = (): ServiceType[] => {
  return Object.values(ServiceType);
};