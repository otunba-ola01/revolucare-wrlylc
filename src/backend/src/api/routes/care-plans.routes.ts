import express from 'express'; // express@^4.18.2
const { Router } = express;
import CarePlansController from '../controllers/care-plans.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validateBody, validateParams, validateQuery } from '../middlewares/validation.middleware';
import { createCarePlanSchema, updateCarePlanSchema, approveCarePlanSchema, generateCarePlanSchema, carePlanParamsSchema, carePlanFilterSchema } from '../validators/care-plans.validator';
import { Roles } from '../../constants/roles';
import { createCarePlansService } from '../../services/care-plans.service';

/**
 * Creates and configures an Express router for care plan endpoints
 * @returns Configured Express router with care plan routes
 */
const createCarePlansRouter = () => {
  // Create a new Express Router instance
  const router = Router();

  // Initialize the care plans service using the factory function
  const carePlansService = createCarePlansService();

  // Create a new CarePlansController instance with the service
  const carePlansController = new CarePlansController(carePlansService);

  // Define routes with appropriate middleware chains
  router.get(
    '/',
    authenticate,
    authorize([Roles.ADMINISTRATOR, Roles.CASE_MANAGER, Roles.PROVIDER, Roles.CLIENT]),
    validateQuery(carePlanFilterSchema),
    carePlansController.getCarePlans
  );

  router.post(
    '/',
    authenticate,
    authorize([Roles.ADMINISTRATOR, Roles.CASE_MANAGER]),
    validateBody(createCarePlanSchema),
    carePlansController.createCarePlan
  );

  router.post(
    '/generate',
    authenticate,
    authorize([Roles.ADMINISTRATOR, Roles.CASE_MANAGER]),
    validateBody(generateCarePlanSchema),
    carePlansController.generateCarePlanOptions
  );

  router.get(
    '/:id',
    authenticate,
    authorize([Roles.ADMINISTRATOR, Roles.CASE_MANAGER, Roles.PROVIDER, Roles.CLIENT]),
    validateParams(carePlanParamsSchema),
    carePlansController.getCarePlanById
  );

  router.put(
    '/:id',
    authenticate,
    authorize([Roles.ADMINISTRATOR, Roles.CASE_MANAGER]),
    validateParams(carePlanParamsSchema),
    validateBody(updateCarePlanSchema),
    carePlansController.updateCarePlan
  );

  router.delete(
    '/:id',
    authenticate,
    authorize([Roles.ADMINISTRATOR, Roles.CASE_MANAGER]),
    validateParams(carePlanParamsSchema),
    carePlansController.deleteCarePlan
  );

  router.post(
    '/:id/approve',
    authenticate,
    authorize([Roles.ADMINISTRATOR, Roles.CASE_MANAGER]),
    validateParams(carePlanParamsSchema),
    validateBody(approveCarePlanSchema),
    carePlansController.approveCarePlan
  );

  router.get(
    '/:id/history',
    authenticate,
    authorize([Roles.ADMINISTRATOR, Roles.CASE_MANAGER, Roles.PROVIDER]),
    validateParams(carePlanParamsSchema),
    carePlansController.getCarePlanHistory
  );

  // Return the configured router
  return router;
};

// Export the router factory function as the default export
export default createCarePlansRouter;