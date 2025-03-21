# src/backend/tests/unit/services/analytics.service.test.ts
```typescript
import { AnalyticsService } from '../../../src/services/analytics.service';
import { IAnalyticsRepository } from '../../../src/interfaces/analytics.interface';
import { IAnalyticsCache } from '../../../src/interfaces/analytics.interface';
import { analyticsCache } from '../../../src/cache/analytics.cache';
import { BlobStorageService } from '../../../src/services/storage/blob-storage.service';
import {
  MetricsRequestDTO, MetricsResponse, DashboardRequestDTO, DashboardResponse,
  ReportRequestDTO, ReportResponse, ExportRequestDTO, ExportResponse,
  AnalyticsEventDTO, Dashboard, Metric
} from '../../../src/types/analytics.types';
import { METRIC_CATEGORIES, TIME_PERIODS, DEFAULT_METRIC_TTL, DEFAULT_DASHBOARD_TTL } from '../../../src/constants/metrics';
import { Roles } from '../../../src/constants/roles';
import { Queue } from 'bull'; // bull@^4.10.0
import { jest } from '@jest/globals'; // jest@^29.0.0

/**
 * Creates a mock implementation of the IAnalyticsRepository interface
 * @param overrides 
 * @returns {IAnalyticsRepository} Mocked repository implementation
 */
const createMockRepository = (overrides: Partial<IAnalyticsRepository> = {}): IAnalyticsRepository => {
  const mockRepository: IAnalyticsRepository = {
    getMetrics: jest.fn(),
    getDashboard: jest.fn(),
    saveDashboard: jest.fn(),
    saveMetric: jest.fn(),
    saveEvent: jest.fn(),
    getMetricHistory: jest.fn(),
    getUserActivityData: jest.fn(),
    getProviderPerformanceData: jest.fn(),
    getCarePlanOutcomeData: jest.fn(),
    getServiceUtilizationData: jest.fn(),
    ...overrides,
  };
  return mockRepository;
};

/**
 * Creates a mock implementation of the Bull Queue
 * @returns {Queue} Mocked Queue implementation
 */
const createMockQueue = (): Queue => {
  const mockQueue: any = {
    add: jest.fn(),
  };
  return mockQueue as Queue;
};

/**
 * Creates a mock implementation of the BlobStorageService
 * @returns {BlobStorageService} Mocked BlobStorageService implementation
 */
const createMockBlobStorageService = (): BlobStorageService => {
  const mockBlobStorageService: any = {
    uploadFile: jest.fn().mockResolvedValue({ storageUrl: 'test-url', contentType: 'test-content-type', size: 1024 }),
    generateSignedUrl: jest.fn().mockResolvedValue('signed-test-url'),
  };
  return mockBlobStorageService as BlobStorageService;
};

describe('AnalyticsService', () => {
  describe('constructor', () => {
    it('should initialize with the provided repository', () => {
      // Arrange
      const mockRepository = createMockRepository();

      // Act
      const service = new AnalyticsService(mockRepository);

      // Assert
      expect(service).toBeDefined();
    });
  });

  let service: AnalyticsService;
  let repository: IAnalyticsRepository;
  let analyticsQueue: Queue;
  let blobStorageService: BlobStorageService;

  beforeEach(() => {
    repository = createMockRepository();
    analyticsQueue = createMockQueue();
    blobStorageService = createMockBlobStorageService();
    service = new AnalyticsService(repository);
    (service as any).analyticsQueue = analyticsQueue;
    (service as any).storageService = blobStorageService;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getMetrics', () => {
    it('should return cached metrics when cache hit occurs', async () => {
      // Arrange
      const cachedMetrics: MetricsResponse = {
        metrics: [{ id: '1', name: 'test', description: 'test', category: 'user', value: 10, unit: 'count', trend: 'up', changePercentage: 5, period: 'monthly', lastUpdated: new Date() }],
        period: 'monthly',
        startDate: new Date(),
        endDate: new Date(),
      };
      jest.spyOn(analyticsCache, 'getMetrics').mockResolvedValue(cachedMetrics);

      const request: MetricsRequestDTO = {
        category: 'user',
        types: ['test'],
        period: 'monthly',
        startDate: new Date(),
        endDate: new Date(),
        filters: {},
      };

      // Act
      const result = await service.getMetrics(request);

      // Assert
      expect(analyticsCache.getMetrics).toHaveBeenCalledWith(
        request.category,
        request.period,
        request.startDate,
        request.endDate
      );
      expect(result).toEqual(cachedMetrics);
      expect(repository.getMetrics).not.toHaveBeenCalled();
    });

    it('should query repository and cache results on cache miss', async () => {
      // Arrange
      jest.spyOn(analyticsCache, 'getMetrics').mockResolvedValue(null);
      const metricsResponse: MetricsResponse = {
        metrics: [{ id: '1', name: 'test', description: 'test', category: 'user', value: 10, unit: 'count', trend: 'up', changePercentage: 5, period: 'monthly', lastUpdated: new Date() }],
        period: 'monthly',
        startDate: new Date(),
        endDate: new Date(),
      };
      (repository.getMetrics as jest.Mock).mockResolvedValue(metricsResponse);
      const setMetricsSpy = jest.spyOn(analyticsCache, 'setMetrics');

      const request: MetricsRequestDTO = {
        category: 'user',
        types: ['test'],
        period: 'monthly',
        startDate: new Date(),
        endDate: new Date(),
        filters: {},
      };

      // Act
      const result = await service.getMetrics(request);

      // Assert
      expect(analyticsCache.getMetrics).toHaveBeenCalledWith(
        request.category,
        request.period,
        request.startDate,
        request.endDate
      );
      expect(repository.getMetrics).toHaveBeenCalledWith(request);
      expect(setMetricsSpy).toHaveBeenCalledWith(
        request,
        metricsResponse,
        DEFAULT_METRIC_TTL
      );
      expect(result).toEqual(metricsResponse);
    });

    it('should throw error for invalid metrics request', async () => {
      // Arrange
      const invalidRequest1: any = {
        category: 'invalid',
        types: ['test'],
        period: 'monthly',
        startDate: new Date(),
        endDate: new Date(),
        filters: {},
      };

      const invalidRequest2: any = {
        category: 'user',
        types: ['test'],
        period: 'invalid',
        startDate: new Date(),
        endDate: new Date(),
        filters: {},
      };

      // Act & Assert
      await expect(service.getMetrics(invalidRequest1)).rejects.toThrowError();
      await expect(service.getMetrics(invalidRequest2)).rejects.toThrowError();
    });

    it('should propagate repository errors', async () => {
      // Arrange
      jest.spyOn(analyticsCache, 'getMetrics').mockResolvedValue(null);
      const errorMessage = 'Repository error';
      (repository.getMetrics as jest.Mock).mockRejectedValue(new Error(errorMessage));

      const request: MetricsRequestDTO = {
        category: 'user',
        types: ['test'],
        period: 'monthly',
        startDate: new Date(),
        endDate: new Date(),
        filters: {},
      };

      // Act & Assert
      await expect(service.getMetrics(request)).rejects.toThrowError(errorMessage);
    });
  });

  describe('getDashboard', () => {
    it('should return cached dashboard when cache hit occurs', async () => {
      // Arrange
      const cachedDashboard: DashboardResponse = {
        dashboard: { id: '1', userId: '1', role: Roles.CLIENT, title: 'test', description: 'test', widgets: [], layout: { columns: 12, rowHeight: 50, padding: 10, config: {} }, isDefault: false, lastViewed: new Date(), createdAt: new Date(), updatedAt: new Date() },
        metrics: [],
        period: 'monthly',
        startDate: new Date(),
        endDate: new Date(),
      };
      jest.spyOn(analyticsCache, 'getDashboard').mockResolvedValue(cachedDashboard);

      const request: DashboardRequestDTO = {
        userId: '1',
        role: Roles.CLIENT,
        period: 'monthly',
        startDate: new Date(),
        endDate: new Date(),
      };

      // Act
      const result = await service.getDashboard(request);

      // Assert
      expect(analyticsCache.getDashboard).toHaveBeenCalledWith(request.userId);
      expect(result).toEqual(cachedDashboard);
      expect(repository.getDashboard).not.toHaveBeenCalled();
    });

    it('should query repository and cache results on cache miss', async () => {
      // Arrange
      jest.spyOn(analyticsCache, 'getDashboard').mockResolvedValue(null);
      const dashboard: Dashboard = { id: '1', userId: '1', role: Roles.CLIENT, title: 'test', description: 'test', widgets: [], layout: { columns: 12, rowHeight: 50, padding: 10, config: {} }, isDefault: false, lastViewed: new Date(), createdAt: new Date(), updatedAt: new Date() };
      (repository.getDashboard as jest.Mock).mockResolvedValue(dashboard);
      (repository.getMetrics as jest.Mock).mockResolvedValue({ metrics: [] });
      const setDashboardSpy = jest.spyOn(analyticsCache, 'setDashboard');

      const request: DashboardRequestDTO = {
        userId: '1',
        role: Roles.CLIENT,
        period: 'monthly',
        startDate: new Date(),
        endDate: new Date(),
      };

      // Act
      const result = await service.getDashboard(request);

      // Assert
      expect(analyticsCache.getDashboard).toHaveBeenCalledWith(request.userId);
      expect(repository.getDashboard).toHaveBeenCalledWith(request.userId);
      expect(repository.getMetrics).toHaveBeenCalledTimes(0);
      expect(setDashboardSpy).toHaveBeenCalledWith(
        { dashboard, metrics: [], period: request.period, startDate: request.startDate, endDate: request.endDate },
        request.userId,
        request.role,
        DEFAULT_DASHBOARD_TTL
      );
      expect(result).toEqual({ dashboard, metrics: [], period: request.period, startDate: request.startDate, endDate: request.endDate });
    });

    it('should create default dashboard when repository returns null', async () => {
      // Arrange
      jest.spyOn(analyticsCache, 'getDashboard').mockResolvedValue(null);
      (repository.getDashboard as jest.Mock).mockResolvedValue(null);
      const dashboard: Dashboard = { id: 'default-1-NaN', userId: '1', role: Roles.CLIENT, title: 'Client Dashboard', description: 'Default dashboard for client role', widgets: [], layout: { columns: 12, rowHeight: 50, padding: 10, config: {} }, isDefault: true, lastViewed: new Date(), createdAt: new Date(), updatedAt: new Date() };
      (repository.saveDashboard as jest.Mock).mockResolvedValue(dashboard);
      (repository.getMetrics as jest.Mock).mockResolvedValue({ metrics: [] });

      const request: DashboardRequestDTO = {
        userId: '1',
        role: Roles.CLIENT,
        period: 'monthly',
        startDate: new Date(),
        endDate: new Date(),
      };

      // Act
      const result = await service.getDashboard(request);

      // Assert
      expect(repository.saveDashboard).toHaveBeenCalled();
      expect(result).toEqual({ dashboard, metrics: [], period: request.period, startDate: request.startDate, endDate: request.endDate });
    });

    it('should handle repository errors', async () => {
      // Arrange
      jest.spyOn(analyticsCache, 'getDashboard').mockResolvedValue(null);
      const errorMessage = 'Repository error';
      (repository.getDashboard as jest.Mock).mockRejectedValue(new Error(errorMessage));

      const request: DashboardRequestDTO = {
        userId: '1',
        role: Roles.CLIENT,
        period: 'monthly',
        startDate: new Date(),
        endDate: new Date(),
      };

      // Act & Assert
      await expect(service.getDashboard(request)).rejects.toThrowError(errorMessage);
    });
  });

  describe('generateReport', () => {
    it('should generate PDF report successfully', async () => {
      // Arrange
      (repository.getMetrics as jest.Mock).mockResolvedValue({ metrics: [] });
      (blobStorageService.uploadFile as jest.Mock).mockResolvedValue({ storageUrl: 'test-url', contentType: 'test-content-type', size: 1024 });
      (blobStorageService.generateSignedUrl as jest.Mock).mockResolvedValue('signed-test-url');

      const request: ReportRequestDTO = {
        name: 'Test Report',
        description: 'Test Description',
        categories: ['user'],
        metrics: [],
        period: 'monthly',
        startDate: new Date(),
        endDate: new Date(),
        format: 'pdf',
        filters: {},
        userId: '1',
      };

      // Act
      const result = await service.generateReport(request);

      // Assert
      expect(repository.getMetrics).toHaveBeenCalledWith(expect.objectContaining({ category: 'user' }));
      expect(blobStorageService.uploadFile).toHaveBeenCalled();
      expect(blobStorageService.generateSignedUrl).toHaveBeenCalledWith('test-url', expect.anything());
      expect(result).toEqual(expect.objectContaining({ url: 'signed-test-url' }));
    });

    it('should support multiple report formats', async () => {
      // Arrange
      (repository.getMetrics as jest.Mock).mockResolvedValue({ metrics: [] });
      (blobStorageService.uploadFile as jest.Mock).mockResolvedValue({ storageUrl: 'test-url', contentType: 'test-content-type', size: 1024 });
      (blobStorageService.generateSignedUrl as jest.Mock).mockResolvedValue('signed-test-url');

      const requestCSV: ReportRequestDTO = {
        name: 'Test Report',
        description: 'Test Description',
        categories: ['user'],
        metrics: [],
        period: 'monthly',
        startDate: new Date(),
        endDate: new Date(),
        format: 'csv',
        filters: {},
        userId: '1',
      };

      const requestExcel: ReportRequestDTO = {
        name: 'Test Report',
        description: 'Test Description',
        categories: ['user'],
        metrics: [],
        period: 'monthly',
        startDate: new Date(),
        endDate: new Date(),
        format: 'excel',
        filters: {},
        userId: '1',
      };

      const requestJSON: ReportRequestDTO = {
        name: 'Test Report',
        description: 'Test Description',
        categories: ['user'],
        metrics: [],
        period: 'monthly',
        startDate: new Date(),
        endDate: new Date(),
        format: 'json',
        filters: {},
        userId: '1',
      };

      // Act
      const resultCSV = await service.generateReport(requestCSV);
      const resultExcel = await service.generateReport(requestExcel);
      const resultJSON = await service.generateReport(requestJSON);

      // Assert
      expect(resultCSV).toEqual(expect.objectContaining({ url: 'signed-test-url' }));
      expect(resultExcel).toEqual(expect.objectContaining({ url: 'signed-test-url' }));
      expect(resultJSON).toEqual(expect.objectContaining({ url: 'signed-test-url' }));
    });

    it('should throw error for invalid report request', async () => {
      // Arrange
      const invalidRequest: any = {
        name: 'Test Report',
        description: 'Test Description',
        categories: ['user'],
        metrics: [],
        period: 'monthly',
        startDate: new Date(),
        endDate: new Date(),
        format: 'invalid',
        filters: {},
        userId: '1',
      };

      // Act & Assert
      await expect(service.generateReport(invalidRequest)).rejects.toThrowError();
    });

    it('should propagate errors from dependencies', async () => {
      // Arrange
      const errorMessage = 'Repository error';
      (repository.getMetrics as jest.Mock).mockRejectedValue(new Error(errorMessage));

      const request: ReportRequestDTO = {
        name: 'Test Report',
        description: 'Test Description',
        categories: ['user'],
        metrics: [],
        period: 'monthly',
        startDate: new Date(),
        endDate: new Date(),
        format: 'pdf',
        filters: {},
        userId: '1',
      };

      // Act & Assert
      await expect(service.generateReport(request)).rejects.toThrowError(errorMessage);

      const storageErrorMessage = 'Storage error';
      (repository.getMetrics as jest.Mock).mockResolvedValue({ metrics: [] });
      (blobStorageService.uploadFile as jest.Mock).mockRejectedValue(new Error(storageErrorMessage));
      await expect(service.generateReport(request)).rejects.toThrowError(storageErrorMessage);
    });
  });

  describe('exportData', () => {
    it('should export data successfully', async () => {
      // Arrange
      (repository as any).getUserActivityData = jest.fn().mockResolvedValue([]);
      (blobStorageService.uploadFile as jest.Mock).mockResolvedValue({ storageUrl: 'test-url', contentType: 'test-content-type', size: 1024 });
      (blobStorageService.generateSignedUrl as jest.Mock).mockResolvedValue('signed-test-url');

      const request: ExportRequestDTO = {
        dataType: 'user_activity',
        filters: {},
        format: 'csv',
      };

      // Act
      const result = await service.exportData(request);

      // Assert
      expect((repository as any).getUserActivityData).toHaveBeenCalledWith({});
      expect(blobStorageService.uploadFile).toHaveBeenCalled();
      expect(blobStorageService.generateSignedUrl).toHaveBeenCalledWith('test-url', expect.anything());
      expect(result).toEqual(expect.objectContaining({ exportUrl: 'signed-test-url' }));
    });

    it('should throw error for invalid export request', async () => {
      // Arrange
      const invalidRequest1: any = {
        dataType: 'invalid',
        filters: {},
        format: 'csv',
      };

      const invalidRequest2: any = {
        dataType: 'user_activity',
        filters: {},
        format: 'invalid',
      };

      // Act & Assert
      await expect(service.exportData(invalidRequest1)).rejects.toThrowError();
      await expect(service.exportData(invalidRequest2)).rejects.toThrowError();
    });

    it('should propagate errors from dependencies', async () => {
      // Arrange
      const errorMessage = 'Repository error';
      (repository as any).getUserActivityData = jest.fn().mockRejectedValue(new Error(errorMessage));

      const request: ExportRequestDTO = {
        dataType: 'user_activity',
        filters: {},
        format: 'csv',
      };

      // Act & Assert
      await expect(service.exportData(request)).rejects.toThrowError(errorMessage);
    });
  });

  describe('trackEvent', () => {
    it('should queue event for processing', async () => {
      // Arrange
      const event: AnalyticsEventDTO = {
        userId: '1',
        userRole: Roles.CLIENT,
        eventType: 'test',
        eventData: {},
        timestamp: new Date(),
      };

      // Act
      await service.trackEvent(event);

      // Assert
      expect(analyticsQueue.add).toHaveBeenCalledWith('analytics:event', { event }, expect.anything());
    });

    it('should validate event data', async () => {
      // Arrange
      const invalidEvent: any = {
        userRole: Roles.CLIENT,
        eventData: {},
        timestamp: new Date(),
      };

      // Act & Assert
      await expect(service.trackEvent(invalidEvent)).rejects.toThrowError();
    });

    it('should propagate queue errors', async () => {
      // Arrange
      const errorMessage = 'Queue error';
      (analyticsQueue.add as jest.Mock).mockRejectedValue(new Error(errorMessage));

      const event: AnalyticsEventDTO = {
        userId: '1',
        userRole: Roles.CLIENT,
        eventType: 'test',
        eventData: {},
        timestamp: new Date(),
      };

      // Act & Assert
      await expect(service.trackEvent(event)).rejects.toThrowError(errorMessage);
    });
  });

  describe('calculateMetrics', () => {
    it('should queue metrics calculation job', async () => {
      // Arrange
      const category = 'user';
      const period = 'monthly';
      const startDate = new Date();
      const endDate = new Date();

      // Act
      await service.calculateMetrics(category, period, startDate, endDate);

      // Assert
      expect(analyticsQueue.add).toHaveBeenCalledWith('analytics:calculateMetrics', {
        category,
        period,
        startDate,
        endDate
      }, expect.anything());
    });

    it('should throw error for invalid parameters', async () => {
      // Arrange
      const category = 'invalid';
      const period = 'monthly';
      const startDate = new Date();
      const endDate = new Date();

      // Act & Assert
      await expect(service.calculateMetrics(category, period, startDate, endDate)).rejects.toThrowError();
      await expect(service.calculateMetrics('user', 'invalid', startDate, endDate)).rejects.toThrowError();
    });
  });
});