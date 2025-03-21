import { getCalendarConfig, GOOGLE_CALENDAR_PROVIDER, MICROSOFT_GRAPH_PROVIDER } from '../../config/calendar';
import { GoogleCalendarIntegration } from '../../integrations/google-calendar';
import { MicrosoftGraphIntegration } from '../../integrations/microsoft-graph';
import { ExternalServiceInterface, ServiceStatus, WebhookPayload } from '../../interfaces/external-service.interface';
import { TimeSlot } from '../../types/provider.types';
import { errorFactory } from '../../utils/error-handler';
import { logger } from '../../utils/logger';

/**
 * Service that provides a unified interface for calendar integration with multiple providers
 * (Google Calendar and Microsoft Outlook) to manage provider availability and synchronization.
 * This service abstracts the underlying calendar provider implementations and provides
 * a consistent API for the application.
 */
export class CalendarIntegrationService {
  private providers: Map<string, ExternalServiceInterface>;
  private initialized: boolean;

  /**
   * Initializes the calendar integration service
   */
  constructor() {
    this.providers = new Map<string, ExternalServiceInterface>();
    this.initialized = false;
  }

  /**
   * Initializes the calendar integration service with all supported providers
   * @returns Promise that resolves when initialization is complete
   */
  async initialize(): Promise<void> {
    try {
      // Create and initialize Google Calendar integration
      const googleCalendarIntegration = new GoogleCalendarIntegration();
      await googleCalendarIntegration.initialize();
      this.providers.set(GOOGLE_CALENDAR_PROVIDER, googleCalendarIntegration);

      // Create and initialize Microsoft Graph integration
      const microsoftGraphIntegration = new MicrosoftGraphIntegration();
      await microsoftGraphIntegration.initialize();
      this.providers.set(MICROSOFT_GRAPH_PROVIDER, microsoftGraphIntegration);

      this.initialized = true;
      logger.info('Calendar integration service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize calendar integration service', { error });
      throw error;
    }
  }

  /**
   * Gets a calendar provider instance by name
   * @param providerName The requested calendar provider name
   * @returns The requested calendar provider instance
   */
  getProvider(providerName: string): ExternalServiceInterface {
    this.ensureInitialized();

    const provider = this.providers.get(providerName);
    if (!provider) {
      throw errorFactory.createError(
        `Calendar provider '${providerName}' not found`,
        ErrorCodes.CALENDAR_INTEGRATION_ERROR,
        { providerName }
      );
    }

    return provider;
  }

  /**
   * Gets the authorization URL for a specific calendar provider
   * @param providerName The calendar provider name
   * @param scopes OAuth scopes to request
   * @returns Promise that resolves with the authorization URL
   */
  async getAuthUrl(providerName: string, scopes: string[] = []): Promise<string> {
    const provider = this.getProvider(providerName);
    return await provider.getAuthUrl(scopes);
  }

  /**
   * Exchanges an authorization code for OAuth tokens for a specific provider
   * @param providerName The calendar provider name
   * @param code Authorization code to exchange
   * @returns Promise that resolves with the token information
   */
  async getTokenFromCode(
    providerName: string,
    code: string
  ): Promise<{ access_token: string; refresh_token: string; expiry_date: number }> {
    const provider = this.getProvider(providerName);
    return await provider.getTokenFromCode(code);
  }

  /**
   * Sets OAuth credentials for a specific calendar provider
   * @param providerName The calendar provider name
   * @param credentials OAuth credentials to set
   * @returns Promise that resolves when credentials are set
   */
  async setCredentials(
    providerName: string,
    credentials: { access_token: string; refresh_token: string; expiry_date: number }
  ): Promise<void> {
    const provider = this.getProvider(providerName);
    await provider.setCredentials(credentials);
  }

  /**
   * Lists all calendars accessible to the authenticated user for a specific provider
   * @param providerName The calendar provider name
   * @returns Promise that resolves with the list of calendars
   */
  async listCalendars(
    providerName: string
  ): Promise<Array<{ id: string; name: string; description?: string; isPrimary?: boolean }>> {
    const provider = this.getProvider(providerName);
    return await provider.listCalendars();
  }

  /**
   * Creates a new calendar for a specific provider
   * @param providerName The calendar provider name
   * @param name Name of the calendar
   * @param description Description of the calendar
   * @returns Promise that resolves with the created calendar details
   */
  async createCalendar(
    providerName: string,
    name: string,
    description: string
  ): Promise<{ id: string; name: string; description: string }> {
    const provider = this.getProvider(providerName);
    return await provider.createCalendar(name, description);
  }

  /**
   * Gets events from a specific calendar within a date range
   * @param providerName The calendar provider name
   * @param calendarId ID of the calendar
   * @param startDate Start date for the date range
   * @param endDate End date for the date range
   * @returns Promise that resolves with the list of events
   */
  async getCalendarEvents(
    providerName: string,
    calendarId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ id: string; summary: string; description?: string; start: Date; end: Date; status: string }>> {
    const provider = this.getProvider(providerName);
    return await provider.getCalendarEvents(calendarId, startDate, endDate);
  }

  /**
   * Creates a new event in a calendar for a specific provider
   * @param providerName The calendar provider name
   * @param calendarId ID of the calendar
   * @param eventDetails Details of the event to create
   * @returns Promise that resolves with the created event details
   */
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
    return await provider.createEvent(calendarId, eventDetails);
  }

  /**
   * Updates an existing event in a calendar for a specific provider
   * @param providerName The calendar provider name
   * @param calendarId ID of the calendar
   * @param eventId ID of the event to update
   * @param eventDetails Updated event details
   * @returns Promise that resolves with the updated event details
   */
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
    return await provider.updateEvent(calendarId, eventId, eventDetails);
  }

  /**
   * Deletes an event from a calendar for a specific provider
   * @param providerName The calendar provider name
   * @param calendarId ID of the calendar
   * @param eventId ID of the event to delete
   * @returns Promise that resolves with true if deletion was successful
   */
  async deleteEvent(providerName: string, calendarId: string, eventId: string): Promise<boolean> {
    const provider = this.getProvider(providerName);
    return await provider.deleteEvent(calendarId, eventId);
  }

  /**
   * Synchronizes provider availability with their calendar
   * @param providerName The calendar provider name
   * @param calendarId ID of the calendar
   * @param availabilitySlots Array of availability time slots
   * @returns Promise that resolves with synchronization results
   */
  async syncProviderAvailability(
    providerName: string,
    calendarId: string,
    availabilitySlots: TimeSlot[]
  ): Promise<{ added: number; updated: number; deleted: number; errors: number }> {
    const provider = this.getProvider(providerName);
    return await provider.syncProviderAvailability(calendarId, availabilitySlots);
  }

  /**
   * Sets up webhook notifications for calendar changes
   * @param providerName The calendar provider name
   * @param calendarId ID of the calendar
   * @param notificationUrl URL to receive webhook notifications
   * @returns Promise that resolves with webhook details
   */
  async setupWebhookNotifications(
    providerName: string,
    calendarId: string,
    notificationUrl: string
  ): Promise<{ id: string; resourceId?: string; expirationTime: string }> {
    const provider = this.getProvider(providerName);
    return await provider.setupWebhookNotifications(calendarId, notificationUrl);
  }

  /**
   * Stops webhook notifications for a calendar
   * @param providerName The calendar provider name
   * @param subscriptionId ID of the webhook subscription
   * @param resourceId Resource ID for the webhook
   * @returns Promise that resolves with true if successful
   */
  async stopWebhookNotifications(
    providerName: string,
    subscriptionId: string,
    resourceId: string
  ): Promise<boolean> {
    const provider = this.getProvider(providerName);
    return await provider.stopWebhookNotifications(subscriptionId, resourceId);
  }

  /**
   * Validates a webhook notification from a calendar provider
   * @param providerName The calendar provider name
   * @param payload Webhook notification payload
   * @param signature Optional signature for webhook validation
   * @returns Promise that resolves with validation result
   */
  async validateWebhook(
    providerName: string,
    payload: WebhookPayload,
    signature?: string
  ): Promise<boolean> {
    const provider = this.getProvider(providerName);
    return await provider.validateWebhook(payload, signature);
  }

  /**
   * Gets the current status of a specific calendar provider
   * @param providerName The calendar provider name
   * @returns Promise that resolves with the service status
   */
  async getProviderStatus(
    providerName: string
  ): Promise<{ status: ServiceStatus; details?: Record<string, any> }> {
    const provider = this.getProvider(providerName);
    return await provider.getStatus();
  }

  /**
   * Gets the current status of all calendar providers
   * @returns Promise that resolves with status information for all providers
   */
  async getAllProvidersStatus(): Promise<Record<string, { status: ServiceStatus; details?: Record<string, any> }>> {
    this.ensureInitialized();

    const result: Record<string, { status: ServiceStatus; details?: Record<string, any> }> = {};

    for (const [providerName, provider] of this.providers.entries()) {
      result[providerName] = await provider.getStatus();
    }

    return result;
  }

  /**
   * Ensures that the service has been initialized
   * @private
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw errorFactory.createError(
        'Calendar integration service not initialized',
        ErrorCodes.CALENDAR_INTEGRATION_ERROR,
        { service: 'CalendarIntegrationService' }
      );
    }
  }
}