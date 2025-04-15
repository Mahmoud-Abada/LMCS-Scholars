/*// src/app/api/researcher/[id]/scrape/route.ts
import { NextResponse } from 'next/server';
import { scrapeGoogleScholar } from '@/lib/scrapers/googleScholar';
import { scrapeDBLP } from '@/lib/scrapers/dblp';
import { db } from '@/db/client';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const researcher = await db.query.researchers.findFirst({
    where: (r, { eq }) => eq(r.id, params.id)
  });

  if (!researcher) {
    return NextResponse.json({ error: 'Researcher not found' }, { status: 404 });
  }

  try {
    const [scholarResults, dblpResults] = await Promise.all([
      scrapeGoogleScholar(researcher.fullName),
      scrapeDBLP(researcher.fullName)
    ]);

    // Merge and deduplicate results
    const allPublications = [...scholarResults, ...dblpResults].filter(
      (pub, index, self) => 
        index === self.findIndex(p => 
          p.title === pub.title && p.year === pub.year
        )
    );

    return NextResponse.json({ publications: allPublications });
  } catch (error) {
    return NextResponse.json(
      { error: 'Scraping failed', details: String(error) },
      { status: 500 }
    );
  }
}*/
/*
// src/app/api/researcher/[id]/scrape/route.ts
import { NextResponse } from 'next/server';
import { scrapeGoogleScholar } from '@/lib/scrapers/googleScholar';
import { scrapeDBLP } from '@/lib/scrapers/dblp';
import { db } from '@/db/client';
import { researchers } from '@/db/schema';
import { createPublication, linkPublicationToResearcher } from '@/lib/services/publication.service';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const researcher = await db.query.researchers.findFirst({
    where: (r, { eq }) => eq(r.id, params.id)
  });

  if (!researcher) {
    return NextResponse.json(
      { error: 'Researcher not found' },
      { status: 404 }
    );
  }

  try {
    // Scrape from multiple sources
    const [scholarResults, dblpResults] = await Promise.all([
      scrapeGoogleScholar(researcher.fullName),
      scrapeDBLP(researcher.fullName)
    ]);

    // Process and save publications
    const savedPublications = [];
    
    for (const pub of [...scholarResults, ...dblpResults]) {
      try {
        // Transform scraped data to match your schema
        const publicationData = {
          id: crypto.randomUUID(),
          title: pub.title,
          year: pub.year,
          citationCount: pub.citations ?? 0,
          venue: pub.venue,
          url: pub.url,
          type: (pub.type as "journal" | "conference" | "chapter" | "patent" | "other") || 'journal',
          researcherId: researcher.id
        };

        const savedPub = await createPublication(publicationData);
        await linkPublicationToResearcher(savedPub.id, researcher.id);
        savedPublications.push(savedPub);
      } catch (error) {
        console.error(`Failed to save publication "${pub.title}":`, error);
      }
    }

    return NextResponse.json({
      message: `${savedPublications.length} publications saved`,
      savedPublications
    });

  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Scraping failed', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}*/

// src/app/api/researcher/[id]/scrape/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { researchers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { scrapeGoogleScholar } from '@/lib/scrapers/googleScholar';
import { scrapeDBLP } from '@/lib/scrapers/dblp';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const researcher = await db.query.researchers.findFirst({
    where: eq(researchers.id, params.id),
    columns: {
      id: true,
      fullName: true,
      googleScholarUrl: true,
      dblpUrl: true
    }
  });

  if (!researcher) {
    return NextResponse.json(
      { error: 'Researcher not found' },
      { status: 404 }
    );
  }

  try {
    const [scholarPubs, dblpPubs] = await Promise.all([
      scrapeGoogleScholar("Mouloud Koudil"),
      scrapeDBLP("Mouloud Koudil")
    ]);

    return NextResponse.json({
      researcherId: researcher.id,
      name: researcher.fullName,
      scholarCount: scholarPubs.length,
      dblpCount: dblpPubs.length
    });
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Scraping failed',
        researcherId: researcher.id,
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}