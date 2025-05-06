// api/researchers/seed/route.ts
import { NextResponse } from 'next/server';
import { seedResearchers } from '@/scripts/seed-researchers';
import { db } from '@/db/client';

export const dynamic = "force-dynamic";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Seeding disabled in production" },
      { status: 403 }
    );
  }

  try {
    // Check if researchers already exist
    const existingResearchers = await db.query.researchers.findMany({
      columns: { id: true },
      limit: 1
    });

    if (existingResearchers.length > 0) {
      return NextResponse.json(
        { 
          error: "Researchers already exist in database",
          suggestion: "Reset the database first if you want to reseed"
        },
        { status: 400 }
      );
    }

    console.log("🌱 Starting researcher seeding process...");
    const seedResults = await seedResearchers();

    if (!seedResults || !Array.isArray(seedResults)) {
      throw new Error("Seeding process did not return expected results");
    }

    const results = {
      totalResearchers: seedResults.length,
      seededResearchers: seedResults.filter(r => r.researcherId).length,
      skippedResearchers: seedResults.filter(r => !r.researcherId).length,
      errors: [] as string[],
      sampleAccounts: seedResults.slice(0, 5).map(r => ({
        name: r.name,
        email: r.email,
        password: r.password,
        orcidId: r.orcidId
      }))
    };

    // Log summary
    console.log(`
      🎉 Researcher seeding completed:
      - Total processed: ${results.totalResearchers}
      - Successfully seeded: ${results.seededResearchers}
      - Skipped: ${results.skippedResearchers}
      ${results.errors.length > 0 ? `- Errors: ${results.errors.length}` : ''}
    `);

    return NextResponse.json({
      success: true,
      ...results,
      summary: {
        successRate: `${Math.round((results.seededResearchers / results.totalResearchers) * 100)}%`,
        sampleAccountsNote: "First 5 accounts shown (passwords only for development)"
      }
    });

  } catch (error) {
    console.error("🚨 Researcher seeding failed:", error);
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
    console.log("🏁 Researcher seeding process completed");
  }
}