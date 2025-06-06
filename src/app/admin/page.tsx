import { auth } from "@/server/auth";
import { PostManagement } from "@/app/_components/post-management";
import { SignOutButton } from "@/app/_components/sign-out-button";
import Link from "next/link";

export default async function AdminPage() {
  // Auth is handled by middleware, so we can safely get the session
  const session = await auth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
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

        <div className="mx-auto max-w-2xl">
          <h1 className="mb-8 text-center text-4xl font-bold">
            Admin Dashboard
          </h1>

          <div className="rounded-lg bg-slate-800 p-8">
            <h2 className="mb-6 text-2xl font-semibold">User Information</h2>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-300">
                  First Name
                </label>
                <div className="rounded-lg bg-slate-700 px-4 py-2">
                  {session!.user.firstName ?? "Not provided"}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-300">
                  Last Name
                </label>
                <div className="rounded-lg bg-slate-700 px-4 py-2">
                  {session!.user.lastName ?? "Not provided"}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-300">
                  Email
                </label>
                <div className="rounded-lg bg-slate-700 px-4 py-2">
                  {session!.user.email}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-300">
                  User ID
                </label>
                <div className="rounded-lg bg-slate-700 px-4 py-2 font-mono text-sm">
                  {session!.user.id}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-300">
                  Superuser Status
                </label>
                <div className="rounded-lg bg-slate-700 px-4 py-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      session!.user.isSuperuser
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {session!.user.isSuperuser
                      ? "✓ Superuser"
                      : "✗ Regular User"}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <SignOutButton />
            </div>
          </div>

          <div className="mt-8">
            <PostManagement />
          </div>
        </div>
      </div>
    </div>
  );
}
