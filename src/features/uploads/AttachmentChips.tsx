"use client";

import { FileAudio, FileVideo, LoaderCircle, RotateCw, X } from "lucide-react";

import type { Chip } from "@/features/uploads/useUploads";
import { cn } from "@/lib/utils";

/**
 * The composer's attachments, above the textarea, in the order they'll be sent: a preview, the
 * upload's progress, and remove / retry. DESIGN §4.2 [TBV]: the reference's chip look isn't observed.
 */
export function AttachmentChips({
  chips,
  onRemove,
  onRetry,
}: {
  chips: Chip[];
  onRemove: (key: string) => void;
  onRetry: (key: string) => void;
}) {
  if (!chips.length) return null;
  return (
    <ul aria-label="Attachments" className="flex flex-wrap gap-space-03">
      {chips.map((chip) => (
        <li key={chip.key} className="group relative" title={chip.error ?? chip.name}>
          <div
            className={cn(
              "flex size-12 items-center justify-center overflow-hidden rounded-lg border border-boarder-tertiary bg-surface-secondary",
              chip.status === "failed" && "border-icon-error",
            )}
          >
            {chip.kind === "image" && chip.previewUrl ? (
              // A local blob or a signed link: not something the image optimiser can fetch.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={chip.previewUrl} alt={chip.name} className="size-full object-cover" />
            ) : chip.kind === "video" ? (
              <FileVideo aria-label={chip.name} className="size-5 text-icon-secondary" />
            ) : (
              <FileAudio aria-label={chip.name} className="size-5 text-icon-secondary" />
            )}
          </div>

          {(chip.status === "uploading" || chip.status === "processing") && (
            <div
              role="progressbar"
              aria-label={`Uploading ${chip.name}`}
              aria-valuenow={chip.progress}
              className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40 text-[10px] font-medium text-white"
            >
              {chip.status === "processing" ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                `${String(chip.progress)}%`
              )}
            </div>
          )}

          {chip.status === "failed" && (
            <button
              type="button"
              aria-label={`Retry ${chip.name}`}
              onClick={() => {
                onRetry(chip.key);
              }}
              className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40 text-white"
            >
              <RotateCw className="size-4" />
            </button>
          )}

          <button
            type="button"
            aria-label={`Remove ${chip.name}`}
            onClick={() => {
              onRemove(chip.key);
            }}
            className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-surface-primary-active text-text-on-action opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 max-sm:opacity-100"
          >
            <X className="size-3" />
          </button>
        </li>
      ))}
    </ul>
  );
}
