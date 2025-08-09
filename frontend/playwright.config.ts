import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './integration-tests',
  timeout: 10000,
  retries: 0,
  use: {
    headless: true,
    baseURL: 'http://localhost/',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
});
