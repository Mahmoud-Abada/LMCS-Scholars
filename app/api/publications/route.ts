<<<<<<< HEAD
// app/api/publications/route.ts
import { db } from '@/db/client';
import { publications } from '@/db/schema';
import { NextResponse } from 'next/server';
import { asc, desc, sql } from 'drizzle-orm';
=======
import { ResearchDataScraper } from "@/scripts/scraper";
import { seedPublications } from "@/scripts/seed-publications";
import { eq, like } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "../../../db/client";
import { publications, researchers } from "../../../db/schema";

export const dynamic = "force-dynamic";
>>>>>>> 3e8a11d318dd61fc5f999e01155c2a47289f00c6

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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Extract query parameters
    const researcherName = searchParams.get("researcherName");

    if (!researcherName) {
      return NextResponse.json({ error: "Researcher name is required" }, { status: 400 });
    }

    // Query the database for publications by researcher name
    const publicationsData = await db
      .select()
      .from(publications)
      .where(like(publications.authors, `%${researcherName}%`));

    return NextResponse.json({ data: publicationsData }, { status: 200 });
>>>>>>> 3e8a11d318dd61fc5f999e01155c2a47289f00c6
  } catch (error) {
    console.error("Error fetching publications:", error);
    return NextResponse.json({ error: "Failed to fetch publications" }, { status: 500 });
  }
}
