import { relations, sql } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";
import { index, pgTableCreator } from "drizzle-orm/pg-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name: string) => `hellok8s_${name}`);

export const posts = createTable(
  "post",
  (t) => ({
    id: t.integer().primaryKey().generatedByDefaultAsIdentity(),
    title: t.varchar({ length: 256 }).notNull(),
    slug: t.varchar({ length: 256 }).notNull().unique(),
    content: t.text().notNull(),
    createdById: t
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    createdAt: t
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: t.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (table) => [
    index("created_by_idx").on(table.createdById),
    index("title_idx").on(table.title),
    index("slug_idx").on(table.slug),
  ],
);

export const users = createTable("user", (t) => ({
  id: t
    .varchar({ length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  firstName: t.varchar({ length: 255 }),
  lastName: t.varchar({ length: 255 }),
  email: t.varchar({ length: 255 }).notNull().unique(),
  password: t.varchar({ length: 255 }),
  isSuperuser: t.boolean().default(false).notNull(),
  emailVerified: t
    .timestamp({
      mode: "date",
      withTimezone: true,
    })
    .default(sql`CURRENT_TIMESTAMP`),
  image: t.varchar({ length: 255 }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
}));

export const postsRelations = relations(posts, ({ one }) => ({
  createdBy: one(users, {
    fields: [posts.createdById],
    references: [users.id],
  }),
}));

export type User = InferSelectModel<typeof users>;
export type Post = InferSelectModel<typeof posts>;

// Public user data (safe to expose)
export type UserPublic = Pick<User, "firstName" | "lastName" | "email">;

// Post with author information
export type PostWithAuthor = Post & {
  createdBy: UserPublic;
};
