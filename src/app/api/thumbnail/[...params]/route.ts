import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { images } from "@/server/db/schema";
import { imageTransformService } from "@/server/upload/transform";
import { parseThumbParams } from "@/server/upload/utils";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ params: string[] }> },
) {
  try {
    const { params: pathParams } = await params;
    const [dimensions, fileName] = pathParams;

    if (!dimensions || !fileName) {
      return NextResponse.json(
        { error: "Invalid thumbnail URL format" },
        { status: 400 },
      );
    }

    // Parse dimensions (e.g., "300x200")
    const thumbParams = parseThumbParams(dimensions);
    if (!thumbParams) {
      return NextResponse.json(
        { error: "Invalid dimensions format" },
        { status: 400 },
      );
    }

    // Find the image in database
    const image = await db
      .select()
      .from(images)
      .where(eq(images.fileName, fileName))
      .limit(1);

    if (!image[0]) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    const currentPath = image[0].transformedPath ?? image[0].originalPath;

    // Generate thumbnail
    const thumbnailPath = await imageTransformService.createThumbnail(
      currentPath,
      {
        width: thumbParams.width,
        height: thumbParams.height,
      },
    );

    // Read and return the thumbnail file
    const fs = await import("fs/promises");
    const fileBuffer = await fs.readFile(thumbnailPath);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": image[0].mimeType,
        "Cache-Control": "public, max-age=31536000", // Cache for 1 year
      },
    });
  } catch (error) {
    console.error("Thumbnail generation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
