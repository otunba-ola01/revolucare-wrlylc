import { PlanStatus } from '../../src/constants/plan-statuses';
import {
  GoalStatus,
  InterventionStatus,
  CarePlan,
  CarePlanGoal,
  CarePlanIntervention,
  CarePlanOption,
  CreateCarePlanDTO,
  UpdateCarePlanDTO
} from '../../src/types/care-plan.types';
import { mockUsers } from './users.fixture';

/**
 * Generates a mock care plan goal for testing
 * 
 * @param overrides - Properties to override in the default mock goal
 * @returns A complete mock care plan goal
 */
export const generateMockCarePlanGoal = (overrides: Partial<CarePlanGoal> = {}): CarePlanGoal => {
  const defaultGoal: CarePlanGoal = {
    id: 'goal-1234-5678',
    carePlanId: 'care-plan-1234-5678',
    description: 'Improve mobility and balance',
    targetDate: new Date('2023-12-31T00:00:00.000Z'),
    status: GoalStatus.IN_PROGRESS,
    measures: [
      'Able to walk 100 meters without assistance',
      'Able to stand on one leg for 30 seconds',
      'Improvement in Berg Balance Scale score'
    ],
    createdAt: new Date('2023-01-15T00:00:00.000Z'),
    updatedAt: new Date('2023-01-15T00:00:00.000Z')
  };

  return {
    ...defaultGoal,
    ...overrides
  };
};

/**
 * Generates a mock care plan intervention for testing
 * 
 * @param overrides - Properties to override in the default mock intervention
 * @returns A complete mock care plan intervention
 */
export const generateMockCarePlanIntervention = (overrides: Partial<CarePlanIntervention> = {}): CarePlanIntervention => {
  const defaultIntervention: CarePlanIntervention = {
    id: 'intervention-1234-5678',
    carePlanId: 'care-plan-1234-5678',
    description: 'Physical Therapy sessions focusing on gait and balance',
    frequency: '2x weekly',
    duration: '12 weeks',
    responsibleParty: 'Physical Therapist',
    status: InterventionStatus.ACTIVE,
    createdAt: new Date('2023-01-15T00:00:00.000Z'),
    updatedAt: new Date('2023-01-15T00:00:00.000Z')
  };

  return {
    ...defaultIntervention,
    ...overrides
  };
};

/**
 * Generates a mock care plan for testing
 * 
 * @param overrides - Properties to override in the default mock care plan
 * @returns A complete mock care plan
 */
export const generateMockCarePlan = (overrides: Partial<CarePlan> = {}): CarePlan => {
  const defaultCarePlan: CarePlan = {
    id: 'care-plan-1234-5678',
    clientId: mockUsers[0].id, // Sarah Johnson
    createdById: mockUsers[4].id, // Michael Brown (Case Manager)
    title: 'Comprehensive MS Management Plan',
    description: 'A holistic care plan addressing mobility, fatigue management, and overall quality of life for MS patient',
    status: PlanStatus.ACTIVE,
    confidenceScore: 95,
    version: 1,
    previousVersionId: null,
    approvedById: mockUsers[4].id, // Michael Brown (Case Manager)
    approvedAt: new Date('2023-01-16T00:00:00.000Z'),
    approvalNotes: 'Approved based on client needs assessment and medical records',
    goals: [
      generateMockCarePlanGoal(),
      generateMockCarePlanGoal({
        id: 'goal-2345-6789',
        description: 'Reduce fatigue symptoms',
        measures: [
          'Decreased score on Fatigue Severity Scale',
          'Able to complete daily activities without excessive rest periods'
        ]
      }),
      generateMockCarePlanGoal({
        id: 'goal-3456-7890',
        description: 'Improve medication adherence',
        status: GoalStatus.PENDING,
        measures: [
          'Taking medications as prescribed 90% of the time',
          'Reduced side effects through proper timing'
        ]
      })
    ],
    interventions: [
      generateMockCarePlanIntervention(),
      generateMockCarePlanIntervention({
        id: 'intervention-2345-6789',
        description: 'Occupational Therapy focusing on energy conservation',
        frequency: '1x weekly',
        duration: '8 weeks',
        responsibleParty: 'Occupational Therapist'
      }),
      generateMockCarePlanIntervention({
        id: 'intervention-3456-7890',
        description: 'Medication management and education',
        frequency: 'Monthly',
        duration: 'Ongoing',
        responsibleParty: 'Nurse Practitioner'
      }),
      generateMockCarePlanIntervention({
        id: 'intervention-4567-8901',
        description: 'Support group participation',
        frequency: 'Weekly',
        duration: '12 weeks',
        responsibleParty: 'Social Worker',
        status: InterventionStatus.PENDING
      })
    ],
    createdAt: new Date('2023-01-15T00:00:00.000Z'),
    updatedAt: new Date('2023-01-15T00:00:00.000Z')
  };

  return {
    ...defaultCarePlan,
    ...overrides
  };
};

/**
 * Generates a mock AI-generated care plan option for testing
 * 
 * @param overrides - Properties to override in the default mock care plan option
 * @returns A complete mock care plan option
 */
export const generateMockCarePlanOption = (overrides: Partial<CarePlanOption> = {}): CarePlanOption => {
  const defaultOption: CarePlanOption = {
    title: 'Comprehensive MS Management',
    description: 'A holistic approach to managing Multiple Sclerosis with focus on mobility, fatigue management, and overall well-being',
    confidenceScore: 95,
    goals: [
      {
        description: 'Improve mobility and balance',
        targetDate: new Date('2023-12-31T00:00:00.000Z'),
        measures: [
          'Able to walk 100 meters without assistance',
          'Able to stand on one leg for 30 seconds',
          'Improvement in Berg Balance Scale score'
        ]
      },
      {
        description: 'Reduce fatigue symptoms',
        measures: [
          'Decreased score on Fatigue Severity Scale',
          'Able to complete daily activities without excessive rest periods'
        ]
      },
      {
        description: 'Manage medication side effects',
        measures: [
          'Reduction in reported side effects',
          'Development of effective coping strategies'
        ]
      },
      {
        description: 'Enhance overall quality of life',
        measures: [
          'Improvement in quality of life assessment scores',
          'Increased participation in social activities'
        ]
      }
    ],
    interventions: [
      {
        description: 'Physical Therapy',
        frequency: '2x weekly',
        duration: '12 weeks',
        responsibleParty: 'Physical Therapist'
      },
      {
        description: 'Occupational Therapy',
        frequency: '1x weekly',
        duration: '8 weeks',
        responsibleParty: 'Occupational Therapist'
      },
      {
        description: 'Medication Management',
        frequency: 'Monthly',
        duration: 'Ongoing',
        responsibleParty: 'Nurse Practitioner'
      },
      {
        description: 'Nutritional Counseling',
        frequency: 'Initial + 2 follow-ups',
        duration: '3 months',
        responsibleParty: 'Dietitian'
      },
      {
        description: 'Support Group',
        frequency: 'Weekly',
        duration: 'Ongoing',
        responsibleParty: 'Social Worker'
      }
    ],
    expectedOutcomes: [
      '30% improvement in mobility assessment scores',
      'Reduced fatigue severity scale scores',
      'Improved medication adherence',
      'Enhanced quality of life metrics'
    ]
  };

  return {
    ...defaultOption,
    ...overrides
  };
};

/**
 * Generates a mock DTO for creating a care plan
 * 
 * @param overrides - Properties to override in the default mock DTO
 * @returns A complete mock create care plan DTO
 */
export const generateMockCreateCarePlanDTO = (overrides: Partial<CreateCarePlanDTO> = {}): CreateCarePlanDTO => {
  const defaultCreateDTO: CreateCarePlanDTO = {
    clientId: mockUsers[0].id, // Sarah Johnson
    title: 'Comprehensive MS Management Plan',
    description: 'A holistic care plan addressing mobility, fatigue management, and overall quality of life for MS patient',
    goals: [
      {
        description: 'Improve mobility and balance',
        targetDate: new Date('2023-12-31T00:00:00.000Z'),
        status: GoalStatus.PENDING,
        measures: [
          'Able to walk 100 meters without assistance',
          'Able to stand on one leg for 30 seconds',
          'Improvement in Berg Balance Scale score'
        ]
      },
      {
        description: 'Reduce fatigue symptoms',
        status: GoalStatus.PENDING,
        measures: [
          'Decreased score on Fatigue Severity Scale',
          'Able to complete daily activities without excessive rest periods'
        ]
      },
      {
        description: 'Improve medication adherence',
        status: GoalStatus.PENDING,
        measures: [
          'Taking medications as prescribed 90% of the time',
          'Reduced side effects through proper timing'
        ]
      }
    ],
    interventions: [
      {
        description: 'Physical Therapy sessions focusing on gait and balance',
        frequency: '2x weekly',
        duration: '12 weeks',
        responsibleParty: 'Physical Therapist',
        status: InterventionStatus.PENDING
      },
      {
        description: 'Occupational Therapy focusing on energy conservation',
        frequency: '1x weekly',
        duration: '8 weeks',
        responsibleParty: 'Occupational Therapist',
        status: InterventionStatus.PENDING
      },
      {
        description: 'Medication management and education',
        frequency: 'Monthly',
        duration: 'Ongoing',
        responsibleParty: 'Nurse Practitioner',
        status: InterventionStatus.PENDING
      },
      {
        description: 'Support group participation',
        frequency: 'Weekly',
        duration: '12 weeks',
        responsibleParty: 'Social Worker',
        status: InterventionStatus.PENDING
      }
    ]
  };

  return {
    ...defaultCreateDTO,
    ...overrides
  };
};

/**
 * Generates a mock DTO for updating a care plan
 * 
 * @param overrides - Properties to override in the default mock DTO
 * @returns A complete mock update care plan DTO
 */
export const generateMockUpdateCarePlanDTO = (overrides: Partial<UpdateCarePlanDTO> = {}): UpdateCarePlanDTO => {
  const defaultUpdateDTO: UpdateCarePlanDTO = {
    title: 'Updated MS Management Plan',
    description: 'Revised care plan with additional interventions based on client progress',
    status: PlanStatus.REVISED,
    goals: [
      {
        id: 'goal-1234-5678',
        description: 'Improve mobility and balance',
        targetDate: new Date('2023-12-31T00:00:00.000Z'),
        status: GoalStatus.IN_PROGRESS,
        measures: [
          'Able to walk 100 meters without assistance',
          'Able to stand on one leg for 30 seconds',
          'Improvement in Berg Balance Scale score'
        ]
      },
      {
        id: 'goal-2345-6789',
        description: 'Reduce fatigue symptoms',
        status: GoalStatus.IN_PROGRESS,
        measures: [
          'Decreased score on Fatigue Severity Scale',
          'Able to complete daily activities without excessive rest periods',
          'Implementation of energy conservation techniques' // Added measure
        ]
      },
      {
        // New goal without id
        description: 'Enhance cognitive function',
        targetDate: new Date('2023-12-31T00:00:00.000Z'),
        status: GoalStatus.PENDING,
        measures: [
          'Improvement in cognitive assessment scores',
          'Reduced cognitive fatigue',
          'Implementation of effective memory strategies'
        ]
      }
    ],
    interventions: [
      {
        id: 'intervention-1234-5678',
        description: 'Physical Therapy sessions focusing on gait and balance',
        frequency: '3x weekly', // Changed from 2x to 3x
        duration: '12 weeks',
        responsibleParty: 'Physical Therapist',
        status: InterventionStatus.ACTIVE
      },
      {
        id: 'intervention-2345-6789',
        description: 'Occupational Therapy focusing on energy conservation',
        frequency: '1x weekly',
        duration: '12 weeks', // Extended from 8 to 12 weeks
        responsibleParty: 'Occupational Therapist',
        status: InterventionStatus.ACTIVE
      },
      {
        // New intervention without id
        description: 'Cognitive rehabilitation therapy',
        frequency: '1x weekly',
        duration: '10 weeks',
        responsibleParty: 'Neuropsychologist',
        status: InterventionStatus.PENDING
      }
    ]
  };

  return {
    ...defaultUpdateDTO,
    ...overrides
  };
};

// Array of pre-defined mock care plans with different statuses
export const mockCarePlans: CarePlan[] = [
  generateMockCarePlan(), // Default active care plan
  generateMockCarePlan({
    id: 'care-plan-draft',
    status: PlanStatus.DRAFT,
    approvedById: null,
    approvedAt: null,
    approvalNotes: null
  }),
  generateMockCarePlan({
    id: 'care-plan-in-review',
    status: PlanStatus.IN_REVIEW,
    approvedById: null,
    approvedAt: null,
    approvalNotes: null
  }),
  generateMockCarePlan({
    id: 'care-plan-completed',
    status: PlanStatus.COMPLETED,
    goals: [
      generateMockCarePlanGoal({
        status: GoalStatus.ACHIEVED
      }),
      generateMockCarePlanGoal({
        id: 'goal-2345-6789',
        description: 'Reduce fatigue symptoms',
        status: GoalStatus.ACHIEVED,
        measures: [
          'Decreased score on Fatigue Severity Scale',
          'Able to complete daily activities without excessive rest periods'
        ]
      })
    ],
    interventions: [
      generateMockCarePlanIntervention({
        status: InterventionStatus.COMPLETED
      }),
      generateMockCarePlanIntervention({
        id: 'intervention-2345-6789',
        description: 'Occupational Therapy focusing on energy conservation',
        status: InterventionStatus.COMPLETED
      })
    ]
  }),
  generateMockCarePlan({
    id: 'care-plan-on-hold',
    status: PlanStatus.ON_HOLD,
    goals: [
      generateMockCarePlanGoal(),
      generateMockCarePlanGoal({
        id: 'goal-2345-6789',
        description: 'Reduce fatigue symptoms'
      })
    ]
  }),
  generateMockCarePlan({
    id: 'care-plan-second-client',
    clientId: mockUsers[1].id, // John Davis
    title: 'Spinal Cord Injury Rehabilitation Plan',
    description: 'Comprehensive rehabilitation plan for T6 complete spinal cord injury',
    goals: [
      generateMockCarePlanGoal({
        id: 'goal-sci-1',
        description: 'Maximize upper body strength and function',
        measures: [
          'Increase in upper body strength assessments',
          'Independent transfers from wheelchair to bed/toilet/car'
        ]
      }),
      generateMockCarePlanGoal({
        id: 'goal-sci-2',
        description: 'Prevent secondary complications',
        measures: [
          'No pressure injuries',
          'Maintaining healthy weight',
          'Prevention of urinary tract infections'
        ]
      })
    ],
    interventions: [
      generateMockCarePlanIntervention({
        id: 'intervention-sci-1',
        description: 'Physical Therapy for upper body strengthening',
        frequency: '3x weekly',
        duration: '16 weeks'
      }),
      generateMockCarePlanIntervention({
        id: 'intervention-sci-2',
        description: 'Wheelchair skills training',
        frequency: '2x weekly',
        duration: '8 weeks'
      }),
      generateMockCarePlanIntervention({
        id: 'intervention-sci-3',
        description: 'Skin inspection and pressure relief education',
        frequency: '1x weekly',
        duration: '4 weeks'
      })
    ]
  })
];

// Array of pre-defined mock care plan goals with different statuses
export const mockCarePlanGoals: CarePlanGoal[] = [
  generateMockCarePlanGoal(),
  generateMockCarePlanGoal({
    id: 'goal-pending',
    status: GoalStatus.PENDING,
    description: 'Develop effective coping strategies for fatigue',
    measures: ['Utilization of 3 new coping techniques', 'Self-reported improvement in daily energy management']
  }),
  generateMockCarePlanGoal({
    id: 'goal-achieved',
    status: GoalStatus.ACHIEVED,
    description: 'Establish medication routine',
    measures: ['90% adherence to medication schedule', 'Reduction in missed doses']
  }),
  generateMockCarePlanGoal({
    id: 'goal-discontinued',
    status: GoalStatus.DISCONTINUED,
    description: 'Return to previous employment',
    measures: ['Gradual return to work schedule', 'Accommodation plan implementation']
  })
];

// Array of pre-defined mock care plan interventions with different statuses
export const mockCarePlanInterventions: CarePlanIntervention[] = [
  generateMockCarePlanIntervention(),
  generateMockCarePlanIntervention({
    id: 'intervention-pending',
    status: InterventionStatus.PENDING,
    description: 'Cognitive behavioral therapy',
    frequency: '1x weekly',
    duration: '10 weeks',
    responsibleParty: 'Licensed Therapist'
  }),
  generateMockCarePlanIntervention({
    id: 'intervention-completed',
    status: InterventionStatus.COMPLETED,
    description: 'Home safety assessment',
    frequency: 'One-time',
    duration: 'N/A',
    responsibleParty: 'Occupational Therapist'
  }),
  generateMockCarePlanIntervention({
    id: 'intervention-discontinued',
    status: InterventionStatus.DISCONTINUED,
    description: 'Aquatic therapy',
    frequency: '2x weekly',
    duration: '12 weeks',
    responsibleParty: 'Physical Therapist'
  })
];

// Array of pre-defined mock AI-generated care plan options
export const mockCarePlanOptions: CarePlanOption[] = [
  generateMockCarePlanOption(),
  generateMockCarePlanOption({
    title: 'Focused Physical Rehabilitation',
    description: 'A targeted approach prioritizing physical mobility and strength for MS patients',
    confidenceScore: 87,
    goals: [
      {
        description: 'Primary focus on physical mobility improvement',
        measures: [
          'Walking distance improvement',
          'Balance assessment scores'
        ]
      },
      {
        description: 'Strengthen core and lower extremities',
        measures: [
          'Increased muscle strength measurements',
          'Improved posture assessment'
        ]
      },
      {
        description: 'Improve balance and coordination',
        measures: [
          'Reduced fall risk score',
          'Improved coordination assessment results'
        ]
      }
    ],
    interventions: [
      {
        description: 'Intensive Physical Therapy',
        frequency: '3x weekly',
        duration: '10 weeks',
        responsibleParty: 'Physical Therapist'
      },
      {
        description: 'Home Exercise Program',
        frequency: 'Daily',
        duration: 'Ongoing',
        responsibleParty: 'Client with initial PT guidance'
      },
      {
        description: 'Assistive Device Assessment',
        frequency: 'One-time',
        duration: 'N/A',
        responsibleParty: 'Physical Therapist'
      },
      {
        description: 'Medication Management',
        frequency: 'Monthly',
        duration: 'Ongoing',
        responsibleParty: 'Neurologist'
      }
    ],
    expectedOutcomes: [
      '40% improvement in mobility assessment scores',
      'Reduced fall risk',
      'Increased independence in daily activities'
    ]
  }),
  generateMockCarePlanOption({
    title: 'Holistic Wellness Approach',
    description: 'A balanced approach addressing both physical and emotional well-being for MS management',
    confidenceScore: 82,
    goals: [
      {
        description: 'Balance physical and emotional wellbeing',
        measures: [
          'Improved quality of life scores',
          'Balanced activity and rest patterns'
        ]
      },
      {
        description: 'Develop coping strategies for chronic condition',
        measures: [
          'Reduced anxiety and depression scores',
          'Improved coping skills assessment'
        ]
      },
      {
        description: 'Improve energy management',
        measures: [
          'Effective use of energy conservation techniques',
          'Balanced activity schedule'
        ]
      }
    ],
    interventions: [
      {
        description: 'Physical Therapy',
        frequency: '1x weekly',
        duration: '8 weeks',
        responsibleParty: 'Physical Therapist'
      },
      {
        description: 'Psychological Counseling',
        frequency: 'Bi-weekly',
        duration: '12 weeks',
        responsibleParty: 'Licensed Therapist'
      },
      {
        description: 'Mindfulness Training',
        frequency: '1x weekly',
        duration: '8 weeks',
        responsibleParty: 'Mental Health Counselor'
      },
      {
        description: 'Nutritional Counseling',
        frequency: 'Monthly',
        duration: '3 months',
        responsibleParty: 'Registered Dietitian'
      }
    ],
    expectedOutcomes: [
      'Improved quality of life scores',
      'Reduced anxiety and depression measures',
      'Better energy conservation techniques'
    ]
  })
];

// Array of pre-defined mock DTOs for creating care plans
export const mockCreateCarePlanDTOs: CreateCarePlanDTO[] = [
  generateMockCreateCarePlanDTO(),
  generateMockCreateCarePlanDTO({
    clientId: mockUsers[1].id, // John Davis
    title: 'Spinal Cord Injury Rehabilitation Plan',
    description: 'Comprehensive rehabilitation plan for T6 complete spinal cord injury',
    goals: [
      {
        description: 'Maximize upper body strength and function',
        status: GoalStatus.PENDING,
        measures: [
          'Increase in upper body strength assessments',
          'Independent transfers from wheelchair to bed/toilet/car'
        ]
      },
      {
        description: 'Prevent secondary complications',
        status: GoalStatus.PENDING,
        measures: [
          'No pressure injuries',
          'Maintaining healthy weight',
          'Prevention of urinary tract infections'
        ]
      }
    ],
    interventions: [
      {
        description: 'Physical Therapy for upper body strengthening',
        frequency: '3x weekly',
        duration: '16 weeks',
        responsibleParty: 'Physical Therapist',
        status: InterventionStatus.PENDING
      },
      {
        description: 'Wheelchair skills training',
        frequency: '2x weekly',
        duration: '8 weeks',
        responsibleParty: 'Occupational Therapist',
        status: InterventionStatus.PENDING
      },
      {
        description: 'Skin inspection and pressure relief education',
        frequency: '1x weekly',
        duration: '4 weeks',
        responsibleParty: 'Nurse',
        status: InterventionStatus.PENDING
      }
    ]
  })
];

// Array of pre-defined mock DTOs for updating care plans
export const mockUpdateCarePlanDTOs: UpdateCarePlanDTO[] = [
  generateMockUpdateCarePlanDTO(),
  generateMockUpdateCarePlanDTO({
    title: 'Enhanced Spinal Cord Injury Plan',
    description: 'Updated plan with additional pain management and community integration components',
    status: PlanStatus.REVISED,
    goals: [
      {
        id: 'goal-sci-1',
        description: 'Maximize upper body strength and function',
        status: GoalStatus.IN_PROGRESS,
        measures: [
          'Increase in upper body strength assessments',
          'Independent transfers from wheelchair to bed/toilet/car',
          'Wheelchair propulsion for 1 mile without fatigue' // Added measure
        ]
      },
      {
        // New goal
        description: 'Improve pain management',
        status: GoalStatus.PENDING,
        measures: [
          'Reduced pain scores',
          'Decreased use of pain medication',
          'Implementation of non-pharmacological pain management techniques'
        ]
      },
      {
        // New goal
        description: 'Increase community participation',
        status: GoalStatus.PENDING,
        measures: [
          'Weekly participation in community activities',
          'Use of public transportation independently',
          'Return to valued leisure activities'
        ]
      }
    ],
    interventions: [
      {
        id: 'intervention-sci-1',
        description: 'Physical Therapy for upper body strengthening',
        frequency: '3x weekly',
        duration: '16 weeks',
        responsibleParty: 'Physical Therapist',
        status: InterventionStatus.ACTIVE
      },
      {
        // New intervention
        description: 'Pain management techniques education',
        frequency: '1x weekly',
        duration: '6 weeks',
        responsibleParty: 'Pain Specialist',
        status: InterventionStatus.PENDING
      },
      {
        // New intervention
        description: 'Community reintegration program',
        frequency: '1x weekly',
        duration: '12 weeks',
        responsibleParty: 'Recreational Therapist',
        status: InterventionStatus.PENDING
      }
    ]
  })
];