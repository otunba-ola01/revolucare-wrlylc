import { ExternalServiceInterface, ServiceStatus, WebhookPayload } from '../../src/interfaces/external-service.interface';
import { TimeSlot } from '../../src/types/provider.types';
import { GOOGLE_CALENDAR_PROVIDER, MICROSOFT_GRAPH_PROVIDER } from '../../src/config/calendar';

/**
 * Creates a mock calendar object with the given properties
 */
export function createMockCalendar(calendarProps: Partial<{ id: string; name: string; description?: string; isPrimary?: boolean }> = {}) {
  const defaultCalendar = {
    id: `cal_${Math.random().toString(36).substring(2, 10)}`,
    name: 'Mock Calendar',
    description: 'A mock calendar for testing',
    isPrimary: false
  };
  
  return { ...defaultCalendar, ...calendarProps };
}

/**
 * Creates a mock calendar event object with the given properties
 */
export function createMockEvent(eventProps: Partial<{ id: string; summary: string; description?: string; start: Date; end: Date; status: string }> = {}) {
  const now = new Date();
  const later = new Date();
  later.setHours(later.getHours() + 1);
  
  const defaultEvent = {
    id: `event_${Math.random().toString(36).substring(2, 10)}`,
    summary: 'Mock Event',
    description: 'A mock event for testing',
    start: now,
    end: later,
    status: 'confirmed'
  };
  
  return { ...defaultEvent, ...eventProps };
}

/**
 * Mock implementation of the Google Calendar integration for testing
 */
export class MockGoogleCalendarIntegration implements ExternalServiceInterface {
  private initialized = false;
  private credentials: { access_token: string; refresh_token: string; expiry_date: number } | null = null;
  private mockCalendars: Array<{ id: string; name: string; description?: string; isPrimary?: boolean }> = [];
  private mockEvents: Record<string, Array<{ id: string; summary: string; description?: string; start: Date; end: Date; status: string }>> = {};

  constructor() {
    // Initialize with empty state
  }

  async initialize(): Promise<void> {
    this.initialized = true;
    // Create some default calendars for testing
    this.mockCalendars = [
      createMockCalendar({ id: 'primary', name: 'Primary Calendar', isPrimary: true }),
      createMockCalendar({ id: 'work', name: 'Work Calendar' }),
      createMockCalendar({ id: 'personal', name: 'Personal Calendar' })
    ];
    
    return Promise.resolve();
  }

  async getAuthUrl(scopes: string[]): Promise<string> {
    this.ensureInitialized();
    return Promise.resolve(`https://accounts.google.com/o/oauth2/v2/auth?scope=${scopes.join('%20')}&mock=true`);
  }

  async getTokenFromCode(code: string): Promise<{ access_token: string; refresh_token: string; expiry_date: number }> {
    this.ensureInitialized();
    
    // Mock token response
    this.credentials = {
      access_token: `mock_access_token_${Math.random().toString(36).substring(2, 10)}`,
      refresh_token: `mock_refresh_token_${Math.random().toString(36).substring(2, 10)}`,
      expiry_date: Date.now() + 3600000 // 1 hour from now
    };
    
    return Promise.resolve(this.credentials);
  }

  async setCredentials(credentials: { access_token: string; refresh_token: string; expiry_date: number }): Promise<void> {
    this.ensureInitialized();
    this.credentials = credentials;
    return Promise.resolve();
  }

  async request<T>(method: string, endpoint: string, params: Record<string, any> = {}): Promise<T> {
    this.ensureInitialized();
    this.ensureCredentials();
    
    // Simulate API responses based on the endpoint and method
    if (endpoint.includes('/calendars') && method === 'GET') {
      return this.mockCalendars as unknown as T;
    } else if (endpoint.includes('/events') && method === 'GET') {
      const calendarId = endpoint.split('/')[1] || 'primary';
      return (this.mockEvents[calendarId] || []) as unknown as T;
    }
    
    // Simulate errors for specific test cases
    if (params.simulateError) {
      throw new Error('Simulated API error');
    }
    
    return {} as T;
  }

  async listCalendars(): Promise<Array<{ id: string; name: string; description?: string; isPrimary?: boolean }>> {
    this.ensureInitialized();
    this.ensureCredentials();
    return Promise.resolve(this.mockCalendars);
  }

  async createCalendar(name: string, description: string): Promise<{ id: string; name: string; description: string }> {
    this.ensureInitialized();
    this.ensureCredentials();
    
    const newCalendar = createMockCalendar({ name, description });
    this.mockCalendars.push(newCalendar);
    
    return Promise.resolve(newCalendar as { id: string; name: string; description: string });
  }

  async getCalendarEvents(
    calendarId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Array<{ id: string; summary: string; description?: string; start: Date; end: Date; status: string }>> {
    this.ensureInitialized();
    this.ensureCredentials();
    
    const events = this.mockEvents[calendarId] || [];
    
    // Filter by date range if specified
    if (startDate && endDate) {
      return events.filter(event => event.start >= startDate && event.end <= endDate);
    }
    
    return Promise.resolve(events);
  }

  async createEvent(
    calendarId: string,
    eventDetails: { 
      summary: string; 
      description?: string; 
      start: Date; 
      end: Date; 
      attendees?: Array<{ email: string; name?: string }>; 
      location?: string;
    }
  ): Promise<{ id: string; summary: string; description?: string; start: Date; end: Date; status: string }> {
    this.ensureInitialized();
    this.ensureCredentials();
    
    const newEvent = createMockEvent({
      summary: eventDetails.summary,
      description: eventDetails.description,
      start: eventDetails.start,
      end: eventDetails.end
    });
    
    // Initialize the calendar's events array if it doesn't exist
    if (!this.mockEvents[calendarId]) {
      this.mockEvents[calendarId] = [];
    }
    
    this.mockEvents[calendarId].push(newEvent);
    
    return Promise.resolve(newEvent);
  }

  async updateEvent(
    calendarId: string,
    eventId: string,
    eventDetails: { 
      summary?: string; 
      description?: string; 
      start?: Date; 
      end?: Date; 
      attendees?: Array<{ email: string; name?: string }>; 
      location?: string;
    }
  ): Promise<{ id: string; summary: string; description?: string; start: Date; end: Date; status: string }> {
    this.ensureInitialized();
    this.ensureCredentials();
    
    const events = this.mockEvents[calendarId] || [];
    const eventIndex = events.findIndex(e => e.id === eventId);
    
    if (eventIndex === -1) {
      throw new Error(`Event with ID ${eventId} not found in calendar ${calendarId}`);
    }
    
    // Update the event with new details
    const updatedEvent = {
      ...events[eventIndex],
      ...eventDetails
    };
    
    events[eventIndex] = updatedEvent;
    
    return Promise.resolve(updatedEvent);
  }

  async deleteEvent(calendarId: string, eventId: string): Promise<boolean> {
    this.ensureInitialized();
    this.ensureCredentials();
    
    const events = this.mockEvents[calendarId] || [];
    const eventIndex = events.findIndex(e => e.id === eventId);
    
    if (eventIndex === -1) {
      return Promise.resolve(false);
    }
    
    // Remove the event
    events.splice(eventIndex, 1);
    
    return Promise.resolve(true);
  }

  async syncProviderAvailability(
    calendarId: string,
    availabilitySlots: TimeSlot[]
  ): Promise<{ added: number; updated: number; deleted: number; errors: number }> {
    this.ensureInitialized();
    this.ensureCredentials();
    
    // Mock implementation of syncing provider availability
    let added = 0;
    let updated = 0;
    let deleted = 0;
    let errors = 0;
    
    // Initialize calendar events if not exist
    if (!this.mockEvents[calendarId]) {
      this.mockEvents[calendarId] = [];
    }
    
    // Convert availability slots to calendar events
    for (const slot of availabilitySlots) {
      try {
        // Check if event already exists by looking for matching start time
        const existingEventIndex = this.mockEvents[calendarId].findIndex(
          e => e.start.getTime() === slot.startTime.getTime()
        );
        
        if (existingEventIndex === -1) {
          // Add new event
          this.mockEvents[calendarId].push(createMockEvent({
            summary: `Available: ${slot.serviceType}`,
            start: slot.startTime,
            end: slot.endTime,
            status: slot.isBooked ? 'confirmed' : 'tentative'
          }));
          added++;
        } else {
          // Update existing event
          this.mockEvents[calendarId][existingEventIndex] = {
            ...this.mockEvents[calendarId][existingEventIndex],
            summary: `Available: ${slot.serviceType}`,
            start: slot.startTime,
            end: slot.endTime,
            status: slot.isBooked ? 'confirmed' : 'tentative'
          };
          updated++;
        }
      } catch (error) {
        errors++;
      }
    }
    
    return Promise.resolve({ added, updated, deleted, errors });
  }

  async setupWebhookNotifications(
    calendarId: string,
    notificationUrl: string
  ): Promise<{ id: string; resourceId?: string; expirationTime: string }> {
    this.ensureInitialized();
    this.ensureCredentials();
    
    // Mock webhook setup
    return Promise.resolve({
      id: `webhook_${Math.random().toString(36).substring(2, 10)}`,
      resourceId: calendarId,
      expirationTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 1 week from now
    });
  }

  async stopWebhookNotifications(subscriptionId: string, resourceId: string): Promise<boolean> {
    this.ensureInitialized();
    this.ensureCredentials();
    
    // Mock webhook cancellation
    return Promise.resolve(true);
  }

  async validateWebhook(payload: WebhookPayload, signature: string): Promise<boolean> {
    // Mock webhook validation
    // In a real implementation, this would verify the signature against the payload
    return Promise.resolve(payload.body.test === 'valid');
  }

  async getStatus(): Promise<{ status: ServiceStatus; details?: Record<string, any> }> {
    // Return mock status
    if (this.initialized) {
      return Promise.resolve({
        status: 'available',
        details: {
          lastSync: new Date().toISOString(),
          rateLimitRemaining: 100,
          provider: GOOGLE_CALENDAR_PROVIDER
        }
      });
    }
    
    return Promise.resolve({
      status: 'unavailable',
      details: {
        reason: 'Not initialized',
        provider: GOOGLE_CALENDAR_PROVIDER
      }
    });
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('Google Calendar integration is not initialized');
    }
  }

  private ensureCredentials(): void {
    if (!this.credentials) {
      throw new Error('Google Calendar integration is not authenticated');
    }
  }
}

/**
 * Mock implementation of the Microsoft Graph (Outlook) integration for testing
 */
export class MockMicrosoftGraphIntegration implements ExternalServiceInterface {
  private initialized = false;
  private credentials: { access_token: string; refresh_token: string; expiry_date: number } | null = null;
  private mockCalendars: Array<{ id: string; name: string; description?: string; isPrimary?: boolean }> = [];
  private mockEvents: Record<string, Array<{ id: string; summary: string; description?: string; start: Date; end: Date; status: string }>> = {};

  constructor() {
    // Initialize with empty state
  }

  async initialize(): Promise<void> {
    this.initialized = true;
    // Create some default calendars for testing
    this.mockCalendars = [
      createMockCalendar({ id: 'primary', name: 'Calendar', isPrimary: true }),
      createMockCalendar({ id: 'AQMkADAwATM0MDAAMS1hODVkLTQ5MTUtMDACLTAwCgBGAAAD3Sf0rQrFd0uA8Pxr9SS1TQcAebZUJ8FJa0qhUfwUasVkKAAAAgEGAAAAebZUJ8FJa0qhUfwUasVkKAABEHnQJwAAAA==', name: 'Work Calendar' }),
      createMockCalendar({ id: 'AQMkADAwATM0MDAAMS1hODVkLTQ5MTUtMDACLTAwCgBGAAAD3Sf0rQrFd0uA8Pxr9SS1TQcAebZUJ8FJa0qhUfwUasVkKAAAAgEHAAAAebZUJ8FJa0qhUfwUasVkKAABEHnQKAAAAA==', name: 'Personal Calendar' })
    ];
    
    return Promise.resolve();
  }

  async getAuthUrl(scopes: string[]): Promise<string> {
    this.ensureInitialized();
    return Promise.resolve(`https://login.microsoftonline.com/common/oauth2/v2.0/authorize?scope=${scopes.join('%20')}&mock=true`);
  }

  async getTokenFromCode(code: string): Promise<{ access_token: string; refresh_token: string; expiry_date: number }> {
    this.ensureInitialized();
    
    // Mock token response
    this.credentials = {
      access_token: `mock_ms_access_token_${Math.random().toString(36).substring(2, 10)}`,
      refresh_token: `mock_ms_refresh_token_${Math.random().toString(36).substring(2, 10)}`,
      expiry_date: Date.now() + 3600000 // 1 hour from now
    };
    
    return Promise.resolve(this.credentials);
  }

  async setCredentials(credentials: { access_token: string; refresh_token: string; expiry_date: number }): Promise<void> {
    this.ensureInitialized();
    this.credentials = credentials;
    return Promise.resolve();
  }

  async request<T>(method: string, endpoint: string, params: Record<string, any> = {}): Promise<T> {
    this.ensureInitialized();
    this.ensureCredentials();
    
    // Simulate API responses based on the endpoint and method
    if (endpoint.includes('/me/calendars') && method === 'GET') {
      return { value: this.mockCalendars } as unknown as T;
    } else if (endpoint.includes('/events') && method === 'GET') {
      const calendarId = endpoint.split('/')[2] || 'primary';
      return { value: this.mockEvents[calendarId] || [] } as unknown as T;
    }
    
    // Simulate errors for specific test cases
    if (params.simulateError) {
      throw new Error('Simulated Microsoft API error');
    }
    
    return {} as T;
  }

  async listCalendars(): Promise<Array<{ id: string; name: string; description?: string; isPrimary?: boolean }>> {
    this.ensureInitialized();
    this.ensureCredentials();
    return Promise.resolve(this.mockCalendars);
  }

  async createCalendar(name: string, description: string): Promise<{ id: string; name: string; description: string }> {
    this.ensureInitialized();
    this.ensureCredentials();
    
    const newCalendar = createMockCalendar({ 
      id: `AQMkADAwATM0MDAAMS1hODVkLTQ5MTUtMDACLTAwCgBGAAAD3Sf0rQrFd0uA8Pxr9SS1TQcAebZUJ8FJa0qhUfwUasVkKAAAAgEIAAAAebZUJ8FJa0qhUfwUasVkKAABEHnQKgAAAA==`, 
      name, 
      description 
    });
    this.mockCalendars.push(newCalendar);
    
    return Promise.resolve(newCalendar as { id: string; name: string; description: string });
  }

  async getCalendarEvents(
    calendarId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Array<{ id: string; summary: string; description?: string; start: Date; end: Date; status: string }>> {
    this.ensureInitialized();
    this.ensureCredentials();
    
    const events = this.mockEvents[calendarId] || [];
    
    // Filter by date range if specified
    if (startDate && endDate) {
      return events.filter(event => event.start >= startDate && event.end <= endDate);
    }
    
    return Promise.resolve(events);
  }

  async createEvent(
    calendarId: string,
    eventDetails: { 
      summary: string; 
      description?: string; 
      start: Date; 
      end: Date; 
      attendees?: Array<{ email: string; name?: string }>; 
      location?: string;
    }
  ): Promise<{ id: string; summary: string; description?: string; start: Date; end: Date; status: string }> {
    this.ensureInitialized();
    this.ensureCredentials();
    
    const newEvent = createMockEvent({
      summary: eventDetails.summary,
      description: eventDetails.description,
      start: eventDetails.start,
      end: eventDetails.end
    });
    
    // Initialize the calendar's events array if it doesn't exist
    if (!this.mockEvents[calendarId]) {
      this.mockEvents[calendarId] = [];
    }
    
    this.mockEvents[calendarId].push(newEvent);
    
    return Promise.resolve(newEvent);
  }

  async updateEvent(
    calendarId: string,
    eventId: string,
    eventDetails: { 
      summary?: string; 
      description?: string; 
      start?: Date; 
      end?: Date; 
      attendees?: Array<{ email: string; name?: string }>; 
      location?: string;
    }
  ): Promise<{ id: string; summary: string; description?: string; start: Date; end: Date; status: string }> {
    this.ensureInitialized();
    this.ensureCredentials();
    
    const events = this.mockEvents[calendarId] || [];
    const eventIndex = events.findIndex(e => e.id === eventId);
    
    if (eventIndex === -1) {
      throw new Error(`Event with ID ${eventId} not found in calendar ${calendarId}`);
    }
    
    // Update the event with new details
    const updatedEvent = {
      ...events[eventIndex],
      ...eventDetails
    };
    
    events[eventIndex] = updatedEvent;
    
    return Promise.resolve(updatedEvent);
  }

  async deleteEvent(calendarId: string, eventId: string): Promise<boolean> {
    this.ensureInitialized();
    this.ensureCredentials();
    
    const events = this.mockEvents[calendarId] || [];
    const eventIndex = events.findIndex(e => e.id === eventId);
    
    if (eventIndex === -1) {
      return Promise.resolve(false);
    }
    
    // Remove the event
    events.splice(eventIndex, 1);
    
    return Promise.resolve(true);
  }

  async syncProviderAvailability(
    calendarId: string,
    availabilitySlots: TimeSlot[]
  ): Promise<{ added: number; updated: number; deleted: number; errors: number }> {
    this.ensureInitialized();
    this.ensureCredentials();
    
    // Mock implementation of syncing provider availability
    let added = 0;
    let updated = 0;
    let deleted = 0;
    let errors = 0;
    
    // Initialize calendar events if not exist
    if (!this.mockEvents[calendarId]) {
      this.mockEvents[calendarId] = [];
    }
    
    // Convert availability slots to calendar events
    for (const slot of availabilitySlots) {
      try {
        // Check if event already exists by looking for matching start time
        const existingEventIndex = this.mockEvents[calendarId].findIndex(
          e => e.start.getTime() === slot.startTime.getTime()
        );
        
        if (existingEventIndex === -1) {
          // Add new event
          this.mockEvents[calendarId].push(createMockEvent({
            summary: `Available: ${slot.serviceType}`,
            start: slot.startTime,
            end: slot.endTime,
            status: slot.isBooked ? 'busy' : 'free'
          }));
          added++;
        } else {
          // Update existing event
          this.mockEvents[calendarId][existingEventIndex] = {
            ...this.mockEvents[calendarId][existingEventIndex],
            summary: `Available: ${slot.serviceType}`,
            start: slot.startTime,
            end: slot.endTime,
            status: slot.isBooked ? 'busy' : 'free'
          };
          updated++;
        }
      } catch (error) {
        errors++;
      }
    }
    
    return Promise.resolve({ added, updated, deleted, errors });
  }

  async setupWebhookNotifications(
    calendarId: string,
    notificationUrl: string
  ): Promise<{ id: string; resourceId?: string; expirationTime: string }> {
    this.ensureInitialized();
    this.ensureCredentials();
    
    // Mock webhook setup - Microsoft uses 'subscriptions'
    return Promise.resolve({
      id: `subscription_${Math.random().toString(36).substring(2, 10)}`,
      resourceId: calendarId,
      expirationTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days from now (Microsoft limitation)
    });
  }

  async stopWebhookNotifications(subscriptionId: string, resourceId: string): Promise<boolean> {
    this.ensureInitialized();
    this.ensureCredentials();
    
    // Mock webhook cancellation
    return Promise.resolve(true);
  }

  async validateWebhook(payload: WebhookPayload, signature: string): Promise<boolean> {
    // Mock webhook validation
    // Microsoft Graph uses a validation token during subscription
    return Promise.resolve(payload.body.validationToken !== undefined || payload.body.test === 'valid');
  }

  async getStatus(): Promise<{ status: ServiceStatus; details?: Record<string, any> }> {
    // Return mock status
    if (this.initialized) {
      return Promise.resolve({
        status: 'available',
        details: {
          lastSync: new Date().toISOString(),
          throttleStatus: 'normal',
          provider: MICROSOFT_GRAPH_PROVIDER
        }
      });
    }
    
    return Promise.resolve({
      status: 'unavailable',
      details: {
        reason: 'Not initialized',
        provider: MICROSOFT_GRAPH_PROVIDER
      }
    });
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('Microsoft Graph integration is not initialized');
    }
  }

  private ensureCredentials(): void {
    if (!this.credentials) {
      throw new Error('Microsoft Graph integration is not authenticated');
    }
  }
}

/**
 * Mock implementation of the CalendarIntegrationService for testing
 */
export class MockCalendarIntegrationService {
  private providers: Map<string, ExternalServiceInterface> = new Map();
  private initialized = false;

  constructor() {
    // Initialize empty providers map
  }

  async initialize(): Promise<void> {
    // Initialize mock providers
    const googleCalendar = new MockGoogleCalendarIntegration();
    await googleCalendar.initialize();
    
    const microsoftGraph = new MockMicrosoftGraphIntegration();
    await microsoftGraph.initialize();
    
    // Add providers to the map
    this.providers.set(GOOGLE_CALENDAR_PROVIDER, googleCalendar);
    this.providers.set(MICROSOFT_GRAPH_PROVIDER, microsoftGraph);
    
    this.initialized = true;
    
    return Promise.resolve();
  }

  getProvider(providerName: string): ExternalServiceInterface {
    this.ensureInitialized();
    
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Calendar provider '${providerName}' not found`);
    }
    
    return provider;
  }

  async getAuthUrl(providerName: string, scopes: string[]): Promise<string> {
    const provider = this.getProvider(providerName);
    return provider.getAuthUrl(scopes);
  }

  async getTokenFromCode(providerName: string, code: string): Promise<{ access_token: string; refresh_token: string; expiry_date: number }> {
    const provider = this.getProvider(providerName);
    return provider.getTokenFromCode(code);
  }

  async setCredentials(providerName: string, credentials: { access_token: string; refresh_token: string; expiry_date: number }): Promise<void> {
    const provider = this.getProvider(providerName);
    return provider.setCredentials(credentials);
  }

  async listCalendars(providerName: string): Promise<Array<{ id: string; name: string; description?: string; isPrimary?: boolean }>> {
    const provider = this.getProvider(providerName);
    return provider.listCalendars();
  }

  async createCalendar(providerName: string, name: string, description: string): Promise<{ id: string; name: string; description: string }> {
    const provider = this.getProvider(providerName);
    return provider.createCalendar(name, description);
  }

  async getCalendarEvents(
    providerName: string,
    calendarId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Array<{ id: string; summary: string; description?: string; start: Date; end: Date; status: string }>> {
    const provider = this.getProvider(providerName);
    return provider.getCalendarEvents(calendarId, startDate, endDate);
  }

  async createEvent(
    providerName: string,
    calendarId: string,
    eventDetails: { 
      summary: string; 
      description?: string; 
      start: Date; 
      end: Date; 
      attendees?: Array<{ email: string; name?: string }>; 
      location?: string;
    }
  ): Promise<{ id: string; summary: string; description?: string; start: Date; end: Date; status: string }> {
    const provider = this.getProvider(providerName);
    return provider.createEvent(calendarId, eventDetails);
  }

  async updateEvent(
    providerName: string,
    calendarId: string,
    eventId: string,
    eventDetails: { 
      summary?: string; 
      description?: string; 
      start?: Date; 
      end?: Date; 
      attendees?: Array<{ email: string; name?: string }>; 
      location?: string;
    }
  ): Promise<{ id: string; summary: string; description?: string; start: Date; end: Date; status: string }> {
    const provider = this.getProvider(providerName);
    return provider.updateEvent(calendarId, eventId, eventDetails);
  }

  async deleteEvent(
    providerName: string,
    calendarId: string,
    eventId: string
  ): Promise<boolean> {
    const provider = this.getProvider(providerName);
    return provider.deleteEvent(calendarId, eventId);
  }

  async syncProviderAvailability(
    providerName: string,
    calendarId: string,
    availabilitySlots: TimeSlot[]
  ): Promise<{ added: number; updated: number; deleted: number; errors: number }> {
    const provider = this.getProvider(providerName);
    return provider.syncProviderAvailability(calendarId, availabilitySlots);
  }

  async setupWebhookNotifications(
    providerName: string,
    calendarId: string,
    notificationUrl: string
  ): Promise<{ id: string; resourceId?: string; expirationTime: string }> {
    const provider = this.getProvider(providerName);
    return provider.setupWebhookNotifications(calendarId, notificationUrl);
  }

  async stopWebhookNotifications(
    providerName: string,
    subscriptionId: string,
    resourceId: string
  ): Promise<boolean> {
    const provider = this.getProvider(providerName);
    return provider.stopWebhookNotifications(subscriptionId, resourceId);
  }

  async validateWebhook(
    providerName: string,
    payload: WebhookPayload,
    signature: string
  ): Promise<boolean> {
    const provider = this.getProvider(providerName);
    return provider.validateWebhook(payload, signature);
  }

  async getProviderStatus(
    providerName: string
  ): Promise<{ status: ServiceStatus; details?: Record<string, any> }> {
    const provider = this.getProvider(providerName);
    return provider.getStatus();
  }

  async getAllProvidersStatus(): Promise<Record<string, { status: ServiceStatus; details?: Record<string, any> }>> {
    this.ensureInitialized();
    
    const result: Record<string, { status: ServiceStatus; details?: Record<string, any> }> = {};
    
    for (const [providerName, provider] of this.providers.entries()) {
      result[providerName] = await provider.getStatus();
    }
    
    return result;
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('CalendarIntegrationService is not initialized');
    }
  }
}