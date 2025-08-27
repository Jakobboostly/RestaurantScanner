import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  console.warn("⚠️  DATABASE_URL not set - skipping database migration");
  console.warn("⚠️  Set DATABASE_URL environment variable to enable PostgreSQL");
  process.exit(0); // Exit gracefully instead of throwing error
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
