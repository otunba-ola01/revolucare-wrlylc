# Revolucare Backend

Backend services for the Revolucare care management platform. This application provides the API and services required to power the Revolucare platform, an AI-driven care management system for individuals with disabilities.

## Features

- User authentication and profile management
- AI-powered care plan generation
- Services plan creation and management
- Provider matching and recommendations
- Real-time availability tracking
- Document processing and analysis
- Notifications across multiple channels
- Analytics and reporting

## Technology Stack

- **Language**: TypeScript 5.0+
- **Runtime**: Node.js 18+
- **Framework**: Express
- **Database**: PostgreSQL with Prisma ORM
- **Caching**: Redis
- **Storage**: Vercel Blob Storage
- **Testing**: Jest, Supertest
- **Documentation**: OpenAPI/Swagger
- **External Services**:
  - OpenAI API for natural language processing
  - Azure Form Recognizer for document analysis
  - SendGrid for email notifications
  - Twilio for SMS notifications
  - Stripe for payment processing
  - Google Calendar and Microsoft Graph for calendar integration

## Prerequisites

- Node.js 18.0.0 or higher
- PostgreSQL 15.0 or higher
- Redis 7.0 or higher
- API keys for external services (see .env.example)

## Getting Started

1. Clone the repository
2. Navigate to the backend directory: `cd src/backend`
3. Install dependencies: `npm install`
4. Copy `.env.example` to `.env` and update with your configuration
5. Generate Prisma client: `npm run prisma:generate`
6. Run database migrations: `npm run prisma:migrate`
7. Seed the database: `npm run seed`
8. Start the development server: `npm run dev`

## Environment Variables

The application requires several environment variables to be set for proper operation. See `.env.example` for a complete list of required and optional variables. Key categories include:

### Application Settings
Basic configuration for the application environment, ports, URLs, and logging.

### Authentication
JWT secrets and expiration times for secure authentication.

### Database
PostgreSQL connection details and pool configuration.

### Redis
Redis connection details for caching and real-time features.

### External Services
API keys and configuration for AI services, email, SMS, payment processing, and calendar integration.

### Storage
Configuration for document storage using Vercel Blob Storage.

## Available Scripts

- `npm run dev`: Start development server with hot reloading
- `npm run build`: Compile TypeScript to JavaScript
- `npm run start`: Start production server from compiled JavaScript
- `npm run test`: Run all tests
- `npm run test:watch`: Run tests in watch mode
- `npm run test:coverage`: Run tests with coverage report
- `npm run lint`: Run ESLint on TypeScript files
- `npm run lint:fix`: Run ESLint and fix issues automatically
- `npm run format`: Format code with Prettier
- `npm run prisma:generate`: Generate Prisma client
- `npm run prisma:migrate`: Run database migrations for development
- `npm run prisma:deploy`: Deploy database migrations for production
- `npm run prisma:studio`: Open Prisma Studio for database visualization
- `npm run seed`: Seed database with initial data

## Project Structure

```
src/backend/
├── prisma/                  # Database schema and migrations
│   ├── migrations/          # Database migration files
│   ├── schema.prisma        # Prisma schema definition
│   └── seed.ts              # Database seeding script
├── src/
│   ├── api/                 # API layer
│   │   ├── controllers/     # Request handlers
│   │   ├── middlewares/     # API-specific middleware
│   │   ├── routes/          # Route definitions
│   │   └── validators/      # Request validation
│   ├── cache/               # Caching layer
│   ├── config/              # Application configuration
│   ├── constants/           # Application constants
│   ├── events/              # Event system
│   │   ├── handlers/        # Event handlers
│   │   └── subscribers/     # Event subscribers
│   ├── integrations/        # External service integrations
│   ├── interfaces/          # TypeScript interfaces
│   ├── middleware/          # Application middleware
│   ├── models/              # Data models
│   ├── queue/               # Background job processing
│   │   ├── jobs/            # Job definitions
│   │   └── processors/      # Job processors
│   ├── repositories/        # Data access layer
│   ├── services/            # Business logic
│   │   ├── ai/              # AI services
│   │   ├── calendar/        # Calendar integration
│   │   ├── email/           # Email services
│   │   ├── payment/         # Payment processing
│   │   ├── sms/             # SMS services
│   │   └── storage/         # Storage services
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Utility functions
│   ├── websockets/          # WebSocket handlers
│   ├── index.ts             # Application entry point
│   └── server.ts            # Server configuration
├── tests/                   # Test files
│   ├── fixtures/            # Test fixtures
│   ├── mocks/               # Test mocks
│   ├── unit/                # Unit tests
│   └── integration/         # Integration tests
├── .env.example             # Example environment variables
├── .eslintrc.json           # ESLint configuration
├── .prettierrc              # Prettier configuration
├── jest.config.ts           # Jest configuration
├── nodemon.json             # Nodemon configuration
├── package.json             # Package dependencies and scripts
├── tsconfig.json            # TypeScript configuration
└── README.md                # This file
```

## API Documentation

API documentation is available at `/api/docs` when the server is running. This provides a Swagger UI interface for exploring and testing the API endpoints.

## Database Schema

The database schema is defined using Prisma and includes the following key models:

### User Models
User, ClientProfile, ProviderProfile, CaseManagerProfile, AdminProfile

### Care Management Models
CarePlan, CarePlanGoal, CarePlanIntervention, CarePlanVersion

### Service Management Models
ServicesPlan, ServiceItem, FundingSource, NeedsAssessment

### Provider Models
ProviderAvailability, ServiceArea, ProviderReview, Booking

### Document Models
Document, DocumentAnalysis

### Notification Models
Notification

## Authentication

The application uses JWT-based authentication with access and refresh tokens. Access tokens are short-lived (15 minutes by default) while refresh tokens have a longer lifespan (7 days by default). Tokens are stored in HTTP-only cookies for security.

## Error Handling

The application implements a comprehensive error handling strategy with standardized error responses. Errors are categorized as validation errors, business logic errors, system errors, or integration errors, with appropriate HTTP status codes and response formats.

## Logging

Structured logging is implemented using Winston. Logs are formatted as JSON in production and colorized in development. Log levels can be configured using the LOG_LEVEL environment variable.

## Testing

The application includes comprehensive unit and integration tests using Jest and Supertest. Tests are organized by component type and include fixtures and mocks for external dependencies.

## Deployment

The application is designed to be deployed as a containerized service. Docker configuration is available in the infrastructure directory.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -am 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Submit a pull request

## License

This project is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.