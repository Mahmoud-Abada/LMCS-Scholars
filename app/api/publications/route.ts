// app/api/publications/route.ts
import { db } from '@/db/client';
import { publications } from '@/db/schema';
import { NextResponse } from 'next/server';
import { asc, desc, sql } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Optional pagination parameters
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 20;
    const sort = searchParams.get('sort') || 'desc';
    
    // Query the database for all publications with pagination
    const publicationsData = await db
      .select()
      .from(publications)
      .orderBy(sort === 'asc' ? asc(publications.publicationDate) : desc(publications.publicationDate))
      .limit(10)
      .offset((page - 1) * limit);

    // Get total count for pagination
    const totalCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(publications);

    return NextResponse.json({ 
      data: publicationsData,
      pagination: {
        total: totalCount[0].count,
        page,
        limit,
        totalPages: Math.ceil(totalCount[0].count / limit)
      }
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching publications:", error);
    return NextResponse.json({ error: "Failed to fetch publications" }, { status: 500 });
  }
}