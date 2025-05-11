// src/app/api/researchers/[id]/stats/route.ts
import { db } from "@/db/client";
import {
  classificationSystems,
  publicationAuthors,
  publicationClassifications,
  publications,
  publicationVenues,
  researchers,
  venues,
} from "@/db/schema";
import { handleApiError } from "@/lib/api-utils";
import {
  and,
  avg,
  count,
  countDistinct,
  eq,
  isNotNull,
  sql,
  sum,
} from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verify researcher exists
    const researcherExists = await db
      .select({ count: count() })
      .from(researchers)
      .where(eq(researchers.id, params.id));

    if (researcherExists[0].count === 0) {
      return NextResponse.json(
        { error: "Researcher not found" },
        { status: 404 }
      );
    }

    // Basic stats
    const basicStats = await db
      .select({
        hIndex: researchers.hIndex,
        i10Index: researchers.i10Index,
        citations: researchers.citations,
        publicationCount: count(publications.id),
      })
      .from(researchers)
      .leftJoin(
        publicationAuthors,
        eq(publicationAuthors.researcherId, researchers.id)
      )
      .leftJoin(
        publications,
        eq(publications.id, publicationAuthors.publicationId)
      )
      .where(eq(researchers.id, params.id))
      .groupBy(
        researchers.id,
        researchers.hIndex,
        researchers.i10Index,
        researchers.citations
      );

    // Publication types distribution
    const publicationTypes = await db
      .select({
        type: publications.publicationType,
        count: count(),
      })
      .from(publicationAuthors)
      .innerJoin(
        publications,
        eq(publications.id, publicationAuthors.publicationId)
      )
      .where(eq(publicationAuthors.researcherId, params.id))
      .groupBy(publications.publicationType);

    // Venue quality stats
    const venueStats = await db
      .select({
        avgSjrIndicator: avg(venues.sjrIndicator),
        openAccessCount: count(
          and(
            eq(publicationAuthors.researcherId, params.id),
            eq(venues.isOpenAccess, true)
          )
        ),
      })
      .from(publicationAuthors)
      .innerJoin(
        publications,
        eq(publications.id, publicationAuthors.publicationId)
      )
      .innerJoin(
        publicationVenues,
        eq(publicationVenues.publicationId, publications.id)
      )
      .innerJoin(venues, eq(venues.id, publicationVenues.venueId))
      .where(eq(publicationAuthors.researcherId, params.id));

    // Classification stats
    const classificationStats = await db
      .select({
        system: classificationSystems.name,
        category: publicationClassifications.category,
        count: count(),
      })
      .from(publicationAuthors)
      .innerJoin(
        publications,
        eq(publications.id, publicationAuthors.publicationId)
      )
      .innerJoin(
        publicationClassifications,
        eq(publicationClassifications.publicationId, publications.id)
      )
      .innerJoin(
        classificationSystems,
        eq(classificationSystems.id, publicationClassifications.systemId)
      )
      .where(eq(publicationAuthors.researcherId, params.id))
      .groupBy(classificationSystems.name, publicationClassifications.category);

    // Collaboration stats
    const collaborationStats = await db
      .select({
        totalCoauthors: countDistinct(publicationAuthors.researcherId),
        avgCoauthorsPerPaper: avg(
          db
            .select({ count: count() })
            .from(publicationAuthors)
            .where(eq(publicationAuthors.publicationId, publications.id))
        ),
      })
      .from(publicationAuthors)
      .innerJoin(
        publications,
        eq(publications.id, publicationAuthors.publicationId)
      )
      .where(eq(publicationAuthors.researcherId, params.id));

    // Yearly stats
    const yearlyStats = await db
      .select({
        year: sql<number>`EXTRACT(YEAR FROM ${publications.publicationDate})`,
        publicationCount: count(),
        citationCount: sum(publications.citationCount),
      })
      .from(publicationAuthors)
      .innerJoin(
        publications,
        eq(publications.id, publicationAuthors.publicationId)
      )
      .where(
        and(
          eq(publicationAuthors.researcherId, params.id),
          isNotNull(publications.publicationDate)
        )
      )
      .groupBy(sql`EXTRACT(YEAR FROM ${publications.publicationDate})`)
      .orderBy(sql`EXTRACT(YEAR FROM ${publications.publicationDate})`);

    return NextResponse.json({
      basicStats: basicStats[0],
      publicationTypes,
      venueStats: venueStats[0],
      classificationStats,
      collaborationStats: collaborationStats[0],
      yearlyStats,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
