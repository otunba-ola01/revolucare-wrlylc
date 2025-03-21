import {
  NOTIFICATION_TYPES,
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_PRIORITIES,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_STATUSES
} from '../../src/constants/notification-types';

import {
  Notification,
  NotificationType,
  NotificationCategory,
  NotificationPriority,
  NotificationChannel,
  NotificationStatus,
  CreateNotificationDTO,
  NotificationPreferences
} from '../../src/types/notification.types';

import { NotificationModel } from '../../src/models/notification.model';
import { mockUsers } from './users.fixture';

/**
 * Generates a mock notification for testing
 * 
 * @param overrides - Properties to override in the default mock notification
 * @returns A complete mock notification with default values overridden by provided values
 */
export const generateMockNotification = (overrides: Partial<Notification> = {}): Notification => {
  const defaultNotification: Notification = {
    id: 'notification-1234-5678',
    userId: mockUsers[0].id,
    type: NOTIFICATION_TYPES.APPOINTMENT_REMINDER,
    category: NOTIFICATION_CATEGORIES.APPOINTMENT,
    title: 'Appointment Reminder',
    message: 'You have an appointment scheduled for tomorrow at 2:00 PM with Dr. Lee.',
    data: {
      appointmentId: 'appt-1234-5678',
      providerId: mockUsers[2].id,
      dateTime: '2023-05-15T14:00:00.000Z',
      location: 'Revolucare Wellness Center',
      serviceType: 'Physical Therapy'
    },
    priority: NOTIFICATION_PRIORITIES.HIGH,
    channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.EMAIL],
    status: NOTIFICATION_STATUSES.PENDING,
    createdAt: new Date('2023-05-14T10:00:00.000Z'),
    sentAt: null,
    readAt: null
  };

  return {
    ...defaultNotification,
    ...overrides
  };
};

/**
 * Generates a mock NotificationModel instance for testing
 * 
 * @param overrides - Properties to override in the default mock notification
 * @returns A mock NotificationModel instance with default values overridden by provided values
 */
export const generateMockNotificationModel = (overrides: Partial<Notification> = {}): NotificationModel => {
  const mockNotification = generateMockNotification(overrides);
  return new NotificationModel(mockNotification);
};

/**
 * Generates a mock CreateNotificationDTO for testing
 * 
 * @param overrides - Properties to override in the default mock CreateNotificationDTO
 * @returns A mock CreateNotificationDTO with default values overridden by provided values
 */
export const generateMockCreateNotificationDTO = (overrides: Partial<CreateNotificationDTO> = {}): CreateNotificationDTO => {
  const defaultCreateDTO: CreateNotificationDTO = {
    userId: mockUsers[0].id,
    type: NOTIFICATION_TYPES.APPOINTMENT_REMINDER,
    title: 'Appointment Reminder',
    message: 'You have an appointment scheduled for tomorrow at 2:00 PM with Dr. Lee.',
    data: {
      appointmentId: 'appt-1234-5678',
      providerId: mockUsers[2].id,
      dateTime: '2023-05-15T14:00:00.000Z',
      location: 'Revolucare Wellness Center',
      serviceType: 'Physical Therapy'
    },
    priority: NOTIFICATION_PRIORITIES.HIGH,
    channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.EMAIL]
  };

  return {
    ...defaultCreateDTO,
    ...overrides
  };
};

/**
 * Generates mock notification preferences for testing
 * 
 * @param overrides - Properties to override in the default mock notification preferences
 * @returns Mock notification preferences with default values overridden by provided values
 */
export const generateMockNotificationPreferences = (overrides: Partial<NotificationPreferences> = {}): NotificationPreferences => {
  const defaultPreferences: NotificationPreferences = {
    userId: mockUsers[0].id,
    channels: {
      [NOTIFICATION_CHANNELS.IN_APP]: true,
      [NOTIFICATION_CHANNELS.EMAIL]: true,
      [NOTIFICATION_CHANNELS.SMS]: false
    },
    types: {
      [NOTIFICATION_TYPES.APPOINTMENT_REMINDER]: {
        enabled: true,
        channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.EMAIL]
      },
      [NOTIFICATION_TYPES.CARE_PLAN_UPDATED]: {
        enabled: true,
        channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.EMAIL]
      },
      [NOTIFICATION_TYPES.MESSAGE_RECEIVED]: {
        enabled: true,
        channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.EMAIL, NOTIFICATION_CHANNELS.SMS]
      },
      [NOTIFICATION_TYPES.PROVIDER_MATCHED]: {
        enabled: true,
        channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.EMAIL]
      },
      [NOTIFICATION_TYPES.SYSTEM_UPDATE]: {
        enabled: false,
        channels: [NOTIFICATION_CHANNELS.IN_APP]
      }
    },
    quietHours: {
      enabled: true,
      start: '22:00',
      end: '08:00',
      timezone: 'America/Chicago'
    },
    updatedAt: new Date('2023-05-01T00:00:00.000Z')
  };

  return {
    ...defaultPreferences,
    ...overrides
  };
};

// Array of pre-defined mock notifications with different types and statuses
export const mockNotifications: Notification[] = [
  // Appointment reminder notification (pending)
  generateMockNotification({
    id: 'notification-appt-1',
    userId: mockUsers[0].id,
    type: NOTIFICATION_TYPES.APPOINTMENT_REMINDER,
    category: NOTIFICATION_CATEGORIES.APPOINTMENT,
    title: 'Appointment Reminder',
    message: 'You have an appointment scheduled for tomorrow at 2:00 PM with Dr. Lee.',
    data: {
      appointmentId: 'appt-1234-5678',
      providerId: mockUsers[2].id,
      dateTime: '2023-05-15T14:00:00.000Z',
      location: 'Revolucare Wellness Center',
      serviceType: 'Physical Therapy'
    },
    priority: NOTIFICATION_PRIORITIES.HIGH,
    channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.EMAIL],
    status: NOTIFICATION_STATUSES.PENDING,
    createdAt: new Date('2023-05-14T10:00:00.000Z'),
    sentAt: null,
    readAt: null
  }),

  // Care plan updated notification (sent)
  generateMockNotification({
    id: 'notification-care-1',
    userId: mockUsers[0].id,
    type: NOTIFICATION_TYPES.CARE_PLAN_UPDATED,
    category: NOTIFICATION_CATEGORIES.CARE_PLAN,
    title: 'Care Plan Updated',
    message: 'Your care plan has been updated by Dr. Brown.',
    data: {
      carePlanId: 'care-plan-9876-5432',
      updatedBy: mockUsers[4].id,
      updatedAt: '2023-05-12T15:30:00.000Z'
    },
    priority: NOTIFICATION_PRIORITIES.NORMAL,
    channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.EMAIL],
    status: NOTIFICATION_STATUSES.SENT,
    createdAt: new Date('2023-05-12T15:35:00.000Z'),
    sentAt: new Date('2023-05-12T15:36:00.000Z'),
    readAt: null
  }),

  // Message received notification (delivered)
  generateMockNotification({
    id: 'notification-msg-1',
    userId: mockUsers[0].id,
    type: NOTIFICATION_TYPES.MESSAGE_RECEIVED,
    category: NOTIFICATION_CATEGORIES.MESSAGE,
    title: 'New Message from Dr. Lee',
    message: 'How are you feeling after our session yesterday?',
    data: {
      messageId: 'msg-2468-1357',
      senderId: mockUsers[2].id,
      senderName: 'Dr. Emily Lee',
      conversationId: 'conv-1234-5678'
    },
    priority: NOTIFICATION_PRIORITIES.HIGH,
    channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.EMAIL, NOTIFICATION_CHANNELS.SMS],
    status: NOTIFICATION_STATUSES.DELIVERED,
    createdAt: new Date('2023-05-11T09:15:00.000Z'),
    sentAt: new Date('2023-05-11T09:16:00.000Z'),
    readAt: null
  }),

  // Provider matched notification (read)
  generateMockNotification({
    id: 'notification-provider-1',
    userId: mockUsers[0].id,
    type: NOTIFICATION_TYPES.PROVIDER_MATCHED,
    category: NOTIFICATION_CATEGORIES.PROVIDER,
    title: 'New Provider Match',
    message: 'We found a new provider that matches your needs: Dr. James Wilson',
    data: {
      providerId: mockUsers[3].id,
      providerName: 'Dr. James Wilson',
      matchScore: 87,
      specializations: ['Sports Rehabilitation', 'Strength Training']
    },
    priority: NOTIFICATION_PRIORITIES.NORMAL,
    channels: [NOTIFICATION_CHANNELS.IN_APP],
    status: NOTIFICATION_STATUSES.READ,
    createdAt: new Date('2023-05-10T14:20:00.000Z'),
    sentAt: new Date('2023-05-10T14:21:00.000Z'),
    readAt: new Date('2023-05-10T16:45:00.000Z')
  }),

  // Payment processed notification (failed)
  generateMockNotification({
    id: 'notification-payment-1',
    userId: mockUsers[0].id,
    type: NOTIFICATION_TYPES.PAYMENT_PROCESSED,
    category: NOTIFICATION_CATEGORIES.PAYMENT,
    title: 'Payment Processed',
    message: 'Your payment of $75.00 for Physical Therapy has been processed.',
    data: {
      paymentId: 'payment-5555-6666',
      amount: 75.00,
      serviceId: 'service-7777-8888',
      serviceType: 'Physical Therapy',
      date: '2023-05-09T10:00:00.000Z'
    },
    priority: NOTIFICATION_PRIORITIES.NORMAL,
    channels: [NOTIFICATION_CHANNELS.EMAIL],
    status: NOTIFICATION_STATUSES.FAILED,
    createdAt: new Date('2023-05-09T10:05:00.000Z'),
    sentAt: new Date('2023-05-09T10:06:00.000Z'),
    readAt: null
  }),

  // System update notification for admin (delivered)
  generateMockNotification({
    id: 'notification-system-1',
    userId: mockUsers[6].id, // Admin user
    type: NOTIFICATION_TYPES.SYSTEM_UPDATE,
    category: NOTIFICATION_CATEGORIES.SYSTEM,
    title: 'System Maintenance Completed',
    message: 'The scheduled system maintenance has been completed successfully.',
    data: {
      maintenanceId: 'maint-1234-5678',
      completedAt: '2023-05-08T03:30:00.000Z',
      affectedServices: ['Database', 'API Services'],
      downtime: 45 // minutes
    },
    priority: NOTIFICATION_PRIORITIES.LOW,
    channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.EMAIL],
    status: NOTIFICATION_STATUSES.DELIVERED,
    createdAt: new Date('2023-05-08T03:35:00.000Z'),
    sentAt: new Date('2023-05-08T03:36:00.000Z'),
    readAt: null
  }),

  // Document analyzed notification (read)
  generateMockNotification({
    id: 'notification-doc-1',
    userId: mockUsers[0].id,
    type: NOTIFICATION_TYPES.DOCUMENT_ANALYZED,
    category: NOTIFICATION_CATEGORIES.DOCUMENT,
    title: 'Medical Records Analyzed',
    message: 'Your uploaded medical records have been successfully analyzed.',
    data: {
      documentId: 'doc-1234-5678',
      documentType: 'Medical Records',
      analysisId: 'analysis-8765-4321',
      confidenceScore: 92
    },
    priority: NOTIFICATION_PRIORITIES.NORMAL,
    channels: [NOTIFICATION_CHANNELS.IN_APP],
    status: NOTIFICATION_STATUSES.READ,
    createdAt: new Date('2023-05-05T11:20:00.000Z'),
    sentAt: new Date('2023-05-05T11:21:00.000Z'),
    readAt: new Date('2023-05-05T13:45:00.000Z')
  }),

  // Service plan approved notification (sent)
  generateMockNotification({
    id: 'notification-service-1',
    userId: mockUsers[0].id,
    type: NOTIFICATION_TYPES.SERVICE_PLAN_APPROVED,
    category: NOTIFICATION_CATEGORIES.SERVICE_PLAN,
    title: 'Service Plan Approved',
    message: 'Your service plan has been approved and is ready to begin.',
    data: {
      servicePlanId: 'service-plan-1234-5678',
      approvedBy: mockUsers[4].id,
      approvedAt: '2023-05-03T09:15:00.000Z',
      startDate: '2023-05-10T00:00:00.000Z'
    },
    priority: NOTIFICATION_PRIORITIES.HIGH,
    channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.EMAIL],
    status: NOTIFICATION_STATUSES.SENT,
    createdAt: new Date('2023-05-03T09:20:00.000Z'),
    sentAt: new Date('2023-05-03T09:21:00.000Z'),
    readAt: null
  })
];

// Array of pre-defined mock NotificationModel instances
export const mockNotificationModels: NotificationModel[] = mockNotifications.map(
  notification => new NotificationModel(notification)
);

// Array of pre-defined mock CreateNotificationDTO objects
export const mockCreateNotificationDTOs: CreateNotificationDTO[] = [
  // Appointment reminder DTO
  generateMockCreateNotificationDTO({
    userId: mockUsers[0].id,
    type: NOTIFICATION_TYPES.APPOINTMENT_REMINDER,
    title: 'Appointment Reminder',
    message: 'You have an appointment scheduled for tomorrow at 2:00 PM with Dr. Lee.',
    data: {
      appointmentId: 'appt-1234-5678',
      providerId: mockUsers[2].id,
      dateTime: '2023-05-15T14:00:00.000Z',
      location: 'Revolucare Wellness Center',
      serviceType: 'Physical Therapy'
    },
    priority: NOTIFICATION_PRIORITIES.HIGH,
    channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.EMAIL]
  }),

  // Care plan created DTO
  generateMockCreateNotificationDTO({
    userId: mockUsers[0].id,
    type: NOTIFICATION_TYPES.CARE_PLAN_CREATED,
    title: 'New Care Plan Created',
    message: 'A new care plan has been created for you by Dr. Brown.',
    data: {
      carePlanId: 'care-plan-1234-5678',
      createdBy: mockUsers[4].id,
      createdAt: '2023-05-14T13:45:00.000Z'
    },
    priority: NOTIFICATION_PRIORITIES.NORMAL,
    channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.EMAIL]
  }),

  // Message received DTO
  generateMockCreateNotificationDTO({
    userId: mockUsers[2].id, // Provider
    type: NOTIFICATION_TYPES.MESSAGE_RECEIVED,
    title: 'New Message from Sarah Johnson',
    message: 'I have a question about our upcoming appointment.',
    data: {
      messageId: 'msg-9876-5432',
      senderId: mockUsers[0].id,
      senderName: 'Sarah Johnson',
      conversationId: 'conv-5678-1234'
    },
    priority: NOTIFICATION_PRIORITIES.HIGH,
    channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.EMAIL, NOTIFICATION_CHANNELS.SMS]
  }),

  // Payment failed DTO
  generateMockCreateNotificationDTO({
    userId: mockUsers[0].id,
    type: NOTIFICATION_TYPES.PAYMENT_FAILED,
    title: 'Payment Failed',
    message: 'Your payment for Physical Therapy services could not be processed.',
    data: {
      paymentId: 'payment-1111-2222',
      amount: 75.00,
      serviceId: 'service-3333-4444',
      serviceType: 'Physical Therapy',
      failureReason: 'Insufficient funds',
      date: '2023-05-14T09:30:00.000Z'
    },
    priority: NOTIFICATION_PRIORITIES.URGENT,
    channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.EMAIL, NOTIFICATION_CHANNELS.SMS]
  })
];

// Array of pre-defined mock notification preferences
export const mockNotificationPreferences: NotificationPreferences[] = [
  // Default preferences for client
  generateMockNotificationPreferences({
    userId: mockUsers[0].id, // Client
    channels: {
      [NOTIFICATION_CHANNELS.IN_APP]: true,
      [NOTIFICATION_CHANNELS.EMAIL]: true,
      [NOTIFICATION_CHANNELS.SMS]: false
    },
    types: {
      [NOTIFICATION_TYPES.APPOINTMENT_REMINDER]: {
        enabled: true,
        channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.EMAIL]
      },
      [NOTIFICATION_TYPES.CARE_PLAN_UPDATED]: {
        enabled: true,
        channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.EMAIL]
      },
      [NOTIFICATION_TYPES.MESSAGE_RECEIVED]: {
        enabled: true,
        channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.EMAIL, NOTIFICATION_CHANNELS.SMS]
      },
      [NOTIFICATION_TYPES.PAYMENT_FAILED]: {
        enabled: true,
        channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.EMAIL, NOTIFICATION_CHANNELS.SMS]
      }
    },
    quietHours: {
      enabled: true,
      start: '22:00',
      end: '08:00',
      timezone: 'America/Chicago'
    }
  }),

  // Provider preferences
  generateMockNotificationPreferences({
    userId: mockUsers[2].id, // Provider
    channels: {
      [NOTIFICATION_CHANNELS.IN_APP]: true,
      [NOTIFICATION_CHANNELS.EMAIL]: true,
      [NOTIFICATION_CHANNELS.SMS]: true
    },
    types: {
      [NOTIFICATION_TYPES.APPOINTMENT_REMINDER]: {
        enabled: true,
        channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.EMAIL, NOTIFICATION_CHANNELS.SMS]
      },
      [NOTIFICATION_TYPES.MESSAGE_RECEIVED]: {
        enabled: true,
        channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.EMAIL, NOTIFICATION_CHANNELS.SMS]
      },
      [NOTIFICATION_TYPES.PROVIDER_AVAILABILITY]: {
        enabled: true,
        channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.EMAIL]
      }
    },
    quietHours: {
      enabled: false,
      start: '23:00',
      end: '07:00',
      timezone: 'America/New_York'
    }
  }),

  // Case manager preferences
  generateMockNotificationPreferences({
    userId: mockUsers[4].id, // Case manager
    channels: {
      [NOTIFICATION_CHANNELS.IN_APP]: true,
      [NOTIFICATION_CHANNELS.EMAIL]: true,
      [NOTIFICATION_CHANNELS.SMS]: false
    },
    types: {
      [NOTIFICATION_TYPES.CARE_PLAN_CREATED]: {
        enabled: true,
        channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.EMAIL]
      },
      [NOTIFICATION_TYPES.CARE_PLAN_UPDATED]: {
        enabled: true,
        channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.EMAIL]
      },
      [NOTIFICATION_TYPES.MESSAGE_RECEIVED]: {
        enabled: true,
        channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.EMAIL]
      },
      [NOTIFICATION_TYPES.DOCUMENT_ANALYZED]: {
        enabled: true,
        channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.EMAIL]
      }
    },
    quietHours: {
      enabled: true,
      start: '20:00',
      end: '08:00',
      timezone: 'America/Los_Angeles'
    }
  }),

  // Admin preferences
  generateMockNotificationPreferences({
    userId: mockUsers[6].id, // Admin
    channels: {
      [NOTIFICATION_CHANNELS.IN_APP]: true,
      [NOTIFICATION_CHANNELS.EMAIL]: true,
      [NOTIFICATION_CHANNELS.SMS]: true
    },
    types: {
      [NOTIFICATION_TYPES.SYSTEM_UPDATE]: {
        enabled: true,
        channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.EMAIL, NOTIFICATION_CHANNELS.SMS]
      },
      [NOTIFICATION_TYPES.PAYMENT_FAILED]: {
        enabled: true,
        channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.EMAIL]
      },
      [NOTIFICATION_TYPES.MESSAGE_RECEIVED]: {
        enabled: true,
        channels: [NOTIFICATION_CHANNELS.IN_APP]
      }
    },
    quietHours: {
      enabled: false,
      start: '00:00',
      end: '00:00',
      timezone: 'UTC'
    }
  })
];