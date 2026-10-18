"use client";

import { useAuth } from "@clerk/nextjs";
import { ChevronDown } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import type { ChatSummary } from "@mohitbhalotia/magica-contracts";

import { Skeleton } from "@/components/ui/skeleton";
import { TaskRow } from "@/features/chats/TaskRow";
import { useChatList } from "@/features/chats/useChats";
import { notAvailable } from "@/features/shell/nav";
import { cn } from "@/lib/utils";

const SKELETON_WIDTHS = [
  "w-4/5",
  "w-3/5",
  "w-2/3",
  "w-1/2",
  "w-3/4",
  "w-2/5",
  "w-4/5",
  "w-3/5",
  "w-1/2",
  "w-2/3",
];

/** "Pinned tasks" + "Recent tasks" (DESIGN §3.2): skeleton, empty state, next page on scroll. */
export function TaskList({ onNavigate }: { onNavigate?: () => void }) {
  const { isSignedIn } = useAuth();
  const { data, isPending, hasNextPage, isFetchingNextPage, fetchNextPage } = useChatList();
  const { chatId } = useParams<{ chatId?: string[] }>();
  const sentinel = useRef<HTMLDivElement>(null);

  // Loads the next page when the end of the list scrolls into view.
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasNextPage) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting && !isFetchingNextPage) void fetchNextPage();
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Signed out, the reference shows no task list.
  if (!isSignedIn) return null;
  if (isPending) {
    return (
      <div
        aria-busy="true"
        aria-label="Loading tasks"
        className="mt-space-04 flex flex-col gap-space-04 px-space-03"
      >
        {SKELETON_WIDTHS.map((w, i) => (
          <Skeleton key={i} className={cn("h-4 rounded-radius-m bg-surface-tertiary", w)} />
        ))}
      </div>
    );
  }

  const chats = data?.pages.flatMap((p) => p.items) ?? [];
  if (chats.length === 0) {
    return <p className="mt-space-07 text-center text-small text-text-secondary">No tasks yet</p>;
  }

  const row = (chat: ChatSummary) => (
    <li key={chat.id} className="mb-space-01 last:mb-0">
      <TaskRow chat={chat} active={chat.id === chatId?.[0]} onNavigate={onNavigate} />
    </li>
  );
  const pinned = chats.filter((c) => c.isPinned);

  return (
    <>
      {pinned.length > 0 && <Section title="Pinned tasks">{pinned.map(row)}</Section>}
      <Section title="Recent tasks" viewAll>
        {chats.filter((c) => !c.isPinned).map(row)}
      </Section>
      <div ref={sentinel} aria-hidden className="h-px" />
    </>
  );
}

function Section({
  title,
  viewAll = false,
  children,
}: {
  title: string;
  viewAll?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <section aria-label={title} className="mt-space-04">
      <div className="group/header relative flex min-h-8 items-center rounded-radius-l px-space-03 py-space-02">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => {
            setOpen(!open);
          }}
          className="flex items-center gap-space-02 text-caption text-text-secondary transition-colors outline-none hover:text-text-primary focus-visible:text-text-primary"
        >
          {title}
          <ChevronDown
            className={cn(
              "size-3 opacity-0 transition-[opacity,rotate] duration-200 group-hover/header:opacity-100",
              !open && "-rotate-90",
            )}
          />
        </button>
        {viewAll && (
          <button
            type="button"
            aria-label="View all recent tasks"
            onClick={notAvailable}
            className="ml-auto text-caption-1 text-text-secondary opacity-0 transition-opacity group-hover/header:opacity-100 hover:text-text-primary focus-visible:opacity-100"
          >
            View all
          </button>
        )}
      </div>
      {open && <ul>{children}</ul>}
    </section>
  );
}
