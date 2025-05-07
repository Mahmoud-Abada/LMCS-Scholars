// src/app/api/analytics/researchers/route.ts
import { db } from "@/db/client";
import {
  publicationAuthors,
  publications,
  publicationVenues,
  researchers,
  researchTeams,
  venues,
} from "@/db/schema";
import { handleApiError } from "@/lib/api-utils";
import { and, avg, count, desc, eq, gte, lte, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { NextResponse } from "next/server";
import { z } from "zod";

// In your route.ts
const querySchema = z.object({
  yearFrom: z.coerce
    .number()
    .min(1990)
    .max(new Date().getFullYear())
    .optional(),
  yearTo: z.coerce.number().min(1990).max(new Date().getFullYear()).optional(),
  teamId: z.string().uuid().optional().nullable(), // Add .nullable()
  researcherId: z.string().uuid().optional().nullable(), // Add .nullable()
  status: z.enum(["active", "on_leave", "inactive", "retired"]).optional(),
  qualification: z
    .enum([
      "professor",
      "associate_professor",
      "assistant_professor",
      "postdoc",
      "phd_candidate",
      "research_scientist",
    ])
    .optional(),
  position: z
    .enum([
      "director",
      "department_head",
      "principal_investigator",
      "senior_researcher",
      "researcher",
      "assistant",
    ])
    .optional(),
  minHIndex: z.coerce.number().min(0).optional(),
  limit: z.coerce.number().min(1).max(100).optional().default(10),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams.entries()));

    console.log("Parsed query:", query);
    // Inside your GET handler
    const cleanQuery = Object.fromEntries(
      Object.entries(query).filter(([, v]) => v !== null && v !== undefined)
    ) as typeof query;

    // Then use cleanQuery instead of query in your filters
    // Base filters for all queries
    const baseFilters = [
      cleanQuery.yearFrom
        ? gte(
            sql`EXTRACT(YEAR FROM ${publications.publicationDate})`,
            Number(cleanQuery.yearFrom)
          )
        : undefined,
      cleanQuery.yearTo
        ? lte(
            sql`EXTRACT(YEAR FROM ${publications.publicationDate})`,
            Number(cleanQuery.yearTo)
          )
        : undefined,
      cleanQuery.teamId
        ? eq(researchers.teamId, String(cleanQuery.teamId))
        : undefined,
      cleanQuery.researcherId
        ? eq(researchers.id, String(cleanQuery.researcherId))
        : undefined,
      cleanQuery.status ? eq(researchers.status, cleanQuery.status) : undefined,
      cleanQuery.qualification
        ? eq(researchers.qualification, cleanQuery.qualification)
        : undefined,
      cleanQuery.position
        ? eq(researchers.position, cleanQuery.position)
        : undefined,
      cleanQuery.minHIndex
        ? gte(researchers.hIndex, Number(cleanQuery.minHIndex))
        : undefined,
    ].filter(Boolean);
    const collabResearchers = alias(researchers, "collab_researchers");

    // Execute all queries in parallel for better performance
    const [
      highLevelMetrics,
      yearlyTrends,
      researcherProductivity,
      teamDistribution,
      citationImpact,
      collaborationNetwork,
      publicationTypes,
      venueAnalysis,
      careerProgression,
      researcherComparison,
    ] = await Promise.all([
      // 1. HIGH-LEVEL RESEARCHER METRICS
      db
        .select({
          total_researchers: count(researchers.id).as("total_researchers"),
          active_researchers: count(
            sql`CASE WHEN ${researchers.status} = 'active' THEN 1 END`
          ).as("active_researchers"),
          avg_h_index: avg(researchers.hIndex).as("avg_h_index"),
          avg_i10_index: avg(researchers.i10Index).as("avg_i10_index"),
          avg_citations: avg(researchers.citations).as("avg_citations"),
          professors_count: count(
            sql`CASE WHEN ${researchers.qualification} = 'professor' THEN 1 END`
          ).as("professors_count"),
        })
        .from(researchers)
        .where(and(...baseFilters)),

      // 2. YEARLY RESEARCHER TRENDS (hiring, departures, productivity)
      db.execute(sql`
        WITH yearly_stats AS (
          SELECT 
            EXTRACT(YEAR FROM ${researchers.joinDate}) AS year,
            COUNT(*) AS researchers_joined,
            SUM(CASE WHEN ${researchers.leaveDate} IS NOT NULL 
                 AND EXTRACT(YEAR FROM ${
                   researchers.leaveDate
                 }) = EXTRACT(YEAR FROM ${researchers.joinDate})
                 THEN 1 ELSE 0 END) AS researchers_left,
            AVG(${researchers.hIndex}) AS avg_h_index,
            AVG(${researchers.citations}) AS avg_citations
          FROM ${researchers}
          ${and(...baseFilters) ? sql`WHERE ${and(...baseFilters)}` : sql``}
          GROUP BY year
          ORDER BY year
        )
        SELECT 
          year,
          researchers_joined,
          researchers_left,
          researchers_joined - researchers_left AS net_growth,
          avg_h_index,
          avg_citations
        FROM yearly_stats
        WHERE year IS NOT NULL
      `),

      // 3. RESEARCHER PRODUCTIVITY ANALYSIS
      db
        .select({
          researcher_id: researchers.id,
          name: sql<string>`CONCAT(${researchers.firstName}, ' ', ${researchers.lastName})`.as(
            "name"
          ),
          status: researchers.status,
          team_name: researchTeams.name,
          publication_count: count(publications.id).as("publication_count"),
          first_publication_year:
            sql<number>`MIN(EXTRACT(YEAR FROM ${publications.publicationDate}))`.as(
              "first_publication_year"
            ),
          last_publication_year:
            sql<number>`MAX(EXTRACT(YEAR FROM ${publications.publicationDate}))`.as(
              "last_publication_year"
            ),
          career_length:
            sql<number>`MAX(EXTRACT(YEAR FROM ${publications.publicationDate})) - MIN(EXTRACT(YEAR FROM ${publications.publicationDate}))`.as(
              "career_length"
            ),
          // 3. RESEARCHER PRODUCTIVITY ANALYSIS
          pubs_per_year:
            sql<number>`ROUND(COUNT(${publications.id})::numeric / NULLIF(GREATEST(1, MAX(EXTRACT(YEAR FROM ${publications.publicationDate})) - MIN(EXTRACT(YEAR FROM ${publications.publicationDate}))), 0), 2)`.as(
              "pubs_per_year"
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
          researchers.status,
          researchTeams.name
        )
        .orderBy(desc(sql`publication_count`))
        .limit(query.limit),

      // 4. TEAM DISTRIBUTION ANALYSIS
      db
        .select({
          team_id: researchTeams.id,
          team_name: researchTeams.name,
          researcher_count: count(researchers.id).as("researcher_count"),
          avg_h_index:
            sql<number>`ROUND(COALESCE(AVG(NULLIF(${researchers.hIndex}, 0))::numeric, 2))`.as(
              "avg_h_index"
            ),
          avg_citations:
            sql<number>`ROUND(COALESCE(AVG(NULLIF(${researchers.citations}, 0))::numeric, 2))`.as(
              "avg_citations"
            ),
          professors_count: count(
            sql`CASE WHEN ${researchers.qualification} = 'professor' THEN 1 END`
          ).as("professors_count"),
          seniority_score: sql<number>`ROUND(AVG(
          CASE ${researchers.qualification}
            WHEN 'professor' THEN 5
            WHEN 'associate_professor' THEN 4
            WHEN 'assistant_professor' THEN 3
            WHEN 'postdoc' THEN 2
            WHEN 'phd_candidate' THEN 1
            ELSE 0
          END
        )::numeric, 2)`.as("seniority_score"),
        })
        .from(researchTeams)
        .leftJoin(researchers, eq(researchers.teamId, researchTeams.id))
        .where(and(...baseFilters))
        .groupBy(researchTeams.id, researchTeams.name)
        .orderBy(desc(sql`researcher_count`)),

      // 5. CITATION IMPACT ANALYSIS
      db
        .select({
          researcher_id: researchers.id,
          name: sql<string>`CONCAT(${researchers.firstName}, ' ', ${researchers.lastName})`.as(
            "name"
          ),
          h_index: researchers.hIndex,
          i10_index: researchers.i10Index,
          total_citations: researchers.citations,
          highly_cited_papers: count(
            sql`CASE WHEN ${publications.citationCount} >= 100 THEN 1 END`
          ).as("highly_cited_papers"),
          citation_per_paper:
            sql<number>`ROUND(COALESCE(${researchers.citations}::numeric / NULLIF((
    SELECT COUNT(*) FROM ${publicationAuthors} 
    WHERE ${publicationAuthors.researcherId} = ${researchers.id}
  ), 0), 0), 2)`.as("citation_per_paper"),
          citation_velocity:
            sql<number>`ROUND(COALESCE(${researchers.citations}::numeric / NULLIF(
           GREATEST(1, EXTRACT(YEAR FROM CURRENT_DATE) - EXTRACT(YEAR FROM MIN(${researchers.joinDate}))), 0), 2))`.as(
              "citation_velocity"
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
        .where(and(...baseFilters))
        .groupBy(
          researchers.id,
          researchers.firstName,
          researchers.lastName,
          researchers.hIndex,
          researchers.i10Index,
          researchers.citations
        )
        .orderBy(desc(researchers.citations))

        .limit(query.limit),

      // 6. COLLABORATION NETWORK ANALYSIS

      db
        .select({
          researcher_id: researchers.id,
          name: sql<string>`CONCAT(${researchers.firstName}, ' ', ${researchers.lastName})`.as(
            "name"
          ),
          total_collaborators: count(
            sql`DISTINCT ${publicationAuthors.researcherId}`
          ).as("total_collaborators"),
          intra_team_collaborations: sql<number>`
      COUNT(DISTINCT CASE 
        WHEN ${collabResearchers.teamId} = ${researchers.teamId}
        THEN ${publicationAuthors.researcherId}
        ELSE NULL
      END)
    `.as("intra_team_collaborations"),
          inter_team_collaborations: sql<number>`
      COUNT(DISTINCT CASE 
        WHEN ${collabResearchers.teamId} IS NOT NULL 
             AND ${collabResearchers.teamId} != ${researchers.teamId}
        THEN ${publicationAuthors.researcherId}
        ELSE NULL
      END)
    `.as("inter_team_collaborations"),
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
        .leftJoin(
          collabResearchers,
          eq(collabResearchers.id, publicationAuthors.researcherId)
        )
        .where(and(...baseFilters))
        .groupBy(researchers.id, researchers.firstName, researchers.lastName)
        .orderBy(desc(sql`total_collaborators`))
        .limit(query.limit),

      // 7. PUBLICATION TYPE DISTRIBUTION
      db
        .select({
          researcher_id: researchers.id,
          name: sql<string>`CONCAT(${researchers.firstName}, ' ', ${researchers.lastName})`.as(
            "name"
          ),
          journal_articles: count(
            sql`CASE WHEN ${publications.publicationType} = 'journal_article' THEN 1 END`
          ).as("journal_articles"),
          conference_papers: count(
            sql`CASE WHEN ${publications.publicationType} = 'conference_paper' THEN 1 END`
          ).as("conference_papers"),
          book_chapters: count(
            sql`CASE WHEN ${publications.publicationType} = 'book_chapter' THEN 1 END`
          ).as("book_chapters"),
          patents: count(
            sql`CASE WHEN ${publications.publicationType} = 'patent' THEN 1 END`
          ).as("patents"),
          other_publications: count(
            sql`CASE WHEN ${publications.publicationType} NOT IN ('journal_article', 'conference_paper', 'book_chapter', 'patent') THEN 1 END`
          ).as("other_publications"),
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
        .orderBy(desc(sql`journal_articles`))
        .limit(query.limit),

      // 8. VENUE ANALYSIS (where researchers publish)
      db
        .select({
          researcher_id: researchers.id,
          name: sql<string>`CONCAT(${researchers.firstName}, ' ', ${researchers.lastName})`.as(
            "name"
          ),
          venue_name: venues.name,
          venue_type: venues.type,
          publication_count: count(publications.id).as("publication_count"),
          avg_citations:
            sql<number>`ROUND(COALESCE(AVG(NULLIF(${publications.citationCount}, 0))::numeric, 2))`.as(
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
        .leftJoin(
          publicationVenues,
          eq(publications.id, publicationVenues.publicationId)
        )
        .leftJoin(venues, eq(venues.id, publicationVenues.venueId))
        .where(and(...baseFilters))
        .groupBy(
          researchers.id,
          researchers.firstName,
          researchers.lastName,
          venues.name,
          venues.type
        )
        .orderBy(desc(sql`publication_count`))
        .limit(query.limit * 3), // More results for this one

      // 9. CAREER PROGRESSION ANALYSIS
      // 9. CAREER PROGRESSION ANALYSIS
      db
        .select({
          researcher_id: researchers.id,
          name: sql<string>`CONCAT(${researchers.firstName}, ' ', ${researchers.lastName})`.as(
            "name"
          ),
          year: sql<number>`EXTRACT(YEAR FROM ${publications.publicationDate})`.as(
            "year"
          ),
          publication_count: count(publications.id).as("publication_count"),
          citation_count:
            sql<number>`COALESCE(SUM(${publications.citationCount}), 0)`.as(
              "citation_count"
            ),
          h_index: sql<number>`MAX(${researchers.hIndex})`.as("h_index"),
          cumulative_publications: sql<number>`
    SUM(COUNT(${publications.id})) OVER (
      PARTITION BY ${researchers.id} 
      ORDER BY EXTRACT(YEAR FROM ${publications.publicationDate})
    )`.as("cumulative_publications"),
          cumulative_citations: sql<number>`
    SUM(COALESCE(SUM(${publications.citationCount}), 0)) OVER (
      PARTITION BY ${researchers.id} 
      ORDER BY EXTRACT(YEAR FROM ${publications.publicationDate})
    )`.as("cumulative_citations"),
          publication_growth: sql<number>`
    COUNT(${publications.id}) - LAG(COUNT(${publications.id}), 1, 0) OVER (
      PARTITION BY ${researchers.id} 
      ORDER BY EXTRACT(YEAR FROM ${publications.publicationDate})
    )`.as("publication_growth"),
          citation_growth: sql<number>`
    COALESCE(SUM(${publications.citationCount}), 0) - 
    LAG(COALESCE(SUM(${publications.citationCount}), 0), 1, 0) OVER (
      PARTITION BY ${researchers.id} 
      ORDER BY EXTRACT(YEAR FROM ${publications.publicationDate})
    )`.as("citation_growth"),
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
        .groupBy(
          researchers.id,
          researchers.firstName,
          researchers.lastName,
          sql`EXTRACT(YEAR FROM ${publications.publicationDate})`
        )
        .having(({ year }) => sql`${year} IS NOT NULL`)
        .orderBy(
          researchers.id,
          sql`EXTRACT(YEAR FROM ${publications.publicationDate})`
        )
        .limit(query.limit * 5),

      // 10. RESEARCHER COMPARISON (for benchmarking)
      db
        .select({
          qualification: researchers.qualification,
          position: researchers.position,
          avg_h_index:
            sql<number>`ROUND(COALESCE(AVG(NULLIF(${researchers.hIndex}, 0))::numeric, 2))`.as(
              "avg_h_index"
            ),
          avg_i10_index:
            sql<number>`ROUND(COALESCE(AVG(NULLIF(${researchers.i10Index}, 0))::numeric, 2))`.as(
              "avg_i10_index"
            ),
          avg_citations:
            sql<number>`ROUND(COALESCE(AVG(NULLIF(${researchers.citations}, 0))::numeric, 2))`.as(
              "avg_citations"
            ),
          avg_publications: sql<number>`ROUND(COALESCE(AVG(
          NULLIF((SELECT COUNT(*) FROM ${publicationAuthors} WHERE ${publicationAuthors.researcherId} = ${researchers.id}), 0)
        )::numeric, 2))`.as("avg_publications"),
          researcher_count: count(researchers.id).as("researcher_count"),
        })
        .from(researchers)
        .where(and(...baseFilters))
        .groupBy(researchers.qualification, researchers.position)
        .orderBy(desc(sql`avg_h_index`)),
    ]);

    // Return the results as JSON

    return NextResponse.json({
      high_level_metrics: highLevelMetrics[0],
      yearly_trends: yearlyTrends,
      researcher_productivity: researcherProductivity,
      team_distribution: teamDistribution,
      citation_impact: citationImpact,
      collaboration_network: collaborationNetwork,
      publication_types: publicationTypes,
      venue_analysis: venueAnalysis,
      career_progression: careerProgression,
      researcher_comparison: researcherComparison,
    });
  } catch (error) {
    console.log("Error:", error);
    return handleApiError(error);
  }
}
