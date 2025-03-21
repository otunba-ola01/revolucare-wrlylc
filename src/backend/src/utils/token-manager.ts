/**
 * Utility module that provides comprehensive JWT token management functionality for the Revolucare platform,
 * including token generation, verification, and revocation. This module implements secure token
 * handling practices for authentication and authorization.
 *
 * @module utils/token-manager
 */

import jwt from 'jsonwebtoken'; // jsonwebtoken@^9.0.0
import ms from 'ms'; // ms@^2.1.3

import { TokenPayload, TokenVerificationResult, AuthTokens, RefreshTokenData } from '../interfaces/auth.interface';
import { Roles } from '../constants/roles';
import { errorFactory } from './error-handler';
import { ErrorCodes } from '../constants/error-codes';
import { logger } from '../config/logger';
import { generateSecureRandomString } from './security';

// Environment variables with defaults
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
const ACCESS_TOKEN_EXPIRATION = process.env.ACCESS_TOKEN_EXPIRATION || '15m';
const REFRESH_TOKEN_EXPIRATION = process.env.REFRESH_TOKEN_EXPIRATION || '7d';
const TOKEN_ISSUER = process.env.TOKEN_ISSUER || 'revolucare';
const TOKEN_AUDIENCE = process.env.TOKEN_AUDIENCE || 'revolucare-api';

/**
 * Generates a JWT access token for a user
 *
 * @param payload - Token payload containing user information
 * @returns JWT access token
 * @throws Error if token generation fails or payload is invalid
 */
export function generateAccessToken(payload: TokenPayload): string {
  // Validate payload
  if (!payload.userId || !payload.email || !payload.role) {
    throw errorFactory.createError(
      'Invalid token payload',
      ErrorCodes.VALIDATION_ERROR,
      { payload }
    );
  }

  try {
    // Calculate expiration time
    const expiresIn = ACCESS_TOKEN_EXPIRATION;
    
    // Add standard JWT claims to payload
    const tokenPayload = {
      ...payload,
      iat: Math.floor(Date.now() / 1000), // issued at time
      exp: Math.floor(Date.now() / 1000) + getTokenExpiration(expiresIn), // expiration time
      iss: TOKEN_ISSUER, // issuer
      aud: TOKEN_AUDIENCE // audience
    };
    
    // Sign the token with the secret
    const token = jwt.sign(tokenPayload, ACCESS_TOKEN_SECRET as string, {
      algorithm: 'HS256'
    });
    
    logger.debug('Access token generated', { userId: payload.userId });
    return token;
  } catch (error) {
    logger.error('Failed to generate access token', { error });
    throw errorFactory.createError(
      'Failed to generate access token',
      ErrorCodes.INTERNAL_SERVER_ERROR,
      {},
      error as Error
    );
  }
}

/**
 * Generates a secure refresh token for token renewal
 *
 * @param userId - The user ID for whom to generate the token
 * @returns Refresh token data including token, userId, and expiration
 */
export async function generateRefreshToken(userId: string): Promise<RefreshTokenData> {
  try {
    // Generate a secure random token
    const token = generateSecureRandomString(64);
    
    // Calculate expiration date
    const expirationMs = ms(REFRESH_TOKEN_EXPIRATION);
    const expiresAt = new Date(Date.now() + expirationMs);
    
    // Create refresh token data
    const refreshToken: RefreshTokenData = {
      token,
      userId,
      expiresAt,
      createdAt: new Date(),
      isRevoked: false
    };
    
    logger.debug('Refresh token generated', { userId });
    return refreshToken;
  } catch (error) {
    logger.error('Failed to generate refresh token', { error, userId });
    throw errorFactory.createError(
      'Failed to generate refresh token',
      ErrorCodes.INTERNAL_SERVER_ERROR,
      {},
      error as Error
    );
  }
}

/**
 * Generates both access and refresh tokens for a user
 *
 * @param payload - Token payload containing user information
 * @returns Object containing access token, refresh token, and expiration
 */
export async function generateTokens(payload: TokenPayload): Promise<AuthTokens> {
  try {
    // Generate access token
    const accessToken = generateAccessToken(payload);
    
    // Generate refresh token
    const refreshTokenData = await generateRefreshToken(payload.userId);
    
    // Calculate expiration in seconds
    const expiresIn = getTokenExpiration(ACCESS_TOKEN_EXPIRATION);
    
    return {
      accessToken,
      refreshToken: refreshTokenData.token,
      expiresIn
    };
  } catch (error) {
    logger.error('Failed to generate tokens', { error, userId: payload.userId });
    throw errorFactory.createError(
      'Failed to generate authentication tokens',
      ErrorCodes.INTERNAL_SERVER_ERROR,
      {},
      error as Error
    );
  }
}

/**
 * Verifies a JWT access token and returns the payload if valid
 *
 * @param token - The JWT token to verify
 * @returns Verification result with validity status and payload
 */
export function verifyAccessToken(token: string): TokenVerificationResult {
  // Initialize verification result
  const result: TokenVerificationResult = {
    isValid: false,
    payload: null,
    error: null
  };
  
  // Check if token is provided
  if (!token) {
    result.error = 'Token is required';
    logger.debug('Token verification failed: Token is required');
    return result;
  }
  
  try {
    // Verify the token
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET as string, {
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
      algorithms: ['HS256']
    }) as TokenPayload;
    
    // Set verification result
    result.isValid = true;
    result.payload = decoded;
    logger.debug('Token verified successfully', { userId: decoded.userId });
    
    return result;
  } catch (error) {
    // Handle specific verification errors
    if (error instanceof jwt.TokenExpiredError) {
      result.error = 'Token has expired';
      logger.debug('Token verification failed: Token has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      result.error = 'Invalid token';
      logger.debug('Token verification failed: Invalid token');
    } else if (error instanceof jwt.NotBeforeError) {
      result.error = 'Token not active';
      logger.debug('Token verification failed: Token not active');
    } else {
      result.error = 'Token verification failed';
      logger.error('Token verification failed', { error });
    }
    
    return result;
  }
}

/**
 * Verifies a refresh token against stored token data
 *
 * @param token - The refresh token to verify
 * @param storedToken - The stored refresh token data
 * @returns True if token is valid, false otherwise
 */
export function verifyRefreshToken(token: string, storedToken: RefreshTokenData): boolean {
  try {
    // Check if token matches
    if (token !== storedToken.token) {
      logger.debug('Refresh token verification failed: Token mismatch');
      return false;
    }
    
    // Check if token has expired
    if (storedToken.expiresAt < new Date()) {
      logger.debug('Refresh token verification failed: Token expired');
      return false;
    }
    
    // Check if token has been revoked
    if (storedToken.isRevoked) {
      logger.debug('Refresh token verification failed: Token revoked');
      return false;
    }
    
    logger.debug('Refresh token verified successfully', { userId: storedToken.userId });
    return true;
  } catch (error) {
    logger.error('Error verifying refresh token', { error });
    return false;
  }
}

/**
 * Marks a refresh token as revoked to prevent future use
 *
 * @param tokenData - The refresh token data to revoke
 * @returns Updated token data with revoked status
 */
export function revokeRefreshToken(tokenData: RefreshTokenData): RefreshTokenData {
  // Mark the token as revoked
  const revokedToken = {
    ...tokenData,
    isRevoked: true
  };
  
  logger.debug('Refresh token revoked', { userId: tokenData.userId });
  return revokedToken;
}

/**
 * Decodes a JWT token without verifying its signature
 * Note: This function does not verify the token's authenticity
 *
 * @param token - The JWT token to decode
 * @returns Decoded token payload or null if invalid format
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.decode(token) as TokenPayload;
    return decoded;
  } catch (error) {
    logger.debug('Failed to decode token', { error });
    return null;
  }
}

/**
 * Calculates token expiration time in seconds from now
 *
 * @param expirationString - Expiration time string (e.g., '15m', '7d')
 * @returns Expiration time in seconds
 */
export function getTokenExpiration(expirationString: string): number {
  // Convert expiration string to milliseconds
  const expirationMs = ms(expirationString);
  
  // Convert to seconds
  return Math.floor(expirationMs / 1000);
}