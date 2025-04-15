/*// drizzle.config.ts
import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config(); // Load environment variables

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    host: process.env.DB_HOST!,
    port: parseInt(process.env.DB_PORT!),
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!,
    ssl: true,
  },
});
*/

// drizzle.config.ts
import type { Config } from "drizzle-kit";
import { loadEnvConfig } from "@next/env";

// Load environment variables
loadEnvConfig(process.cwd());

export default {
  schema: "./db/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!, // For Xata/PostgreSQL connection string
  },
  // Optional: For better migration generation
  verbose: true,
  strict: true,
} satisfies Config;