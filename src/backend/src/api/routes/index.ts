import express, { Router } from 'express'; // express@^4.18.2
import createAuthRouter from './auth.routes';
import createUserRouter from './users.routes';
import createCarePlansRouter from './care-plans.routes';
import createServicesPlanRouter from './services-plans.routes';
import createProviderRoutes from './providers.routes';
import createAnalyticsRouter from './analytics.routes';
import createDocumentsRouter from './documents.routes';
import createNotificationsRouter from './notifications.routes';
import { AuthService } from '../../services/auth.service';
import { UsersService } from '../../services/users.service';
import { CarePlansService } from '../../services/care-plans.service';
import { ServicesPlanService } from '../../services/services-plans.service';
import { ProvidersService } from '../../services/providers.service';
import { AnalyticsService } from '../../services/analytics.service';
import { DocumentService } from '../../services/documents.service';
import { NotificationService } from '../../services/notifications.service';

/**
 * Creates and configures the main API router by mounting all feature-specific routers at their respective paths
 * @param   services  
 * @returns Configured Express router with all API routes mounted
 */
function createApiRouter(services: { AuthService: AuthService; UsersService: UsersService; CarePlansService: CarePlansService; ServicesPlanService: ServicesPlanService; ProvidersService: ProvidersService; AnalyticsService: AnalyticsService; DocumentService: DocumentService; NotificationService: NotificationService; }): Router {
  // Create a new Express Router instance
  const router = express.Router();

  // Extract service instances from the services parameter
  const { AuthService, UsersService, CarePlansService, ServicesPlanService, ProvidersService, AnalyticsService, DocumentService, NotificationService } = services;

  // Initialize all feature-specific routers with their required service dependencies
  const authRouter = createAuthRouter(AuthService);
  const usersRouter = createUserRouter();
  const carePlansRouter = createCarePlansRouter();
  const servicesPlansRouter = createServicesPlanRouter();
  const providersRouter = createProviderRoutes();
  const analyticsRouter = createAnalyticsRouter();
  const documentsRouter = createDocumentsRouter();
  const notificationsRouter = createNotificationsRouter();

  // Mount the auth router at /auth
  router.use('/auth', authRouter);

  // Mount the users router at /users
  router.use('/users', usersRouter);

  // Mount the care-plans router at /care-plans
  router.use('/care-plans', carePlansRouter);

  // Mount the services-plans router at /services-plans
  router.use('/services-plans', servicesPlansRouter);

  // Mount the providers router at /providers
  router.use('/providers', providersRouter);

  // Mount the analytics router at /analytics
  router.use('/analytics', analyticsRouter);

  // Mount the documents router at /documents
  router.use('/documents', documentsRouter);

  // Mount the notifications router at /notifications
  router.use('/notifications', notificationsRouter);

  // Return the configured main router
  return router;
}

// Export the createApiRouter function as the default export
export default createApiRouter;