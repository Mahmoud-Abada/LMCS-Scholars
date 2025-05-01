// app/test/analytics/citations/data.ts
'use server';

import { db } from '@/db/client';
import { and, count, eq, max, sql, sum } from 'drizzle-orm';
import { researchers, publications, publicationAuthors } from '@/db/schema';

export async function getCitationAnalytics(filters: {
  yearFrom?: number;
  yearTo?: number;
  teamId?: string;
  researcherId?: string;
}) {
  const conditions = [
    filters.yearFrom 
      ? sql`EXTRACT(YEAR FROM ${publications.publicationDate}) >= ${filters.yearFrom}`
      : undefined,
    filters.yearTo
      ? sql`EXTRACT(YEAR FROM ${publications.publicationDate}) <= ${filters.yearTo}`
      : undefined,
    filters.teamId
      ? eq(researchers.teamId, filters.teamId)
      : undefined,
    filters.researcherId
      ? eq(publicationAuthors.researcherId, filters.researcherId)
      : undefined
  ].filter(Boolean);

  const [citationTrends, metrics] = await Promise.all([
    db
      .select({
        year: sql<number>`EXTRACT(YEAR FROM ${publications.publicationDate})::integer`.as('year'),
        totalCitations: sum(publications.citationCount).mapWith(Number),
        publicationCount: count(publications.id).mapWith(Number),
      })
      .from(publicationAuthors)
      .innerJoin(publications, eq(publications.id, publicationAuthors.publicationId))
      .innerJoin(researchers, eq(researchers.id, publicationAuthors.researcherId))
      .where(conditions.length ? and(...conditions) : undefined)
      .groupBy(sql`EXTRACT(YEAR FROM ${publications.publicationDate})`)
      .orderBy(sql`EXTRACT(YEAR FROM ${publications.publicationDate})`),

    db
      .select({
        totalPublications: count(publications.id).mapWith(Number),
        totalCitations: sum(publications.citationCount).mapWith(Number),
        avgCitationsPerPaper: sql<number>`ROUND(AVG(${publications.citationCount})::numeric, 2)`,
        maxCitations: max(publications.citationCount).mapWith(Number),
        hIndex: max(researchers.hIndex).mapWith(Number),
        i10Index: max(researchers.i10Index).mapWith(Number),
      })
      .from(publicationAuthors)
      .innerJoin(publications, eq(publications.id, publicationAuthors.publicationId))
      .innerJoin(researchers, eq(researchers.id, publicationAuthors.researcherId))
      .where(conditions.length ? and(...conditions) : undefined)
  ]);

  return {
    citationTrends,
    metrics: metrics[0]
  };
}