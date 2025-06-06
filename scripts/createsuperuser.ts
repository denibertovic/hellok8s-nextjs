#!/usr/bin/env node

import { createInterface } from "readline";
import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import { users } from "../src/server/db/schema";
import type { Interface as ReadlineInterface } from "readline";

// Get database URL from environment
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is required");
  process.exit(1);
}

// Create database connection
const conn = postgres(DATABASE_URL);
const db = drizzle(conn, { casing: "snake_case" });

// Create readline interface for user input
const rl: ReadlineInterface = createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Helper function to prompt for input
function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

// Helper function to prompt for password (hidden input)
function promptPassword(question: string): Promise<string> {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    const stdout = process.stdout;

    stdin.resume();
    stdin.setEncoding("utf8");

    stdout.write(question);
    stdin.setRawMode(true);

    let password = "";

    const onData = (char: Buffer) => {
      const charStr = char.toString();

      switch (charStr) {
        case "\n":
        case "\r":
        case "\u0004": // Ctrl+D
          stdin.setRawMode(false);
          stdin.pause();
          stdin.removeListener("data", onData);
          stdout.write("\n");
          resolve(password);
          break;
        case "\u0003": // Ctrl+C
          stdout.write("\n");
          process.exit(0);
          break;
        case "\u007f": // Backspace
        case "\b":
          if (password.length > 0) {
            password = password.slice(0, -1);
            stdout.clearLine(0);
            stdout.cursorTo(0);
            stdout.write(question + "*".repeat(password.length));
          }
          break;
        default:
          password += charStr;
          stdout.clearLine(0);
          stdout.cursorTo(0);
          stdout.write(question + "*".repeat(password.length));
          break;
      }
    };

    stdin.on("data", onData);
  });
}

async function createSuperuser() {
  try {
    console.log("🔧 Creating superuser...\n");

    // Get user input
    const email = await prompt("Email address: ");
    if (!email || !email.includes("@")) {
      console.error("❌ Please enter a valid email address");
      process.exit(1);
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      console.error(`❌ User with email ${email} already exists`);
      process.exit(1);
    }

    const firstName = await prompt("First name: ");
    if (!firstName.trim()) {
      console.error("❌ First name is required");
      process.exit(1);
    }

    const lastName = await prompt("Last name: ");
    if (!lastName.trim()) {
      console.error("❌ Last name is required");
      process.exit(1);
    }

    const password = await promptPassword("Password: ");
    if (!password || password.length < 6) {
      console.error("❌ Password must be at least 6 characters long");
      process.exit(1);
    }

    const passwordConfirm = await promptPassword("Password (again): ");
    if (password !== passwordConfirm) {
      console.error("❌ Passwords do not match");
      process.exit(1);
    }

    console.log("\n⏳ Creating superuser...");

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const newUser = await db
      .insert(users)
      .values({
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        password: hashedPassword,
        isSuperuser: true,
      })
      .returning();

    const createdUser = newUser[0];
    if (!createdUser) {
      throw new Error("Failed to create user");
    }

    console.log(`✅ Superuser created successfully!`);
    console.log(`📧 Email: ${createdUser.email}`);
    console.log(`👤 Name: ${createdUser.firstName} ${createdUser.lastName}`);
    console.log(`🔑 ID: ${createdUser.id}`);
    console.log(`\n🎉 You can now log in to the admin dashboard at /admin`);
  } catch (error) {
    console.error(
      "❌ Error creating superuser:",
      error instanceof Error ? error.message : String(error),
    );
    process.exit(1);
  } finally {
    rl.close();
    conn.end();
  }
}

// Run the script
createSuperuser();
