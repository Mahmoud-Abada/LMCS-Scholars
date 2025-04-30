import { researchers, researchTeams, users } from "@/db/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";

export const LMCS_RESEARCHERS = [
  { lastName: "ABDELAOUI", firstName: "Sabrina" , googleScholarUrl:"https://scholar.google.com/citations?user=EbCO7zUAAAAJ&hl=en"},
  { lastName: "AMROUCHE", firstName: "Hakim" , googleScholarUrl:"https://scholar.google.com/citations?hl=en&user=y5DKQy4AAAAJ"},
  { lastName: "ARTABAZ", firstName: "Saliha" , googleScholarUrl:"https://scholar.google.com/citations?user=R0oPubgAAAAJ&hl=en"},
  { lastName: "BENATCHBA", firstName: "Karima" , googleScholarUrl:"https://scholar.google.com/citations?user=7iGY4M0AAAAJ&hl=en"},
  { lastName: "BESSEDIK", firstName: "Malika" , googleScholarUrl:"https://scholar.google.com/citations?hl=en&user=FTzfUeEAAAAJ"},
  { lastName: "BELAHRACHE", firstName: "Abderahmane" , googleScholarUrl:"https://scholar.google.com/citations?hl=en&user=D_XqaEAAAAAJ"},
  { lastName: "BOUKHEDIMI", firstName: "Sohila" , googleScholarUrl:""},
  { lastName: "BOUKHADRA", firstName: "Adel" , googleScholarUrl:""},
  { lastName: "BOUSBIA", firstName: "Nabila" , googleScholarUrl:"https://scholar.google.com/citations?hl=en&user=_u5IOC4AAAAJ"},
  { lastName: "BOUSSAHA", firstName: "Ryma" , googleScholarUrl:"https://scholar.google.com/citations?hl=en&user=mg6cCloAAAAJ"},
  { lastName: "CHALAL", firstName: "Rachid" , googleScholarUrl:"https://scholar.google.com/citations?hl=en&user=qMYUliQAAAAJ"},
  { lastName: "CHERID", firstName: "Nacera" , googleScholarUrl:""},
  { lastName: "DAHAMNI", firstName: "Fodil" , googleScholarUrl:""},
  { lastName: "DEKICHE", firstName: "Narimane" , googleScholarUrl:"https://scholar.google.com/citations?hl=en&user=NWKs57cAAAAJ"},
  { lastName: "DELLYS", firstName: "Elhachmi" , googleScholarUrl:"https://scholar.google.com/citations?hl=en&user=DSsOZeEAAAAJ"},
  { lastName: "FAYCEL", firstName: "Touka" , googleScholarUrl:""},
  { lastName: "GHOMARI", firstName: "Abdesamed Réda" , googleScholarUrl:"https://scholar.google.com/citations?hl=en&user=hha1UuUAAAAJ"},
  { lastName: "GUERROUT", firstName: "Elhachmi" , googleScholarUrl:"https://scholar.google.com/citations?hl=en&user=Dbvc8CwAAAAJ"},
  { lastName: "HAMANI", firstName: "Nacer" , googleScholarUrl:"https://scholar.google.com/citations?hl=en&user=Sx9QpVUAAAAJ"},
  { lastName: "HAROUNE", firstName: "Hayat" , googleScholarUrl:"https://scholar.google.com/citations?hl=en&user=qe1cbMAAAAAJ"},
  { lastName: "HASSINI", firstName: "Sabrina" , googleScholarUrl:"https://scholar.google.com/citations?hl=en&user=LG1jBMYAAAAJ"},
  { lastName: "KECHIDE", firstName: "Amine" , googleScholarUrl:""},
  { lastName: "KHELOUAT", firstName: "Boualem" , googleScholarUrl:""},
  { lastName: "KHELIFATI", firstName: "Si Larabi" , googleScholarUrl:"https://scholar.google.com/citations?hl=en&user=G-iDEugAAAAJ"},
  { lastName: "KERMI", firstName: "Adel" , googleScholarUrl:"https://scholar.google.com/citations?hl=en&user=1UEZWYAAAAAJ"},
  { lastName: "KOUDIL", firstName: "Mouloud" , googleScholarUrl:"https://scholar.google.com/citations?user=9Zbx-EYAAAAJ&hl=en"},
  { lastName: "MAHIOU", firstName: "Ramdane" , googleScholarUrl:"https://scholar.google.com/citations?hl=en&user=eFAj_SkAAAAJ"},
  { lastName: "NADER", firstName: "Fahima" , googleScholarUrl:"https://scholar.google.com/citations?user=XhP-NkYAAAAJ&hl=en"},
  { lastName: "SI TAYEB", firstName: "Fatima" , googleScholarUrl:"https://scholar.google.com/citations?hl=en&user=ri2J--kAAAAJ"},
];

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}



export async function seedResearchers() {
  console.log("🚀 Starting researcher seeding...");

  try {
    // Create default research team
    const [defaultTeam] = await db
      .insert(researchTeams)
      .values({
        name: "Laboratoire des Méthodes de Conception de Systèmes",
        description: "Principal research team of LMCS laboratory",
        establishedDate: new Date(2005, 0, 1).toISOString(),
        websiteUrl: "https://www.esi.dz/lmcs"
      })
      .onConflictDoNothing()
      .returning({ id: researchTeams.id });

    const teamId = defaultTeam?.id || (
      await db.query.researchTeams.findFirst({
        where: eq(researchTeams.name, "Laboratoire des Méthodes de Conception de Systèmes"),
      })
    )?.id;

    if (!teamId) throw new Error("Failed to create or find default team");
    console.log(`🏢 Using team ID: ${teamId}`);

    // Process each researcher
    const results = [];
    for (const researcher of LMCS_RESEARCHERS) {
      const fullName = `${researcher.firstName} ${researcher.lastName}`.trim();
      const email = generateEmail(researcher);
      const password = generatePassword(researcher.lastName);
      const orcidId = generateOrcidId();

      console.log(`Processing: ${fullName}`);

      // Insert researcher with all fields
      const [dbResearcher] = await db
        .insert(researchers)
        .values({
          firstName: researcher.firstName || "",
          lastName: researcher.lastName,
          email,
          phone: generatePhoneNumber(),
          status: "active",
          qualification: getRandomQualification(),
          position: getRandomPosition(),
          hIndex: Math.floor(Math.random() * 30),
          i10Index: Math.floor(Math.random() * 50),
          citations: Math.floor(Math.random() * 1000),
          teamId,
          joinDate: randomDate(new Date(2010, 0, 1)).toISOString(),
          biography: generateBiography(researcher),
          researchInterests: getResearchInterests(),
          dblpUrl: `https://dblp.org/pid/${researcher.lastName.toLowerCase()}`,
          googleScholarUrl: researcher.googleScholarUrl,
          researchGateUrl: `https://www.researchgate.net/profile/${fullName.replace(/\s+/g, "-")}`,
          linkedinUrl: `https://www.linkedin.com/in/${fullName.replace(/\s+/g, "-")}`,
          personalWebsite: `https://www.esi.dz/~${researcher.lastName.toLowerCase()}`,
          orcidId,
        })
        .returning({ id: researchers.id });

      if (!dbResearcher) {
        console.error(`❌ Failed to create researcher: ${fullName}`);
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
        isActive: true,
      });

      results.push({
        name: fullName,
        email,
        password, // Only for development!
        orcidId,
        researcherId: dbResearcher.id
      });
    }

    console.log("✅ Researcher seeding completed successfully!");
    return results;
  } catch (error) {
    console.error("❌ Error seeding researchers:", error);
    throw error;
  }
}

// Helper functions
function generateEmail(researcher: { firstName: string; lastName: string }): string {
  const firstInitial = researcher.firstName ? researcher.firstName.charAt(0).toLowerCase() : "x";
  const cleanLastName = researcher.lastName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, ".");
  return `${firstInitial}.${cleanLastName}@esi.dz`;
}

function generatePassword(lastName: string): string {
  return `${lastName.toLowerCase()}@${new Date().getFullYear()}`;
}

function generatePhoneNumber(): string {
  return `+213${Math.floor(500000000 + Math.random() * 500000000)}`;
}

function generateOrcidId(): string {
 // return `0000-000${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
 return `${Math.floor(1000 + Math.random() * 90)}-${Math.floor(1000 + Math.random() * 90)}-${Math.floor(1000 + Math.random() * 90)}`;
}


function randomDate(start: Date, end: Date = new Date()): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
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

function getRandomPosition(): "director" | "department_head" | "principal_investigator" | "senior_researcher" | "researcher" | "assistant" {
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

function getRandomRole(): "director" | "researcher" | "assistant" | "admin" | "guest" {
  const roles = [
    "researcher",
    "researcher",
    "researcher",
    //"assistant",
    //"admin",
    //"director",
  ] as const;
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
