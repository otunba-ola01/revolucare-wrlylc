import { AdminProfile } from '../types/user.types';
import { errorFactory } from '../utils/error-handler';

/**
 * Model class that provides validation and transformation methods for administrator profiles.
 * Serves as a layer between the raw database data and application logic,
 * ensuring data integrity and consistent handling of administrator profiles.
 */
export class AdminProfileModel {
  id: string;
  userId: string;
  department: string | null;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;

  /**
   * Creates a new AdminProfileModel instance.
   * @param data Partial administrator profile data to initialize the model
   */
  constructor(data: Partial<AdminProfile> = {}) {
    this.id = data.id || '';
    this.userId = data.userId || '';
    this.department = data.department || null;
    this.permissions = data.permissions || [];
    this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
    this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
  }

  /**
   * Validates the administrator profile data.
   * @returns True if the profile data is valid, throws an error otherwise
   * @throws ValidationError if the profile data is invalid
   */
  validate(): boolean {
    // Validate userId is present
    if (!this.userId || typeof this.userId !== 'string') {
      throw errorFactory.createValidationError('User ID is required for administrator profile', {
        field: 'userId',
        value: this.userId,
      });
    }

    // Validate department is either null or a non-empty string
    if (this.department !== null && (typeof this.department !== 'string' || this.department.trim() === '')) {
      throw errorFactory.createValidationError('Department must be null or a non-empty string', {
        field: 'department',
        value: this.department,
      });
    }

    // Validate permissions is an array of strings
    if (!Array.isArray(this.permissions)) {
      throw errorFactory.createValidationError('Permissions must be an array', {
        field: 'permissions',
        value: this.permissions,
      });
    }

    // Validate each permission is a non-empty string
    for (const permission of this.permissions) {
      if (typeof permission !== 'string' || permission.trim() === '') {
        throw errorFactory.createValidationError('Each permission must be a non-empty string', {
          field: 'permissions',
          value: permission,
        });
      }
    }

    return true;
  }

  /**
   * Converts the model to a plain JSON object.
   * @returns The administrator profile as a plain object
   */
  toJSON(): AdminProfile {
    return {
      id: this.id,
      userId: this.userId,
      department: this.department,
      permissions: [...this.permissions],
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Checks if the administrator has a specific permission.
   * @param permission The permission to check
   * @returns True if the administrator has the permission, false otherwise
   */
  hasPermission(permission: string): boolean {
    return this.permissions.includes(permission);
  }

  /**
   * Adds a permission to the administrator profile.
   * @param permission The permission to add
   * @returns The updated model instance for method chaining
   */
  addPermission(permission: string): AdminProfileModel {
    if (!this.hasPermission(permission)) {
      this.permissions.push(permission);
      this.updatedAt = new Date();
    }
    return this;
  }

  /**
   * Removes a permission from the administrator profile.
   * @param permission The permission to remove
   * @returns The updated model instance for method chaining
   */
  removePermission(permission: string): AdminProfileModel {
    this.permissions = this.permissions.filter(p => p !== permission);
    this.updatedAt = new Date();
    return this;
  }

  /**
   * Creates a new AdminProfileModel instance and validates it.
   * @param data Partial administrator profile data
   * @returns A validated AdminProfileModel instance
   * @throws ValidationError if the provided data is invalid
   */
  static create(data: Partial<AdminProfile>): AdminProfileModel {
    const model = new AdminProfileModel(data);
    model.validate();
    return model;
  }

  /**
   * Creates an AdminProfileModel instance from database data.
   * Unlike the create method, this doesn't validate the data as it's
   * assumed to be already validated when stored in the database.
   * @param data Administrator profile data from the database
   * @returns An AdminProfileModel instance
   */
  static fromDatabase(data: AdminProfile): AdminProfileModel {
    return new AdminProfileModel(data);
  }
}