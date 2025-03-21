import { Roles } from '../../src/constants/roles';
import { 
  User, 
  UserWithoutPassword, 
  UserWithProfile, 
  ClientProfile, 
  ProviderProfile, 
  CaseManagerProfile, 
  AdminProfile,
  Address,
  EmergencyContact,
  Insurance,
  MedicalInformation
} from '../../src/types/user.types';

/**
 * Generates a mock user for testing
 * 
 * @param overrides - Properties to override in the default mock user
 * @returns A complete mock user
 */
export const generateMockUser = (overrides: Partial<User> = {}): User => {
  const defaultUser: User = {
    id: '1234-5678-9012-3456',
    email: 'test@example.com',
    passwordHash: '$2a$10$FEBywZh8u9M0Cec/0mWep.1kXrwKeiWDba6tdKvDfEBjyePJnDT7K', // 'password123'
    role: Roles.CLIENT,
    firstName: 'Test',
    lastName: 'User',
    isVerified: true,
    createdAt: new Date('2023-01-01T00:00:00.000Z'),
    updatedAt: new Date('2023-01-01T00:00:00.000Z'),
  };

  return {
    ...defaultUser,
    ...overrides,
  };
};

/**
 * Generates a mock user without password for testing
 * 
 * @param overrides - Properties to override in the default mock user
 * @returns A complete mock user without password
 */
export const generateMockUserWithoutPassword = (overrides: Partial<UserWithoutPassword> = {}): UserWithoutPassword => {
  const { passwordHash, ...defaultUser } = generateMockUser();

  return {
    ...defaultUser,
    ...overrides,
  };
};

/**
 * Generates a mock address for testing
 * 
 * @param overrides - Properties to override in the default mock address
 * @returns A complete mock address
 */
export const generateMockAddress = (overrides: Partial<Address> = {}): Address => {
  const defaultAddress: Address = {
    street: '123 Main Street',
    city: 'Springfield',
    state: 'IL',
    zipCode: '62704',
    country: 'USA',
  };

  return {
    ...defaultAddress,
    ...overrides,
  };
};

/**
 * Generates a mock emergency contact for testing
 * 
 * @param overrides - Properties to override in the default mock emergency contact
 * @returns A complete mock emergency contact
 */
export const generateMockEmergencyContact = (overrides: Partial<EmergencyContact> = {}): EmergencyContact => {
  const defaultEmergencyContact: EmergencyContact = {
    name: 'Jane Doe',
    relationship: 'Spouse',
    phone: '(555) 123-4567',
    email: 'jane.doe@example.com',
  };

  return {
    ...defaultEmergencyContact,
    ...overrides,
  };
};

/**
 * Generates a mock insurance information for testing
 * 
 * @param overrides - Properties to override in the default mock insurance
 * @returns A complete mock insurance
 */
export const generateMockInsurance = (overrides: Partial<Insurance> = {}): Insurance => {
  const defaultInsurance: Insurance = {
    provider: 'Healthcare Provider Inc.',
    policyNumber: 'POL123456789',
    groupNumber: 'GRP987654321',
    coverageDetails: {
      type: 'Full Coverage',
      deductible: 1000,
      copay: 20,
    },
  };

  return {
    ...defaultInsurance,
    ...overrides,
  };
};

/**
 * Generates a mock medical information for testing
 * 
 * @param overrides - Properties to override in the default mock medical information
 * @returns A complete mock medical information
 */
export const generateMockMedicalInformation = (overrides: Partial<MedicalInformation> = {}): MedicalInformation => {
  const defaultMedicalInformation: MedicalInformation = {
    conditions: ['Multiple Sclerosis', 'Chronic Fatigue'],
    allergies: ['Penicillin', 'Sulfa drugs'],
    medications: ['Tecfidera 240mg', 'Baclofen 10mg', 'Vitamin D 2000IU'],
    notes: 'Patient has been stable for the past 6 months',
  };

  return {
    ...defaultMedicalInformation,
    ...overrides,
  };
};

/**
 * Generates a mock client profile for testing
 * 
 * @param overrides - Properties to override in the default mock client profile
 * @returns A complete mock client profile
 */
export const generateMockClientProfile = (overrides: Partial<ClientProfile> = {}): ClientProfile => {
  const defaultClientProfile: ClientProfile = {
    id: 'cp-1234-5678',
    userId: '1234-5678-9012-3456',
    dateOfBirth: new Date('1988-05-12T00:00:00.000Z'),
    gender: 'Female',
    address: generateMockAddress(),
    phone: '(555) 123-4567',
    emergencyContact: generateMockEmergencyContact(),
    medicalInformation: generateMockMedicalInformation(),
    insurance: generateMockInsurance(),
    preferences: {
      communicationPreference: 'email',
      appointmentReminders: true,
    },
    createdAt: new Date('2023-01-01T00:00:00.000Z'),
    updatedAt: new Date('2023-01-01T00:00:00.000Z'),
  };

  return {
    ...defaultClientProfile,
    ...overrides,
  };
};

/**
 * Generates a mock provider profile for testing
 * 
 * @param overrides - Properties to override in the default mock provider profile
 * @returns A complete mock provider profile
 */
export const generateMockProviderProfile = (overrides: Partial<ProviderProfile> = {}): ProviderProfile => {
  const defaultProviderProfile: ProviderProfile = {
    id: 'pp-1234-5678',
    userId: '1234-5678-9012-3456',
    organizationName: 'Quality Care Services',
    licenseNumber: 'LIC123456',
    licenseExpiration: new Date('2025-12-31T00:00:00.000Z'),
    serviceTypes: ['Physical Therapy', 'Occupational Therapy'],
    bio: 'Experienced provider with over 10 years in rehabilitation services',
    specializations: ['Neurological Rehabilitation', 'Mobility Training'],
    insuranceAccepted: ['Medicare', 'Blue Cross', 'Aetna'],
    averageRating: 4.8,
    reviewCount: 42,
    createdAt: new Date('2023-01-01T00:00:00.000Z'),
    updatedAt: new Date('2023-01-01T00:00:00.000Z'),
  };

  return {
    ...defaultProviderProfile,
    ...overrides,
  };
};

/**
 * Generates a mock case manager profile for testing
 * 
 * @param overrides - Properties to override in the default mock case manager profile
 * @returns A complete mock case manager profile
 */
export const generateMockCaseManagerProfile = (overrides: Partial<CaseManagerProfile> = {}): CaseManagerProfile => {
  const defaultCaseManagerProfile: CaseManagerProfile = {
    id: 'cm-1234-5678',
    userId: '1234-5678-9012-3456',
    certification: 'Certified Case Manager (CCM)',
    specialty: 'Disability Management',
    bio: 'Dedicated case manager with experience in holistic care planning',
    assignedClients: ['client-id-1', 'client-id-2', 'client-id-3'],
    createdAt: new Date('2023-01-01T00:00:00.000Z'),
    updatedAt: new Date('2023-01-01T00:00:00.000Z'),
  };

  return {
    ...defaultCaseManagerProfile,
    ...overrides,
  };
};

/**
 * Generates a mock admin profile for testing
 * 
 * @param overrides - Properties to override in the default mock admin profile
 * @returns A complete mock admin profile
 */
export const generateMockAdminProfile = (overrides: Partial<AdminProfile> = {}): AdminProfile => {
  const defaultAdminProfile: AdminProfile = {
    id: 'ap-1234-5678',
    userId: '1234-5678-9012-3456',
    department: 'System Administration',
    permissions: [
      'manage:users', 
      'view:all-records', 
      'configure:system',
      'manage:permissions'
    ],
    createdAt: new Date('2023-01-01T00:00:00.000Z'),
    updatedAt: new Date('2023-01-01T00:00:00.000Z'),
  };

  return {
    ...defaultAdminProfile,
    ...overrides,
  };
};

/**
 * Generates a mock user with profile for testing
 * 
 * @param overrides - Properties to override in the default mock user with profile
 * @returns A complete mock user with appropriate profile based on role
 */
export const generateMockUserWithProfile = (overrides: Partial<UserWithProfile> = {}): UserWithProfile => {
  const defaultUser = generateMockUserWithoutPassword(overrides.user || {});
  
  let clientProfile = null;
  let providerProfile = null;
  let caseManagerProfile = null;
  let adminProfile = null;
  
  // Create the appropriate profile based on role
  switch(defaultUser.role) {
    case Roles.CLIENT:
      clientProfile = generateMockClientProfile({
        userId: defaultUser.id,
        ...(overrides.clientProfile || {}),
      });
      break;
    case Roles.PROVIDER:
      providerProfile = generateMockProviderProfile({
        userId: defaultUser.id,
        ...(overrides.providerProfile || {}),
      });
      break;
    case Roles.CASE_MANAGER:
      caseManagerProfile = generateMockCaseManagerProfile({
        userId: defaultUser.id,
        ...(overrides.caseManagerProfile || {}),
      });
      break;
    case Roles.ADMINISTRATOR:
      adminProfile = generateMockAdminProfile({
        userId: defaultUser.id,
        ...(overrides.adminProfile || {}),
      });
      break;
  }
  
  const defaultUserWithProfile: UserWithProfile = {
    user: defaultUser,
    clientProfile,
    providerProfile,
    caseManagerProfile,
    adminProfile,
  };
  
  return {
    ...defaultUserWithProfile,
    ...overrides,
  };
};

// Create pre-defined mock users for different roles
export const mockUsers = [
  generateMockUser({ id: 'user-client-1', email: 'client1@example.com', role: Roles.CLIENT, firstName: 'Sarah', lastName: 'Johnson' }),
  generateMockUser({ id: 'user-client-2', email: 'client2@example.com', role: Roles.CLIENT, firstName: 'John', lastName: 'Davis' }),
  generateMockUser({ id: 'user-provider-1', email: 'provider1@example.com', role: Roles.PROVIDER, firstName: 'Emily', lastName: 'Lee' }),
  generateMockUser({ id: 'user-provider-2', email: 'provider2@example.com', role: Roles.PROVIDER, firstName: 'James', lastName: 'Wilson' }),
  generateMockUser({ id: 'user-case-manager-1', email: 'casemanager1@example.com', role: Roles.CASE_MANAGER, firstName: 'Michael', lastName: 'Brown' }),
  generateMockUser({ id: 'user-case-manager-2', email: 'casemanager2@example.com', role: Roles.CASE_MANAGER, firstName: 'Jessica', lastName: 'Taylor' }),
  generateMockUser({ id: 'user-admin-1', email: 'admin1@example.com', role: Roles.ADMINISTRATOR, firstName: 'David', lastName: 'Miller' }),
  generateMockUser({ id: 'user-admin-2', email: 'admin2@example.com', role: Roles.ADMINISTRATOR, firstName: 'Jennifer', lastName: 'Anderson' }),
];

// Create pre-defined mock client profiles
export const mockClientProfiles = [
  generateMockClientProfile({
    id: 'client-profile-1',
    userId: 'user-client-1',
    dateOfBirth: new Date('1988-05-12T00:00:00.000Z'),
    gender: 'Female',
    phone: '(555) 123-4567',
    medicalInformation: {
      conditions: ['Multiple Sclerosis', 'Chronic Fatigue'],
      allergies: ['Penicillin'],
      medications: ['Tecfidera 240mg', 'Baclofen 10mg'],
      notes: 'Patient diagnosed in 2018',
    },
  }),
  generateMockClientProfile({
    id: 'client-profile-2',
    userId: 'user-client-2',
    dateOfBirth: new Date('1992-08-24T00:00:00.000Z'),
    gender: 'Male',
    phone: '(555) 987-6543',
    medicalInformation: {
      conditions: ['Spinal Cord Injury', 'Hypertension'],
      allergies: ['Sulfa drugs', 'Peanuts'],
      medications: ['Lisinopril 10mg', 'Baclofen 20mg'],
      notes: 'Injury occurred in 2020, T6 complete',
    },
  }),
];

// Create pre-defined mock provider profiles
export const mockProviderProfiles = [
  generateMockProviderProfile({
    id: 'provider-profile-1',
    userId: 'user-provider-1',
    organizationName: 'Rehabilitation Specialists',
    serviceTypes: ['Physical Therapy', 'Occupational Therapy'],
    specializations: ['Neurological Rehabilitation', 'Mobility Training'],
    averageRating: 5.0,
    reviewCount: 42,
  }),
  generateMockProviderProfile({
    id: 'provider-profile-2',
    userId: 'user-provider-2',
    organizationName: 'Active Recovery Services',
    serviceTypes: ['Physical Therapy', 'Sports Rehabilitation'],
    specializations: ['Sports Recovery', 'Strength Training'],
    averageRating: 4.2,
    reviewCount: 28,
  }),
];

// Create pre-defined mock case manager profiles
export const mockCaseManagerProfiles = [
  generateMockCaseManagerProfile({
    id: 'case-manager-profile-1',
    userId: 'user-case-manager-1',
    certification: 'Certified Case Manager (CCM)',
    specialty: 'Neurological Conditions',
    assignedClients: ['user-client-1', 'user-client-2'],
  }),
  generateMockCaseManagerProfile({
    id: 'case-manager-profile-2',
    userId: 'user-case-manager-2',
    certification: 'Licensed Clinical Social Worker (LCSW)',
    specialty: 'Trauma Recovery',
    assignedClients: [],
  }),
];

// Create pre-defined mock admin profiles
export const mockAdminProfiles = [
  generateMockAdminProfile({
    id: 'admin-profile-1',
    userId: 'user-admin-1',
    department: 'System Administration',
    permissions: ['manage:users', 'view:all-records', 'configure:system'],
  }),
  generateMockAdminProfile({
    id: 'admin-profile-2',
    userId: 'user-admin-2',
    department: 'User Support',
    permissions: ['manage:users', 'view:client-records', 'manage:case-managers'],
  }),
];

// Create pre-defined mock users with profiles
export const mockClientsWithProfiles = [
  generateMockUserWithProfile({
    user: {
      id: 'user-client-1',
      email: 'client1@example.com',
      role: Roles.CLIENT,
      firstName: 'Sarah',
      lastName: 'Johnson',
      isVerified: true,
      createdAt: new Date('2023-01-01T00:00:00.000Z'),
      updatedAt: new Date('2023-01-01T00:00:00.000Z'),
    },
    clientProfile: mockClientProfiles[0],
  }),
  generateMockUserWithProfile({
    user: {
      id: 'user-client-2',
      email: 'client2@example.com',
      role: Roles.CLIENT,
      firstName: 'John',
      lastName: 'Davis',
      isVerified: true,
      createdAt: new Date('2023-01-15T00:00:00.000Z'),
      updatedAt: new Date('2023-01-15T00:00:00.000Z'),
    },
    clientProfile: mockClientProfiles[1],
  }),
];

export const mockProvidersWithProfiles = [
  generateMockUserWithProfile({
    user: {
      id: 'user-provider-1',
      email: 'provider1@example.com',
      role: Roles.PROVIDER,
      firstName: 'Emily',
      lastName: 'Lee',
      isVerified: true,
      createdAt: new Date('2022-12-01T00:00:00.000Z'),
      updatedAt: new Date('2022-12-01T00:00:00.000Z'),
    },
    providerProfile: mockProviderProfiles[0],
  }),
  generateMockUserWithProfile({
    user: {
      id: 'user-provider-2',
      email: 'provider2@example.com',
      role: Roles.PROVIDER,
      firstName: 'James',
      lastName: 'Wilson',
      isVerified: true,
      createdAt: new Date('2022-11-15T00:00:00.000Z'),
      updatedAt: new Date('2022-11-15T00:00:00.000Z'),
    },
    providerProfile: mockProviderProfiles[1],
  }),
];

export const mockCaseManagersWithProfiles = [
  generateMockUserWithProfile({
    user: {
      id: 'user-case-manager-1',
      email: 'casemanager1@example.com',
      role: Roles.CASE_MANAGER,
      firstName: 'Michael',
      lastName: 'Brown',
      isVerified: true,
      createdAt: new Date('2022-10-01T00:00:00.000Z'),
      updatedAt: new Date('2022-10-01T00:00:00.000Z'),
    },
    caseManagerProfile: mockCaseManagerProfiles[0],
  }),
  generateMockUserWithProfile({
    user: {
      id: 'user-case-manager-2',
      email: 'casemanager2@example.com',
      role: Roles.CASE_MANAGER,
      firstName: 'Jessica',
      lastName: 'Taylor',
      isVerified: true,
      createdAt: new Date('2022-09-15T00:00:00.000Z'),
      updatedAt: new Date('2022-09-15T00:00:00.000Z'),
    },
    caseManagerProfile: mockCaseManagerProfiles[1],
  }),
];

export const mockAdminsWithProfiles = [
  generateMockUserWithProfile({
    user: {
      id: 'user-admin-1',
      email: 'admin1@example.com',
      role: Roles.ADMINISTRATOR,
      firstName: 'David',
      lastName: 'Miller',
      isVerified: true,
      createdAt: new Date('2022-08-01T00:00:00.000Z'),
      updatedAt: new Date('2022-08-01T00:00:00.000Z'),
    },
    adminProfile: mockAdminProfiles[0],
  }),
  generateMockUserWithProfile({
    user: {
      id: 'user-admin-2',
      email: 'admin2@example.com',
      role: Roles.ADMINISTRATOR,
      firstName: 'Jennifer',
      lastName: 'Anderson',
      isVerified: true,
      createdAt: new Date('2022-07-15T00:00:00.000Z'),
      updatedAt: new Date('2022-07-15T00:00:00.000Z'),
    },
    adminProfile: mockAdminProfiles[1],
  }),
];