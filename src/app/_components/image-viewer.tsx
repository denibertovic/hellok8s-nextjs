"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { api } from "@/trpc/react";
import type { Image } from "@/server/db/schema";
import { type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { ImageViewerHeader } from "./image-viewer-header";
import { ImageViewerControls } from "./image-viewer-controls";
import { ImageViewerActions } from "./image-viewer-actions";
import { CropDisplay } from "./crop-display";
import { MainImageDisplay } from "./main-image-display";

interface ImageViewerProps {
  image: Image;
  images: Image[];
  currentIndex: number;
  onClose: () => void;
  onImageUpdate: () => void;
  onNavigate: (index: number) => void;
}

export function ImageViewer({
  image,
  images,
  currentIndex,
  onClose,
  onImageUpdate,
  onNavigate,
}: ImageViewerProps) {
  const [isCropping, setIsCropping] = useState(false);
  const [crop, setCrop] = useState<Crop>({
    unit: "%",
    x: 25,
    y: 25,
    width: 50,
    height: 50,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);

  const [currentImageSrc, setCurrentImageSrc] = useState(
    `/api/images/${image.fileName}${image.transformedPath ? `?t=${image.updatedAt?.getTime() ?? Date.now()}` : ""}`,
  );
  const [isRotating, setIsRotating] = useState(false);
  const [isWaitingForNewImage, setIsWaitingForNewImage] = useState(false);

  // Update image source when image prop changes (e.g., after refetch)
  useEffect(() => {
    setCurrentImageSrc(
      `/api/images/${image.fileName}${image.transformedPath ? `?t=${image.updatedAt?.getTime() ?? Date.now()}` : ""}`,
    );
  }, [image.fileName, image.transformedPath, image.updatedAt]);

  const rotateMutation = api.image.rotate.useMutation({
    onSuccess: () => {
      // Don't hide spinner yet, wait for new image to load
      setIsWaitingForNewImage(true);
      // Add cache-busting parameter to force image reload
      setCurrentImageSrc(`/api/images/${image.fileName}?t=${Date.now()}`);
      onImageUpdate();
    },
    onError: (error) => {
      setIsRotating(false);
      setIsWaitingForNewImage(false);
      alert("Rotation failed: " + error.message);
    },
  });

  const cropMutation = api.image.crop.useMutation({
    onSuccess: () => {
      // Don't hide spinner yet, wait for new image to load
      setIsWaitingForNewImage(true);
      // Add cache-busting parameter to force image reload
      setCurrentImageSrc(`/api/images/${image.fileName}?t=${Date.now()}`);
      onImageUpdate();
      setIsCropping(false);
    },
    onError: (error) => {
      alert("Crop failed: " + error.message);
    },
  });

  const deleteMutation = api.image.delete.useMutation({
    onSuccess: () => {
      onImageUpdate();
      onClose();
    },
    onError: (error) => {
      alert("Delete failed: " + error.message);
    },
  });

  const handleRotate = useCallback(
    (degrees: number) => {
      setIsRotating(true);
      rotateMutation.mutate({ id: image.id, degrees });
    },
    [image.id, rotateMutation.mutate],
  );

  const handleCropStart = useCallback(() => {
    setIsCropping(true);
    // Reset crop when starting
    setCompletedCrop(undefined);
    setCrop({
      unit: "%",
      x: 10,
      y: 10,
      width: 80,
      height: 80,
    });
  }, []);

  const handleCropApply = useCallback(() => {
    const currentCrop = completedCrop ?? crop;
    if (!imgRef.current || !currentCrop) {
      return;
    }

    const img = imgRef.current;

    // Calculate the actual pixel coordinates based on the displayed image dimensions
    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;

    // Convert percentage crop to pixel crop if needed
    let pixelCrop;
    if (currentCrop.unit === "%") {
      pixelCrop = {
        x: Math.round((currentCrop.x / 100) * img.naturalWidth),
        y: Math.round((currentCrop.y / 100) * img.naturalHeight),
        width: Math.round((currentCrop.width / 100) * img.naturalWidth),
        height: Math.round((currentCrop.height / 100) * img.naturalHeight),
      };
    } else {
      pixelCrop = {
        x: Math.round(currentCrop.x * scaleX),
        y: Math.round(currentCrop.y * scaleY),
        width: Math.round(currentCrop.width * scaleX),
        height: Math.round(currentCrop.height * scaleY),
      };
    }

    cropMutation.mutate({
      id: image.id,
      x: pixelCrop.x,
      y: pixelCrop.y,
      width: pixelCrop.width,
      height: pixelCrop.height,
    });
  }, [image.id, crop, completedCrop, cropMutation.mutate]);

  const handleCropCancel = useCallback(() => {
    setIsCropping(false);
    setCompletedCrop(undefined);
  }, []);

  // Handle image load - for both crop initialization and hiding transformation spinners
  const onImageLoad = useCallback(() => {
    if (isCropping) {
      const margin = 0.1; // 10%
      setCrop({
        unit: "%",
        x: margin * 100,
        y: margin * 100,
        width: (1 - 2 * margin) * 100,
        height: (1 - 2 * margin) * 100,
      });
    }

    // Hide transformation spinners once new image loads
    if (isWaitingForNewImage || isRotating) {
      setIsRotating(false);
      setIsWaitingForNewImage(false);
    }
  }, [isCropping, isWaitingForNewImage, isRotating]);

  const handleDelete = useCallback(() => {
    if (confirm("Are you sure you want to delete this image?")) {
      deleteMutation.mutate({ id: image.id });
    }
  }, [image.id, deleteMutation.mutate]);

  // Navigation handlers with cycling
  const handlePreviousImage = useCallback(() => {
    const newIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
    onNavigate(newIndex);
  }, [currentIndex, images.length, onNavigate]);

  const handleNextImage = useCallback(() => {
    const newIndex = currentIndex === images.length - 1 ? 0 : currentIndex + 1;
    onNavigate(newIndex);
  }, [currentIndex, images.length, onNavigate]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't handle arrow keys in crop mode to avoid interfering with crop controls
      if (
        isCropping &&
        (event.key === "ArrowLeft" || event.key === "ArrowRight")
      ) {
        return;
      }

      switch (event.key) {
        case "Escape":
          if (isCropping) {
            // Exit crop mode
            handleCropCancel();
          } else {
            // Close modal
            onClose();
          }
          break;
        case "ArrowLeft":
          event.preventDefault();
          handlePreviousImage();
          break;
        case "ArrowRight":
          event.preventDefault();
          handleNextImage();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    isCropping,
    handleCropCancel,
    onClose,
    handlePreviousImage,
    handleNextImage,
  ]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <ImageViewerHeader
        image={image}
        currentIndex={currentIndex}
        totalImages={images.length}
      />

      <ImageViewerControls
        onClose={onClose}
        onPrevious={handlePreviousImage}
        onNext={handleNextImage}
      />

      <MainImageDisplay
        image={image}
        currentImageSrc={currentImageSrc}
        isCropping={isCropping}
        crop={crop}
        imgRef={imgRef}
        isRotating={isRotating}
        isWaitingForNewImage={isWaitingForNewImage}
        cropMutationPending={cropMutation.isPending}
        onImageLoad={onImageLoad}
        onCropChange={(c) => setCrop(c)}
        onCropComplete={(c) => setCompletedCrop(c)}
      />

      {isCropping && crop && imgRef.current && (
        <CropDisplay crop={crop} imgRef={imgRef} />
      )}

      <ImageViewerActions
        isCropping={isCropping}
        isRotating={isRotating}
        cropMutationPending={cropMutation.isPending}
        rotateMutationPending={rotateMutation.isPending}
        deleteMutationPending={deleteMutation.isPending}
        onRotate={handleRotate}
        onCropStart={handleCropStart}
        onCropApply={handleCropApply}
        onCropCancel={handleCropCancel}
        onDelete={handleDelete}
        canApplyCrop={!!crop}
      />
    </div>
  );
}
