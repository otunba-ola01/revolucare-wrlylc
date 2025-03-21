declare namespace NodeJS {
  interface ProcessEnv {
    // Application Environment
    NODE_ENV: 'development' | 'test' | 'production';
    
    // API and Site URLs
    NEXT_PUBLIC_API_URL: string;
    NEXT_PUBLIC_SITE_URL: string;
    
    // Authentication
    NEXTAUTH_URL: string;
    NEXTAUTH_SECRET: string;
    
    // OAuth Providers
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    
    // External Services
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: string;
    
    // Payment Processing
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: string;
    STRIPE_SECRET_KEY: string;
    STRIPE_WEBHOOK_SECRET: string;
    
    // Document Storage
    BLOB_READ_WRITE_TOKEN: string;
    
    // Upload Configurations
    NEXT_PUBLIC_MAX_FILE_SIZE_MB: string;
    NEXT_PUBLIC_SUPPORTED_FILE_TYPES: string;
    
    // Localization
    NEXT_PUBLIC_DEFAULT_LOCALE: string;
    NEXT_PUBLIC_SUPPORTED_LOCALES: string;
    
    // Analytics and Monitoring
    NEXT_PUBLIC_GOOGLE_ANALYTICS_ID: string;
    NEXT_PUBLIC_SENTRY_DSN: string;
    
    // Feature Control
    NEXT_PUBLIC_FEATURE_FLAGS: string; // JSON string of feature flags
    NEXT_PUBLIC_MAINTENANCE_MODE: string; // 'true' or 'false'
    
    // Build Information
    NEXT_PUBLIC_BUILD_VERSION: string;
    NEXT_PUBLIC_BUILD_TIME: string;
  }
}