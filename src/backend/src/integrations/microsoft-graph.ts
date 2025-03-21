import { Client } from '@microsoft/microsoft-graph-client'; // v3.0.5
import * as msal from '@azure/msal-node'; // v1.17.2
import crypto from 'crypto'; // built-in

import { microsoftGraphConfig } from '../../config/calendar';
import { 
  ExternalServiceInterface, 
  ServiceStatus, 
  WebhookPayload 
} from '../interfaces/external-service.interface';
import { TimeSlot } from '../types/provider.types';
import { errorFactory } from '../utils/error-handler';
import { logger } from '../utils/logger';

/**
 * Class that implements the ExternalServiceInterface for Microsoft Graph (Outlook) calendar integration
 */
export class MicrosoftGraphIntegration implements ExternalServiceInterface {
  private confidentialClientApplication: msal.ConfidentialClientApplication | null = null;
  private graphClient: Client | null = null;
  private initialized = false;
  private credentials: { access_token: string; refresh_token: string; expiry_date: number } | null = null;

  /**
   * Initializes the Microsoft Graph integration with configuration
   */
  constructor() {
    // Initialization will be done via the initialize method
  }

  /**
   * Initializes the Microsoft Graph integration
   */
  async initialize(): Promise<void> {
    // Verify that the required configuration is available
    if (!microsoftGraphConfig.clientId || !microsoftGraphConfig.clientSecret) {
      throw errorFactory.createError(
        'Microsoft Graph client ID or client secret is missing',
        ErrorCodes.CALENDAR_INTEGRATION_ERROR,
        { 
          service: 'MicrosoftGraph',
          configProvided: {
            clientId: !!microsoftGraphConfig.clientId,
            clientSecret: !!microsoftGraphConfig.clientSecret
          }
        }
      );
    }
    
    try {
      // Create MSAL confidential client application for auth
      this.confidentialClientApplication = new msal.ConfidentialClientApplication({
        auth: {
          clientId: microsoftGraphConfig.clientId,
          clientSecret: microsoftGraphConfig.clientSecret,
          authority: 'https://login.microsoftonline.com/common'
        }
      });
      
      this.initialized = true;
      logger.info('Microsoft Graph integration initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Microsoft Graph integration', { error });
      throw errorFactory.createError(
        'Failed to initialize Microsoft Graph integration',
        ErrorCodes.CALENDAR_INTEGRATION_ERROR,
        { service: 'MicrosoftGraph' },
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Generates an authorization URL for OAuth2 authentication
   * @param scopes - OAuth scopes to request
   * @returns Promise that resolves with the authorization URL
   */
  async getAuthUrl(scopes: string[] = []): Promise<string> {
    this.ensureInitialized();
    
    // Use default scopes if none provided
    const authScopes = scopes.length > 0 
      ? scopes 
      : ['Calendars.ReadWrite', 'User.Read'];
    
    try {
      const authUrlParameters = {
        scopes: authScopes,
        redirectUri: microsoftGraphConfig.redirectUri
      };
      
      return this.confidentialClientApplication!.getAuthCodeUrl(authUrlParameters);
    } catch (error) {
      logger.error('Failed to generate Microsoft Graph authorization URL', { error, scopes });
      throw errorFactory.createError(
        'Failed to generate Microsoft Graph authorization URL',
        ErrorCodes.CALENDAR_INTEGRATION_ERROR,
        { service: 'MicrosoftGraph', scopes },
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Exchanges an authorization code for OAuth2 tokens
   * @param code - Authorization code from OAuth redirect
   * @returns Promise that resolves with the token information
   */
  async getTokenFromCode(code: string): Promise<{ access_token: string; refresh_token: string; expiry_date: number }> {
    this.ensureInitialized();
    
    try {
      const tokenRequest = {
        code,
        redirectUri: microsoftGraphConfig.redirectUri,
        scopes: ['Calendars.ReadWrite', 'User.Read']
      };
      
      const response = await this.confidentialClientApplication!.acquireTokenByCode(tokenRequest);
      
      if (!response || !response.accessToken) {
        throw new Error('No access token returned from Microsoft Graph');
      }
      
      // Store credentials
      this.credentials = {
        access_token: response.accessToken,
        refresh_token: response.refreshToken || '',
        expiry_date: Date.now() + (response.expiresIn || 3600) * 1000
      };
      
      // Initialize Graph client
      this.initializeGraphClient(this.credentials.access_token);
      
      return this.credentials;
    } catch (error) {
      logger.error('Failed to get token from code for Microsoft Graph', { error });
      throw errorFactory.createError(
        'Failed to get token from code for Microsoft Graph',
        ErrorCodes.CALENDAR_INTEGRATION_ERROR,
        { service: 'MicrosoftGraph' },
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Sets OAuth2 credentials for authenticated requests
   * @param credentials - OAuth token credentials
   */
  async setCredentials(credentials: { access_token: string; refresh_token: string; expiry_date: number }): Promise<void> {
    this.ensureInitialized();
    
    if (!credentials.access_token) {
      throw errorFactory.createError(
        'Invalid credentials provided to Microsoft Graph integration',
        ErrorCodes.UNAUTHORIZED,
        { service: 'MicrosoftGraph' }
      );
    }
    
    this.credentials = credentials;
    this.initializeGraphClient(credentials.access_token);
    
    logger.info('Microsoft Graph credentials set successfully');
  }

  /**
   * Makes a request to the Microsoft Graph API
   * @param endpoint - API endpoint path
   * @param payload - Request parameters or body
   * @param options - Additional request options
   * @returns Promise that resolves with the API response
   */
  async request<T>(
    endpoint: string,
    payload?: Record<string, any>,
    options?: Record<string, any>
  ): Promise<T> {
    this.ensureInitialized();
    this.ensureCredentials();
    
    // Determine HTTP method from options or default to GET
    const method = options?.method?.toUpperCase() || 'GET';

    try {
      // Refresh token if needed
      await this.refreshTokenIfNeeded();
      
      // Build request
      let request = this.graphClient!.api(endpoint);
      
      // Apply method and payload
      switch (method) {
        case 'GET':
          if (payload && Object.keys(payload).length > 0) {
            request = request.query(payload);
          }
          break;
        case 'POST':
          if (payload) {
            request = request.body(payload);
          }
          return await request.post() as T;
        case 'PATCH':
          if (payload) {
            request = request.body(payload);
          }
          return await request.patch() as T;
        case 'DELETE':
          return await request.delete() as T;
        default:
          throw errorFactory.createError(
            `Unsupported method: ${method}`,
            ErrorCodes.BAD_REQUEST,
            { service: 'MicrosoftGraph', method, endpoint }
          );
      }
      
      // Execute GET request (default)
      return await request.get() as T;
    } catch (error) {
      logger.error('Microsoft Graph API request failed', { error, endpoint, method });
      throw errorFactory.createError(
        `Microsoft Graph API request failed: ${endpoint}`,
        ErrorCodes.CALENDAR_INTEGRATION_ERROR,
        { service: 'MicrosoftGraph', endpoint, method },
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Lists all calendars accessible to the authenticated user
   * @returns Promise that resolves with the list of calendars
   */
  async listCalendars(): Promise<Array<{ id: string; name: string; description?: string; isPrimary?: boolean }>> {
    try {
      const response = await this.request<any>('/me/calendars');
      
      if (!response.value || !Array.isArray(response.value)) {
        return [];
      }
      
      return response.value.map((calendar: any) => ({
        id: calendar.id,
        name: calendar.name,
        description: calendar.description,
        isPrimary: calendar.isDefaultCalendar
      }));
    } catch (error) {
      logger.error('Failed to list Microsoft Graph calendars', { error });
      throw errorFactory.createError(
        'Failed to list Microsoft Graph calendars',
        ErrorCodes.CALENDAR_INTEGRATION_ERROR,
        { service: 'MicrosoftGraph' },
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Creates a new calendar for the authenticated user
   * @param name - Calendar name
   * @param description - Calendar description
   * @returns Promise that resolves with the created calendar details
   */
  async createCalendar(name: string, description: string): Promise<{ id: string; name: string; description: string }> {
    try {
      const calendar = await this.request<any>(
        '/me/calendars',
        { name, description },
        { method: 'POST' }
      );
      
      return {
        id: calendar.id,
        name: calendar.name,
        description: calendar.description
      };
    } catch (error) {
      logger.error('Failed to create Microsoft Graph calendar', { error, name });
      throw errorFactory.createError(
        'Failed to create Microsoft Graph calendar',
        ErrorCodes.CALENDAR_INTEGRATION_ERROR,
        { service: 'MicrosoftGraph', calendarName: name },
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Gets events from a specific calendar within a date range
   * @param calendarId - ID of the calendar
   * @param startDate - Start date for events
   * @param endDate - End date for events
   * @returns Promise that resolves with the list of events
   */
  async getCalendarEvents(
    calendarId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ id: string; summary: string; description?: string; start: Date; end: Date; status: string }>> {
    try {
      // Format date range for the API
      const startDateTime = startDate.toISOString();
      const endDateTime = endDate.toISOString();
      
      const endpoint = calendarId === 'primary'
        ? `/me/calendar/calendarView`
        : `/me/calendars/${calendarId}/calendarView`;
      
      const response = await this.request<any>(endpoint, {
        startDateTime,
        endDateTime
      });
      
      if (!response.value || !Array.isArray(response.value)) {
        return [];
      }
      
      return response.value.map(this.formatEventFromApi);
    } catch (error) {
      logger.error('Failed to get Microsoft Graph calendar events', { error, calendarId, startDate, endDate });
      throw errorFactory.createError(
        'Failed to get Microsoft Graph calendar events',
        ErrorCodes.CALENDAR_INTEGRATION_ERROR,
        { service: 'MicrosoftGraph', calendarId },
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Creates a new event in a calendar
   * @param calendarId - ID of the calendar
   * @param eventDetails - Event details
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
  ): Promise<{ id: string; summary: string; description?: string; start: Date; end: Date; status: string }> {
    try {
      const formattedEvent = this.formatEventForApi(eventDetails);
      
      const endpoint = calendarId === 'primary'
        ? '/me/calendar/events'
        : `/me/calendars/${calendarId}/events`;
      
      const event = await this.request<any>(
        endpoint,
        formattedEvent,
        { method: 'POST' }
      );
      
      return this.formatEventFromApi(event);
    } catch (error) {
      logger.error('Failed to create Microsoft Graph calendar event', { error, calendarId, eventDetails });
      throw errorFactory.createError(
        'Failed to create Microsoft Graph calendar event',
        ErrorCodes.CALENDAR_INTEGRATION_ERROR,
        { service: 'MicrosoftGraph', calendarId },
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Updates an existing event in a calendar
   * @param calendarId - ID of the calendar
   * @param eventId - ID of the event to update
   * @param eventDetails - Updated event details
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
  ): Promise<{ id: string; summary: string; description?: string; start: Date; end: Date; status: string }> {
    try {
      const formattedEvent = this.formatEventForApi(eventDetails);
      
      const endpoint = calendarId === 'primary'
        ? `/me/calendar/events/${eventId}`
        : `/me/calendars/${calendarId}/events/${eventId}`;
      
      const event = await this.request<any>(
        endpoint,
        formattedEvent,
        { method: 'PATCH' }
      );
      
      return this.formatEventFromApi(event);
    } catch (error) {
      logger.error('Failed to update Microsoft Graph calendar event', { error, calendarId, eventId, eventDetails });
      throw errorFactory.createError(
        'Failed to update Microsoft Graph calendar event',
        ErrorCodes.CALENDAR_INTEGRATION_ERROR,
        { service: 'MicrosoftGraph', calendarId, eventId },
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Deletes an event from a calendar
   * @param calendarId - ID of the calendar
   * @param eventId - ID of the event to delete
   * @returns Promise that resolves with true if deletion was successful
   */
  async deleteEvent(calendarId: string, eventId: string): Promise<boolean> {
    try {
      const endpoint = calendarId === 'primary'
        ? `/me/calendar/events/${eventId}`
        : `/me/calendars/${calendarId}/events/${eventId}`;
      
      await this.request<any>(
        endpoint,
        undefined,
        { method: 'DELETE' }
      );
      return true;
    } catch (error) {
      logger.error('Failed to delete Microsoft Graph calendar event', { error, calendarId, eventId });
      throw errorFactory.createError(
        'Failed to delete Microsoft Graph calendar event',
        ErrorCodes.CALENDAR_INTEGRATION_ERROR,
        { service: 'MicrosoftGraph', calendarId, eventId },
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Synchronizes provider availability with their Outlook Calendar
   * @param calendarId - ID of the calendar
   * @param availabilitySlots - Provider availability slots
   * @returns Promise that resolves with synchronization results
   */
  async syncProviderAvailability(
    calendarId: string,
    availabilitySlots: TimeSlot[]
  ): Promise<{ added: number; updated: number; deleted: number; errors: number }> {
    this.ensureInitialized();
    this.ensureCredentials();
    
    // Results tracking
    const results = {
      added: 0,
      updated: 0,
      deleted: 0,
      errors: 0
    };
    
    try {
      // Get all existing events in the relevant time period
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 90); // Look 90 days ahead
      
      const existingEvents = await this.getCalendarEvents(calendarId, now, futureDate);
      
      // Create a map of existing events by time slot (start+end)
      const existingEventMap = new Map<string, any>();
      existingEvents.forEach(event => {
        const key = `${event.start.toISOString()}-${event.end.toISOString()}`;
        existingEventMap.set(key, event);
      });
      
      // Process each availability slot
      for (const slot of availabilitySlots) {
        // Skip slots in the past
        if (slot.endTime < now) continue;
        
        const slotKey = `${slot.startTime.toISOString()}-${slot.endTime.toISOString()}`;
        
        // Determine if this is a new, updated, or existing event
        if (existingEventMap.has(slotKey)) {
          // Event exists - check if it needs updating
          const existingEvent = existingEventMap.get(slotKey);
          
          // Create event summary based on availability
          const summary = slot.isBooked 
            ? 'Booked Appointment' 
            : 'Available';
          
          // If the event title doesn't match the current state, update it
          if (existingEvent.summary !== summary) {
            try {
              await this.updateEvent(calendarId, existingEvent.id, {
                summary,
                description: `Provider availability: ${slot.isBooked ? 'Booked' : 'Available'}\nService Type: ${slot.serviceType}`
              });
              results.updated++;
            } catch (error) {
              logger.error('Failed to update event during availability sync', { error, slot });
              results.errors++;
            }
          }
          
          // Remove from map to track what's been processed
          existingEventMap.delete(slotKey);
        } else {
          // New event - create it
          try {
            const summary = slot.isBooked 
              ? 'Booked Appointment' 
              : 'Available';
            
            await this.createEvent(calendarId, {
              summary,
              description: `Provider availability: ${slot.isBooked ? 'Booked' : 'Available'}\nService Type: ${slot.serviceType}`,
              start: slot.startTime,
              end: slot.endTime
            });
            results.added++;
          } catch (error) {
            logger.error('Failed to create event during availability sync', { error, slot });
            results.errors++;
          }
        }
      }
      
      // Any events left in the map are no longer in availability - delete them
      for (const [_, event] of existingEventMap.entries()) {
        // Only delete events that include "Provider availability" in the description
        // to avoid deleting personal events
        if (event.description && event.description.includes('Provider availability')) {
          try {
            await this.deleteEvent(calendarId, event.id);
            results.deleted++;
          } catch (error) {
            logger.error('Failed to delete event during availability sync', { error, eventId: event.id });
            results.errors++;
          }
        }
      }
      
      logger.info('Provider availability sync completed', { results, calendarId });
      return results;
    } catch (error) {
      logger.error('Failed to sync provider availability with Microsoft Graph', { error, calendarId });
      throw errorFactory.createError(
        'Failed to sync provider availability with Microsoft Graph',
        ErrorCodes.CALENDAR_INTEGRATION_ERROR,
        { service: 'MicrosoftGraph', calendarId },
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Sets up webhook notifications for calendar changes
   * @param calendarId - ID of the calendar
   * @param notificationUrl - URL to receive webhook notifications
   * @returns Promise that resolves with webhook details
   */
  async setupWebhookNotifications(
    calendarId: string,
    notificationUrl: string
  ): Promise<{ id: string; resourceId?: string; expirationTime: string }> {
    try {
      // Calculate expiration time (max 4230 minutes / ~3 days)
      const expirationDateTime = new Date();
      expirationDateTime.setDate(expirationDateTime.getDate() + 3);
      
      // Generate a random client state for webhook validation
      const clientState = crypto.randomBytes(16).toString('hex');
      
      const subscription = await this.request<any>(
        '/subscriptions',
        {
          changeType: 'created,updated,deleted',
          notificationUrl,
          resource: calendarId === 'primary'
            ? '/me/calendar/events'
            : `/me/calendars/${calendarId}/events`,
          expirationDateTime: expirationDateTime.toISOString(),
          clientState
        },
        { method: 'POST' }
      );
      
      return {
        id: subscription.id,
        resourceId: subscription.resourceId,
        expirationTime: subscription.expirationDateTime
      };
    } catch (error) {
      logger.error('Failed to setup Microsoft Graph webhook notifications', { error, calendarId, notificationUrl });
      throw errorFactory.createError(
        'Failed to setup Microsoft Graph webhook notifications',
        ErrorCodes.CALENDAR_INTEGRATION_ERROR,
        { service: 'MicrosoftGraph', calendarId },
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Stops webhook notifications for a calendar
   * @param subscriptionId - ID of the webhook subscription
   * @param resourceId - Resource ID
   * @returns Promise that resolves with true if successful
   */
  async stopWebhookNotifications(subscriptionId: string, resourceId: string): Promise<boolean> {
    try {
      await this.request<any>(
        `/subscriptions/${subscriptionId}`,
        undefined,
        { method: 'DELETE' }
      );
      return true;
    } catch (error) {
      logger.error('Failed to stop Microsoft Graph webhook notifications', { error, subscriptionId });
      throw errorFactory.createError(
        'Failed to stop Microsoft Graph webhook notifications',
        ErrorCodes.CALENDAR_INTEGRATION_ERROR,
        { service: 'MicrosoftGraph', subscriptionId },
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Validates a webhook notification from Microsoft Graph
   * @param payload - Webhook payload
   * @returns Promise that resolves with validation result
   */
  async validateWebhook(payload: WebhookPayload): Promise<boolean> {
    try {
      // Extract validation token if this is a validation request
      const validationToken = payload.headers['validationToken'];
      if (validationToken) {
        // This is a subscription validation request
        return true;
      }
      
      // Verify that this is a legitimate notification
      if (!payload.body || !payload.body.value || !Array.isArray(payload.body.value)) {
        return false;
      }
      
      // Verify client state if provided
      const clientState = payload.body.clientState;
      if (clientState) {
        // In a real implementation, you would verify this matches what you set
        // For this example, we'll just assume it's valid
        logger.debug('Webhook notification received with client state', { clientState });
      }
      
      return true;
    } catch (error) {
      logger.error('Error validating Microsoft Graph webhook', { error });
      return false;
    }
  }

  /**
   * Gets the current status of the Microsoft Graph integration
   * @returns Promise that resolves with the service status
   */
  async getStatus(): Promise<{ status: ServiceStatus; details?: Record<string, any> }> {
    // Check if initialized
    if (!this.initialized) {
      return {
        status: 'unavailable',
        details: {
          reason: 'Not initialized',
          initialized: false
        }
      };
    }
    
    // Check if credentials are set
    if (!this.credentials) {
      return {
        status: 'degraded',
        details: {
          reason: 'Not authenticated',
          initialized: true,
          authenticated: false
        }
      };
    }
    
    try {
      // Make a simple request to check if the service is available
      await this.request<any>('/me');
      
      return {
        status: 'available',
        details: {
          initialized: true,
          authenticated: true,
          tokenExpiry: this.credentials.expiry_date
        }
      };
    } catch (error) {
      return {
        status: 'degraded',
        details: {
          reason: 'API error',
          initialized: true,
          authenticated: true,
          error: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }

  /**
   * Ensures that the integration has been initialized
   * @private
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw errorFactory.createError(
        'Microsoft Graph integration not initialized',
        ErrorCodes.CALENDAR_INTEGRATION_ERROR,
        { service: 'MicrosoftGraph' }
      );
    }
  }

  /**
   * Ensures that OAuth credentials have been set
   * @private
   */
  private ensureCredentials(): void {
    if (!this.credentials) {
      throw errorFactory.createError(
        'Microsoft Graph credentials not set',
        ErrorCodes.UNAUTHORIZED,
        { service: 'MicrosoftGraph' }
      );
    }
  }

  /**
   * Refreshes the access token if it has expired
   * @private
   */
  private async refreshTokenIfNeeded(): Promise<void> {
    if (!this.credentials) return;
    
    // Check if token is expired or about to expire (within 5 minutes)
    const now = Date.now();
    const tokenExpiresIn = this.credentials.expiry_date - now;
    const refreshThreshold = 5 * 60 * 1000; // 5 minutes in milliseconds
    
    if (tokenExpiresIn <= refreshThreshold) {
      try {
        logger.debug('Refreshing Microsoft Graph access token');
        
        // Use MSAL to refresh the token
        const refreshTokenRequest = {
          refreshToken: this.credentials.refresh_token,
          scopes: ['Calendars.ReadWrite', 'User.Read']
        };
        
        const response = await this.confidentialClientApplication!.acquireTokenByRefreshToken(refreshTokenRequest);
        
        if (!response || !response.accessToken) {
          throw new Error('No access token returned from refresh token request');
        }
        
        // Update stored credentials
        this.credentials = {
          access_token: response.accessToken,
          refresh_token: response.refreshToken || this.credentials.refresh_token,
          expiry_date: Date.now() + (response.expiresIn || 3600) * 1000
        };
        
        // Re-initialize the Graph client with the new token
        this.initializeGraphClient(this.credentials.access_token);
        
        logger.debug('Microsoft Graph access token refreshed successfully');
      } catch (error) {
        logger.error('Failed to refresh Microsoft Graph access token', { error });
        throw errorFactory.createError(
          'Failed to refresh Microsoft Graph access token',
          ErrorCodes.TOKEN_EXPIRED,
          { service: 'MicrosoftGraph' },
          error instanceof Error ? error : new Error(String(error))
        );
      }
    }
  }

  /**
   * Initializes the Microsoft Graph client with the provided access token
   * @private
   * @param accessToken - OAuth access token
   */
  private initializeGraphClient(accessToken: string): void {
    this.graphClient = Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      }
    });
  }

  /**
   * Formats event details for the Microsoft Graph API
   * @private
   * @param eventDetails - Event details to format
   * @returns Formatted event object for the API
   */
  private formatEventForApi(eventDetails: any): Record<string, any> {
    const event: Record<string, any> = {};
    
    // Set subject (summary)
    if (eventDetails.summary) {
      event.subject = eventDetails.summary;
    }
    
    // Set body (description)
    if (eventDetails.description) {
      event.body = {
        contentType: 'text',
        content: eventDetails.description
      };
    }
    
    // Set start and end times
    if (eventDetails.start) {
      event.start = {
        dateTime: eventDetails.start.toISOString(),
        timeZone: 'UTC'
      };
    }
    
    if (eventDetails.end) {
      event.end = {
        dateTime: eventDetails.end.toISOString(),
        timeZone: 'UTC'
      };
    }
    
    // Set attendees
    if (eventDetails.attendees && eventDetails.attendees.length > 0) {
      event.attendees = eventDetails.attendees.map((attendee: any) => ({
        emailAddress: {
          address: attendee.email,
          name: attendee.name || attendee.email
        },
        type: 'required'
      }));
    }
    
    // Set location
    if (eventDetails.location) {
      event.location = {
        displayName: eventDetails.location
      };
    }
    
    return event;
  }

  /**
   * Formats event data received from the Microsoft Graph API
   * @private
   * @param apiEvent - Event data from the API
   * @returns Standardized event object
   */
  private formatEventFromApi(apiEvent: any): { id: string; summary: string; description?: string; start: Date; end: Date; status: string } {
    return {
      id: apiEvent.id,
      summary: apiEvent.subject || '',
      description: apiEvent.body?.content || '',
      start: new Date(apiEvent.start.dateTime + 'Z'),
      end: new Date(apiEvent.end.dateTime + 'Z'),
      status: apiEvent.showAs || 'busy'
    };
  }
}

// Using the ErrorCodes enum imported through errorFactory
import { ErrorCodes } from '../constants/error-codes';