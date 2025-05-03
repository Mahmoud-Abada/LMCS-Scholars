// src/app/api/publications/stats/route.ts
import { db } from "@/db/client";
import {
  externalAuthors,
  publicationAuthors,
  publicationExternalAuthors,
  publications,
  researchers,
} from "@/db/schema";
import { handleApiError } from "@/lib/api-utils";
import { and, count, eq, gte, lte, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. Nombre total de publications
    const totalPublications = await db
      .select({ count: count() })
      .from(publications);

    // 2. Nombre total de citations
    const totalCitations = await db
      .select({ total: sql<number>`sum(${publications.citationCount})` })
      .from(publications);

    // 3. Nombre moyen de citations par publication
    const averageCitations = await db
      .select({ avg: sql<number>`avg(${publications.citationCount})` })
      .from(publications);

    // 4. Répartition par type de publication
    const publicationTypes = await db
      .select({
        type: publications.publicationType,
        count: count(),
      })
      .from(publications)
      .groupBy(publications.publicationType);

    // 5. Nombre d'auteurs uniques (internes + externes)
    // Auteurs internes
    const internalAuthorsCount = await db
      .select({ count: count(researchers.id, { distinct: true }) })
      .from(publicationAuthors)
      .innerJoin(researchers, eq(publicationAuthors.researcherId, researchers.id));

    // Auteurs externes
    const externalAuthorsCount = await db
      .select({ count: count(externalAuthors.id, { distinct: true }) })
      .from(publicationExternalAuthors)
      .innerJoin(
        externalAuthors,
        eq(publicationExternalAuthors.authorId, externalAuthors.id)
      );

    // 6. Tendances annuelles (publications et citations par année)
    const yearlyTrends = await db
      .select({
        year: sql<number>`EXTRACT(YEAR FROM ${publications.publicationDate})`,
        publicationCount: count(),
        totalCitations: sql<number>`sum(${publications.citationCount})`,
      })
      .from(publications)
      .where(publications.publicationDate.isNotNull())
      .groupBy(sql`EXTRACT(YEAR FROM ${publications.publicationDate})`)
      .orderBy(sql`EXTRACT(YEAR FROM ${publications.publicationDate})`);

    // 7. Top 5 des publications les plus citées
    const topCitedPublications = await db
      .select({
        id: publications.id,
        title: publications.title,
        citationCount: publications.citationCount,
        publicationDate: publications.publicationDate,
      })
      .from(publications)
      .orderBy(desc(publications.citationCount))
      .limit(5);

    return NextResponse.json({
      success: true,
      data: {
        totalPublications: totalPublications[0]?.count || 0,
        totalCitations: totalCitations[0]?.total || 0,
        averageCitations: averageCitations[0]?.avg
          ? Math.round(averageCitations[0].avg * 10) / 10
          : 0,
        uniqueAuthors:
          (internalAuthorsCount[0]?.count || 0) +
          (externalAuthorsCount[0]?.count || 0),
        publicationTypes: publicationTypes.map((pt) => ({
          name: pt.type || "unknown",
          value: pt.count,
        })),
        yearlyTrends: yearlyTrends.map((yt) => ({
          year: yt.year,
          publications: yt.publicationCount,
          citations: yt.totalCitations || 0,
        })),
        topCitedPublications: topCitedPublications.map((pub) => ({
          id: pub.id,
          title: pub.title,
          citations: pub.citationCount || 0,
          year: pub.publicationDate
            ? new Date(pub.publicationDate).getFullYear()
            : null,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching global publication stats:", error);
    return handleApiError(error);
  }
}