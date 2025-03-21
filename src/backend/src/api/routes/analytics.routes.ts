import express from 'express'; // express@^4.18.2
import analyticsController from '../controllers/analytics.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validateQuery, validateBody } from '../middlewares/validation.middleware';
import { 
  metricsRequestSchema, 
  dashboardRequestSchema, 
  reportRequestSchema, 
  exportRequestSchema, 
  analyticsEventSchema 
} from '../validators/analytics.validator';
import { Roles } from '../../constants/roles';

/**
 * Creates and configures the Express router for analytics endpoints
 * @returns Configured Express router with analytics endpoints
 */
function createAnalyticsRouter(): express.Router {
  // Create a new Express Router instance
  const router = express.Router();

  // Configure GET /metrics endpoint with authentication, authorization, validation, and controller
  router.get(
    '/metrics',
    authenticate,
    authorize([Roles.ADMINISTRATOR, Roles.CASE_MANAGER, Roles.PROVIDER, Roles.CLIENT]),
    validateQuery(metricsRequestSchema),
    analyticsController.getMetrics
  );

  // Configure GET /dashboard endpoint with authentication, authorization, validation, and controller
  router.get(
    '/dashboard',
    authenticate,
    authorize([Roles.ADMINISTRATOR, Roles.CASE_MANAGER, Roles.PROVIDER, Roles.CLIENT]),
    validateQuery(dashboardRequestSchema),
    analyticsController.getDashboard
  );

  // Configure POST /reports endpoint with authentication, authorization, validation, and controller
  router.post(
    '/reports',
    authenticate,
    authorize([Roles.ADMINISTRATOR, Roles.CASE_MANAGER]),
    validateBody(reportRequestSchema),
    analyticsController.generateReport
  );

  // Configure POST /export endpoint with authentication, authorization, validation, and controller
  router.post(
    '/export',
    authenticate,
    authorize([Roles.ADMINISTRATOR, Roles.CASE_MANAGER]),
    validateBody(exportRequestSchema),
    analyticsController.exportData
  );

  // Configure POST /events endpoint with authentication, validation, and controller
  router.post(
    '/events',
    authenticate,
    validateBody(analyticsEventSchema),
    analyticsController.trackEvent
  );

  // Return the configured router
  return router;
}

export default createAnalyticsRouter;