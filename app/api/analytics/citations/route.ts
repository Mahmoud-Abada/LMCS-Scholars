// src/app/api/analytics/citations/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { 
  researchers, 
  publications, 
  publicationAuthors,
  publicationExternalAuthors,
  externalAuthors,
  researchTeams,
  publicationVenues,
  venues,
  publicationClassifications,
  classificationSystems
} from '@/db/schema';
import { and, count, desc, eq, gte, lte, max, sql, sum } from 'drizzle-orm';
import { z } from 'zod';
import { handleApiError } from '@/lib/api-utils';

const querySchema = z.object({
  yearFrom: z.coerce.number().min(1990).max(new Date().getFullYear()).optional(),
  yearTo: z.coerce.number().min(1990).max(new Date().getFullYear()).optional(),
  teamId: z.string().uuid().optional(),
  researcherId: z.string().uuid().optional(),
  venueId: z.string().uuid().optional(),
  classificationId: z.string().uuid().optional(),
  publicationType: z.enum(['journal_article', 'conference_paper', 'book_chapter', 'patent', 'technical_report', 'thesis', 'preprint']).optional(),
  limit: z.coerce.number().min(1).max(100).optional().default(10),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams.entries()));

    // Base filters for all queries
    const baseFilters = [
      query.yearFrom 
        ? gte(sqlEXTRACT(YEAR FROM ${publications.publicationDate}), query.yearFrom)
        : undefined,
      query.yearTo
        ? lte(sqlEXTRACT(YEAR FROM ${publications.publicationDate}), query.yearTo)
        : undefined,
      query.teamId
        ? eq(researchers.teamId, query.teamId)
        : undefined,
      query.researcherId
        ? eq(publicationAuthors.researcherId, query.researcherId)
        : undefined,
      query.venueId
        ? sql`EXISTS (
              SELECT 1 FROM ${publicationVenues} 
              WHERE ${publicationVenues.publicationId} = ${publications.id}
              AND ${publicationVenues.venueId} = ${query.venueId}
            )`
        : undefined,
      query.classificationId
        ? sql`EXISTS (
              SELECT 1 FROM ${publicationClassifications} 
              WHERE ${publicationClassifications.publicationId} = ${publications.id}
              AND ${publicationClassifications.systemId} = ${query.classificationId}
            )`
        : undefined,
      query.publicationType
        ? eq(publications.publicationType, query.publicationType)
        : undefined
    ].filter(Boolean);

    // Execute all queries in parallel for better performance
    const [
      highLevelMetrics,
      yearlyTrends,
      researcherMetrics,
      teamMetrics,
      topPublications,
      venueMetrics,
      classificationMetrics,
      collaborationMetrics,
      citationMomentum
    ] = await Promise.all([
      // 1. HIGH-LEVEL METRICS
      db.select({
        total_citations: sum(publications.citationCount).as('total_citations'),
        total_publications: count(publications.id).as('total_publications'),
        avg_citations: sql<number>ROUND(AVG(${publications.citationCount})::numeric, 2).as('avg_citations'),
        max_citations: max(publications.citationCount).as('max_citations')
      })
      .from(publications)
      .where(and(...baseFilters)),

      // 2. YEARLY TRENDS
      db.select({
        year: sql<number>EXTRACT(YEAR FROM ${publications.publicationDate}).as('year'),
        total_citations: sum(publications.citationCount).as('total_citations'),
        publication_count: count(publications.id).as('publication_count'),
        avg_citations: sql<number>ROUND(AVG(${publications.citationCount})::numeric, 2).as('avg_citations'),
        new_citations: sql<number>`SUM(
          CASE WHEN EXTRACT(YEAR FROM CURRENT_DATE) - EXTRACT(YEAR FROM ${publications.publicationDate}) <= 5 
          THEN ${publications.citationCount} ELSE 0 END
        )`.as('new_citations')
      })
      .from(publications)
      .where(and(...baseFilters))
      .groupBy(sqlyear)
      .orderBy(sqlyear),

      // 3. RESEARCHER METRICS
      db.select({
        researcher_id: researchers.id,
        name: sql<string>CONCAT(${researchers.firstName}, ' ', ${researchers.lastName}).as('name'),
        total_citations: sum(publications.citationCount).as('total_citations'),
        publication_count: count(publications.id).as('publication_count'),
        avg_citations: sql<number>ROUND(AVG(${publications.citationCount})::numeric, 2).as('avg_citations'),
        h_index: max(researchers.hIndex).as('h_index'),
        i10_index: max(researchers.i10Index).as('i10_index')
      })
      .from(researchers)
      .leftJoin(
        publicationAuthors,
        eq(researchers.id, publicationAuthors.researcherId)
      )
      .leftJoin(
        publications,
        eq(publications.id, publicationAuthors.publicationId)
      )
      .where(and(...baseFilters))
      .groupBy(researchers.id, researchers.firstName, researchers.lastName)
      .orderBy(desc(sqltotal_citations))
      .limit(query.limit),

      // 4. TEAM METRICS
      db.select({
        team_id: researchTeams.id,
        team_name: researchTeams.name,
        total_citations: sum(publications.citationCount).as('total_citations'),
        researcher_count: count(sqlDISTINCT ${researchers.id}).as('researcher_count'),
        avg_citations_per_researcher: sql<number>ROUND(SUM(${publications.citationCount})::numeric / NULLIF(COUNT(DISTINCT ${researchers.id}), 0), 2).as('avg_citations_per_researcher'),
        publication_count: count(publications.id).as('publication_count')
      })
      .from(researchTeams)
      .leftJoin(
        researchers,
        eq(researchers.teamId, researchTeams.id)
      )
      .leftJoin(
        publicationAuthors,
        eq(researchers.id, publicationAuthors.researcherId)
      )
      .leftJoin(
        publications,
        eq(publications.id, publicationAuthors.publicationId)
      )
      .where(and(...baseFilters))
      .groupBy(researchTeams.id, researchTeams.name)
      .orderBy(desc(sqltotal_citations)),

      // 5. TOP PUBLICATIONS
      db.select({
        id: publications.id,
        title: publications.title,
        citation_count: publications.citationCount,
        publication_date: publications.publicationDate,
        publication_type: publications.publicationType,
        authors: sql<string[]>`ARRAY(
          SELECT ${researchers.firstName} || ' ' || ${researchers.lastName}
          FROM ${publicationAuthors}
          JOIN ${researchers} ON ${researchers.id} = ${publicationAuthors.researcherId}
          WHERE ${publicationAuthors.publicationId} = ${publications.id}
          UNION
          SELECT ${externalAuthors.fullName}
          FROM ${publicationExternalAuthors}
          JOIN ${externalAuthors} ON ${externalAuthors.id} = ${publicationExternalAuthors.authorId}
          WHERE ${publicationExternalAuthors.publicationId} = ${publications.id}
        )`.as('authors')
      })
      .from(publications)
      .where(and(...baseFilters))
      .orderBy(desc(publications.citationCount))
      .limit(query.limit),

      // 6. VENUE METRICS
      db.select({
        venue_id: venues.id,
        venue_name: venues.name,
        venue_type: venues.type,
        total_citations: sum(publications.citationCount).as('total_citations'),
        publication_count: count(publications.id).as('publication_count'),
        avg_citations: sql<number>ROUND(AVG(${publications.citationCount})::numeric, 2).as('avg_citations')
      })
      .from(venues)
      .leftJoin(
        publicationVenues,
        eq(venues.id, publicationVenues.venueId)
      )
      .leftJoin(
        publications,
        eq(publications.id, publicationVenues.publicationId)
      )
      .where(and(...baseFilters))
      .groupBy(venues.id, venues.name, venues.type)
      .orderBy(desc(sqltotal_citations)),

      // 7. CLASSIFICATION METRICS
      db.select({
        system_id: classificationSystems.id,
        system_name: classificationSystems.name,
        category: publicationClassifications.category,
        total_citations: sum(publications.citationCount).as('total_citations'),
        publication_count: count(publications.id).as('publication_count'),
        avg_citations: sql<number>ROUND(AVG(${publications.citationCount})::numeric, 2).as('avg_citations')
      })
      .from(classificationSystems)
      .leftJoin(
        publicationClassifications,
        eq(classificationSystems.id, publicationClassifications.systemId)
      )
      .leftJoin(
        publications,
        eq(publications.id, publicationClassifications.publicationId)
      )
      .where(and(...baseFilters))
      .groupBy(classificationSystems.id, classificationSystems.name, publicationClassifications.category)
      .orderBy(desc(sqltotal_citations)),

      // 8. COLLABORATION METRICS
      db.select({
        collaboration_type: sql<string>`CASE
          WHEN COUNT(DISTINCT ${publicationAuthors.researcherId}) = 1 THEN 'single-author'
          WHEN COUNT(DISTINCT ${researchers.teamId}) = 1 THEN 'intra-team'
          ELSE 'inter-team'
        END`.as('collaboration_type'),
        total_citations: sum(publications.citationCount).as('total_citations'),
        publication_count: count(publications.id).as('publication_count'),
        avg_citations: sql<number>ROUND(AVG(${publications.citationCount})::numeric, 2).as('avg_citations'),
        author_count: sql<number>COUNT(DISTINCT ${publicationAuthors.researcherId}).as('author_count')
      })
      .from(publications)
      .leftJoin(
        publicationAuthors,
        eq(publications.id, publicationAuthors.publicationId)
      )
      .leftJoin(
        researchers,
        eq(researchers.id, publicationAuthors.researcherId)
      )
      .where(and(...baseFilters))
      .groupBy(publications.id),

      // 9. CITATION MOMENTUM (year-over-year growth)
      db.execute(sql`
        WITH yearly_stats AS (
          SELECT 
            EXTRACT(YEAR FROM ${publications.publicationDate}) AS year,
            SUM(${publications.citationCount}) AS total_citations,
            COUNT(${publications.id}) AS publication_count
          FROM ${publications}
          ${and(...baseFilters) ? sqlWHERE ${and(...baseFilters)} : sql``}
          GROUP BY year
          ORDER BY year
        )
        SELECT 
          year,
          total_citations,
          publication_count,
          total_citations - LAG(total_citations, 1, 0) OVER (ORDER BY year) AS citation_growth,
          (total_citations - LAG(total_citations, 1, 0) OVER (ORDER BY year)) / 
          NULLIF(LAG(total_citations, 1, 1) OVER (ORDER BY year), 0) * 100 AS growth_rate
        FROM yearly_stats
      `)
    ]);

    return NextResponse.json({
      high_level_metrics: highLevelMetrics[0],
      yearly_trends: yearlyTrends,
      researcher_metrics: researcherMetrics,
      team_metrics: teamMetrics,
      top_publications: topPublications,
      venue_metrics: venueMetrics,
      classification_metrics: classificationMetrics,
      collaboration_metrics: collaborationMetrics,
      citation_momentum: citationMomentum
    });
  } catch (error) {
    return handleApiError(error);
  }
}