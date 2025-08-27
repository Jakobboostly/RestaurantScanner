import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from "@shared/schema";

let sql: ReturnType<typeof postgres> | null = null;
let db: any = null;

if (!process.env.DATABASE_URL) {
  console.warn("⚠️  DATABASE_URL not set - using in-memory storage for development");
  console.warn("⚠️  All scan data will be lost on restart");
  sql = null;
  db = null;
} else {
  console.log("🔗 DATABASE_URL found, connecting to PostgreSQL...");
  console.log("🔗 Database URL preview:", process.env.DATABASE_URL.substring(0, 30) + "...");
  // For local Postgres, SSL is typically not required. If using a managed DB that requires SSL,
  // set PGSSLMODE=require or add ssl: 'require' here.
  sql = postgres(process.env.DATABASE_URL, {
    max: 10,
    ssl: process.env.PGSSLMODE === 'require' ? 'require' : undefined,
  });
  db = drizzle(sql, { schema });
  console.log("✅ Database client initialized (postgres-js)");
}

export { sql, db };
