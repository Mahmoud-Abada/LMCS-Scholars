import { ResearchDataScraper } from "@/scripts/scraper";
import { seedPublications } from "@/scripts/seed-publications";
import { eq, like } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "../../../db/client";
import { publications, researchers } from "../../../db/schema";

export const dynamic = "force-dynamic";

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
  } catch (error) {
    console.error("Error fetching publications:", error);
    return NextResponse.json({ error: "Failed to fetch publications" }, { status: 500 });
  }
}
