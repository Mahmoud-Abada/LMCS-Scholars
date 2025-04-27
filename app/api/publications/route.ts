
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Extract query parameters
    const researcherName = searchParams.get("researcherName");

    if (!researcherName) {
      return NextResponse.json({ error: "Researcher name is required" }, { status: 400 });
    }

    // Query the database for publications by researcher name
    const publicationsData = await db
      .select()
      .from(publications)
      .where(like(publications.researcherName, `%${researcherName}%`));

    return NextResponse.json({ data: publicationsData }, { status: 200 });
  } catch (error) {
    console.error("Error fetching publications:", error);
    return NextResponse.json({ error: "Failed to fetch publications" }, { status: 500 });
  }
}