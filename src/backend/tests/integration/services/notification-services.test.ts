import { NotificationService } from '../../../src/services/notifications.service';
import { NotificationRepository } from '../../../src/repositories/notification.repository';
import { UserRepository } from '../../../src/repositories/user.repository';
import { NotificationModel } from '../../../src/models/notification.model';
import {
  NOTIFICATION_TYPES,
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_PRIORITIES,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_STATUSES,
} from '../../../src/constants/notification-types';
import {
  CreateNotificationDTO,
  NotificationFilterOptions,
  NotificationPreferences,
  NotificationPreferencesUpdateDTO,
  Notification,
  NotificationChannel,
} from '../../../src/types/notification.types';
import {
  mockNotifications,
  mockCreateNotificationDTOs,
  mockNotificationPreferences,
  generateMockNotification,
  generateMockCreateNotificationDTO,
  generateMockNotificationPreferences,
} from '../../fixtures/notifications.fixture';
import { mockUsers, mockClientsWithProfiles } from '../../fixtures/users.fixture';
import { MockEmailService } from '../../mocks/email.mock';
import { mockSmsService } from '../../mocks/sms.mock';
import { resetMockDatabase } from '../../mocks/database.mock';
import jest from 'jest'; // version ^29.5.0

describe('NotificationService Integration Tests', () => {
  let notificationService: NotificationService;
  let notificationRepository: NotificationRepository;
  let userRepository: UserRepository;
  let mockEmailService: MockEmailService;

  beforeEach(() => {
    resetMockDatabase();
    const { service, notificationRepo, userRepo, emailService } = setupNotificationService();
    notificationService = service;
    notificationRepository = notificationRepo;
    userRepository = userRepo;
    mockEmailService = emailService;
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockSmsService.reset();
    mockEmailService.clearSentEmails();
  });

  const setupNotificationService = () => {
    const notificationRepo = new NotificationRepository();
    const userRepo = new UserRepository();
    const emailService = new MockEmailService();
    const service = new NotificationService(notificationRepo, userRepo, emailService);
    return { service, notificationRepo, userRepo, emailService };
  };

  describe('createNotification', () => {
    it('should create a notification with valid data', async () => {
      const createNotificationDTO: CreateNotificationDTO = generateMockCreateNotificationDTO();
      jest.spyOn(notificationRepository, 'create').mockResolvedValue(generateMockNotification(createNotificationDTO));

      const notification = await notificationService.createNotification(createNotificationDTO);

      expect(notificationRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        userId: createNotificationDTO.userId,
        type: createNotificationDTO.type,
        title: createNotificationDTO.title,
        message: createNotificationDTO.message,
      }));
      expect(notification).toEqual(expect.objectContaining({
        userId: createNotificationDTO.userId,
        type: createNotificationDTO.type,
        title: createNotificationDTO.title,
        message: createNotificationDTO.message,
      }));
    });

    it('should throw an error if required fields are missing', async () => {
      const invalidNotificationDTO: any = { userId: mockUsers[0].id };

      await expect(notificationService.createNotification(invalidNotificationDTO))
        .rejects
        .toThrowError();
      expect(notificationRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('getNotifications', () => {
    it('should retrieve notifications for a user with pagination', async () => {
      const userId = mockUsers[0].id;
      const page = 1;
      const limit = 10;
      jest.spyOn(notificationRepository, 'findByUserId').mockResolvedValue({
        success: true,
        message: 'Notifications retrieved successfully',
        data: mockNotifications.slice(0, 10),
        pagination: {
          page,
          limit,
          totalItems: mockNotifications.length,
          totalPages: Math.ceil(mockNotifications.length / limit),
        },
      });

      const notifications = await notificationService.getNotifications(userId, {}, page, limit);

      expect(notificationRepository.findByUserId).toHaveBeenCalledWith(userId, {}, page, limit);
      expect(notifications.data.length).toBeLessThanOrEqual(limit);
      expect(notifications.pagination.page).toBe(page);
      expect(notifications.pagination.limit).toBe(limit);
      expect(notifications.pagination.totalItems).toBe(mockNotifications.length);
    });

    it('should apply filters correctly when retrieving notifications', async () => {
      const userId = mockUsers[0].id;
      const filterOptions: NotificationFilterOptions = {
        type: NOTIFICATION_TYPES.APPOINTMENT_REMINDER,
        status: NOTIFICATION_STATUSES.PENDING,
      };
      jest.spyOn(notificationRepository, 'findByUserId').mockResolvedValue({
        success: true,
        message: 'Notifications retrieved successfully',
        data: mockNotifications.filter(n => n.type === filterOptions.type && n.status === filterOptions.status),
        pagination: {
          page: 1,
          limit: 10,
          totalItems: 1,
          totalPages: 1,
        },
      });

      const notifications = await notificationService.getNotifications(userId, filterOptions);

      expect(notificationRepository.findByUserId).toHaveBeenCalledWith(userId, filterOptions, 1, 10);
      expect(notifications.data.every(n => n.type === filterOptions.type && n.status === filterOptions.status)).toBe(true);
    });
  });

  describe('getNotificationById', () => {
    it('should retrieve a notification by ID', async () => {
      const notificationId = mockNotifications[0].id;
      jest.spyOn(notificationRepository, 'findById').mockResolvedValue(mockNotifications[0]);

      const notification = await notificationService.getNotificationById(notificationId);

      expect(notificationRepository.findById).toHaveBeenCalledWith(notificationId);
      expect(notification).toEqual(mockNotifications[0]);
    });

    it('should throw an error if notification is not found', async () => {
      const notificationId = 'non-existent-id';
      jest.spyOn(notificationRepository, 'findById').mockResolvedValue(null);

      await expect(notificationService.getNotificationById(notificationId)).rejects.toThrowError();
      expect(notificationRepository.findById).toHaveBeenCalledWith(notificationId);
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      const notificationId = mockNotifications[0].id;
      const userId = mockNotifications[0].userId;
      const updatedNotification = { ...mockNotifications[0], status: NOTIFICATION_STATUSES.READ, readAt: new Date() };
      jest.spyOn(notificationRepository, 'markAsRead').mockResolvedValue(updatedNotification);

      const notification = await notificationService.markAsRead(notificationId, userId);

      expect(notificationRepository.markAsRead).toHaveBeenCalledWith(notificationId);
      expect(notification.status).toBe(NOTIFICATION_STATUSES.READ);
      expect(notification.readAt).toBeDefined();
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications for a user as read', async () => {
      const userId = mockUsers[0].id;
      const updatedCount = 5;
      jest.spyOn(notificationRepository, 'markAllAsRead').mockResolvedValue(updatedCount);

      const count = await notificationService.markAllAsRead(userId);

      expect(notificationRepository.markAllAsRead).toHaveBeenCalledWith(userId);
      expect(count).toBe(updatedCount);
    });
  });

  describe('deleteNotification', () => {
    it('should delete a notification', async () => {
      const notificationId = mockNotifications[0].id;
      const userId = mockNotifications[0].userId;
      jest.spyOn(notificationRepository, 'delete').mockResolvedValue(true);

      const result = await notificationService.deleteNotification(notificationId, userId);

      expect(notificationRepository.delete).toHaveBeenCalledWith(notificationId);
      expect(result).toBe(true);
    });
  });

  describe('getNotificationStats', () => {
    it('should retrieve notification statistics for a user', async () => {
      const userId = mockUsers[0].id;
      const stats = {
        total: 10,
        unread: 3,
        byCategory: { [NOTIFICATION_CATEGORIES.APPOINTMENT]: 2, [NOTIFICATION_CATEGORIES.CARE_PLAN]: 1 },
        byPriority: { [NOTIFICATION_PRIORITIES.HIGH]: 1, [NOTIFICATION_PRIORITIES.NORMAL]: 2 },
      };
      jest.spyOn(notificationRepository, 'getStats').mockResolvedValue(stats);

      const notificationStats = await notificationService.getNotificationStats(userId);

      expect(notificationRepository.getStats).toHaveBeenCalledWith(userId);
      expect(notificationStats).toEqual(stats);
    });
  });

  describe('getNotificationPreferences', () => {
    it('should retrieve notification preferences for a user', async () => {
      const userId = mockUsers[0].id;
      const preferences = generateMockNotificationPreferences({ userId });
      jest.spyOn(userRepository, 'findById').mockResolvedValue({ ...mockUsers[0], preferences });

      const notificationPreferences = await notificationService.getNotificationPreferences(userId);

      expect(userRepository.findById).toHaveBeenCalledWith(userId);
      expect(notificationPreferences).toEqual(expect.objectContaining({ userId }));
    });

    it('should create default preferences if user has none', async () => {
      const userId = mockUsers[0].id;
      jest.spyOn(userRepository, 'findById').mockResolvedValue(mockUsers[0]);

      const notificationPreferences = await notificationService.getNotificationPreferences(userId);

      expect(userRepository.findById).toHaveBeenCalledWith(userId);
      expect(notificationPreferences).toEqual(expect.objectContaining({ userId }));
    });
  });

  describe('updateNotificationPreferences', () => {
    it('should update notification preferences for a user', async () => {
      const userId = mockUsers[0].id;
      const updateData: NotificationPreferencesUpdateDTO = {
        channels: { [NOTIFICATION_CHANNELS.EMAIL]: false },
        quietHours: { enabled: true, start: '23:00', end: '07:00', timezone: 'UTC' }
      };
      const currentPreferences = generateMockNotificationPreferences({ userId });
      jest.spyOn(notificationService, 'getNotificationPreferences').mockResolvedValue(currentPreferences);
      jest.spyOn(userRepository, 'update').mockResolvedValue(mockUsers[0]);

      const updatedPreferences = await notificationService.updateNotificationPreferences(userId, updateData);

      expect(userRepository.update).toHaveBeenCalledWith(userId, expect.anything());
      expect(updatedPreferences.channels[NOTIFICATION_CHANNELS.EMAIL]).toBe(false);
      expect(updatedPreferences.quietHours.enabled).toBe(true);
    });
  });

  describe('sendNotification', () => {
    it('should send a notification through all enabled channels', async () => {
      const notification = generateMockNotification({ channels: [NOTIFICATION_CHANNELS.EMAIL, NOTIFICATION_CHANNELS.SMS] });
      jest.spyOn(notificationService, 'getNotificationPreferences').mockResolvedValue(generateMockNotificationPreferences({
        channels: { [NOTIFICATION_CHANNELS.EMAIL]: true, [NOTIFICATION_CHANNELS.SMS]: true, [NOTIFICATION_CHANNELS.IN_APP]: true }
      }));
      jest.spyOn(mockEmailService, 'deliverNotification').mockResolvedValue([{ success: true, channel: NOTIFICATION_CHANNELS.EMAIL, error: null, metadata: {} }]);
      jest.spyOn(mockSmsService, 'sendNotification').mockResolvedValue({ success: true, messageId: 'sms123' });

      await notificationService.sendNotification(notification);

      expect(mockEmailService.deliverNotification).toHaveBeenCalledWith(notification);
      expect(mockSmsService.sendNotification).toHaveBeenCalledWith(notification.userId, notification.type, notification.data);
    });

    it('should respect user preferences when sending notifications', async () => {
      const notification = generateMockNotification({ channels: [NOTIFICATION_CHANNELS.EMAIL, NOTIFICATION_CHANNELS.SMS] });
      jest.spyOn(notificationService, 'getNotificationPreferences').mockResolvedValue(generateMockNotificationPreferences({
        channels: { [NOTIFICATION_CHANNELS.EMAIL]: true, [NOTIFICATION_CHANNELS.SMS]: false, [NOTIFICATION_CHANNELS.IN_APP]: true }
      }));
      jest.spyOn(mockEmailService, 'deliverNotification').mockResolvedValue([{ success: true, channel: NOTIFICATION_CHANNELS.EMAIL, error: null, metadata: {} }]);
      jest.spyOn(mockSmsService, 'sendNotification');

      await notificationService.sendNotification(notification);

      expect(mockEmailService.deliverNotification).toHaveBeenCalledWith(notification);
      expect(mockSmsService.sendNotification).not.toHaveBeenCalled();
    });

    it('should handle delivery failures gracefully', async () => {
      const notification = generateMockNotification({ channels: [NOTIFICATION_CHANNELS.EMAIL] });
      jest.spyOn(notificationService, 'getNotificationPreferences').mockResolvedValue(generateMockNotificationPreferences({
        channels: { [NOTIFICATION_CHANNELS.EMAIL]: true, [NOTIFICATION_CHANNELS.SMS]: false, [NOTIFICATION_CHANNELS.IN_APP]: true }
      }));
      jest.spyOn(mockEmailService, 'deliverNotification').mockResolvedValue([{ success: false, channel: NOTIFICATION_CHANNELS.EMAIL, error: 'Delivery failed', metadata: null }]);

      const deliveryResults = await notificationService.sendNotification(notification);

      expect(mockEmailService.deliverNotification).toHaveBeenCalledWith(notification);
      expect(deliveryResults[0].success).toBe(false);
      expect(deliveryResults[0].error).toBe('Delivery failed');
    });

    it('should respect quiet hours settings when sending notifications', async () => {
      const notification = generateMockNotification({ channels: [NOTIFICATION_CHANNELS.EMAIL, NOTIFICATION_CHANNELS.SMS] });
      jest.spyOn(notificationService, 'getNotificationPreferences').mockResolvedValue(generateMockNotificationPreferences({
        channels: { [NOTIFICATION_CHANNELS.EMAIL]: true, [NOTIFICATION_CHANNELS.SMS]: true, [NOTIFICATION_CHANNELS.IN_APP]: true },
        quietHours: { enabled: true, start: '22:00', end: '06:00', timezone: 'UTC' }
      }));
      jest.spyOn(mockEmailService, 'deliverNotification');
      jest.spyOn(mockSmsService, 'sendNotification');
      jest.useFakeTimers().setSystemTime(new Date('2024-01-01T00:00:00.000Z')); // Midnight UTC

      await notificationService.sendNotification(notification);

      expect(mockEmailService.deliverNotification).not.toHaveBeenCalled();
      expect(mockSmsService.sendNotification).not.toHaveBeenCalled();
      jest.useRealTimers();
    });
  });

  describe('Event handling', () => {
    it('should emit events when notifications are created', async () => {
      const createNotificationDTO: CreateNotificationDTO = generateMockCreateNotificationDTO();
      const mockListener = jest.fn();
      notificationService.on('notification.created', mockListener);
      jest.spyOn(notificationRepository, 'create').mockResolvedValue(generateMockNotification(createNotificationDTO));

      await notificationService.createNotification(createNotificationDTO);

      expect(mockListener).toHaveBeenCalled();
    });

    it('should emit events when notifications are marked as read', async () => {
      const notificationId = mockNotifications[0].id;
      const userId = mockNotifications[0].userId;
      const mockListener = jest.fn();
      notificationService.on('notification.read', mockListener);
      const updatedNotification = { ...mockNotifications[0], status: NOTIFICATION_STATUSES.READ, readAt: new Date() };
      jest.spyOn(notificationRepository, 'markAsRead').mockResolvedValue(updatedNotification);

      await notificationService.markAsRead(notificationId, userId);

      expect(mockListener).toHaveBeenCalled();
    });
  });
});