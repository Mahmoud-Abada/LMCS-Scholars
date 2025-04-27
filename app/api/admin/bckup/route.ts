/*// src/app/api/admin/backup/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db/client';
import { sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { pipeline } from 'stream';

const pump = promisify(pipeline);

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'director' || 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create backup directory if it doesn't exist
    const backupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `backup-${timestamp}.sql`;
    const backupPath = path.join(backupDir, backupFileName);

    // In production: Use your database's native backup tools
    // This is a simplified example for PostgreSQL
    await db.execute(
      sql`COPY (SELECT * FROM pg_catalog.pg_tables) TO '${backupPath}'`
    );

    // For demo purposes - in reality you'd stream the backup
    return NextResponse.json({
      message: 'Backup initiated',
      filename: backupFileName,
      path: backupPath,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Backup failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}*/