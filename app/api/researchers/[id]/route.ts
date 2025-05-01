// app/api/researchers/[id]/route.ts
import { db } from "@/db/client";
import { researchers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const researcher = await db.query.researchers.findFirst({
      where: eq(researchers.id, params.id),
      with: {
        publications: {
          columns: {
            id: true,
            title: true,
            publicationDate: true,
            citationCount: true,
          },
          orderBy: (publications, { desc }) => [desc(publications.publicationDate)],
          limit: 10,
        },
      },
    });

    if (!researcher) {
      return NextResponse.json({ error: "Researcher not found" }, { status: 404 });
    }

    return NextResponse.json(researcher);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch researcher" },
      { status: 500 }
    );
  }
}