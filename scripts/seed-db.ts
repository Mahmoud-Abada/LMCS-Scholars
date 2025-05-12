import { db } from "@/db/client";
import {
  externalAuthors,
  publicationAuthors,
  publicationExternalAuthors,
  publications,
  publicationVenues,
  researchers,
  researchTeams,
  users,
  venues,
} from "@/db/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { stdin as input, stdout as output } from "process";
import readline from "readline/promises";

// Types
type UserRole = "admin" | "assistant" | "director" | "researcher" | "guest";
interface Researcher {
  orcidId?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string | number;
  qualification?: string;
  position?: string;
  hIndex?: number;
  i10Index?: number;
  citations?: number;
  joinDate?: string;
  leaveDate?: string;
  biography?: string;
  researchInterests?: string;
  dblpUrl?: string;
  googleScholarUrl?: string;
  researchGateUrl?: string;
  linkedinUrl?: string;
  personalWebsite?: string;
  profilePic?: string;
}

interface ScrapedPublication {
  title: string;
  abstract?: string;
  authors?: string[];
  publicationType?: string;
  publicationDate?: string;
  doi?: string;
  url?: string;
  pdfUrl?: string;
  scholarLink?: string;
  dblpLink?: string;
  citationCount?: number;
  pages?: string;
  volume?: string;
  issue?: string;
  publisher?: string;
  venue?: {
    name?: string;
    type?: string;
    publisher?: string;
    issn?: string;
    eissn?: string;
    sjrIndicator?: number;
  };
  language?: string;
  citationGraph?: Record<string, number>;
  googleScholarArticles?: Array<{
    title: string;
    url: string;
    citationCount: number;
  }>;
}

// Helper functions
async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

function generateEmail(researcher: {
  firstName: string;
  lastName: string;
}): string {
  const firstInitial = researcher.firstName
    ? researcher.firstName.charAt(0).toLowerCase()
    : "x";
  const cleanLastName = researcher.lastName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_");
  return `${firstInitial}_${cleanLastName}@esi.dz`;
}

function generatePassword(lastName: string): string {
  return `${lastName.toLowerCase()}@${new Date().getFullYear()}`;
}

function generatePhoneNumber(): string {
  return `+213${Math.floor(500000000 + Math.random() * 500000000)}`;
}

function generateOrcidId(): string {
  return `0000-000${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(
    1000 + Math.random() * 9000
  )}-${Math.floor(1000 + Math.random() * 9000)}`;
}

function randomDate(start: Date, end: Date = new Date()): Date {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
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

function getRandomPosition():
  | "director"
  | "department_head"
  | "principal_investigator"
  | "senior_researcher"
  | "researcher"
  | "assistant" {
  const positions = [
    "director",
    "department_head",
    "principal_investigator",
    "senior_researcher",
    "researcher",
    "assistant",
  ] as const;
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
  const count = 1 + Math.floor(Math.random() * 2);
  return Array.from(
    { length: count },
    () => interests.splice(Math.floor(Math.random() * interests.length), 1)[0]
  ).join(", ");
}

// Main seeding functions
async function promptForDirectorInfo() {
  const rl = readline.createInterface({ input, output });

  console.log("Please enter director account information:");
  const name = await rl.question("Full name: ");
  const email = await rl.question("Email: ");
  const password = await rl.question("Password: ");

  rl.close();

  return {
    name,
    email,
    password,
    role: "director" as UserRole,
  };
}

async function seedDefaultUsers() {
  console.log("🚀 Seeding default users...");
  const directorInfo = await promptForDirectorInfo();

  const DEFAULT_USERS = [
    {
      name: "Admin User",
      email: "admin@esi.dz",
      role: "admin" as UserRole,
      password: "Admin@2025",
    },
    directorInfo,
  ];

  const results = [];

  for (const user of DEFAULT_USERS) {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, user.email),
    });

    if (existingUser) {
      console.log(`⏩ User exists: ${user.email}`);
      continue;
    }

    const hashedPassword = await hashPassword(user.password);
    const [dbUser] = await db
      .insert(users)
      .values({
        name: user.name,
        email: user.email,
        password: hashedPassword,
        role: user.role,
        isActive: true,
        emailVerified: new Date(),
      })
      .returning({ id: users.id });

    if (!dbUser) {
      console.error(`❌ Failed to create user: ${user.name}`);
      continue;
    }

    results.push({
      name: user.name,
      email: user.email,
      role: user.role,
      userId: dbUser.id,
    });
  }

  console.log("✅ Default users seeded");
  return results;
}

async function seedResearchers() {
  console.log("🚀 Seeding researchers...");

  const jsonPath = path.join(process.cwd(), "data", "researchers.json");
  const researchersData: Researcher[] = JSON.parse(
    fs.readFileSync(jsonPath, "utf-8")
  );

  if (!researchersData || !Array.isArray(researchersData)) {
    throw new Error("Invalid researchers data format");
  }

  const [defaultTeam] = await db
    .insert(researchTeams)
    .values({
      name: "Laboratoire des Méthodes de Conception de Systèmes",
      description: "Principal research team of LMCS laboratory",
      establishedDate: new Date(2005, 0, 1).toISOString(),
      websiteUrl: "https://www.esi.dz/lmcs",
    })
    .onConflictDoNothing()
    .returning({ id: researchTeams.id });

  const teamId =
    defaultTeam?.id ||
    (
      await db.query.researchTeams.findFirst({
        where: eq(
          researchTeams.name,
          "Laboratoire des Méthodes de Conception de Systèmes"
        ),
      })
    )?.id;

  if (!teamId) throw new Error("Failed to create or find default team");

  const results = [];
  for (const researcher of researchersData) {
    const fullName = `${researcher.firstName} ${researcher.lastName}`.trim();
    const email = researcher.email || generateEmail(researcher);
    const password = generatePassword(researcher.lastName);
    const orcidId = researcher.orcidId || generateOrcidId();

    const qualificationMap: Record<string, string> = {
      Professeur: "professor",
      "Maître de conférences": "associate_professor",
      "Maître assistant": "assistant_professor",
      Doctorant: "phd_candidate",
      Postdoc: "postdoc",
      Chercheur: "research_scientist",
    };

    const qualification = researcher.qualification
      ? qualificationMap[researcher.qualification] || getRandomQualification()
      : getRandomQualification();

    const positionMap: Record<string, string> = {
      Professeur: "senior_researcher",
      Directeur: "director",
      "Chef de département": "department_head",
      "Responsable d'équipe": "principal_investigator",
      Chercheur: "researcher",
      Assistant: "assistant",
    };

    const position = researcher.position
      ? positionMap[researcher.position] || getRandomPosition()
      : getRandomPosition();

    const [dbResearcher] = await db
      .insert(researchers)
      .values({
        firstName: researcher.firstName,
        lastName: researcher.lastName,
        email,
        phone: researcher.phone
          ? String(researcher.phone)
          : generatePhoneNumber(),
        status: "active",
        qualification: qualification as
          | "professor"
          | "associate_professor"
          | "assistant_professor"
          | "postdoc"
          | "phd_candidate"
          | "research_scientist",
        position: position as
          | "director"
          | "department_head"
          | "principal_investigator"
          | "senior_researcher"
          | "researcher"
          | "assistant",
        hIndex: researcher.hIndex || Math.floor(Math.random() * 30),
        i10Index: researcher.i10Index || Math.floor(Math.random() * 50),
        citations: researcher.citations || Math.floor(Math.random() * 1000),
        teamId,
        joinDate:
          researcher.joinDate || randomDate(new Date(2010, 0, 1)).toISOString(),
        biography: researcher.biography || generateBiography(researcher),
        researchInterests:
          researcher.researchInterests || getResearchInterests(),
        dblpUrl:
          researcher.dblpUrl ||
          `https://dblp.org/pid/${researcher.lastName.toLowerCase()}`,
        googleScholarUrl: researcher.googleScholarUrl || "",
        researchGateUrl:
          researcher.researchGateUrl ||
          `https://www.researchgate.net/profile/${fullName.replace(
            /\s+/g,
            "-"
          )}`,
        linkedinUrl:
          researcher.linkedinUrl ||
          `https://www.linkedin.com/in/${fullName.replace(/\s+/g, "-")}`,
        personalWebsite:
          researcher.personalWebsite ||
          `https://www.esi.dz/~${researcher.lastName.toLowerCase()}`,
        orcidId,
      })
      .returning({ id: researchers.id });

    if (!dbResearcher) {
      console.error(`❌ Failed to create researcher: ${fullName}`);
      continue;
    }

    const hashedPassword = await hashPassword(password);
    await db.insert(users).values({
      name: fullName,
      email,
      password: hashedPassword,
      role: "researcher",
      researcherId: dbResearcher.id,
      isActive: true,
      image: researcher.profilePic || undefined,
    });

    results.push({
      name: fullName,
      email,
      researcherId: dbResearcher.id,
    });
  }

  console.log(`✅ Seeded ${results.length} researchers`);
  return results;
}

async function seedPublications(
  scrapedPubs: ScrapedPublication[],
  researcherId: string
) {
  console.log("🚀 Seeding publications...");

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
          let venueId: string | undefined;
          if (pub.venue?.name) {
            const [venue] = await tx
              .insert(venues)
              .values({
                name: pub.venue.name,
                type:
                  (pub.venue.type as
                    | "journal"
                    | "conference"
                    | "workshop"
                    | "symposium"
                    | "book") || "journal",
                publisher: pub.venue.publisher || pub.publisher || null,
                issn: pub.venue.issn || null,
                sjrIndicator: pub.venue.sjrIndicator
                  ? String(pub.venue.sjrIndicator)
                  : null,
                eissn: pub.venue.eissn || null,
                isOpenAccess: false,
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

          const [publication] = await tx
            .insert(publications)
            .values({
              title: pub.title,
              abstract: pub.abstract || null,
              authors: pub.authors || [],
              publicationType: (pub.publicationType || "journal_article") as
                | "journal_article"
                | "conference_paper"
                | "book_chapter"
                | "patent"
                | "technical_report"
                | "thesis"
                | "preprint",
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
              journal: pub.venue?.name || null,
              language: pub.language || "English",
              citationGraph: pub.citationGraph || null,
              googleScholarArticles: pub.googleScholarArticles || null,
            })
            .returning({ id: publications.id });

          results.publications++;

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

          if (pub.authors?.length) {
            for (let i = 0; i < pub.authors.length; i++) {
              const authorName = pub.authors[i];
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
                let externalAuthorId: string;
                const existingAuthor = await tx.query.externalAuthors.findFirst(
                  {
                    where: eq(externalAuthors.fullName, authorName),
                  }
                );

                if (existingAuthor) {
                  externalAuthorId = existingAuthor.id;
                } else {
                  const [newAuthor] = await tx
                    .insert(externalAuthors)
                    .values({
                      fullName: authorName,
                      affiliation: null,
                    })
                    .returning({ id: externalAuthors.id });
                  externalAuthorId = newAuthor.id;
                  results.externalAuthors++;
                }

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
          results.failedPublications++;
          throw txError;
        }
      });
    } catch (finalError) {
      results.skippedPublications++;
      console.error(`❌ Failed to seed publication: ${pub.title}`, finalError);
    }
  }

  console.log(`✅ Seeded ${results.publications} publications`);
  return results;
}

// Main execution
async function main() {
  try {
    console.log("🌱 Starting database seeding...");

    // Step 1: Seed default users (including director)
    await seedDefaultUsers();

    // Step 2: Seed researchers
    const seededResearchers = await seedResearchers();

    // Step 3: Seed publications (if you have publications data)
    const publicationsData: ScrapedPublication[] = []; // Load your publications data here
    for (const researcher of seededResearchers) {
      await seedPublications(publicationsData, researcher.researcherId);
    }

    console.log("🎉 Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error during seeding:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main();
