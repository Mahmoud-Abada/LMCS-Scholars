// app/api/researchers/[id]/modify/route.ts

//   const user = session?.user;


// app/api/researchers/[id]/modify/route.ts
import { db } from "@/db/client";
import { researchers } from "@/db/schema";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";

const researcherUpdateSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  phone: z.string().max(20).optional(),
  orcidId: z.string().optional(),
  biography: z.string().optional(),
  researchInterests: z.string().optional(),
  dblpUrl: z.string().url("Invalid URL").or(z.literal("")),
  googleScholarUrl: z.string().url("Invalid URL").or(z.literal("")),
  researchGateUrl: z.string().url("Invalid URL").or(z.literal("")),
  linkedinUrl: z.string().url("Invalid URL").or(z.literal("")),
  personalWebsite: z.string().url("Invalid URL").or(z.literal("")),
  position: z.enum([
    "director",
    "department_head",
    "principal_investigator",
    "senior_researcher",
    "researcher",
    "assistant"
  ]).optional(),
  qualification: z.enum([
    "professor",
    "associate_professor",
    "assistant_professor",
    "postdoc",
    "phd_candidate",
    "research_scientist"
  ]).optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get the session
      const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    const { id } = params;
    
    // Verify the researcher exists
    const existingResearcher = await db.query.researchers.findFirst({
      where: eq(researchers.id, id),
    });

    if (!existingResearcher) {
      return NextResponse.json(
        { error: "Researcher not found" },
        { status: 404 }
      );
    }

    // Check if the user is authorized to update this profile
    // Compare both ID and email for extra security
    const isAuthorized = (
      session.user.id === id || 
      session.user.email === existingResearcher.email ||
      session.user.role === "assistant"
    );

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "You can only update your own profile" },
        { status: 403 }
      );
    }

    // Parse and validate the request body
    const body = await request.json();
    const validatedData = researcherUpdateSchema.parse(body);

    // Update the researcher in the database
    const [updatedResearcher] = await db
      .update(researchers)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(researchers.id, id))
      .returning();

    if (!updatedResearcher) {
      return NextResponse.json(
        { error: "Failed to update researcher" },
        { status: 500 }
      );
    }

    // Return the updated researcher data
    return NextResponse.json(updatedResearcher, { status: 200 });

  } catch (error) {
    console.error("Error updating researcher:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const researcher = await db.query.researchers.findFirst({
      where: eq(researchers.id, params.id),
      with: {
        team: {
          columns: {
            name: true,
          },
        },
        user: {
          columns: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!researcher) {
      return NextResponse.json(
        { error: "Researcher not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(researcher);
  } catch (error) {
    console.error("Error fetching researcher:", error);
    return NextResponse.json(
      { error: "Failed to fetch researcher" },
      { status: 500 }
    );
  }
}