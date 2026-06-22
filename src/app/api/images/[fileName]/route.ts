import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { images } from "@/server/db/schema";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileName: string }> },
) {
  try {
    const { fileName } = await params;

    // Find the image in database
    const image = await db
      .select()
      .from(images)
      .where(eq(images.fileName, fileName))
      .limit(1);

    if (!image[0]) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    const imagePath = image[0].transformedPath ?? image[0].originalPath;

    // Read and return the image file
    const fs = await import("fs/promises");
    const fileBuffer = await fs.readFile(imagePath);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": image[0].mimeType,
        "Cache-Control": "public, max-age=31536000", // Cache for 1 year
      },
    });
  } catch (error) {
    console.error("Image serving error:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : "No stack trace",
    });
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
