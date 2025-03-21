/**
 * User model class that provides data transformation, validation, and business logic
 * for user entities in the Revolucare platform.
 */
import { User, UserWithProfile, UserWithoutPassword } from '../types/user.types';
import { Roles } from '../constants/roles';

/**
 * Model class that encapsulates user data and provides methods for validation and transformation
 */
export class UserModel {
  id: string;
  email: string;
  passwordHash: string;
  role: Roles;
  firstName: string;
  lastName: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  clientProfile: any;
  providerProfile: any;
  caseManagerProfile: any;
  adminProfile: any;

  /**
   * Creates a new UserModel instance with the provided user data
   * @param userData User data to initialize the model with
   */
  constructor(userData: any) {
    // Initialize properties with default values
    this.id = '';
    this.email = '';
    this.passwordHash = '';
    this.role = Roles.CLIENT; // Default role
    this.firstName = '';
    this.lastName = '';
    this.isVerified = false;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.clientProfile = null;
    this.providerProfile = null;
    this.caseManagerProfile = null;
    this.adminProfile = null;

    // If userData is provided, assign its properties to this instance
    if (userData) {
      Object.assign(this, userData);

      // Convert date strings to Date objects if necessary
      if (userData.createdAt && !(userData.createdAt instanceof Date)) {
        this.createdAt = new Date(userData.createdAt);
      }
      if (userData.updatedAt && !(userData.updatedAt instanceof Date)) {
        this.updatedAt = new Date(userData.updatedAt);
      }

      // Ensure role is a valid Roles enum value
      if (userData.role) {
        if (Object.values(Roles).includes(userData.role as Roles)) {
          this.role = userData.role as Roles;
        } else {
          this.role = Roles.CLIENT; // Default to CLIENT if invalid
        }
      }
    }
  }

  /**
   * Converts the user model to a plain JSON object conforming to the User interface
   * @returns User data in standardized format
   */
  toJSON(): User {
    return {
      id: this.id,
      email: this.email,
      passwordHash: this.passwordHash,
      role: this.role,
      firstName: this.firstName,
      lastName: this.lastName,
      isVerified: this.isVerified,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Converts the user model to a plain JSON object without the password hash
   * @returns User data without password hash
   */
  toUserWithoutPassword(): UserWithoutPassword {
    const { passwordHash, ...userWithoutPassword } = this.toJSON();
    return userWithoutPassword;
  }

  /**
   * Converts the user model to a user with profile object based on the user's role
   * @returns User with appropriate role-specific profile
   */
  toUserWithProfile(): UserWithProfile {
    const user = this.toUserWithoutPassword();
    
    return {
      user,
      clientProfile: this.role === Roles.CLIENT ? this.clientProfile : null,
      providerProfile: this.role === Roles.PROVIDER ? this.providerProfile : null,
      caseManagerProfile: this.role === Roles.CASE_MANAGER ? this.caseManagerProfile : null,
      adminProfile: this.role === Roles.ADMINISTRATOR ? this.adminProfile : null
    };
  }

  /**
   * Validates the user data for required fields and format
   * @returns True if validation passes, throws error otherwise
   */
  validate(): boolean {
    // Check if email is present and in valid format
    if (!this.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
      throw new Error('Invalid email format');
    }

    // Check if passwordHash is present for new users (no ID means new user)
    if (!this.id && !this.passwordHash) {
      throw new Error('Password is required for new users');
    }

    // Check if role is a valid Roles enum value
    if (!Object.values(Roles).includes(this.role)) {
      throw new Error('Invalid user role');
    }

    // Check if firstName and lastName are present
    if (!this.firstName || !this.lastName) {
      throw new Error('First name and last name are required');
    }

    return true;
  }

  /**
   * Gets the user's full name by combining first and last name
   * @returns User's full name
   */
  getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  /**
   * Gets the appropriate profile object based on the user's role
   * @returns Role-specific profile or null
   */
  getProfileByRole(): any {
    switch (this.role) {
      case Roles.CLIENT:
        return this.clientProfile;
      case Roles.PROVIDER:
        return this.providerProfile;
      case Roles.CASE_MANAGER:
        return this.caseManagerProfile;
      case Roles.ADMINISTRATOR:
        return this.adminProfile;
      default:
        return null;
    }
  }
}