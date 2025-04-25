// src/app/api/admin/logs/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { auditLogs, users } from '@/db/schema';
import { desc, eq, like, sql } from 'drizzle-orm';
import { z } from 'zod';
import { auth } from '@/auth';
import { handleApiError, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@/lib/api-utils';

const queryParamsSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
  action: z.string().optional(),
  entityType: z.string().optional(),
  userId: z.string().uuid().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || !['assistant', 'director', 'admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryParams = queryParamsSchema.parse({
      page: Number(searchParams.get('page')) || 1,
      pageSize: Number(searchParams.get('pageSize')) || DEFAULT_PAGE_SIZE,
      action: searchParams.get('action'),
      entityType: searchParams.get('entityType'),
      userId: searchParams.get('userId'),
      dateFrom: searchParams.get('dateFrom'),
      dateTo: searchParams.get('dateTo'),
    });

    const offset = (queryParams.page - 1) * queryParams.pageSize;

    const baseQuery = db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        timestamp: auditLogs.createdAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
        },
        metadata: auditLogs.metadata,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .orderBy(desc(auditLogs.createdAt));

    let query = baseQuery.$dynamic();

    // Apply filters
    if (queryParams.action) {
      query = query.where(like(auditLogs.action, `%${queryParams.action}%`));
    }

    if (queryParams.entityType) {
      query = query.where(eq(auditLogs.entityType, queryParams.entityType));
    }

    if (queryParams.userId) {
      query = query.where(eq(auditLogs.userId, queryParams.userId));
    }

    if (queryParams.dateFrom) {
      query = query.where(
        sql`${auditLogs.createdAt} >= ${new Date(queryParams.dateFrom)}`
      );
    }

    if (queryParams.dateTo) {
      query = query.where(
        sql`${auditLogs.createdAt} <= ${new Date(queryParams.dateTo)}`
      );
    }

    // Get paginated results
    const logsData = await query
      .limit(queryParams.pageSize)
      .offset(offset);

    // Get total count
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(auditLogs);
    const totalCount = totalCountResult[0].count;

    return NextResponse.json({
      data: logsData,
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