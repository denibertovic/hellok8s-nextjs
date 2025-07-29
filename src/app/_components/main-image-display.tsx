import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import type { Image } from "@/server/db/schema";
import { ProcessingOverlay } from "./processing-overlay";

interface MainImageDisplayProps {
  image: Image;
  currentImageSrc: string;
  isCropping: boolean;
  crop: Crop;
  imgRef: React.RefObject<HTMLImageElement | null>;
  isRotating: boolean;
  isWaitingForNewImage: boolean;
  cropMutationPending: boolean;
  onImageLoad: () => void;
  onCropChange: (crop: Crop) => void;
  onCropComplete: (crop: PixelCrop) => void;
}

export function MainImageDisplay({
  image,
  currentImageSrc,
  isCropping,
  crop,
  imgRef,
  isRotating,
  isWaitingForNewImage,
  cropMutationPending,
  onImageLoad,
  onCropChange,
  onCropComplete,
}: MainImageDisplayProps) {
  const showProcessingOverlay =
    isRotating || isWaitingForNewImage || (isCropping && cropMutationPending);

  return (
    <div className="absolute inset-0 flex items-center justify-center p-32 pt-40 pb-32">
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
        <div className="relative flex h-full w-full items-center justify-center">
          {isCropping ? (
            <ReactCrop
              crop={crop}
              onChange={onCropChange}
              onComplete={onCropComplete}
              aspect={undefined}
              minWidth={10}
              minHeight={10}
              keepSelection={true}
              ruleOfThirds={true}
              className="flex max-h-[70vh] max-w-[80vw] items-center justify-center"
              style={{ maxWidth: "80vw", maxHeight: "70vh" }}
            >
              <img
                ref={imgRef}
                src={currentImageSrc}
                alt={image.fileName}
                className="max-h-full max-w-full object-contain"
                onLoad={onImageLoad}
              />
            </ReactCrop>
          ) : (
            <img
              src={currentImageSrc}
              alt={image.fileName}
              className="max-h-[70vh] max-w-[80vw] object-contain"
              onLoad={onImageLoad}
            />
          )}

          <ProcessingOverlay
            isVisible={showProcessingOverlay}
            isRotating={isRotating}
            isCropping={isCropping && cropMutationPending}
          />
        </div>
      </div>
    </div>
  );
}
