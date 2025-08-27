import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

let pool: Pool | null = null;
let db: any = null;

if (!process.env.DATABASE_URL) {
  console.warn("⚠️  DATABASE_URL not set - using in-memory storage for development");
  console.warn("⚠️  All scan data will be lost on restart");
  // Use null for in-memory development
  pool = null;
  db = null;
} else {
  console.log("🔗 DATABASE_URL found, connecting to PostgreSQL...");
  console.log("🔗 Database URL preview:", process.env.DATABASE_URL.substring(0, 30) + "...");
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle({ client: pool, schema });
  console.log("✅ Database connection established");
}

export { pool, db };