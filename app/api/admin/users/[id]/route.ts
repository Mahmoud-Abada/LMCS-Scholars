// src/app/api/admin/users/[id]/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { researchers, users } from '@/db/schema';
import { and, eq, ne } from 'drizzle-orm';
import { z } from 'zod';
import { auth } from '@/auth';
import { handleApiError } from '@/lib/api-utils';

const userUpdateSchema = z.object({
  role: z.enum([ 'admin', 'director', 'researcher', 'assistant', 'guest']),
  isActive: z.boolean(),
  researcherId: z.string().uuid().optional().nullable(),
});

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user || !['admin', 'director', 'assistant'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const updateData = userUpdateSchema.parse(body);

    // Prevent modifying self
    if (params.id === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot modify your own role' },
        { status: 403 }
      );
    }

    // Check if target user exists
    const targetUser = await db
      .select()
      .from(users)
      .where(eq(users.id, params.id))
      .limit(1);

    if (targetUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check researcher association if provided
    if (updateData.researcherId) {
      const researcher = await db
        .select()
        .from(researchers)
        .where(eq(researchers.id, updateData.researcherId))
        .limit(1);

      if (researcher.length === 0) {
        return NextResponse.json(
          { error: 'Researcher not found' },
          { status: 404 }
        );
      }

      // Check if researcher already has another account
      const researcherUser = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.researcherId, updateData.researcherId),
            ne(users.id, params.id)
          )
        )
        .limit(1);

      if (researcherUser.length > 0) {
        return NextResponse.json(
          { error: 'Researcher already has an associated account' },
          { status: 409 }
        );
      }
    }

    // Update user
    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, params.id))
      .returning();

    return NextResponse.json(updatedUser);
  } catch (error) {
    return handleApiError(error);
  }
}