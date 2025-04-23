import { scrapeGoogleScholarPublications } from '@/scripts/pubs';
import { NextRequest, NextResponse } from 'next/server';


export async function GET(req: NextRequest) {
  try {
    const data = await scrapeGoogleScholarPublications('ZEGOUR DJAMEL EDDINE');
    return NextResponse.json({ message: 'Publications fetched', data });
  } catch (error) {
    console.error('Scraping error:', error);
    return NextResponse.json({ message: 'Scraping failed', error }, { status: 500 });
  }
}