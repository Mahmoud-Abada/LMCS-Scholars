// src/app/api/scrape-lmcs/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { researchers, publications, publicationAuthors } from '@/db/schema';
import { scrapeGoogleScholar, type ScholarPublication } from '@/lib/scrapers/googleScholar';
import { scrapeDBLP, type DBLPPublication } from '@/lib/scrapers/dblp';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

const LMCS_RESEARCHERS = [
  { id: '01', lastName: 'ABDELMEZIEM', firstName: '' },
  { id: '02', lastName: 'ABDELAOUI', firstName: 'Sabrina' },
  { id: '03', lastName: 'AMROUCHE', firstName: 'Hakim' },
  { id: '04', lastName: 'ARTABAZ', firstName: 'Saliha' },
  { id: '05', lastName: 'BENATCHBA', firstName: 'Karima' },
  { id: '06', lastName: 'BESSEDIK', firstName: 'Malika' },
  { id: '07', lastName: 'BELAHRACHE', firstName: 'Abderahmane' },
  { id: '08', lastName: 'BOUKHEDIMI', firstName: 'Sohila' },
  { id: '09', lastName: 'BOUKHADRA', firstName: 'Adel' },
  { id: '10', lastName: 'BOUSBIA', firstName: 'Nabila' },
  { id: '11', lastName: 'BOUSAHA', firstName: 'Rima' },
  { id: '12', lastName: 'CHALAL', firstName: 'Rachid' },
  { id: '13', lastName: 'CHERID', firstName: 'Nacera' },
  { id: '14', lastName: 'DAHAMNI', firstName: 'Foudil' },
  { id: '15', lastName: 'DEKICHE', firstName: 'Narimane' },
  { id: '16', lastName: 'DELLYS', firstName: 'Elhachmi' },
  { id: '17', lastName: 'FAYCEL', firstName: 'Touka' },
  { id: '18', lastName: 'GHOMARI', firstName: 'Abdesamed Réda' },
  { id: '19', lastName: 'GUERROUTE', firstName: 'Elhachmi' },
  { id: '20', lastName: 'HAMANI', firstName: 'Nacer' },
  { id: '21', lastName: 'HAROUNE', firstName: 'Hayet' },
  { id: '22', lastName: 'HASSINI', firstName: 'Sabrina' },
  { id: '23', lastName: 'KECHIDE', firstName: 'Amine' },
  { id: '24', lastName: 'KHELOUAT', firstName: 'Boualem' },
  { id: '25', lastName: 'KHELIFATI', firstName: 'Si Larabi' },
  { id: '26', lastName: 'KERMI', firstName: 'Adel' },
  { id: '27', lastName: 'KOUDIL', firstName: 'Mouloud' },
  { id: '28', lastName: 'MAHIOU', firstName: 'Ramdane' },
  { id: '29', lastName: 'NADER', firstName: 'Fahima' },
  { id: '30', lastName: 'SI TAYEB', firstName: 'Fatima' }
];

type CombinedPublication = (ScholarPublication | DBLPPublication) & {
  citations?: number;
};

export async function POST() {
  for (const researcher of LMCS_RESEARCHERS) {
    const fullName = `${researcher.firstName} ${researcher.lastName}`.trim();
    const email = `${researcher.firstName.toLowerCase()}.${researcher.lastName.toLowerCase()}@esi.dz`.replace(/\s+/g, '');

    // Upsert researcher
    await db.insert(researchers)
      .values({
        id: researcher.id,
        fullName,
        email,
        qualification: 'teacher_researcher',
        status: 'active',
        team: 'LMCS',
        createdAt: new Date()
      })
      .onConflictDoUpdate({
        target: researchers.id,
        set: {
          fullName,
          email,
          qualification: 'teacher_researcher',
          status: 'active'
        }
      });

    // Scrape publications
    const [scholarPubs, dblpPubs] = await Promise.all([
      scrapeGoogleScholar(fullName),
      scrapeDBLP(fullName)
    ]);

    // Process publications
    for (const pub of [...scholarPubs, ...dblpPubs] as CombinedPublication[]) {
      const pubId = `${researcher.id}-${uuidv4().substring(0, 8)}`;

      try {
        // Insert publication
        await db.insert(publications)
          .values({
            id: pubId,
            researcherId: researcher.id,
            title: pub.title,
            year: pub.year,
            type: pub.venue?.includes('Conf.') ? 'conference' : 
                 pub.venue?.includes('J.') ? 'journal' : 'other',
            url: pub.url,
            abstract: '',
            pageCount: 0,
            volume: '',
            createdAt: new Date()
          })
          .onConflictDoNothing();

        // Link author
        await db.insert(publicationAuthors)
          .values({
            publicationId: pubId,
            researcherId: researcher.id,
            isPrimary: true
          })
          .onConflictDoNothing();

      } catch (error) {
        continue;
      }
    }
  }

  return NextResponse.json({ 
    success: true,
    message: `Processed ${LMCS_RESEARCHERS.length} researchers` 
  });
}