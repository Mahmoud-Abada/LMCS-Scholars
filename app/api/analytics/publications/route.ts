// app/api/analytics/publications/route.ts
import { db } from "@/db/client";
import {
  classificationSystems,
  externalAuthors,
  publicationAuthors,
  publicationClassifications,
  publicationExternalAuthors,
  publications,
  publicationVenues,
  researchers,
  researchTeams,
  venues,
} from "@/db/schema";
import { handleApiError } from "@/lib/api-utils";
import { and, count, desc, eq, gte, lte, max, sql, sum } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const querySchema = z.object({
  yearFrom: z.coerce
    .number()
    .min(1990)
    .max(new Date().getFullYear())
    .optional(),
  yearTo: z.coerce.number().min(1990).max(new Date().getFullYear()).optional(),
  teamId: z.string().uuid().optional(),
  researcherId: z.string().uuid().optional(),
  venueId: z.string().uuid().optional(),
  classificationId: z.string().uuid().optional(),
  publicationType: z
    .enum([
      "journal_article",
      "conference_paper",
      "book_chapter",
      "patent",
      "technical_report",
      "thesis",
      "preprint",
    ])
    .optional(),
  minCitations: z.coerce.number().min(0).optional(),
  limit: z.coerce.number().min(1).max(100).optional().default(10),
});

export async function GET(request: Request) {
  const startTime = Date.now();
  console.log("[PUBLICATIONS ANALYTICS] Starting request processing");

  try {
    // Parse and validate query parameters
    console.log("[PUBLICATIONS ANALYTICS] Parsing query parameters");
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams.entries()));
    console.log("[PUBLICATIONS ANALYTICS] Query parameters:", query);

    // Clean query to remove undefined/null values
    const cleanQuery = Object.fromEntries(
      Object.entries(query).filter(([, v]) => v !== null && v !== undefined)
    ) as typeof query;
    console.log("[PUBLICATIONS ANALYTICS] Cleaned query:", cleanQuery);

    // Base filters for all queries
    console.log("[PUBLICATIONS ANALYTICS] Building base filters");
    const baseFilters = [
      cleanQuery.yearFrom
        ? gte(
            sql`EXTRACT(YEAR FROM ${publications.publicationDate})`,
            cleanQuery.yearFrom
          )
        : undefined,
      cleanQuery.yearTo
        ? lte(
            sql`EXTRACT(YEAR FROM ${publications.publicationDate})`,
            cleanQuery.yearTo
          )
        : undefined,
      cleanQuery.teamId
        ? sql`EXISTS (
              SELECT 1 FROM ${publicationAuthors}
              JOIN ${researchers} ON ${researchers.id} = ${publicationAuthors.researcherId}
              WHERE ${publicationAuthors.publicationId} = ${publications.id}
              AND ${researchers.teamId} = ${cleanQuery.teamId}
            )`
        : undefined,
      cleanQuery.researcherId
        ? sql`EXISTS (
              SELECT 1 FROM ${publicationAuthors}
              WHERE ${publicationAuthors.publicationId} = ${publications.id}
              AND ${publicationAuthors.researcherId} = ${cleanQuery.researcherId}
            )`
        : undefined,
      cleanQuery.venueId
        ? sql`EXISTS (
              SELECT 1 FROM ${publicationVenues}
              WHERE ${publicationVenues.publicationId} = ${publications.id}
              AND ${publicationVenues.venueId} = ${cleanQuery.venueId}
            )`
        : undefined,
      cleanQuery.classificationId
        ? sql`EXISTS (
              SELECT 1 FROM ${publicationClassifications}
              WHERE ${publicationClassifications.publicationId} = ${publications.id}
              AND ${publicationClassifications.systemId} = ${cleanQuery.classificationId}
            )`
        : undefined,
      cleanQuery.publicationType
        ? eq(publications.publicationType, cleanQuery.publicationType)
        : undefined,
      cleanQuery.minCitations
        ? gte(publications.citationCount, cleanQuery.minCitations)
        : undefined,
    ].filter(Boolean);
    console.log(
      "[PUBLICATIONS ANALYTICS] Base filters applied:",
      baseFilters.length
    );

    // Execute queries sequentially with logging
    console.log(
      "[PUBLICATIONS ANALYTICS] Starting sequential queries execution"
    );

    // 1. HIGH-LEVEL PUBLICATION METRICS
    console.log('[PUBLICATIONS ANALYTICS] Executing highLevelMetrics query');
    const highLevelMetrics = await db.select({
        total_publications: count(publications.id).as('total_publications'),
        total_citations: sum(publications.citationCount).as('total_citations'),
        avg_citations: sql<number>`ROUND(AVG(${publications.citationCount})::numeric, 2)`.as('avg_citations'),
        max_citations: max(publications.citationCount).as('max_citations'),
        h_index: sql<number>`
          (SELECT COUNT(*) FROM (
            SELECT 1
            FROM ${publications}
            WHERE ${baseFilters.length > 0 ? and(...baseFilters) : sql`1=1`}
            AND ${publications.citationCount} >= (
              SELECT COUNT(*) 
              FROM ${publications} p2 
              WHERE ${baseFilters.length > 0 ? and(...baseFilters) : sql`1=1`}
              AND p2.citation_count >= ${publications.citationCount}
            )
          ) AS h_calc)`.as('h_index'),
        i10_index: sql<number>`(
          SELECT COUNT(*)
          FROM ${publications}
          WHERE ${publications.citationCount} >= 10
          ${baseFilters.length > 0 ? sql`AND ${and(...baseFilters)}` : sql``}
        )`.as('i10_index')
      })
      .from(publications)
      .where(and(...baseFilters));

    // 2. YEARLY PUBLICATION TRENDS
    console.log("[PUBLICATIONS ANALYTICS] Executing yearlyTrends query");
    const yearlyTrends = await db
      .select({
        year: sql<number>`EXTRACT(YEAR FROM ${publications.publicationDate})`.as(
          "year"
        ),
        publication_count: count(publications.id).as("publication_count"),
        citation_count: sum(publications.citationCount).as("citation_count"),
        avg_citations:
          sql<number>`ROUND(AVG(${publications.citationCount})::numeric, 2)`.as(
            "avg_citations"
          ),
        citation_velocity: sql<number>`
        ROUND(SUM(${publications.citationCount}) / NULLIF(
          EXTRACT(YEAR FROM CURRENT_DATE) - EXTRACT(YEAR FROM ${publications.publicationDate}), 0
        ), 2)`.as("citation_velocity"),
      })
      .from(publications)
      .where(and(...baseFilters))
      .groupBy(sql`EXTRACT(YEAR FROM ${publications.publicationDate})`)
      .orderBy(sql`EXTRACT(YEAR FROM ${publications.publicationDate})`);
    console.log(
      "[PUBLICATIONS ANALYTICS] yearlyTrends result count:",
      yearlyTrends.length
    );

   // 3. PUBLICATION TYPE DISTRIBUTION
console.log('[PUBLICATIONS ANALYTICS] Executing publicationTypes query');
const publicationTypes = await db.select({
  publication_type: publications.publicationType,
  count: count(publications.id).as('count'),
  percentage: sql<number>`
    ROUND(COUNT(${publications.id}) * 100.0 / NULLIF(
      (SELECT COUNT(*) FROM ${publications} ${
        baseFilters.length > 0 
          ? sql`WHERE ${and(...baseFilters)}` 
          : sql``
      }), 0
    ), 2)`.as('percentage'),
  avg_citations: sql<number>`ROUND(AVG(${publications.citationCount})::numeric, 2)`.as('avg_citations')
})
.from(publications)
.where(and(...baseFilters))
.groupBy(publications.publicationType)
.orderBy(desc(count(publications.id)));
console.log('[PUBLICATIONS ANALYTICS] publicationTypes result count:', publicationTypes.length);

    // 4. RESEARCHER CONTRIBUTION ANALYSIS
    console.log(
      "[PUBLICATIONS ANALYTICS] Executing researcherContributions query"
    );
    const researcherContributions = await db
      .select({
        researcher_id: researchers.id,
        name: sql<string>`CONCAT(${researchers.firstName}, ' ', ${researchers.lastName})`.as(
          "name"
        ),
        team_name: researchTeams.name,
        publication_count: count(publications.id).as("publication_count"),
        first_author_count: sql<number>`
        COUNT(CASE WHEN (
          SELECT ${publicationAuthors.researcherId}
          FROM ${publicationAuthors}
          WHERE ${publicationAuthors.publicationId} = ${publications.id}
          ORDER BY ${publicationAuthors.createdAt}
          LIMIT 1
        ) = ${researchers.id} THEN 1 END)`.as("first_author_count"),
        citation_count: sum(publications.citationCount).as("citation_count"),
        avg_citations:
          sql<number>`ROUND(AVG(${publications.citationCount})::numeric, 2)`.as(
            "avg_citations"
          ),
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
      .leftJoin(researchTeams, eq(researchers.teamId, researchTeams.id))
      .where(and(...baseFilters))
      .groupBy(
        researchers.id,
        researchers.firstName,
        researchers.lastName,
        researchTeams.name
      )
      .orderBy(desc(sql`publication_count`))
      .limit(cleanQuery.limit);
    console.log(
      "[PUBLICATIONS ANALYTICS] researcherContributions result count:",
      researcherContributions.length
    );

    // 5. TEAM CONTRIBUTION ANALYSIS
    console.log("[PUBLICATIONS ANALYTICS] Executing teamContributions query");
    const teamContributions = await db
      .select({
        team_id: researchTeams.id,
        team_name: researchTeams.name,
        publication_count: count(publications.id).as("publication_count"),
        citation_count: sum(publications.citationCount).as("citation_count"),
        avg_citations:
          sql<number>`ROUND(AVG(${publications.citationCount})::numeric, 2)`.as(
            "avg_citations"
          ),
        researcher_count: count(sql`DISTINCT ${researchers.id}`).as(
          "researcher_count"
        ),
        publications_per_researcher: sql<number>`
        ROUND(COUNT(${publications.id})::numeric / NULLIF(COUNT(DISTINCT ${researchers.id}), 0), 2)`.as(
          "publications_per_researcher"
        ),
      })
      .from(researchTeams)
      .leftJoin(researchers, eq(researchers.teamId, researchTeams.id))
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
      .orderBy(desc(sql`publication_count`));
    console.log(
      "[PUBLICATIONS ANALYTICS] teamContributions result count:",
      teamContributions.length
    );

    // 6. VENUE ANALYSIS
    console.log("[PUBLICATIONS ANALYTICS] Executing venueAnalysis query");
    const venueAnalysis = await db
      .select({
        venue_id: venues.id,
        venue_name: venues.name,
        venue_type: venues.type,
        publication_count: count(publications.id).as("publication_count"),
        citation_count: sum(publications.citationCount).as("citation_count"),
        avg_citations:
          sql<number>`ROUND(AVG(${publications.citationCount})::numeric, 2)`.as(
            "avg_citations"
          ),
        first_publication_year: sql<number>`
        MIN(EXTRACT(YEAR FROM ${publications.publicationDate}))`.as(
          "first_publication_year"
        ),
        last_publication_year: sql<number>`
        MAX(EXTRACT(YEAR FROM ${publications.publicationDate}))`.as(
          "last_publication_year"
        ),
      })
      .from(venues)
      .leftJoin(publicationVenues, eq(venues.id, publicationVenues.venueId))
      .leftJoin(
        publications,
        eq(publications.id, publicationVenues.publicationId)
      )
      .where(and(...baseFilters))
      .groupBy(venues.id, venues.name, venues.type)
      .orderBy(desc(sql`publication_count`))
      .limit(cleanQuery.limit);
    console.log(
      "[PUBLICATIONS ANALYTICS] venueAnalysis result count:",
      venueAnalysis.length
    );

    // 7. CLASSIFICATION ANALYSIS
    console.log(
      "[PUBLICATIONS ANALYTICS] Executing classificationAnalysis query"
    );
    const classificationAnalysis = await db
      .select({
        system_id: classificationSystems.id,
        system_name: classificationSystems.name,
        category: publicationClassifications.category,
        publication_count: count(publications.id).as("publication_count"),
        citation_count: sum(publications.citationCount).as("citation_count"),
        avg_citations:
          sql<number>`ROUND(AVG(${publications.citationCount})::numeric, 2)`.as(
            "avg_citations"
          ),
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
      .groupBy(
        classificationSystems.id,
        classificationSystems.name,
        publicationClassifications.category
      )
      .orderBy(desc(sql`publication_count`));
    console.log(
      "[PUBLICATIONS ANALYTICS] classificationAnalysis result count:",
      classificationAnalysis.length
    );

    // 8. TOP CITED PUBLICATIONS
    console.log(
      "[PUBLICATIONS ANALYTICS] Executing topCitedPublications query"
    );
    const topCitedPublications = await db
      .select({
        id: publications.id,
        title: publications.title,
        publication_type: publications.publicationType,
        publication_date: publications.publicationDate,
        citation_count: publications.citationCount,
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
      )`.as("authors"),
        venues: sql<string[]>`ARRAY(
        SELECT ${venues.name}
        FROM ${publicationVenues}
        JOIN ${venues} ON ${venues.id} = ${publicationVenues.venueId}
        WHERE ${publicationVenues.publicationId} = ${publications.id}
      )`.as("venues"),
      })
      .from(publications)
      .where(and(...baseFilters))
      .orderBy(desc(publications.citationCount))
      .limit(cleanQuery.limit);
    console.log(
      "[PUBLICATIONS ANALYTICS] topCitedPublications result count:",
      topCitedPublications.length
    );

    // 9. CITATION IMPACT ANALYSIS
    console.log("[PUBLICATIONS ANALYTICS] Executing citationImpact query");
    const citationImpact = await db.execute(sql`
      WITH citation_buckets AS (
        SELECT
          CASE
            WHEN ${publications.citationCount} = 0 THEN '0'
            WHEN ${publications.citationCount} BETWEEN 1 AND 5 THEN '1-5'
            WHEN ${publications.citationCount} BETWEEN 6 AND 10 THEN '6-10'
            WHEN ${publications.citationCount} BETWEEN 11 AND 20 THEN '11-20'
            WHEN ${publications.citationCount} BETWEEN 21 AND 50 THEN '21-50'
            WHEN ${publications.citationCount} BETWEEN 51 AND 100 THEN '51-100'
            ELSE '100+'
          END AS bucket,
          COUNT(*) AS count,
          SUM(${publications.citationCount}) AS total_citations
        FROM ${publications}
        ${and(...baseFilters) ? sql`WHERE ${and(...baseFilters)}` : sql``}
        GROUP BY bucket
      )
      SELECT
        bucket,
        count,
        total_citations,
        ROUND(count * 100.0 / NULLIF(SUM(count) OVER (), 0), 2) AS percentage,
        ROUND(total_citations * 100.0 / NULLIF(SUM(total_citations) OVER (), 0), 2) AS citation_percentage
      FROM citation_buckets
      ORDER BY
        CASE bucket
          WHEN '0' THEN 0
          WHEN '1-5' THEN 1
          WHEN '6-10' THEN 2
          WHEN '11-20' THEN 3
          WHEN '21-50' THEN 4
          WHEN '51-100' THEN 5
          ELSE 6
        END
    `);
    console.log(
      "[PUBLICATIONS ANALYTICS] citationImpact result count:",
      citationImpact.length
    );

    // 10. COLLABORATION PATTERNS
    console.log(
      "[PUBLICATIONS ANALYTICS] Executing collaborationPatterns query"
    );
    const collaborationPatterns = await db
      .select({
        author_count: sql<number>`
        (SELECT COUNT(*) FROM ${publicationAuthors} 
         WHERE ${publicationAuthors.publicationId} = ${publications.id}) + 
        (SELECT COUNT(*) FROM ${publicationExternalAuthors} 
         WHERE ${publicationExternalAuthors.publicationId} = ${publications.id})
      `.as("author_count"),
        publication_count: count(publications.id).as("publication_count"),
        citation_count: sum(publications.citationCount).as("citation_count"),
        avg_citations:
          sql<number>`ROUND(AVG(${publications.citationCount})::numeric, 2)`.as(
            "avg_citations"
          ),
      })
      .from(publications)
      .where(and(...baseFilters))
      .groupBy(sql`author_count`)
      .orderBy(sql`author_count`);
    console.log(
      "[PUBLICATIONS ANALYTICS] collaborationPatterns result count:",
      collaborationPatterns.length
    );

    // 11. PUBLICATION VELOCITY
    console.log("[PUBLICATIONS ANALYTICS] Executing publicationVelocity query");
    const publicationVelocity = await db.execute(sql`
      WITH yearly_stats AS (
        SELECT 
          EXTRACT(YEAR FROM ${publications.publicationDate}) AS year,
          COUNT(*) AS publication_count
        FROM ${publications}
        ${and(...baseFilters) ? sql`WHERE ${and(...baseFilters)}` : sql``}
        GROUP BY year
        ORDER BY year
      )
      SELECT
        year,
        publication_count,
        publication_count - LAG(publication_count, 1, 0) OVER (ORDER BY year) AS growth,
        ROUND(
          (publication_count - LAG(publication_count, 1, 0) OVER (ORDER BY year)) * 100.0 / 
          NULLIF(LAG(publication_count, 1, 1) OVER (ORDER BY year), 0), 2) AS growth_rate,
        ROUND(AVG(publication_count) OVER (
          ORDER BY year ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
        ), 2) AS moving_avg_3yr
      FROM yearly_stats
    `);
    console.log(
      "[PUBLICATIONS ANALYTICS] publicationVelocity result count:",
      publicationVelocity.length
    );

    // 12. AUTHOR NETWORK ANALYSIS
    console.log("[PUBLICATIONS ANALYTICS] Executing authorNetwork query");
    const authorNetwork = await db.execute(sql`
  WITH coauthors AS (
    SELECT
      pa1.researcher_id AS researcher1,
      pa2.researcher_id AS researcher2,
      COUNT(DISTINCT pa1.publication_id) AS collaboration_count
    FROM ${publicationAuthors} pa1
    JOIN ${publicationAuthors} pa2 ON 
      pa1.publication_id = pa2.publication_id AND 
      pa1.researcher_id < pa2.researcher_id
    JOIN ${publications} p ON p.id = pa1.publication_id
    ${and(...baseFilters) ? sql`WHERE ${and(...baseFilters)}` : sql``}
    GROUP BY pa1.researcher_id, pa2.researcher_id
    HAVING COUNT(DISTINCT pa1.publication_id) > 0
  )
  SELECT
    r1.id AS researcher1_id,
    CONCAT(r1.first_name, ' ', r1.last_name) AS researcher1_name,
    r2.id AS researcher2_id,
    CONCAT(r2.first_name, ' ', r2.last_name) AS researcher2_name,
    c.collaboration_count,
    t1.name AS researcher1_team,
    t2.name AS researcher2_team,
    CASE WHEN t1.id = t2.id THEN 'intra-team' ELSE 'inter-team' END AS collaboration_type
  FROM coauthors c
  JOIN ${researchers} r1 ON r1.id = c.researcher1
  JOIN ${researchers} r2 ON r2.id = c.researcher2
  LEFT JOIN ${researchTeams} t1 ON t1.id = r1.team_id
  LEFT JOIN ${researchTeams} t2 ON t2.id = r2.team_id
  ORDER BY c.collaboration_count DESC
  LIMIT ${cleanQuery.limit * 2}
`);
    console.log(
      "[PUBLICATIONS ANALYTICS] authorNetwork result count:",
      authorNetwork.length
    );

    const responseData = {
      high_level_metrics: highLevelMetrics[0],
      yearly_trends: yearlyTrends,
      publication_types: publicationTypes,
      researcher_contributions: researcherContributions,
      team_contributions: teamContributions,
      venue_analysis: venueAnalysis,
      classification_analysis: classificationAnalysis,
      top_cited_publications: topCitedPublications,
      citation_impact: citationImpact,
      collaboration_patterns: collaborationPatterns,
      publication_velocity: publicationVelocity,
      author_network: authorNetwork,
    };

    console.log(
      `[PUBLICATIONS ANALYTICS] Request completed in ${
        Date.now() - startTime
      }ms`
    );
    return NextResponse.json(responseData);
  } catch (error) {
    console.error("[PUBLICATIONS ANALYTICS] Error:", error);
    console.error(
      `[PUBLICATIONS ANALYTICS] Request failed after ${
        Date.now() - startTime
      }ms`
    );
    return handleApiError(error);
  }
}
