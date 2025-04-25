// src/app/api/analytics/impact/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { venues, publicationVenues, publications } from '@/db/schema';
import { and, count, eq, isNotNull, sql, sum } from 'drizzle-orm';
import { z } from 'zod';
import { handleApiError } from '@/lib/api-utils';

const querySchema = z.object({
  venueType: z.enum(['journal', 'conference', 'workshop', 'symposium', 'book']).optional(),
  yearFrom: z.coerce.number().min(2000).optional(),
  yearTo: z.coerce.number().max(new Date().getFullYear()).optional(),
  minPapers: z.coerce.number().min(1).default(5),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams.entries()));

    // Venue impact metrics
    const venueImpact = await db
      .select({
        venueId: venues.id,
        venueName: venues.name,
        venueType: venues.type,
        paperCount: count(publications.id),
        avgCitations: sql<number>`ROUND(AVG(${publications.citationCount})::numeric, 2)`,
        impactFactor: venues.impactFactor,
        sjrIndicator: venues.sjrIndicator,
        ourCitations: sum(publications.citationCount),
        hIndex: sql<number>`
          (SELECT COUNT(*) FROM (
            SELECT p2.citationCount 
            FROM ${publications} p2
            JOIN ${publicationVenues} pv2 ON p2.id = pv2.publicationId
            WHERE pv2.venueId = ${venues.id}
            GROUP BY p2.id
            HAVING p2.citationCount >= COUNT(*)
          ) AS h_calc)`
      })
      .from(venues)
      .leftJoin(
        publicationVenues,
        eq(publicationVenues.venueId, venues.id)
      )
      .leftJoin(
        publications,
        eq(publications.id, publicationVenues.publicationId)
      )
      .where(
        and(
          query.venueType ? eq(venues.type, query.venueType) : undefined,
          query.yearFrom
            ? sql`EXTRACT(YEAR FROM ${publications.publicationDate}) >= ${query.yearFrom}`
            : undefined,
          query.yearTo
            ? sql`EXTRACT(YEAR FROM ${publications.publicationDate}) <= ${query.yearTo}`
            : undefined
        )
      )
      .groupBy(venues.id)
      .having(sql`COUNT(${publications.id}) >= ${query.minPapers}`)
      .orderBy(sql`avgCitations DESC`);

    // Yearly impact trends
    const yearlyTrends = await db
      .select({
        year: sql<number>`EXTRACT(YEAR FROM ${publications.publicationDate})`,
        venueType: venues.type,
        avgCitations: sql<number>`ROUND(AVG(${publications.citationCount})::numeric, 2)`,
        paperCount: count(publications.id),
      })
      .from(venues)
      .innerJoin(
        publicationVenues,
        eq(publicationVenues.venueId, venues.id)
      )
      .innerJoin(
        publications,
        eq(publications.id, publicationVenues.publicationId)
      )
      .where(
        and(
          query.venueType ? eq(venues.type, query.venueType) : undefined,
          isNotNull(publications.publicationDate)
        )
      )
      .groupBy(
        sql`EXTRACT(YEAR FROM ${publications.publicationDate})`,
        venues.type
      )
      .orderBy(
        sql`EXTRACT(YEAR FROM ${publications.publicationDate})`,
        venues.type
      );

    return NextResponse.json({
      venueImpact,
      yearlyTrends,
    });
  } catch (error) {
    return handleApiError(error);
  }
}