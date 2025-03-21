import express from 'express'; // express@^4.18.2
import { ServicesPlanController } from '../controllers/services-plans.controller';
import { IServicesPlanService } from '../../interfaces/services-plan.interface';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validateBody, validateParams, validateQuery } from '../middlewares/validation.middleware';
import {
  createNeedsAssessmentSchema,
  createServicesPlanSchema,
  updateServicesPlanSchema,
  approveServicesPlanSchema,
  generateServicesPlanSchema,
  servicesPlanParamsSchema,
  servicesPlanFilterSchema,
} from '../validators/services-plans.validator';
import { Roles } from '../../constants/roles';

/**
 * Creates and configures an Express router with all services plan related endpoints
 * @param servicesPlanService 
 * @returns Configured Express router with services plan routes
 */
export default function createServicesPlanRouter(servicesPlanService: IServicesPlanService) {
  // 1. Create a new Express Router instance
  const router = express.Router();

  // 2. Initialize the ServicesPlanController with the provided service
  const servicesPlanController = new ServicesPlanController(servicesPlanService);

  // 3. Define routes for needs assessment operations
  router.post(
    '/needs-assessments',
    authenticate,
    authorize([Roles.CASE_MANAGER]),
    validateBody(createNeedsAssessmentSchema),
    (req, res, next) => servicesPlanController.createNeedsAssessment(req, res, next)
  );

  router.get(
    '/needs-assessments/:id',
    authenticate,
    authorize([Roles.CASE_MANAGER, Roles.CLIENT]),
    validateParams(servicesPlanParamsSchema),
    (req, res, next) => servicesPlanController.getNeedsAssessment(req, res, next)
  );

  router.get(
    '/clients/:clientId/needs-assessments',
    authenticate,
    authorize([Roles.CASE_MANAGER, Roles.CLIENT]),
    validateParams(servicesPlanParamsSchema),
    (req, res, next) => servicesPlanController.getNeedsAssessmentsByClientId(req, res, next)
  );

  // 4. Define routes for services plan CRUD operations
  router.post(
    '/',
    authenticate,
    authorize([Roles.CASE_MANAGER]),
    validateBody(createServicesPlanSchema),
    (req, res, next) => servicesPlanController.createServicesPlan(req, res, next)
  );

  router.get(
    '/:id',
    authenticate,
    authorize([Roles.CASE_MANAGER, Roles.CLIENT]),
    validateParams(servicesPlanParamsSchema),
    (req, res, next) => servicesPlanController.getServicesPlanById(req, res, next)
  );

  router.get(
    '/',
    authenticate,
    authorize([Roles.CASE_MANAGER, Roles.CLIENT]),
    validateQuery(servicesPlanFilterSchema),
    (req, res, next) => servicesPlanController.getServicesPlans(req, res, next)
  );

  router.put(
    '/:id',
    authenticate,
    authorize([Roles.CASE_MANAGER]),
    validateParams(servicesPlanParamsSchema),
    validateBody(updateServicesPlanSchema),
    (req, res, next) => servicesPlanController.updateServicesPlan(req, res, next)
  );

  router.post(
    '/:id/approve',
    authenticate,
    authorize([Roles.ADMINISTRATOR, Roles.CASE_MANAGER]),
    validateParams(servicesPlanParamsSchema),
    validateBody(approveServicesPlanSchema),
    (req, res, next) => servicesPlanController.approveServicesPlan(req, res, next)
  );

  router.delete(
    '/:id',
    authenticate,
    authorize([Roles.ADMINISTRATOR]),
    validateParams(servicesPlanParamsSchema),
    (req, res, next) => servicesPlanController.deleteServicesPlan(req, res, next)
  );

  // 5. Define routes for services plan generation and cost estimation
  router.post(
    '/generate',
    authenticate,
    authorize([Roles.CASE_MANAGER, Roles.CLIENT]),
    validateBody(generateServicesPlanSchema),
    (req, res, next) => servicesPlanController.generateServicesPlanOptions(req, res, next)
  );

  router.get(
    '/:id/costs',
    authenticate,
    authorize([Roles.CASE_MANAGER, Roles.CLIENT]),
    validateParams(servicesPlanParamsSchema),
    (req, res, next) => servicesPlanController.estimateCosts(req, res, next)
  );

  router.get(
    '/clients/:clientId/services-plans/:id/funding',
    authenticate,
    authorize([Roles.CASE_MANAGER, Roles.CLIENT]),
    validateParams(servicesPlanParamsSchema),
    (req, res, next) => servicesPlanController.identifyFundingSources(req, res, next)
  );

  // 6. Apply appropriate middleware to each route (authentication, authorization, validation)

  // 7. Return the configured router
  return router;
}