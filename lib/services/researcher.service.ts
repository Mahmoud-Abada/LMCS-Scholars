// src/lib/services/researcher.service.ts
import { db } from '@/db/client';
import { researchers } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function getActiveResearchers() {
  return await db.query.researchers.findMany({
    where: eq(researchers.status, 'active'),
    columns: {
      id: true,
      fullName: true,
      googleScholarUrl: true,
      dblpUrl: true
    }
  });
}