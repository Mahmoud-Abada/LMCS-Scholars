// src/app/api/admin/researchers/route.ts
import { db } from "@/db/client";
import { researchers, users } from "@/db/schema";
import { hashPassword } from "@/lib/utils/auth";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  researcherId: z.string().optional(),
  role: z.enum(["admin", "director", "researcher", "assistant"]),
});

export async function POST(req: Request) {
  try {
    // await requireAdmin();

    const body = await req.json();
    const data = schema.parse(body);

    // Check if user exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, data.email),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Create researcher first if ID provided
    let researcherId = data.researcherId;
    if (!researcherId) {
      const [newResearcher] = await db
        .insert(researchers)
        .values({
          fullName: data.name,
          email: data.email,
          qualification: "researcher",
          id: crypto.randomUUID(),
          team: "default",
        })
        .returning({ id: researchers.id });
      researcherId = newResearcher.id;
    }

    // Create user
    const [user] = await db
      .insert(users)
      .values({
        id: crypto.randomUUID(),
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role,
        researcherId,
      })
      .returning();

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create researcher" + error },
      { status: 500 }
    );
  }
}
