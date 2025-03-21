import { CalendarIntegrationService } from '../../../src/services/calendar/calendar-integration.service';
import { GoogleCalendarIntegration } from '../../../src/integrations/google-calendar'; // googleapis ^118.0.0
import { MicrosoftGraphIntegration } from '../../../src/integrations/microsoft-graph'; // @microsoft/microsoft-graph-client v3.0.5, @azure/msal-node v1.17.2
import { GOOGLE_CALENDAR_PROVIDER, MICROSOFT_GRAPH_PROVIDER } from '../../../src/config/calendar';
import { TimeSlot } from '../../../src/types/provider.types';
import { MockGoogleCalendarIntegration, MockMicrosoftGraphIntegration, createMockCalendar, createMockEvent } from '../../mocks/calendar.mock';
import { ServiceStatus } from '../../../src/interfaces/external-service.interface';

/**
 * Helper function to create test time slots for availability testing
 * @param providerId The ID of the provider
 * @param count The number of time slots to create
 * @returns Array of time slots for testing
 */
function createTestTimeSlots(providerId: string, count: number): TimeSlot[] {
  const timeSlots: TimeSlot[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const startTime = new Date(now.getTime() + i * 60 * 60 * 1000); // Increment by 1 hour
    const endTime = new Date(startTime.getTime() + 30 * 60 * 1000); // 30-minute slots

    timeSlots.push({
      id: `slot_${i}`,
      providerId: providerId,
      startTime: startTime,
      endTime: endTime,
      serviceType: 'physical_therapy',
      isBooked: false,
      bookingId: null,
    });
  }

  return timeSlots;
}

describe('CalendarIntegrationService', () => {
  it('should initialize with Google and Microsoft providers', async () => {
    // Create a new CalendarIntegrationService instance
    const service = new CalendarIntegrationService();

    // Mock the Google and Microsoft calendar integrations
    const mockGoogle = new MockGoogleCalendarIntegration();
    const mockMicrosoft = new MockMicrosoftGraphIntegration();

    // Initialize the service
    await service.initialize();

    // Verify that both providers are available through getProvider method
    expect(service.getProvider(GOOGLE_CALENDAR_PROVIDER)).toBeDefined();
    expect(service.getProvider(MICROSOFT_GRAPH_PROVIDER)).toBeDefined();
  });

  it('should throw an error when accessing an uninitialized service', async () => {
    // Create a new CalendarIntegrationService instance without initializing
    const service = new CalendarIntegrationService();

    // Attempt to call getProvider method
    // Verify that an error is thrown with appropriate message
    expect(() => service.getProvider(GOOGLE_CALENDAR_PROVIDER)).toThrowError('Calendar integration service not initialized');
  });

  it('should throw an error when requesting an invalid provider', async () => {
    // Create and initialize a CalendarIntegrationService instance
    const service = new CalendarIntegrationService();
    await service.initialize();

    // Attempt to call getProvider with an invalid provider name
    // Verify that an error is thrown with appropriate message
    expect(() => service.getProvider('invalid-provider')).toThrowError("Calendar provider 'invalid-provider' not found");
  });

  it('should get authorization URL for Google Calendar', async () => {
    // Create and initialize a CalendarIntegrationService instance with mocked providers
    const service = new CalendarIntegrationService();
    await service.initialize();

    const mockGoogle = service.getProvider(GOOGLE_CALENDAR_PROVIDER) as MockGoogleCalendarIntegration;
    const mockAuthUrl = 'https://example.com/google/auth';

    // Mock the getAuthUrl method on the Google provider
    mockGoogle.getAuthUrl = jest.fn().mockResolvedValue(mockAuthUrl);

    // Call getAuthUrl on the service with Google provider name
    const authUrl = await service.getAuthUrl(GOOGLE_CALENDAR_PROVIDER, ['scope1', 'scope2']);

    // Verify that the correct URL is returned
    expect(authUrl).toBe(mockAuthUrl);
    expect(mockGoogle.getAuthUrl).toHaveBeenCalledWith(['scope1', 'scope2']);
  });

  it('should get authorization URL for Microsoft Graph', async () => {
    // Create and initialize a CalendarIntegrationService instance with mocked providers
    const service = new CalendarIntegrationService();
    await service.initialize();

    const mockMicrosoft = service.getProvider(MICROSOFT_GRAPH_PROVIDER) as MockMicrosoftGraphIntegration;
    const mockAuthUrl = 'https://example.com/microsoft/auth';

    // Mock the getAuthUrl method on the Microsoft provider
    mockMicrosoft.getAuthUrl = jest.fn().mockResolvedValue(mockAuthUrl);

    // Call getAuthUrl on the service with Microsoft provider name
    const authUrl = await service.getAuthUrl(MICROSOFT_GRAPH_PROVIDER, ['scope1', 'scope2']);

    // Verify that the correct URL is returned
    expect(authUrl).toBe(mockAuthUrl);
    expect(mockMicrosoft.getAuthUrl).toHaveBeenCalledWith(['scope1', 'scope2']);
  });

  it('should exchange code for tokens with Google Calendar', async () => {
    // Create and initialize a CalendarIntegrationService instance with mocked providers
    const service = new CalendarIntegrationService();
    await service.initialize();

    const mockGoogle = service.getProvider(GOOGLE_CALENDAR_PROVIDER) as MockGoogleCalendarIntegration;
    const mockTokens = { access_token: 'test_access_token', refresh_token: 'test_refresh_token', expiry_date: Date.now() + 3600 };

    // Mock the getTokenFromCode method on the Google provider
    mockGoogle.getTokenFromCode = jest.fn().mockResolvedValue(mockTokens);

    // Call getTokenFromCode on the service with Google provider name and a test code
    const tokens = await service.getTokenFromCode(GOOGLE_CALENDAR_PROVIDER, 'test_code');

    // Verify that the correct tokens are returned
    expect(tokens).toEqual(mockTokens);
    expect(mockGoogle.getTokenFromCode).toHaveBeenCalledWith('test_code');
  });

  it('should exchange code for tokens with Microsoft Graph', async () => {
    // Create and initialize a CalendarIntegrationService instance with mocked providers
    const service = new CalendarIntegrationService();
    await service.initialize();

    const mockMicrosoft = service.getProvider(MICROSOFT_GRAPH_PROVIDER) as MockMicrosoftGraphIntegration;
    const mockTokens = { access_token: 'test_access_token', refresh_token: 'test_refresh_token', expiry_date: Date.now() + 3600 };

    // Mock the getTokenFromCode method on the Microsoft provider
    mockMicrosoft.getTokenFromCode = jest.fn().mockResolvedValue(mockTokens);

    // Call getTokenFromCode on the service with Microsoft provider name and a test code
    const tokens = await service.getTokenFromCode(MICROSOFT_GRAPH_PROVIDER, 'test_code');

    // Verify that the correct tokens are returned
    expect(tokens).toEqual(mockTokens);
    expect(mockMicrosoft.getTokenFromCode).toHaveBeenCalledWith('test_code');
  });

  it('should set credentials for Google Calendar', async () => {
    // Create and initialize a CalendarIntegrationService instance with mocked providers
    const service = new CalendarIntegrationService();
    await service.initialize();

    const mockGoogle = service.getProvider(GOOGLE_CALENDAR_PROVIDER) as MockGoogleCalendarIntegration;
    const mockTokens = { access_token: 'test_access_token', refresh_token: 'test_refresh_token', expiry_date: Date.now() + 3600 };

    // Mock the setCredentials method on the Google provider
    mockGoogle.setCredentials = jest.fn().mockResolvedValue(undefined);

    // Call setCredentials on the service with Google provider name and test credentials
    await service.setCredentials(GOOGLE_CALENDAR_PROVIDER, mockTokens);

    // Verify that the credentials were set correctly
    expect(mockGoogle.setCredentials).toHaveBeenCalledWith(mockTokens);
  });

  it('should set credentials for Microsoft Graph', async () => {
    // Create and initialize a CalendarIntegrationService instance with mocked providers
    const service = new CalendarIntegrationService();
    await service.initialize();

    const mockMicrosoft = service.getProvider(MICROSOFT_GRAPH_PROVIDER) as MockMicrosoftGraphIntegration;
    const mockTokens = { access_token: 'test_access_token', refresh_token: 'test_refresh_token', expiry_date: Date.now() + 3600 };

    // Mock the setCredentials method on the Microsoft provider
    mockMicrosoft.setCredentials = jest.fn().mockResolvedValue(undefined);

    // Call setCredentials on the service with Google provider name and test credentials
    await service.setCredentials(MICROSOFT_GRAPH_PROVIDER, mockTokens);

    // Verify that the credentials were set correctly
    expect(mockMicrosoft.setCredentials).toHaveBeenCalledWith(mockTokens);
  });

  it('should list calendars from Google Calendar', async () => {
    // Create and initialize a CalendarIntegrationService instance with mocked providers
    const service = new CalendarIntegrationService();
    await service.initialize();

    const mockGoogle = service.getProvider(GOOGLE_CALENDAR_PROVIDER) as MockGoogleCalendarIntegration;
    const mockCalendars = [
      createMockCalendar({ id: 'cal1', name: 'Test Calendar 1' }),
      createMockCalendar({ id: 'cal2', name: 'Test Calendar 2' }),
    ];

    // Mock the listCalendars method on the Google provider to return test calendars
    mockGoogle.listCalendars = jest.fn().mockResolvedValue(mockCalendars);

    // Call listCalendars on the service with Google provider name
    const calendars = await service.listCalendars(GOOGLE_CALENDAR_PROVIDER);

    // Verify that the correct calendars are returned
    expect(calendars).toEqual(mockCalendars);
    expect(mockGoogle.listCalendars).toHaveBeenCalled();
  });

  it('should list calendars from Microsoft Graph', async () => {
    // Create and initialize a CalendarIntegrationService instance with mocked providers
    const service = new CalendarIntegrationService();
    await service.initialize();

    const mockMicrosoft = service.getProvider(MICROSOFT_GRAPH_PROVIDER) as MockMicrosoftGraphIntegration;
    const mockCalendars = [
      createMockCalendar({ id: 'cal1', name: 'Test Calendar 1' }),
      createMockCalendar({ id: 'cal2', name: 'Test Calendar 2' }),
    ];

    // Mock the listCalendars method on the Microsoft provider to return test calendars
    mockMicrosoft.listCalendars = jest.fn().mockResolvedValue(mockCalendars);

    // Call listCalendars on the service with Google provider name
    const calendars = await service.listCalendars(MICROSOFT_GRAPH_PROVIDER);

    // Verify that the correct calendars are returned
    expect(calendars).toEqual(mockCalendars);
    expect(mockMicrosoft.listCalendars).toHaveBeenCalled();
  });

  it('should create a calendar in Google Calendar', async () => {
    // Create and initialize a CalendarIntegrationService instance with mocked providers
    const service = new CalendarIntegrationService();
    await service.initialize();

    const mockGoogle = service.getProvider(GOOGLE_CALENDAR_PROVIDER) as MockGoogleCalendarIntegration;
    const mockCalendar = createMockCalendar({ id: 'newCal', name: 'New Test Calendar', description: 'Test Description' });

    // Mock the createCalendar method on the Google provider
    mockGoogle.createCalendar = jest.fn().mockResolvedValue(mockCalendar);

    // Call createCalendar on the service with Google provider name, test name, and description
    const calendar = await service.createCalendar(GOOGLE_CALENDAR_PROVIDER, 'New Test Calendar', 'Test Description');

    // Verify that the calendar is created correctly
    expect(calendar).toEqual(mockCalendar);
    expect(mockGoogle.createCalendar).toHaveBeenCalledWith('New Test Calendar', 'Test Description');
  });

  it('should create a calendar in Microsoft Graph', async () => {
    // Create and initialize a CalendarIntegrationService instance with mocked providers
    const service = new CalendarIntegrationService();
    await service.initialize();

    const mockMicrosoft = service.getProvider(MICROSOFT_GRAPH_PROVIDER) as MockMicrosoftGraphIntegration;
    const mockCalendar = createMockCalendar({ id: 'newCal', name: 'New Test Calendar', description: 'Test Description' });

    // Mock the createCalendar method on the Microsoft provider
    mockMicrosoft.createCalendar = jest.fn().mockResolvedValue(mockCalendar);

    // Call createCalendar on the service with Google provider name, test name, and description
    const calendar = await service.createCalendar(MICROSOFT_GRAPH_PROVIDER, 'New Test Calendar', 'Test Description');

    // Verify that the calendar is created correctly
    expect(calendar).toEqual(mockCalendar);
    expect(mockMicrosoft.createCalendar).toHaveBeenCalledWith('New Test Calendar', 'Test Description');
  });

  it('should get calendar events from Google Calendar', async () => {
    // Create and initialize a CalendarIntegrationService instance with mocked providers
    const service = new CalendarIntegrationService();
    await service.initialize();

    const mockGoogle = service.getProvider(GOOGLE_CALENDAR_PROVIDER) as MockGoogleCalendarIntegration;
    const mockEvents = [
      createMockEvent({ id: 'event1', summary: 'Test Event 1' }),
      createMockEvent({ id: 'event2', summary: 'Test Event 2' }),
    ];
    const startDate = new Date();
    const endDate = new Date(Date.now() + 86400000); // Tomorrow

    // Mock the getCalendarEvents method on the Google provider to return test events
    mockGoogle.getCalendarEvents = jest.fn().mockResolvedValue(mockEvents);

    // Call getCalendarEvents on the service with Google provider name, calendar ID, and date range
    const events = await service.getCalendarEvents(GOOGLE_CALENDAR_PROVIDER, 'testCalendar', startDate, endDate);

    // Verify that the correct events are returned
    expect(events).toEqual(mockEvents);
    expect(mockGoogle.getCalendarEvents).toHaveBeenCalledWith('testCalendar', startDate, endDate);
  });

  it('should get calendar events from Microsoft Graph', async () => {
    // Create and initialize a CalendarIntegrationService instance with mocked providers
    const service = new CalendarIntegrationService();
    await service.initialize();

    const mockMicrosoft = service.getProvider(MICROSOFT_GRAPH_PROVIDER) as MockMicrosoftGraphIntegration;
    const mockEvents = [
      createMockEvent({ id: 'event1', summary: 'Test Event 1' }),
      createMockEvent({ id: 'event2', summary: 'Test Event 2' }),
    ];
    const startDate = new Date();
    const endDate = new Date(Date.now() + 86400000); // Tomorrow

    // Mock the getCalendarEvents method on the Microsoft provider to return test events
    mockMicrosoft.getCalendarEvents = jest.fn().mockResolvedValue(mockEvents);

    // Call getCalendarEvents on the service with Google provider name, calendar ID, and date range
    const events = await service.getCalendarEvents(MICROSOFT_GRAPH_PROVIDER, 'testCalendar', startDate, endDate);

    // Verify that the correct events are returned
    expect(events).toEqual(mockEvents);
    expect(mockMicrosoft.getCalendarEvents).toHaveBeenCalledWith('testCalendar', startDate, endDate);
  });

  it('should create an event in Google Calendar', async () => {
    // Create and initialize a CalendarIntegrationService instance with mocked providers
    const service = new CalendarIntegrationService();
    await service.initialize();

    const mockGoogle = service.getProvider(GOOGLE_CALENDAR_PROVIDER) as MockGoogleCalendarIntegration;
    const mockEvent = createMockEvent({ id: 'newEvent', summary: 'New Test Event' });
    const eventDetails = { summary: 'New Test Event', start: new Date(), end: new Date() };

    // Mock the createEvent method on the Google provider
    mockGoogle.createEvent = jest.fn().mockResolvedValue(mockEvent);

    // Call createEvent on the service with Google provider name, calendar ID, and event details
    const event = await service.createEvent(GOOGLE_CALENDAR_PROVIDER, 'testCalendar', eventDetails);

    // Verify that the event is created correctly
    expect(event).toEqual(mockEvent);
    expect(mockGoogle.createEvent).toHaveBeenCalledWith('testCalendar', eventDetails);
  });

  it('should create an event in Microsoft Graph', async () => {
    // Create and initialize a CalendarIntegrationService instance with mocked providers
    const service = new CalendarIntegrationService();
    await service.initialize();

    const mockMicrosoft = service.getProvider(MICROSOFT_GRAPH_PROVIDER) as MockMicrosoftGraphIntegration;
    const mockEvent = createMockEvent({ id: 'newEvent', summary: 'New Test Event' });
    const eventDetails = { summary: 'New Test Event', start: new Date(), end: new Date() };

    // Mock the createEvent method on the Microsoft provider
    mockMicrosoft.createEvent = jest.fn().mockResolvedValue(mockEvent);

    // Call createEvent on the service with Google provider name, calendar ID, and event details
    const event = await service.createEvent(MICROSOFT_GRAPH_PROVIDER, 'testCalendar', eventDetails);

    // Verify that the event is created correctly
    expect(event).toEqual(mockEvent);
    expect(mockMicrosoft.createEvent).toHaveBeenCalledWith('testCalendar', eventDetails);
  });

  it('should update an event in Google Calendar', async () => {
    // Create and initialize a CalendarIntegrationService instance with mocked providers
    const service = new CalendarIntegrationService();
    await service.initialize();

    const mockGoogle = service.getProvider(GOOGLE_CALENDAR_PROVIDER) as MockGoogleCalendarIntegration;
    const mockEvent = createMockEvent({ id: 'updatedEvent', summary: 'Updated Test Event' });
    const eventDetails = { summary: 'Updated Test Event', start: new Date(), end: new Date() };

    // Mock the updateEvent method on the Google provider
    mockGoogle.updateEvent = jest.fn().mockResolvedValue(mockEvent);

    // Call updateEvent on the service with Google provider name, calendar ID, event ID, and updated details
    const event = await service.updateEvent(GOOGLE_CALENDAR_PROVIDER, 'testCalendar', 'testEventId', eventDetails);

    // Verify that the event is updated correctly
    expect(event).toEqual(mockEvent);
    expect(mockGoogle.updateEvent).toHaveBeenCalledWith('testCalendar', 'testEventId', eventDetails);
  });

  it('should update an event in Microsoft Graph', async () => {
    // Create and initialize a CalendarIntegrationService instance with mocked providers
    const service = new CalendarIntegrationService();
    await service.initialize();

    const mockMicrosoft = service.getProvider(MICROSOFT_GRAPH_PROVIDER) as MockMicrosoftGraphIntegration;
    const mockEvent = createMockEvent({ id: 'updatedEvent', summary: 'Updated Test Event' });
    const eventDetails = { summary: 'Updated Test Event', start: new Date(), end: new Date() };

    // Mock the updateEvent method on the Microsoft provider
    mockMicrosoft.updateEvent = jest.fn().mockResolvedValue(mockEvent);

    // Call updateEvent on the service with Google provider name, calendar ID, event ID, and updated details
    const event = await service.updateEvent(MICROSOFT_GRAPH_PROVIDER, 'testCalendar', 'testEventId', eventDetails);

    // Verify that the event is updated correctly
    expect(event).toEqual(mockEvent);
    expect(mockMicrosoft.updateEvent).toHaveBeenCalledWith('testCalendar', 'testEventId', eventDetails);
  });

  it('should delete an event from Google Calendar', async () => {
    // Create and initialize a CalendarIntegrationService instance with mocked providers
    const service = new CalendarIntegrationService();
    await service.initialize();

    const mockGoogle = service.getProvider(GOOGLE_CALENDAR_PROVIDER) as MockGoogleCalendarIntegration;

    // Mock the deleteEvent method on the Google provider to return true
    mockGoogle.deleteEvent = jest.fn().mockResolvedValue(true);

    // Call deleteEvent on the service with Google provider name, calendar ID, and event ID
    const result = await service.deleteEvent(GOOGLE_CALENDAR_PROVIDER, 'testCalendar', 'testEventId');

    // Verify that the deletion is successful
    expect(result).toBe(true);
    expect(mockGoogle.deleteEvent).toHaveBeenCalledWith('testCalendar', 'testEventId');
  });

  it('should delete an event from Microsoft Graph', async () => {
    // Create and initialize a CalendarIntegrationService instance with mocked providers
    const service = new CalendarIntegrationService();
    await service.initialize();

    const mockMicrosoft = service.getProvider(MICROSOFT_GRAPH_PROVIDER) as MockMicrosoftGraphIntegration;

    // Mock the deleteEvent method on the Microsoft provider to return true
    mockMicrosoft.deleteEvent = jest.fn().mockResolvedValue(true);

    // Call deleteEvent on the service with Google provider name, calendar ID, and event ID
    const result = await service.deleteEvent(MICROSOFT_GRAPH_PROVIDER, 'testCalendar', 'testEventId');

    // Verify that the deletion is successful
    expect(result).toBe(true);
    expect(mockMicrosoft.deleteEvent).toHaveBeenCalledWith('testCalendar', 'testEventId');
  });

  it('should sync provider availability with Google Calendar', async () => {
    // Create and initialize a CalendarIntegrationService instance with mocked providers
    const service = new CalendarIntegrationService();
    await service.initialize();

    const mockGoogle = service.getProvider(GOOGLE_CALENDAR_PROVIDER) as MockGoogleCalendarIntegration;
    const testTimeSlots = createTestTimeSlots('provider123', 3);

    // Mock the syncProviderAvailability method on the Google provider
    mockGoogle.syncProviderAvailability = jest.fn().mockResolvedValue({ added: 1, updated: 1, deleted: 1, errors: 0 });

    // Call syncProviderAvailability on the service with Google provider name, calendar ID, and time slots
    const syncResult = await service.syncProviderAvailability(GOOGLE_CALENDAR_PROVIDER, 'testCalendar', testTimeSlots);

    // Verify that the synchronization results are correct
    expect(syncResult).toEqual({ added: 1, updated: 1, deleted: 1, errors: 0 });
    expect(mockGoogle.syncProviderAvailability).toHaveBeenCalledWith('testCalendar', testTimeSlots);
  });

  it('should sync provider availability with Microsoft Graph', async () => {
    // Create and initialize a CalendarIntegrationService instance with mocked providers
    const service = new CalendarIntegrationService();
    await service.initialize();

    const mockMicrosoft = service.getProvider(MICROSOFT_GRAPH_PROVIDER) as MockMicrosoftGraphIntegration;
    const testTimeSlots = createTestTimeSlots('provider123', 3);

    // Mock the syncProviderAvailability method on the Microsoft provider
    mockMicrosoft.syncProviderAvailability = jest.fn().mockResolvedValue({ added: 1, updated: 1, deleted: 1, errors: 0 });

    // Call syncProviderAvailability on the service with Google provider name, calendar ID, and time slots
    const syncResult = await service.syncProviderAvailability(MICROSOFT_GRAPH_PROVIDER, 'testCalendar', testTimeSlots);

    // Verify that the synchronization results are correct
    expect(syncResult).toEqual({ added: 1, updated: 1, deleted: 1, errors: 0 });
    expect(mockMicrosoft.syncProviderAvailability).toHaveBeenCalledWith('testCalendar', testTimeSlots);
  });

  it('should set up webhook notifications for Google Calendar', async () => {
    // Create and initialize a CalendarIntegrationService instance with mocked providers
    const service = new CalendarIntegrationService();
    await service.initialize();

    const mockGoogle = service.getProvider(GOOGLE_CALENDAR_PROVIDER) as MockGoogleCalendarIntegration;
    const mockWebhookDetails = { id: 'webhook123', resourceId: 'resource123', expirationTime: '2024-01-01T00:00:00Z' };

    // Mock the setupWebhookNotifications method on the Google provider
    mockGoogle.setupWebhookNotifications = jest.fn().mockResolvedValue(mockWebhookDetails);

    // Call setupWebhookNotifications on the service with Google provider name, calendar ID, and notification URL
    const webhookDetails = await service.setupWebhookNotifications(GOOGLE_CALENDAR_PROVIDER, 'testCalendar', 'https://example.com/webhook');

    // Verify that the webhook details are returned correctly
    expect(webhookDetails).toEqual(mockWebhookDetails);
    expect(mockGoogle.setupWebhookNotifications).toHaveBeenCalledWith('testCalendar', 'https://example.com/webhook');
  });

  it('should set up webhook notifications for Microsoft Graph', async () => {
    // Create and initialize a CalendarIntegrationService instance with mocked providers
    const service = new CalendarIntegrationService();
    await service.initialize();

    const mockMicrosoft = service.getProvider(MICROSOFT_GRAPH_PROVIDER) as MockMicrosoftGraphIntegration;
    const mockWebhookDetails = { id: 'webhook123', resourceId: 'resource123', expirationTime: '2024-01-01T00:00:00Z' };

    // Mock the setupWebhookNotifications method on the Microsoft provider
    mockMicrosoft.setupWebhookNotifications = jest.fn().mockResolvedValue(mockWebhookDetails);

    // Call setupWebhookNotifications on the service with Google provider name, calendar ID, and notification URL
    const webhookDetails = await service.setupWebhookNotifications(MICROSOFT_GRAPH_PROVIDER, 'testCalendar', 'https://example.com/webhook');

    // Verify that the webhook details are returned correctly
    expect(webhookDetails).toEqual(mockWebhookDetails);
    expect(mockMicrosoft.setupWebhookNotifications).toHaveBeenCalledWith('testCalendar', 'https://example.com/webhook');
  });

  it('should stop webhook notifications for Google Calendar', async () => {
    // Create and initialize a CalendarIntegrationService instance with mocked providers
    const service = new CalendarIntegrationService();
    await service.initialize();

    const mockGoogle = service.getProvider(GOOGLE_CALENDAR_PROVIDER) as MockGoogleCalendarIntegration;

    // Mock the stopWebhookNotifications method on the Google provider to return true
    mockGoogle.stopWebhookNotifications = jest.fn().mockResolvedValue(true);

    // Call stopWebhookNotifications on the service with Google provider name, subscription ID, and resource ID
    const result = await service.stopWebhookNotifications(GOOGLE_CALENDAR_PROVIDER, 'testSubscription', 'testResource');

    // Verify that the operation is successful
    expect(result).toBe(true);
    expect(mockGoogle.stopWebhookNotifications).toHaveBeenCalledWith('testSubscription', 'testResource');
  });

  it('should stop webhook notifications for Microsoft Graph', async () => {
    // Create and initialize a CalendarIntegrationService instance with mocked providers
    const service = new CalendarIntegrationService();
    await service.initialize();

    const mockMicrosoft = service.getProvider(MICROSOFT_GRAPH_PROVIDER) as MockMicrosoftGraphIntegration;

    // Mock the stopWebhookNotifications method on the Microsoft provider to return true
    mockMicrosoft.stopWebhookNotifications = jest.fn().mockResolvedValue(true);

    // Call stopWebhookNotifications on the service with Google provider name, subscription ID, and resource ID
    const result = await service.stopWebhookNotifications(MICROSOFT_GRAPH_PROVIDER, 'testSubscription', 'testResource');

    // Verify that the operation is successful
    expect(result).toBe(true);
    expect(mockMicrosoft.stopWebhookNotifications).toHaveBeenCalledWith('testSubscription', 'testResource');
  });

  it('should validate webhook notifications from Google Calendar', async () => {
    // Create and initialize a CalendarIntegrationService instance with mocked providers
    const service = new CalendarIntegrationService();
    await service.initialize();

    const mockGoogle = service.getProvider(GOOGLE_CALENDAR_PROVIDER) as MockGoogleCalendarIntegration;
    const mockPayload = { body: { test: 'valid' }, headers: {} };

    // Mock the validateWebhook method on the Google provider to return true
    mockGoogle.validateWebhook = jest.fn().mockResolvedValue(true);

    // Call validateWebhook on the service with Google provider name, payload, and signature
    const result = await service.validateWebhook(GOOGLE_CALENDAR_PROVIDER, mockPayload, 'testSignature');

    // Verify that the validation is successful
    expect(result).toBe(true);
    expect(mockGoogle.validateWebhook).toHaveBeenCalledWith(mockPayload, 'testSignature');
  });

  it('should validate webhook notifications from Microsoft Graph', async () => {
    // Create and initialize a CalendarIntegrationService instance with mocked providers
    const service = new CalendarIntegrationService();
    await service.initialize();

    const mockMicrosoft = service.getProvider(MICROSOFT_GRAPH_PROVIDER) as MockMicrosoftGraphIntegration;
    const mockPayload = { body: { test: 'valid' }, headers: {} };

    // Mock the validateWebhook method on the Microsoft provider to return true
    mockMicrosoft.validateWebhook = jest.fn().mockResolvedValue(true);

    // Call validateWebhook on the service with Google provider name, payload, and signature
    const result = await service.validateWebhook(MICROSOFT_GRAPH_PROVIDER, mockPayload, 'testSignature');

    // Verify that the validation is successful
    expect(result).toBe(true);
    expect(mockMicrosoft.validateWebhook).toHaveBeenCalledWith(mockPayload, 'testSignature');
  });

  it('should get status of Google Calendar provider', async () => {
    // Create and initialize a CalendarIntegrationService instance with mocked providers
    const service = new CalendarIntegrationService();
    await service.initialize();

    const mockGoogle = service.getProvider(GOOGLE_CALENDAR_PROVIDER) as MockGoogleCalendarIntegration;
    const mockStatus = { status: 'available' as ServiceStatus, details: { test: 'test' } };

    // Mock the getStatus method on the Google provider to return available status
    mockGoogle.getStatus = jest.fn().mockResolvedValue(mockStatus);

    // Call getProviderStatus on the service with Google provider name
    const status = await service.getProviderStatus(GOOGLE_CALENDAR_PROVIDER);

    // Verify that the correct status is returned
    expect(status).toEqual(mockStatus);
    expect(mockGoogle.getStatus).toHaveBeenCalled();
  });

  it('should get status of Microsoft Graph provider', async () => {
    // Create and initialize a CalendarIntegrationService instance with mocked providers
    const service = new CalendarIntegrationService();
    await service.initialize();

    const mockMicrosoft = service.getProvider(MICROSOFT_GRAPH_PROVIDER) as MockMicrosoftGraphIntegration;
    const mockStatus = { status: 'available' as ServiceStatus, details: { test: 'test' } };

    // Mock the getStatus method on the Microsoft provider to return available status
    mockMicrosoft.getStatus = jest.fn().mockResolvedValue(mockStatus);

    // Call getProviderStatus on the service with Google provider name
    const status = await service.getProviderStatus(MICROSOFT_GRAPH_PROVIDER);

    // Verify that the correct status is returned
    expect(status).toEqual(mockStatus);
    expect(mockMicrosoft.getStatus).toHaveBeenCalled();
  });

  it('should get status of all providers', async () => {
    // Create and initialize a CalendarIntegrationService instance with mocked providers
    const service = new CalendarIntegrationService();
    await service.initialize();

    const mockGoogle = service.getProvider(GOOGLE_CALENDAR_PROVIDER) as MockGoogleCalendarIntegration;
    const mockMicrosoft = service.getProvider(MICROSOFT_GRAPH_PROVIDER) as MockMicrosoftGraphIntegration;

    // Mock the getStatus method on both providers to return different statuses
    mockGoogle.getStatus = jest.fn().mockResolvedValue({ status: 'available' as ServiceStatus, details: { test: 'google' } });
    mockMicrosoft.getStatus = jest.fn().mockResolvedValue({ status: 'unavailable' as ServiceStatus, details: { test: 'microsoft' } });

    // Call getAllProvidersStatus on the service
    const statuses = await service.getAllProvidersStatus();

    // Verify that the correct statuses are returned for all providers
    expect(statuses[GOOGLE_CALENDAR_PROVIDER]).toEqual({ status: 'available', details: { test: 'google' } });
    expect(statuses[MICROSOFT_GRAPH_PROVIDER]).toEqual({ status: 'unavailable', details: { test: 'microsoft' } });
    expect(mockGoogle.getStatus).toHaveBeenCalled();
    expect(mockMicrosoft.getStatus).toHaveBeenCalled();
  });

  it('should handle errors from Google Calendar provider', async () => {
    // Create and initialize a CalendarIntegrationService instance with mocked providers
    const service = new CalendarIntegrationService();
    await service.initialize();

    const mockGoogle = service.getProvider(GOOGLE_CALENDAR_PROVIDER) as MockGoogleCalendarIntegration;

    // Mock a method on the Google provider to throw an error
    mockGoogle.listCalendars = jest.fn().mockRejectedValue(new Error('Test Google Calendar Error'));

    // Call the corresponding method on the service
    // Verify that the error is properly propagated
    await expect(service.listCalendars(GOOGLE_CALENDAR_PROVIDER)).rejects.toThrowError('Failed to list Google Calendars');
  });

  it('should handle errors from Microsoft Graph provider', async () => {
    // Create and initialize a CalendarIntegrationService instance with mocked providers
    const service = new CalendarIntegrationService();
    await service.initialize();

    const mockMicrosoft = service.getProvider(MICROSOFT_GRAPH_PROVIDER) as MockMicrosoftGraphIntegration;

    // Mock a method on the Microsoft provider to throw an error
    mockMicrosoft.listCalendars = jest.fn().mockRejectedValue(new Error('Test Microsoft Graph Error'));

    // Call the corresponding method on the service
    // Verify that the error is properly propagated
    await expect(service.listCalendars(MICROSOFT_GRAPH_PROVIDER)).rejects.toThrowError('Failed to list Microsoft Graph calendars');
  });
});