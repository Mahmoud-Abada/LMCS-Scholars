// playwright.config.ts
import { defineConfig } from '@playwright/test';
export default defineConfig({
  timeout: 60000,
  retries: 2,
  workers: 1, // Avoid parallel scraping
});