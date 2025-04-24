// src/app/api/analytics/collaborations/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { researchers, publicationAuthors } from '@/db/schema';
import { and, count, eq, ne, or, sql } from 'drizzle-orm';
import { z } from 'zod';
import { handleApiError } from '@/lib/api-utils';

const querySchema = z.object({
  researcherId: z.string().uuid().optional(),
  teamId: z.string().uuid().optional(),
  minCollaborations: z.coerce.number().min(1).default(3),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams.entries()));

    // Internal collaborations (within team)
    const internalCollab = await db
      .select({
        researcherId: researchers.id,
        firstName: researchers.firstName,
        lastName: researchers.lastName,
        collaborations: count(sql`DISTINCT ${publicationAuthors.publicationId}`),
      })
      .from(researchers)
      .innerJoin(
        publicationAuthors,
        eq(publicationAuthors.researcherId, researchers.id)
      )
      .innerJoin(
        sql`${publicationAuthors} as pa2`,
        eq(sql`pa2.publicationId`, publicationAuthors.publicationId)
      )
      .innerJoin(
        sql`${researchers} as r2`,
        and(
          eq(sql`r2.id`, sql`pa2.researcherId`),
          eq(sql`r2.teamId`, researchers.teamId),
          ne(sql`r2.id`, researchers.id)
        )
      )
      .where(
        and(
          query.researcherId
            ? eq(researchers.id, query.researcherId)
            : undefined,
          query.teamId
            ? eq(researchers.teamId, query.teamId)
            : undefined
        )
      )
      .groupBy(researchers.id)
      .having(
        sql`COUNT(DISTINCT ${publicationAuthors.publicationId}) >= ${query.minCollaborations}`
      )
      .orderBy(sql`collaborations DESC`);

    // External collaborations
    const externalCollab = await db
      .select({
        researcherId: researchers.id,
        firstName: researchers.firstName,
        lastName: researchers.lastName,
        externalCollaborations: count(sql`DISTINCT r2.id`),
        institutions: sql<string>`STRING_AGG(DISTINCT r2.teamId::text, ', ')`,
      })
      .from(researchers)
      .innerJoin(
        publicationAuthors,
        eq(publicationAuthors.researcherId, researchers.id)
      )
      .innerJoin(
        sql`${publicationAuthors} as pa2`,
        eq(sql`pa2.publicationId`, publicationAuthors.publicationId)
      )
      .innerJoin(
        sql`${researchers} as r2`,
        and(
          eq(sql`r2.id`, sql`pa2.researcherId`),
          ne(sql`r2.teamId`, researchers.teamId)
        )
      )
      .where(
        and(
          query.researcherId
            ? eq(researchers.id, query.researcherId)
            : undefined,
          query.teamId
            ? eq(researchers.teamId, query.teamId)
            : undefined
        )
      )
      .groupBy(researchers.id)
      .orderBy(sql`externalCollaborations DESC`);

    // Collaboration network graph data
    const networkData = await db
      .select({
        source: researchers.id,
        sourceName: sql<string>`CONCAT(${researchers.firstName}, ' ', ${researchers.lastName})`,
        target: sql`r2.id`,
        targetName: sql<string>`CONCAT(r2.firstName, ' ', r2.lastName)`,
        weight: count(sql`DISTINCT ${publicationAuthors.publicationId}`),
        type: sql`CASE WHEN ${researchers.teamId} = r2.teamId THEN 'internal' ELSE 'external' END`,
      })
      .from(researchers)
      .innerJoin(
        publicationAuthors,
        eq(publicationAuthors.researcherId, researchers.id)
      )
      .innerJoin(
        sql`${publicationAuthors} as pa2`,
        eq(sql`pa2.publicationId`, publicationAuthors.publicationId)
      )
      .innerJoin(
        sql`${researchers} as r2`,
        and(
          eq(sql`r2.id`, sql`pa2.researcherId`),
          ne(sql`r2.id`, researchers.id)
        )
      )
      .where(
        and(
          query.researcherId
            ? eq(researchers.id, query.researcherId)
            : undefined,
          query.teamId
            ? or(
                eq(researchers.teamId, query.teamId),
                eq(sql`r2.teamId`, query.teamId)
              )
            : undefined
        )
      )
      .groupBy(researchers.id, sql`r2.id`, sql`r2.firstName`, sql`r2.lastName`, sql`r2.teamId`)
      .having(sql`COUNT(*) >= ${query.minCollaborations}`);

    return NextResponse.json({
      internalCollaborations: internalCollab,
      externalCollaborations: externalCollab,
      networkData,
    });
  } catch (error) {
    return handleApiError(error);
  }
}