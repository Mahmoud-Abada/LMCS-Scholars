// src/lib/services/publication.service.ts

import { and, eq } from 'drizzle-orm';
import { publicationAuthors, publications } from '../../db/schema';
import { db } from '../../db/client';

export async function createPublication(publicationData: typeof publications.$inferInsert) {
  try {
    // Check if publication already exists
    const existing = await db.query.publications.findFirst({
      where: and(
        eq(publications.title, publicationData.title),
        eq(publications.year, publicationData.year)
      ),
    });

    if (existing) {
      console.log(`Publication already exists: ${publicationData.title}`);
      return existing;
    }

    // Insert new publication
    const [newPublication] = await db.insert(publications)
      .values(publicationData)
      .returning();

    return newPublication;
  } catch (error) {
    console.error('Error creating publication:', error);
    throw error;
  }
}

export async function linkPublicationToResearcher(
  publicationId: string,
  researcherId: string
) {
  await db.insert(publicationAuthors) // Assuming you have a junction table
    .values({
      publicationId,
      researcherId,
      isPrimary: true // If you track primary authors
    })
    .onConflictDoNothing();
}