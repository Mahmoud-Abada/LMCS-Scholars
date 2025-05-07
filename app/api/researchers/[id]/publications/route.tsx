// app/api/researchers/[id]/publications/route.ts
import { db } from "@/db/client";
import { publicationAuthors, publications, researchers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // First verify the researcher exists
    const researcher = await db.query.researchers.findFirst({
      where: eq(researchers.id, params.id),
    });

    if (!researcher) {
      return NextResponse.json(
        { error: "Researcher not found" },
        { status: 404 }
      );
    }

    // Get all publications for this researcher
    const researcherPublications = await db
      .select({
        id: publications.id,
        title: publications.title,
        abstract: publications.abstract,
        authors: publications.authors,
        publicationType: publications.publicationType,
        publicationDate: publications.publicationDate,
        doi: publications.doi,
        url: publications.url,
        pdfUrl: publications.pdfUrl,
        scholarLink: publications.scholarLink,
        dblpLink: publications.dblpLink,
        citationCount: publications.citationCount,
        pages: publications.pages,
        volume: publications.volume,
        issue: publications.issue,
        publisher: publications.publisher,
        journal: publications.journal,
        language: publications.language,
        createdAt: publications.createdAt,
        updatedAt: publications.updatedAt,
      })
      .from(publicationAuthors)
      .innerJoin(
        publications,
        eq(publicationAuthors.publicationId, publications.id)
      )
      .where(eq(publicationAuthors.researcherId, params.id))
      .orderBy(publications.publicationDate);

    return NextResponse.json(researcherPublications);
  } catch (error) {
    console.error("Error fetching researcher publications:", error);
    return NextResponse.json(
      { error: "Failed to fetch researcher publications" },
      { status: 500 }
    );
  }
}