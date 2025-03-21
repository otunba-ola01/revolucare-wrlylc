# src/backend/src/api/routes/users.routes.ts
```typescript
import { Router } from 'express'; // express@4.18.2
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validateBody, validateParams, validateQuery } from '../middlewares/validation.middleware';
import { 
  getUserProfile, 
  getUserById,
  updateUserProfile, 
  updateUser,
  updateUserPreferences, 
  deleteUser, 
  searchUsers,
  getUsersByRole,
  reactivateUser
} from '../controllers/users.controller';
import { 
  userIdSchema, 
  profileUpdateSchema, 
  userPreferencesSchema, 
  userSearchSchema, 
  userRoleSchema,
  paginationSchema
} from '../validators/users.validator';
import { Roles } from '../../constants/roles';

/**
 * Creates and configures the Express router for user-related API endpoints
 * @returns Configured Express router with user management routes
 */
function createUserRouter(): Router {
  // Create a new Express Router instance
  const router = Router();

  // Configure routes for user profile management
  router.get('/profile', authenticate, getUserProfile);
  router.put('/profile', authenticate, validateBody(profileUpdateSchema), updateUserProfile);

  // Configure routes for user preferences management
  router.get('/preferences', authenticate, getUserProfile);
  router.put('/preferences', authenticate, validateBody(userPreferencesSchema), updateUserPreferences);

  // Configure routes for user search and filtering
  router.get('/', authenticate, authorize([Roles.ADMINISTRATOR, Roles.CASE_MANAGER]), validateQuery(userSearchSchema), searchUsers);

  // Configure routes for administrative user operations
  router.get('/:id', authenticate, authorize([Roles.ADMINISTRATOR]), validateParams(userIdSchema), getUserById);
  router.put('/:id', authenticate, authorize([Roles.ADMINISTRATOR]), validateParams(userIdSchema), validateBody(profileUpdateSchema), updateUser);
  router.delete('/:id', authenticate, authorize([Roles.ADMINISTRATOR]), validateParams(userIdSchema), deleteUser);
  router.put('/:id/reactivate', authenticate, authorize([Roles.ADMINISTRATOR]), validateParams(userIdSchema), reactivateUser);
  router.get('/role/:role', authenticate, authorize([Roles.ADMINISTRATOR]), validateParams(userRoleSchema), validateQuery(paginationSchema), getUsersByRole);

  // Return the configured router
  return router;
}

// Export the createUserRouter function as the default export
export default createUserRouter;