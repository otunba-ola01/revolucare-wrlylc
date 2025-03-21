import { google, calendar_v3 } from 'googleapis'; // googleapis ^118.0.0
import crypto from 'crypto'; // built-in

import { googleCalendarConfig } from '../../config/calendar';
import { ExternalServiceInterface, ServiceStatus, WebhookPayload } from '../interfaces/external-service.interface';
import { TimeSlot } from '../types/provider.types';
import { errorFactory } from '../utils/error-handler';
import { logger } from '../utils/logger';
import { ErrorCodes } from '../constants/error-codes';

/**
 * Class that implements the ExternalServiceInterface for Google Calendar integration
 */
export class GoogleCalendarIntegration implements ExternalServiceInterface {
  private auth: calendar_v3.Auth.OAuth2Client;
  private calendar: calendar_v3.Calendar;
  private initialized: boolean;
  private credentials: { access_token: string; refresh_token: string; expiry_date: number } | null;

  /**
   * Initializes the Google Calendar integration with configuration
   */
  constructor() {
    this.auth = new google.auth.OAuth2(
      googleCalendarConfig.clientId,
      googleCalendarConfig.clientSecret,
      googleCalendarConfig.redirectUri
    );
    this.calendar = google.calendar({ version: 'v3', auth: this.auth });
    this.initialized = false;
    this.credentials = null;
  }

  /**
   * Initializes the Google Calendar integration
   */
  async initialize(): Promise<void> {
    try {
      // Verify that required configuration is available
      if (!googleCalendarConfig.clientId || !googleCalendarConfig.clientSecret || !googleCalendarConfig.redirectUri) {
        throw errorFactory.createError(
          'Missing required Google Calendar configuration',
          ErrorCodes.CALENDAR_INTEGRATION_ERROR,
          { service: 'Google Calendar' }
        );
      }

      // Create a new OAuth2 client with the configuration
      this.auth = new google.auth.OAuth2(
        googleCalendarConfig.clientId,
        googleCalendarConfig.clientSecret,
        googleCalendarConfig.redirectUri
      );

      // Initialize the Google Calendar API client
      this.calendar = google.calendar({ version: 'v3', auth: this.auth });
      
      this.initialized = true;
      logger.info('Google Calendar integration initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Google Calendar integration', { error });
      throw error;
    }
  }

  /**
   * Generates an authorization URL for OAuth2 authentication
   * @param scopes OAuth2 scopes to request
   * @returns Promise that resolves with the authorization URL
   */
  async getAuthUrl(scopes: string[] = []): Promise<string> {
    this.ensureInitialized();
    
    // Use default scopes if none provided
    const authScopes = scopes.length > 0 
      ? scopes 
      : googleCalendarConfig.options.scopes;
    
    // Generate the authorization URL
    const authUrl = this.auth.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: authScopes,
    });
    
    return authUrl;
  }

  /**
   * Exchanges an authorization code for OAuth2 tokens
   * @param code Authorization code from OAuth2 flow
   * @returns Promise that resolves with the token information
   */
  async getTokenFromCode(code: string): Promise<{ 
    access_token: string; 
    refresh_token: string;
    expiry_date: number; 
  }> {
    this.ensureInitialized();
    
    try {
      // Exchange the authorization code for tokens
      const { tokens } = await this.auth.getToken(code);
      
      // Store the received tokens in the credentials property
      this.credentials = {
        access_token: tokens.access_token!,
        refresh_token: tokens.refresh_token!,
        expiry_date: tokens.expiry_date!,
      };
      
      // Set the credentials on the OAuth2 client
      this.auth.setCredentials(tokens);
      
      return this.credentials;
    } catch (error) {
      logger.error('Error exchanging code for tokens', { error });
      throw errorFactory.createError(
        'Failed to exchange authorization code for tokens',
        ErrorCodes.CALENDAR_INTEGRATION_ERROR,
        { service: 'Google Calendar' },
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Sets OAuth2 credentials for authenticated requests
   * @param credentials OAuth2 credentials for authenticated requests
   */
  async setCredentials(credentials: { 
    access_token: string; 
    refresh_token: string;
    expiry_date: number; 
  }): Promise<void> {
    this.ensureInitialized();
    
    try {
      // Validate the provided credentials
      if (!credentials.access_token || !credentials.refresh_token) {
        throw new Error('Invalid credentials provided');
      }
      
      // Store the credentials in the credentials property
      this.credentials = credentials;
      
      // Set the credentials on the OAuth2 client
      this.auth.setCredentials({
        access_token: credentials.access_token,
        refresh_token: credentials.refresh_token,
        expiry_date: credentials.expiry_date,
      });
      
      logger.info('Google Calendar credentials set successfully');
    } catch (error) {
      logger.error('Error setting Google Calendar credentials', { error });
      throw errorFactory.createError(
        'Failed to set Google Calendar credentials',
        ErrorCodes.CALENDAR_INTEGRATION_ERROR,
        { service: 'Google Calendar' },
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Makes a request to the Google Calendar API
   * @param method HTTP method to use
   * @param endpoint API endpoint to call
   * @param params Request parameters
   * @returns Promise that resolves with the API response
   */
  async request<T>(method: string, endpoint: string, params: Record<string, any> = {}): Promise<T> {
    this.ensureInitialized();
    this.ensureCredentials();
    
    try {
      // Validate the method and endpoint parameters
      if (!method || !endpoint) {
        throw new Error('Method and endpoint are required');
      }
      
      // Construct the API request with the provided parameters
      const request: any = {
        method: method.toUpperCase(),
        url: endpoint,
        params: {},
        data: {},
      };
      
      // Separate query parameters from body data
      if (method.toUpperCase() === 'GET') {
        request.params = params;
      } else {
        request.data = params;
      }
      
      // Execute the request using the Google API client
      const response = await this.calendar.makeRequest<T>(request);
      
      return response.data;
    } catch (error: any) {
      logger.error('Google Calendar API request failed', { 
        method, 
        endpoint, 
        error: error.message || error 
      });
      
      throw errorFactory.createError(
        `Google Calendar API request failed: ${error.message || 'Unknown error'}`,
        ErrorCodes.CALENDAR_INTEGRATION_ERROR,
        { method, endpoint },
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Lists all calendars accessible to the authenticated user
   * @returns Promise that resolves with the list of calendars
   */
  async listCalendars(): Promise<Array<{
    id: string;
    name: string;
    description?: string;
    isPrimary?: boolean;
  }>> {
    this.ensureInitialized();
    this.ensureCredentials();
    
    try {
      // Make a request to the Google Calendar API to list calendars
      const response = await this.calendar.calendarList.list();
      
      // Transform the response into a standardized format
      return (response.data.items || []).map(calendar => ({
        id: calendar.id || '',
        name: calendar.summary || '',
        description: calendar.description,
        isPrimary: calendar.primary || false,
      }));
    } catch (error) {
      logger.error('Failed to list Google Calendars', { error });
      throw errorFactory.createError(
        'Failed to list Google Calendars',
        ErrorCodes.CALENDAR_INTEGRATION_ERROR,
        { service: 'Google Calendar' },
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Creates a new calendar for the authenticated user
   * @param name Name of the calendar
   * @param description Optional description of the calendar
   * @returns Promise that resolves with the created calendar details
   */
  async createCalendar(name: string, description: string): Promise<{
    id: string;
    name: string;
    description: string;
  }> {
    this.ensureInitialized();
    this.ensureCredentials();
    
    try {
      // Prepare the calendar creation request with name and description
      const response = await this.calendar.calendars.insert({
        requestBody: {
          summary: name,
          description: description,
        },
      });
      
      // Transform the response into a standardized format
      return {
        id: response.data.id || '',
        name: response.data.summary || name,
        description: response.data.description || description,
      };
    } catch (error) {
      logger.error('Failed to create Google Calendar', { name, error });
      throw errorFactory.createError(
        'Failed to create Google Calendar',
        ErrorCodes.CALENDAR_INTEGRATION_ERROR,
        { name },
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Gets events from a specific calendar within a date range
   * @param calendarId ID of the calendar to get events from
   * @param startDate Start date for the event range
   * @param endDate End date for the event range
   * @returns Promise that resolves with the list of events
   */
  async getCalendarEvents(
    calendarId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{
    id: string;
    summary: string;
    description?: string;
    start: Date;
    end: Date;
    status: string;
  }>> {
    this.ensureInitialized();
    this.ensureCredentials();
    
    try {
      // Format the date range for the API request
      const timeMin = startDate.toISOString();
      const timeMax = endDate.toISOString();
      
      // Make a request to the Google Calendar API to list events
      const response = await this.calendar.events.list({
        calendarId,
        timeMin,
        timeMax,
        singleEvents: true,
        orderBy: 'startTime',
      });
      
      // Transform the response into a standardized format
      return (response.data.items || []).map(event => this.formatEventFromApi(event));
    } catch (error) {
      logger.error('Failed to get Google Calendar events', { calendarId, startDate, endDate, error });
      throw errorFactory.createError(
        'Failed to get Google Calendar events',
        ErrorCodes.CALENDAR_INTEGRATION_ERROR,
        { calendarId, startDate, endDate },
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Creates a new event in a calendar
   * @param calendarId ID of the calendar to create the event in
   * @param eventDetails Details of the event to create
   * @returns Promise that resolves with the created event details
   */
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
  ): Promise<{
    id: string;
    summary: string;
    description?: string;
    start: Date;
    end: Date;
    status: string;
  }> {
    this.ensureInitialized();
    this.ensureCredentials();
    
    try {
      // Format the event details for the API request
      const formattedEvent = this.formatEventForApi(eventDetails);
      
      // Make a request to the Google Calendar API to create the event
      const response = await this.calendar.events.insert({
        calendarId,
        requestBody: formattedEvent,
        sendUpdates: 'none', // Don't send notifications
      });
      
      // Transform the response into a standardized format
      return this.formatEventFromApi(response.data);
    } catch (error) {
      logger.error('Failed to create Google Calendar event', { calendarId, eventDetails, error });
      throw errorFactory.createError(
        'Failed to create Google Calendar event',
        ErrorCodes.CALENDAR_INTEGRATION_ERROR,
        { calendarId },
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Updates an existing event in a calendar
   * @param calendarId ID of the calendar containing the event
   * @param eventId ID of the event to update
   * @param eventDetails Updated event details
   * @returns Promise that resolves with the updated event details
   */
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
  ): Promise<{
    id: string;
    summary: string;
    description?: string;
    start: Date;
    end: Date;
    status: string;
  }> {
    this.ensureInitialized();
    this.ensureCredentials();
    
    try {
      // Get existing event
      const existingEvent = await this.calendar.events.get({
        calendarId,
        eventId,
      });
      
      // Format the event details for the API request
      const formattedEvent = this.formatEventForApi({
        summary: eventDetails.summary || existingEvent.data.summary || '',
        description: eventDetails.description || existingEvent.data.description,
        start: eventDetails.start || new Date(existingEvent.data.start?.dateTime || ''),
        end: eventDetails.end || new Date(existingEvent.data.end?.dateTime || ''),
        attendees: eventDetails.attendees,
        location: eventDetails.location || existingEvent.data.location,
      });
      
      // Make a request to the Google Calendar API to update the event
      const response = await this.calendar.events.update({
        calendarId,
        eventId,
        requestBody: formattedEvent,
        sendUpdates: 'none', // Don't send notifications
      });
      
      // Transform the response into a standardized format
      return this.formatEventFromApi(response.data);
    } catch (error) {
      logger.error('Failed to update Google Calendar event', { calendarId, eventId, eventDetails, error });
      throw errorFactory.createError(
        'Failed to update Google Calendar event',
        ErrorCodes.CALENDAR_INTEGRATION_ERROR,
        { calendarId, eventId },
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Deletes an event from a calendar
   * @param calendarId ID of the calendar containing the event
   * @param eventId ID of the event to delete
   * @returns Promise that resolves with true if deletion was successful
   */
  async deleteEvent(calendarId: string, eventId: string): Promise<boolean> {
    this.ensureInitialized();
    this.ensureCredentials();
    
    try {
      // Make a request to the Google Calendar API to delete the event
      await this.calendar.events.delete({
        calendarId,
        eventId,
        sendUpdates: 'none', // Don't send notifications
      });
      
      return true;
    } catch (error) {
      logger.error('Failed to delete Google Calendar event', { calendarId, eventId, error });
      throw errorFactory.createError(
        'Failed to delete Google Calendar event',
        ErrorCodes.CALENDAR_INTEGRATION_ERROR,
        { calendarId, eventId },
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Synchronizes provider availability with their Google Calendar
   * @param calendarId ID of the calendar to sync with
   * @param availabilitySlots Array of availability time slots
   * @returns Promise that resolves with synchronization results
   */
  async syncProviderAvailability(
    calendarId: string,
    availabilitySlots: TimeSlot[]
  ): Promise<{
    added: number;
    updated: number;
    deleted: number;
    errors: number;
  }> {
    this.ensureInitialized();
    this.ensureCredentials();
    
    // Initialize result counters
    const result = {
      added: 0,
      updated: 0,
      deleted: 0,
      errors: 0,
    };
    
    try {
      // Get date range from availability slots
      const startDate = new Date(Math.min(...availabilitySlots.map(slot => slot.startTime.getTime())));
      const endDate = new Date(Math.max(...availabilitySlots.map(slot => slot.endTime.getTime())));
      
      // Extend the date range a bit to ensure we catch all events
      startDate.setDate(startDate.getDate() - 1);
      endDate.setDate(endDate.getDate() + 1);
      
      // Get existing events from the calendar for the relevant time period
      const existingEvents = await this.getCalendarEvents(calendarId, startDate, endDate);
      
      // Create a map of existing events by ID
      const existingEventMap = new Map(existingEvents.map(event => [event.id, event]));
      
      // Create a map of availability slots by time
      const availabilitySlotMap = new Map(availabilitySlots.map(slot => [
        `${slot.startTime.toISOString()}-${slot.endTime.toISOString()}`,
        slot
      ]));
      
      // Check for events that need to be deleted (existing but not in new availability)
      const eventsToDelete = existingEvents.filter(event => {
        const eventKey = `${event.start.toISOString()}-${event.end.toISOString()}`;
        return !availabilitySlotMap.has(eventKey);
      });
      
      // Check for slots that need to be created (in new availability but not existing)
      const slotsToCreate = availabilitySlots.filter(slot => {
        // Find matching event by time
        const matchingEvent = existingEvents.find(event => 
          event.start.getTime() === slot.startTime.getTime() && 
          event.end.getTime() === slot.endTime.getTime()
        );
        return !matchingEvent;
      });
      
      // Create events for new availability slots
      for (const slot of slotsToCreate) {
        try {
          await this.createEvent(calendarId, {
            summary: `Available: ${slot.serviceType}`,
            description: `Provider availability for ${slot.serviceType}`,
            start: slot.startTime,
            end: slot.endTime,
          });
          result.added++;
        } catch (error) {
          logger.error('Failed to create availability event', { slot, error });
          result.errors++;
        }
      }
      
      // Delete events for removed availability slots
      for (const event of eventsToDelete) {
        try {
          await this.deleteEvent(calendarId, event.id);
          result.deleted++;
        } catch (error) {
          logger.error('Failed to delete availability event', { event, error });
          result.errors++;
        }
      }
      
      return result;
    } catch (error) {
      logger.error('Failed to sync provider availability', { calendarId, error });
      throw errorFactory.createError(
        'Failed to sync provider availability with Google Calendar',
        ErrorCodes.CALENDAR_INTEGRATION_ERROR,
        { calendarId },
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Sets up webhook notifications for calendar changes
   * @param calendarId ID of the calendar to watch for changes
   * @param notificationUrl URL to send notifications to
   * @returns Promise that resolves with webhook details
   */
  async setupWebhookNotifications(
    calendarId: string,
    notificationUrl: string
  ): Promise<{
    id: string;
    resourceId?: string;
    expirationTime: string;
  }> {
    this.ensureInitialized();
    this.ensureCredentials();
    
    try {
      // Prepare the webhook notification request
      const channelId = crypto.randomUUID();
      
      // Make a request to the Google Calendar API to create the webhook
      const response = await this.calendar.events.watch({
        calendarId,
        requestBody: {
          id: channelId,
          type: 'web_hook',
          address: notificationUrl,
          // Set expiration to 7 days (max allowed)
          expiration: String(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
      
      // Transform the response into a standardized format
      return {
        id: response.data.id || channelId,
        resourceId: response.data.resourceId,
        expirationTime: response.data.expiration || '',
      };
    } catch (error) {
      logger.error('Failed to setup Google Calendar webhook', { calendarId, notificationUrl, error });
      throw errorFactory.createError(
        'Failed to setup Google Calendar webhook',
        ErrorCodes.CALENDAR_INTEGRATION_ERROR,
        { calendarId, notificationUrl },
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Stops webhook notifications for a calendar
   * @param subscriptionId ID of the webhook subscription
   * @param resourceId Resource ID returned when the webhook was created
   * @returns Promise that resolves with true if successful
   */
  async stopWebhookNotifications(
    subscriptionId: string,
    resourceId: string
  ): Promise<boolean> {
    this.ensureInitialized();
    
    try {
      // Prepare the webhook cancellation request
      await this.calendar.channels.stop({
        requestBody: {
          id: subscriptionId,
          resourceId: resourceId,
        },
      });
      
      return true;
    } catch (error) {
      logger.error('Failed to stop Google Calendar webhook', { subscriptionId, resourceId, error });
      throw errorFactory.createError(
        'Failed to stop Google Calendar webhook',
        ErrorCodes.CALENDAR_INTEGRATION_ERROR,
        { subscriptionId, resourceId },
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Validates a webhook notification from Google Calendar
   * @param payload Webhook payload
   * @param signature Optional signature for verification
   * @returns Promise that resolves with validation result
   */
  async validateWebhook(payload: WebhookPayload, signature?: string): Promise<boolean> {
    // Extract the necessary headers from the payload
    const headers = payload.headers || {};
    
    // Verify the channel ID and resource state
    if (!headers['x-goog-channel-id'] || !headers['x-goog-resource-state']) {
      logger.warn('Invalid Google Calendar webhook: missing required headers', { headers });
      return false;
    }
    
    // Validate the signature if provided
    if (signature) {
      // In a real implementation, we would verify the signature here
      // Google Calendar doesn't provide a signature mechanism by default,
      // but you could implement your own using a shared secret
    }
    
    return true;
  }

  /**
   * Gets the current status of the Google Calendar integration
   * @returns Promise that resolves with the service status
   */
  async getStatus(): Promise<{ status: ServiceStatus; details?: Record<string, any> }> {
    try {
      // Check if the integration is initialized
      if (!this.initialized) {
        return {
          status: 'unavailable',
          details: {
            reason: 'Service not initialized',
            service: 'Google Calendar',
          },
        };
      }
      
      // Make a simple API request to verify connectivity
      await this.listCalendars();
      
      // Return 'available' status if successful
      return {
        status: 'available',
        details: {
          service: 'Google Calendar',
          lastChecked: new Date().toISOString(),
        },
      };
    } catch (error) {
      // Return 'unavailable' or 'degraded' status with details if there are issues
      if (error instanceof Error && error.message.includes('auth')) {
        return {
          status: 'degraded',
          details: {
            reason: 'Authentication issue',
            service: 'Google Calendar',
            error: error.message,
          },
        };
      }
      
      return {
        status: 'unavailable',
        details: {
          reason: 'Service unavailable',
          service: 'Google Calendar',
          error: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }
  
  /**
   * Ensures that the integration has been initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw errorFactory.createError(
        'Google Calendar integration not initialized',
        ErrorCodes.CALENDAR_INTEGRATION_ERROR,
        { service: 'Google Calendar' }
      );
    }
  }
  
  /**
   * Ensures that OAuth credentials have been set
   */
  private ensureCredentials(): void {
    if (!this.credentials) {
      throw errorFactory.createError(
        'Google Calendar credentials not set',
        ErrorCodes.CALENDAR_INTEGRATION_ERROR,
        { service: 'Google Calendar' }
      );
    }
  }
  
  /**
   * Formats event details for the Google Calendar API
   * @param eventDetails Event details to format
   * @returns Formatted event object for the API
   */
  private formatEventForApi(eventDetails: {
    summary: string;
    description?: string;
    start: Date;
    end: Date;
    attendees?: Array<{ email: string; name?: string }>;
    location?: string;
  }): Record<string, any> {
    // Create a new event object with the required format
    const event: Record<string, any> = {
      summary: eventDetails.summary,
      description: eventDetails.description,
      start: {
        dateTime: eventDetails.start.toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: eventDetails.end.toISOString(),
        timeZone: 'UTC',
      },
    };
    
    // Add attendees if provided
    if (eventDetails.attendees && eventDetails.attendees.length > 0) {
      event.attendees = eventDetails.attendees.map(attendee => ({
        email: attendee.email,
        displayName: attendee.name,
      }));
    }
    
    // Add location if provided
    if (eventDetails.location) {
      event.location = eventDetails.location;
    }
    
    return event;
  }
  
  /**
   * Formats event data received from the Google Calendar API
   * @param apiEvent Event data from the API
   * @returns Standardized event object
   */
  private formatEventFromApi(apiEvent: any): {
    id: string;
    summary: string;
    description?: string;
    start: Date;
    end: Date;
    status: string;
  } {
    // Extract the event ID, summary, and description
    const id = apiEvent.id || '';
    const summary = apiEvent.summary || '';
    const description = apiEvent.description;
    
    // Parse the start and end dates
    const start = new Date(apiEvent.start?.dateTime || apiEvent.start?.date || '');
    const end = new Date(apiEvent.end?.dateTime || apiEvent.end?.date || '');
    
    // Extract the event status
    const status = apiEvent.status || 'confirmed';
    
    // Return the standardized event object
    return {
      id,
      summary,
      description,
      start,
      end,
      status,
    };
  }
}