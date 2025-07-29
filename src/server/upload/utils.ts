import path from "path";
import sharp from "sharp";

export function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2);
  const ext = path.extname(originalName);
  const name = path.basename(originalName, ext);
  return `${name}_${timestamp}_${random}${ext}`;
}

export function generateThumbnailName(
  originalName: string,
  width: number,
  height: number,
  isTransformed = false,
): string {
  const ext = path.extname(originalName);
  const name = path.basename(originalName, ext);
  const suffix = isTransformed ? "_transformed" : "";
  return `${name}${suffix}_thumbnail_${width}_${height}${ext}`;
}

export function validateImageFile(file: File): void {
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

  if (!allowedTypes.includes(file.type)) {
    throw new Error(
      "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.",
    );
  }

  // 10MB limit
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error("File size too large. Maximum size is 10MB.");
  }
}

export async function getImageDimensions(filePath: string): Promise<{
  width: number;
  height: number;
}> {
  const metadata = await sharp(filePath).metadata();
  return {
    width: metadata.width ?? 0,
    height: metadata.height ?? 0,
  };
}

export function parseThumbParams(
  params: string,
): { width: number; height: number } | null {
  // Parse thumbor-style URL params like "300x200" or "300x200/filters:quality(80)"
  const regex = /(\d+)x(\d+)/;
  const match = regex.exec(params);
  if (!match) return null;

  return {
    width: parseInt(match[1]!),
    height: parseInt(match[2]!),
  };
}
