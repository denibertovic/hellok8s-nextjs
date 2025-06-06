#!/usr/bin/env node

// Run database migrations
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

async function runMigrations() {
  console.log("🗄️ Running database migrations...");

  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  // Create a dedicated connection for migrations (max 1 connection)
  const migrationClient = postgres(DATABASE_URL, { max: 1 });
  const db = drizzle(migrationClient);

  try {
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("✅ Database migrations completed successfully");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await migrationClient.end();
  }
}

async function main() {
  try {
    await runMigrations();
    console.log("✅ Migration script completed successfully");
  } catch (error) {
    console.error("❌ Migration script failed:", error);
    process.exit(1);
  }
}

main();
