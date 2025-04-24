// src/app/api/researchers/[id]/route.ts
import { db } from "@/db/client";
import { researchers } from "@/db/schema";
import { authorizeRequest, handleApiError } from "@/lib/api-utils";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { researcherSchema } from "../../../../types/schemas";
import { UserRole } from "../../../../types/auth";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const researcher = await db
      .select()
      .from(researchers)
      .where(eq(researchers.id, params.id));

    if (researcher.length === 0) {
      return NextResponse.json(
        { error: "Researcher not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(researcher[0]);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Replace Clerk auth with:
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Replace user role check with:
    const isAdmin = authorizeRequest(session.user.role as UserRole, "admin");
    const isSelf = session.user.researcherId === params.id;

    if (!isAdmin && !isSelf) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = researcherSchema.parse(body);

    // Check if email is being changed to one that already exists
    if (validatedData.email) {
      const existingResearcher = await db
        .select()
        .from(researchers)
        .where(
          and(
            eq(researchers.email, validatedData.email),
            eq(researchers.id, params.id)
          )
        )
        .limit(1);

      if (existingResearcher.length > 0) {
        return NextResponse.json(
          { error: "Researcher with this email already exists" },
          { status: 409 }
        );
      }
    }

    // Update researcher
    const [updatedResearcher] = await db
      .update(researchers)
      .set({
        ...validatedData,
        joinDate: validatedData.joinDate
          ? new Date(validatedData.joinDate).toISOString()
          : undefined,
        leaveDate: validatedData.leaveDate
          ? new Date(validatedData.leaveDate).toISOString()
          : undefined,
        updatedAt: new Date(),
      })
      .where(eq(researchers.id, params.id))
      .returning();

    return NextResponse.json(updatedResearcher);
  } catch (error) {
    return handleApiError(error);
  }
}
