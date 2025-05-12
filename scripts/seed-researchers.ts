import { researchers, researchTeams, users } from "@/db/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import fs from "fs";
import path from "path";

// Type for our researcher data
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

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

export async function seedResearchers() {
  console.log("🚀 Starting researcher seeding...");

  try {
    // Load researchers data from JSON file
    const jsonPath = path.join(process.cwd(), "data", "researchers.json");
    const researchersData: Researcher[] = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
    
    if (!researchersData || !Array.isArray(researchersData)) {
      throw new Error("Invalid researchers data format");
    }
    
    console.log(`📊 Loaded ${researchersData.length} researchers from JSON file`);

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
    for (const researcher of researchersData) {
      const fullName = `${researcher.firstName} ${researcher.lastName}`.trim();
      const email = researcher.email || generateEmail(researcher);
      const password = generatePassword(researcher.lastName);
      const orcidId = researcher.orcidId || generateOrcidId();

      console.log(`Processing: ${fullName}`);

      // Map qualification from JSON to our enum values
      const qualificationMap: Record<string, string> = {
        "Professeur": "professor",
        "Maître de conférences": "associate_professor",
        "Maître assistant": "assistant_professor",
        "Doctorant": "phd_candidate",
        "Postdoc": "postdoc",
        "Chercheur": "research_scientist"
      };

      const qualification = researcher.qualification 
        ? qualificationMap[researcher.qualification] || getRandomQualification()
        : getRandomQualification();

      // Map position from JSON to our enum values
      const positionMap: Record<string, string> = {
        "Professeur": "senior_researcher",
        "Directeur": "director",
        "Chef de département": "department_head",
        "Responsable d'équipe": "principal_investigator",
        "Chercheur": "researcher",
        "Assistant": "assistant"
      };

      const position = researcher.position 
        ? positionMap[researcher.position] || getRandomPosition()
        : getRandomPosition();

      // Insert researcher with all fields
      const [dbResearcher] = await db
        .insert(researchers)
        .values({
          firstName: researcher.firstName,
          lastName: researcher.lastName,
          email,
          phone: researcher.phone ? String(researcher.phone) : generatePhoneNumber(),
          status: "active",
          qualification: qualification as "professor" | "associate_professor" | "assistant_professor" | "postdoc" | "phd_candidate" | "research_scientist",
          position: position as "director" | "department_head" | "principal_investigator" | "senior_researcher" | "researcher" | "assistant",
          hIndex: researcher.hIndex || Math.floor(Math.random() * 30),
          i10Index: researcher.i10Index || Math.floor(Math.random() * 50),
          citations: researcher.citations || Math.floor(Math.random() * 1000),
          teamId,
          joinDate: researcher.joinDate || randomDate(new Date(2010, 0, 1)).toISOString(),
          biography: researcher.biography || generateBiography(researcher),
          researchInterests: researcher.researchInterests || getResearchInterests(),
          dblpUrl: researcher.dblpUrl || `https://dblp.org/pid/${researcher.lastName.toLowerCase()}`,
          googleScholarUrl: researcher.googleScholarUrl || "",
          researchGateUrl: researcher.researchGateUrl || `https://www.researchgate.net/profile/${fullName.replace(/\s+/g, "-")}`,
          linkedinUrl: researcher.linkedinUrl || `https://www.linkedin.com/in/${fullName.replace(/\s+/g, "-")}`,
          personalWebsite: researcher.personalWebsite || `https://www.esi.dz/~${researcher.lastName.toLowerCase()}`,
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
        role: "researcher",
        researcherId: dbResearcher.id,
        isActive: true,
        image: researcher.profilePic || undefined,
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
  }
}

// Helper functions (unchanged from original)
function generateEmail(researcher: { firstName: string; lastName: string }): string {
  const firstInitial = researcher.firstName ? researcher.firstName.charAt(0).toLowerCase() : "x";
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
  return `0000-000${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
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