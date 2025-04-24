// src/app/api/admin/users/route.ts
import { auth } from "@/auth";
import { db } from "@/db/client";
import { researchers, users } from "@/db/schema";
import {
  DEFAULT_PAGE_SIZE,
  handleApiError,
  MAX_PAGE_SIZE,
} from "@/lib/api-utils";
import { asc, eq, like, or, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { UserRole } from "../../../../types/auth";

const queryParamsSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z
    .number()
    .int()
    .positive()
    .max(MAX_PAGE_SIZE)
    .default(DEFAULT_PAGE_SIZE),
  search: z.string().optional(),
  role: z
    .enum(["admin", "director", "researcher", "assistant", "guest"])
    .optional(),
  active: z.boolean().optional(),
});

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (
      !session?.user ||
      !["assistant", "admin", "director"].includes(session.user.role)
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryParams = queryParamsSchema.parse({
      page: Number(searchParams.get("page")) || 1,
      pageSize: Number(searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE,
      search: searchParams.get("search"),
      role: searchParams.get("role") as UserRole,
      active: searchParams.get("active")
        ? searchParams.get("active") === "true"
        : undefined,
    });

    const offset = (queryParams.page - 1) * queryParams.pageSize;

    const baseQuery = db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        isActive: users.isActive,
        lastLogin: users.lastLogin,
        createdAt: users.createdAt,
        researcher: {
          id: researchers.id,
          firstName: researchers.firstName,
          lastName: researchers.lastName,
        },
      })
      .from(users)
      .leftJoin(researchers, eq(users.researcherId, researchers.id));

    // Apply filters
    if (queryParams.search) {
      const searchTerm = `%${queryParams.search}%`;
      baseQuery.where(
        or(
          like(users.name, searchTerm),
          like(users.email, searchTerm),
          like(researchers.firstName, searchTerm),
          like(researchers.lastName, searchTerm)
        )
      );
    }

    if (queryParams.role) {
      baseQuery.where(eq(users.role, queryParams.role));
    }

    if (queryParams.active !== undefined) {
      baseQuery.where(eq(users.isActive, queryParams.active));
    }

    const query = db.$with("query").as(baseQuery);

    // Get paginated results
    const usersData = await db
      .select()
      .from(query)
      .limit(queryParams.pageSize)
      .offset(offset)
      .orderBy(asc(users.createdAt));

    // Get total count
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);
    const totalCount = totalCountResult[0].count;

    return NextResponse.json({
      data: usersData,
      pagination: {
        page: queryParams.page,
        pageSize: queryParams.pageSize,
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / queryParams.pageSize),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

const userCreateSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(255),
  role: z.enum(["admin", "director", "researcher", "assistant", "guest"]),
  researcherId: z.string().uuid().optional().nullable(),
  sendInvite: z.boolean().default(true),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (
      !session?.user ||
      !["director", "admin", "assistant"].includes(session.user.role)
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const userData = userCreateSchema.parse(body);

    // Check if email exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, userData.email))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Check researcher association if provided
    if (userData.researcherId) {
      const researcher = await db
        .select()
        .from(researchers)
        .where(eq(researchers.id, userData.researcherId))
        .limit(1);

      if (researcher.length === 0) {
        return NextResponse.json(
          { error: "Researcher not found" },
          { status: 404 }
        );
      }

      // Check if researcher already has an account
      const researcherUser = await db
        .select()
        .from(users)
        .where(eq(users.researcherId, userData.researcherId))
        .limit(1);

      if (researcherUser.length > 0) {
        return NextResponse.json(
          { error: "Researcher already has an associated account" },
          { status: 409 }
        );
      }
    }

    // Create user (without password to force invite flow)
    const [newUser] = await db
      .insert(users)
      .values({
        ...userData,
        isActive: true,
      })
      .returning();

    // In production: Add logic to send invitation email if sendInvite is true

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
