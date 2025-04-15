import { publications } from "../../db/schema";
import { ScholarPublication } from "../scrapers/googleScholar";

// src/lib/utils/transformData.ts
export function transformScholarPublication(
    scraped: ScholarPublication, 
    researcherId: string
  ): typeof publications.$inferInsert {
    return {
      id: generatePublicationId(scraped.title, scraped.year), // Implement your ID logic
      title: scraped.title,
      year: scraped.year,
      url: scraped.url,
      type: determinePublicationType(scraped.venue), // Implement your logic
      researcherId
    };
  }
  
  function generatePublicationId(title: string, year: number): string {
    return `${year}-${title.substring(0, 20).replace(/\s+/g, '-').toLowerCase()}`;
  }
  
  function determinePublicationType(venue?: string): 'journal' | 'conference' | 'other' {
    if (!venue) return 'other';
    return venue.toLowerCase().includes('conf') ? 'conference' : 
           venue.toLowerCase().includes('journal') ? 'journal' : 'other';
  }