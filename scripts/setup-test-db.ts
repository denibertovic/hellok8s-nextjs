#!/usr/bin/env tsx
import {
  createTestDatabase,
  setupTestDbWithMigrations,
} from "@/server/db/test-db";

async function setupTestDb() {
  try {
    console.log("🔧 Setting up test database...");

    // Create test database
    await createTestDatabase();

    // Apply migrations
    const { cleanup } = await setupTestDbWithMigrations();
    await cleanup();

    console.log("✅ Test database setup complete!");
  } catch (error) {
    console.error("❌ Test database setup failed:", error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  setupTestDb();
}

export { setupTestDb };
