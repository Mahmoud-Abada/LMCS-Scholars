// src/app/api/analytics/productivity/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { researchers, publications, publicationAuthors, researchTeams } from '@/db/schema';
import { and, count, eq, isNotNull, sql, sum } from 'drizzle-orm';
import { z } from 'zod';
import { handleApiError } from '@/lib/api-utils';

const querySchema = z.object({
  yearFrom: z.coerce.number().min(2000).optional(),
  yearTo: z.coerce.number().max(new Date().getFullYear()).optional(),
  teamId: z.string().uuid().optional(),
  researcherId: z.string().uuid().optional(),
  groupBy: z.enum(['year', 'quarter', 'month', 'researcher', 'team', 'publicationType']).default('year'),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams.entries()));

    // Group by clause based on query parameter
    const groupByClause = {
      year: sql`EXTRACT(YEAR FROM ${publications.publicationDate})`,
      quarter: sql`CONCAT(EXTRACT(YEAR FROM ${publications.publicationDate}), '-Q', EXTRACT(QUARTER FROM ${publications.publicationDate}))`,
      month: sql`CONCAT(EXTRACT(YEAR FROM ${publications.publicationDate}), '-', LPAD(EXTRACT(MONTH FROM ${publications.publicationDate})::text, 2, '0'))`,
      researcher: sql`CONCAT(${researchers.firstName}, ' ', ${researchers.lastName})`,
      team: researchTeams.name,
      publicationType: publications.publicationType,
    }[query.groupBy];

    // Productivity metrics
    const productivityData = await db
      .select({
        group: sql`${groupByClause}`.as('group'),
        publicationCount: count(publications.id),
        citationSum: sum(publications.citationCount),
        avgCitations: sql<number>`ROUND(AVG(${publications.citationCount})::numeric, 2)`,
        researchersCount: count(sql`DISTINCT ${publicationAuthors.researcherId}`),
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
      .leftJoin(
        researchTeams,
        eq(researchTeams.id, researchers.teamId)
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
            : undefined,
          isNotNull(publications.publicationDate)
        )
      )
      .groupBy(groupByClause)
      .orderBy(groupByClause);

    // Top performers
    const topPerformers = await db
      .select({
        researcherId: researchers.id,
        researcherName: sql<string>`CONCAT(${researchers.firstName}, ' ', ${researchers.lastName})`,
        teamName: researchTeams.name,
        publicationCount: count(publications.id),
        citationSum: sum(publications.citationCount),
        hIndex: researchers.hIndex,
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
      .leftJoin(
        researchTeams,
        eq(researchTeams.id, researchers.teamId)
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
            : undefined
        )
      )
      .groupBy(researchers.id, researchTeams.name)
      .orderBy(sql`citationSum DESC`)
      .limit(10);

    return NextResponse.json({
      productivityData,
      topPerformers,
    });
  } catch (error) {
    return handleApiError(error);
  }
}