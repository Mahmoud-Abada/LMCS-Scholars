// src/lib/utils/errorHandling.ts
export class ScraperError extends Error {
    constructor(
      public readonly source: 'google-scholar' | 'dblp',
      message: string
    ) {
      super(`[${source.toUpperCase()}] ${message}`);
    }
  }
  
  export function handleScraperError(error: unknown) {
    if (error instanceof ScraperError) {
      console.error(error.message);
    } else {
      console.error('Unknown scraping error:', error);
    }
  }