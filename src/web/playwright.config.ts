import { defineConfig, devices } from '@playwright/test'; // ^1.35.1

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * Playwright Configuration for Revolucare
 * 
 * This configuration sets up end-to-end testing for the Revolucare platform,
 * enabling automated testing across multiple browsers and devices to ensure
 * a consistent user experience across all supported environments.
 * 
 * The configuration includes:
 * - Multi-browser testing (Chrome, Firefox, Safari)
 * - Mobile device testing
 * - Automatic screenshot and video capture on test failures
 * - HTML, list, and JUnit reporting
 * - Local development server launch for tests
 */
export default defineConfig({
  // Directory where tests are located
  testDir: './__tests__/e2e',
  
  // Pattern to match test files
  testMatch: '**/*.e2e.ts',
  
  // Global timeout for each test
  timeout: 30000,
  
  // Default timeout for expect assertions
  expect: {
    timeout: 5000,
  },
  
  // Run all tests in parallel for faster execution
  fullyParallel: true,
  
  // When running CI, fail if test.only is encountered
  forbidOnly: !!process.env.CI,
  
  // Number of retry attempts for failed tests
  // Use environment variable or default to different values per environment
  retries: process.env.CI ? 2 : 0,
  
  // Limit workers based on available CPU cores
  workers: process.env.CI ? undefined : undefined,
  
  // Configure multiple reporters for different output formats
  reporter: [
    // HTML report for visual inspection of test results
    ['html', { open: 'never' }],
    
    // List reporter for console output during test runs
    ['list'],
    
    // JUnit reporter for CI integration
    ['junit', { outputFile: 'test-results/e2e-junit.xml' }]
  ],
  
  // Global settings applied to all tests
  use: {
    // Base URL for all tests - uses environment variable or default
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    
    // Trace on first retry to help debug flaky tests
    trace: 'on-first-retry',
    
    // Only take screenshots on failure to reduce storage needs
    screenshot: 'only-on-failure',
    
    // Retain videos only on failure
    video: 'retain-on-failure',
  },
  
  // Configure projects for different browsers and devices
  projects: [
    // Desktop browsers
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
      },
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
      },
    },
    
    // Mobile browsers
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5'],
      },
    },
    {
      name: 'Mobile Safari',
      use: {
        ...devices['iPhone 12'],
      },
    },
  ],
  
  // Web server configuration for local development testing
  webServer: {
    // Command to start the development server
    command: 'npm run dev',
    
    // URL where the server will be running
    url: 'http://localhost:3000',
    
    // Reuse existing server if already running
    reuseExistingServer: !process.env.CI,
    
    // Server startup timeout
    timeout: 60000,
  },
});