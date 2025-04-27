// src/app/api/researchers/route.ts
import { db } from "@/db/client";
import { researchers } from "@/db/schema";
import {
  DEFAULT_PAGE_SIZE,
  authorizeRequest,
  handleApiError,
} from "@/lib/api-utils";
import { and, asc, desc, eq, like, or, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { queryParamsSchema, researcherSchema } from "../../../types/schemas";
import { auth } from "../../../auth";
import { UserRole } from "../../../types/auth";
import { ResearchDataScraper } from '@/scripts/scrape';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const queryParams = queryParamsSchema.parse({
      page: Number(searchParams.get("page")) || 1,
      pageSize: Number(searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE,
      search: searchParams.get("search"),
      status: searchParams.get("status") as
        | "active"
        | "on_leave"
        | "inactive"
        | "retired"
        | undefined,
      teamId: searchParams.get("teamId"),
      sortBy: searchParams.get("sortBy") || "name",
      order: searchParams.get("order") || "asc",
    });

    const offset = (queryParams.page - 1) * queryParams.pageSize;

    // Base query
    const baseQuery = db.select().from(researchers);

    // Build conditions array
    const conditions = [];

    // Apply filters
    if (queryParams.search) {
      const searchTerm = `%${queryParams.search}%`;
      conditions.push(
        or(
          like(researchers.firstName, searchTerm),
          like(researchers.lastName, searchTerm),
          like(researchers.email, searchTerm)
        )
      );
    }

    if (queryParams.status) {
      conditions.push(eq(researchers.status, queryParams.status));
    }

    if (queryParams.teamId) {
      conditions.push(eq(researchers.teamId, queryParams.teamId));
    }

    // Apply sorting
    const sortColumn = {
      name: sql`concat(${researchers.lastName}, ' ', ${researchers.firstName})`,
      hIndex: researchers.hIndex,
      citations: researchers.citations,
      joinDate: researchers.joinDate,
    }[queryParams.sortBy];

    // Get paginated results with all conditions applied
    const researchersData = await baseQuery
      .where(and(...conditions))
      .orderBy(queryParams.order === "asc" ? asc(sortColumn) : desc(sortColumn))
      .limit(queryParams.pageSize)
      .offset(offset);

    // Get total count for pagination
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(researchers);

    const totalCount = totalCountResult[0].count;
    const totalPages = Math.ceil(totalCount / queryParams.pageSize);

    return NextResponse.json({
      data: researchersData,
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
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!authorizeRequest(session.user.role as UserRole, "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = researcherSchema.parse(body);

    const existingResearcher = await db
      .select()
      .from(researchers)
      .where(eq(researchers.email, validatedData.email))
      .limit(1);

    if (existingResearcher.length > 0) {
      return NextResponse.json(
        { error: "Researcher with this email already exists" },
        { status: 409 }
      );
    }

    const [newResearcher] = await db
      .insert(researchers)
      .values({
        ...validatedData,
        joinDate: validatedData.joinDate
          ? new Date(validatedData.joinDate).toISOString()
          : undefined,
        leaveDate: validatedData.leaveDate
          ? new Date(validatedData.leaveDate).toISOString()
          : undefined,
      })
      .returning();

    // Automatically scrape publications for the new researcher
    const scraper = new ResearchDataScraper();
    scraper.scrapeResearcherPublications(validatedData.firstName + ' ' + validatedData.lastName)
      .then(async (scrapedPublications) => {
        for (const publication of scrapedPublications) {
          await db.insert(publication).values(publication);
        }
      })
      .catch((error) => {
        console.error('Error scraping publications for new researcher:', error);
      });

    return NextResponse.json(newResearcher, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

