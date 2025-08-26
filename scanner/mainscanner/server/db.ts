import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from "@shared/schema";
import dotenv from 'dotenv';

// Ensure env vars are loaded
dotenv.config();

let sql: any = null;
let db: any = null;

if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL not set - using in-memory storage for development");
  // Use null for in-memory development
  sql = null;
  db = null;
} else {
  console.log("✅ Using PostgreSQL database with Drizzle ORM");
  sql = postgres(process.env.DATABASE_URL, { max: 1 });
  db = drizzle(sql, { schema });
}

export { sql as pool, db };