import { LoginForm } from "@/app/_components/login-form";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      {/* Back Button */}
      <div className="absolute top-8 left-8">
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

      <div className="mx-auto w-full max-w-md px-4">
        <div className="rounded-lg bg-slate-800 p-8 shadow-xl">
          <h1 className="mb-8 text-center text-3xl font-bold">Admin Login</h1>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
