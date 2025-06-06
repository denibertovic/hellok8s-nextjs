import { DebugContent } from "@/app/_components/debug-content";
import Link from "next/link";

export default function DebugPage() {
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

        {/* Header */}
        <div className="mb-16 text-center">
          <h1 className="mb-6 text-4xl font-bold">Debug Information</h1>
          <p className="text-xl text-gray-200">
            System and environment information
          </p>
        </div>

        {/* Debug Content */}
        <DebugContent />
      </div>
    </main>
  );
}
