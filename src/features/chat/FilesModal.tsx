"use client";

import { IconFolderOpen } from "@tabler/icons-react";
import { Download, Ellipsis, FileText, LayoutGrid, LoaderCircle, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import type { ChatAsset } from "@mohitbhalotia/magica-contracts";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useChatAssets } from "@/features/chats/useChats";
import { downloadFile } from "@/lib/download";
import { cn } from "@/lib/utils";

/** The reference's chips (DESIGN §4.8); we only make images and videos, so the rest stay empty. */
const FILTERS = [
  { label: "All", kinds: ["image", "video"] },
  { label: "Documents", kinds: [] },
  { label: "Images", kinds: ["image"] },
  { label: "Videos", kinds: ["video"] },
  { label: "Audio", kinds: [] },
  { label: "Code files", kinds: [] },
] as const satisfies readonly { label: string; kinds: readonly ChatAsset["kind"][] }[];
type Filter = (typeof FILTERS)[number];

const GHOST =
  "rounded-lg px-3 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary hover:text-text-primary disabled:pointer-events-none disabled:opacity-50";

/** "View all files in this task" (top bar, inside a chat) and its modal (DESIGN §4.8). */
export function FilesButton({ chatId }: { chatId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        aria-label="View all files in this task"
        className="inline-flex shrink-0 items-center justify-center rounded-radius-max border-(length:--border-width-xs) border-boarder-tertiary bg-surface-main-background-2 p-space-03 text-icon-primary transition-colors hover:bg-surface-primary"
      >
        <IconFolderOpen className="size-5" stroke={1.5} />
      </DialogTrigger>
      {open && <FilesDialog chatId={chatId} />}
    </Dialog>
  );
}

function FilesDialog({ chatId }: { chatId: string }) {
  const files = useChatAssets(chatId, true);
  const [filter, setFilter] = useState<Filter>(FILTERS[0]);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const assets = files.data?.pages.flatMap((page) => page.items) ?? [];
  const shown = assets.filter((asset) => (filter.kinds as readonly string[]).includes(asset.kind));
  const toDownload = selected.size ? shown.filter((asset) => selected.has(asset.id)) : shown;

  const toggle = (id: string) => {
    setSelected((now) => {
      const next = new Set(now);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  };

  return (
    <DialogContent
      showCloseButton={false}
      aria-describedby={undefined}
      className="flex h-[75vh] max-w-[600px]! flex-col gap-0 overflow-hidden rounded-2xl border-boarder-tertiary bg-surface-main-background p-0 shadow-popover max-sm:h-[calc(100dvh-1rem)] max-sm:rounded-xl"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-boarder-tertiary px-5 py-4">
        <DialogTitle className="min-w-0 flex-1 truncate text-base font-semibold text-text-primary">
          All files in this task
        </DialogTitle>
        <DialogDescription className="sr-only">Files generated in this task</DialogDescription>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            className={GHOST}
            disabled={!shown.length}
            onClick={() => {
              setSelected(new Set(shown.map((asset) => asset.id)));
            }}
          >
            Select all
          </button>
          <button
            type="button"
            className={cn(GHOST, "flex items-center gap-1.5")}
            disabled={!toDownload.length}
            onClick={() => {
              for (const asset of toDownload) void downloadFile(asset.url);
            }}
          >
            <Download className="size-4" />
            Download all
          </button>
          <DialogClose
            aria-label="Close"
            className="-mr-1 flex size-9 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-surface-secondary hover:text-text-primary"
          >
            <X className="size-5" />
          </DialogClose>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto px-5 pt-4 pb-2">
        {FILTERS.map((chip) => {
          const count = assets.filter((asset) =>
            (chip.kinds as readonly string[]).includes(asset.kind),
          ).length;
          return (
            <button
              key={chip.label}
              type="button"
              aria-pressed={chip === filter}
              onClick={() => {
                setFilter(chip);
              }}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-1.5 text-sm transition-colors",
                chip === filter
                  ? "bg-surface-overlay-control font-medium text-text-on-action"
                  : "bg-surface-secondary text-text-secondary hover:text-text-primary",
              )}
            >
              {chip.label}
              {count > 0 && <span className="ml-1 opacity-60">{count}</span>}
            </button>
          );
        })}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-4">
        {files.isPending ? (
          <LoaderCircle
            aria-label="Loading files"
            className="mx-auto mt-16 size-5 animate-spin text-icon-secondary"
          />
        ) : shown.length === 0 ? (
          // shortcut: the reference's empty copy isn't observed yet (DESIGN §9).
          <p className="mt-16 text-center text-sm text-text-secondary">No files yet</p>
        ) : (
          byDay(shown).map(([day, items]) => (
            <section key={day}>
              <h3 className="px-5 pt-4 pb-1 text-xs font-medium text-text-secondary">{day}</h3>
              {items.map((asset) => (
                <FileRow
                  key={asset.id}
                  asset={asset}
                  selected={selected.has(asset.id)}
                  onToggle={toggle}
                />
              ))}
            </section>
          ))
        )}
        {files.hasNextPage && (
          <button
            type="button"
            className={cn(GHOST, "mx-auto mt-2 block")}
            disabled={files.isFetchingNextPage}
            onClick={() => void files.fetchNextPage()}
          >
            Load more
          </button>
        )}
      </div>
    </DialogContent>
  );
}

function FileRow({
  asset,
  selected,
  onToggle,
}: {
  asset: ChatAsset;
  selected: boolean;
  onToggle: (id: string) => void;
}) {
  // Magica doesn't name its outputs; the reference shows "image file" for those too.
  const name = `${asset.kind} file`;
  const reveal = cn(
    "transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 max-sm:opacity-100",
    !selected && "opacity-0",
  );
  return (
    <div className="group flex items-center gap-3 px-5 py-2.5 transition-colors hover:bg-surface-secondary/50">
      <input
        type="checkbox"
        aria-label={`Select ${name}`}
        checked={selected}
        onChange={() => {
          onToggle(asset.id);
        }}
        className={cn("size-4 shrink-0 rounded border-boarder-tertiary accent-primary", reveal)}
      />
      <div className="size-10 shrink-0 overflow-hidden rounded-lg bg-surface-secondary">
        {asset.kind === "image" ? (
          // A 40px thumbnail of a provider URL: not worth an image-optimizer round trip.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={asset.url}
            alt={name}
            loading="lazy"
            width={40}
            height={40}
            className="size-full object-cover"
          />
        ) : (
          <video src={asset.url} preload="metadata" muted className="size-full object-cover" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text-primary" title={name}>
          {name}
        </p>
        <p className="text-xs text-text-secondary">{meta(asset)}</p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`Open actions for ${name}`}
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-secondary hover:text-text-primary",
            reveal,
          )}
        >
          <Ellipsis className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => window.open(asset.url, "_blank", "noopener")}>
            <LayoutGrid className="size-4" strokeWidth={1.5} />
            Preview
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => void downloadFile(asset.url)}>
            <Download className="size-4" strokeWidth={1.5} />
            Download
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              void navigator.clipboard.writeText(asset.url).then(() => toast.success("URL copied"));
            }}
          >
            <FileText className="size-4" strokeWidth={1.5} />
            Copy URL
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/** Newest-first assets grouped under "Saturday, October 17, 2026" (DESIGN §4.8). */
function byDay(assets: ChatAsset[]) {
  const days = new Map<string, ChatAsset[]>();
  for (const asset of assets) {
    const day = new Date(asset.createdAt).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    days.set(day, [...(days.get(day) ?? []), asset]);
  }
  return [...days];
}

/** "PNG · Sat, Oct 17 · 1.1 MB" (DESIGN §6). */
function meta(asset: ChatAsset) {
  const type = asset.mimeType.split("/")[1]?.toUpperCase() ?? asset.kind.toUpperCase();
  const date = new Date(asset.createdAt).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  return [type, date, asset.sizeBytes === undefined ? undefined : fileSize(asset.sizeBytes)]
    .filter(Boolean)
    .join(" · ");
}

function fileSize(bytes: number) {
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit++;
  }
  return `${unit === 0 ? String(size) : size.toFixed(1)} ${units[unit] ?? "B"}`;
}
