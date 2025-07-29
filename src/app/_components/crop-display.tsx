import type { Crop } from "react-image-crop";

interface CropDisplayProps {
  crop: Crop;
  imgRef: React.RefObject<HTMLImageElement | null>;
}

export function CropDisplay({ crop, imgRef }: CropDisplayProps) {
  if (!crop || !imgRef.current) {
    return null;
  }

  return (
    <div className="bg-opacity-80 absolute right-6 bottom-6 z-10 rounded-lg bg-black p-4">
      <h4 className="mb-2 text-sm font-medium text-white">Crop Selection</h4>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-300">Position:</span>{" "}
          <span className="font-mono text-white">
            {crop.unit === "%"
              ? Math.round((crop.x / 100) * imgRef.current.naturalWidth)
              : Math.round(
                  crop.x * (imgRef.current.naturalWidth / imgRef.current.width),
                )}
            ,
            {crop.unit === "%"
              ? Math.round((crop.y / 100) * imgRef.current.naturalHeight)
              : Math.round(
                  crop.y *
                    (imgRef.current.naturalHeight / imgRef.current.height),
                )}
          </span>
        </div>
        <div>
          <span className="text-gray-300">Size:</span>{" "}
          <span className="font-mono text-white">
            {crop.unit === "%"
              ? Math.round((crop.width / 100) * imgRef.current.naturalWidth)
              : Math.round(
                  crop.width *
                    (imgRef.current.naturalWidth / imgRef.current.width),
                )}{" "}
            ×{" "}
            {crop.unit === "%"
              ? Math.round((crop.height / 100) * imgRef.current.naturalHeight)
              : Math.round(
                  crop.height *
                    (imgRef.current.naturalHeight / imgRef.current.height),
                )}
          </span>
        </div>
      </div>
    </div>
  );
}
