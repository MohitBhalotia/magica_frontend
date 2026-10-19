"use client";

import { MessageCircle, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { Dialog } from "radix-ui";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { useChatList, useChatSearch } from "@/features/chats/useChats";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/uiStore";

const DEBOUNCE_MS = 200;

// Grey sans-serif pills like the reference (not the browser's monospace <kbd>).
const KEYCAP =
  "inline-flex h-(--magica-tooltip-keycap) min-w-(--magica-tooltip-keycap) items-center justify-center rounded-radius-tooltipKeycap bg-surface-secondary px-space-02 font-sans text-caption-1 text-text-secondary";

/** The title with the first case-insensitive match in bold (the reference shows no snippet). */
function Highlight({ text, q }: { text: string; q: string }): ReactNode {
  const i = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <strong className="font-bold text-text-primary">{text.slice(i, i + q.length)}</strong>
      {text.slice(i + q.length)}
    </>
  );
}

/** Task search (DESIGN §4.10, observed 2026-10-18); ⌘/Ctrl+K opens it (see Shortcuts). */
export function SearchDialog() {
  const open = useUiStore((s) => s.searchOpen);
  const setOpen = useUiStore((s) => s.setSearchOpen);
  // Opened by ⌘K there's no trigger to return focus to, so it goes back where the user was.
  const returnTo = useRef<HTMLElement | null>(null);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-surface-overlay-control backdrop-blur-[3px]" />
        <Dialog.Content
          onOpenAutoFocus={() => {
            returnTo.current = document.activeElement as HTMLElement | null;
          }}
          onCloseAutoFocus={(event) => {
            if (!returnTo.current?.isConnected) return;
            event.preventDefault();
            returnTo.current.focus();
          }}
          className="fixed top-1/2 left-1/2 z-50 flex h-[370px] w-[512px] max-w-[calc(100vw-32px)] -translate-1/2 flex-col overflow-hidden rounded-radius-xxxxl bg-surface-main-background shadow-lg outline-none"
        >
          <Dialog.Title className="sr-only">Search tasks</Dialog.Title>
          <Dialog.Description className="sr-only">
            Search your recent tasks and open an existing task or start a new one.
          </Dialog.Description>
          {/* Unmounts on close, so each open starts empty and no query runs while closed. */}
          <SearchPanel />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function SearchPanel() {
  const router = useRouter();
  const setOpen = useUiStore((s) => s.setSearchOpen);
  const setDrawerOpen = useUiStore((s) => s.setDrawerOpen);
  const [input, setInput] = useState("");
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const recent = useChatList();
  const search = useChatSearch(q);

  // Debounce typing so a word costs one request, not one per key.
  useEffect(() => {
    const t = setTimeout(() => {
      setQ(input.trim());
      setActive(0);
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(t);
    };
  }, [input]);

  // An empty query lists recent tasks (the sidebar's cached first page).
  const results = q ? (search.data?.items ?? []) : (recent.data?.pages[0]?.items ?? []);
  // isLoading, not isPending: a disabled query (signed out) is pending forever.
  const loading = q ? search.isLoading : recent.isLoading;

  const go = (href: string) => {
    setOpen(false);
    setDrawerOpen(false);
    router.push(href);
  };

  return (
    <>
      <div className="flex h-11 shrink-0 items-center gap-space-03 px-space-05">
        <Search className="size-(--magica-icon-size) shrink-0 text-icon-secondary" />
        <input
          role="combobox"
          aria-label="Search projects and tasks"
          aria-expanded
          aria-controls="search-results"
          aria-activedescendant={results[active] ? `search-option-${String(active)}` : undefined}
          placeholder="Search"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
              e.preventDefault();
              const step = e.key === "ArrowDown" ? 1 : -1;
              setActive((i) => (results.length ? (i + step + results.length) % results.length : 0));
            }
            const hit = results[active];
            if (e.key === "Enter" && hit) go(`/chat/${hit.id}`);
          }}
          className="h-10 min-w-0 flex-1 bg-transparent text-small text-text-primary outline-none placeholder:text-text-tertiary"
        />
        <Dialog.Close aria-label="Close" className={cn(KEYCAP, "cursor-pointer")}>
          esc
        </Dialog.Close>
      </div>

      <div className="mx-space-02 min-h-0 flex-1 overflow-y-auto rounded-radius-xxl bg-surface-primary p-space-02">
        <p className="px-space-05 pt-space-03 pb-space-02 text-caption text-text-tertiary">Tasks</p>
        <ul id="search-results" role="listbox" aria-label="Suggestions">
          {results.map((chat, i) => (
            // Keyboard users drive the list from the input (↑/↓/Enter via aria-activedescendant).
            // eslint-disable-next-line jsx-a11y/click-events-have-key-events
            <li
              key={chat.id}
              id={`search-option-${String(i)}`}
              role="option"
              aria-selected={i === active}
              onMouseMove={() => {
                setActive(i);
              }}
              onClick={() => {
                go(`/chat/${chat.id}`);
              }}
              className={cn(
                "flex h-10 cursor-pointer items-center gap-space-03 rounded-radius-max px-space-05 text-small text-text-secondary",
                i === active && "bg-surface-main-background",
              )}
            >
              <MessageCircle className="size-(--magica-compact-icon-size) shrink-0" />
              <span className="truncate">
                <Highlight text={chat.title} q={q} />
              </span>
            </li>
          ))}
        </ul>
        {!loading && (
          <p className="py-space-04 text-center text-caption text-text-secondary">
            {results.length ? "End of search results" : q ? "No tasks found" : "No tasks yet"}
          </p>
        )}
      </div>

      <div className="flex h-12 shrink-0 items-center justify-end px-space-05">
        <button
          type="button"
          onClick={() => {
            go("/chat");
          }}
          className="flex items-center gap-space-03 rounded-radius-l px-space-03 py-space-02 text-small text-text-primary transition-colors outline-none hover:bg-surface-secondary focus-visible:ring-2 focus-visible:ring-boarder-action"
        >
          New task
          <span className="flex gap-space-01">
            <kbd className={KEYCAP}>Ctrl</kbd>
            <kbd className={KEYCAP}>Shift</kbd>
            <kbd className={KEYCAP}>O</kbd>
          </span>
        </button>
      </div>
    </>
  );
}
