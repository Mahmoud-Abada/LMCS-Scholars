// app/test/analytics/statistics/data.ts
'use server';

import { db } from '@/db/client';
import { 
  researchers, 
  publications, 
  publicationAuthors, 
  researchTeams,
  researchProjects,
  projectParticipants,
  projectPublications,
  venues,
  publicationVenues
} from '@/db/schema';
import { and, avg, count, desc, eq, max, sum, sql, ne } from 'drizzle-orm';

export type StatisticsData = {
  // General Metrics
  totalResearchers: number;
  totalPublications: number;
  totalProjects: number;
  totalTeams: number;
  
  // Publication Metrics
  publicationsByType: Array<{
    type: string;
    count: number;
  }>;
  publicationsByYear: Array<{
    year: number;
    count: number;
    citations: number;
  }>;
  topCitedPublications: Array<{
    id: string;
    title: string;
    citationCount: number;
  }>;
  
  // Researcher Metrics
  researchersByStatus: Array<{
    status: string;
    count: number;
  }>;
  topResearchers: Array<{
    id: string;
    name: string;
    hIndex: number;
    citations: number;
  }>;
  
  // Project Metrics
  projectsByStatus: Array<{
    status: string;
    count: number;
  }>;
  projectsByYear: Array<{
    year: number;
    count: number;
  }>;
  
  // Venue Metrics
  topVenues: Array<{
    id: string;
    name: string;
    publicationCount: number;
  }>;
  
  // Collaboration Metrics
  internalCollaborations: number;
  externalCollaborations: number;
};

export async function getProjectStatistics() {
  // Execute all queries in parallel for better performance
  const [
    totalResearchers,
    totalPublications,
    totalProjects,
    totalTeams,
    publicationsByType,
    publicationsByYear,
    topCitedPublications,
    researchersByStatus,
    topResearchers,
    projectsByStatus,
    projectsByYear,
    topVenues,
    collaborationStats
  ] = await Promise.all([
    // Basic counts
    db.select({ count: count() }).from(researchers),
    db.select({ count: count() }).from(publications),
    db.select({ count: count() }).from(researchProjects),
    db.select({ count: count() }).from(researchTeams),
    
    // Publication analytics
    db
      .select({
        type: publications.publicationType,
        count: count(),
      })
      .from(publications)
      .groupBy(publications.publicationType),
      
    db
      .select({
        year: sql<number>`EXTRACT(YEAR FROM ${publications.publicationDate})::integer`,
        count: count(),
        citations: sum(publications.citationCount),
      })
      .from(publications)
      .where(sql`${publications.publicationDate} IS NOT NULL`)
      .groupBy(sql`EXTRACT(YEAR FROM ${publications.publicationDate})`)
      .orderBy(sql`EXTRACT(YEAR FROM ${publications.publicationDate})`),
      
    db
      .select({
        id: publications.id,
        title: publications.title,
        citationCount: publications.citationCount,
      })
      .from(publications)
      .orderBy(desc(publications.citationCount))
      .limit(5),
    
    // Researcher analytics
    db
      .select({
        status: researchers.status,
        count: count(),
      })
      .from(researchers)
      .groupBy(researchers.status),
      
    db
      .select({
        id: researchers.id,
        name: sql<string>`CONCAT(${researchers.firstName}, ' ', ${researchers.lastName})`,
        hIndex: researchers.hIndex,
        citations: researchers.citations,
      })
      .from(researchers)
      .orderBy(desc(researchers.hIndex))
      .limit(5),
    
    // Project analytics
    db
      .select({
        status: researchProjects.status,
        count: count(),
      })
      .from(researchProjects)
      .groupBy(researchProjects.status),
      
    db
      .select({
        year: sql<number>`EXTRACT(YEAR FROM ${researchProjects.startDate})::integer`,
        count: count(),
      })
      .from(researchProjects)
      .groupBy(sql`EXTRACT(YEAR FROM ${researchProjects.startDate})`)
      .orderBy(sql`EXTRACT(YEAR FROM ${researchProjects.startDate})`),
    
    // Venue analytics
    db
      .select({
        id: venues.id,
        name: venues.name,
        publicationCount: count(publicationVenues.publicationId),
      })
      .from(venues)
      .leftJoin(
        publicationVenues,
        eq(venues.id, publicationVenues.venueId)
      )
      .groupBy(venues.id)
      .orderBy(desc(count(publicationVenues.publicationId)))
      .limit(5),
    
    // Collaboration stats
    db
      .select({
        internal: count(sql`DISTINCT CASE WHEN ${researchers.teamId} = r2.teamId THEN ${publicationAuthors.publicationId} ELSE NULL END`),
        external: count(sql`DISTINCT CASE WHEN ${researchers.teamId} != r2.teamId THEN ${publicationAuthors.publicationId} ELSE NULL END`),
      })
      .from(publicationAuthors)
      .innerJoin(
        researchers,
        eq(researchers.id, publicationAuthors.researcherId)
      )
      .innerJoin(
        sql`${publicationAuthors} as pa2`,
        eq(publicationAuthors.publicationId, sql`pa2.publicationId`)
      )
      .innerJoin(
        sql`${researchers} as r2`,
        and(
          eq(sql`r2.id`, sql`pa2.researcherId`),
          ne(sql`r2.id`, researchers.id)
        )
      )
  ]);

  return {
    totalResearchers: totalResearchers[0].count,
    totalPublications: totalPublications[0].count,
    totalProjects: totalProjects[0].count,
    totalTeams: totalTeams[0].count,
    publicationsByType,
    publicationsByYear,
    topCitedPublications,
    researchersByStatus,
    topResearchers,
    projectsByStatus,
    projectsByYear,
    topVenues,
    internalCollaborations: collaborationStats[0].internal,
    externalCollaborations: collaborationStats[0].external,
  } satisfies StatisticsData;
}