// app/api/researchers/[id]/route.ts
import { db } from "@/db/client";
import {
  publicationAuthors,
  publications,
  researchers,
  researchTeams,
  users,
} from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "../../../../auth";

const researcherSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  orcidId: z.string().max(19).optional(),
  phone: z.string().max(20).optional(),
  status: z.enum(["active", "on_leave", "inactive", "retired"]),
  qualification: z
    .enum([
      "professor",
      "associate_professor",
      "assistant_professor",
      "postdoc",
      "phd_candidate",
      "research_scientist",
    ])
    .optional(),
  position: z
    .enum([
      "director",
      "department_head",
      "principal_investigator",
      "senior_researcher",
      "researcher",
      "assistant",
    ])
    .optional(),
  teamId: z.string().uuid().optional(),
  joinDate: z.string().optional(),
  leaveDate: z.string().optional(),
  biography: z.string().optional(),
  researchInterests: z.string().optional(),
  dblpUrl: z.string().url().optional(),
  googleScholarUrl: z.string().url().optional(),
  researchGateUrl: z.string().url().optional(),
  linkedinUrl: z.string().url().optional(),
  personalWebsite: z.string().url().optional(),
});

export async function GET(
  request: NextRequest,
  context: Promise<{ params: { id: string } }>
) {
  const { params } = await context;
  const researcherId = params.id;
  try {
    // 1. First get basic researcher info
    const researcher = await db.query.researchers.findFirst({
      where: eq(researchers.id, researcherId),
      columns: {
        id: true,
        orcidId: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        status: true,
        qualification: true,
        position: true,
        hIndex: true,
        i10Index: true,
        citations: true,
        teamId: true,
        joinDate: true,
        leaveDate: true,
        biography: true,
        researchInterests: true,
        dblpUrl: true,
        googleScholarUrl: true,
        researchGateUrl: true,
        linkedinUrl: true,
        personalWebsite: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!researcher) {
      return NextResponse.json(
        { error: "Researcher not found" },
        { status: 404 }
      );
    }

    // 2. Get team info separately if teamId exists
    let team = null;
    if (researcher.teamId) {
      team = await db.query.researchTeams.findFirst({
        where: eq(researchTeams.id, researcher.teamId),
        columns: {
          id: true,
          name: true,
          description: true,
          establishedDate: true,
          websiteUrl: true,
        },
      });
    }

    // 3. Get user info separately
    const user = await db.query.users.findFirst({
      where: eq(users.researcherId, researcherId),
      columns: {
        id: true,
        email: true,
        role: true,
        lastLogin: true,
        isActive: true,
      },
    });

    // 4. Get publications separately
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
      })
      .from(publicationAuthors)
      .innerJoin(
        publications,
        eq(publicationAuthors.publicationId, publications.id)
      )
      .where(eq(publicationAuthors.researcherId, researcherId))
      .orderBy(desc(publications.publicationDate))
      .limit(10);

    // 5. Get metrics separately
    const metrics = await db
      .select({
        totalPublications: sql<number>`count(${publications.id})`,
        totalCitations: sql<number>`sum(${publications.citationCount})`,
        hIndex: sql<number>`max(${researchers.hIndex})`,
        i10Index: sql<number>`max(${researchers.i10Index})`,
      })
      .from(researchers)
      .leftJoin(
        publicationAuthors,
        eq(publicationAuthors.researcherId, researchers.id)
      )
      .leftJoin(
        publications,
        eq(publicationAuthors.publicationId, publications.id)
      )
      .where(eq(researchers.id, researcherId))
      .groupBy(researchers.id);

    return NextResponse.json({
      ...researcher,
      team,
      user,
      publications: researcherPublications,
      metrics: metrics[0] || {
        totalPublications: 0,
        totalCitations: 0,
        hIndex: 0,
        i10Index: 0,
      },
    });
  } catch (error) {
    console.error("Error fetching researcher:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { error: "Failed to fetch researcher", details: errorMessage },
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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check permissions (admin or the researcher themselves)
  const isAdmin = session.user.role === "admin";
  const isResearcher = session.user.researcherId === params.id;

  if (!isAdmin && !isResearcher) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validatedData = researcherSchema.parse(body);

    // Update researcher
    const [updatedResearcher] = await db
      .update(researchers)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(researchers.id, params.id))
      .returning();

    // If email changed, update the associated user
    if (validatedData.email && isAdmin) {
      await db
        .update(users)
        .set({
          email: validatedData.email,
          updatedAt: new Date(),
        })
        .where(eq(users.researcherId, params.id));
    }

    return NextResponse.json(updatedResearcher);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Failed to update researcher", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error updating researcher:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { error: "Failed to update researcher", details: errorMessage },
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
  
  // Only admins can delete researchers
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    // First get the associated user ID
    const user = await db.query.users.findFirst({
      where: eq(users.researcherId, params.id),
      columns: { id: true }
    });

    // Delete researcher (will cascade to publications_authors)
    await db
      .delete(researchers)
      .where(eq(researchers.id, params.id));

    // Delete associated user if exists
    if (user) {
      await db
        .delete(users)
        .where(eq(users.id, user.id));
    }

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete researcher", details: error.message },
      { status: 500 }
    );
  }
}*/
