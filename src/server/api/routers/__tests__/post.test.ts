/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return, @typescript-eslint/ban-ts-comment */
// @ts-nocheck - Test file with simplified tRPC caller usage

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createCallerFactory } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import {
  setupTestDb,
  createTestUser,
  createTestPost,
  createMockSession,
  createMockContext,
} from "./test-utils";

// Mock the os module
vi.mock("os", () => ({
  default: {
    hostname: vi.fn(() => "test-hostname"),
  },
}));

import { postRouter } from "../post";

describe("postRouter", () => {
  let testDb: ReturnType<typeof setupTestDb>;
  let createCaller: ReturnType<typeof createCallerFactory>;

  beforeEach(async () => {
    vi.clearAllMocks();

    testDb = setupTestDb();
    createCaller = createCallerFactory(postRouter);
  });

  afterEach(async () => {
    if (testDb) {
      await testDb.cleanup();
    }
  });

  describe("getAll - listing posts (public)", () => {
    it("should return all posts for unauthenticated users", async () => {
      await testDb.runInTransaction(async (db) => {
        const superUser = await createTestUser(db, {
          email: "super@example.com",
          firstName: "Super",
          lastName: "User",
          isSuperuser: true,
        });

        // Create test posts
        await createTestPost(db, superUser.id, {
          title: "First Post",
          slug: "first-post",
        });
        await createTestPost(db, superUser.id, {
          title: "Second Post",
          slug: "second-post",
        });

        const caller = createCaller(createMockContext(db, null));
        const result = await caller.getAll();

        expect(result).toHaveLength(2);
        // Just check that both posts are returned, order may vary in tests
        const titles = result.map((p: any) => p.title).sort();
        expect(titles).toEqual(["First Post", "Second Post"]);
      });
    });

    it("should include author information", async () => {
      await testDb.runInTransaction(async (db) => {
        const superUser = await createTestUser(db, {
          email: "super@example.com",
          firstName: "Super",
          lastName: "User",
          isSuperuser: true,
        });

        await createTestPost(db, superUser.id, {
          title: "Test Post",
          slug: "test-post",
        });

        const caller = createCaller(createMockContext(db, null));
        const result = await caller.getAll();

        expect(result[0]?.createdBy).toEqual({
          firstName: superUser.firstName,
          lastName: superUser.lastName,
          email: superUser.email,
        });
      });
    });
  });

  describe("getById - viewing post detail (public)", () => {
    it("should return post by id for unauthenticated users", async () => {
      await testDb.runInTransaction(async (db) => {
        const superUser = await createTestUser(db, {
          email: "super@example.com",
          firstName: "Super",
          lastName: "User",
          isSuperuser: true,
        });

        const post = await createTestPost(db, superUser.id, {
          title: "Test Post",
          slug: "test-post",
        });

        const caller = createCaller(createMockContext(db, null));

        const result = await caller.getById({ id: post.id });

        expect(result?.title).toBe("Test Post");
        expect(result?.slug).toBe("test-post");
        expect(result?.createdBy.email).toBe(superUser.email);
      });
    });

    it("should return null for non-existent post", async () => {
      await testDb.runInTransaction(async (db) => {
        const caller = createCaller(createMockContext(db, null));

        const result = await caller.getById({ id: 999 });

        expect(result).toBeNull();
      });
    });
  });

  describe("getBySlug - viewing post by slug (public)", () => {
    it("should return post by slug for unauthenticated users", async () => {
      await testDb.runInTransaction(async (db) => {
        const superUser = await createTestUser(db, {
          email: "super@example.com",
          firstName: "Super",
          lastName: "User",
          isSuperuser: true,
        });

        await createTestPost(db, superUser.id, {
          title: "Test Post",
          slug: "test-post",
        });

        const caller = createCaller(createMockContext(db, null));

        const result = await caller.getBySlug({ slug: "test-post" });

        expect(result?.title).toBe("Test Post");
        expect(result?.slug).toBe("test-post");
      });
    });

    it("should return null for non-existent slug", async () => {
      await testDb.runInTransaction(async (db) => {
        const caller = createCaller(createMockContext(db, null));

        const result = await caller.getBySlug({ slug: "non-existent" });

        expect(result).toBeNull();
      });
    });
  });

  describe("create - creating posts (superuser only)", () => {
    it("should allow superuser to create posts", async () => {
      await testDb.runInTransaction(async (db) => {
        const superUser = await createTestUser(db, {
          email: "super@example.com",
          firstName: "Super",
          lastName: "User",
          isSuperuser: true,
        });

        const session = createMockSession(superUser);
        const caller = createCaller(createMockContext(db, session));

        await caller.create({
          title: "New Post",
          content: "This is content",
        });

        const posts = await caller.getAll();
        expect(posts).toHaveLength(1);
        expect(posts[0]?.title).toBe("New Post");
        expect(posts[0]?.slug).toBe("new-post");
        expect(posts[0]?.content).toBe("This is content");
      });
    });

    it("should generate unique slugs for duplicate titles", async () => {
      await testDb.runInTransaction(async (db) => {
        const superUser = await createTestUser(db, {
          email: "super@example.com",
          firstName: "Super",
          lastName: "User",
          isSuperuser: true,
        });

        const session = createMockSession(superUser);
        const caller = createCaller(createMockContext(db, session));

        await caller.create({
          title: "Same Title",
          content: "First post",
        });

        await caller.create({
          title: "Same Title",
          content: "Second post",
        });

        const posts = await caller.getAll();
        expect(posts).toHaveLength(2);

        const slugs = posts.map((p: any) => p.slug).sort();
        expect(slugs).toEqual(["same-title", "same-title-1"]);
      });
    });

    it("should reject unauthenticated users", async () => {
      await testDb.runInTransaction(async (db) => {
        const caller = createCaller(createMockContext(db, null));

        await expect(
          caller.create({
            title: "New Post",
            content: "This is content",
          }),
        ).rejects.toThrow(TRPCError);
      });
    });

    it("should reject non-superuser authenticated users", async () => {
      await testDb.runInTransaction(async (db) => {
        const regularUser = await createTestUser(db, {
          email: "regular@example.com",
          firstName: "Regular",
          lastName: "User",
          isSuperuser: false,
        });

        const session = createMockSession(regularUser);
        const caller = createCaller(createMockContext(db, session));

        await expect(
          caller.create({
            title: "New Post",
            content: "This is content",
          }),
        ).rejects.toThrow(TRPCError);
      });
    });
  });

  describe("update - editing posts (superuser only)", () => {
    it("should allow superuser to update posts", async () => {
      await testDb.runInTransaction(async (db) => {
        const superUser = await createTestUser(db, {
          email: "super@example.com",
          firstName: "Super",
          lastName: "User",
          isSuperuser: true,
        });

        const post = await createTestPost(db, superUser.id, {
          title: "Original",
          slug: "original",
        });
        const session = createMockSession(superUser);
        const caller = createCaller(createMockContext(db, session));

        await caller.update({
          id: post.id,
          title: "Updated Title",
          content: "Updated content",
        });

        const updated = await caller.getById({ id: post.id });
        expect(updated?.title).toBe("Updated Title");
        expect(updated?.slug).toBe("updated-title");
        expect(updated?.content).toBe("Updated content");
      });
    });

    it("should update slug when title changes", async () => {
      await testDb.runInTransaction(async (db) => {
        const superUser = await createTestUser(db, {
          email: "super@example.com",
          firstName: "Super",
          lastName: "User",
          isSuperuser: true,
        });

        const post = await createTestPost(db, superUser.id, {
          title: "Original",
          slug: "original",
        });
        const session = createMockSession(superUser);
        const caller = createCaller(createMockContext(db, session));

        await caller.update({
          id: post.id,
          title: "Completely New Title",
          content: "Same content",
        });

        const updated = await caller.getById({ id: post.id });
        expect(updated?.slug).toBe("completely-new-title");
      });
    });

    it("should reject unauthenticated users", async () => {
      await testDb.runInTransaction(async (db) => {
        const superUser = await createTestUser(db, {
          email: "super@example.com",
          firstName: "Super",
          lastName: "User",
          isSuperuser: true,
        });

        const post = await createTestPost(db, superUser.id);
        const caller = createCaller(createMockContext(db, null));

        await expect(
          caller.update({
            id: post.id,
            title: "Updated",
            content: "Updated",
          }),
        ).rejects.toThrow(TRPCError);
      });
    });

    it("should reject non-superuser authenticated users", async () => {
      await testDb.runInTransaction(async (db) => {
        const superUser = await createTestUser(db, {
          email: "super@example.com",
          firstName: "Super",
          lastName: "User",
          isSuperuser: true,
        });

        const regularUser = await createTestUser(db, {
          email: "regular@example.com",
          firstName: "Regular",
          lastName: "User",
          isSuperuser: false,
        });

        const post = await createTestPost(db, superUser.id);
        const session = createMockSession(regularUser);
        const caller = createCaller(createMockContext(db, session));

        await expect(
          caller.update({
            id: post.id,
            title: "Updated",
            content: "Updated",
          }),
        ).rejects.toThrow(TRPCError);
      });
    });
  });

  describe("delete - deleting posts (superuser only)", () => {
    it("should allow superuser to delete posts", async () => {
      await testDb.runInTransaction(async (db) => {
        const superUser = await createTestUser(db, {
          email: "super@example.com",
          firstName: "Super",
          lastName: "User",
          isSuperuser: true,
        });

        const post = await createTestPost(db, superUser.id);
        const session = createMockSession(superUser);
        const caller = createCaller(createMockContext(db, session));

        await caller.delete({ id: post.id });

        const result = await caller.getById({ id: post.id });
        expect(result).toBeNull();
      });
    });

    it("should reject unauthenticated users", async () => {
      await testDb.runInTransaction(async (db) => {
        const superUser = await createTestUser(db, {
          email: "super@example.com",
          firstName: "Super",
          lastName: "User",
          isSuperuser: true,
        });

        const post = await createTestPost(db, superUser.id);
        const caller = createCaller(createMockContext(db, null));

        await expect(caller.delete({ id: post.id })).rejects.toThrow(TRPCError);
      });
    });

    it("should reject non-superuser authenticated users", async () => {
      await testDb.runInTransaction(async (db) => {
        const superUser = await createTestUser(db, {
          email: "super@example.com",
          firstName: "Super",
          lastName: "User",
          isSuperuser: true,
        });

        const regularUser = await createTestUser(db, {
          email: "regular@example.com",
          firstName: "Regular",
          lastName: "User",
          isSuperuser: false,
        });

        const post = await createTestPost(db, superUser.id);
        const session = createMockSession(regularUser);
        const caller = createCaller(createMockContext(db, session));

        await expect(caller.delete({ id: post.id })).rejects.toThrow(TRPCError);
      });
    });
  });

  describe("generateSlugPreview", () => {
    it("should generate slug preview from title", async () => {
      await testDb.runInTransaction(async (db) => {
        const caller = createCaller(createMockContext(db, null));

        const result = await caller.generateSlugPreview({
          title: "Hello World!",
        });

        expect(result.slug).toBe("hello-world");
      });
    });

    it("should handle special characters", async () => {
      await testDb.runInTransaction(async (db) => {
        const caller = createCaller(createMockContext(db, null));

        const result = await caller.generateSlugPreview({
          title: "Test & Special Characters!",
        });

        expect(result.slug).toBe("test-special-characters");
      });
    });
  });
});
