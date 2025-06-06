import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import * as schema from "./schema";
import type { DB } from "./index";

const TEST_DB_NAME = "hellok8s_test";

export async function createTestDatabase() {
  // Connect to postgres to create the test database
  const adminConn = postgres(
    process.env.DATABASE_URL!.replace(/\/[^/]*$/, "/postgres"),
  );

  try {
    // Drop test database if it exists
    await adminConn.unsafe(`DROP DATABASE IF EXISTS "${TEST_DB_NAME}"`);

    // Create fresh test database
    await adminConn.unsafe(`CREATE DATABASE "${TEST_DB_NAME}"`);

    console.log(`✓ Created test database: ${TEST_DB_NAME}`);
  } catch (error) {
    console.error("Failed to create test database:", error);
    throw error;
  } finally {
    await adminConn.end();
  }
}

export async function dropTestDatabase() {
  // Connect to postgres to drop the test database
  const adminConn = postgres(
    process.env.DATABASE_URL!.replace(/\/[^/]*$/, "/postgres"),
  );

  try {
    // Terminate any existing connections to the test database
    await adminConn.unsafe(`
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = '${TEST_DB_NAME}' AND pid <> pg_backend_pid()
    `);

    // Drop test database
    await adminConn.unsafe(`DROP DATABASE IF EXISTS "${TEST_DB_NAME}"`);

    console.log(`✓ Dropped test database: ${TEST_DB_NAME}`);
  } catch (error) {
    console.error("Failed to drop test database:", error);
    // Don't throw - this is cleanup
  } finally {
    await adminConn.end();
  }
}

export function createTestDb() {
  // Connect to the test database
  const testDbUrl = process.env.DATABASE_URL!.replace(
    /\/[^/]*$/,
    `/${TEST_DB_NAME}`,
  );
  const conn = postgres(testDbUrl);
  const db = drizzle(conn, { schema, casing: "snake_case" });

  return {
    db,
    conn,
    cleanup: async () => {
      await conn.end();
    },
  };
}

// Custom rollback error class
class RollbackError extends Error {
  constructor() {
    super("ROLLBACK");
    this.name = "RollbackError";
  }
}

export function createTestDbWithTransaction() {
  // Connect to the test database
  const testDbUrl = process.env.DATABASE_URL!.replace(
    /\/[^/]*$/,
    `/${TEST_DB_NAME}`,
  );
  const conn = postgres(testDbUrl);
  const db = drizzle(conn, { schema, casing: "snake_case" });

  return {
    async runInTransaction<T>(testFn: (db: DB) => Promise<T>): Promise<T> {
      let result: T;

      try {
        await db.transaction(async (tx) => {
          // Run the test function
          result = await testFn(tx as unknown as DB);

          // Always rollback the transaction
          throw new RollbackError();
        });
      } catch (error) {
        // If it's our rollback error, that's expected
        if (error instanceof RollbackError) {
          return result!;
        }
        throw error;
      }

      // This should never be reached
      throw new Error("Transaction should have been rolled back");
    },

    async cleanup() {
      await conn.end();
    },
  };
}

export async function setupTestDbWithMigrations() {
  const { db, cleanup } = createTestDb();

  try {
    // Run migrations on test database
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("✓ Applied migrations to test database");

    return { db, cleanup };
  } catch (error) {
    await cleanup();
    throw error;
  }
}

// Removed cleanTestDatabase() - use transaction rollback instead
