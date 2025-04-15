// src/app/api/scrape/route.ts
import { NextResponse } from 'next/server';
import { scrapeGoogleScholar } from '@/lib/scrapers/googleScholar';
import { scrapeDBLP } from '@/lib/scrapers/dblp';
import { db } from '@/db/client';
import { publications } from '@/db/schema';

export async function POST(req: Request, res: any) {
  const { researcherId, source } = await req.json();

  try {
    /*const researcher = await db.query.researchers.findFirst({
      where: (r, { eq }) => eq(r.id, researcherId)
    });

    if (!researcher) {
      return NextResponse.json({ error: 'Researcher not found' }, { status: 404 });
    }*/

    let publicationsData;
    switch (source) {
      case 'google-scholar':
        publicationsData = await scrapeGoogleScholar("Mouloud Koudil");
        break;
      case 'dblp':
        publicationsData = await scrapeDBLP("Mouloud Koudil");
        break;
      default:
        return NextResponse.json({ error: 'Invalid source' }, { status: 400 });
    }

    // Insert into DB
    const inserted = await db.insert(publications).values(
      publicationsData.map(pub => ({
        id: crypto.randomUUID(),
        researcherId,
        title: pub.title,
        year: pub.year,
        type: pub.venue?.includes('Conf.') ? 'conference' as const : 'journal' as const,
        venue: pub.venue || '',
        citations: 0,
        abstract: '',
        doi: '',
        // ... other mappings
      }))
    ).returning();

    return NextResponse.json({ count: inserted.length });
  } catch (error) {
    console.error('Scraping failed:', error);
    return NextResponse.json(
      { error: 'Scraping failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/*// src/app/api/scrape/route.ts
import { NextResponse } from 'next/server';
import { getActiveResearchers } from '@/lib/services/researcher.service';
import { scrapeGoogleScholar, scrapeDBLP } from '@/lib/scrapers';

export async function GET() {
  try {
    const researchers = await getActiveResearchers();
    const results = [];

    for (const researcher of researchers) {
      try {
        const [scholarPubs, dblpPubs] = await Promise.all([
          scrapeGoogleScholar(researcher.fullName),
          scrapeDBLP(researcher.fullName)
        ]);

        results.push({
          researcherId: researcher.id,
          name: researcher.fullName,
          scholarCount: scholarPubs.length,
          dblpCount: dblpPubs.length
        });
      } catch (error) {
        console.error(`Failed to scrape for ${researcher.fullName}:`, error);
        results.push({
          researcherId: researcher.id,
          name: researcher.fullName,
          error: error instanceof Error ? error.message : 'Scraping failed'
        });
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json(
      { error: 'Scraping failed', details: String(error) },
      { status: 500 }
    );
  }
}*/