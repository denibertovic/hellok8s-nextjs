interface ImageViewerActionsProps {
  isCropping: boolean;
  isRotating: boolean;
  cropMutationPending: boolean;
  rotateMutationPending: boolean;
  deleteMutationPending: boolean;
  onRotate: (degrees: number) => void;
  onCropStart: () => void;
  onCropApply: () => void;
  onCropCancel: () => void;
  onDelete: () => void;
  canApplyCrop: boolean;
}

export function ImageViewerActions({
  isCropping,
  isRotating,
  cropMutationPending,
  rotateMutationPending,
  deleteMutationPending,
  onRotate,
  onCropStart,
  onCropApply,
  onCropCancel,
  onDelete,
  canApplyCrop,
}: ImageViewerActionsProps) {
  return (
    <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2">
      <div className="flex flex-wrap items-center gap-2">
        {isCropping ? (
          /* Crop Mode Buttons */
          <>
            <button
              onClick={onCropApply}
              disabled={!canApplyCrop || cropMutationPending}
              className="rounded bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
            >
              {cropMutationPending ? "Processing..." : "Apply Crop"}
            </button>
            <button
              onClick={onCropCancel}
              disabled={cropMutationPending}
              className="rounded bg-slate-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-600 disabled:opacity-50"
            >
              Cancel
            </button>
          </>
        ) : (
          /* Normal Mode Buttons */
          <>
            {/* Rotation */}
            <button
              onClick={() => onRotate(-90)}
              disabled={rotateMutationPending || isRotating}
              className="rounded bg-slate-700 px-3 py-2 text-sm transition-colors hover:bg-slate-600 disabled:opacity-50"
              title="Rotate 90° counterclockwise"
            >
              {isRotating ? (
                "Rotating..."
              ) : (
                <i className="fas fa-undo text-white"></i>
              )}
            </button>
            <button
              onClick={() => onRotate(90)}
              disabled={rotateMutationPending || isRotating}
              className="rounded bg-slate-700 px-3 py-2 text-sm transition-colors hover:bg-slate-600 disabled:opacity-50"
              title="Rotate 90° clockwise"
            >
              {isRotating ? (
                "Rotating..."
              ) : (
                <i className="fas fa-redo text-white"></i>
              )}
            </button>

            {/* Crop */}
            <button
              onClick={onCropStart}
              disabled={cropMutationPending}
              className="rounded bg-slate-700 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-600 disabled:opacity-50"
            >
              Crop
            </button>

            {/* Delete */}
            <button
              onClick={onDelete}
              disabled={deleteMutationPending}
              className="rounded bg-rose-700 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-600 disabled:opacity-50"
            >
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
}
