import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: process.env['CYPRESS_BASE_URL'] || 'http://localhost:4201',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
    defaultCommandTimeout: 15000,
    video: true,
    screenshotOnRunFailure: true,
    retries: { runMode: 1, openMode: 0 },
  },
});
