"use client";

import { useState } from "react";
import { api, type RouterOutputs } from "@/trpc/react";
import { generateSlug } from "@/lib/utils/slug";

type PostListItem = RouterOutputs["post"]["getAll"][number];

export function PostManagement() {
  const [isCreating, setIsCreating] = useState(false);
  const [editingPost, setEditingPost] = useState<PostListItem | null>(null);
  const [showContent, setShowContent] = useState<Record<number, boolean>>({});
  const [createTitle, setCreateTitle] = useState("");
  const [editTitle, setEditTitle] = useState("");

  const utils = api.useUtils();

  const { data: posts, isLoading } = api.post.getAll.useQuery();

  const createPost = api.post.create.useMutation({
    onSuccess: async () => {
      await utils.post.getAll.invalidate();
      setIsCreating(false);
    },
  });

  const updatePost = api.post.update.useMutation({
    onSuccess: async () => {
      await utils.post.getAll.invalidate();
      setEditingPost(null);
    },
  });

  const deletePost = api.post.delete.useMutation({
    onSuccess: async () => {
      await utils.post.getAll.invalidate();
    },
  });

  const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get("title");
    const content = formData.get("content");

    if (
      typeof title === "string" &&
      typeof content === "string" &&
      title &&
      content
    ) {
      createPost.mutate({ title, content });
      setCreateTitle("");
    }
  };

  const handleUpdateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get("title");
    const content = formData.get("content");

    if (
      typeof title === "string" &&
      typeof content === "string" &&
      title &&
      content &&
      editingPost
    ) {
      updatePost.mutate({ id: editingPost.id, title, content });
      setEditTitle("");
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this post?")) {
      deletePost.mutate({ id });
    }
  };

  const toggleContent = (id: number) => {
    setShowContent((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (isLoading) {
    return <div className="text-center">Loading posts...</div>;
  }

  return (
    <div className="rounded-lg bg-slate-800 p-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Post Management</h2>
        <button
          onClick={() => setIsCreating(true)}
          className="rounded-lg bg-purple-600 px-4 py-2 font-medium text-white transition-colors hover:bg-purple-700"
        >
          Create Post
        </button>
      </div>

      {isCreating && (
        <div className="mb-6 rounded-lg bg-slate-700 p-6">
          <h3 className="mb-4 text-lg font-semibold">Create New Post</h3>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="title"
                className="mb-2 block text-sm font-medium text-gray-300"
              >
                Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                value={createTitle}
                onChange={(e) => setCreateTitle(e.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-slate-600 px-4 py-2 text-white"
                placeholder="Enter post title"
              />
              {createTitle && (
                <div className="mt-2 text-sm text-gray-400">
                  <span className="font-medium">URL Preview:</span> /post/
                  {"{id}"}/{generateSlug(createTitle)}
                </div>
              )}
            </div>
            <div>
              <label
                htmlFor="content"
                className="mb-2 block text-sm font-medium text-gray-300"
              >
                Content
              </label>
              <textarea
                id="content"
                name="content"
                required
                rows={6}
                className="w-full rounded-lg border border-slate-600 bg-slate-600 px-4 py-2 text-white"
                placeholder="Enter post content"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={createPost.isPending}
                className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white transition-colors hover:bg-green-700 disabled:bg-green-800"
              >
                {createPost.isPending ? "Creating..." : "Create Post"}
              </button>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="rounded-lg bg-gray-600 px-4 py-2 font-medium text-white transition-colors hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {editingPost && (
        <div className="mb-6 rounded-lg bg-slate-700 p-6">
          <h3 className="mb-4 text-lg font-semibold">Edit Post</h3>
          <form onSubmit={handleUpdateSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="edit-title"
                className="mb-2 block text-sm font-medium text-gray-300"
              >
                Title
              </label>
              <input
                type="text"
                id="edit-title"
                name="title"
                required
                value={editTitle || editingPost.title}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-slate-600 px-4 py-2 text-white"
              />
              <div className="mt-2 text-sm text-gray-400">
                <span className="font-medium">URL Preview:</span> /post/
                {editingPost.id}/{generateSlug(editTitle || editingPost.title)}
              </div>
            </div>
            <div>
              <label
                htmlFor="edit-content"
                className="mb-2 block text-sm font-medium text-gray-300"
              >
                Content
              </label>
              <textarea
                id="edit-content"
                name="content"
                required
                rows={6}
                defaultValue={editingPost.content}
                className="w-full rounded-lg border border-slate-600 bg-slate-600 px-4 py-2 text-white"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={updatePost.isPending}
                className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-blue-800"
              >
                {updatePost.isPending ? "Updating..." : "Update Post"}
              </button>
              <button
                type="button"
                onClick={() => setEditingPost(null)}
                className="rounded-lg bg-gray-600 px-4 py-2 font-medium text-white transition-colors hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {posts?.length === 0 ? (
          <p className="text-center text-gray-400">
            No posts yet. Create your first post!
          </p>
        ) : (
          posts?.map((post) => (
            <div key={post.id} className="rounded-lg bg-slate-700 p-6">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="mb-2 text-lg font-semibold">{post.title}</h3>
                  <p className="text-sm text-gray-400">
                    By{" "}
                    {post.createdBy
                      ? `${post.createdBy.firstName} ${post.createdBy.lastName} (${post.createdBy.email})`
                      : "Unknown Author"}
                  </p>
                  <p className="text-sm text-gray-400">
                    Created: {new Date(post.createdAt).toLocaleDateString()}
                    {post.updatedAt && (
                      <span>
                        {" "}
                        • Updated:{" "}
                        {new Date(post.updatedAt).toLocaleDateString()}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingPost(post)}
                    className="rounded-lg bg-blue-600 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(post.id)}
                    disabled={deletePost.isPending}
                    className="rounded-lg bg-red-600 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:bg-red-800"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="mb-2">
                <button
                  onClick={() => toggleContent(post.id)}
                  className="text-sm text-purple-400 hover:text-purple-300"
                >
                  {showContent[post.id] ? "Hide content" : "Show content"}
                </button>
              </div>

              {showContent[post.id] && (
                <div className="rounded-lg bg-slate-600 p-4 text-sm whitespace-pre-wrap">
                  {post.content}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
