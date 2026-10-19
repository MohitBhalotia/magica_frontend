"use client";

import { ImageIcon, Plus } from "lucide-react";
import { useRef, useState } from "react";

import type { Attachment } from "@mohitbhalotia/magica-contracts";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LibraryDialog } from "@/features/uploads/LibraryDialog";

/** What uploads accept (PRD §5.10); Transloadit filters again on its side. */
const ACCEPT = "image/*,video/*,audio/*";

/**
 * The paperclip's popover (DESIGN §4.9, observed): "Add a file from your device or select one from
 * your library", with "Select Asset" (the library) and "Upload" (the device's file picker).
 */
export function AttachPopover({
  trigger,
  onFiles,
  onPick,
}: {
  trigger: React.ReactNode;
  onFiles: (files: File[]) => void;
  onPick: (attachments: Attachment[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [library, setLibrary] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent
          side="top"
          align="start"
          className="flex w-[245px] flex-col gap-space-03 rounded-2xl bg-surface-primary p-space-05 shadow-popover"
        >
          <p className="text-[13px] text-text-secondary">
            Add a file from your device or select one from your library
          </p>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setLibrary(true);
            }}
            className="flex h-10 w-full items-center justify-center gap-space-02 rounded-[10px] border border-boarder-tertiary bg-surface-main-background text-small font-medium text-text-primary transition-colors hover:bg-surface-main-background-2"
          >
            <ImageIcon className="size-4" />
            Select Asset
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              input.current?.click();
            }}
            className="flex h-10 w-full items-center justify-center gap-space-02 rounded-[10px] bg-surface-primary-active text-small font-medium text-text-on-action transition-opacity hover:opacity-90"
          >
            <Plus className="size-4" />
            Upload
          </button>
        </PopoverContent>
      </Popover>
      <input
        ref={input}
        type="file"
        multiple
        accept={ACCEPT}
        hidden
        aria-label="Upload files"
        onChange={(event) => {
          onFiles([...(event.target.files ?? [])]);
          // The same file can be picked again after it was removed.
          event.target.value = "";
        }}
      />
      <LibraryDialog open={library} onOpenChange={setLibrary} onPick={onPick} />
    </>
  );
}
