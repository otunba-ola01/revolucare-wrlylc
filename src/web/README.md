# Revolucare Web Frontend

Next-generation care management platform designed to transform how care services are delivered, matched, and managed for individuals with disabilities. This repository contains the web frontend built with Next.js, React, and Tailwind CSS.

## Getting Started

Instructions for setting up the development environment and running the application locally.

### Prerequisites

- Node.js 18.0.0 or later
- npm 9.0.0 or later
- Git

Optional:
- Docker and Docker Compose (for containerized development)

### Installation

1. Clone the repository
```bash
git clone https://github.com/your-organization/revolucare.git
cd revolucare/src/web
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env.local
```
Edit `.env.local` with your local configuration values.

### Development Server

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Project Structure

Overview of the project's directory structure and organization.

### Directory Organization

```
src/web/
├── app/                  # Next.js App Router pages and layouts
│   ├── (dashboard)/      # Dashboard route group
│   ├── api/              # API routes
│   ├── auth/             # Authentication pages
│   └── layout.tsx        # Root layout component
├── components/           # React components
│   ├── analytics/        # Analytics-related components
│   ├── auth/             # Authentication components
│   ├── care-plans/       # Care plan components
│   ├── common/           # Shared utility components
│   ├── dashboard/        # Dashboard-specific components
│   ├── documents/        # Document management components
│   ├── layout/           # Layout components
│   ├── providers/        # Provider-related components
│   ├── services-plans/   # Service plan components
│   └── ui/               # UI component library (shadcn/ui)
├── config/               # Application configuration
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
│   ├── api/              # API client utilities
│   ├── auth/             # Authentication utilities
│   ├── schemas/          # Zod validation schemas
│   ├── state/            # Global state providers
│   └── utils/            # Utility functions
├── public/               # Static assets
├── styles/               # Global styles
├── types/                # TypeScript type definitions
└── __tests__/           # Test files
```

### Key Files

- `package.json`: Project dependencies and scripts
- `next.config.js`: Next.js configuration
- `tsconfig.json`: TypeScript configuration
- `tailwind.config.ts`: Tailwind CSS configuration
- `jest.config.ts`: Jest testing configuration
- `playwright.config.ts`: Playwright E2E testing configuration
- `middleware.ts`: Next.js middleware for authentication and routing

## Architecture

The Revolucare web frontend follows a component-based architecture using Next.js with the App Router for server-side rendering and client-side navigation.

### Core Technologies

- **Next.js**: React framework for server-side rendering and static site generation
- **React**: JavaScript library for building user interfaces
- **TypeScript**: Type-safe JavaScript for improved developer experience
- **Tailwind CSS**: Utility-first CSS framework for styling
- **shadcn/ui**: Component library built on Radix UI primitives
- **React Query**: Data fetching and state management
- **React Hook Form**: Form handling with validation
- **Zod**: Schema validation library
- **NextAuth.js**: Authentication for Next.js applications

### State Management

The application uses a combination of:

- **React Context**: For global state (auth, theme, notifications)
- **React Query**: For server state and data fetching
- **React Hook Form**: For form state
- **Local Storage**: For persisting user preferences

### Routing

Next.js App Router is used for routing with the following structure:

- `/`: Home page
- `/auth/*`: Authentication pages
- `/(dashboard)/*`: Dashboard pages (protected routes)
  - `/care-plans/*`: Care plan management
  - `/services-plans/*`: Service plan management
  - `/providers/*`: Provider management
  - `/documents/*`: Document management
  - `/analytics/*`: Analytics dashboards
  - `/profile/*`: User profile management
  - `/settings/*`: User settings
  - `/notifications/*`: Notification center

## Development Guidelines

Guidelines and best practices for developing the Revolucare web frontend.

### Code Style

The project uses ESLint and Prettier for code formatting and linting:

```bash
# Check code style
npm run lint

# Fix code style issues
npm run lint:fix

# Format code
npm run format
```

### Component Development

- Follow the component structure in the `components/` directory
- Use TypeScript for type safety
- Create reusable components in `components/ui/`
- Use Tailwind CSS for styling
- Implement responsive design for all components
- Ensure accessibility compliance (WCAG 2.1 AA)

### State Management

- Use React Query for server state
- Use React Context for global state
- Keep state as local as possible
- Use custom hooks to encapsulate state logic

### Performance Optimization

- Use Next.js Image component for optimized images
- Implement code splitting with dynamic imports
- Use React.memo for expensive components
- Optimize re-renders with useMemo and useCallback
- Analyze bundle size with `npm run analyze`

## Testing

The project uses a comprehensive testing strategy with multiple levels of testing.

### Unit Testing

Jest and React Testing Library are used for unit testing components, hooks, and utilities:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

Test files are located in the `__tests__` directory, mirroring the structure of the source code.

### End-to-End Testing

Playwright is used for end-to-end testing of critical user journeys:

```bash
# Run E2E tests
npm run e2e

# Run E2E tests with UI
npm run e2e:ui
```

E2E test files are located in the `e2e` directory with the `.spec.ts` extension.

### Testing Guidelines

- Write tests for all new components and features
- Aim for high code coverage (80%+ for most code)
- Focus on testing behavior, not implementation details
- Use mock data and services for external dependencies
- Test accessibility with axe-core in E2E tests

## Deployment

The Revolucare web frontend is deployed using Vercel's platform, which is optimized for Next.js applications.

### Build Process

To build the application for production:

```bash
npm run build
```

This generates an optimized production build in the `.next` directory.

### Environment Configuration

The application uses environment variables for configuration. See `.env.example` for required variables.

For production deployment, set these variables in your hosting environment.

### CI/CD Pipeline

The project uses GitHub Actions for continuous integration and deployment:

- Pull requests trigger linting, type checking, and tests
- Merges to main branch trigger deployment to staging
- Release tags trigger deployment to production

See the workflows in `.github/workflows/` for details.

## Key Features

Overview of the main features implemented in the web frontend.

### User Authentication

- Multi-role user registration and login
- Role-based access control
- Password reset and account recovery
- Social login integration (optional)

### Care Plan Management

- AI-powered care plan generation
- Document upload and analysis
- Care plan editing and customization
- Care plan history and versioning

### Provider Matching

- AI-driven provider recommendations
- Provider search and filtering
- Provider profiles and reviews
- Compatibility scoring

### Service Plan Management

- Service plan creation and editing
- Cost estimation and funding sources
- Service scheduling and tracking
- Service outcome monitoring

### Analytics Dashboards

- Role-specific analytics views
- Interactive data visualization
- Custom report generation
- Performance metrics and KPIs

## Accessibility

The Revolucare platform is designed to meet WCAG 2.1 AA compliance standards.

### Accessibility Features

- Semantic HTML structure
- ARIA attributes for complex components
- Keyboard navigation support
- Screen reader compatibility
- Color contrast compliance
- Focus management
- Reduced motion support

### Testing Accessibility

- Use axe-core for automated accessibility testing
- Test with screen readers (NVDA, VoiceOver)
- Verify keyboard navigation
- Check color contrast
- Test with browser accessibility tools

## Contributing

Guidelines for contributing to the Revolucare web frontend.

### Development Workflow

1. Create a feature branch from `main`
2. Implement your changes with tests
3. Ensure all tests pass
4. Submit a pull request
5. Address review feedback
6. Merge after approval

### Pull Request Guidelines

- Keep PRs focused on a single feature or bug fix
- Include tests for new functionality
- Update documentation as needed
- Follow the code style guidelines
- Ensure CI checks pass

## Troubleshooting

Common issues and their solutions.

### Common Issues

- **Build errors**: Ensure Node.js version is 18+
- **API connection issues**: Check backend URL in environment variables
- **Authentication problems**: Verify NextAuth.js configuration
- **Styling inconsistencies**: Run `npm run build` to regenerate CSS

### Getting Help

- Check existing GitHub issues
- Create a new issue with detailed reproduction steps
- Contact the development team through the project chat

## License

This project is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.