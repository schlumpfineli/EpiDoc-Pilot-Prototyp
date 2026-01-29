import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E-Test-Konfiguration für EpiDoc
 * 
 * Siehe https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './e2e',
  
  /* Maximale Zeit für einen Test */
  timeout: 30 * 1000,
  
  expect: {
    /* Maximale Zeit für Assertions */
    timeout: 5000,
  },
  
  /* Tests parallel ausführen */
  fullyParallel: true,
  
  /* Bei CI/CD: Fail fast */
  forbidOnly: !!process.env.CI,
  
  /* Retry bei Fehlern */
  retries: process.env.CI ? 2 : 0,
  
  /* Anzahl der Worker */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter-Konfiguration */
  reporter: 'html',
  
  /* Shared settings für alle Tests */
  use: {
    /* Base URL */
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    
    /* Screenshots bei Fehlern */
    screenshot: 'only-on-failure',
    
    /* Videos bei Fehlern */
    video: 'retain-on-failure',
    
    /* Trace bei Fehlern */
    trace: 'on-first-retry',
  },

  /* Projekte für verschiedene Browser */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Mobile Tests */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  /* Web-Server für Tests */
  /* Deaktiviert, wenn Server bereits laufen (reuseExistingServer) */
  webServer: process.env.SKIP_WEBSERVER ? undefined : [
    {
      command: 'npm run dev',
      url: 'http://localhost:3000',
      reuseExistingServer: true, // Verwende bereits laufende Server
      timeout: 120 * 1000,
    },
    {
      command: 'cd ../backend && php artisan serve',
      url: 'http://localhost:8000',
      reuseExistingServer: true, // Verwende bereits laufende Server
      timeout: 120 * 1000,
    },
  ],
});

