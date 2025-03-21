import { PlanStatus } from '../../src/constants/plan-statuses';
import { ServiceType } from '../../src/constants/service-types';
import {
  ServicesPlan,
  NeedsAssessment,
  ServiceItem,
  FundingSource,
  CreateServicesPlanDTO,
  UpdateServicesPlanDTO,
  CreateNeedsAssessmentDTO
} from '../../src/types/services-plan.types';
import { mockUsers } from './users.fixture';
import { mockCarePlans } from './care-plans.fixture';

/**
 * Generates a mock services plan for testing
 * 
 * @param overrides - Properties to override in the default mock services plan
 * @returns A complete mock services plan
 */
export const generateMockServicesPlan = (overrides: Partial<ServicesPlan> = {}): ServicesPlan => {
  const defaultServicesPlan: ServicesPlan = {
    id: 'services-plan-1234-5678',
    clientId: mockUsers[0].id, // Sarah Johnson
    carePlanId: mockCarePlans[0].id,
    createdById: mockUsers[4].id, // Michael Brown (Case Manager)
    title: 'Comprehensive MS Services Plan',
    description: 'Services plan for Multiple Sclerosis management with focus on physical therapy and support services',
    needsAssessmentId: 'needs-assessment-1234-5678',
    status: PlanStatus.ACTIVE,
    estimatedCost: 4500,
    approvedById: mockUsers[4].id, // Michael Brown (Case Manager)
    approvedAt: new Date('2023-01-18T00:00:00.000Z'),
    serviceItems: [],
    fundingSources: [],
    createdAt: new Date('2023-01-17T00:00:00.000Z'),
    updatedAt: new Date('2023-01-17T00:00:00.000Z')
  };

  // Create a deep copy with serviceItems and fundingSources populated
  const result = {
    ...defaultServicesPlan,
    ...overrides,
    serviceItems: overrides.serviceItems || [
      generateMockServiceItem({ servicesPlanId: defaultServicesPlan.id }),
      generateMockServiceItem({
        id: 'service-item-2345-6789',
        servicesPlanId: defaultServicesPlan.id,
        serviceType: ServiceType.OCCUPATIONAL_THERAPY,
        description: 'Occupational therapy focusing on energy conservation techniques',
        frequency: '1x weekly',
        duration: '8 weeks',
        estimatedCost: 1200
      }),
      generateMockServiceItem({
        id: 'service-item-3456-7890',
        servicesPlanId: defaultServicesPlan.id,
        serviceType: ServiceType.SUPPORT_GROUP,
        description: 'Multiple Sclerosis support group participation',
        frequency: 'Weekly',
        duration: '12 weeks',
        estimatedCost: 300
      })
    ],
    fundingSources: overrides.fundingSources || [
      generateMockFundingSource({ servicesPlanId: defaultServicesPlan.id }),
      generateMockFundingSource({
        id: 'funding-source-2345-6789',
        servicesPlanId: defaultServicesPlan.id,
        name: 'Secondary Insurance',
        type: 'insurance',
        coveragePercentage: 20,
        coverageAmount: 900,
        verificationStatus: 'verified'
      })
    ]
  };

  return result;
};

/**
 * Generates a mock needs assessment for testing
 * 
 * @param overrides - Properties to override in the default mock needs assessment
 * @returns A complete mock needs assessment
 */
export const generateMockNeedsAssessment = (overrides: Partial<NeedsAssessment> = {}): NeedsAssessment => {
  const defaultNeedsAssessment: NeedsAssessment = {
    id: 'needs-assessment-1234-5678',
    clientId: mockUsers[0].id, // Sarah Johnson
    createdById: mockUsers[4].id, // Michael Brown (Case Manager)
    assessmentData: {
      mobility: {
        status: 'Limited',
        details: 'Difficulty walking long distances, uses cane occasionally',
        needsAssistance: true,
        priority: 'High'
      },
      selfCare: {
        status: 'Mostly independent',
        details: 'Occasional difficulty with fine motor tasks',
        needsAssistance: false,
        priority: 'Medium'
      },
      fatigue: {
        status: 'Significant',
        details: 'Experiences fatigue that impacts daily activities',
        needsAssistance: true,
        priority: 'High'
      },
      cognition: {
        status: 'Mild issues',
        details: 'Occasional memory and concentration difficulties',
        needsAssistance: false,
        priority: 'Medium'
      },
      housing: {
        status: 'Stable',
        details: 'No current housing needs',
        needsAssistance: false,
        priority: 'Low'
      },
      transportation: {
        status: 'Limited',
        details: 'Needs assistance with transportation to appointments',
        needsAssistance: true,
        priority: 'Medium'
      }
    },
    notes: 'Client has a strong support system with family but needs professional services to maintain independence.',
    createdAt: new Date('2023-01-15T00:00:00.000Z'),
    updatedAt: new Date('2023-01-15T00:00:00.000Z')
  };

  return {
    ...defaultNeedsAssessment,
    ...overrides
  };
};

/**
 * Generates a mock service item for testing
 * 
 * @param overrides - Properties to override in the default mock service item
 * @returns A complete mock service item
 */
export const generateMockServiceItem = (overrides: Partial<ServiceItem> = {}): ServiceItem => {
  const defaultServiceItem: ServiceItem = {
    id: 'service-item-1234-5678',
    servicesPlanId: 'services-plan-1234-5678',
    serviceType: ServiceType.PHYSICAL_THERAPY,
    providerId: mockUsers[2].id, // Emily Lee (Provider)
    description: 'Physical therapy focusing on gait and balance training',
    frequency: '2x weekly',
    duration: '12 weeks',
    estimatedCost: 3000,
    status: 'active',
    createdAt: new Date('2023-01-17T00:00:00.000Z'),
    updatedAt: new Date('2023-01-17T00:00:00.000Z')
  };

  return {
    ...defaultServiceItem,
    ...overrides
  };
};

/**
 * Generates a mock funding source for testing
 * 
 * @param overrides - Properties to override in the default mock funding source
 * @returns A complete mock funding source
 */
export const generateMockFundingSource = (overrides: Partial<FundingSource> = {}): FundingSource => {
  const defaultFundingSource: FundingSource = {
    id: 'funding-source-1234-5678',
    servicesPlanId: 'services-plan-1234-5678',
    name: 'Primary Insurance',
    type: 'insurance',
    coveragePercentage: 80,
    coverageAmount: 3600,
    verificationStatus: 'verified',
    details: {
      provider: 'Healthcare Provider Inc.',
      policyNumber: 'POL123456789',
      contactInfo: '1-800-555-1234'
    },
    createdAt: new Date('2023-01-17T00:00:00.000Z'),
    updatedAt: new Date('2023-01-17T00:00:00.000Z')
  };

  return {
    ...defaultFundingSource,
    ...overrides
  };
};

/**
 * Generates a mock DTO for creating a services plan
 * 
 * @param overrides - Properties to override in the default mock DTO
 * @returns A complete mock create services plan DTO
 */
export const generateMockCreateServicesPlanDTO = (overrides: Partial<CreateServicesPlanDTO> = {}): CreateServicesPlanDTO => {
  const defaultCreateDTO: CreateServicesPlanDTO = {
    clientId: mockUsers[0].id, // Sarah Johnson
    carePlanId: mockCarePlans[0].id,
    title: 'Comprehensive MS Services Plan',
    description: 'Services plan for Multiple Sclerosis management with focus on physical therapy and support services',
    needsAssessmentId: 'needs-assessment-1234-5678',
    serviceItems: [
      {
        serviceType: ServiceType.PHYSICAL_THERAPY,
        providerId: mockUsers[2].id, // Emily Lee (Provider)
        description: 'Physical therapy focusing on gait and balance training',
        frequency: '2x weekly',
        duration: '12 weeks',
        estimatedCost: 3000
      },
      {
        serviceType: ServiceType.OCCUPATIONAL_THERAPY,
        providerId: null, // No provider assigned yet
        description: 'Occupational therapy focusing on energy conservation techniques',
        frequency: '1x weekly',
        duration: '8 weeks',
        estimatedCost: 1200
      },
      {
        serviceType: ServiceType.SUPPORT_GROUP,
        providerId: null, // No provider assigned yet
        description: 'Multiple Sclerosis support group participation',
        frequency: 'Weekly',
        duration: '12 weeks',
        estimatedCost: 300
      }
    ],
    fundingSources: [
      {
        name: 'Primary Insurance',
        type: 'insurance',
        coveragePercentage: 80,
        coverageAmount: 3600,
        details: {
          provider: 'Healthcare Provider Inc.',
          policyNumber: 'POL123456789',
          contactInfo: '1-800-555-1234'
        }
      },
      {
        name: 'Secondary Insurance',
        type: 'insurance',
        coveragePercentage: 20,
        coverageAmount: 900,
        details: null
      }
    ]
  };

  return {
    ...defaultCreateDTO,
    ...overrides
  };
};

/**
 * Generates a mock DTO for updating a services plan
 * 
 * @param overrides - Properties to override in the default mock DTO
 * @returns A complete mock update services plan DTO
 */
export const generateMockUpdateServicesPlanDTO = (overrides: Partial<UpdateServicesPlanDTO> = {}): UpdateServicesPlanDTO => {
  const defaultUpdateDTO: UpdateServicesPlanDTO = {
    title: 'Updated MS Services Plan',
    description: 'Revised services plan with additional support services',
    status: PlanStatus.REVISED,
    serviceItems: [
      {
        id: 'service-item-1234-5678',
        serviceType: ServiceType.PHYSICAL_THERAPY,
        providerId: mockUsers[2].id, // Emily Lee (Provider)
        description: 'Physical therapy focusing on gait and balance training',
        frequency: '3x weekly', // Increased frequency
        duration: '12 weeks',
        estimatedCost: 4500, // Updated cost
        status: 'active'
      },
      {
        id: 'service-item-2345-6789',
        serviceType: ServiceType.OCCUPATIONAL_THERAPY,
        providerId: mockUsers[3].id, // James Wilson (Provider) - Now assigned
        description: 'Occupational therapy focusing on energy conservation techniques',
        frequency: '1x weekly',
        duration: '12 weeks', // Extended duration
        estimatedCost: 1800, // Updated cost
        status: 'active'
      },
      {
        // New service item without id
        serviceType: ServiceType.NUTRITIONAL_COUNSELING,
        providerId: null,
        description: 'Nutritional counseling for healthy diet management',
        frequency: 'Monthly',
        duration: '3 months',
        estimatedCost: 450,
        status: 'pending'
      }
    ],
    fundingSources: [
      {
        id: 'funding-source-1234-5678',
        name: 'Primary Insurance',
        type: 'insurance',
        coveragePercentage: 80,
        coverageAmount: 5400, // Updated coverage amount
        verificationStatus: 'verified',
        details: {
          provider: 'Healthcare Provider Inc.',
          policyNumber: 'POL123456789',
          contactInfo: '1-800-555-1234'
        }
      },
      {
        id: 'funding-source-2345-6789',
        name: 'Secondary Insurance',
        type: 'insurance',
        coveragePercentage: 20,
        coverageAmount: 1350, // Updated coverage amount
        verificationStatus: 'verified',
        details: null
      }
    ]
  };

  return {
    ...defaultUpdateDTO,
    ...overrides
  };
};

/**
 * Generates a mock DTO for creating a needs assessment
 * 
 * @param overrides - Properties to override in the default mock DTO
 * @returns A complete mock create needs assessment DTO
 */
export const generateMockCreateNeedsAssessmentDTO = (overrides: Partial<CreateNeedsAssessmentDTO> = {}): CreateNeedsAssessmentDTO => {
  const defaultCreateDTO: CreateNeedsAssessmentDTO = {
    clientId: mockUsers[0].id, // Sarah Johnson
    assessmentData: {
      mobility: {
        status: 'Limited',
        details: 'Difficulty walking long distances, uses cane occasionally',
        needsAssistance: true,
        priority: 'High'
      },
      selfCare: {
        status: 'Mostly independent',
        details: 'Occasional difficulty with fine motor tasks',
        needsAssistance: false,
        priority: 'Medium'
      },
      fatigue: {
        status: 'Significant',
        details: 'Experiences fatigue that impacts daily activities',
        needsAssistance: true,
        priority: 'High'
      },
      cognition: {
        status: 'Mild issues',
        details: 'Occasional memory and concentration difficulties',
        needsAssistance: false,
        priority: 'Medium'
      },
      housing: {
        status: 'Stable',
        details: 'No current housing needs',
        needsAssistance: false,
        priority: 'Low'
      },
      transportation: {
        status: 'Limited',
        details: 'Needs assistance with transportation to appointments',
        needsAssistance: true,
        priority: 'Medium'
      }
    },
    notes: 'Client has a strong support system with family but needs professional services to maintain independence.'
  };

  return {
    ...defaultCreateDTO,
    ...overrides
  };
};

// Array of pre-defined mock services plans with different statuses
export const mockServicesPlans: ServicesPlan[] = [
  generateMockServicesPlan(), // Default active services plan
  generateMockServicesPlan({
    id: 'services-plan-draft',
    status: PlanStatus.DRAFT,
    approvedById: null,
    approvedAt: null
  }),
  generateMockServicesPlan({
    id: 'services-plan-in-review',
    status: PlanStatus.IN_REVIEW,
    approvedById: null,
    approvedAt: null
  }),
  generateMockServicesPlan({
    id: 'services-plan-completed',
    status: PlanStatus.COMPLETED,
    serviceItems: [
      generateMockServiceItem({
        status: 'completed'
      }),
      generateMockServiceItem({
        id: 'service-item-2345-6789',
        serviceType: ServiceType.OCCUPATIONAL_THERAPY,
        description: 'Occupational therapy focusing on energy conservation techniques',
        status: 'completed',
        estimatedCost: 1200
      })
    ]
  }),
  generateMockServicesPlan({
    id: 'services-plan-second-client',
    clientId: mockUsers[1].id, // John Davis
    carePlanId: mockCarePlans[5].id, // Spinal Cord Injury Plan
    title: 'Spinal Cord Injury Services Plan',
    description: 'Services implementation plan for T6 spinal cord injury rehabilitation',
    needsAssessmentId: 'needs-assessment-sci',
    estimatedCost: 8500,
    serviceItems: [
      generateMockServiceItem({
        id: 'service-item-sci-1',
        serviceType: ServiceType.PHYSICAL_THERAPY,
        description: 'Physical therapy for upper body strengthening',
        frequency: '3x weekly',
        duration: '16 weeks',
        estimatedCost: 5800
      }),
      generateMockServiceItem({
        id: 'service-item-sci-2',
        serviceType: ServiceType.OCCUPATIONAL_THERAPY,
        description: 'Wheelchair skills training',
        frequency: '2x weekly',
        duration: '8 weeks',
        estimatedCost: 2400
      }),
      generateMockServiceItem({
        id: 'service-item-sci-3',
        serviceType: ServiceType.HOME_HEALTH_AIDE,
        description: 'In-home assistance with personal care',
        frequency: '3x weekly',
        duration: '12 weeks',
        estimatedCost: 3600
      })
    ],
    fundingSources: [
      generateMockFundingSource({
        id: 'funding-source-sci-1',
        name: 'Private Insurance',
        coveragePercentage: 70,
        coverageAmount: 5950
      }),
      generateMockFundingSource({
        id: 'funding-source-sci-2',
        name: 'State Disability Program',
        type: 'government',
        coveragePercentage: 30,
        coverageAmount: 2550
      })
    ]
  })
];

// Array of pre-defined mock needs assessments
export const mockNeedsAssessments: NeedsAssessment[] = [
  generateMockNeedsAssessment(),
  generateMockNeedsAssessment({
    id: 'needs-assessment-sci',
    clientId: mockUsers[1].id, // John Davis
    assessmentData: {
      mobility: {
        status: 'Severely limited',
        details: 'T6 complete spinal cord injury, uses wheelchair for all mobility',
        needsAssistance: true,
        priority: 'High'
      },
      selfCare: {
        status: 'Requires assistance',
        details: 'Needs help with bathing, dressing lower body',
        needsAssistance: true,
        priority: 'High'
      },
      bowelBladder: {
        status: 'Requires management',
        details: 'Established bowel/bladder program',
        needsAssistance: true,
        priority: 'High'
      },
      housing: {
        status: 'Needs modification',
        details: 'Home requires accessibility modifications',
        needsAssistance: true,
        priority: 'High'
      },
      transportation: {
        status: 'Requires accessible transport',
        details: 'Needs wheelchair accessible transportation',
        needsAssistance: true,
        priority: 'High'
      },
      vocation: {
        status: 'On hold',
        details: 'Previously employed as construction worker, needs vocational rehabilitation',
        needsAssistance: true,
        priority: 'Medium'
      }
    },
    notes: 'Client injured 3 months ago, highly motivated for rehabilitation. Lives with spouse who is supportive but works full-time.'
  })
];

// Array of pre-defined mock service items
export const mockServiceItems: ServiceItem[] = [
  generateMockServiceItem(),
  generateMockServiceItem({
    id: 'service-item-pending',
    providerId: null,
    serviceType: ServiceType.MEDICATION_MANAGEMENT,
    description: 'Medication management and adherence support',
    frequency: 'Monthly',
    duration: '6 months',
    estimatedCost: 900,
    status: 'pending'
  }),
  generateMockServiceItem({
    id: 'service-item-completed',
    serviceType: ServiceType.INITIAL_ASSESSMENT,
    description: 'Initial comprehensive assessment by physical therapist',
    frequency: 'One-time',
    duration: 'N/A',
    estimatedCost: 350,
    status: 'completed'
  }),
  generateMockServiceItem({
    id: 'service-item-discontinued',
    serviceType: ServiceType.RECREATIONAL_THERAPY,
    description: 'Recreational therapy for community reintegration',
    frequency: '1x weekly',
    duration: '12 weeks',
    estimatedCost: 1800,
    status: 'discontinued'
  })
];

// Array of pre-defined mock funding sources
export const mockFundingSources: FundingSource[] = [
  generateMockFundingSource(),
  generateMockFundingSource({
    id: 'funding-source-medicaid',
    name: 'Medicaid',
    type: 'medicaid',
    coveragePercentage: 100,
    coverageAmount: 5000,
    verificationStatus: 'pending',
    details: {
      programName: 'State Medicaid Program',
      caseNumber: 'M123456789'
    }
  }),
  generateMockFundingSource({
    id: 'funding-source-grant',
    name: 'Community Support Grant',
    type: 'grant',
    coveragePercentage: 50,
    coverageAmount: 2500,
    verificationStatus: 'verified',
    details: {
      grantName: 'Community Access Program',
      grantPeriod: '2023-01-01 to 2023-12-31'
    }
  }),
  generateMockFundingSource({
    id: 'funding-source-private',
    name: 'Private Pay',
    type: 'private_pay',
    coveragePercentage: 100,
    coverageAmount: 1000,
    verificationStatus: 'verified',
    details: null
  })
];

// Array of pre-defined mock DTOs for creating services plans
export const mockCreateServicesPlanDTOs: CreateServicesPlanDTO[] = [
  generateMockCreateServicesPlanDTO(),
  generateMockCreateServicesPlanDTO({
    clientId: mockUsers[1].id, // John Davis
    carePlanId: mockCarePlans[5].id, // Spinal Cord Injury Plan
    title: 'Spinal Cord Injury Services Plan',
    description: 'Services implementation plan for T6 spinal cord injury rehabilitation',
    needsAssessmentId: 'needs-assessment-sci',
    serviceItems: [
      {
        serviceType: ServiceType.PHYSICAL_THERAPY,
        providerId: mockUsers[2].id, // Emily Lee (Provider)
        description: 'Physical therapy for upper body strengthening',
        frequency: '3x weekly',
        duration: '16 weeks',
        estimatedCost: 5800
      },
      {
        serviceType: ServiceType.OCCUPATIONAL_THERAPY,
        providerId: mockUsers[3].id, // James Wilson (Provider)
        description: 'Wheelchair skills training',
        frequency: '2x weekly',
        duration: '8 weeks',
        estimatedCost: 2400
      },
      {
        serviceType: ServiceType.HOME_HEALTH_AIDE,
        providerId: null,
        description: 'In-home assistance with personal care',
        frequency: '3x weekly',
        duration: '12 weeks',
        estimatedCost: 3600
      }
    ],
    fundingSources: [
      {
        name: 'Private Insurance',
        type: 'insurance',
        coveragePercentage: 70,
        coverageAmount: 5950,
        details: {
          provider: 'National Health Insurance',
          policyNumber: 'NHI987654321',
          contactInfo: '1-800-555-9876'
        }
      },
      {
        name: 'State Disability Program',
        type: 'government',
        coveragePercentage: 30,
        coverageAmount: 2550,
        details: {
          programName: 'State Disability Services',
          caseNumber: 'SDS-2023-12345'
        }
      }
    ]
  })
];

// Array of pre-defined mock DTOs for updating services plans
export const mockUpdateServicesPlanDTOs: UpdateServicesPlanDTO[] = [
  generateMockUpdateServicesPlanDTO(),
  generateMockUpdateServicesPlanDTO({
    title: 'Enhanced Spinal Cord Injury Services Plan',
    description: 'Updated services plan with additional home care and transportation services',
    status: PlanStatus.REVISED,
    serviceItems: [
      {
        id: 'service-item-sci-1',
        serviceType: ServiceType.PHYSICAL_THERAPY,
        providerId: mockUsers[2].id, // Emily Lee (Provider)
        description: 'Physical therapy for upper body strengthening',
        frequency: '3x weekly',
        duration: '20 weeks', // Extended duration
        estimatedCost: 7250, // Updated cost
        status: 'active'
      },
      {
        id: 'service-item-sci-3',
        serviceType: ServiceType.HOME_HEALTH_AIDE,
        providerId: null,
        description: 'In-home assistance with personal care',
        frequency: '5x weekly', // Increased frequency
        duration: '12 weeks',
        estimatedCost: 6000, // Updated cost
        status: 'active'
      },
      {
        // New service
        serviceType: ServiceType.TRANSPORTATION,
        providerId: null,
        description: 'Wheelchair accessible transportation to appointments',
        frequency: 'As needed, estimated 3x weekly',
        duration: '6 months',
        estimatedCost: 4500,
        status: 'pending'
      },
      {
        // New service
        serviceType: ServiceType.HOME_MODIFICATION,
        providerId: null,
        description: 'Bathroom and entrance accessibility modifications',
        frequency: 'One-time',
        duration: 'N/A',
        estimatedCost: 8500,
        status: 'pending'
      }
    ],
    fundingSources: [
      {
        id: 'funding-source-sci-1',
        name: 'Private Insurance',
        type: 'insurance',
        coveragePercentage: 70,
        coverageAmount: 12250, // Updated amount
        verificationStatus: 'verified',
        details: {
          provider: 'National Health Insurance',
          policyNumber: 'NHI987654321',
          contactInfo: '1-800-555-9876'
        }
      },
      {
        id: 'funding-source-sci-2',
        name: 'State Disability Program',
        type: 'government',
        coveragePercentage: 30,
        coverageAmount: 5250, // Updated amount
        verificationStatus: 'verified',
        details: {
          programName: 'State Disability Services',
          caseNumber: 'SDS-2023-12345'
        }
      },
      {
        // New funding source
        name: 'Home Modification Grant',
        type: 'grant',
        coveragePercentage: 100,
        coverageAmount: 8500,
        verificationStatus: 'pending',
        details: {
          grantName: 'Accessible Homes Initiative',
          grantPeriod: '2023'
        }
      }
    ]
  })
];

// Array of pre-defined mock DTOs for creating needs assessments
export const mockCreateNeedsAssessmentDTOs: CreateNeedsAssessmentDTO[] = [
  generateMockCreateNeedsAssessmentDTO(),
  generateMockCreateNeedsAssessmentDTO({
    clientId: mockUsers[1].id, // John Davis
    assessmentData: {
      mobility: {
        status: 'Severely limited',
        details: 'T6 complete spinal cord injury, uses wheelchair for all mobility',
        needsAssistance: true,
        priority: 'High'
      },
      selfCare: {
        status: 'Requires assistance',
        details: 'Needs help with bathing, dressing lower body',
        needsAssistance: true,
        priority: 'High'
      },
      bowelBladder: {
        status: 'Requires management',
        details: 'Established bowel/bladder program',
        needsAssistance: true,
        priority: 'High'
      },
      housing: {
        status: 'Needs modification',
        details: 'Home requires accessibility modifications',
        needsAssistance: true,
        priority: 'High'
      },
      transportation: {
        status: 'Requires accessible transport',
        details: 'Needs wheelchair accessible transportation',
        needsAssistance: true,
        priority: 'High'
      },
      vocation: {
        status: 'On hold',
        details: 'Previously employed as construction worker, needs vocational rehabilitation',
        needsAssistance: true,
        priority: 'Medium'
      }
    },
    notes: 'Client injured 3 months ago, highly motivated for rehabilitation. Lives with spouse who is supportive but works full-time.'
  })
];