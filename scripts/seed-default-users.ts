import { users } from "@/db/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";

type UserRole = "admin" | "assistant" | "director" | "researcher" | "guest";

export const DEFAULT_USERS = [
  {

    //prompt for these data
    name: "Admin User",
    email: "admin@esi.dz",
    role: "admin" as UserRole,
    password: "Admin@2025",
  }
];

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

export async function seedDefaultUsers() {
  console.log("🚀 Starting default users seeding...");

  try {
    const results = [];
    
    for (const user of DEFAULT_USERS) {
      // Check if user already exists
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, user.email),
      });

      if (existingUser) {
        console.log(`⏩ User already exists: ${user.email}`);
        continue;
      }

      console.log(`Processing: ${user.name} (${user.role})`);

      // Hash password
      const hashedPassword = await hashPassword(user.password);

      // Insert user
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

    if (results.length > 0) {
      console.log("✅ Default users seeding completed successfully!");
      console.log("Created users:", results);
    } else {
      console.log("⏩ All default users already exist, skipping creation.");
    }

    return results;
  } catch (error) {
    console.error("❌ Error seeding default users:", error);
    throw error;
  }
}

// Execute the seeding function
seedDefaultUsers();