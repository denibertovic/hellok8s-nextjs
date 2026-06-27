import fs from "fs/promises";
import path from "path";
import { env } from "@/env";

export interface UploadResult {
  path: string;
  fileName: string;
  fileSize: number;
}

export interface StorageProvider {
  upload(file: File, fileName: string): Promise<UploadResult>;
  delete(filePath: string): Promise<void>;
  exists(filePath: string): Promise<boolean>;
  getUrl(filePath: string): string;
}

export class LocalStorageProvider implements StorageProvider {
  private _uploadPath: string | undefined;

  // Resolve the upload path lazily on first use rather than in the constructor.
  // The module is imported at build time (page-data collection) where
  // SKIP_ENV_VALIDATION=1 leaves UPLOAD_PATH undefined; resolving here defers
  // that to runtime, where the env var is actually provided.
  private get uploadPath(): string {
    this._uploadPath ??= path.resolve(env.UPLOAD_PATH);
    return this._uploadPath;
  }

  async upload(file: File, fileName: string): Promise<UploadResult> {
    // Ensure upload directory exists
    await fs.mkdir(this.uploadPath, { recursive: true });

    const filePath = path.join(this.uploadPath, fileName);
    const buffer = Buffer.from(await file.arrayBuffer());

    await fs.writeFile(filePath, buffer);

    return {
      path: filePath,
      fileName,
      fileSize: buffer.length,
    };
  }

  async delete(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      // File might not exist, which is fine
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  getUrl(filePath: string): string {
    // Return relative path from upload directory for local storage
    return path.relative(this.uploadPath, filePath);
  }
}

// Default storage provider - can be switched to S3 later
export const storageProvider: StorageProvider = new LocalStorageProvider();
