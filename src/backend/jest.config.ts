import type { Config } from '@jest/types'; // @jest/types ^29.5.0

const config: Config.InitialOptions = {
  // Use ts-jest preset for TypeScript support
  preset: 'ts-jest',
  
  // Set Node.js as the test environment for backend testing
  testEnvironment: 'node',
  
  // Define test location roots
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  
  // Patterns to detect test files
  testMatch: ['**/*.test.ts', '**/*.spec.ts'],
  
  // Files to include in coverage reports
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/types/**/*.ts',
    '!src/interfaces/**/*.ts',
    '!src/index.ts',
    '!src/server.ts',
    '!src/config/**/*.ts'
  ],
  
  // Coverage thresholds to enforce minimum coverage percentages
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85
    },
    // Higher thresholds for critical service files
    './src/services/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  
  // Path mapping for @ imports
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  
  // File extensions to consider
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  
  // TypeScript file transformation configuration
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.json' }]
  },
  
  // Files to run after Jest is initialized but before tests are executed
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  
  // Automatically clear mock calls, instances, contexts and results before every test
  clearMocks: true,
  
  // Patterns to ignore for testing
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  
  // Enable verbose test output
  verbose: true,
  
  // Force exit after all tests complete
  forceExit: true,
  
  // Detect open handles (like unfinished HTTP requests or database connections)
  detectOpenHandles: true,
  
  // Limit the number of workers to 50% of available cores for optimal performance
  maxWorkers: '50%',
  
  // Paths to ignore when in watch mode
  watchPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/dist/']
};

export default config;