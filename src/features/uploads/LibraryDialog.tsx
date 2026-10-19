"use client";

import { useAuth } from "@clerk/nextjs";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Check, FileAudio, FileVideo, LoaderCircle } from "lucide-react";
import { useState } from "react";

import type { Attachment } from "@mohitbhalotia/magica-contracts";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { listUploads } from "@/services/uploads.service";

/**
 * "Select Asset" (PRD §5.10): the user's earlier uploads, newest first; picked ones join the
 * composer in the order picked. Layout [TBV] against the reference's library.
 */
export function LibraryDialog({
  open,
  onOpenChange,
  onPick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (attachments: Attachment[]) => void;
}) {
  const { isSignedIn, userId, getToken } = useAuth();
  const library = useInfiniteQuery({
    queryKey: ["uploads", userId],
    queryFn: async ({ pageParam }) => listUploads(pageParam, await getToken()),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: isSignedIn === true && open,
  });
  const [picked, setPicked] = useState<Attachment[]>([]);
  const files = library.data?.pages.flatMap((page) => page.items) ?? [];

  const toggle = (file: Attachment) => {
    setPicked((now) =>
      now.some((p) => p.id === file.id) ? now.filter((p) => p.id !== file.id) : [...now, file],
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setPicked([]);
        onOpenChange(next);
      }}
    >
      <DialogContent className="flex max-h-[75vh] max-w-[600px]! flex-col gap-space-04 rounded-2xl p-space-06 max-sm:max-h-[calc(100dvh-1rem)]">
        <DialogTitle className="text-base font-semibold text-text-primary">
          Select Asset
        </DialogTitle>
        <DialogDescription className="sr-only">Pick files you uploaded before</DialogDescription>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {library.isPending ? (
            <LoaderCircle
              aria-label="Loading your files"
              className="mx-auto my-12 size-5 animate-spin text-icon-secondary"
            />
          ) : files.length === 0 ? (
            <p className="my-12 text-center text-sm text-text-secondary">No uploads yet</p>
          ) : (
            <ul className="grid grid-cols-3 gap-space-03 sm:grid-cols-4">
              {files.map((file) => {
                const selected = picked.some((p) => p.id === file.id);
                return (
                  <li key={file.id}>
                    <button
                      type="button"
                      aria-pressed={selected}
                      aria-label={file.name}
                      onClick={() => {
                        toggle(file);
                      }}
                      className={cn(
                        "relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg border bg-surface-secondary",
                        selected ? "border-2 border-boarder-action" : "border-boarder-tertiary",
                      )}
                    >
                      {file.kind === "image" && file.url ? (
                        // A signed link to a private file: not for the image optimiser.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={file.url} alt="" className="size-full object-cover" />
                      ) : file.kind === "video" ? (
                        <FileVideo className="size-6 text-icon-secondary" />
                      ) : (
                        <FileAudio className="size-6 text-icon-secondary" />
                      )}
                      {selected && (
                        <Check className="absolute top-1 right-1 size-5 rounded-full bg-surface-primary-active p-0.5 text-text-on-action" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {library.hasNextPage && (
            <button
              type="button"
              disabled={library.isFetchingNextPage}
              onClick={() => void library.fetchNextPage()}
              className="mx-auto mt-space-03 block rounded-lg px-space-04 py-space-02 text-sm text-text-secondary hover:bg-surface-secondary"
            >
              Load more
            </button>
          )}
        </div>
        <div className="flex justify-end gap-space-03">
          <button
            type="button"
            onClick={() => {
              onOpenChange(false);
            }}
            className="h-9 rounded-radius-max px-space-04 text-small font-medium text-text-secondary hover:bg-surface-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!picked.length}
            onClick={() => {
              onPick(picked);
              setPicked([]);
              onOpenChange(false);
            }}
            className="h-9 rounded-radius-max bg-surface-primary-active px-space-04 text-small font-medium text-text-on-action disabled:opacity-50"
          >
            Add {picked.length ? String(picked.length) : ""}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
