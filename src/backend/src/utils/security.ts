/**
 * Utility module that provides security-related functions for the Revolucare platform,
 * including password hashing, verification, strength validation, encryption, and
 * secure random string generation. This module implements industry-standard security
 * practices to protect sensitive user data and ensure compliance with healthcare
 * security requirements.
 *
 * @module utils/security
 */

import * as argon2 from 'argon2'; // argon2@^0.30.3
import * as crypto from 'crypto'; // Node.js built-in
import { logger } from '../config/logger';
import { errorFactory } from './error-handler';

// Password configuration
const PASSWORD_MIN_LENGTH = 12;
const PASSWORD_HASH_MEMORY_COST = 65536; // 64MB
const PASSWORD_HASH_TIME_COST = 3; // iterations
const PASSWORD_HASH_PARALLELISM = 1; // threads
const PASSWORD_HASH_TYPE = argon2.argon2id;

// Encryption configuration
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

/**
 * Hashes a password using the Argon2id algorithm with secure parameters
 * 
 * @param password - The plain text password to hash
 * @returns Promise resolving to the hashed password string
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    // Ensure password meets minimum requirements
    if (!validatePasswordStrength(password)) {
      throw errorFactory.createValidationError('Password does not meet security requirements');
    }
    
    // Configure hashing options
    const options = {
      type: PASSWORD_HASH_TYPE,
      memoryCost: PASSWORD_HASH_MEMORY_COST,
      timeCost: PASSWORD_HASH_TIME_COST,
      parallelism: PASSWORD_HASH_PARALLELISM
    };
    
    // Hash the password
    const hash = await argon2.hash(password, options);
    logger.debug('Password hashed successfully');
    return hash;
  } catch (err) {
    logger.error('Error hashing password', { error: err });
    throw errorFactory.createInternalServerError('Failed to hash password', {}, err as Error);
  }
}

/**
 * Verifies a password against a stored hash
 * 
 * @param password - The plain text password to verify
 * @param hash - The stored hash to verify against
 * @returns Promise resolving to true if the password matches, false otherwise
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    const isMatch = await argon2.verify(hash, password);
    logger.debug('Password verification completed');
    return isMatch;
  } catch (err) {
    logger.error('Error verifying password', { error: err });
    throw errorFactory.createInternalServerError('Failed to verify password', {}, err as Error);
  }
}

/**
 * Validates password strength against security requirements
 * 
 * @param password - The password to validate
 * @returns True if the password meets strength requirements, false otherwise
 */
export function validatePasswordStrength(password: string): boolean {
  // Check minimum length
  if (!password || password.length < PASSWORD_MIN_LENGTH) {
    return false;
  }
  
  // Check for complexity requirements (at least 3 out of 4 character types)
  let criteriaCount = 0;
  
  // Check for lowercase letters
  if (/[a-z]/.test(password)) {
    criteriaCount++;
  }
  
  // Check for uppercase letters
  if (/[A-Z]/.test(password)) {
    criteriaCount++;
  }
  
  // Check for digits
  if (/\d/.test(password)) {
    criteriaCount++;
  }
  
  // Check for special characters
  if (/[^A-Za-z0-9]/.test(password)) {
    criteriaCount++;
  }
  
  // Require at least 3 of the 4 criteria
  return criteriaCount >= 3;
}

/**
 * Generates a cryptographically secure random string
 * 
 * @param length - The length of the random string to generate
 * @returns A secure random string
 */
export function generateSecureRandomString(length: number): string {
  try {
    // Generate random bytes
    const randomBytes = crypto.randomBytes(Math.ceil(length * 1.5));
    
    // Convert to Base64
    const base64String = randomBytes.toString('base64');
    
    // Remove non-alphanumeric characters and trim to the requested length
    return base64String.replace(/[^a-zA-Z0-9]/g, '').slice(0, length);
  } catch (err) {
    logger.error('Error generating secure random string', { error: err });
    throw errorFactory.createInternalServerError('Failed to generate secure random string', {}, err as Error);
  }
}

/**
 * Encrypts sensitive data using AES-256-GCM
 * 
 * @param data - The data to encrypt
 * @returns Encrypted data with initialization vector and auth tag
 */
export function encryptData(data: string): string {
  if (!ENCRYPTION_KEY) {
    throw errorFactory.createInternalServerError('Encryption key is not configured');
  }

  try {
    // Generate initialization vector
    const iv = crypto.randomBytes(16);
    
    // Create cipher
    const cipher = crypto.createCipheriv(
      ENCRYPTION_ALGORITHM,
      Buffer.from(ENCRYPTION_KEY, 'hex'),
      iv
    );
    
    // Encrypt the data
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get the auth tag
    const authTag = cipher.getAuthTag();
    
    // Combine IV, encrypted data, and auth tag into a single string
    // Format: iv:ciphertext:tag
    return `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`;
  } catch (err) {
    logger.error('Error encrypting data', { error: err });
    throw errorFactory.createInternalServerError('Failed to encrypt data', {}, err as Error);
  }
}

/**
 * Decrypts data that was encrypted with encryptData
 * 
 * @param encryptedData - The encrypted data to decrypt
 * @returns Decrypted data
 */
export function decryptData(encryptedData: string): string {
  if (!ENCRYPTION_KEY) {
    throw errorFactory.createInternalServerError('Encryption key is not configured');
  }

  try {
    // Split the encrypted data
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const authTag = Buffer.from(parts[2], 'hex');
    
    // Create decipher
    const decipher = crypto.createDecipheriv(
      ENCRYPTION_ALGORITHM,
      Buffer.from(ENCRYPTION_KEY, 'hex'),
      iv
    );
    
    // Set the auth tag
    decipher.setAuthTag(authTag);
    
    // Decrypt the data
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (err) {
    logger.error('Error decrypting data', { error: err });
    throw errorFactory.createInternalServerError('Failed to decrypt data', {}, err as Error);
  }
}

/**
 * Generates a secure ID for use in URLs or references
 * 
 * @param prefix - Optional prefix for the ID
 * @returns Secure ID with optional prefix
 */
export function generateSecureId(prefix: string = ''): string {
  try {
    // Generate 16 random bytes
    const bytes = crypto.randomBytes(16);
    
    // Convert to a URL-safe Base64 string
    const urlSafeBase64 = bytes.toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    
    // Add prefix if provided
    return prefix ? `${prefix}_${urlSafeBase64}` : urlSafeBase64;
  } catch (err) {
    logger.error('Error generating secure ID', { error: err });
    throw errorFactory.createInternalServerError('Failed to generate secure ID', {}, err as Error);
  }
}

/**
 * Compares two strings in a timing-safe manner to prevent timing attacks
 * 
 * @param a - First string
 * @param b - Second string
 * @returns True if strings are equal, false otherwise
 */
export function compareStringsSecurely(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }
  
  try {
    // Convert strings to buffers for comparison
    const bufferA = Buffer.from(a);
    const bufferB = Buffer.from(b);
    
    // If lengths are different, return false but still perform the comparison
    // to prevent timing attacks based on length differences
    if (bufferA.length !== bufferB.length) {
      // Create a copy of bufferB with the same length as bufferA
      const paddedB = Buffer.alloc(bufferA.length);
      bufferB.copy(paddedB, 0, 0, Math.min(bufferA.length, bufferB.length));
      
      return crypto.timingSafeEqual(bufferA, paddedB) && bufferA.length === bufferB.length;
    }
    
    // If lengths are the same, perform a direct comparison
    return crypto.timingSafeEqual(bufferA, bufferB);
  } catch (err) {
    logger.error('Error comparing strings securely', { error: err });
    return false; // Return false on error rather than throwing
  }
}