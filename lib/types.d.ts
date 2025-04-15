// src/lib/types.d.ts
interface ScraperResult {
  title: string;
  authors: string[];
  year: number;
  citations?: number;
  venue?: string;
  doi?: string;
}
