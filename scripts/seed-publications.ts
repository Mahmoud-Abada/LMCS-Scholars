// src/scripts/seed-database.ts
import { db } from "../db/client";
import { 
  publications, 
  publicationAuthors, 
  venues, 
  publicationVenues, 
  classificationSystems, 
  publicationClassifications,
  researchProjects,
  projectParticipants,
  projectPublications,
  researchers
} from "@/db/schema";

import { scrapePublications } from "./scraper";
import { faker } from '@faker-js/faker';

// Helper functions for generating random data
export  function getRandomPublicationType() {
  const types = [
    'journal_article', 
    'conference_paper', 
    'book_chapter', 
    'thesis', 
    'technical_report'
  ] as const;
  return faker.helpers.arrayElement(types);
}

export  function getRandomVenueType() {
  const types = [
    'journal', 
    'conference', 
    'workshop', 
    'book', 
    'preprint_server'
  ] as const;
  return faker.helpers.arrayElement(types);
}

export  function getRandomClassificationSystem() {
  const systems = [
    "CORE",
    "Scimago",
    "DGRSDT",
    "Qualis",
    "JCR",
    "SJR",
  ] as const;
  return faker.helpers.arrayElement(systems);
}

export  function getRandomCategory() {
  const categories = ['Q1', 'Q2', 'Q3', 'Q4', 'A*', 'A', 'B', 'C'];
  return faker.helpers.arrayElement(categories);
}

export  function getRandomProjectStatus() {
  const statuses = ['active', 'completed', 'pending', 'cancelled'];
  return faker.helpers.arrayElement(statuses);
}

export  function getRandomRole() {
  const roles = [
    'Principal Investigator',
    'Co-Investigator',
    'Researcher',
    'PhD Student',
    'Postdoc',
    'Technical Staff'
  ];
  return faker.helpers.arrayElement(roles);
}

export  function generateAbstract() {
  return faker.lorem.paragraphs(3);
}

export  function generateKeywords() {
  const keywords = [
    'machine learning',
    'artificial intelligence',
    'data mining',
    'computer vision',
    'natural language processing',
    'software engineering',
    'cybersecurity',
    'distributed systems',
    'cloud computing',
    'big data'
  ];
  return faker.helpers.arrayElements(keywords, { min: 3, max: 8 });
}

export  function generateDOI(title: string) {
  const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `10.1000/${cleanTitle.substring(0, 10)}-${faker.string.alphanumeric(6)}`;
}

async function seedClassificationSystems() {
  console.log("Seeding classification systems...");
  
  const systems = [
    { name: 'Scimago', description: 'SCImago Journal Rank', website: 'https://www.scimagojr.com' },
    { name: 'JCR', description: 'Journal Citation Reports', website: 'https://jcr.clarivate.com' },
    { name: 'CORE', description: 'CORE Conference Ranking', website: 'https://www.core.edu.au' },
  ];

  for (const system of systems) {
    await db.insert(classificationSystems).values({
      ...system,
      currentYear: new Date().getFullYear(),
      createdAt: new Date(),
      updatedAt: new Date()
    }).onConflictDoNothing();
  }
}

async export  function seedResearchProjects() {
  console.log("Seeding research projects...");
  
  const projects = [];
  for (let i = 0; i < 10; i++) {
    projects.push({
      title: `Project ${faker.lorem.words(3)}`,
      description: faker.lorem.paragraphs(2),
      startDate: faker.date.past({ years: 3 }),
      endDate: faker.date.future({ years: 2 }),
      fundingAmount: faker.number.float({ min: 50000, max: 500000, precision: 0.01 }),
      fundingAgency: faker.helpers.arrayElement([
        'National Science Foundation',
        'European Research Council',
        'Ministry of Higher Education',
        'Industry Partnership'
      ]),
      grantNumber: `GRANT-${faker.string.alphanumeric(8)}`,
      status: getRandomProjectStatus(),
      website: faker.internet.url(),
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  for (const project of projects) {
    await db.insert(researchProjects).values(project);
  }
}

async export  function seedProjectParticipants() {
  console.log("Seeding project participants...");
  
  const allProjects = await db.query.researchProjects.findMany();
  const allResearchers = await db.query.researchers.findMany();

  for (const project of allProjects) {
    // Each project has 3-8 participants
    const numParticipants = faker.number.int({ min: 3, max: 8 });
    const selectedResearchers = faker.helpers.arrayElements(allResearchers, numParticipants);
    
    for (let i = 0; i < selectedResearchers.length; i++) {
      const researcher = selectedResearchers[i];
      await db.insert(projectParticipants).values({
        projectId: project.id,
        researcherId: researcher.id,
        role: getRandomRole(),
        isPrincipalInvestigator: i === 0, // First researcher is PI
        startDate: project.startDate,
        endDate: project.endDate,
        createdAt: new Date()
      }).onConflictDoNothing();
    }
  }
}

async export  function seedVenues() {
  console.log("Seeding venues...");
  
  const venuesData = [
    { name: 'Journal of Machine Learning Research', type: 'journal', issn: '1532-4435' },
    { name: 'IEEE Transactions on Pattern Analysis and Machine Intelligence', type: 'journal', issn: '0162-8828' },
    { name: 'Neural Information Processing Systems', type: 'conference', issn: '1049-5258' },
    { name: 'International Conference on Machine Learning', type: 'conference' },
    { name: 'ACM Transactions on Database Systems', type: 'journal', issn: '0362-5915' },
    { name: 'IEEE Symposium on Security and Privacy', type: 'conference' },
    { name: 'Nature Machine Intelligence', type: 'journal', issn: '2522-5839' },
    { name: 'European Conference on Computer Vision', type: 'conference' },
    { name: 'Journal of Artificial Intelligence Research', type: 'journal', issn: '1076-9757' },
    { name: 'International Conference on Learning Representations', type: 'conference' }
  ];

  for (const venue of venuesData) {
    await db.insert(venues).values({
      ...venue,
      shortName: venue.name.split(' ').map(w => w[0]).join(''),
      publisher: faker.helpers.arrayElement(['IEEE', 'ACM', 'Springer', 'Elsevier', 'PLOS']),
      eissn: faker.string.numeric({ length: 8 }),
      website: faker.internet.url(),
      impactFactor: faker.number.float({ min: 1, max: 20, precision: 0.1 }),
      sjrIndicator: faker.number.float({ min: 0.5, max: 10, precision: 0.01 }),
      isOpenAccess: faker.datatype.boolean(),
      createdAt: new Date(),
      updatedAt: new Date()
    }).onConflictDoNothing();
  }
}

async export  function seedPublicationsAndAuthors() {
  console.log("Seeding publications and authors...");
  
  const allResearchers = await db.query.researchers.findMany();
  const allVenues = await db.query.venues.findMany();

  for (const researcher of allResearchers) {
    const fullName = `${researcher.firstName} ${researcher.lastName}`.trim();
    console.log(`Processing publications for ${fullName}`);
    
    // Scrape publications for this researcher
    const scrapedData = await scrapePublications(fullName);
    
    if (!scrapedData || scrapedData.length === 0) {
      console.log(`No publications found for ${fullName}`);
      continue;
    }

    const researcherPublications = scrapedData[0].publications;
    
    for (const pub of researcherPublications) {
      try {
        // Insert publication
        const [dbPublication] = await db.insert(publications).values({
          title: pub.titre_publication,
          abstract: generateAbstract(),
          publicationType: getRandomPublicationType(),
          status: 'published',
          publicationDate: pub.annee ? new Date(parseInt(pub.annee), 6, 1) : faker.date.past({ years: 5 }),
          doi: generateDOI(pub.titre_publication),
          arxivId: `arXiv:${faker.string.numeric({ length: 4 })}.${faker.string.numeric({ length: 5 })}`,
          isbn: pub.type.includes('book') ? faker.commerce.isbn() : null,
          issn: faker.string.numeric({ length: 8 }),
          url: pub.lien || faker.internet.url(),
          pdfUrl: faker.datatype.boolean() ? faker.internet.url() : null,
          citationCount: faker.number.int({ min: 0, max: 500 }),
          pageCount: pub.nombre_pages ? parseInt(pub.nombre_pages.split('-')[1]) || null : null,
          volume: pub.volumes || null,
          issue: faker.number.int({ min: 1, max: 12 }).toString(),
          publisher: faker.helpers.arrayElement(['IEEE', 'ACM', 'Springer', 'Elsevier', 'PLOS']),
          keywords: generateKeywords(),
          language: faker.helpers.arrayElement(['English', 'French', 'German', 'Spanish']),
          createdAt: new Date(),
          updatedAt: new Date()
        }).returning({ id: publications.id });

        // Add author relationship
        await db.insert(publicationAuthors).values({
          publicationId: dbPublication.id,
          researcherId: researcher.id,
          authorPosition: 1, // Assume first author for now
          isCorrespondingAuthor: faker.datatype.boolean(),
          affiliationDuringWork: 'ESI, Algiers',
          createdAt: new Date()
        });

        // Add some co-authors (2-5 random researchers)
        const coAuthors = faker.helpers.arrayElements(
          allResearchers.filter(r => r.id !== researcher.id),
          faker.number.int({ min: 1, max: 4 })
        );
        
        for (let i = 0; i < coAuthors.length; i++) {
          await db.insert(publicationAuthors).values({
            publicationId: dbPublication.id,
            researcherId: coAuthors[i].id,
            authorPosition: i + 2,
            isCorrespondingAuthor: false,
            affiliationDuringWork: faker.helpers.arrayElement([
              'ESI, Algiers',
              'USTHB, Algiers',
              'University of Science and Technology',
              'National Research Center'
            ]),
            createdAt: new Date()
          });
        }

        // Link to a random venue
        if (allVenues.length > 0) {
          const venue = faker.helpers.arrayElement(allVenues);
          await db.insert(publicationVenues).values({
            publicationId: dbPublication.id,
            venueId: venue.id,
            pages: pub.nombre_pages || null,
            volume: pub.volumes || null,
            issue: faker.number.int({ min: 1, max: 12 }).toString(),
            articleNumber: faker.string.numeric({ length: 6 }),
            location: pub.lieu || faker.location.city(),
            eventDate: pub.annee ? new Date(parseInt(pub.annee), 6, 1) : null,
            createdAt: new Date()
          });
        }

        // Add classification data (1-3 random systems)
        const allSystems = await db.query.classificationSystems.findMany();
        const selectedSystems = faker.helpers.arrayElements(allSystems, faker.number.int({ min: 1, max: 3 }));
        
        for (const system of selectedSystems) {
          await db.insert(publicationClassifications).values({
            publicationId: dbPublication.id,
            systemId: system.id,
            category: getRandomCategory(),
            year: pub.annee ? parseInt(pub.annee) : faker.number.int({ min: 2018, max: 2023 }),
            evidenceUrl: faker.internet.url(),
            createdAt: new Date()
          });
        }

      } catch (error) {
        console.error(`Error inserting publication for ${fullName}:`, error);
      }
    }
  }
}

async export  function seedProjectPublications() {
  console.log("Linking publications to projects...");
  
  const allProjects = await db.query.researchProjects.findMany();
  const allPublications = await db.query.publications.findMany();

  for (const project of allProjects) {
    // Each project has 3-10 publications
    const projectPubs = faker.helpers.arrayElements(
      allPublications,
      faker.number.int({ min: 3, max: 10 })
    );
    
    for (const pub of projectPubs) {
      await db.insert(projectPublications).values({
        projectId: project.id,
        publicationId: pub.id,
        acknowledgement: faker.datatype.boolean() ? 
          `This work was supported by project ${project.title}` : null,
        createdAt: new Date()
      }).onConflictDoNothing();
    }
  }
}

export default async function seedDatabase() {
  console.log("Starting database seeding...");
  
  try {
    // Seed in proper order to maintain foreign key constraints
    await seedClassificationSystems();
    await seedVenues();
    await seedResearchProjects();
    await seedPublicationsAndAuthors();
    await seedProjectParticipants();
    await seedProjectPublications();
    
    console.log("✅ Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Uncomment to run directly
// seedDatabase();