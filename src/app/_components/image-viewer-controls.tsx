interface ImageViewerControlsProps {
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
}

export function ImageViewerControls({
  onClose,
  onPrevious,
  onNext,
}: ImageViewerControlsProps) {
  return (
    <>
      {/* Close button */}
      <button
        onClick={onClose}
        className="bg-opacity-70 hover:bg-opacity-90 absolute top-6 right-6 z-20 rounded-full bg-black p-3 text-white"
        title="Close (ESC)"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      {/* Large left arrow */}
      <button
        onClick={onPrevious}
        className="bg-opacity-70 hover:bg-opacity-90 absolute top-1/2 left-6 z-20 -translate-y-1/2 rounded-full bg-black p-4 text-white"
        title="Previous image (←)"
      >
        <svg
          className="h-8 w-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      {/* Large right arrow */}
      <button
        onClick={onNext}
        className="bg-opacity-70 hover:bg-opacity-90 absolute top-1/2 right-6 z-20 -translate-y-1/2 rounded-full bg-black p-4 text-white"
        title="Next image (→)"
      >
        <svg
          className="h-8 w-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>
    </>
  );
}
