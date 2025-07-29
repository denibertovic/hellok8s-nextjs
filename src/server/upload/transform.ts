import sharp from "sharp";
import path from "path";
import { storageProvider } from "./storage";
import { generateThumbnailName } from "./utils";

export interface ThumbnailOptions {
  width: number;
  height: number;
  quality?: number;
  format?: "jpeg" | "png" | "webp";
}

export interface CropOptions {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class ImageTransformService {
  private async getSourceFile(originalPath: string): Promise<string> {
    const ext = path.extname(originalPath);
    const name = path.basename(originalPath, ext);
    const transformedName = `${name}_transformed${ext}`;
    const transformedPath = path.join(
      path.dirname(originalPath),
      transformedName,
    );

    // Check if transformed version exists, otherwise use original
    if (await storageProvider.exists(transformedPath)) {
      return transformedPath;
    }
    return originalPath;
  }

  private async deleteTransformedThumbnails(
    originalPath: string,
  ): Promise<void> {
    const ext = path.extname(originalPath);
    const name = path.basename(originalPath, ext);
    const baseDir = path.dirname(originalPath);

    // Delete all transformed thumbnails (they start with name_transformed_thumbnail_)
    const fs = await import("fs/promises");
    try {
      const files = await fs.readdir(baseDir);
      const thumbnailPattern = `${name}_transformed_thumbnail_`;

      for (const file of files) {
        if (file.startsWith(thumbnailPattern)) {
          const filePath = path.join(baseDir, file);
          await storageProvider.delete(filePath);
        }
      }
    } catch (error) {
      // Directory might not exist or other issues, but we can continue
      console.warn("Error cleaning up transformed thumbnails:", error);
    }
  }

  async deleteThumbnails(originalPath: string): Promise<void> {
    const ext = path.extname(originalPath);
    const name = path.basename(originalPath, ext);
    const baseDir = path.dirname(originalPath);

    // Delete all thumbnails (both original and transformed)
    const fs = await import("fs/promises");
    try {
      const files = await fs.readdir(baseDir);
      const originalThumbnailPattern = `${name}_thumbnail_`;
      const transformedThumbnailPattern = `${name}_transformed_thumbnail_`;

      for (const file of files) {
        if (
          file.startsWith(originalThumbnailPattern) ||
          file.startsWith(transformedThumbnailPattern)
        ) {
          const filePath = path.join(baseDir, file);
          await storageProvider.delete(filePath);
        }
      }
    } catch (error) {
      // Directory might not exist or other issues, but we can continue
      console.warn("Error cleaning up thumbnails:", error);
    }
  }

  async createThumbnail(
    originalPath: string,
    options: ThumbnailOptions,
  ): Promise<string> {
    const { width, height, quality = 80, format = "jpeg" } = options;

    // Determine if we should use transformed version
    const sourceFile = await this.getSourceFile(originalPath);
    const isTransformed = sourceFile !== originalPath;

    const originalName = path.basename(originalPath);
    const thumbnailName = generateThumbnailName(
      originalName,
      width,
      height,
      isTransformed,
    );
    const thumbnailPath = path.join(path.dirname(originalPath), thumbnailName);

    // Check if thumbnail already exists
    if (await storageProvider.exists(thumbnailPath)) {
      return thumbnailPath;
    }

    // Create thumbnail from the appropriate source
    const image = sharp(sourceFile);

    await image
      .resize(width, height, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .toFormat(format, { quality })
      .toFile(thumbnailPath);

    return thumbnailPath;
  }

  async rotateImage(originalPath: string, degrees: number): Promise<string> {
    const ext = path.extname(originalPath);
    const name = path.basename(originalPath, ext);
    const transformedName = `${name}_transformed${ext}`;
    const transformedPath = path.join(
      path.dirname(originalPath),
      transformedName,
    );

    // Use the current transformed version if it exists, otherwise use original
    const sourceFile = await this.getSourceFile(originalPath);

    // If source and destination are the same, use a temporary file
    if (sourceFile === transformedPath) {
      const tempPath = path.join(
        path.dirname(originalPath),
        `${name}_temp${ext}`,
      );
      await sharp(sourceFile).rotate(degrees).toFile(tempPath);

      // Replace the transformed file with the temp file
      const fs = await import("fs/promises");
      await fs.rename(tempPath, transformedPath);
    } else {
      await sharp(sourceFile).rotate(degrees).toFile(transformedPath);
    }

    // Delete old transformed thumbnails so they get regenerated from the new transformed image
    await this.deleteTransformedThumbnails(originalPath);

    return transformedPath;
  }

  async cropImage(originalPath: string, options: CropOptions): Promise<string> {
    const { x, y, width, height } = options;
    const ext = path.extname(originalPath);
    const name = path.basename(originalPath, ext);
    const transformedName = `${name}_transformed${ext}`;
    const transformedPath = path.join(
      path.dirname(originalPath),
      transformedName,
    );

    // Use the current transformed version if it exists, otherwise use original
    const sourceFile = await this.getSourceFile(originalPath);

    // If source and destination are the same, use a temporary file
    if (sourceFile === transformedPath) {
      const tempPath = path.join(
        path.dirname(originalPath),
        `${name}_temp${ext}`,
      );
      await sharp(sourceFile)
        .extract({ left: x, top: y, width, height })
        .toFile(tempPath);

      // Replace the transformed file with the temp file
      const fs = await import("fs/promises");
      await fs.rename(tempPath, transformedPath);
    } else {
      await sharp(sourceFile)
        .extract({ left: x, top: y, width, height })
        .toFile(transformedPath);
    }

    // Delete old transformed thumbnails so they get regenerated from the new transformed image
    await this.deleteTransformedThumbnails(originalPath);

    return transformedPath;
  }

  async getImageInfo(filePath: string): Promise<{
    width: number;
    height: number;
    format?: string;
    size: number;
  }> {
    const metadata = await sharp(filePath).metadata();
    const fs = await import("fs/promises");
    const stats = await fs.stat(filePath);

    return {
      width: metadata.width ?? 0,
      height: metadata.height ?? 0,
      format: metadata.format,
      size: stats.size,
    };
  }
}

export const imageTransformService = new ImageTransformService();
