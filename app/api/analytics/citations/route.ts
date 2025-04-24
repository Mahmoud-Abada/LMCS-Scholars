// src/app/api/analytics/citations/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { researchers, publications, publicationAuthors } from '@/db/schema';
import { and, count, eq, max, sql, sum } from 'drizzle-orm';
import { z } from 'zod';
import { handleApiError } from '@/lib/api-utils';

const querySchema = z.object({
  yearFrom: z.coerce.number().min(2000).max(new Date().getFullYear()).optional(),
  yearTo: z.coerce.number().min(2000).max(new Date().getFullYear()).optional(),
  teamId: z.string().uuid().optional(),
  researcherId: z.string().uuid().optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams.entries()));

    // Base citation query
    const citationQuery = db
      .select({
        year: sql<number>`EXTRACT(YEAR FROM ${publications.publicationDate})`,
        totalCitations: sum(publications.citationCount),
        hIndexContributions: count(
          sql`CASE WHEN ${publications.citationCount} >= 
              (SELECT COUNT(*) FROM ${publications} p2 
               JOIN ${publicationAuthors} pa2 ON p2.id = pa2.publicationId
               WHERE pa2.researcherId = ${publicationAuthors.researcherId}
               AND p2.citationCount >= ${publications.citationCount}
               AND p2.id != ${publications.id}) 
              THEN 1 ELSE NULL END`
        ),
      })
      .from(publicationAuthors)
      .innerJoin(
        publications,
        eq(publications.id, publicationAuthors.publicationId)
      )
      .innerJoin(
        researchers,
        eq(researchers.id, publicationAuthors.researcherId)
      )
      .where(
        and(
          query.yearFrom 
            ? sql`EXTRACT(YEAR FROM ${publications.publicationDate}) >= ${query.yearFrom}`
            : undefined,
          query.yearTo
            ? sql`EXTRACT(YEAR FROM ${publications.publicationDate}) <= ${query.yearTo}`
            : undefined,
          query.teamId
            ? eq(researchers.teamId, query.teamId)
            : undefined,
          query.researcherId
            ? eq(publicationAuthors.researcherId, query.researcherId)
            : undefined
        )
      )
      .groupBy(sql`EXTRACT(YEAR FROM ${publications.publicationDate})`)
      .orderBy(sql`EXTRACT(YEAR FROM ${publications.publicationDate})`);

    const citationTrends = await citationQuery;

    // Additional metrics
    const metrics = await db
      .select({
        totalPublications: count(publications.id),
        totalCitations: sum(publications.citationCount),
        avgCitationsPerPaper: sql<number>`ROUND(AVG(${publications.citationCount})::numeric, 2)`,
        maxCitations: max(publications.citationCount),
        hIndex: sql<number>`MAX(${researchers.hIndex})`,
        i10Index: sql<number>`MAX(${researchers.i10Index})`,
      })
      .from(publicationAuthors)
      .innerJoin(
        publications,
        eq(publications.id, publicationAuthors.publicationId)
      )
      .innerJoin(
        researchers,
        eq(researchers.id, publicationAuthors.researcherId)
      )
      .where(
        and(
          query.yearFrom
            ? sql`EXTRACT(YEAR FROM ${publications.publicationDate}) >= ${query.yearFrom}`
            : undefined,
          query.yearTo
            ? sql`EXTRACT(YEAR FROM ${publications.publicationDate}) <= ${query.yearTo}`
            : undefined,
          query.teamId
            ? eq(researchers.teamId, query.teamId)
            : undefined,
          query.researcherId
            ? eq(publicationAuthors.researcherId, query.researcherId)
            : undefined
        )
      );

    return NextResponse.json({
      citationTrends,
      metrics: metrics[0],
    });
  } catch (error) {
    return handleApiError(error);
  }
}