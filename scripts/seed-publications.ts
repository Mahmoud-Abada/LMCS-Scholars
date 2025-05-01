// src/scripts/seed-publications.ts
import { db } from "@/db/client";
import {
  externalAuthors,
  publicationAuthors,
  publicationExternalAuthors,
  publications,
  publicationVenues,
  researchers,
  venues,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { ScrapedPublication } from "./scraper";

export async function seedPublications(
  scrapedPubs: ScrapedPublication[],
  researcherId: string,
  signal?: AbortSignal
) {
  if (signal?.aborted) throw new Error("Seeding aborted");

  const results = {
    publications: 0,
    venues: 0,
    internalAuthors: 0,
    externalAuthors: 0,
    skippedPublications: 0,
    failedPublications: 0,
  };

  for (const pub of scrapedPubs) {
    try {
      await db.transaction(async (tx) => {
        try {
          // 1. Handle Venue
          let venueId: string | undefined;
          if (pub.venue?.name) {
            const [venue] = await tx
              .insert(venues)
              .values({
                name: pub.venue.name,
                type: pub.venue.type || "journal",
                publisher: pub.venue.publisher || pub.publisher || null,
                issn: pub.venue.issn || null,
                sjrIndicator: pub.venue.sjrIndicator || null,
                eissn: pub.venue.eissn || null,
                isOpenAccess: false, // Default, can be updated later
              })
              .onConflictDoNothing()
              .returning({ id: venues.id });

            if (!venue) {
              const existingVenue = await tx.query.venues.findFirst({
                where: eq(venues.name, pub.venue.name),
              });
              venueId = existingVenue?.id;
            } else {
              venueId = venue.id;
              results.venues++;
            }
          }

          // 2. Create Publication
          const [publication] = await tx
            .insert(publications)
            .values({
              title: pub.title,
              abstract: pub.abstract || null,
              authors: pub.authors || [], // Store raw author names as array
              publicationType: pub.publicationType || "journal_article",
              publicationDate: pub.publicationDate
                ? new Date(pub.publicationDate).toISOString()
                : null,
              doi: pub.doi || null,
              url: pub.url || null,
              pdfUrl: pub.pdfUrl || null,
              scholarLink: pub.scholarLink || null,
              dblpLink: pub.dblpLink || null,
              citationCount: pub.citationCount || 0,
              pages: pub.pages || null,
              volume: pub.volume || null,
              issue: pub.issue || null,
              publisher: pub.publisher || null,
              journal: pub.venue?.name || null, // Store venue name directly
              language: pub.language || "English",
              citationGraph: pub.citationGraph || null,
              googleScholarArticles: pub.googleScholarArticles || null,
            })
            .returning({ id: publications.id });

          results.publications++;

          // 3. Link Publication to Venue if venue exists
          if (venueId) {
            await tx
              .insert(publicationVenues)
              .values({
                publicationId: publication.id,
                venueId,
                pages: pub.pages || null,
                volume: pub.volume || null,
                issue: pub.issue || null,
                eventDate: pub.publicationDate
                  ? new Date(pub.publicationDate).toISOString()
                  : null,
              })
              .onConflictDoNothing();
          }

          // 4. Process Authors
          if (pub.authors?.length) {
            for (let i = 0; i < pub.authors.length; i++) {
              const authorName = pub.authors[i];

              // Check if the author is internal or external
              const isInternalResearcher = await tx.query.researchers.findFirst(
                {
                  where: eq(researchers.id, researcherId),
                }
              );

              const isInternalAuthor = Boolean(
                isInternalResearcher?.firstName &&
                  String(authorName).includes(isInternalResearcher.firstName) &&
                  isInternalResearcher?.lastName &&
                  String(authorName).includes(isInternalResearcher.lastName)
              );
              if (isInternalAuthor) {
                await tx
                  .insert(publicationAuthors)
                  .values({
                    publicationId: publication.id,
                    researcherId,
                    affiliationDuringWork: "ESI, Algiers",
                  })
                  .onConflictDoNothing();
                results.internalAuthors++;
              } else {
                // Handle external authors
                let externalAuthorId: string;

                // Try to find existing external author
                const existingAuthor = await tx.query.externalAuthors.findFirst(
                  {
                    where: eq(externalAuthors.fullName, authorName),
                  }
                );

                if (existingAuthor) {
                  externalAuthorId = existingAuthor.id;
                } else {
                  // Create new external author
                  const [newAuthor] = await tx
                    .insert(externalAuthors)
                    .values({
                      fullName: authorName,
                      affiliation: null, // Can be enhanced if affiliation data exists
                    })
                    .returning({ id: externalAuthors.id });
                  externalAuthorId = newAuthor.id;
                  results.externalAuthors++;
                }

                // Link external author to publication
                await tx
                  .insert(publicationExternalAuthors)
                  .values({
                    publicationId: publication.id,
                    authorId: externalAuthorId,
                  })
                  .onConflictDoNothing();
              }
            }
          }
        } catch (txError) {
          console.error(`Transaction failed for "${pub.title}":`, txError);
          results.failedPublications++;
          throw txError;
        }
      });
    } catch (finalError) {
      console.error(
        `Failed to process publication "${pub.title}":`,
        finalError
      );
      results.skippedPublications++;
    }
  }

  return results;
}
