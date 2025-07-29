"use client";

import { useState, useCallback, useEffect } from "react";
import { api } from "@/trpc/react";
import { ImageUpload } from "./image-upload";
import { ImageViewer } from "./image-viewer";
import type { Image } from "@/server/db/schema";

export function ImageGallery() {
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const { data: images, refetch, isLoading } = api.image.getAll.useQuery();

  const handleImageSelect = useCallback(
    (image: Image) => {
      const index = images?.findIndex((img) => img.id === image.id) ?? 0;
      setSelectedImage(image);
      setSelectedIndex(index);
    },
    [images],
  );

  const handleImageClose = useCallback(() => {
    setSelectedImage(null);
  }, []);

  const handleNavigate = useCallback(
    (index: number) => {
      if (images && index >= 0 && index < images.length) {
        setSelectedImage(images[index]);
        setSelectedIndex(index);
      }
    },
    [images],
  );

  const handleUploadSuccess = useCallback(() => {
    void refetch();
  }, [refetch]);

  // Update selectedImage when images are refetched to ensure it has the latest data
  useEffect(() => {
    if (selectedImage && images) {
      const updatedImage = images.find((img) => img.id === selectedImage.id);
      if (updatedImage) {
        setSelectedImage(updatedImage);
      }
    }
  }, [images, selectedImage]);

  return (
    <div className="space-y-8">
      {/* Upload Section */}
      <div className="rounded-lg bg-slate-800 p-6">
        <h2 className="mb-4 text-xl font-semibold">Upload Images</h2>
        <ImageUpload onUploadSuccess={handleUploadSuccess} />
      </div>

      {/* Gallery Grid */}
      <div className="rounded-lg bg-slate-800 p-6">
        <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold">
          Gallery{" "}
          {isLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-500 border-t-transparent"></div>
          ) : (
            `(${images?.length ?? 0} images)`
          )}
        </h2>

        {!images || images.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <svg
              className="mx-auto mb-4 h-16 w-16"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-lg">No images uploaded yet</p>
            <p className="text-sm">Upload some images to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {images?.map((image) => (
              <div
                key={image.id}
                className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg bg-slate-700 transition-transform hover:scale-105"
                onClick={() => handleImageSelect(image)}
              >
                <img
                  src={`/api/thumbnail/150x150/${image.fileName}${image.transformedPath ? `?t=${image.updatedAt?.getTime() ?? Date.now()}` : ""}`}
                  alt={image.fileName}
                  className="h-full w-full object-cover"
                  style={{ zIndex: 1 }}
                />

                <div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black to-transparent p-2">
                  <p className="truncate text-xs text-white">
                    {image.fileName}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Image Viewer Modal */}
      {selectedImage && images && (
        <ImageViewer
          image={selectedImage}
          images={images}
          currentIndex={selectedIndex}
          onClose={handleImageClose}
          onImageUpdate={handleUploadSuccess}
          onNavigate={handleNavigate}
        />
      )}
    </div>
  );
}
