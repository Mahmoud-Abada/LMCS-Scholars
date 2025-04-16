import { scrapeGoogleScholarPublications } from '@/lib/scrapers/googleScholar';
import { NextRequest, NextResponse } from 'next/server';


export async function POST(req: NextRequest) {
  try {
    const data = await scrapeGoogleScholarPublications('MOULOUD KOUDIL');
    return NextResponse.json({ message: 'Publications fetched', data });
  } catch (error) {
    console.error('Scraping error:', error);
    return NextResponse.json({ message: 'Scraping failed', error }, { status: 500 });
  }
}
