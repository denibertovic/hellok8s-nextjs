"use client";

import { api, type RouterOutputs } from "@/trpc/react";
import Link from "next/link";

type PostListItem = RouterOutputs["post"]["getAll"][number];

export function LatestPosts() {
  const { data: posts, isLoading, error } = api.post.getAll.useQuery();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-8 text-3xl font-bold">Latest Posts</h2>
        <div className="rounded-lg bg-slate-800 p-6">
          <div className="animate-pulse">
            <div className="mb-4 h-6 w-3/4 rounded bg-slate-700"></div>
            <div className="mb-4 space-y-2">
              <div className="h-4 w-full rounded bg-slate-700"></div>
              <div className="h-4 w-full rounded bg-slate-700"></div>
              <div className="h-4 w-2/3 rounded bg-slate-700"></div>
            </div>
            <div className="flex items-center justify-between">
              <div className="h-4 w-20 rounded bg-slate-700"></div>
              <div className="h-4 w-32 rounded bg-slate-700"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-8 text-3xl font-bold">Latest Posts</h2>
        <div className="rounded-lg bg-slate-800 p-6 text-center">
          <p className="text-red-400">Error loading posts: {error.message}</p>
        </div>
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-8 text-3xl font-bold">Latest Posts</h2>
        <div className="rounded-lg bg-slate-800 p-6 text-center">
          <h3 className="mb-4 text-xl font-semibold text-gray-300">
            No posts yet
          </h3>
          <p className="text-gray-400">
            Be the first to create a post! Visit the{" "}
            <Link
              href="/admin"
              className="text-purple-300 hover:text-purple-200"
            >
              admin dashboard
            </Link>{" "}
            to get started.
          </p>
        </div>
      </div>
    );
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

  const getAuthorName = (createdBy: PostListItem["createdBy"]) => {
    if (createdBy.firstName && createdBy.lastName) {
      return `${createdBy.firstName} ${createdBy.lastName}`;
    }
    return createdBy.email;
  };

  const truncateContent = (content: string, maxLength = 200) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  return (
    <div className="mx-auto max-w-4xl">
      <h2 className="mb-8 text-3xl font-bold">Latest Posts</h2>
      <div className="space-y-6">
        {posts.slice(0, 3).map((post) => (
          <article key={post.id} className="rounded-lg bg-slate-800 p-6">
            <h3 className="mb-4 text-xl font-semibold">{post.title}</h3>
            <p className="mb-4 text-gray-300">
              {truncateContent(post.content)}
            </p>
            <div className="flex items-center justify-between">
              <Link
                href={`/post/${post.id}/${post.slug}`}
                className="font-medium text-purple-300 transition-colors hover:text-purple-200"
              >
                Read more
              </Link>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500 text-xs font-bold">
                  {post.createdBy
                    ? getInitials(
                        post.createdBy.firstName,
                        post.createdBy.lastName,
                      )
                    : "?"}
                </div>
                <span>
                  {post.createdBy
                    ? getAuthorName(post.createdBy)
                    : "Unknown Author"}{" "}
                  • {formatDate(post.createdAt)}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
