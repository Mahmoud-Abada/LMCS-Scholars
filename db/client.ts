import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
// src/scripts/seed-database.ts
import {
  classificationSystems,
  projectParticipants,
  projectPublications,
  publicationAuthors,
  publicationClassifications,
  publications,
  publicationVenues,
  researchProjects,
  venues,
} from "@/db/schema";

import { faker } from "@faker-js/faker";

import { researchers, researchTeams, users } from "@/db/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { scrapePublications } from "../scripts/scraper";

const client = postgres(process.env.DATABASE_URL!, { max: 1 });
export const db = drizzle(client, { schema });

// Helper to drop all tables (use with caution!)
 export async function dropAllTables() {
  const client0 = await client;
  const db0 = await db;
  await seedDatabase();
}

// Add these helper functions at the top of your file
function formatDateForDB(date: Date): string {
  return date.toISOString();
}

function formatTimestampForDB(date: Date): Date {
  return date; // For timestamp fields, we can pass Date objects directly
}

const LMCS_RESEARCHERS = [
  /*  //{ lastName: "ABDELMEZIEM", firstName: "" },
  { lastName: "ABDELAOUI", firstName: "Sabrina" },
  { lastName: "AMROUCHE", firstName: "Hakim" },
  { lastName: "ARTABAZ", firstName: "Saliha" },
  { lastName: "BENATCHBA", firstName: "Karima" },
  { lastName: "BESSEDIK", firstName: "Malika" },
  { lastName: "BELAHRACHE", firstName: "Abderahmane" },
  { lastName: "BOUKHEDIMI", firstName: "Sohila" },
  { lastName: "BOUKHADRA", firstName: "Adel" },
  { lastName: "BOUSBIA", firstName: "Nabila" },
  { lastName: "BOUSAHA", firstName: "Rima" },
  { lastName: "CHALAL", firstName: "Rachid" },
  { lastName: "CHERID", firstName: "Nacera" },
  { lastName: "DAHAMNI", firstName: "Foudil" },
  { lastName: "DEKICHE", firstName: "Narimane" },
  { lastName: "DELLYS", firstName: "Elhachmi" },
  { lastName: "FAYCEL", firstName: "Touka" },
  { lastName: "GHOMARI", firstName: "Abdesamed Réda" },
  { lastName: "GUERROUTE", firstName: "Elhachmi" },
  { lastName: "HAMANI", firstName: "Nacer" },
  { lastName: "HAROUNE", firstName: "Hayet" },
  { lastName: "HASSINI", firstName: "Sabrina" },
  { lastName: "KECHIDE", firstName: "Amine" },
  { lastName: "KHELOUAT", firstName: "Boualem" },
  { lastName: "KHELIFATI", firstName: "Si Larabi" },
  { lastName: "KERMI", firstName: "Adel" },
  { lastName: "KOUDIL", firstName: "Mouloud" },
  { lastName: "MAHIOU", firstName: "Ramdane" },
  { lastName: "NADER", firstName: "Fahima" },*/
  { lastName: "SI TAYEB", firstName: "Fatima" },
];

 async function hashPassword(password: string): Promise<string> {
  if (typeof password !== "string") {
    throw new Error(`Password must be a string, received ${typeof password}`);
  }
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

 async function seedResearchers() {
  console.log("Starting researcher seeding...");
  const now = new Date();

  try {
    // Create default research team
    const [defaultTeam] = await db
      .insert(researchTeams)
      .values({
        name: "Laboratoire des Méthodes de Conception de Systèmes",
        description: "Principal research team of LMCS laboratory",
        establishedDate: formatDateForDB(new Date(2005, 0, 1)),
        websiteUrl: "https://www.esi.dz/lmcs",
        createdAt: formatTimestampForDB(now),
        updatedAt: formatTimestampForDB(now),
      })
      .onConflictDoNothing()
      .returning({ id: researchTeams.id });

    if (!defaultTeam) {
      const existingTeam = await db.query.researchTeams.findFirst({
        where: eq(
          researchTeams.name,
          "Laboratoire des Méthodes de Conception de Systèmes"
        ),
      });
      if (!existingTeam)
        throw new Error("Failed to create or find default team");
      //defaultTeam.id = existingTeam.id;
    }

    //  console.log(`Using team ID: ${defaultTeam.id}`);

    // Process each researcher
    for (const researcher of LMCS_RESEARCHERS) {
      const fullName = `${researcher.firstName} ${researcher.lastName}`.trim();
      const email = generateEmail(researcher);
      const password = generatePassword(researcher.lastName);

      console.log(`Processing: ${fullName}`);

      // Insert researcher with all fields
      const [dbResearcher] = await db
        .insert(researchers)
        .values({
          firstName: researcher.firstName || null,
          lastName: researcher.lastName,
          email,
          phone: generatePhoneNumber(),
          status: "active",
          qualification: getRandomQualification(),
          position: getRandomPosition(),
          hIndex: Math.floor(Math.random() * 30),
          i10Index: Math.floor(Math.random() * 50),
          citations: Math.floor(Math.random() * 1000),
          //teamId: defaultTeam.id,
          joinDate: formatDateForDB(
            new Date(2015 + Math.floor(Math.random() * 8))
          ),
          biography: generateBiography(researcher),
          researchInterests: getResearchInterests(),
          dblpUrl: `https://dblp.org/pid/${researcher.lastName.toLowerCase()}`,
          googleScholarUrl: `https://scholar.google.com/citations?user=${researcher.lastName.toLowerCase()}`,
          researchGateUrl: `https://www.researchgate.net/profile/${fullName.replace(
            /\s+/g,
            "-"
          )}`,
          personalWebsite: `https://www.esi.dz/~${researcher.lastName.toLowerCase()}`,
          createdAt: formatTimestampForDB(now),
          updatedAt: formatTimestampForDB(now),
        })
        .returning({ id: researchers.id });

      if (!dbResearcher) {
        console.error(`Failed to create researcher: ${fullName}`);
        continue;
      }

      // Create corresponding user account
      const hashedPassword = await hashPassword(password);

      await db.insert(users).values({
        name: fullName,
        email,
        password: hashedPassword,
        role: getRandomRole(),
        researcherId: dbResearcher.id,
        emailVerified: formatTimestampForDB(now),
        isActive: true,
        createdAt: formatTimestampForDB(now),
        updatedAt: formatTimestampForDB(now),
        lastLogin: Math.random() > 0.7 ? formatTimestampForDB(now) : null,
      });

      console.log(`Created: ${fullName} | Email: ${email}`);
    }

    console.log("✅ Researcher seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding researchers:", error);
  }
}

// Helper functions
function generateEmail(researcher: {
  firstName: string;
  lastName: string;
}): string {
  const firstInitial = researcher.firstName
    ? researcher.firstName.charAt(0).toLowerCase()
    : "x"; // Default if no first name

  const cleanLastName = researcher.lastName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_");

  return `${firstInitial}_${cleanLastName}@esi.dz`;
}

function generatePassword(lastName: string): string {
  if (!lastName || typeof lastName !== "string") {
    throw new Error("LastName must be a non-empty string");
  }
  return `${lastName.toLowerCase()}@esi`;
}

function generatePhoneNumber(): string {
  return `+213${Math.floor(500000000 + Math.random() * 500000000)}`;
}

function getRandomQualification() {
  const qualifications = [
    "professor",
    "associate_professor",
    "assistant_professor",
    "postdoc",
    "phd_candidate",
    "research_scientist",
  ] as const;
  return qualifications[Math.floor(Math.random() * qualifications.length)];
}

function getRandomPosition() {
  const positions = [
    "director",
    "department_head",
    "principal_investigator",
    "senior_researcher",
    "researcher",
    "assistant",
  ];
  return positions[Math.floor(Math.random() * positions.length)];
}


function generateBiography(researcher: {
  firstName: string;
  lastName: string;
}): string {
  const titles = ["Dr.", "Prof.", "Pr."];
  return `${titles[Math.floor(Math.random() * titles.length)]} ${
    researcher.firstName
  } ${
    researcher.lastName
  } is a researcher at LMCS laboratory specializing in ${getResearchInterests()}.`;
}

function getResearchInterests(): string {
  const interests = [
    "Artificial Intelligence",
    "Machine Learning",
    "Software Engineering",
    "Data Science",
    "Computer Networks",
    "Cybersecurity",
    "Database Systems",
    "Human-Computer Interaction",
  ];
  // Return 1-3 random interests
  const count = 1 + Math.floor(Math.random() * 2);
  return Array.from(
    { length: count },
    () => interests.splice(Math.floor(Math.random() * interests.length), 1)[0]
  ).join(", ");
}

// Helper functions for generating random data
 function getRandomPublicationType() {
  const types = [
    "journal_article",
    "conference_paper",
    "book_chapter",
    "thesis",
    "technical_report",
  ] as const;
  return faker.helpers.arrayElement(types);
}

 function getRandomVenueType() {
  const types = [
    "journal",
    "conference",
    "workshop",
    "book",
    "preprint_server",
  ] as const;
  return faker.helpers.arrayElement(types);
}

 function getRandomClassificationSystem() {
  const systems = ["scimago", "jcr", "core", "cwi", "msc"] as const;
  return faker.helpers.arrayElement(systems);
}

 function getRandomCategory() {
  const categories = ["Q1", "Q2", "Q3", "Q4", "A*", "A", "B", "C"];
  return faker.helpers.arrayElement(categories);
}

 function getRandomProjectStatus() {
  const statuses = ["active", "completed", "pending", "cancelled"];
  return faker.helpers.arrayElement(statuses);
}

 function getRandomRole() {
  const roles = [
    "Principal Investigator",
    "Co-Investigator",
    "Researcher",
    "PhD Student",
    "Postdoc",
    "Technical Staff",
  ];
  return faker.helpers.arrayElement(roles);
}

 function generateAbstract() {
  return faker.lorem.paragraphs(3);
}

 function generateKeywords() {
  const keywords = [
    "machine learning",
    "artificial intelligence",
    "data mining",
    "computer vision",
    "natural language processing",
    "software engineering",
    "cybersecurity",
    "distributed systems",
    "cloud computing",
    "big data",
  ];
  return faker.helpers.arrayElements(keywords, { min: 3, max: 8 });
}

 function generateDOI(title: string) {
  const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]/g, "");
  return `10.1000/${cleanTitle.substring(0, 10)}-${faker.string.alphanumeric(
    6
  )}`;
}

async function seedClassificationSystems() {
  console.log("Seeding classification systems...");

  const systems = [
    {
      name: "Scimago",
      description: "SCImago Journal Rank",
      website: "https://www.scimagojr.com",
    },
    {
      name: "JCR",
      description: "Journal Citation Reports",
      website: "https://jcr.clarivate.com",
    },
    {
      name: "CORE",
      description: "CORE Conference Ranking",
      website: "https://www.core.edu.au",
    },
   
  ];

  for (const system of systems) {
    await db
      .insert(classificationSystems)
      .values({
        ...system,
        currentYear: new Date().getFullYear(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoNothing();
  }
}

async function seedResearchProjects() {
  console.log("Seeding research projects...");

  const projects = [];
  for (let i = 0; i < 10; i++) {
    projects.push({
      title: `Project ${faker.lorem.words(3)}`,
      description: faker.lorem.paragraphs(2),
      startDate: faker.date.past({ years: 3 }),
      endDate: faker.date.future({ years: 2 }),
      fundingAmount: faker.number.float({
        min: 50000,
        max: 500000,
        precision: 0.01,
      }),
      fundingAgency: faker.helpers.arrayElement([
        "National Science Foundation",
        "European Research Council",
        "Ministry of Higher Education",
        "Industry Partnership",
      ]),
      grantNumber: `GRANT-${faker.string.alphanumeric(8)}`,
      status: getRandomProjectStatus(),
      website: faker.internet.url(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  for (const project of projects) {
    await db.insert(researchProjects).values(project);
  }
}

async function seedProjectParticipants() {
  console.log("Seeding project participants...");

  const allProjects = await db.query.researchProjects.findMany();
  const allResearchers = await db.query.researchers.findMany();

  for (const project of allProjects) {
    // Each project has 3-8 participants
    const numParticipants = faker.number.int({ min: 3, max: 8 });
    const selectedResearchers = faker.helpers.arrayElements(
      allResearchers,
      numParticipants
    );

    for (let i = 0; i < selectedResearchers.length; i++) {
      const researcher = selectedResearchers[i];
      await db
        .insert(projectParticipants)
        .values({
          projectId: project.id,
          researcherId: researcher.id,
          role: getRandomRole(),
          isPrincipalInvestigator: i === 0, // First researcher is PI
          startDate: project.startDate,
          endDate: project.endDate,
          createdAt: new Date(),
        })
        .onConflictDoNothing();
    }
  }
}

async function seedVenues() {
  console.log("Seeding venues...");

  const venuesData = [
    {
      name: "Journal of Machine Learning Research",
      type: "journal",
      issn: "1532-4435",
    },
    {
      name: "IEEE Transactions on Pattern Analysis and Machine Intelligence",
      type: "journal",
      issn: "0162-8828",
    },
    {
      name: "Neural Information Processing Systems",
      type: "conference",
      issn: "1049-5258",
    },
    {
      name: "International Conference on Machine Learning",
      type: "conference",
    },
    {
      name: "ACM Transactions on Database Systems",
      type: "journal",
      issn: "0362-5915",
    },
    { name: "IEEE Symposium on Security and Privacy", type: "conference" },
    { name: "Nature Machine Intelligence", type: "journal", issn: "2522-5839" },
    { name: "European Conference on Computer Vision", type: "conference" },
    {
      name: "Journal of Artificial Intelligence Research",
      type: "journal",
      issn: "1076-9757",
    },
    {
      name: "International Conference on Learning Representations",
      type: "conference",
    },
  ];

  for (const venue of venuesData) {
    await db
      .insert(venues)
      .values({
        ...venue,
        shortName: venue.name
          .split(" ")
          .map((w) => w[0])
          .join(""),
        publisher: faker.helpers.arrayElement([
          "IEEE",
          "ACM",
          "Springer",
          "Elsevier",
          "PLOS",
        ]),
        eissn: faker.string.numeric({ length: 8 }),
        website: faker.internet.url(),
        impactFactor: faker.number.float({ min: 1, max: 20, precision: 0.1 }),
        sjrIndicator: faker.number.float({
          min: 0.5,
          max: 10,
          precision: 0.01,
        }),
        isOpenAccess: faker.datatype.boolean(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoNothing();
  }
}

async function seedPublicationsAndAuthors() {
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
        const [dbPublication] = await db
          .insert(publications)
          .values({
            title: pub.titre_publication,
            abstract: generateAbstract(),
            publicationType: getRandomPublicationType(),
            status: "published",
            publicationDate: pub.annee
              ? new Date(parseInt(pub.annee), 6, 1)
              : faker.date.past({ years: 5 }),
            doi: generateDOI(pub.titre_publication),
            arxivId: `arXiv:${faker.string.numeric({
              length: 4,
            })}.${faker.string.numeric({ length: 5 })}`,
            isbn: pub.type.includes("book") ? faker.commerce.isbn() : null,
            issn: faker.string.numeric({ length: 8 }),
            url: pub.lien || faker.internet.url(),
            pdfUrl: faker.datatype.boolean() ? faker.internet.url() : null,
            citationCount: faker.number.int({ min: 0, max: 500 }),
            pageCount: pub.nombre_pages
              ? parseInt(pub.nombre_pages.split("-")[1]) || null
              : null,
            volume: pub.volumes || null,
            issue: faker.number.int({ min: 1, max: 12 }).toString(),
            publisher: faker.helpers.arrayElement([
              "IEEE",
              "ACM",
              "Springer",
              "Elsevier",
              "PLOS",
            ]),
            keywords: generateKeywords(),
            language: faker.helpers.arrayElement([
              "English",
              "French",
              "German",
              "Spanish",
            ]),
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning({ id: publications.id });

        // Add author relationship
        await db.insert(publicationAuthors).values({
          publicationId: dbPublication.id,
          researcherId: researcher.id,
          authorPosition: 1, // Assume first author for now
          isCorrespondingAuthor: faker.datatype.boolean(),
          affiliationDuringWork: "ESI, Algiers",
          createdAt: new Date(),
        });

        // Add some co-authors (2-5 random researchers)
        const coAuthors = faker.helpers.arrayElements(
          allResearchers.filter((r) => r.id !== researcher.id),
          faker.number.int({ min: 1, max: 4 })
        );

        for (let i = 0; i < coAuthors.length; i++) {
          await db.insert(publicationAuthors).values({
            publicationId: dbPublication.id,
            researcherId: coAuthors[i].id,
            authorPosition: i + 2,
            isCorrespondingAuthor: false,
            affiliationDuringWork: faker.helpers.arrayElement([
              "ESI, Algiers",
              "USTHB, Algiers",
              "University of Science and Technology",
              "National Research Center",
            ]),
            createdAt: new Date(),
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
            createdAt: new Date(),
          });
        }

        // Add classification data (1-3 random systems)
        const allSystems = await db.query.classificationSystems.findMany();
        const selectedSystems = faker.helpers.arrayElements(
          allSystems,
          faker.number.int({ min: 1, max: 3 })
        );

        for (const system of selectedSystems) {
          await db.insert(publicationClassifications).values({
            publicationId: dbPublication.id,
            systemId: system.id,
            category: getRandomCategory(),
            year: pub.annee
              ? parseInt(pub.annee)
              : faker.number.int({ min: 2018, max: 2023 }),
            evidenceUrl: faker.internet.url(),
            createdAt: new Date(),
          });
        }
      } catch (error) {
        console.error(`Error inserting publication for ${fullName}:`, error);
      }
    }
  }
}

async function seedProjectPublications() {
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
      await db
        .insert(projectPublications)
        .values({
          projectId: project.id,
          publicationId: pub.id,
          acknowledgement: faker.datatype.boolean()
            ? `This work was supported by project ${project.title}`
            : null,
          createdAt: new Date(),
        })
        .onConflictDoNothing();
    }
  }
}

  async function seedDatabase() {
  console.log("Starting database seeding...");

  try {
    // Seed in proper order to maintain foreign key constraints
    await seedClassificationSystems();
    await seedVenues();
    //await seedResearchProjects();
    await seedPublicationsAndAuthors();
    await seedProjectParticipants();
    await seedProjectPublications();

    console.log("✅ Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    //process.exit(1);
  } finally {
    //process.exit(0);
  }
}

// Uncomment to run directly
// seedDatabase();
