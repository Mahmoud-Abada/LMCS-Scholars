// tests/googleScholar.test.ts
/*import { expect, test } from "@playwright/test";
import { jest } from '@jest/globals';
import { scrapeGoogleScholar } from "../lib/scrapers/googleScholar"; 

test("scrapes at least 5 publications", async () => {
  const results = await scrapeGoogleScholar("John Doe");
  expect(results.length).toBeGreaterThanOrEqual(5);
});


test('returns valid publications', async () => {
  const results = await scrapeGoogleScholar('Yannis Manolopoulos');
  
  // Basic validation
  expect(results.length).toBeGreaterThan(0);
  expect(results[0]).toMatchObject({
    title: expect.any(String),
    authors: expect.arrayContaining([expect.any(String)]),
    year: expect.any(Number),
    citations: expect.any(Number)
  });

  // Test edge cases
  const emptyResults = await scrapeGoogleScholar('Nonexistent Researcher XYZ');
  expect(emptyResults).toEqual([]);
});

test('handles CAPTCHA errors', async () => {
    // Mock CAPTCHA page
    const mockPage = {
      goto: jest.fn(),
      $: jest.fn().mockResolvedValue(true), // Simulate CAPTCHA
      close: jest.fn()
    };
    await expect(scrapeGoogleScholar('Test', mockPage)).rejects.toThrow('CAPTCHA');
  });*/

// tests/googleScholar.test.ts
import { test, expect } from '@playwright/test';
import { scrapeGoogleScholar } from '../lib/scrapers/googleScholar';

test('scrapes at least 5 publications', async () => {
  const results = await scrapeGoogleScholar('John Doe');
  expect(results.length).toBeGreaterThanOrEqual(5);
});
