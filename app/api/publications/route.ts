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
  page: z.coerce.number().min(1).default(1).catch(1),
  pageSize: z.coerce
    .number()
    .min(1)
    .max(100)
    .default(DEFAULT_PAGE_SIZE)
    .catch(DEFAULT_PAGE_SIZE),
  search: z.string().optional().catch(undefined),
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
    .optional()
    .catch(undefined),
  yearFrom: z.coerce
    .number()
    .min(1900)
    .max(new Date().getFullYear())
    .optional()
    .catch(undefined),
  yearTo: z.coerce
    .number()
    .min(1900)
    .max(new Date().getFullYear())
    .optional()
    .catch(undefined),
  venueId: z.string().uuid().optional().catch(undefined),
  researcherId: z.string().uuid().optional().catch(undefined),
  teamId: z.string().uuid().optional().catch(undefined),
  classificationId: z.string().uuid().optional().catch(undefined),
  minCitations: z.coerce.number().min(0).optional().catch(undefined),
  sortBy: z
    .enum(["title", "citation_count", "publication_date", "created_at"])
    .default("publication_date")
    .catch("publication_date"),
  order: z.enum(["asc", "desc"]).default("desc").catch("desc"),
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

    const publicationsData = await db
      .select({
        publication_id: publications.id,
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
      })
      .from(publications)
      .where(and(...conditions))
      .orderBy(queryParams.order === "asc" ? asc(sortColumn) : desc(sortColumn))
      .limit(queryParams.pageSize)
      .offset(offset);

      console.log("Publications data:");

    // Fetch related data separately for each publication
    const enhancedData = await Promise.all(
      publicationsData.map(async (pub) => {
        // Internal authors
        const authors = await db
          .select({
            id: researchers.id,
            firstName: researchers.firstName,
            lastName: researchers.lastName,
            teamName: researchTeams.name,
          })
          .from(publicationAuthors)
          .innerJoin(
            researchers,
            eq(publicationAuthors.researcherId, researchers.id)
          )
          .leftJoin(researchTeams, eq(researchers.teamId, researchTeams.id))
          .where(eq(publicationAuthors.publicationId, pub.publication_id));

        // External authors
        const extAuthors = await db
          .select({
            id: externalAuthors.id,
            fullName: externalAuthors.fullName,
            affiliation: externalAuthors.affiliation,
          })
          .from(publicationExternalAuthors)
          .innerJoin(
            externalAuthors,
            eq(publicationExternalAuthors.authorId, externalAuthors.id)
          )
          .where(
            eq(publicationExternalAuthors.publicationId, pub.publication_id)
          );

        // Venues
        const vens = await db
          .select({
            id: venues.id,
            name: venues.name,
            type: venues.type,
            pages: publicationVenues.pages,
            volume: publicationVenues.volume,
            issue: publicationVenues.issue,
          })
          .from(publicationVenues)
          .innerJoin(venues, eq(publicationVenues.venueId, venues.id))
          .where(eq(publicationVenues.publicationId, pub.publication_id));

        // Classifications
        const classifications = await db
          .select({
            system_id: classificationSystems.id,
            system_name: classificationSystems.name,
            category: publicationClassifications.category,
            year: publicationClassifications.year,
          })
          .from(publicationClassifications)
          .innerJoin(
            classificationSystems,
            eq(publicationClassifications.systemId, classificationSystems.id)
          )
          .where(
            eq(publicationClassifications.publicationId, pub.publication_id)
          );

        return {
          ...pub,
          authors: authors.map((a) => ({
            id: a.id,
            name: `${a.firstName} ${a.lastName}`,
            affiliation: a.teamName,
            is_external: false,
          })),
          external_authors: extAuthors.map((ea) => ({
            id: ea.id,
            name: ea.fullName,
            affiliation: ea.affiliation,
            is_external: true,
          })),
          venues: vens.map((v) => ({
            id: v.id,
            name: v.name,
            type: v.type,
            pages: v.pages,
            volume: v.volume,
            issue: v.issue,
          })),
          classifications: classifications.map((c) => ({
            system_id: c.system_id,
            system_name: c.system_name,
            category: c.category,
            year: c.year,
          })),
        };
      })
    );
    console.log("Enhanced data:");

    // Get total count for pagination
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(publications)
      .where(and(...conditions));

    const totalCount = totalCountResult[0].count;
    const totalPages = Math.ceil(totalCount / queryParams.pageSize);

    return NextResponse.json({
      data: enhancedData,
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

export async function POST(request: Request) {
  try {
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
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
