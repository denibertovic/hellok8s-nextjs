interface ProcessingOverlayProps {
  isVisible: boolean;
  isRotating: boolean;
  isCropping: boolean;
}

export function ProcessingOverlay({
  isVisible,
  isRotating,
  isCropping: _isCropping,
}: ProcessingOverlayProps) {
  if (!isVisible) {
    return null;
  }

  return (
    <div className="bg-opacity-50 absolute inset-0 flex items-center justify-center bg-black">
      <div className="flex flex-col items-center space-y-2">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        <span className="text-sm text-white">
          {isRotating ? "Rotating image..." : "Cropping image..."}
        </span>
      </div>
    </div>
  );
}
