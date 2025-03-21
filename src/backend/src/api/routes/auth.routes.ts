import express, { Router } from 'express'; // express@^4.18.2
import { AuthController, createAuthController } from '../controllers/auth.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validation.middleware';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  verifyEmailSchema,
  passwordResetRequestSchema,
  passwordResetConfirmSchema,
  changePasswordSchema,
  resendVerificationEmailSchema,
} from '../validators/auth.validator';
import { Roles } from '../../constants/roles';

/**
 * Creates and configures the authentication router with all auth-related endpoints
 * @param AuthService authService
 * @returns Configured Express router with authentication routes
 */
export default function createAuthRouter(AuthService: any): Router {
  // Create a new Express Router instance
  const router = express.Router();

  // Initialize AuthController with the provided authService
  const authController: AuthController = createAuthController(AuthService);

  // Define POST /register route with validation for user registration
  router.post(
    '/register',
    validateBody(registerSchema),
    (req, res, next) => authController.register(req, res, next)
  );

  // Define POST /login route with validation for user authentication
  router.post(
    '/login',
    validateBody(loginSchema),
    (req, res, next) => authController.login(req, res, next)
  );

  // Define POST /refresh-token route with validation for token refresh
  router.post(
    '/refresh-token',
    validateBody(refreshTokenSchema),
    (req, res, next) => authController.refreshToken(req, res, next)
  );

  // Define POST /logout route for user logout
  router.post(
    '/logout',
    (req, res, next) => authController.logout(req, res, next)
  );

  // Define POST /verify-email route with validation for email verification
  router.post(
    '/verify-email',
    validateBody(verifyEmailSchema),
    (req, res, next) => authController.verifyEmail(req, res, next)
  );

  // Define POST /resend-verification route with validation for resending verification email
  router.post(
    '/resend-verification',
    validateBody(resendVerificationEmailSchema),
    (req, res, next) => authController.resendVerificationEmail(req, res, next)
  );

  // Define POST /password-reset route with validation for requesting password reset
  router.post(
    '/password-reset',
    validateBody(passwordResetRequestSchema),
    (req, res, next) => authController.requestPasswordReset(req, res, next)
  );

  // Define POST /password-reset/confirm route with validation for confirming password reset
  router.post(
    '/password-reset/confirm',
    validateBody(passwordResetConfirmSchema),
    (req, res, next) => authController.resetPassword(req, res, next)
  );

  // Define POST /change-password route with authentication, authorization and validation for changing password
  router.post(
    '/change-password',
    authenticate,
    authorize([Roles.CLIENT, Roles.PROVIDER, Roles.CASE_MANAGER, Roles.ADMINISTRATOR]),
    validateBody(changePasswordSchema),
    (req, res, next) => authController.changePassword(req, res, next)
  );
    
  // Define GET /profile route with authentication for retrieving user profile
  router.get(
    '/profile',
    authenticate,
    (req, res, next) => authController.getProfile(req, res, next)
  );

  // Return the configured router
  return router;
}