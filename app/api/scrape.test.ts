/*// tests/api/scrape.test.ts
import { createMocks } from 'node-mocks-http';
import { POST as handler } from '@/app/api/scrape/route';
import test, { expect } from '@playwright/test';

test('POST /api/scrape with valid researcherId', async () => {
  const { req, res } = createMocks({
    method: 'POST',
    body: { researcherId: '123', source: 'google-scholar' }
  });

  await handler(req, res);
  expect(res._getStatusCode()).toBe(200);
  expect(JSON.parse(res._getData()).count).toBeGreaterThan(0);
});*/
