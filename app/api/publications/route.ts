// src/app/api/publications/route.ts
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
import { DEFAULT_PAGE_SIZE, handleApiError } from "@/lib/api-utils";
import { and, asc, desc, eq, gte, like, lte, or, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ResearchDataScraper } from "../../../scripts/scraper";
import { seedPublications } from "../../../scripts/seed-publications";

export const dynamic = "force-dynamic";
// Input validation schemas
const queryParamsSchema = z.object({
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(DEFAULT_PAGE_SIZE),
  search: z.string().optional(),
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
  yearFrom: z.number().min(1900).max(new Date().getFullYear()).optional(),
  yearTo: z.number().min(1900).max(new Date().getFullYear()).optional(),
  venueId: z.string().uuid().optional(),
  researcherId: z.string().uuid().optional(),
  teamId: z.string().uuid().optional(),
  classificationId: z.string().uuid().optional(),
  minCitations: z.number().min(0).optional(),
  sortBy: z
    .enum(["title", "citation_count", "publication_date", "created_at"])
    .default("publication_date"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const queryParams = queryParamsSchema.parse({
      page: Number(searchParams.get("page")) || 1,
      pageSize: Number(searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE,
      search: searchParams.get("search"),
      publicationType: searchParams.get("publicationType"),
      yearFrom: searchParams.get("yearFrom")
        ? Number(searchParams.get("yearFrom"))
        : undefined,
      yearTo: searchParams.get("yearTo")
        ? Number(searchParams.get("yearTo"))
        : undefined,
      venueId: searchParams.get("venueId"),
      researcherId: searchParams.get("researcherId"),
      teamId: searchParams.get("teamId"),
      classificationId: searchParams.get("classificationId"),
      minCitations: searchParams.get("minCitations")
        ? Number(searchParams.get("minCitations"))
        : undefined,
      sortBy: searchParams.get("sortBy"),
      order: searchParams.get("order"),
    });

    const offset = (queryParams.page - 1) * queryParams.pageSize;

    // Build conditions array
    const conditions = [];

    // Apply filters
    if (queryParams.search) {
      const searchTerm = `%${queryParams.search}%`;
      conditions.push(
        or(
          like(publications.title, searchTerm),
          like(publications.abstract, searchTerm),
          like(publications.journal, searchTerm),
          like(publications.publisher, searchTerm)
        )
      );
    }

    if (queryParams.publicationType) {
      conditions.push(
        eq(publications.publicationType, queryParams.publicationType)
      );
    }

    if (queryParams.yearFrom) {
      conditions.push(
        gte(
          sql`EXTRACT(YEAR FROM ${publications.publicationDate})`,
          queryParams.yearFrom
        )
      );
    }

    if (queryParams.yearTo) {
      conditions.push(
        lte(
          sql`EXTRACT(YEAR FROM ${publications.publicationDate})`,
          queryParams.yearTo
        )
      );
    }

    if (queryParams.venueId) {
      conditions.push(sql`EXISTS (
        SELECT 1 FROM ${publicationVenues}
        WHERE ${publicationVenues.publicationId} = ${publications.id}
        AND ${publicationVenues.venueId} = ${queryParams.venueId}
      )`);
    }

    if (queryParams.researcherId) {
      conditions.push(sql`EXISTS (
        SELECT 1 FROM ${publicationAuthors}
        WHERE ${publicationAuthors.publicationId} = ${publications.id}
        AND ${publicationAuthors.researcherId} = ${queryParams.researcherId}
      )`);
    }

    if (queryParams.teamId) {
      conditions.push(sql`EXISTS (
        SELECT 1 FROM ${publicationAuthors}
        JOIN ${researchers} ON ${researchers.id} = ${publicationAuthors.researcherId}
        WHERE ${publicationAuthors.publicationId} = ${publications.id}
        AND ${researchers.teamId} = ${queryParams.teamId}
      )`);
    }

    if (queryParams.classificationId) {
      conditions.push(sql`EXISTS (
        SELECT 1 FROM ${publicationClassifications}
        WHERE ${publicationClassifications.publicationId} = ${publications.id}
        AND ${publicationClassifications.systemId} = ${queryParams.classificationId}
      )`);
    }

    if (queryParams.minCitations) {
      conditions.push(
        gte(publications.citationCount, queryParams.minCitations)
      );
    }

    // Apply sorting
    const sortColumn = {
      title: publications.title,
      citation_count: publications.citationCount,
      publication_date: publications.publicationDate,
      created_at: publications.createdAt,
    }[queryParams.sortBy];

    // Main query with all related data
    // Main query with all related data
    const publicationsData = await db
      .select({
        id: publications.id,
        title: publications.title,
        abstract: publications.abstract,
        publication_type: publications.publicationType,
        publication_date: publications.publicationDate,
        doi: publications.doi,
        url: publications.url,
        pdf_url: publications.pdfUrl,
        scholar_link: publications.scholarLink,
        dblp_link: publications.dblpLink,
        citation_count: publications.citationCount,
        pages: publications.pages,
        volume: publications.volume,
        issue: publications.issue,
        publisher: publications.publisher,
        journal: publications.journal,
        language: publications.language,
        citation_graph: publications.citationGraph,
        google_scholar_articles: publications.googleScholarArticles,
        created_at: publications.createdAt,
        updated_at: publications.updatedAt,
        authors: sql<
          Array<{
            id: string;
            name: string;
            affiliation?: string;
            is_external: boolean;
          }>
        >`(
    SELECT COALESCE(
      json_agg(
        json_build_object(
          'id', r.id,
          'name', CONCAT(r.first_name, ' ', r.last_name),
          'affiliation', t.name,
          'is_external', false
        )
      ),
      '[]'::json
    )
    FROM ${publicationAuthors} pa
    JOIN ${researchers} r ON pa.researcher_id = r.id
    LEFT JOIN ${researchTeams} t ON r.team_id = t.id
    WHERE pa.publication_id = ${publications.id}
  )`.as("authors"),
        external_authors: sql<
          Array<{
            id: string;
            name: string;
            affiliation?: string;
            is_external: boolean;
          }>
        >`(
    SELECT COALESCE(
      json_agg(
        json_build_object(
          'id', ea.id,
          'name', ea.full_name,
          'affiliation', ea.affiliation,
          'is_external', true
        )
      ),
      '[]'::json
    )
    FROM ${publicationExternalAuthors} pea
    JOIN ${externalAuthors} ea ON pea.author_id = ea.id
    WHERE pea.publication_id = ${publications.id}
  )`.as("external_authors"),
        venues: sql<
          Array<{
            id: string;
            name: string;
            type: string;
            pages?: string;
            volume?: string;
            issue?: string;
          }>
        >`(
    SELECT COALESCE(
      json_agg(
        json_build_object(
          'id', v.id,
          'name', v.name,
          'type', v.type,
          'pages', pv.pages,
          'volume', pv.volume,
          'issue', pv.issue
        )
      ),
      '[]'::json
    )
    FROM ${publicationVenues} pv
    JOIN ${venues} v ON pv.venue_id = v.id
    WHERE pv.publication_id = ${publications.id}
  )`.as("venues"),
        classifications: sql<
          Array<{
            system_id: string;
            system_name: string;
            category: string;
            year: number;
          }>
        >`(
    SELECT COALESCE(
      json_agg(
        json_build_object(
          'system_id', cs.id,
          'system_name', cs.name,
          'category', pc.category,
          'year', pc.year
        )
      ),
      '[]'::json
    )
    FROM ${publicationClassifications} pc
    JOIN ${classificationSystems} cs ON pc.system_id = cs.id
    WHERE pc.publication_id = ${publications.id}
  )`.as("classifications"),
      })
      .from(publications)
      .where(and(...conditions))
      .orderBy(queryParams.order === "asc" ? asc(sortColumn) : desc(sortColumn))
      .limit(queryParams.pageSize)
      .offset(offset);

    // Get total count for pagination
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(publications)
      .where(and(...conditions));

    const totalCount = totalCountResult[0].count;
    const totalPages = Math.ceil(totalCount / queryParams.pageSize);

    return NextResponse.json({
      data: publicationsData.map((pub) => ({
        ...pub,
        // Combine internal and external authors
        all_authors: [...pub.authors, ...pub.external_authors],
      })),
      pagination: {
        page: queryParams.page,
        pageSize: queryParams.pageSize,
        totalItems: totalCount,
        totalPages,
        hasNextPage: queryParams.page < totalPages,
        hasPreviousPage: queryParams.page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching publications:", error);
    return handleApiError(error);
  }
}

export async function GET(request: Request) {
  try {
<<<<<<< HEAD
    const { searchParams } = new URL(request.url);
    
    // Optional pagination parameters
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 20;
    const sort = searchParams.get('sort') || 'desc';
    
    // Query the database for all publications with pagination
    const publicationsData = await db
      .select()
      .from(publications)
      .orderBy(sort === 'asc' ? asc(publications.publicationDate) : desc(publications.publicationDate))
      .limit(10)
      .offset((page - 1) * limit);

    // Get total count for pagination
    const totalCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(publications);

    return NextResponse.json({ 
      data: publicationsData,
      pagination: {
        total: totalCount[0].count,
        page,
        limit,
        totalPages: Math.ceil(totalCount[0].count / limit)
      }
    }, { status: 200 });
=======
    const { researcherId } = await request.json();
    if (!researcherId) {
      return NextResponse.json(
        { error: "Researcher ID is required" },
        { status: 400 }
      );
    }

    // Get researcher info
    const researcher = await db.query.researchers.findFirst({
      where: eq(researchers.id, researcherId),
      columns: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!researcher) {
      return NextResponse.json(
        { error: "Researcher not found" },
        { status: 404 }
      );
    }

    // Scrape publications
    const scraper = new ResearchDataScraper();
    const fullName = `${researcher.firstName} ${researcher.lastName}`;
    const scrapedData = await scraper.scrapeResearcherPublications(fullName);

    if (!scrapedData?.length) {
      return NextResponse.json(
        { message: "No publications found for this researcher" },
        { status: 404 }
      );
    }

    // Seed publications
    const results = await seedPublications(scrapedData, researcher.id);

    return NextResponse.json({
      success: true,
      researcher: fullName,
      ...results,
    });
  } catch (error) {
    console.error("Publication seeding failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
