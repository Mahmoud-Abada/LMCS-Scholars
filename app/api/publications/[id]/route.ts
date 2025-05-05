// app/api/publications/[id]/route.ts
import { db } from "@/db/client";
import {
  publications,
  publicationAuthors,
  researchers,
  publicationVenues,
  venues,
  publicationClassifications,
  classificationSystems,
  publicationExternalAuthors,
  externalAuthors
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import type { NextRequest } from 'next/server';
import { z } from "zod";
import { auth } from "../../../../auth";

const publicationSchema = z.object({
  title: z.string().min(1),
  abstract: z.string().optional(),
  authors: z.array(z.string()).optional(),
  publicationType: z.enum([
    "journal_article",
    "conference_paper",
    "book_chapter",
    "patent",
    "technical_report",
    "thesis",
    "preprint"
  ]).optional(),
  publicationDate: z.string().optional(),
  doi: z.string().optional(),
  url: z.string().url().optional(),
  pdfUrl: z.string().url().optional(),
  scholarLink: z.string().url().optional(),
  dblpLink: z.string().url().optional(),
  pages: z.string().optional(),
  volume: z.string().optional(),
  issue: z.string().optional(),
  publisher: z.string().optional(),
  journal: z.string().optional(),
  language: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const publicationId = params.id;

  try {
    // 1. Get basic publication info
    const publication = await db.query.publications.findFirst({
      where: eq(publications.id, publicationId),
      columns: {
        id: true,
        title: true,
        abstract: true,
        authors: true,
        publicationType: true,
        publicationDate: true,
        doi: true,
        url: true,
        pdfUrl: true,
        scholarLink: true,
        dblpLink: true,
        citationCount: true,
        pages: true,
        volume: true,
        issue: true,
        publisher: true,
        journal: true,
        language: true,
        citationGraph: true,
        googleScholarArticles: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!publication) {
      return NextResponse.json(
        { error: "Publication not found" }, 
        { status: 404 }
      );
    }

    // 2. Get authors (researchers)
    const authors = await db
      .select({
        id: researchers.id,
        firstName: researchers.firstName,
        lastName: researchers.lastName,
        email: researchers.email,
        affiliationDuringWork: publicationAuthors.affiliationDuringWork
      })
      .from(publicationAuthors)
      .innerJoin(researchers, eq(publicationAuthors.researcherId, researchers.id))
      .where(eq(publicationAuthors.publicationId, publicationId));

    // 3. Get external authors
    const externalAuthorsList = await db
      .select({
        id: externalAuthors.id,
        fullName: externalAuthors.fullName,
        affiliation: externalAuthors.affiliation
      })
      .from(publicationExternalAuthors)
      .innerJoin(externalAuthors, eq(publicationExternalAuthors.authorId, externalAuthors.id))
      .where(eq(publicationExternalAuthors.publicationId, publicationId));

    // 4. Get venues
    const publicationVenuesList = await db
      .select({
        id: venues.id,
        name: venues.name,
        type: venues.type,
        publisher: venues.publisher,
        issn: venues.issn,
        eissn: venues.eissn,
        sjrIndicator: venues.sjrIndicator,
        isOpenAccess: venues.isOpenAccess,
        pages: publicationVenues.pages,
        volume: publicationVenues.volume,
        issue: publicationVenues.issue,
        eventDate: publicationVenues.eventDate
      })
      .from(publicationVenues)
      .innerJoin(venues, eq(publicationVenues.venueId, venues.id))
      .where(eq(publicationVenues.publicationId, publicationId));

    // 5. Get classifications
    const classifications = await db
      .select({
        systemId: classificationSystems.id,
        systemName: classificationSystems.name,
        category: publicationClassifications.category,
        year: publicationClassifications.year,
        evidenceUrl: publicationClassifications.evidenceUrl
      })
      .from(publicationClassifications)
      .innerJoin(classificationSystems, eq(publicationClassifications.systemId, classificationSystems.id))
      .where(eq(publicationClassifications.publicationId, publicationId));

    return NextResponse.json({
      ...publication,
      authors,
      externalAuthors: externalAuthorsList,
      venues: publicationVenuesList,
      classifications
    });
  } catch (error) {
    console.error("Error fetching publication:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: "Failed to fetch publication", details: errorMessage },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request, 
  { params }: { params: { id: string } }
) {
  const session = await auth();
  
  // Check authentication
  if (!session?.user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Only admins can update publications
  if (session.user.role !== "admin") {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const validatedData = publicationSchema.parse(body);

    // Update publication
    const [updatedPublication] = await db
      .update(publications)
      .set({
        ...validatedData,
        updatedAt: new Date()
      })
      .where(eq(publications.id, params.id))
      .returning();

    return NextResponse.json(updatedPublication);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Failed to update publication", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error updating publication:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: "Failed to update publication", details: errorMessage },
      { status: 400 }
    );
  }
}

/*
export async function DELETE(
  request: Request, 
  { params }: { params: { id: string } }
) {
  const session = await auth();
  
  // Only admins can delete publications
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    await db
      .delete(publications)
      .where(eq(publications.id, params.id));

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete publication", details: error.message },
      { status: 500 }
    );
  }
}*/