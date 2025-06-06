import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { posts } from "@/server/db/schema";
import { generateSlug } from "@/lib/utils/slug";

const CreatePostSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    // Auth is handled by middleware, so we can safely get the session
    const session = await auth();

    const body = (await request.json()) as unknown;
    const { title, content }: z.infer<typeof CreatePostSchema> =
      CreatePostSchema.parse(body);

    const slug = generateSlug(title);

    const newPost = await db
      .insert(posts)
      .values({
        title,
        slug,
        content,
        createdById: session!.user.id,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        post: newPost[0],
        message: "Post created successfully",
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid input",
          details: error.errors,
        },
        { status: 400 },
      );
    }

    console.error("Error creating post:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Auth is handled by middleware, so we can safely get the session
    await auth();

    // Get post ID from query parameters
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("id");

    if (!postId) {
      return NextResponse.json(
        {
          success: false,
          error: "Post ID is required",
        },
        { status: 400 },
      );
    }

    const id = parseInt(postId);
    if (isNaN(id)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid post ID",
        },
        { status: 400 },
      );
    }

    // Delete the post
    const deletedPost = await db
      .delete(posts)
      .where(eq(posts.id, id))
      .returning();

    if (deletedPost.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Post not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        post: deletedPost[0],
        message: "Post deleted successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}
