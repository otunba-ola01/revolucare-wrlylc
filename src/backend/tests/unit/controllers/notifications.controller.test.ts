import { Response } from 'express'; // express@^4.18.2
import { NotificationsController } from '../../../src/api/controllers/notifications.controller';
import { INotificationService } from '../../../src/interfaces/notification.interface';
import { AuthenticatedRequest } from '../../../src/interfaces/auth.interface';
import {
  mockNotifications,
  mockCreateNotificationDTOs,
  generateMockNotification,
  generateMockCreateNotificationDTO,
  mockNotificationPreferences
} from '../../fixtures/notifications.fixture';
import { mockUsers } from '../../fixtures/users.fixture';

// jest@^29.5.0
describe('NotificationsController', () => {
  let notificationService: jest.Mocked<INotificationService>;
  let controller: NotificationsController;

  beforeEach(() => {
    // Define mock notification service with jest mock functions
    notificationService = {
      createNotification: jest.fn(),
      getNotifications: jest.fn(),
      getNotificationById: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      deleteNotification: jest.fn(),
      getNotificationStats: jest.fn(),
      getNotificationPreferences: jest.fn(),
      updateNotificationPreferences: jest.fn(),
      sendNotification: jest.fn()
    } as jest.Mocked<INotificationService>;

    // Create instance of NotificationsController with mock service
    controller = new NotificationsController(notificationService);
  });

  it('createNotification', async () => {
    // Create mock request with notification data
    const mockRequest = {
      body: mockCreateNotificationDTOs[0],
    } as AuthenticatedRequest;

    // Create mock response
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    // Mock notificationService.createNotification to return a notification
    notificationService.createNotification.mockResolvedValue(mockNotifications[0]);

    // Call controller.createNotification with mock request and response
    await controller.createNotification(mockRequest, mockResponse);

    // Verify notificationService.createNotification was called with correct data
    expect(notificationService.createNotification).toHaveBeenCalledWith(mockRequest.body);

    // Verify response.status was called with 201
    expect(mockResponse.status).toHaveBeenCalledWith(201);

    // Verify response.json was called with success response containing created notification
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: true,
      message: 'Notification created successfully',
      data: mockNotifications[0],
    });
  });

  it('getNotifications', async () => {
    // Create mock request with user ID and query parameters
    const mockRequest = {
      user: { userId: mockUsers[0].id },
      query: { page: '1', limit: '10' },
    } as unknown as AuthenticatedRequest;

    // Create mock response
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    // Mock notificationService.getNotifications to return paginated notifications
    notificationService.getNotifications.mockResolvedValue({
      success: true,
      message: 'Notifications retrieved successfully',
      data: mockNotifications,
      pagination: {
        page: 1,
        limit: 10,
        totalItems: mockNotifications.length,
        totalPages: 1,
      },
    });

    // Call controller.getNotifications with mock request and response
    await controller.getNotifications(mockRequest, mockResponse);

    // Verify notificationService.getNotifications was called with correct parameters
    expect(notificationService.getNotifications).toHaveBeenCalledWith(
      mockUsers[0].id,
      mockRequest.query,
      1,
      10
    );

    // Verify response.status was called with 200
    expect(mockResponse.status).toHaveBeenCalledWith(200);

    // Verify response.json was called with paginated response
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: true,
      message: 'Notifications retrieved successfully',
      data: mockNotifications,
      pagination: {
        page: 1,
        limit: 10,
        totalItems: mockNotifications.length,
        totalPages: 1,
      },
    });
  });

  it('getNotificationById', async () => {
    // Create mock request with notification ID
    const mockRequest = {
      params: { id: mockNotifications[0].id },
    } as unknown as AuthenticatedRequest;

    // Create mock response
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    // Mock notificationService.getNotificationById to return a notification
    notificationService.getNotificationById.mockResolvedValue(mockNotifications[0]);

    // Call controller.getNotificationById with mock request and response
    await controller.getNotificationById(mockRequest, mockResponse);

    // Verify notificationService.getNotificationById was called with correct ID
    expect(notificationService.getNotificationById).toHaveBeenCalledWith(mockNotifications[0].id);

    // Verify response.status was called with 200
    expect(mockResponse.status).toHaveBeenCalledWith(200);

    // Verify response.json was called with success response containing notification
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: true,
      message: 'Notification retrieved successfully',
      data: mockNotifications[0],
    });
  });

  it('markAsRead', async () => {
    // Create mock request with notification ID
    const mockRequest = {
      params: { id: mockNotifications[0].id },
      user: { userId: mockUsers[0].id },
    } as unknown as AuthenticatedRequest;

    // Create mock response
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    // Mock notificationService.markAsRead to return updated notification
    notificationService.markAsRead.mockResolvedValue(generateMockNotification({
      ...mockNotifications[0],
      status: 'read',
      readAt: new Date()
    }));

    // Call controller.markAsRead with mock request and response
    await controller.markAsRead(mockRequest, mockResponse);

    // Verify notificationService.markAsRead was called with correct ID
    expect(notificationService.markAsRead).toHaveBeenCalledWith(mockNotifications[0].id, mockUsers[0].id);

    // Verify response.status was called with 200
    expect(mockResponse.status).toHaveBeenCalledWith(200);

    // Verify response.json was called with success response containing updated notification
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: true,
      message: 'Notification marked as read successfully',
      data: generateMockNotification({
        ...mockNotifications[0],
        status: 'read',
        readAt: expect.any(Date)
      }),
    });
  });

  it('markAllAsRead', async () => {
    // Create mock request with user ID
    const mockRequest = {
      user: { userId: mockUsers[0].id },
    } as unknown as AuthenticatedRequest;

    // Create mock response
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    // Mock notificationService.markAllAsRead to return count of updated notifications
    notificationService.markAllAsRead.mockResolvedValue(5);

    // Call controller.markAllAsRead with mock request and response
    await controller.markAllAsRead(mockRequest, mockResponse);

    // Verify notificationService.markAllAsRead was called with correct user ID
    expect(notificationService.markAllAsRead).toHaveBeenCalledWith(mockUsers[0].id);

    // Verify response.status was called with 200
    expect(mockResponse.status).toHaveBeenCalledWith(200);

    // Verify response.json was called with success response containing count
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: true,
      message: 'All notifications marked as read successfully',
      data: 5,
    });
  });

  it('deleteNotification', async () => {
    // Create mock request with notification ID
    const mockRequest = {
      params: { id: mockNotifications[0].id },
      user: { userId: mockUsers[0].id },
    } as unknown as AuthenticatedRequest;

    // Create mock response
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    // Mock notificationService.deleteNotification to return true
    notificationService.deleteNotification.mockResolvedValue(true);

    // Call controller.deleteNotification with mock request and response
    await controller.deleteNotification(mockRequest, mockResponse);

    // Verify notificationService.deleteNotification was called with correct ID
    expect(notificationService.deleteNotification).toHaveBeenCalledWith(mockNotifications[0].id, mockUsers[0].id);

    // Verify response.status was called with 200
    expect(mockResponse.status).toHaveBeenCalledWith(200);

    // Verify response.json was called with success response
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: true,
      message: 'Notification deleted successfully',
      data: true,
    });
  });

  it('getNotificationStats', async () => {
    // Create mock request with user ID
    const mockRequest = {
      user: { userId: mockUsers[0].id },
    } as unknown as AuthenticatedRequest;

    // Create mock response
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    // Mock notificationService.getNotificationStats to return stats object
    notificationService.getNotificationStats.mockResolvedValue({
      total: 10,
      unread: 3,
      byCategory: { appointment: 2, care_plan: 3, message: 5 },
      byPriority: { high: 4, normal: 6 },
    });

    // Call controller.getNotificationStats with mock request and response
    await controller.getNotificationStats(mockRequest, mockResponse);

    // Verify notificationService.getNotificationStats was called with correct user ID
    expect(notificationService.getNotificationStats).toHaveBeenCalledWith(mockUsers[0].id);

    // Verify response.status was called with 200
    expect(mockResponse.status).toHaveBeenCalledWith(200);

    // Verify response.json was called with success response containing stats
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: true,
      message: 'Notification statistics retrieved successfully',
      data: {
        total: 10,
        unread: 3,
        byCategory: { appointment: 2, care_plan: 3, message: 5 },
        byPriority: { high: 4, normal: 6 },
      },
    });
  });

  it('getNotificationPreferences', async () => {
    // Create mock request with user ID
    const mockRequest = {
      user: { userId: mockUsers[0].id },
    } as unknown as AuthenticatedRequest;

    // Create mock response
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    // Mock notificationService.getNotificationPreferences to return preferences object
    notificationService.getNotificationPreferences.mockResolvedValue(mockNotificationPreferences[0]);

    // Call controller.getNotificationPreferences with mock request and response
    await controller.getNotificationPreferences(mockRequest, mockResponse);

    // Verify notificationService.getNotificationPreferences was called with correct user ID
    expect(notificationService.getNotificationPreferences).toHaveBeenCalledWith(mockUsers[0].id);

    // Verify response.status was called with 200
    expect(mockResponse.status).toHaveBeenCalledWith(200);

    // Verify response.json was called with success response containing preferences
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: true,
      message: 'Notification preferences retrieved successfully',
      data: mockNotificationPreferences[0],
    });
  });

  it('updateNotificationPreferences', async () => {
    // Create mock request with user ID and preferences data
    const mockRequest = {
      user: { userId: mockUsers[0].id },
      body: {
        channels: { in_app: false, email: true },
        types: { appointment_reminder: { enabled: false, channels: [] } },
        quietHours: { enabled: false, start: '23:00', end: '07:00', timezone: 'UTC' }
      },
    } as unknown as AuthenticatedRequest;

    // Create mock response
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    // Mock notificationService.updateNotificationPreferences to return updated preferences
    notificationService.updateNotificationPreferences.mockResolvedValue({
      ...mockNotificationPreferences[0],
      channels: { in_app: false, email: true },
      types: { appointment_reminder: { enabled: false, channels: [] } },
      quietHours: { enabled: false, start: '23:00', end: '07:00', timezone: 'UTC' }
    });

    // Call controller.updateNotificationPreferences with mock request and response
    await controller.updateNotificationPreferences(mockRequest, mockResponse);

    // Verify notificationService.updateNotificationPreferences was called with correct parameters
    expect(notificationService.updateNotificationPreferences).toHaveBeenCalledWith(
      mockUsers[0].id,
      mockRequest.body
    );

    // Verify response.status was called with 200
    expect(mockResponse.status).toHaveBeenCalledWith(200);

    // Verify response.json was called with success response containing updated preferences
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: true,
      message: 'Notification preferences updated successfully',
      data: {
        ...mockNotificationPreferences[0],
        channels: { in_app: false, email: true },
        types: { appointment_reminder: { enabled: false, channels: [] } },
        quietHours: { enabled: false, start: '23:00', end: '07:00', timezone: 'UTC' }
      },
    });
  });

  it('error handling', async () => {
    // Mock notificationService method to throw an error
    notificationService.createNotification.mockRejectedValue(new Error('Test error'));

    // Create mock request and response
    const mockRequest = {
      body: mockCreateNotificationDTOs[0],
    } as AuthenticatedRequest;

    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    // Call controller method with mock request and response
    await controller.createNotification(mockRequest, mockResponse);

    // Verify response.status was called with appropriate error code
    expect(mockResponse.status).toHaveBeenCalledWith(500);

    // Verify response.json was called with error response
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: 'Failed to create notification',
      error: 'Test error',
    });
  });
});