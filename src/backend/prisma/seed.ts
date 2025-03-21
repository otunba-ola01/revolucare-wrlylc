import { PrismaClient } from '@prisma/client';
import { Roles } from '../src/constants/roles';
import { ServiceType } from '../src/constants/service-types';
import { PlanStatus } from '../src/constants/plan-statuses';
import { hashPassword } from '../src/utils/security';

/**
 * Main function that orchestrates the seeding process
 */
async function main() {
  console.log('Starting database seeding...');
  
  // Create a new PrismaClient instance
  const prisma = new PrismaClient();
  
  try {
    // Connect to the database
    await prisma.$connect();
    
    // Clear existing data
    await clearDatabase(prisma);
    
    // Create sample data
    const users = await createUsers(prisma);
    const clientProfiles = await createClientProfiles(prisma, users);
    const providerProfiles = await createProviderProfiles(prisma, users);
    const caseManagerProfiles = await createCaseManagerProfiles(prisma, users);
    const adminProfiles = await createAdminProfiles(prisma, users);
    
    // Create care plans and related data
    const carePlans = await createCarePlans(prisma, clientProfiles, users);
    const servicePlans = await createServicesPlans(prisma, clientProfiles, carePlans, providerProfiles, users);
    
    // Create additional data
    await createProviderAvailability(prisma, providerProfiles);
    await createServiceAreas(prisma, providerProfiles);
    await createProviderReviews(prisma, providerProfiles, clientProfiles);
    const documents = await createDocuments(prisma, users);
    await createBookings(prisma, clientProfiles, providerProfiles, servicePlans.serviceItems);
    
    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error during database seeding:', error);
    throw error;
  } finally {
    // Disconnect from the database
    await prisma.$disconnect();
  }
}

/**
 * Clears all data from the database before seeding
 */
async function clearDatabase(prisma: PrismaClient): Promise<void> {
  console.log('Clearing existing data...');
  
  // Delete data in the correct order to respect foreign key constraints
  await prisma.booking.deleteMany();
  await prisma.providerReview.deleteMany();
  await prisma.serviceArea.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.serviceItem.deleteMany();
  await prisma.fundingSource.deleteMany();
  await prisma.servicesPlan.deleteMany();
  await prisma.carePlanIntervention.deleteMany();
  await prisma.carePlanGoal.deleteMany();
  await prisma.carePlan.deleteMany();
  await prisma.documentAnalysis.deleteMany();
  await prisma.document.deleteMany();
  await prisma.clientProfile.deleteMany();
  await prisma.providerProfile.deleteMany();
  await prisma.caseManagerProfile.deleteMany();
  await prisma.adminProfile.deleteMany();
  await prisma.user.deleteMany();
  
  console.log('Database cleared successfully');
}

/**
 * Creates sample users with different roles
 */
async function createUsers(prisma: PrismaClient): Promise<Record<string, any>> {
  console.log('Creating users...');
  
  // Define common password for all test users
  const testPassword = await hashPassword('Password123!');
  
  // Create administrator users
  const adminUsers = await Promise.all([
    prisma.user.create({
      data: {
        email: 'admin@revolucare.com',
        passwordHash: testPassword,
        role: Roles.ADMINISTRATOR,
        firstName: 'James',
        lastName: 'Williams',
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }),
    prisma.user.create({
      data: {
        email: 'admin2@revolucare.com',
        passwordHash: testPassword,
        role: Roles.ADMINISTRATOR,
        firstName: 'Alexandra',
        lastName: 'Johnson',
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })
  ]);
  
  // Create case manager users
  const caseManagerUsers = await Promise.all([
    prisma.user.create({
      data: {
        email: 'casemanager@revolucare.com',
        passwordHash: testPassword,
        role: Roles.CASE_MANAGER,
        firstName: 'Michael',
        lastName: 'Brown',
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }),
    prisma.user.create({
      data: {
        email: 'casemanager2@revolucare.com',
        passwordHash: testPassword,
        role: Roles.CASE_MANAGER,
        firstName: 'Sophia',
        lastName: 'Martinez',
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })
  ]);
  
  // Create provider users
  const providerUsers = await Promise.all([
    prisma.user.create({
      data: {
        email: 'provider@revolucare.com',
        passwordHash: testPassword,
        role: Roles.PROVIDER,
        firstName: 'Elena',
        lastName: 'Rodriguez',
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }),
    prisma.user.create({
      data: {
        email: 'provider2@revolucare.com',
        passwordHash: testPassword,
        role: Roles.PROVIDER,
        firstName: 'James',
        lastName: 'Wilson',
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }),
    prisma.user.create({
      data: {
        email: 'provider3@revolucare.com',
        passwordHash: testPassword,
        role: Roles.PROVIDER,
        firstName: 'Emily',
        lastName: 'Lee',
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })
  ]);
  
  // Create client users
  const clientUsers = await Promise.all([
    prisma.user.create({
      data: {
        email: 'client@revolucare.com',
        passwordHash: testPassword,
        role: Roles.CLIENT,
        firstName: 'Sarah',
        lastName: 'Johnson',
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }),
    prisma.user.create({
      data: {
        email: 'client2@revolucare.com',
        passwordHash: testPassword,
        role: Roles.CLIENT,
        firstName: 'John',
        lastName: 'Smith',
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }),
    prisma.user.create({
      data: {
        email: 'client3@revolucare.com',
        passwordHash: testPassword,
        role: Roles.CLIENT,
        firstName: 'Robert',
        lastName: 'Davis',
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })
  ]);
  
  console.log(`Created ${adminUsers.length} admin users, ${caseManagerUsers.length} case manager users, ${providerUsers.length} provider users, and ${clientUsers.length} client users`);
  
  return {
    admins: adminUsers,
    caseManagers: caseManagerUsers,
    providers: providerUsers,
    clients: clientUsers
  };
}

/**
 * Creates client profiles for client users
 */
async function createClientProfiles(prisma: PrismaClient, users: Record<string, any>): Promise<Record<string, any>> {
  console.log('Creating client profiles...');
  
  const clientProfiles = await Promise.all(users.clients.map(async (client: any, index: number) => {
    return prisma.clientProfile.create({
      data: {
        userId: client.id,
        dateOfBirth: new Date(1980 + index * 5, 1, 1), // Different birth years
        gender: index % 2 === 0 ? 'Female' : 'Male',
        address: {
          street: `${123 + index * 100} Main Street`,
          city: 'Springfield',
          state: 'IL',
          zipCode: '62704',
          country: 'USA'
        },
        phoneNumber: `(555) ${100 + index}-${1000 + index}`,
        emergencyContact: {
          name: `Emergency Contact ${index + 1}`,
          relationship: 'Family',
          phoneNumber: `(555) ${200 + index}-${2000 + index}`
        },
        medicalInformation: {
          // Different medical conditions for each client
          conditions: index === 0 ? 
            ['Multiple Sclerosis', 'Chronic Fatigue', 'Mild Depression'] : 
            index === 1 ? 
            ['Parkinson\'s Disease', 'Hypertension'] : 
            ['Spinal Cord Injury', 'Chronic Pain'],
          allergies: ['Penicillin', 'Sulfa drugs'],
          medications: index === 0 ? 
            ['Tecfidera 240mg (2x/day)', 'Baclofen 10mg (3x/day)', 'Vitamin D 2000IU (1x/day)'] : 
            index === 1 ? 
            ['Levodopa 100mg (3x/day)', 'Lisinopril 10mg (1x/day)'] : 
            ['Gabapentin 300mg (3x/day)', 'Ibuprofen 600mg (as needed)'],
          primaryPhysician: `Dr. Primary ${index + 1}`,
          insuranceProvider: index % 2 === 0 ? 'Medicare' : 'Blue Cross Blue Shield',
          insurancePolicyNumber: `POL-${100000 + index * 1000}`
        },
        preferences: {
          preferredContactMethod: index % 2 === 0 ? 'Email' : 'Phone',
          servicePreferences: {
            preferredTimes: index % 2 === 0 ? ['Morning', 'Afternoon'] : ['Afternoon', 'Evening'],
            preferredDays: ['Monday', 'Wednesday', 'Friday'],
            providerGenderPreference: index % 2 === 0 ? 'No Preference' : 'Same as client',
            accommodations: index === 0 ? 
              ['Wheelchair Access', 'Limited Stairs'] : 
              index === 1 ? 
              ['Visual Aids', 'Written Instructions'] : 
              ['Fragrance-Free Environment']
          },
          notificationPreferences: {
            email: true,
            sms: index % 2 === 0,
            push: false
          }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      include: {
        user: true
      }
    });
  }));
  
  console.log(`Created ${clientProfiles.length} client profiles`);
  
  return {
    clientProfiles: clientProfiles
  };
}

/**
 * Creates provider profiles for provider users
 */
async function createProviderProfiles(prisma: PrismaClient, users: Record<string, any>): Promise<Record<string, any>> {
  console.log('Creating provider profiles...');
  
  // Map of providers to service types they offer
  const providerServices = [
    [ServiceType.PHYSICAL_THERAPY, ServiceType.OCCUPATIONAL_THERAPY],
    [ServiceType.SPEECH_THERAPY, ServiceType.HOME_CARE],
    [ServiceType.PHYSICAL_THERAPY, ServiceType.COUNSELING]
  ];
  
  const providerProfiles = await Promise.all(users.providers.map(async (provider: any, index: number) => {
    return prisma.providerProfile.create({
      data: {
        userId: provider.id,
        organizationName: `${provider.lastName} Healthcare Services`,
        licenseNumber: `LIC-${100000 + index * 1000}`,
        licenseExpiration: new Date(new Date().getFullYear() + 2, 1, 1),
        serviceTypes: providerServices[index],
        bio: `Experienced healthcare professional with over ${5 + index * 3} years of experience in ${providerServices[index].join(' and ')}.`,
        specializations: index === 0 ? 
          ['Neurological Rehabilitation', 'Mobility Training'] : 
          index === 1 ? 
          ['Speech and Language Development', 'Home Care'] : 
          ['Sports Rehabilitation', 'Mental Health'],
        education: [{
          institution: `Medical University ${index + 1}`,
          degree: 'Masters in Health Sciences',
          fieldOfStudy: index === 0 ? 'Physical Therapy' : index === 1 ? 'Speech Therapy' : 'Occupational Therapy',
          from: new Date(2005 + index * 2, 0, 1),
          to: new Date(2007 + index * 2, 0, 1)
        }],
        certifications: [{
          name: `Professional Certification ${index + 1}`,
          issuingOrganization: `Certification Board ${index + 1}`,
          issueDate: new Date(2008 + index * 2, 0, 1),
          expirationDate: new Date(new Date().getFullYear() + 3, 0, 1)
        }],
        insuranceAccepted: ['Medicare', 'Blue Cross Blue Shield', 'Aetna', 'UnitedHealthcare'],
        averageRating: 4.5 + (index * 0.1 > 0.5 ? 0 : index * 0.1), // Ratings between 4.5 and 5.0
        reviewCount: 10 + index * 10, // Different number of reviews
        createdAt: new Date(),
        updatedAt: new Date()
      },
      include: {
        user: true
      }
    });
  }));
  
  console.log(`Created ${providerProfiles.length} provider profiles`);
  
  return {
    providerProfiles: providerProfiles
  };
}

/**
 * Creates case manager profiles for case manager users
 */
async function createCaseManagerProfiles(prisma: PrismaClient, users: Record<string, any>): Promise<Record<string, any>> {
  console.log('Creating case manager profiles...');
  
  const caseManagerProfiles = await Promise.all(users.caseManagers.map(async (caseManager: any, index: number) => {
    return prisma.caseManagerProfile.create({
      data: {
        userId: caseManager.id,
        certification: `Certified Case Manager (CCM) #${100000 + index * 1000}`,
        specialty: index === 0 ? 'Medical Case Management' : 'Disability Case Management',
        bio: `Experienced case manager with over ${5 + index * 3} years of experience in healthcare coordination and client advocacy.`,
        maxCaseLoad: 25,
        currentCaseLoad: 15 + index * 5,
        officeLocation: {
          street: `${500 + index * 100} Office Boulevard`,
          city: 'Springfield',
          state: 'IL',
          zipCode: '62704',
          country: 'USA'
        },
        officeHours: {
          monday: { start: '08:00', end: '17:00' },
          tuesday: { start: '08:00', end: '17:00' },
          wednesday: { start: '08:00', end: '17:00' },
          thursday: { start: '08:00', end: '17:00' },
          friday: { start: '08:00', end: '16:00' },
          saturday: null,
          sunday: null
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  }));
  
  console.log(`Created ${caseManagerProfiles.length} case manager profiles`);
  
  return {
    caseManagerProfiles: caseManagerProfiles
  };
}

/**
 * Creates admin profiles for administrator users
 */
async function createAdminProfiles(prisma: PrismaClient, users: Record<string, any>): Promise<Record<string, any>> {
  console.log('Creating admin profiles...');
  
  const adminProfiles = await Promise.all(users.admins.map(async (admin: any, index: number) => {
    return prisma.adminProfile.create({
      data: {
        userId: admin.id,
        department: index === 0 ? 'System Administration' : 'User Management',
        permissions: index === 0 ? 
          ['manage:users', 'manage:system', 'manage:providers', 'view:analytics'] : 
          ['manage:users', 'manage:content', 'view:reports'],
        securityLevel: index === 0 ? 'super-admin' : 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  }));
  
  console.log(`Created ${adminProfiles.length} admin profiles`);
  
  return {
    adminProfiles: adminProfiles
  };
}

/**
 * Creates sample care plans for clients
 */
async function createCarePlans(
  prisma: PrismaClient, 
  clientProfiles: Record<string, any>, 
  users: Record<string, any>
): Promise<Record<string, any>> {
  console.log('Creating care plans...');
  
  const carePlans: any[] = [];
  
  for (let i = 0; i < clientProfiles.clientProfiles.length; i++) {
    const client = clientProfiles.clientProfiles[i];
    const caseManager = users.caseManagers[i % users.caseManagers.length];
    
    // Create care plan
    const carePlan = await prisma.carePlan.create({
      data: {
        clientId: client.userId,
        createdById: caseManager.id,
        title: `Care Plan for ${client.user.firstName} ${client.user.lastName}`,
        description: `Comprehensive care plan addressing the needs of ${client.user.firstName} based on their medical conditions and personal preferences.`,
        status: i === 0 ? PlanStatus.ACTIVE : i === 1 ? PlanStatus.APPROVED : PlanStatus.DRAFT,
        confidenceScore: 85 + i * 5, // Different confidence scores
        version: 1,
        approvedBy: i === 0 || i === 1 ? caseManager.id : null,
        approvedAt: i === 0 || i === 1 ? new Date() : null,
        createdAt: new Date(new Date().setDate(new Date().getDate() - (10 - i * 2))),
        updatedAt: new Date()
      }
    });
    
    carePlans.push(carePlan);
    
    // Create care plan goals
    const goals = [
      {
        description: "Improve mobility and balance",
        targetDate: new Date(new Date().setMonth(new Date().getMonth() + 3)),
        status: i === 0 ? 'in_progress' : 'pending',
        measures: ['30% improvement in mobility assessment scores', 'Reduced fall risk']
      },
      {
        description: "Reduce fatigue symptoms",
        targetDate: new Date(new Date().setMonth(new Date().getMonth() + 2)),
        status: i === 0 ? 'in_progress' : 'pending',
        measures: ['Increased energy levels', 'Improved daily activity participation']
      },
      {
        description: "Enhance overall quality of life",
        targetDate: new Date(new Date().setMonth(new Date().getMonth() + 6)),
        status: 'pending',
        measures: ['Higher quality of life scores', 'Increased social participation']
      }
    ];
    
    for (const goal of goals) {
      await prisma.carePlanGoal.create({
        data: {
          carePlanId: carePlan.id,
          description: goal.description,
          targetDate: goal.targetDate,
          status: goal.status,
          measures: goal.measures,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }
    
    // Create care plan interventions
    const interventions = [
      {
        description: "Physical Therapy",
        frequency: "2x weekly for 12 weeks",
        duration: "60 minutes per session",
        responsibleParty: "Physical Therapist",
        status: i === 0 ? 'active' : 'pending'
      },
      {
        description: "Occupational Therapy",
        frequency: "1x weekly for 8 weeks",
        duration: "45 minutes per session",
        responsibleParty: "Occupational Therapist",
        status: i === 0 ? 'active' : 'pending'
      },
      {
        description: "Medication Management",
        frequency: "Monthly review",
        duration: "Ongoing",
        responsibleParty: "Primary Care Physician",
        status: i === 0 ? 'active' : 'pending'
      },
      {
        description: "Support Group Participation",
        frequency: "Weekly",
        duration: "90 minutes per session",
        responsibleParty: "Client with Case Manager support",
        status: 'pending'
      }
    ];
    
    for (const intervention of interventions) {
      await prisma.carePlanIntervention.create({
        data: {
          carePlanId: carePlan.id,
          description: intervention.description,
          frequency: intervention.frequency,
          duration: intervention.duration,
          responsibleParty: intervention.responsibleParty,
          status: intervention.status,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }
  }
  
  console.log(`Created ${carePlans.length} care plans with goals and interventions`);
  
  return {
    carePlans: carePlans
  };
}

/**
 * Creates sample service plans linked to care plans
 */
async function createServicesPlans(
  prisma: PrismaClient, 
  clientProfiles: Record<string, any>, 
  carePlans: Record<string, any>, 
  providerProfiles: Record<string, any>, 
  users: Record<string, any>
): Promise<Record<string, any>> {
  console.log('Creating service plans...');
  
  const servicePlans: any[] = [];
  const serviceItems: any[] = [];
  
  for (let i = 0; i < carePlans.carePlans.length; i++) {
    const carePlan = carePlans.carePlans[i];
    const client = clientProfiles.clientProfiles[i];
    const caseManager = users.caseManagers[i % users.caseManagers.length];
    
    // Create service plan
    const servicePlan = await prisma.servicesPlan.create({
      data: {
        clientId: client.userId,
        createdById: caseManager.id,
        carePlanId: carePlan.id,
        title: `Service Plan for ${client.user.firstName} ${client.user.lastName}`,
        description: `Implementation services for ${client.user.firstName}'s care plan.`,
        status: i === 0 ? PlanStatus.ACTIVE : i === 1 ? PlanStatus.APPROVED : PlanStatus.DRAFT,
        estimatedCost: 1500 + i * 500, // Different costs
        approvedBy: i === 0 || i === 1 ? caseManager.id : null,
        approvedAt: i === 0 || i === 1 ? new Date() : null,
        createdAt: new Date(new Date().setDate(new Date().getDate() - (7 - i * 2))),
        updatedAt: new Date()
      }
    });
    
    servicePlans.push(servicePlan);
    
    // Create service items
    const serviceTypeOptions = [
      ServiceType.PHYSICAL_THERAPY,
      ServiceType.OCCUPATIONAL_THERAPY, 
      ServiceType.SPEECH_THERAPY,
      ServiceType.COUNSELING,
      ServiceType.HOME_CARE
    ];
    
    // Add 2-3 service items per plan
    const numServices = 2 + (i % 2);
    for (let j = 0; j < numServices; j++) {
      const serviceType = serviceTypeOptions[j % serviceTypeOptions.length];
      const provider = providerProfiles.providerProfiles.find(
        (p: any) => p.serviceTypes.includes(serviceType)
      );
      
      const serviceItem = await prisma.serviceItem.create({
        data: {
          servicesPlanId: servicePlan.id,
          serviceType: serviceType,
          providerId: provider?.userId,
          description: `${serviceType.replace('_', ' ')} services`,
          frequency: j === 0 ? "2x weekly for 12 weeks" : j === 1 ? "1x weekly for 8 weeks" : "Monthly",
          duration: j === 0 ? "60 minutes" : j === 1 ? "45 minutes" : "30 minutes",
          estimatedCost: j === 0 ? 960 : j === 1 ? 640 : 400,
          status: i === 0 ? 'scheduled' : 'pending',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      serviceItems.push(serviceItem);
    }
    
    // Create funding sources
    const fundingSources = [
      {
        name: "Primary Insurance",
        type: "insurance",
        coveragePercentage: 80,
        coverageAmount: 0.8 * (1500 + i * 500),
        verificationStatus: "verified"
      },
      {
        name: "Client Payment",
        type: "private_pay",
        coveragePercentage: 20,
        coverageAmount: 0.2 * (1500 + i * 500),
        verificationStatus: "verified"
      }
    ];
    
    for (const funding of fundingSources) {
      await prisma.fundingSource.create({
        data: {
          servicesPlanId: servicePlan.id,
          name: funding.name,
          type: funding.type,
          coveragePercentage: funding.coveragePercentage,
          coverageAmount: funding.coverageAmount,
          verificationStatus: funding.verificationStatus,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }
  }
  
  console.log(`Created ${servicePlans.length} service plans with items and funding sources`);
  
  return {
    servicePlans: servicePlans,
    serviceItems: serviceItems
  };
}

/**
 * Creates sample availability slots for providers
 */
async function createProviderAvailability(prisma: PrismaClient, providerProfiles: Record<string, any>): Promise<void> {
  console.log('Creating provider availability...');
  
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);
  
  for (const provider of providerProfiles.providerProfiles) {
    // Create availability slots for the next two weeks
    for (let day = 0; day < 14; day++) {
      const date = new Date(today);
      date.setDate(today.getDate() + day);
      
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) {
        continue;
      }
      
      // Create 3-5 slots per day
      const numSlots = 3 + (day % 3);
      for (let slot = 0; slot < numSlots; slot++) {
        const startHour = 9 + slot;
        const startTime = new Date(date);
        startTime.setHours(startHour, 0, 0, 0);
        
        const endTime = new Date(startTime);
        endTime.setHours(startHour + 1, 0, 0, 0);
        
        await prisma.availability.create({
          data: {
            providerId: provider.userId,
            startTime: startTime,
            endTime: endTime,
            status: Math.random() > 0.2 ? 'available' : 'booked', // 80% available, 20% booked
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
      }
    }
  }
  
  console.log('Provider availability created');
}

/**
 * Creates sample service areas for providers
 */
async function createServiceAreas(prisma: PrismaClient, providerProfiles: Record<string, any>): Promise<void> {
  console.log('Creating service areas...');
  
  for (let i = 0; i < providerProfiles.providerProfiles.length; i++) {
    const provider = providerProfiles.providerProfiles[i];
    
    // Create primary service area
    await prisma.serviceArea.create({
      data: {
        providerId: provider.userId,
        name: 'Primary Service Area',
        location: {
          latitude: 39.7817 + (i * 0.01), // Springfield, IL area with slight variations
          longitude: -89.6501 - (i * 0.01)
        },
        radius: 25, // 25 miles
        address: {
          street: `${500 + i * 100} Main Street`,
          city: 'Springfield',
          state: 'IL',
          zipCode: '62704',
          country: 'USA'
        },
        isPrimary: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    // Create secondary service area if not the last provider
    if (i < providerProfiles.providerProfiles.length - 1) {
      await prisma.serviceArea.create({
        data: {
          providerId: provider.userId,
          name: 'Secondary Service Area',
          location: {
            latitude: 39.8817 + (i * 0.01), // Slightly north with variations
            longitude: -89.5501 - (i * 0.01)
          },
          radius: 15, // 15 miles
          address: {
            street: `${300 + i * 100} North Avenue`,
            city: 'Sherman',
            state: 'IL',
            zipCode: '62684',
            country: 'USA'
          },
          isPrimary: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }
  }
  
  console.log('Service areas created');
}

/**
 * Creates sample reviews for providers
 */
async function createProviderReviews(
  prisma: PrismaClient, 
  providerProfiles: Record<string, any>, 
  clientProfiles: Record<string, any>
): Promise<void> {
  console.log('Creating provider reviews...');
  
  const reviewComments = [
    "Excellent provider, very knowledgeable and caring. Highly recommend!",
    "Very professional and attentive to my needs. Made significant progress with their help.",
    "Great experience overall. The provider was punctual and thorough.",
    "Helped me more than expected. Very pleased with the results.",
    "Knowledgeable and patient. Explains everything clearly."
  ];
  
  for (const provider of providerProfiles.providerProfiles) {
    // Each provider gets 3-5 reviews
    const numReviews = 3 + (providerProfiles.providerProfiles.indexOf(provider) % 3);
    
    for (let i = 0; i < numReviews; i++) {
      // Cycle through clients to give reviews
      const client = clientProfiles.clientProfiles[i % clientProfiles.clientProfiles.length];
      
      await prisma.providerReview.create({
        data: {
          providerId: provider.userId,
          clientId: client.userId,
          rating: 4 + (i % 2), // Ratings of 4 or 5
          comment: reviewComments[i % reviewComments.length],
          serviceDate: new Date(new Date().setDate(new Date().getDate() - (30 - i * 5))),
          createdAt: new Date(new Date().setDate(new Date().getDate() - (28 - i * 5))),
          updatedAt: new Date()
        }
      });
    }
  }
  
  console.log('Provider reviews created');
}

/**
 * Creates sample documents for users
 */
async function createDocuments(prisma: PrismaClient, users: Record<string, any>): Promise<Record<string, any>> {
  console.log('Creating documents...');
  
  const documents: any[] = [];
  
  // Create documents for each client
  for (const client of users.clients) {
    // Medical records
    const medicalRecord = await prisma.document.create({
      data: {
        ownerId: client.id,
        name: 'Medical History.pdf',
        type: 'medical_record',
        mimeType: 'application/pdf',
        size: 1024 * 1024 * 2, // 2MB
        storageUrl: `https://storage.revolucare.com/documents/${client.id}/medical_history.pdf`,
        metadata: {
          title: 'Medical History',
          description: 'Complete medical history including diagnoses, treatments, and medications',
          tags: ['medical', 'history', 'record'],
          category: 'medical',
          documentDate: new Date(new Date().setMonth(new Date().getMonth() - 2)),
          source: 'Primary Care Physician',
          isConfidential: true
        },
        status: 'available',
        createdAt: new Date(new Date().setMonth(new Date().getMonth() - 2)),
        updatedAt: new Date()
      }
    });
    
    documents.push(medicalRecord);
    
    // Create document analysis for the medical record
    await prisma.documentAnalysis.create({
      data: {
        documentId: medicalRecord.id,
        analysisType: 'medical_extraction',
        status: 'completed',
        results: {
          diagnoses: client.id === users.clients[0].id ? 
            ['Multiple Sclerosis', 'Chronic Fatigue', 'Mild Depression'] : 
            client.id === users.clients[1].id ? 
            ['Parkinson\'s Disease', 'Hypertension'] : 
            ['Spinal Cord Injury', 'Chronic Pain'],
          medications: client.id === users.clients[0].id ? 
            ['Tecfidera 240mg (2x/day)', 'Baclofen 10mg (3x/day)', 'Vitamin D 2000IU (1x/day)'] : 
            client.id === users.clients[1].id ? 
            ['Levodopa 100mg (3x/day)', 'Lisinopril 10mg (1x/day)'] : 
            ['Gabapentin 300mg (3x/day)', 'Ibuprofen 600mg (as needed)'],
          allergies: ['Penicillin', 'Sulfa drugs'],
          procedures: ['Annual physical', 'Diagnostic imaging'],
          immunizations: ['Influenza (1 year ago)', 'Pneumococcal (3 years ago)']
        },
        confidence: 0.92,
        processingTime: 12.3,
        createdAt: new Date(new Date().setMonth(new Date().getMonth() - 2)),
        completedAt: new Date(new Date().setMonth(new Date().getMonth() - 2))
      }
    });
    
    // Medication list
    const medicationList = await prisma.document.create({
      data: {
        ownerId: client.id,
        name: 'Medication List.pdf',
        type: 'medication_record',
        mimeType: 'application/pdf',
        size: 1024 * 512, // 0.5MB
        storageUrl: `https://storage.revolucare.com/documents/${client.id}/medication_list.pdf`,
        metadata: {
          title: 'Current Medications',
          description: 'List of current medications, dosages, and schedule',
          tags: ['medical', 'medications'],
          category: 'medical',
          documentDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
          source: 'Primary Care Physician',
          isConfidential: true
        },
        status: 'available',
        createdAt: new Date(new Date().setMonth(new Date().getMonth() - 1)),
        updatedAt: new Date()
      }
    });
    
    documents.push(medicationList);
    
    // Assessment document
    const assessment = await prisma.document.create({
      data: {
        ownerId: client.id,
        name: 'Functional Assessment.pdf',
        type: 'assessment',
        mimeType: 'application/pdf',
        size: 1024 * 768, // 0.75MB
        storageUrl: `https://storage.revolucare.com/documents/${client.id}/functional_assessment.pdf`,
        metadata: {
          title: 'Functional Assessment',
          description: 'Assessment of functional abilities and limitations',
          tags: ['assessment', 'functional'],
          category: 'assessment',
          documentDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
          source: 'Revolucare Assessment',
          isConfidential: true
        },
        status: 'available',
        createdAt: new Date(new Date().setMonth(new Date().getMonth() - 1)),
        updatedAt: new Date()
      }
    });
    
    documents.push(assessment);
  }
  
  // Create a few documents for case managers
  for (const caseManager of users.caseManagers) {
    const caseNote = await prisma.document.create({
      data: {
        ownerId: caseManager.id,
        name: 'Case Management Notes.docx',
        type: 'case_notes',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: 1024 * 256, // 0.25MB
        storageUrl: `https://storage.revolucare.com/documents/${caseManager.id}/case_notes.docx`,
        metadata: {
          title: 'Case Management Notes',
          description: 'Notes from client meetings and service coordination',
          tags: ['notes', 'case management'],
          category: 'case_management',
          documentDate: new Date(new Date().setDate(new Date().getDate() - 7)),
          source: 'Case Manager',
          isConfidential: true
        },
        status: 'available',
        createdAt: new Date(new Date().setDate(new Date().getDate() - 7)),
        updatedAt: new Date()
      }
    });
    
    documents.push(caseNote);
  }
  
  console.log(`Created ${documents.length} documents`);
  
  return {
    documents: documents
  };
}

/**
 * Creates sample bookings between clients and providers
 */
async function createBookings(
  prisma: PrismaClient, 
  clientProfiles: Record<string, any>, 
  providerProfiles: Record<string, any>, 
  serviceItems: any[]
): Promise<void> {
  console.log('Creating bookings...');
  
  const today = new Date();
  
  // Create some past bookings
  for (let i = 0; i < 5; i++) {
    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - (i * 3 + 1)); // Past dates: 1, 4, 7, 10, 13 days ago
    pastDate.setHours(10 + i % 4, 0, 0, 0); // Different hours
    
    const endTime = new Date(pastDate);
    endTime.setHours(pastDate.getHours() + 1, 0, 0, 0);
    
    const client = clientProfiles.clientProfiles[i % clientProfiles.clientProfiles.length];
    const provider = providerProfiles.providerProfiles[i % providerProfiles.providerProfiles.length];
    const serviceItem = serviceItems[i % serviceItems.length];
    
    await prisma.booking.create({
      data: {
        clientId: client.userId,
        providerId: provider.userId,
        serviceItemId: serviceItem.id,
        startTime: pastDate,
        endTime: endTime,
        status: 'completed',
        notes: 'Regular session completed successfully',
        location: {
          type: 'provider_office',
          address: {
            street: `${500 + i * 100} Main Street`,
            city: 'Springfield',
            state: 'IL',
            zipCode: '62704',
            country: 'USA'
          },
          name: `${provider.user.lastName} Healthcare Office`
        },
        createdAt: new Date(pastDate.getTime() - 1000 * 60 * 60 * 24 * 7), // Created a week before
        updatedAt: new Date(pastDate.getTime() + 1000 * 60 * 60) // Updated after completion
      }
    });
  }
  
  // Create some upcoming bookings
  for (let i = 0; i < 5; i++) {
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + (i * 3 + 1)); // Future dates: 1, 4, 7, 10, 13 days ahead
    futureDate.setHours(13 + i % 4, 0, 0, 0); // Different hours
    
    const endTime = new Date(futureDate);
    endTime.setHours(futureDate.getHours() + 1, 0, 0, 0);
    
    const client = clientProfiles.clientProfiles[i % clientProfiles.clientProfiles.length];
    const provider = providerProfiles.providerProfiles[i % providerProfiles.providerProfiles.length];
    const serviceItem = serviceItems[i % serviceItems.length];
    
    await prisma.booking.create({
      data: {
        clientId: client.userId,
        providerId: provider.userId,
        serviceItemId: serviceItem.id,
        startTime: futureDate,
        endTime: endTime,
        status: 'scheduled',
        notes: 'Regular scheduled session',
        location: {
          type: i % 2 === 0 ? 'provider_office' : 'client_home',
          address: i % 2 === 0 ? 
          {
            street: `${500 + i * 100} Main Street`,
            city: 'Springfield',
            state: 'IL',
            zipCode: '62704',
            country: 'USA'
          } : 
          {
            street: `${123 + i * 100} Home Street`,
            city: 'Springfield',
            state: 'IL',
            zipCode: '62704',
            country: 'USA'
          },
          name: i % 2 === 0 ? `${provider.user.lastName} Healthcare Office` : 'Client\'s Home'
        },
        createdAt: new Date(today.getTime() - 1000 * 60 * 60 * 24 * 3), // Created 3 days ago
        updatedAt: new Date(today.getTime() - 1000 * 60 * 60 * 24 * 3)
      }
    });
  }
  
  console.log('Bookings created');
}

// Execute the main function
main()
  .catch((e) => {
    console.error('Error during seed execution:', e);
    process.exit(1);
  })
  .finally(() => {
    // Script will exit after completion or error
  });