// src/app/api/auth/update-profile/route.ts
import { auth } from '@/auth';
import { db } from '@/db/client';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, currentPassword, newPassword } = body;

    // Get current user data
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify current password if changing password
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'Current password is required' },
          { status: 400 }
        );
      }

      const isValid = await bcrypt.compare(currentPassword, user.password || '');
      if (!isValid) {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 401 }
        );
      }
    }

    // Prepare update data
    const updateData: { name?: string; password?: string } = { name };
    if (newPassword) {
      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    // Update user
    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, session.user.id))
      .returning();

    return NextResponse.json({
      success: true,
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email
      }
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}