import { NextResponse } from 'next/server';
import { ResearchDataScraper } from '@/scripts/scrape';
//import { fetchFromCrossRef, fetchFromSemanticScholar } from '../../../scripts/apis';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const researcherName = searchParams.get('name');

  if (!researcherName) {
    return NextResponse.json(
      { error: 'Researcher name parameter is required' },
      { status: 400 }
    );
  }

  const scraper = new ResearchDataScraper();
  try {
    await scraper.ensureReady(); // Explicitly wait for initialization
    const publications = await scraper.scrapeResearcherPublications(researcherName);
   // const publications = await scrapeGoogleScholarPublications(researcherName);
    return NextResponse.json(publications);
    //const publications = await fetchFromSemanticScholar(researcherName);7
    //return NextResponse.json(publications);
  } catch (error) {
    console.error('Scraping failed:', error);
    return NextResponse.json(
      { error: 'Scraping failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    await scraper.close();
  }
}