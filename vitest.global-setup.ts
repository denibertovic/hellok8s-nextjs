import {
  createTestDatabase,
  dropTestDatabase,
  setupTestDbWithMigrations,
} from "./src/server/db/test-db";

export async function setup() {
  console.log("🚀 Starting test database setup...");

  try {
    // Create test database
    await createTestDatabase();

    // Apply migrations
    const { cleanup } = await setupTestDbWithMigrations();
    await cleanup();

    console.log("✅ Test database ready!");
  } catch (error) {
    console.error("❌ Failed to setup test database:", error);
    throw error;
  }
}

export async function teardown() {
  console.log("🧹 Cleaning up test database...");

  try {
    await dropTestDatabase();
    console.log("✅ Test database cleanup complete!");
  } catch (error) {
    console.error("❌ Failed to cleanup test database:", error);
    // Don't throw in teardown - just log the error
  }
}
