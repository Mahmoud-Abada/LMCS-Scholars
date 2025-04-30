import { ResearchDataScraper } from "@/scripts/scraper";
import { seedPublications } from "@/scripts/seed-publications";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "../../../db/client";
import { researchers } from "../../../db/schema";

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
    const abortController = new AbortController();
    const scrapedData = await scraper.scrapeResearcherPublications(fullName, abortController.signal);

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
