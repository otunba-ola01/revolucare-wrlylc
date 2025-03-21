import type { Config } from '@jest/types';

// Jest configuration for the Revolucare web application
const config: Config.InitialOptions = {
  // Use ts-jest for TypeScript support
  preset: 'ts-jest',
  
  // Use jsdom for browser environment simulation
  testEnvironment: 'jsdom',
  
  // Root directory for searching test files
  roots: ['<rootDir>'],
  
  // Patterns to match test files
  testMatch: [
    '**/__tests__/**/*.test.tsx',
    '**/__tests__/**/*.test.ts',
  ],
  
  // Files to collect coverage information from
  collectCoverageFrom: [
    'components/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
  ],
  
  // Coverage thresholds to enforce minimum coverage percentages
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 85,
      statements: 85,
    },
    // Higher threshold for UI components to ensure quality
    './components/ui/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  
  // Module name mapping for path aliases and handling CSS imports
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  
  // File extensions to consider
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Transform TypeScript files using ts-jest
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  
  // Setup files to run after Jest is initialized
  setupFilesAfterEnv: ['<rootDir>/__tests__/jest.setup.ts'],
  
  // Reset mocks before each test
  clearMocks: true,
  
  // Patterns to ignore for test paths
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
  
  // Patterns to ignore for transformations
  // Allow specific UI libraries to be transformed
  transformIgnorePatterns: [
    '/node_modules/(?!(@radix-ui|class-variance-authority|tailwind-merge|clsx))',
  ],
  
  // Verbosity level
  verbose: true,
  
  // Test environment options
  testEnvironmentOptions: {
    url: 'http://localhost:3000',
  },
  
  // Global configuration for ts-jest
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
      isolatedModules: true,
    },
  },
};

export default config;