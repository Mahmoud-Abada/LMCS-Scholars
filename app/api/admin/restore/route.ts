/*// src/app/api/admin/restore/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db/client';
import { sql } from 'drizzle-orm';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';

const restoreSchema = z.object({
  backupFile: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'director') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { backupFile } = restoreSchema.parse(body);

    const backupPath = path.join(process.cwd(), 'backups', backupFile);
    if (!fs.existsSync(backupPath)) {
      return NextResponse.json(
        { error: 'Backup file not found' },
        { status: 404 }
      );
    }

    // In production: Use your database's native restore tools
    // This is a simplified example for PostgreSQL
    await db.execute(sql`pg_restore --clean --dbname=${process.env.DATABASE_URL} ${backupPath}`);

    return NextResponse.json({
      message: 'Database restored successfully',
      backupFile,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Restore failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}*/