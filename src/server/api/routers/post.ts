import { z } from "zod";
import os from "os";
import { hashPassword } from "@/lib/password-utils";
import { eq, desc } from "drizzle-orm";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
  superuserProcedure,
} from "@/server/api/trpc";
import { posts, users, type PostWithAuthor } from "@/server/db/schema";
import { generateSlug, generateUniqueSlug } from "@/lib/utils/slug";

export const postRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      };
    }),

  getHostname: publicProcedure.query(() => {
    return {
      hostname: os.hostname(),
    };
  }),

  create: superuserProcedure
    .input(z.object({ title: z.string().min(1), content: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const baseSlug = generateSlug(input.title);

      // Get existing slugs to ensure uniqueness
      const existingPosts = await ctx.db.query.posts.findMany({
        columns: { slug: true },
      });
      const existingSlugs = existingPosts.map((p) => p.slug);

      const uniqueSlug = generateUniqueSlug(baseSlug, existingSlugs);

      await ctx.db.insert(posts).values({
        title: input.title,
        slug: uniqueSlug,
        content: input.content,
        createdById: ctx.session.user.id,
      });
    }),

  getLatest: protectedProcedure.query(async ({ ctx }) => {
    const post = await ctx.db.query.posts.findFirst({
      orderBy: [desc(posts.createdAt)],
    });

    return post ?? null;
  }),

  getAll: publicProcedure.query(async ({ ctx }): Promise<PostWithAuthor[]> => {
    const results = await ctx.db.query.posts.findMany({
      orderBy: [desc(posts.createdAt)],
      with: {
        createdBy: {
          columns: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
    return results as PostWithAuthor[];
  }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }): Promise<PostWithAuthor | null> => {
      const post = await ctx.db.query.posts.findFirst({
        where: eq(posts.id, input.id),
        with: {
          createdBy: {
            columns: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      return (post as PostWithAuthor) ?? null;
    }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }): Promise<PostWithAuthor | null> => {
      const post = await ctx.db.query.posts.findFirst({
        where: eq(posts.slug, input.slug),
        with: {
          createdBy: {
            columns: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      return (post as PostWithAuthor) ?? null;
    }),

  generateSlugPreview: publicProcedure
    .input(z.object({ title: z.string() }))
    .query(({ input }) => {
      return { slug: generateSlug(input.title) };
    }),

  update: superuserProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1),
        content: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const baseSlug = generateSlug(input.title);

      // Get existing slugs (excluding current post)
      const existingPosts = await ctx.db.query.posts.findMany({
        columns: { slug: true },
        where: (posts, { ne }) => ne(posts.id, input.id),
      });
      const existingSlugs = existingPosts.map((p) => p.slug);

      const uniqueSlug = generateUniqueSlug(baseSlug, existingSlugs);

      return await ctx.db
        .update(posts)
        .set({
          title: input.title,
          slug: uniqueSlug,
          content: input.content,
          updatedAt: new Date(),
        })
        .where(eq(posts.id, input.id))
        .returning();
    }),

  delete: superuserProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db
        .delete(posts)
        .where(eq(posts.id, input.id))
        .returning();
    }),

  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),

  // For testing - create a user
  createUser: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        isSuperuser: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const hashedPassword = await hashPassword(input.password);

      const user = await ctx.db
        .insert(users)
        .values({
          email: input.email,
          password: hashedPassword,
          firstName: input.firstName,
          lastName: input.lastName,
          isSuperuser: input.isSuperuser,
        })
        .returning();

      return { success: true, userId: user[0]?.id };
    }),
});
