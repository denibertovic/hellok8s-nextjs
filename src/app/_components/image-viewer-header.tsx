import type { Image } from "@/server/db/schema";

interface ImageViewerHeaderProps {
  image: Image;
  currentIndex: number;
  totalImages: number;
}

export function ImageViewerHeader({
  image,
  currentIndex,
  totalImages,
}: ImageViewerHeaderProps) {
  return (
    <>
      {/* Top centered counter */}
      <div className="absolute top-6 left-1/2 z-20 -translate-x-1/2">
        <span className="bg-opacity-70 rounded-full bg-black px-4 py-2 text-sm font-medium text-white">
          {currentIndex + 1} / {totalImages}
        </span>
      </div>

      {/* Image info header */}
      <div className="absolute top-6 left-6 z-10">
        <div className="bg-opacity-70 rounded-lg bg-black px-4 py-2">
          <h2 className="text-lg font-medium text-white">
            {image.fileName.length > 32
              ? `${image.fileName.substring(0, 32)}...`
              : image.fileName}
          </h2>
          <p className="text-sm text-gray-300">
            {image.width}×{image.height} • {Math.round(image.fileSize / 1024)}KB
          </p>
        </div>
      </div>
    </>
  );
}
