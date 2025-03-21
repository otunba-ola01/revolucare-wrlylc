/**
 * Calendar Configuration
 * 
 * This file contains configuration settings for calendar integration services,
 * specifically Google Calendar and Microsoft Graph API (for Outlook calendars).
 * These settings are used by the calendar integration services to connect with
 * external calendar providers and manage provider availability.
 */

import dotenv from 'dotenv'; // dotenv v16.0.3
import { 
  ExternalServiceType, 
  CalendarServiceConfig, 
  RetryConfig, 
  DEFAULT_RETRY_CONFIG 
} from '../interfaces/external-service.interface';

// Load environment variables
dotenv.config();

// Calendar provider identifiers
export const GOOGLE_CALENDAR_PROVIDER = 'google';
export const MICROSOFT_GRAPH_PROVIDER = 'microsoft';

/**
 * Google Calendar API configuration
 */
export const googleCalendarConfig: CalendarServiceConfig = {
  serviceType: ExternalServiceType.CALENDAR,
  provider: GOOGLE_CALENDAR_PROVIDER,
  clientId: process.env.GOOGLE_CALENDAR_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET || '',
  redirectUri: process.env.GOOGLE_CALENDAR_REDIRECT_URI || 'http://localhost:3000/api/auth/callback/google-calendar',
  endpoint: 'https://www.googleapis.com/calendar/v3',
  timeout: parseInt(process.env.GOOGLE_CALENDAR_TIMEOUT || '30000', 10),
  retryConfig: {
    ...DEFAULT_RETRY_CONFIG,
    maxRetries: parseInt(process.env.GOOGLE_CALENDAR_MAX_RETRIES || '3', 10),
    initialDelay: parseInt(process.env.GOOGLE_CALENDAR_INITIAL_DELAY || '1000', 10),
    maxDelay: parseInt(process.env.GOOGLE_CALENDAR_MAX_DELAY || '10000', 10)
  },
  enabled: process.env.GOOGLE_CALENDAR_ENABLED === 'true',
  options: {
    // Google Calendar specific options
    scopes: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ],
    calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
    syncTokenTTL: parseInt(process.env.GOOGLE_CALENDAR_SYNC_TOKEN_TTL || '86400000', 10), // 24 hours in milliseconds
    maxResults: parseInt(process.env.GOOGLE_CALENDAR_MAX_RESULTS || '100', 10),
    // Additional options for the Google Calendar API client
    apiVersion: 'v3',
    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest']
  }
};

/**
 * Microsoft Graph API configuration (for Outlook calendars)
 */
export const microsoftGraphConfig: CalendarServiceConfig = {
  serviceType: ExternalServiceType.CALENDAR,
  provider: MICROSOFT_GRAPH_PROVIDER,
  clientId: process.env.MICROSOFT_GRAPH_CLIENT_ID || '',
  clientSecret: process.env.MICROSOFT_GRAPH_CLIENT_SECRET || '',
  redirectUri: process.env.MICROSOFT_GRAPH_REDIRECT_URI || 'http://localhost:3000/api/auth/callback/microsoft-graph',
  endpoint: 'https://graph.microsoft.com/v1.0',
  timeout: parseInt(process.env.MICROSOFT_GRAPH_TIMEOUT || '30000', 10),
  retryConfig: {
    ...DEFAULT_RETRY_CONFIG,
    maxRetries: parseInt(process.env.MICROSOFT_GRAPH_MAX_RETRIES || '3', 10),
    initialDelay: parseInt(process.env.MICROSOFT_GRAPH_INITIAL_DELAY || '1000', 10),
    maxDelay: parseInt(process.env.MICROSOFT_GRAPH_MAX_DELAY || '10000', 10)
  },
  enabled: process.env.MICROSOFT_GRAPH_ENABLED === 'true',
  options: {
    // Microsoft Graph specific options
    scopes: [
      'Calendars.ReadWrite',
      'Calendars.Read',
      'Calendars.Read.Shared',
      'User.ReadBasic.All'
    ],
    calendarGroup: process.env.MICROSOFT_GRAPH_CALENDAR_GROUP || '',
    calendarId: process.env.MICROSOFT_GRAPH_CALENDAR_ID || '',
    syncTokenTTL: parseInt(process.env.MICROSOFT_GRAPH_SYNC_TOKEN_TTL || '86400000', 10), // 24 hours in milliseconds
    maxResults: parseInt(process.env.MICROSOFT_GRAPH_MAX_RESULTS || '100', 10),
    // Additional options for the Microsoft Graph API client
    apiVersion: 'v1.0',
    stateCache: process.env.MICROSOFT_GRAPH_STATE_CACHE === 'true',
    batchEndpoint: 'https://graph.microsoft.com/v1.0/$batch'
  }
};

/**
 * Retrieves the configuration for a specific calendar provider
 * 
 * @param providerName - The name of the calendar provider (google or microsoft)
 * @returns The configuration object for the specified calendar provider
 * @throws Error if the provider is not supported
 */
export function getCalendarConfig(providerName: string): CalendarServiceConfig {
  switch (providerName.toLowerCase()) {
    case GOOGLE_CALENDAR_PROVIDER:
      return googleCalendarConfig;
    case MICROSOFT_GRAPH_PROVIDER:
      return microsoftGraphConfig;
    default:
      throw new Error(`Unsupported calendar provider: ${providerName}`);
  }
}