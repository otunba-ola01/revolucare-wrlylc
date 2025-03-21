# Revolucare

<p align="center">
  <img src="src/web/public/images/logo.svg" alt="Revolucare Logo" width="200">
</p>

> Next-generation care management platform leveraging AI to transform how care services are delivered, matched, and managed for individuals with disabilities.

## Overview

Revolucare is a comprehensive care management platform designed to connect clients with appropriate care providers, generate personalized care plans, and streamline the entire care management process. The platform leverages artificial intelligence to improve care outcomes and operational efficiency.

### Key Features

- **AI-powered care plan generation** - Analyze medical records and generate personalized care plans
- **Provider matching and recommendations** - Connect clients with the most suitable care providers
- **Real-time availability tracking** - Monitor provider availability in real-time
- **Comprehensive analytics** - Track outcomes and performance metrics
- **Multi-role platform** - Tailored experiences for clients, providers, case managers, and administrators

## Technology Stack

### Frontend
- **Next.js 14+** - React framework with server-side rendering
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Accessible component library
- **React Query** - Data fetching and state management

### Backend
- **Node.js** - JavaScript runtime
- **TypeScript** - Type-safe JavaScript
- **Prisma** - Type-safe ORM for database access
- **PostgreSQL** - Relational database
- **Redis** - In-memory data store for caching and real-time features

### Infrastructure
- **Vercel** - Hosting and deployment platform
- **AWS** - Cloud infrastructure for database, storage, and AI services
- **Docker** - Containerization for development and deployment
- **Pulumi** - Infrastructure as Code

## Project Structure

```
├── src/
│   ├── web/                 # Next.js frontend application
│   │   ├── app/             # Next.js App Router pages
│   │   ├── components/      # React components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utility functions and services
│   │   └── types/           # TypeScript type definitions
│   │
│   └── backend/             # Backend API and services
│       ├── prisma/          # Database schema and migrations
│       ├── src/             # Source code
│       │   ├── api/         # API routes and controllers
│       │   ├── config/      # Configuration files
│       │   ├── models/      # Data models
│       │   ├── services/    # Business logic services
│       │   └── utils/       # Utility functions
│       └── tests/           # Backend tests
│
├── infrastructure/          # Infrastructure as Code and deployment
│   ├── docker/              # Docker configuration
│   ├── kubernetes/          # Kubernetes configuration
│   ├── pulumi/              # Pulumi IaC
│   └── scripts/             # Deployment and maintenance scripts
│
└── .github/                 # GitHub workflows and templates
```

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm 9.x or later
- Docker and Docker Compose (for local development)
- PostgreSQL 15.x (or use Docker)
- Redis 7.x (or use Docker)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/your-organization/revolucare.git
   cd revolucare
   ```

2. Install dependencies
   ```bash
   # Install frontend dependencies
   cd src/web
   npm install

   # Install backend dependencies
   cd ../backend
   npm install
   ```

3. Set up environment variables
   ```bash
   # Frontend
   cd src/web
   cp .env.example .env.local

   # Backend
   cd ../backend
   cp .env.example .env
   ```

4. Start the development environment
   ```bash
   # Using Docker Compose (recommended)
   docker-compose up -d

   # Or start services individually
   cd src/backend
   npm run dev

   cd ../web
   npm run dev
   ```

5. Access the application
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000
   - API Documentation: http://localhost:4000/api-docs

## Development Guidelines

### Code Style

This project uses ESLint and Prettier for code formatting and linting:

```bash
# Run linting
npm run lint

# Format code
npm run format
```

### Testing

```bash
# Run frontend tests
cd src/web
npm test

# Run backend tests
cd src/backend
npm test

# Run E2E tests
cd src/web
npm run test:e2e
```

### Branching Strategy

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - Feature branches
- `bugfix/*` - Bug fix branches
- `release/*` - Release preparation branches

### Pull Request Process

1. Create a feature or bugfix branch from `develop`
2. Implement your changes with appropriate tests
3. Ensure all tests pass and code meets style guidelines
4. Submit a pull request to the `develop` branch
5. Request review from at least one team member
6. Address any feedback from code review
7. Once approved, merge your PR into `develop`

## Deployment

The application is deployed using GitHub Actions workflows:

- **Development**: Automatic deployment on changes to `develop` branch
- **Staging**: Manual trigger or promotion from development
- **Production**: Manual trigger or promotion from staging

### Infrastructure

Infrastructure is managed using Pulumi:

```bash
# Deploy infrastructure
cd infrastructure/pulumi
pulumi up --stack dev
```

See the [infrastructure README](infrastructure/README.md) for more details.

## Contributing

We welcome contributions to Revolucare! Please see our [Contributing Guidelines](.github/CONTRIBUTING.md) for more information on how to get involved.

## License

This project is licensed under the [MIT License](LICENSE).