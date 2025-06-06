import { notFound, redirect } from "next/navigation";
import { api } from "@/trpc/server";
import type { Metadata } from "next";
import Link from "next/link";

type Props = {
  params: Promise<{ id: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, slug } = await params;
  const postId = parseInt(id);

  if (isNaN(postId)) {
    return {
      title: "Post Not Found",
    };
  }

  const post = await api.post.getById({ id: postId });

  if (!post) {
    return {
      title: "Post Not Found",
    };
  }

  // Redirect if slug doesn't match
  if (post.slug !== slug) {
    redirect(`/post/${id}/${post.slug}`);
  }

  return {
    title: post.title,
    description:
      post.content.substring(0, 160) + (post.content.length > 160 ? "..." : ""),
  };
}

export default async function PostPage({ params }: Props) {
  const { id, slug } = await params;
  const postId = parseInt(id);

  if (isNaN(postId)) {
    notFound();
  }

  const post = await api.post.getById({ id: postId });

  if (!post) {
    notFound();
  }

  // Redirect if slug doesn't match
  if (post.slug !== slug) {
    redirect(`/post/${id}/${post.slug}`);
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getInitials = (firstName: string | null, lastName: string | null) => {
    const first = firstName?.charAt(0) ?? "";
    const last = lastName?.charAt(0) ?? "";
    return (first + last).toUpperCase() || "U";
  };

  const getAuthorName = (createdBy: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  }) => {
    if (createdBy.firstName && createdBy.lastName) {
      return `${createdBy.firstName} ${createdBy.lastName}`;
    }
    return createdBy.email;
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-16">
        {/* Back Button */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-purple-300 transition-colors hover:text-purple-200"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Home
          </Link>
        </div>

        {/* Post Content */}
        <article className="mx-auto max-w-4xl">
          <div className="mb-8">
            <h1 className="mb-6 text-4xl leading-tight font-bold">
              {post.title}
            </h1>

            {/* Author and Date */}
            <div className="flex items-center gap-4 text-gray-300">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500 text-sm font-bold">
                  {getInitials(
                    post.createdBy.firstName,
                    post.createdBy.lastName,
                  )}
                </div>
                <span className="font-medium">
                  {getAuthorName(post.createdBy)}
                </span>
              </div>
              <span className="text-gray-400">•</span>
              <time className="text-gray-400">
                {formatDate(post.createdAt)}
              </time>
              {post.updatedAt &&
                new Date(post.updatedAt).getTime() !==
                  new Date(post.createdAt).getTime() && (
                  <>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-400">
                      Updated {formatDate(post.updatedAt)}
                    </span>
                  </>
                )}
            </div>
          </div>

          {/* Post Content */}
          <div className="rounded-lg bg-slate-800 p-8">
            <div className="prose prose-invert max-w-none">
              <div className="leading-relaxed whitespace-pre-wrap text-gray-200">
                {post.content}
              </div>
            </div>
          </div>
        </article>
      </div>
    </main>
  );
}
