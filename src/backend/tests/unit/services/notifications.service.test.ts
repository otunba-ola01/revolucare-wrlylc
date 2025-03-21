# src/backend/tests/unit/services/notifications.service.test.ts
```typescript
import { NotificationService } from '../../../src/services/notifications.service';
import { NotificationRepository } from '../../../src/repositories/notification.repository';
import { UserRepository } from '../../../src/repositories/user.repository';
import { EmailService } from '../../../src/services/email/email.service';
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
  NotificationDeliveryResult,
} from '../../../src/types/notification.types';
import { errorFactory } from '../../../src/utils/error-handler';
import { PaginatedResponse } from '../../../src/types/response.types';
import { Roles } from '../../../src/constants/roles';
import { User } from '../../../src/types/user.types';

// Mock the NotificationRepository class
jest.mock('../../../src/repositories/notification.repository'); // jest@^29.0.0
// Mock the UserRepository class
jest.mock('../../../src/repositories/user.repository'); // jest@^29.0.0
// Mock the EmailService class
jest.mock('../../../src/services/email/email.service'); // jest@^29.0.0

/**
 * Creates a mock implementation of the NotificationRepository
 * @returns Mocked notification repository instance
 */
function createMockNotificationRepository(): jest.Mocked<NotificationRepository> {
  const mock = new NotificationRepository() as jest.Mocked<NotificationRepository>;
  mock.create = jest.fn();
  mock.findById = jest.fn();
  mock.findByUserId = jest.fn();
  mock.update = jest.fn();
  mock.delete = jest.fn();
  mock.markAsRead = jest.fn();
  mock.markAllAsRead = jest.fn();
  mock.getStats = jest.fn();
  return mock;
}

/**
 * Creates a mock implementation of the UserRepository
 * @returns Mocked user repository instance
 */
function createMockUserRepository(): jest.Mocked<UserRepository> {
  const mock = new UserRepository() as jest.Mocked<UserRepository>;
  mock.findById = jest.fn();
  mock.findWithProfile = jest.fn();
  return mock;
}

/**
 * Creates a mock implementation of the EmailService
 * @returns Mocked email service instance
 */
function createMockEmailService(): jest.Mocked<EmailService> {
  const mock = new EmailService() as jest.Mocked<EmailService>;
  mock.initialize = jest.fn();
  mock.deliverNotification = jest.fn();
  mock.getDeliveryStatus = jest.fn();
  return mock;
}

/**
 * Creates a test notification object for testing
 * @param Partial<Notification> overrides
 * @returns Test notification object
 */
function createTestNotification(overrides: Partial<Notification> = {}): Notification {
  const baseNotification: Notification = {
    id: 'test-notification-id',
    userId: 'test-user-id',
    type: NOTIFICATION_TYPES.APPOINTMENT_REMINDER,
    category: NOTIFICATION_CATEGORIES.APPOINTMENT,
    title: 'Test Notification',
    message: 'This is a test notification',
    data: { key: 'value' },
    priority: NOTIFICATION_PRIORITIES.NORMAL,
    channels: [NOTIFICATION_CHANNELS.IN_APP],
    status: NOTIFICATION_STATUSES.PENDING,
    createdAt: new Date(),
    sentAt: null,
    readAt: null,
  };

  return { ...baseNotification, ...overrides };
}

/**
 * Creates a test notification DTO for testing
 * @param Partial<CreateNotificationDTO> overrides
 * @returns Test notification DTO
 */
function createTestNotificationDTO(overrides: Partial<CreateNotificationDTO> = {}): CreateNotificationDTO {
  const baseNotificationDTO: CreateNotificationDTO = {
    userId: 'test-user-id',
    type: NOTIFICATION_TYPES.APPOINTMENT_REMINDER,
    title: 'Test Notification',
    message: 'This is a test notification',
    data: { key: 'value' },
    priority: NOTIFICATION_PRIORITIES.NORMAL,
    channels: [NOTIFICATION_CHANNELS.IN_APP],
  };

  return { ...baseNotificationDTO, ...overrides };
}

/**
 * Creates test notification preferences for testing
 * @param Partial<NotificationPreferences> overrides
 * @returns Test notification preferences
 */
function createTestNotificationPreferences(overrides: Partial<NotificationPreferences> = {}): NotificationPreferences {
  const basePreferences: NotificationPreferences = {
    userId: 'test-user-id',
    channels: {
      [NOTIFICATION_CHANNELS.IN_APP]: true,
      [NOTIFICATION_CHANNELS.EMAIL]: true,
      [NOTIFICATION_CHANNELS.SMS]: true,
    },
    types: {},
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '07:00',
      timezone: 'UTC',
    },
    updatedAt: new Date(),
  };

  return { ...basePreferences, ...overrides };
}

describe('NotificationService', () => {
  describe('constructor', () => {
    it('should initialize with the provided dependencies', () => {
      // Arrange
      const mockNotificationRepository = createMockNotificationRepository();
      const mockUserRepository = createMockUserRepository();
      const mockEmailService = createMockEmailService();

      // Act
      const notificationService = new NotificationService(
        mockNotificationRepository,
        mockUserRepository,
        mockEmailService
      );

      // Assert
      expect(notificationService).toBeDefined();
    });
  });

  describe('createNotification', () => {
    it('should create a notification with the provided data', async () => {
      // Arrange
      const mockNotificationRepository = createMockNotificationRepository();
      const mockUserRepository = createMockUserRepository();
      const mockEmailService = createMockEmailService();
      const notificationService = new NotificationService(
        mockNotificationRepository,
        mockUserRepository,
        mockEmailService
      );
      const testNotificationDTO = createTestNotificationDTO();
      const expectedNotification = createTestNotification();
      mockNotificationRepository.create.mockResolvedValue(expectedNotification);

      // Act
      const createdNotification = await notificationService.createNotification(testNotificationDTO);

      // Assert
      expect(mockNotificationRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        userId: testNotificationDTO.userId,
        type: testNotificationDTO.type,
        title: testNotificationDTO.title,
        message: testNotificationDTO.message,
        data: testNotificationDTO.data,
        priority: testNotificationDTO.priority,
        channels: testNotificationDTO.channels,
      }));
      expect(createdNotification).toEqual(expectedNotification);
    });

    it('should throw an error if notification data is invalid', async () => {
      // Arrange
      const mockNotificationRepository = createMockNotificationRepository();
      const mockUserRepository = createMockUserRepository();
      const mockEmailService = createMockEmailService();
      const notificationService = new NotificationService(
        mockNotificationRepository,
        mockUserRepository,
        mockEmailService
      );
      const invalidNotificationDTO: any = { userId: 'test-user-id' }; // Missing required fields
      mockNotificationRepository.create.mockRejectedValue(new Error('Validation error'));

      // Act & Assert
      await expect(notificationService.createNotification(invalidNotificationDTO))
        .rejects.toThrow('Validation error');
    });
  });

  describe('getNotifications', () => {
    it('should return paginated notifications for a user', async () => {
      // Arrange
      const mockNotificationRepository = createMockNotificationRepository();
      const mockUserRepository = createMockUserRepository();
      const mockEmailService = createMockEmailService();
      const notificationService = new NotificationService(
        mockNotificationRepository,
        mockUserRepository,
        mockEmailService
      );
      const testUserId = 'test-user-id';
      const filterOptions: NotificationFilterOptions = { type: NOTIFICATION_TYPES.APPOINTMENT_REMINDER };
      const expectedNotifications: PaginatedResponse<Notification> = {
        success: true,
        message: 'Notifications retrieved successfully',
        data: [createTestNotification()],
        pagination: { page: 1, limit: 10, totalItems: 1, totalPages: 1 },
      };
      mockNotificationRepository.findByUserId.mockResolvedValue(expectedNotifications);

      // Act
      const notifications = await notificationService.getNotifications(testUserId, filterOptions);

      // Assert
      expect(mockNotificationRepository.findByUserId).toHaveBeenCalledWith(testUserId, filterOptions, 1, 10);
      expect(notifications).toEqual(expectedNotifications);
    });

    it('should use default pagination values if not provided', async () => {
      // Arrange
      const mockNotificationRepository = createMockNotificationRepository();
      const mockUserRepository = createMockUserRepository();
      const mockEmailService = createMockEmailService();
      const notificationService = new NotificationService(
        mockNotificationRepository,
        mockUserRepository,
        mockEmailService
      );
      const testUserId = 'test-user-id';
      const filterOptions: NotificationFilterOptions = { type: NOTIFICATION_TYPES.APPOINTMENT_REMINDER };
      const expectedNotifications: PaginatedResponse<Notification> = {
        success: true,
        message: 'Notifications retrieved successfully',
        data: [createTestNotification()],
        pagination: { page: 1, limit: 10, totalItems: 1, totalPages: 1 },
      };
      mockNotificationRepository.findByUserId.mockResolvedValue(expectedNotifications);

      // Act
      const notifications = await notificationService.getNotifications(testUserId, filterOptions);

      // Assert
      expect(mockNotificationRepository.findByUserId).toHaveBeenCalledWith(testUserId, filterOptions, 1, 10);
      expect(notifications).toEqual(expectedNotifications);
    });
  });

  describe('getNotificationById', () => {
    it('should return a notification by ID', async () => {
      // Arrange
      const mockNotificationRepository = createMockNotificationRepository();
      const mockUserRepository = createMockUserRepository();
      const mockEmailService = createMockEmailService();
      const notificationService = new NotificationService(
        mockNotificationRepository,
        mockUserRepository,
        mockEmailService
      );
      const testNotificationId = 'test-notification-id';
      const expectedNotification = createTestNotification();
      mockNotificationRepository.findById.mockResolvedValue(expectedNotification);

      // Act
      const notification = await notificationService.getNotificationById(testNotificationId);

      // Assert
      expect(mockNotificationRepository.findById).toHaveBeenCalledWith(testNotificationId);
      expect(notification).toEqual(expectedNotification);
    });

    it('should throw an error if notification is not found', async () => {
      // Arrange
      const mockNotificationRepository = createMockNotificationRepository();
      const mockUserRepository = createMockUserRepository();
      const mockEmailService = createMockEmailService();
      const notificationService = new NotificationService(
        mockNotificationRepository,
        mockUserRepository,
        mockEmailService
      );
      const testNotificationId = 'test-notification-id';
      mockNotificationRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(notificationService.getNotificationById(testNotificationId))
        .rejects.toThrow(`Notification with ID ${testNotificationId} not found`);
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      // Arrange
      const mockNotificationRepository = createMockNotificationRepository();
      const mockUserRepository = createMockUserRepository();
      const mockEmailService = createMockEmailService();
      const notificationService = new NotificationService(
        mockNotificationRepository,
        mockUserRepository,
        mockEmailService
      );
      const testNotificationId = 'test-notification-id';
      const testUserId = 'test-user-id';
      const expectedNotification = createTestNotification({ status: NOTIFICATION_STATUSES.READ });
      mockNotificationRepository.markAsRead.mockResolvedValue(expectedNotification);

      // Act
      const notification = await notificationService.markAsRead(testNotificationId, testUserId);

      // Assert
      expect(mockNotificationRepository.markAsRead).toHaveBeenCalledWith(testNotificationId);
      expect(notification).toEqual(expectedNotification);
    });

    it('should throw an error if notification is not found', async () => {
      // Arrange
      const mockNotificationRepository = createMockNotificationRepository();
      const mockUserRepository = createMockUserRepository();
      const mockEmailService = createMockEmailService();
      const notificationService = new NotificationService(
        mockNotificationRepository,
        mockUserRepository,
        mockEmailService
      );
      const testNotificationId = 'test-notification-id';
      const testUserId = 'test-user-id';
      mockNotificationRepository.markAsRead.mockRejectedValue(errorFactory.createNotFoundError(`Notification with ID ${testNotificationId} not found`));

      // Act & Assert
      await expect(notificationService.markAsRead(testNotificationId, testUserId))
        .rejects.toThrow(`Notification with ID ${testNotificationId} not found`);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications for a user as read', async () => {
      // Arrange
      const mockNotificationRepository = createMockNotificationRepository();
      const mockUserRepository = createMockUserRepository();
      const mockEmailService = createMockEmailService();
      const notificationService = new NotificationService(
        mockNotificationRepository,
        mockUserRepository,
        mockEmailService
      );
      const testUserId = 'test-user-id';
      const expectedCount = 5;
      mockNotificationRepository.markAllAsRead.mockResolvedValue(expectedCount);

      // Act
      const count = await notificationService.markAllAsRead(testUserId);

      // Assert
      expect(mockNotificationRepository.markAllAsRead).toHaveBeenCalledWith(testUserId);
      expect(count).toEqual(expectedCount);
    });
  });

  describe('deleteNotification', () => {
    it('should delete a notification', async () => {
      // Arrange
      const mockNotificationRepository = createMockNotificationRepository();
      const mockUserRepository = createMockUserRepository();
      const mockEmailService = createMockEmailService();
      const notificationService = new NotificationService(
        mockNotificationRepository,
        mockUserRepository,
        mockEmailService
      );
      const testNotificationId = 'test-notification-id';
      const testUserId = 'test-user-id';
      mockNotificationRepository.delete.mockResolvedValue(true);

      // Act
      const result = await notificationService.deleteNotification(testNotificationId, testUserId);

      // Assert
      expect(mockNotificationRepository.delete).toHaveBeenCalledWith(testNotificationId);
      expect(result).toBe(true);
    });

    it('should throw an error if notification is not found', async () => {
      // Arrange
      const mockNotificationRepository = createMockNotificationRepository();
      const mockUserRepository = createMockUserRepository();
      const mockEmailService = createMockEmailService();
      const notificationService = new NotificationService(
        mockNotificationRepository,
        mockUserRepository,
        mockEmailService
      );
      const testNotificationId = 'test-notification-id';
      const testUserId = 'test-user-id';
      mockNotificationRepository.delete.mockRejectedValue(errorFactory.createNotFoundError(`Notification with ID ${testNotificationId} not found`));

      // Act & Assert
      await expect(notificationService.deleteNotification(testNotificationId, testUserId))
        .rejects.toThrow(`Notification with ID ${testNotificationId} not found`);
    });
  });

  describe('getNotificationStats', () => {
    it('should return notification statistics for a user', async () => {
      // Arrange
      const mockNotificationRepository = createMockNotificationRepository();
      const mockUserRepository = createMockUserRepository();
      const mockEmailService = createMockEmailService();
      const notificationService = new NotificationService(
        mockNotificationRepository,
        mockUserRepository,
        mockEmailService
      );
      const testUserId = 'test-user-id';
      const expectedStats = {
        total: 10,
        unread: 3,
        byCategory: { [NOTIFICATION_CATEGORIES.APPOINTMENT]: 2 },
        byPriority: { [NOTIFICATION_PRIORITIES.HIGH]: 1 },
      };
      mockNotificationRepository.getStats.mockResolvedValue(expectedStats);

      // Act
      const stats = await notificationService.getNotificationStats(testUserId);

      // Assert
      expect(mockNotificationRepository.getStats).toHaveBeenCalledWith(testUserId);
      expect(stats).toEqual(expectedStats);
    });
  });

  describe('getNotificationPreferences', () => {
    it('should return notification preferences for a user', async () => {
      // Arrange
      const mockNotificationRepository = createMockNotificationRepository();
      const mockUserRepository = createMockUserRepository();
      const mockEmailService = createMockEmailService();
      const notificationService = new NotificationService(
        mockNotificationRepository,
        mockUserRepository,
        mockEmailService
      );
      const testUserId = 'test-user-id';
      const testPreferences = createTestNotificationPreferences();
      mockUserRepository.findById.mockResolvedValue({ id: testUserId, email: 'test@example.com', role: Roles.CLIENT } as User);

      // Act
      const preferences = await notificationService.getNotificationPreferences(testUserId);

      // Assert
      expect(mockUserRepository.findById).toHaveBeenCalledWith(testUserId);
      expect(preferences).toEqual(expect.objectContaining({ userId: testUserId }));
    });

    it('should create default preferences if user has none', async () => {
      // Arrange
      const mockNotificationRepository = createMockNotificationRepository();
      const mockUserRepository = createMockUserRepository();
      const mockEmailService = createMockEmailService();
      const notificationService = new NotificationService(
        mockNotificationRepository,
        mockUserRepository,
        mockEmailService
      );
      const testUserId = 'test-user-id';
      mockUserRepository.findById.mockResolvedValue({ id: testUserId, email: 'test@example.com', role: Roles.CLIENT } as User);

      // Act
      const preferences = await notificationService.getNotificationPreferences(testUserId);

      // Assert
      expect(mockUserRepository.findById).toHaveBeenCalledWith(testUserId);
      expect(preferences).toEqual(expect.objectContaining({ userId: testUserId }));
    });

    it('should throw an error if user is not found', async () => {
      // Arrange
      const mockNotificationRepository = createMockNotificationRepository();
      const mockUserRepository = createMockUserRepository();
      const mockEmailService = createMockEmailService();
      const notificationService = new NotificationService(
        mockNotificationRepository,
        mockUserRepository,
        mockEmailService
      );
      const testUserId = 'test-user-id';
      mockUserRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(notificationService.getNotificationPreferences(testUserId))
        .rejects.toThrow(`User with ID ${testUserId} not found`);
    });
  });

  describe('updateNotificationPreferences', () => {
    it('should update notification preferences for a user', async () => {
      // Arrange
      const mockNotificationRepository = createMockNotificationRepository();
      const mockUserRepository = createMockUserRepository();
      const mockEmailService = createMockEmailService();
      const notificationService = new NotificationService(
        mockNotificationRepository,
        mockUserRepository,
        mockEmailService
      );
      const testUserId = 'test-user-id';
      const currentPreferences = createTestNotificationPreferences();
      const updateData: NotificationPreferencesUpdateDTO = {
        channels: { [NOTIFICATION_CHANNELS.EMAIL]: false },
      };
      mockUserRepository.update = jest.fn().mockResolvedValue({ id: testUserId, email: 'test@example.com', role: Roles.CLIENT } as User);
      mockUserRepository.findById.mockResolvedValue({ id: testUserId, email: 'test@example.com', role: Roles.CLIENT } as User);

      // Act
      const updatedPreferences = await notificationService.updateNotificationPreferences(testUserId, updateData);

      // Assert
      expect(mockUserRepository.update).toHaveBeenCalled();
      expect(updatedPreferences.channels[NOTIFICATION_CHANNELS.EMAIL]).toBe(false);
    });

    it('should throw an error if user is not found', async () => {
      // Arrange
      const mockNotificationRepository = createMockNotificationRepository();
      const mockUserRepository = createMockUserRepository();
      const mockEmailService = createMockEmailService();
      const notificationService = new NotificationService(
        mockNotificationRepository,
        mockUserRepository,
        mockEmailService
      );
      const testUserId = 'test-user-id';
      const updateData: NotificationPreferencesUpdateDTO = {
        channels: { [NOTIFICATION_CHANNELS.EMAIL]: false },
      };
      mockUserRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(notificationService.updateNotificationPreferences(testUserId, updateData))
        .rejects.toThrow(`User with ID ${testUserId} not found`);
    });
  });

  describe('sendNotification', () => {
    it('should send a notification through enabled channels', async () => {
      // Arrange
      const mockNotificationRepository = createMockNotificationRepository();
      const mockUserRepository = createMockUserRepository();
      const mockEmailService = createMockEmailService();
      const notificationService = new NotificationService(
        mockNotificationRepository,
        mockUserRepository,
        mockEmailService
      );
      const testNotification = createTestNotification({ channels: [NOTIFICATION_CHANNELS.EMAIL, NOTIFICATION_CHANNELS.SMS] });
      const testPreferences = createTestNotificationPreferences({
        channels: { [NOTIFICATION_CHANNELS.EMAIL]: true, [NOTIFICATION_CHANNELS.SMS]: true },
      });
      mockUserRepository.findById.mockResolvedValue({ id: testNotification.userId, email: 'test@example.com', role: Roles.CLIENT } as User);
      mockEmailService.deliverNotification.mockResolvedValue([{ success: true, channel: NOTIFICATION_CHANNELS.EMAIL, error: null, metadata: null }]);

      // Act
      const deliveryResults = await notificationService.sendNotification(testNotification);

      // Assert
      expect(mockEmailService.deliverNotification).toHaveBeenCalledWith(testNotification);
      expect(deliveryResults).toEqual(expect.arrayContaining([
        expect.objectContaining({ success: true, channel: NOTIFICATION_CHANNELS.EMAIL }),
      ]));
    });

    it('should respect user preferences when sending notifications', async () => {
      // Arrange
      const mockNotificationRepository = createMockNotificationRepository();
      const mockUserRepository = createMockUserRepository();
      const mockEmailService = createMockEmailService();
      const notificationService = new NotificationService(
        mockNotificationRepository,
        mockUserRepository,
        mockEmailService
      );
      const testNotification = createTestNotification({ channels: [NOTIFICATION_CHANNELS.EMAIL, NOTIFICATION_CHANNELS.SMS] });
      const testPreferences = createTestNotificationPreferences({
        channels: { [NOTIFICATION_CHANNELS.EMAIL]: false, [NOTIFICATION_CHANNELS.SMS]: true },
      });
      mockUserRepository.findById.mockResolvedValue({ id: testNotification.userId, email: 'test@example.com', role: Roles.CLIENT } as User);

      // Act
      const deliveryResults = await notificationService.sendNotification(testNotification);

      // Assert
      expect(mockEmailService.deliverNotification).not.toHaveBeenCalled();
      expect(deliveryResults).toEqual(expect.arrayContaining([
        expect.objectContaining({ channel: NOTIFICATION_CHANNELS.SMS }),
      ]));
    });

    it('should handle delivery failures gracefully', async () => {
      // Arrange
      const mockNotificationRepository = createMockNotificationRepository();
      const mockUserRepository = createMockUserRepository();
      const mockEmailService = createMockEmailService();
      const notificationService = new NotificationService(
        mockNotificationRepository,
        mockUserRepository,
        mockEmailService
      );
      const testNotification = createTestNotification({ channels: [NOTIFICATION_CHANNELS.EMAIL] });
      const testPreferences = createTestNotificationPreferences({
        channels: { [NOTIFICATION_CHANNELS.EMAIL]: true },
      });
      mockUserRepository.findById.mockResolvedValue({ id: testNotification.userId, email: 'test@example.com', role: Roles.CLIENT } as User);
      mockEmailService.deliverNotification.mockResolvedValue([{ success: false, channel: NOTIFICATION_CHANNELS.EMAIL, error: 'Delivery failed', metadata: null }]);

      // Act
      const deliveryResults = await notificationService.sendNotification(testNotification);

      // Assert
      expect(deliveryResults).toEqual(expect.arrayContaining([
        expect.objectContaining({ success: false, channel: NOTIFICATION_CHANNELS.EMAIL, error: 'Delivery failed' }),
      ]));
    });

    it('should respect quiet hours when sending notifications', async () => {
      // Arrange
      const mockNotificationRepository = createMockNotificationRepository();
      const mockUserRepository = createMockUserRepository();
      const mockEmailService = createMockEmailService();
      const notificationService = new NotificationService(
        mockNotificationRepository,
        mockUserRepository,
        mockEmailService
      );
      const testNotification = createTestNotification({ channels: [NOTIFICATION_CHANNELS.EMAIL], priority: NOTIFICATION_PRIORITIES.NORMAL });
      const testPreferences = createTestNotificationPreferences({
        channels: { [NOTIFICATION_CHANNELS.EMAIL]: true },
        quietHours: { enabled: true, start: '00:00', end: '23:59', timezone: 'UTC' },
      });
      mockUserRepository.findById.mockResolvedValue({ id: testNotification.userId, email: 'test@example.com', role: Roles.CLIENT } as User);

      // Act
      const deliveryResults = await notificationService.sendNotification(testNotification);

      // Assert
      expect(mockEmailService.deliverNotification).not.toHaveBeenCalled();
      expect(deliveryResults).toEqual([]);
    });
  });

  describe('Event handling', () => {
    it('should register event listeners correctly', () => {
      // Arrange
      const mockNotificationRepository = createMockNotificationRepository();
      const mockUserRepository = createMockUserRepository();
      const mockEmailService = createMockEmailService();
      const notificationService = new NotificationService(
        mockNotificationRepository,
        mockUserRepository,
        mockEmailService
      );
      const eventName = 'test.event';
      const mockListener = jest.fn();

      // Act
      notificationService.on(eventName, mockListener);
      notificationService['notificationEmitter'].emit(eventName, { data: 'test' });

      // Assert
      expect(mockListener).toHaveBeenCalledWith({ data: 'test' });
    });

    it('should register one-time event listeners correctly', () => {
      // Arrange
      const mockNotificationRepository = createMockNotificationRepository();
      const mockUserRepository = createMockUserRepository();
      const mockEmailService = createMockEmailService();
      const notificationService = new NotificationService(
        mockNotificationRepository,
        mockUserRepository,
        mockEmailService
      );
      const eventName = 'test.event';
      const mockListener = jest.fn();

      // Act
      notificationService.once(eventName, mockListener);
      notificationService['notificationEmitter'].emit(eventName, { data: 'test' });
      notificationService['notificationEmitter'].emit(eventName, { data: 'test2' });

      // Assert
      expect(mockListener).toHaveBeenCalledTimes(1);
      expect(mockListener).toHaveBeenCalledWith({ data: 'test' });
    });

    it('should remove event listeners correctly', () => {
      // Arrange
      const mockNotificationRepository = createMockNotificationRepository();
      const mockUserRepository = createMockUserRepository();
      const mockEmailService = createMockEmailService();
      const notificationService = new NotificationService(
        mockNotificationRepository,
        mockUserRepository,
        mockEmailService
      );
      const eventName = 'test.event';
      const mockListener = jest.fn();

      // Act
      notificationService.on(eventName, mockListener);
      notificationService.off(eventName, mockListener);
      notificationService['notificationEmitter'].emit(eventName, { data: 'test' });

      // Assert
      expect(mockListener).not.toHaveBeenCalled();
    });
  });
});