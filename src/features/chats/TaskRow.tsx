"use client";

import { IconCopy, IconPencil, IconPin, IconPinnedOff, IconTrash } from "@tabler/icons-react";
import { Ellipsis, FolderInput } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { MAX_TITLE_LENGTH, type ChatSummary } from "@mohitbhalotia/magica-contracts";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteTaskDialog, DuplicateTaskDialog } from "@/features/chats/TaskDialogs";
import { useDeleteChat, useDuplicateChat, useUpdateChat } from "@/features/chats/useChats";
import { cn } from "@/lib/utils";

type Mode = "rename" | "duplicate" | "delete";

type Props = {
  chat: ChatSummary;
  active: boolean;
  /** Called after in-app navigation (the mobile drawer closes itself). */
  onNavigate?: () => void;
};

/** Sidebar task row with its "…" menu (DESIGN §3.2, §4.9; observed 2026-10-18). */
export function TaskRow({ chat, active, onNavigate }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode | null>(null);
  // Menu actions start once the menu has closed: otherwise its focus return would blur the
  // rename input, and a dialog opened mid-close can leave Radix's body pointer lock behind.
  const pending = useRef<Mode | null>(null);
  const update = useUpdateChat();
  const duplicate = useDuplicateChat();
  const remove = useDeleteChat();
  const closeDialog = (open: boolean) => {
    if (!open) setMode(null);
  };

  const rename = (value: string) => {
    setMode(null);
    const title = value.trim();
    if (title && title !== chat.title) update.mutate({ id: chat.id, patch: { title } });
  };

  const confirmDuplicate = () => {
    setMode(null);
    duplicate.mutate(chat.id, {
      onSuccess: (copy) => {
        router.push(`/chat/${copy.id}`);
        onNavigate?.();
        toast("Task duplicated", {
          description: "The copied task and its message history are ready.",
        });
      },
    });
  };

  const confirmDelete = () => {
    remove.mutate(chat.id);
    if (active) router.push("/chat");
  };

  if (mode === "rename") {
    return (
      <div className="flex items-center gap-space-03 rounded-radius-l px-space-03 py-space-03 ring-1 ring-boarder-action">
        <IconPencil className="size-4 shrink-0 text-icon-secondary" />
        <input
          aria-label="Task title"
          placeholder="Untitled task"
          defaultValue={chat.title}
          maxLength={MAX_TITLE_LENGTH}
          // Rename starts from an explicit menu action, so taking focus is expected.
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
          onFocus={(e) => {
            e.currentTarget.select();
          }}
          onBlur={(e) => {
            rename(e.currentTarget.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") rename(e.currentTarget.value);
            if (e.key === "Escape") setMode(null);
          }}
          className="min-w-0 flex-1 rounded-xs border border-boarder-action bg-surface-primary px-1.5 py-0.5 text-small text-text-primary outline-none placeholder:text-text-tertiary"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group/item relative flex items-center rounded-radius-l transition-colors hover:bg-surface-secondary",
        active && "bg-surface-tertiary hover:bg-surface-tertiary",
      )}
    >
      <Link
        href={`/chat/${chat.id}`}
        aria-current={active ? "page" : undefined}
        onClick={onNavigate}
        className="flex h-(--magica-control-height) w-full min-w-0 items-center rounded-radius-l pr-space-09 pl-space-03 outline-none focus-visible:ring-2 focus-visible:ring-boarder-action sm:pr-space-03 sm:group-focus-within/item:pr-space-09 sm:group-hover/item:pr-space-09"
      >
        <span className="truncate text-small font-medium text-text-secondary group-hover/item:text-text-primary">
          {chat.title}
        </span>
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Chat actions"
          className="absolute right-[6px] flex size-6 items-center justify-center rounded-radius-m text-icon-secondary outline-none hover:bg-surface-secondary hover:text-icon-primary focus-visible:ring-2 focus-visible:ring-boarder-action data-[state=open]:opacity-100 sm:opacity-0 sm:group-focus-within/item:opacity-100 sm:group-hover/item:opacity-100"
        >
          <Ellipsis className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          side="right"
          onCloseAutoFocus={(e) => {
            if (!pending.current) return;
            e.preventDefault();
            setMode(pending.current);
            pending.current = null;
          }}
        >
          <DropdownMenuItem
            onSelect={() => {
              update.mutate({ id: chat.id, patch: { isPinned: !chat.isPinned } });
            }}
          >
            {chat.isPinned ? <IconPinnedOff /> : <IconPin />}
            {chat.isPinned ? "Unpin" : "Pin to top"}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              pending.current = "rename";
            }}
          >
            <IconPencil />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              pending.current = "duplicate";
            }}
          >
            <IconCopy />
            Duplicate
          </DropdownMenuItem>
          {/* Projects are outside the brief (PRD §6.10): shown, disabled. */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger disabled>
              <FolderInput />
              Add to project
            </DropdownMenuSubTrigger>
          </DropdownMenuSub>
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => {
              pending.current = "delete";
            }}
          >
            <IconTrash />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DuplicateTaskDialog
        title={chat.title}
        open={mode === "duplicate"}
        onOpenChange={closeDialog}
        onConfirm={confirmDuplicate}
      />
      <DeleteTaskDialog
        open={mode === "delete"}
        onOpenChange={closeDialog}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
