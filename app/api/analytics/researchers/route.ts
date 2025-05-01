// app/api/analytics/researchers/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { researchers, researchTeams, publicationAuthors, publications } from '@/db/schema';
import { and, count, desc, eq, gte, lte, sql, sum, avg, max } from 'drizzle-orm';
import { z } from 'zod';

const querySchema = z.object({
  teamId: z.string().uuid().optional(),
  status: z.enum(['active', 'on_leave', 'inactive', 'retired']).optional(),
  qualification: z.enum(['professor', 'associate_professor', 'assistant_professor', 'postdoc', 'phd_candidate', 'research_scientist']).optional(),
  position: z.enum(['director', 'department_head', 'principal_investigator', 'senior_researcher', 'researcher', 'assistant']).optional(),
  hIndexMin: z.coerce.number().min(0).optional(),
  hIndexMax: z.coerce.number().max(100).optional(),
  citationMin: z.coerce.number().min(0).optional(),
  citationMax: z.coerce.number().optional(),
  yearFrom: z.coerce.number().min(1990).max(new Date().getFullYear()).optional(),
  yearTo: z.coerce.number().min(1990).max(new Date().getFullYear()).optional(),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams.entries()));

    const baseFilters = [
      query.teamId ? eq(researchers.teamId, query.teamId) : undefined,
      query.status ? eq(researchers.status, query.status) : undefined,
      query.qualification ? eq(researchers.qualification, query.qualification) : undefined,
      query.position ? eq(researchers.position, query.position) : undefined,
      query.hIndexMin ? gte(researchers.hIndex, query.hIndexMin) : undefined,
      query.hIndexMax ? lte(researchers.hIndex, query.hIndexMax) : undefined,
      query.citationMin ? gte(researchers.citations, query.citationMin) : undefined,
      query.citationMax ? lte(researchers.citations, query.citationMax) : undefined,
    ].filter(Boolean);

    const [researcherMetrics, yearlyTrends, teamDistribution, qualificationStats] = await Promise.all([
      // Researcher Metrics
      db.select({
        id: researchers.id,
        name: sql<string>`CONCAT(${researchers.firstName}, ' ', ${researchers.lastName})`.as('name'),
        team: researchTeams.name,
        status: researchers.status,
        qualification: researchers.qualification,
        position: researchers.position,
        hIndex: researchers.hIndex,
        i10Index: researchers.i10Index,
        citations: researchers.citations,
        publicationCount: sql<number>`(
          SELECT COUNT(*) FROM ${publicationAuthors}
          WHERE ${publicationAuthors.researcherId} = ${researchers.id}
          ${query.yearFrom ? sql`AND EXISTS (
            SELECT 1 FROM ${publications} 
            WHERE ${publications.id} = ${publicationAuthors.publicationId}
            AND EXTRACT(YEAR FROM ${publications.publicationDate}) >= ${query.yearFrom}
          )` : sql``}
          ${query.yearTo ? sql`AND EXISTS (
            SELECT 1 FROM ${publications} 
            WHERE ${publications.id} = ${publicationAuthors.publicationId}
            AND EXTRACT(YEAR FROM ${publications.publicationDate}) <= ${query.yearTo}
          )` : sql``}
        )`.as('publication_count'),
        citationPerYear: sql<number>`ROUND(${researchers.citations} / NULLIF(
          EXTRACT(YEAR FROM CURRENT_DATE) - EXTRACT(YEAR FROM ${researchers.joinDate}), 1)`.as('citation_per_year'),
        lastPublication: sql<string>`(
          SELECT MAX(${publications.publicationDate}) FROM ${publicationAuthors}
          JOIN ${publications} ON ${publications.id} = ${publicationAuthors.publicationId}
          WHERE ${publicationAuthors.researcherId} = ${researchers.id}
        )`.as('last_publication')
      })
      .from(researchers)
      .leftJoin(researchTeams, eq(researchers.teamId, researchTeams.id))
      .where(and(...baseFilters))
      .orderBy(desc(researchers.citations))
      .limit(query.limit),

      // Yearly Trends
      db.select({
        year: sql<number>`EXTRACT(YEAR FROM ${publications.publicationDate})`.as('year'),
        researcherCount: count(sql`DISTINCT ${publicationAuthors.researcherId}`).as('researcher_count'),
        avgCitations: avg(researchers.citations).as('avg_citations'),
        avgHIndex: avg(researchers.hIndex).as('avg_h_index')
      })
      .from(publicationAuthors)
      .innerJoin(researchers, eq(publicationAuthors.researcherId, researchers.id))
      .innerJoin(publications, eq(publicationAuthors.publicationId, publications.id))
      .where(and(...baseFilters))
      .groupBy(sql`year`)
      .orderBy(sql`year`),

      // Team Distribution
      db.select({
        teamName: researchTeams.name,
        researcherCount: count(researchers.id).as('researcher_count'),
        avgCitations: avg(researchers.citations).as('avg_citations'),
        avgHIndex: avg(researchers.hIndex).as('avg_h_index')
      })
      .from(researchTeams)
      .leftJoin(researchers, eq(researchers.teamId, researchTeams.id))
      .where(and(...baseFilters))
      .groupBy(researchTeams.name)
      .orderBy(desc(sql`researcher_count`)),

      // Qualification Stats
      db.select({
        qualification: researchers.qualification,
        researcherCount: count(researchers.id).as('researcher_count'),
        avgCitations: avg(researchers.citations).as('avg_citations'),
        avgHIndex: avg(researchers.hIndex).as('avg_h_index')
      })
      .from(researchers)
      .where(and(...baseFilters))
      .groupBy(researchers.qualification)
      .orderBy(desc(sql`avg_citations`))
    ]);

    return NextResponse.json({
      researcher_metrics: researcherMetrics,
      yearly_trends: yearlyTrends,
      team_distribution: teamDistribution,
      qualification_stats: qualificationStats
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch researcher analytics' },
      { status: 500 }
    );
  }
}