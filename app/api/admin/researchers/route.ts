// api/admin/researchers/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { eq } from 'drizzle-orm';
import { researchers, users } from '@/db/schema';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const schema = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['admin', 'director', 'researcher', 'assistant', 'guest']),
  researcherData: z.object({
    firstName: z.string(),
    lastName: z.string(),
    phone: z.string().optional(),
    status: z.enum(['active', 'on_leave', 'inactive', 'retired']),
    qualification: z.string().optional(),
    position: z.string().optional(),
    hIndex: z.number().optional(),
    i10Index: z.number().optional(),
    citations: z.number().optional(),
    teamId: z.string().optional(),
    orcidId: z.string().optional(),
    joinDate: z.string().optional(),
    leaveDate: z.string().optional(),
    biography: z.string().optional(),
    researchInterests: z.string().optional(),
    dblpUrl: z.string().optional(),
    googleScholarUrl: z.string().optional(),
    researchGateUrl: z.string().optional(),
    linkedinUrl: z.string().optional(),
    personalWebsite: z.string().optional(),
  }),
});

async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

export async function POST(req: Request) {
  try {
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

    // Create researcher
    const [newResearcher] = await db
      .insert(researchers)
      .values({
        id: crypto.randomUUID(),
        firstName: data.researcherData.firstName,
        lastName: data.researcherData.lastName,
        email: data.email,
        phone: data.researcherData.phone || null,
        status: data.researcherData.status,
        qualification: data.researcherData.qualification || null,
        position: data.researcherData.position || null,
        hIndex: data.researcherData.hIndex || 0,
        i10Index: data.researcherData.i10Index || 0,
        citations: data.researcherData.citations || 0,
        teamId: data.researcherData.teamId || null,
        orcidId: data.researcherData.orcidId || null,
        joinDate: data.researcherData.joinDate || null,
        leaveDate: data.researcherData.leaveDate || null,
        biography: data.researcherData.biography || null,
        researchInterests: data.researcherData.researchInterests || null,
        dblpUrl: data.researcherData.dblpUrl || null,
        googleScholarUrl: data.researcherData.googleScholarUrl || null,
        researchGateUrl: data.researcherData.researchGateUrl || null,
        linkedinUrl: data.researcherData.linkedinUrl || null,
        personalWebsite: data.researcherData.personalWebsite || null
      })
      .returning({ 
        id: researchers.id,
        firstName: researchers.firstName,
        lastName: researchers.lastName,
        email: researchers.email,
        googleScholarUrl: researchers.googleScholarUrl
      });

    // Create user
    const [user] = await db
      .insert(users)
      .values({
        id: crypto.randomUUID(),
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role,
        researcherId: newResearcher.id,
      })
      .returning();

    return NextResponse.json({
      success: true,
      user,
      researcher: newResearcher
    });

  } catch (error) {
    console.error("Error creating researcher:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to create researcher",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}