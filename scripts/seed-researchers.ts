// src/scripts/seed-researchers.ts
import { researchers, researchTeams, users } from "@/db/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../db/client";

export const LMCS_RESEARCHERS = [
  /* { lastName: "ABDELMEZIEM", firstName: "" },
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

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

export default async function seedResearchers() {
  console.log("Starting researcher seeding...");

  try {
    // Create default research team
    const [defaultTeam] = await db
      .insert(researchTeams)
      .values({
        name: "Laboratoire des Méthodes de Conception de Systèmes",
        description: "Principal research team of LMCS laboratory",
        establishedDate: new Date(2005, 0, 1),
        websiteUrl: "https://www.esi.dz/lmcs",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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
      defaultTeam.id = existingTeam.id;
    }

    console.log(`Using team ID: ${defaultTeam.id}`);

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
          teamId: defaultTeam.id,
          joinDate: new Date(2015 + Math.floor(Math.random() * 8)), // Random join date 2015-2023
          biography: generateBiography(researcher),
          researchInterests: getResearchInterests(),
          dblpUrl: `https://dblp.org/pid/${researcher.lastName.toLowerCase()}`,
          googleScholarUrl: `https://scholar.google.com/citations?user=${researcher.lastName.toLowerCase()}`,
          researchGateUrl: `https://www.researchgate.net/profile/${fullName.replace(
            /\s+/g,
            "-"
          )}`,
          personalWebsite: `https://www.esi.dz/~${researcher.lastName.toLowerCase()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
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
        emailVerified: new Date().toISOString(),
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLogin: Math.random() > 0.7 ? new Date().toISOString() : null, // 30% chance of having logged in
      });

      console.log(
        `Created: ${fullName} | Email: ${email} | Password: ${password}`
      );
    }

    console.log("✅ Researcher seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding researchers:", error);
    //process.exit(1);
  } finally {
    //process.exit(0);
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

function getRandomRole() {
  const roles = [
    "researcher",
    "researcher",
    "researcher",
    "assistant",
    "director",
  ]; // Weighted
  return roles[Math.floor(Math.random() * roles.length)];
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

seedResearchers();
