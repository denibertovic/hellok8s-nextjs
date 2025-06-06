#!/usr/bin/env tsx
import { dropTestDatabase } from "@/server/db/test-db";

async function teardownTestDb() {
  try {
    console.log("🧹 Cleaning up test database...");

    // Drop test database
    await dropTestDatabase();

    console.log("✅ Test database cleanup complete!");
  } catch (error) {
    console.error("❌ Test database cleanup failed:", error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  teardownTestDb();
}

export { teardownTestDb };
