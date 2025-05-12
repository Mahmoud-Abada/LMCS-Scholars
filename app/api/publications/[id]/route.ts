// src/app/api/publications/[id]/route.ts
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

// Updated schema with proper validation
const publicationSchema = z.object({
  title: z.string().min(1, "Title is required"),
  abstract: z.string().optional().nullable(),
  publicationType: z.enum([
    "journal_article",
    "conference_paper",
    "book_chapter",
    "patent",
    "technical_report",
    "thesis",
    "preprint"
  ]).optional().nullable(),
  publicationDate: z.string().optional().nullable(),
  doi: z.string()
    .optional()
    .nullable()
    .refine(val => !val || val.startsWith('10.'), {
      message: "DOI must start with '10.'"
    }),
  url: z.string()
    .url("Must be a valid URL")
    .or(z.literal(''))
    .optional()
    .nullable(),
  pdfUrl: z.string()
    .url("Must be a valid URL")
    .or(z.literal(''))
    .optional()
    .nullable(),
  scholarLink: z.string()
    .url("Must be a valid URL")
    .or(z.literal(''))
    .optional()
    .nullable(),
  dblpLink: z.string()
    .url("Must be a valid URL")
    .or(z.literal(''))
    .optional()
    .nullable(),
  pages: z.string().optional().nullable(),
  volume: z.string().optional().nullable(),
  issue: z.string().optional().nullable(),
  publisher: z.string().optional().nullable(),
  journal: z.string().optional().nullable(),
  language: z.string().optional().nullable(),
}).partial();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const publicationId = params.id;

  try {
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

    const externalAuthorsList = await db
      .select({
        id: externalAuthors.id,
        fullName: externalAuthors.fullName,
        affiliation: externalAuthors.affiliation
      })
      .from(publicationExternalAuthors)
      .innerJoin(externalAuthors, eq(publicationExternalAuthors.authorId, externalAuthors.id))
      .where(eq(publicationExternalAuthors.publicationId, publicationId));

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
  
  if (!session?.user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  if (session.user.role !== "assistant") {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    
    // Convert empty strings to null for all fields
    const cleanedBody = Object.fromEntries(
      Object.entries(body).map(([key, value]) => [
        key, 
        value === "" ? null : value
      ])
    );

    const validatedData = publicationSchema.parse(cleanedBody);

    const [updatedPublication] = await db
      .update(publications)
      .set({
        ...validatedData,
        updatedAt: new Date()
      })
      .where(eq(publications.id, params.id))
      .returning();

    if (!updatedPublication) {
      return NextResponse.json(
        { error: "Publication not found or failed to update" },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      data: updatedPublication,
      success: true 
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation errors:", error.errors);
      return NextResponse.json(
        { 
          error: "Validation failed",
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      );
    }
    
    console.error("Error updating publication:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: "Failed to update publication", details: errorMessage },
      { status: 500 }
    );
  }
}