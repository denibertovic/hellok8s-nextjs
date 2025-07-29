"use client";

import { useState, useCallback } from "react";
import { api } from "@/trpc/react";

interface ImageUploadProps {
  onUploadSuccess: () => void;
}

export function ImageUpload({ onUploadSuccess }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState<string[]>([]);

  const uploadMutation = api.image.upload.useMutation({
    onSuccess: () => {
      onUploadSuccess();
    },
    onError: (error) => {
      console.error("Upload failed:", error);
      alert("Upload failed: " + error.message);
    },
    onSettled: (_, __, variables) => {
      setUploading((prev) =>
        prev.filter((name) => name !== variables.fileName),
      );
    },
  });

  const handleFiles = useCallback(
    async (files: FileList) => {
      const validFiles = Array.from(files).filter((file) => {
        const isImage = file.type.startsWith("image/");
        const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB

        if (!isImage) {
          alert(`${file.name} is not an image file`);
          return false;
        }

        if (!isValidSize) {
          alert(`${file.name} is too large (max 10MB)`);
          return false;
        }

        return true;
      });

      for (const file of validFiles) {
        setUploading((prev) => [...prev, file.name]);

        try {
          // Convert file to base64
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve, reject) => {
            reader.onload = () => {
              const result = reader.result as string;
              // Remove data:image/jpeg;base64, prefix
              const base64 = result.split(",")[1];
              if (base64) {
                resolve(base64);
              } else {
                reject(new Error("Failed to convert file to base64"));
              }
            };
            reader.onerror = () =>
              reject(new Error(reader.error?.message ?? "Failed to read file"));
          });

          reader.readAsDataURL(file);
          const fileData = await base64Promise;

          await uploadMutation.mutateAsync({
            fileName: file.name,
            fileData,
            mimeType: file.type,
          });
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);
          setUploading((prev) => prev.filter((name) => name !== file.name));
        }
      }
    },
    [uploadMutation.mutateAsync],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        void handleFiles(files);
      }
    },
    [handleFiles],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        void handleFiles(files);
      }
      // Reset input so same file can be selected again
      e.target.value = "";
    },
    [handleFiles],
  );

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        className={`relative rounded-lg border-2 border-dashed transition-colors ${
          isDragging
            ? "border-purple-400 bg-purple-900/20"
            : "border-gray-600 hover:border-gray-500"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInput}
          className="absolute inset-0 cursor-pointer opacity-0"
        />

        <div className="p-8 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>

          <p className="mt-2 text-lg font-medium">
            {isDragging ? "Drop images here" : "Upload Images"}
          </p>

          <p className="mt-1 text-sm text-gray-400">
            Drag and drop images, or click to select files
          </p>

          <p className="mt-2 text-xs text-gray-500">
            Supports JPEG, PNG, GIF, WebP • Max 10MB per file
          </p>
        </div>
      </div>

      {/* Upload Progress */}
      {uploading.length > 0 && (
        <div className="rounded-lg bg-slate-700 p-4">
          <h3 className="mb-2 text-sm font-medium">Uploading...</h3>
          <div className="space-y-1">
            {uploading.map((fileName) => (
              <div key={fileName} className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-500 border-t-transparent"></div>
                <span className="truncate text-sm">{fileName}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
