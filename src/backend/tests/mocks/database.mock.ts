import { PrismaClient } from '@prisma/client'; // ^5.0.0
import { mockDeep, mockReset } from 'jest-mock-extended'; // ^3.0.5
import { debug, info } from '../../src/utils/logger';
import { Roles } from '../../src/constants/roles';

/**
 * Deep mock of the PrismaClient for testing database operations
 * without requiring an actual database connection
 */
export const mockPrismaClient = mockDeep<PrismaClient>();

/**
 * In-memory storage for mock database operations
 * This object simulates database tables with arrays of records
 */
const inMemoryDatabase: Record<string, any[]> = {
  user: [],
  profile: [],
  careplan: [],
  servicesplan: [],
  provider: [],
  availability: [],
  document: [],
  booking: [],
  notification: [],
  review: []
};

/**
 * Returns mock database configuration for testing
 * @returns Object containing mock database configuration
 */
export function getDatabaseConfig(): Record<string, any> {
  return {
    connectionString: 'postgresql://testuser:testpassword@localhost:5432/testdb',
    ssl: false,
    pool: {
      min: 2,
      max: 10,
    },
    debug: true,
  };
}

/**
 * Simulates connecting to the database for testing
 * @returns Promise that resolves when mock database is connected
 */
export async function connectDatabase(): Promise<void> {
  info('Connecting to mock database...');
  resetMockDatabase();
  return Promise.resolve();
}

/**
 * Simulates disconnecting from the database for testing
 * @returns Promise that resolves when mock database is disconnected
 */
export async function disconnectDatabase(): Promise<void> {
  info('Disconnecting from mock database...');
  // Clear the in-memory database
  Object.keys(inMemoryDatabase).forEach(key => {
    inMemoryDatabase[key] = [];
  });
  return Promise.resolve();
}

/**
 * Mock Transaction class to simulate database transactions
 * This class tracks operations and simulates commit/rollback behavior
 */
class MockTransaction {
  private operations: Function[] = [];
  public committed = false;
  public rolledBack = false;

  /**
   * Adds an operation to the transaction
   * @param operation Function to execute as part of the transaction
   */
  addOperation(operation: Function): void {
    this.operations.push(operation);
  }

  /**
   * Commits the transaction by executing all operations
   * @returns Promise that resolves when transaction is committed
   */
  async commit(): Promise<void> {
    // Execute all operations in the transaction
    for (const operation of this.operations) {
      await operation();
    }
    this.committed = true;
    return Promise.resolve();
  }

  /**
   * Rolls back the transaction
   * @returns Promise that resolves when transaction is rolled back
   */
  async rollback(): Promise<void> {
    this.rolledBack = true;
    this.operations = [];
    return Promise.resolve();
  }
}

/**
 * Mock implementation of transaction execution for testing
 * @param callback Function to execute within the transaction
 * @returns Result of the callback execution
 */
export async function executeWithTransaction<T>(callback: Function): Promise<T> {
  debug('Executing with mock transaction...');
  
  const mockTransaction = new MockTransaction();
  
  try {
    // Execute the callback with the mock transaction
    const result = await callback(mockTransaction);
    
    // Commit the transaction
    await mockTransaction.commit();
    
    return result;
  } catch (error) {
    // Rollback the transaction on error
    await mockTransaction.rollback();
    throw error;
  }
}

/**
 * Resets the mock database state for clean test runs
 * This function should be called before each test that uses the database
 */
export function resetMockDatabase(): void {
  // Reset the mock
  mockReset(mockPrismaClient);
  
  // Clear the in-memory database
  Object.keys(inMemoryDatabase).forEach(key => {
    inMemoryDatabase[key] = [];
  });
  
  // Set up mock implementations
  setupMockImplementations();
  
  debug('Mock database has been reset');
}

/**
 * Returns the current state of mock database data for assertions
 * @returns Copy of the current in-memory database
 */
export function getMockData(): Record<string, any[]> {
  return JSON.parse(JSON.stringify(inMemoryDatabase));
}

/**
 * Sets up mock implementations for Prisma client methods
 * This function configures the behavior of database operations
 */
function setupMockImplementations(): void {
  // Setup mock implementations for each model and operation type
  const models = Object.keys(inMemoryDatabase);
  
  // Setup create operations
  models.forEach(model => {
    if (mockPrismaClient[model]?.create) {
      mockPrismaClient[model].create.mockImplementation(async (params) => {
        const newItem = {
          id: `${model}-${inMemoryDatabase[model].length + 1}`,
          ...params.data,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        inMemoryDatabase[model].push(newItem);
        return newItem;
      });
    }
  });
  
  // Setup createMany operations
  models.forEach(model => {
    if (mockPrismaClient[model]?.createMany) {
      mockPrismaClient[model].createMany.mockImplementation(async (params) => {
        const createdItems = params.data.map((item, index) => {
          const newItem = {
            id: `${model}-${inMemoryDatabase[model].length + index + 1}`,
            ...item,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          inMemoryDatabase[model].push(newItem);
          return newItem;
        });
        
        return { count: createdItems.length };
      });
    }
  });
  
  // Setup findUnique operations
  models.forEach(model => {
    if (mockPrismaClient[model]?.findUnique) {
      mockPrismaClient[model].findUnique.mockImplementation(async (params) => {
        if (!params.where || !params.where.id) return null;
        return inMemoryDatabase[model].find(item => item.id === params.where.id) || null;
      });
    }
  });
  
  // Setup findFirst operations
  models.forEach(model => {
    if (mockPrismaClient[model]?.findFirst) {
      mockPrismaClient[model].findFirst.mockImplementation(async (params) => {
        let results = [...inMemoryDatabase[model]];
        
        // Apply where filters if they exist
        if (params?.where) {
          results = filterItems(results, params.where);
        }
        
        return results.length > 0 ? results[0] : null;
      });
    }
  });
  
  // Setup findMany operations
  models.forEach(model => {
    if (mockPrismaClient[model]?.findMany) {
      mockPrismaClient[model].findMany.mockImplementation(async (params) => {
        let results = [...inMemoryDatabase[model]];
        
        // Apply where filters if they exist
        if (params?.where) {
          results = filterItems(results, params.where);
        }
        
        // Apply pagination if specified
        if (params?.skip) {
          results = results.slice(params.skip);
        }
        
        if (params?.take) {
          results = results.slice(0, params.take);
        }
        
        // Apply sorting if specified
        if (params?.orderBy) {
          results = sortItems(results, params.orderBy);
        }
        
        return results;
      });
    }
  });
  
  // Setup update operations
  models.forEach(model => {
    if (mockPrismaClient[model]?.update) {
      mockPrismaClient[model].update.mockImplementation(async (params) => {
        if (!params.where || !params.where.id) {
          throw new Error(`Update operation for ${model} requires an ID in the where clause`);
        }
        
        const index = inMemoryDatabase[model].findIndex(item => item.id === params.where.id);
        if (index === -1) {
          throw new Error(`${model} with ID ${params.where.id} not found`);
        }
        
        const updatedItem = {
          ...inMemoryDatabase[model][index],
          ...params.data,
          updatedAt: new Date()
        };
        
        inMemoryDatabase[model][index] = updatedItem;
        return updatedItem;
      });
    }
  });
  
  // Setup updateMany operations
  models.forEach(model => {
    if (mockPrismaClient[model]?.updateMany) {
      mockPrismaClient[model].updateMany.mockImplementation(async (params) => {
        let results = [...inMemoryDatabase[model]];
        
        // Apply where filters to find items to update
        if (params?.where) {
          results = filterItems(results, params.where);
        }
        
        // Update matched items
        results.forEach(item => {
          const index = inMemoryDatabase[model].findIndex(dbItem => dbItem.id === item.id);
          if (index !== -1) {
            inMemoryDatabase[model][index] = {
              ...item,
              ...params.data,
              updatedAt: new Date()
            };
          }
        });
        
        return { count: results.length };
      });
    }
  });
  
  // Setup delete operations
  models.forEach(model => {
    if (mockPrismaClient[model]?.delete) {
      mockPrismaClient[model].delete.mockImplementation(async (params) => {
        if (!params.where || !params.where.id) {
          throw new Error(`Delete operation for ${model} requires an ID in the where clause`);
        }
        
        const index = inMemoryDatabase[model].findIndex(item => item.id === params.where.id);
        if (index === -1) {
          throw new Error(`${model} with ID ${params.where.id} not found`);
        }
        
        const deletedItem = inMemoryDatabase[model][index];
        inMemoryDatabase[model].splice(index, 1);
        return deletedItem;
      });
    }
  });
  
  // Setup deleteMany operations
  models.forEach(model => {
    if (mockPrismaClient[model]?.deleteMany) {
      mockPrismaClient[model].deleteMany.mockImplementation(async (params) => {
        let idsToDelete = [];
        
        // Find items matching the filter
        if (params?.where) {
          const itemsToDelete = filterItems(inMemoryDatabase[model], params.where);
          idsToDelete = itemsToDelete.map(item => item.id);
        } else {
          // Delete all if no filter provided
          idsToDelete = inMemoryDatabase[model].map(item => item.id);
        }
        
        // Remove items from the database
        const initialCount = inMemoryDatabase[model].length;
        inMemoryDatabase[model] = inMemoryDatabase[model].filter(item => !idsToDelete.includes(item.id));
        
        return { count: initialCount - inMemoryDatabase[model].length };
      });
    }
  });
  
  // Setup count operations
  models.forEach(model => {
    if (mockPrismaClient[model]?.count) {
      mockPrismaClient[model].count.mockImplementation(async (params) => {
        let results = [...inMemoryDatabase[model]];
        
        // Apply where filters if they exist
        if (params?.where) {
          results = filterItems(results, params.where);
        }
        
        return results.length;
      });
    }
  });
  
  // Setup transaction
  mockPrismaClient.$transaction.mockImplementation(async (operations) => {
    if (Array.isArray(operations)) {
      // Handle array of operations
      const results = [];
      try {
        for (const operation of operations) {
          results.push(await operation);
        }
        return results;
      } catch (error) {
        // In a real transaction, all operations would be rolled back
        throw error;
      }
    } else if (typeof operations === 'function') {
      // Handle function-based transaction
      try {
        return await operations(mockPrismaClient);
      } catch (error) {
        throw error;
      }
    }
  });
}

/**
 * Helper function to filter items based on where conditions
 * @param items Array of items to filter
 * @param where Where conditions
 * @returns Filtered array of items
 */
function filterItems(items: any[], where: Record<string, any>): any[] {
  return items.filter(item => {
    return Object.entries(where).every(([key, value]) => {
      // Handle special case for role filtering
      if (key === 'role' && value) {
        return item.role === value;
      }
      
      // Handle object conditions like { contains: 'value' }
      if (typeof value === 'object' && value !== null) {
        const [operator, operatorValue] = Object.entries(value)[0];
        switch (operator) {
          case 'contains':
            return item[key] && item[key].toLowerCase().includes(operatorValue.toLowerCase());
          case 'in':
            return operatorValue.includes(item[key]);
          case 'equals':
            return item[key] === operatorValue;
          case 'not':
            return item[key] !== operatorValue;
          case 'gt':
            return item[key] > operatorValue;
          case 'gte':
            return item[key] >= operatorValue;
          case 'lt':
            return item[key] < operatorValue;
          case 'lte':
            return item[key] <= operatorValue;
          default:
            return true;
        }
      }
      
      // Simple equality check
      return item[key] === value;
    });
  });
}

/**
 * Helper function to sort items based on orderBy conditions
 * @param items Array of items to sort
 * @param orderBy OrderBy conditions
 * @returns Sorted array of items
 */
function sortItems(items: any[], orderBy: any): any[] {
  const orderByArr = Array.isArray(orderBy) ? orderBy : [orderBy];
  
  return [...items].sort((a, b) => {
    for (const order of orderByArr) {
      const [field, direction] = Object.entries(order)[0];
      if (a[field] < b[field]) return direction === 'asc' ? -1 : 1;
      if (a[field] > b[field]) return direction === 'asc' ? 1 : -1;
    }
    return 0;
  });
}

// Initialize mock implementations
setupMockImplementations();

// Export prisma mock for use in tests
export const prisma = mockPrismaClient;