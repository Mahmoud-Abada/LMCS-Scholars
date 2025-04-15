

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Disable SSL in development if needed (remove `?sslmode=require` from URL)
const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle(client, { schema });
