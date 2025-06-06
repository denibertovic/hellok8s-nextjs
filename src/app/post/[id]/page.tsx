import { notFound, redirect } from "next/navigation";
import { api } from "@/trpc/server";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
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

  return {
    title: post.title,
    description:
      post.content.substring(0, 160) + (post.content.length > 160 ? "..." : ""),
  };
}

export default async function PostPage({ params }: Props) {
  const { id } = await params;
  const postId = parseInt(id);

  if (isNaN(postId)) {
    notFound();
  }

  const post = await api.post.getById({ id: postId });

  if (!post) {
    notFound();
  }

  // Redirect to new URL format with slug
  redirect(`/post/${id}/${post.slug}`);
}
