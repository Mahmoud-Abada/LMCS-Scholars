
import { db } from '@/db/client';
import { publications } from '@/db/schema';
import { NextResponse } from 'next/server';
import { ResearchDataScraper } from '../../../scripts/scraper';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { researcherName } = body;

    if (!researcherName) {
      return NextResponse.json({ error: 'Researcher name is required' }, { status: 400 });
    }
    

    const scraper = new ResearchDataScraper();
    const scrapedPublications = await scraper.scrapeResearcherPublications(researcherName);


    // Insert scraped publications into the database
    for (const publication of scrapedPublications) {
      await db.insert(publications).values(publication);
    }

    return NextResponse.json({ message: 'Publications added successfully', pubs: scrapedPublications }, { status: 201 });
  } catch (error) {
    console.error('Error in scraping publications:', error);
    return NextResponse.json({ error: 'Failed to scrape publications' }, { status: 500 });
  }
}