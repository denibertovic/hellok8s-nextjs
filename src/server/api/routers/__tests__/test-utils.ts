import { createTestDbWithTransaction } from "@/server/db/test-db";
import { users, posts, type User, type Post } from "@/server/db/schema";
import type { Session } from "next-auth";
import { hashPassword } from "@/lib/password-utils";
import crypto from "crypto";
import type { DB } from "@/server/db";

export function setupTestDb() {
  return createTestDbWithTransaction();
}

export async function createTestUser(
  db: DB,
  overrides: {
    email?: string;
    firstName?: string;
    lastName?: string;
    isSuperuser?: boolean;
    password?: string;
  } = {},
): Promise<User> {
  const password = overrides.password ?? "testpassword";

  const hashedPassword = await hashPassword(password);

  const userData = {
    id: crypto.randomUUID(),
    email: overrides.email ?? "test@example.com",
    firstName: overrides.firstName ?? "Test",
    lastName: overrides.lastName ?? "User",
    isSuperuser: overrides.isSuperuser ?? false,
    password: hashedPassword,
  };

  const [user] = await db.insert(users).values(userData).returning();
  if (!user) {
    throw new Error("Failed to create test user");
  }
  return user;
}

export async function createTestPost(
  db: DB,
  createdById: string,
  overrides: {
    title?: string;
    slug?: string;
    content?: string;
  } = {},
): Promise<Post> {
  const postData = {
    title: overrides.title ?? "Test Post",
    slug: overrides.slug ?? "test-post",
    content: overrides.content ?? "This is test content",
    createdById,
  };

  const [post] = await db.insert(posts).values(postData).returning();
  if (!post) {
    throw new Error("Failed to create test post");
  }
  return post;
}

export function createMockSession(user: User): Session {
  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isSuperuser: user.isSuperuser,
    } as Session["user"], // Cast to Session['user'] to satisfy type requirements
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
}

export function createMockContext(db: DB, session: Session | null = null) {
  return {
    headers: new Headers(),
    db,
    session,
    ip: "127.0.0.1", // Mock IP for tests
  };
}
