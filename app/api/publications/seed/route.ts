//api/publications/seed/route.ts
import { db } from "@/db/client";
import { ResearchDataScraper } from "@/scripts/scraper";
import { seedPublications } from "@/scripts/seed-publications";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Seeding disabled in production" },
      { status: 403 }
    );
  }

  let scraper: ResearchDataScraper | null = null;
  try {
    const allResearchers = await db.query.researchers.findMany({
      columns: {
        id: true,
        firstName: true,
        lastName: true,
        googleScholarUrl: true,
        dblpUrl: true,
      },
    });

    scraper = new ResearchDataScraper();
    const results = {
      totalResearchers: allResearchers.length,
      processedResearchers: 0,
      totalPublications: 0,
      totalVenues: 0,
      totalInternalAuthors: 0,
      totalExternalAuthors: 0,
      errors: [] as string[],
    };

    for (const researcher of allResearchers) {
      try {
        const fullName = `${researcher.firstName} ${researcher.lastName}`;
        console.log(`📚 Processing publications for ${fullName}`);

        const scrapedData = await scraper.scrapeResearcherPublications(
          fullName,
          researcher?.googleScholarUrl ?? undefined
        );

        if (!scrapedData?.length) {
          console.log(`⚠ No publications found for ${fullName}`);
          continue;
        }

        const seedResult = await seedPublications(scrapedData, researcher.id);

        results.processedResearchers++;
        results.totalPublications += seedResult.publications;
        results.totalVenues += seedResult.venues;
        results.totalInternalAuthors += seedResult.internalAuthors;
        results.totalExternalAuthors += seedResult.externalAuthors;

        console.log(
          `✅ Processed ${seedResult.publications} publications for ${fullName}`
        );
      } catch (error) {
        const errorMsg = `Error processing ${researcher.firstName} ${
          researcher.lastName
        }: ${error instanceof Error ? error.message : "Unknown error"}`;
        results.errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    return NextResponse.json({
      success: true,
      ...results,
      summary: {
        publicationsPerResearcher:
          results.processedResearchers > 0
            ? (
                results.totalPublications / results.processedResearchers
              ).toFixed(1)
            : 0,
        externalAuthorRatio:
          results.totalInternalAuthors + results.totalExternalAuthors > 0
            ? (
                (results.totalExternalAuthors /
                  (results.totalInternalAuthors +
                    results.totalExternalAuthors)) *
                100
              ).toFixed(1) + "%"
            : "0%",
      },
    });
  } catch (error) {
    console.error("🚨 Batch publication seeding failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        details:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.stack
            : undefined,
      },
      { status: 500 }
    );
  } finally {
    if (scraper) {
      await scraper.close();
    }
    console.log("🏁 Publication seeding completed");
  }
}
