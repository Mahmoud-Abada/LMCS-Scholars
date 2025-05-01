// src/app/api/auth/reset-password/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { handleApiError } from '@/lib/api-utils';

const resetPasswordSchema = z.object({
  email: z.string().email(),
  newPassword: z.string().min(8),
});

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { email, newPassword } = resetPasswordSchema.parse(body);

    // Find user by email
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, user.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}