/**
 * Authentication middleware for the Revolucare platform.
 * 
 * This middleware provides JWT token verification, user context extraction,
 * and role-based/permission-based access control for protected API routes.
 * It implements the authentication and authorization framework as defined
 * in the technical specifications.
 */

import { Request, Response, NextFunction } from 'express'; // express@4.18.2
import { verifyAccessToken } from '../../utils/token-manager';
import { errorFactory } from '../../utils/error-handler';
import { ErrorCodes } from '../../constants/error-codes';
import { Roles, RoleHierarchy } from '../../constants/roles';
import { UserContext, AuthenticatedRequest } from '../../interfaces/auth.interface';
import { logger } from '../../utils/logger';

// Constants for token retrieval
const TOKEN_HEADER = 'Authorization';
const TOKEN_PREFIX = 'Bearer ';

/**
 * Middleware that authenticates requests by verifying JWT tokens
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  try {
    // Extract token from request
    const token = extractToken(req);
    
    // If no token is found, return 401 Unauthorized
    if (!token) {
      logger.debug('Authentication failed: No token provided');
      throw errorFactory.createUnauthorizedError(
        'Authentication token is required', 
        { source: req.originalUrl }
      );
    }
    
    // Verify the token
    const verificationResult = verifyAccessToken(token);
    
    // If token is invalid, return 401 Unauthorized
    if (!verificationResult.isValid || !verificationResult.payload) {
      logger.debug('Authentication failed: Invalid token', { error: verificationResult.error });
      throw errorFactory.createUnauthorizedError(
        verificationResult.error || 'Invalid authentication token',
        { source: req.originalUrl }
      );
    }
    
    // Extract user context from token payload
    const { userId, email, role, isVerified } = verificationResult.payload;
    
    // Get the permissions for this role (would normally come from a permissions service)
    // For now we'll just use an empty array since we don't have the actual permissions implementation
    const permissions: string[] = [];
    
    // Create user context
    const userContext: UserContext = {
      userId,
      email,
      role,
      isVerified,
      permissions
    };
    
    // Attach user context to request object
    (req as AuthenticatedRequest).user = userContext;
    
    logger.debug('Authentication successful', { userId, role });
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware factory that creates role-based authorization middleware
 * 
 * @param allowedRoles - Array of roles that are allowed to access the resource
 * @returns Middleware function that checks if user has required role
 */
export function authorize(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Check if request has been authenticated
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user) {
        logger.debug('Authorization failed: User not authenticated');
        throw errorFactory.createUnauthorizedError(
          'Authentication required', 
          { source: req.originalUrl }
        );
      }
      
      // Extract user role from context
      const { role, userId } = authReq.user;
      
      // Check if user role is allowed based on role hierarchy
      const hasAccess = checkRoleHierarchy(role, allowedRoles);
      
      if (hasAccess) {
        logger.debug('Authorization successful', { 
          userId, 
          userRole: role, 
          allowedRoles 
        });
        next();
      } else {
        logger.debug('Authorization failed: Insufficient permissions', {
          userId,
          userRole: role,
          allowedRoles,
          source: req.originalUrl
        });
        throw errorFactory.createForbiddenError(
          'You do not have permission to access this resource',
          { userRole: role, requiredRoles: allowedRoles }
        );
      }
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware factory that creates permission-based authorization middleware
 * 
 * @param requiredPermissions - Array of permissions required to access the resource
 * @returns Middleware function that checks if user has required permissions
 */
export function hasPermission(requiredPermissions: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Check if request has been authenticated
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user) {
        logger.debug('Permission check failed: User not authenticated');
        throw errorFactory.createUnauthorizedError(
          'Authentication required', 
          { source: req.originalUrl }
        );
      }
      
      // Extract user permissions from context
      const { permissions, userId, role } = authReq.user;
      
      // Check if user has all required permissions
      const hasAllPermissions = requiredPermissions.every(
        permission => permissions.includes(permission)
      );
      
      if (hasAllPermissions) {
        logger.debug('Permission check successful', { 
          userId, 
          requiredPermissions 
        });
        next();
      } else {
        logger.debug('Permission check failed: Missing required permissions', {
          userId,
          userRole: role,
          userPermissions: permissions,
          requiredPermissions,
          source: req.originalUrl
        });
        throw errorFactory.createForbiddenError(
          'You do not have the required permissions to access this resource',
          { requiredPermissions }
        );
      }
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Helper function to extract JWT token from request
 * 
 * @param req - Express request object
 * @returns Extracted token or null if not found
 */
function extractToken(req: Request): string | null {
  // Check Authorization header first
  const authHeader = req.headers[TOKEN_HEADER.toLowerCase()] as string;
  if (authHeader && authHeader.startsWith(TOKEN_PREFIX)) {
    return authHeader.substring(TOKEN_PREFIX.length);
  }
  
  // If not in header, check cookies
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }
  
  // No token found
  return null;
}

/**
 * Helper function to check if a role has access based on role hierarchy
 * 
 * @param userRole - User's role
 * @param allowedRoles - Array of roles that are allowed
 * @returns True if user role has access, false otherwise
 */
function checkRoleHierarchy(userRole: string, allowedRoles: string[]): boolean {
  // If user role is directly in allowed roles, return true
  if (allowedRoles.includes(userRole)) {
    return true;
  }
  
  // Check if user role is higher in hierarchy than any allowed role
  if (userRole in RoleHierarchy) {
    // Get the roles that this user role can access
    const accessibleRoles = RoleHierarchy[userRole as Roles];
    
    // Check if any allowed role is in the accessible roles for this user
    return allowedRoles.some(role => accessibleRoles.includes(role as Roles));
  }
  
  // Role not found in hierarchy
  return false;
}