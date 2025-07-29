import { auth } from "@/server/auth";
import { ImageGallery } from "@/app/_components/image-gallery";
import Link from "next/link";

export default async function GalleryPage() {
  await auth(); // Auth check handled by middleware

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-16">
        {/* Back Button */}
        <div className="mb-8">
          <Link
            href="/admin"
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
            Back to Admin
          </Link>
        </div>

        <div className="mx-auto max-w-6xl">
          <h1 className="mb-8 text-center text-4xl font-bold">Image Gallery</h1>

          <ImageGallery />
        </div>
      </div>
    </div>
  );
}
