"use client";

import { useAuth, useClerk } from "@clerk/nextjs";
import { IconPlug } from "@tabler/icons-react";
import { ArrowUp, Folder, Loader2, Mic, Paperclip } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";

import { MAX_MESSAGE_LENGTH } from "@mohitbhalotia/magica-contracts";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useCreateChat } from "@/features/chats/useChats";
import { notAvailable } from "@/features/shell/nav";
import { cn } from "@/lib/utils";
import { NEW_CHAT, useComposerStore } from "@/stores/composerStore";

const MAX_TEXTAREA_HEIGHT = 200;
const ACTION =
  "flex size-(--magica-composer-action-control) shrink-0 items-center justify-center rounded-radius-max text-icon-secondary outline-none transition-colors hover:bg-surface-main-background-2 hover:text-icon-primary focus-visible:ring-2 focus-visible:ring-boarder-action [&_svg]:size-(--magica-icon-size)";

/** Composer icon button; out of scope in M1, so it explains itself with a toast (PRD §6.10). */
function Action({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" aria-label={label} onClick={notAvailable} className={ACTION}>
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

/**
 * The empty-state composer (DESIGN §4.2, observed 2026-10-18). Enter sends, Shift+Enter adds a
 * line. Send creates the chat with its first message, then opens it; signed out, it asks to sign in.
 */
export function Composer() {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { openSignIn } = useClerk();
  const text = useComposerStore((s) => s.drafts[NEW_CHAT] ?? "");
  const setDraft = useComposerStore((s) => s.setDraft);
  const create = useCreateChat();
  const textarea = useRef<HTMLTextAreaElement>(null);
  // Reused until the send succeeds or the text changes, so a retry can't create a second chat.
  const clientMessageId = useRef<string | null>(null);

  useEffect(() => {
    void useComposerStore.persist.rehydrate();
  }, []);

  // Grow with the text up to 200px, then scroll.
  useLayoutEffect(() => {
    const el = textarea.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${String(Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT))}px`;
  }, [text]);

  const empty = text.trim() === "";
  const send = () => {
    if (empty || create.isPending) return;
    if (!isSignedIn) {
      openSignIn();
      return;
    }
    clientMessageId.current ??= crypto.randomUUID();
    create.mutate(
      { clientMessageId: clientMessageId.current, text: text.trim() },
      {
        onSuccess: ({ chatId }) => {
          clientMessageId.current = null;
          setDraft(NEW_CHAT, "");
          router.push(`/chat/${chatId}`);
        },
      },
    );
  };

  const sendButton = (
    <button
      type="button"
      aria-label="Send message"
      disabled={empty || create.isPending}
      onClick={send}
      className={cn(
        "flex size-(--magica-composer-action-control) shrink-0 items-center justify-center rounded-radius-max transition-all outline-none focus-visible:ring-2 focus-visible:ring-boarder-action [&_svg]:size-(--magica-icon-size)",
        empty
          ? "cursor-not-allowed bg-surface-main-background-2 text-icon-secondary opacity-50"
          : "bg-surface-primary-active text-text-on-action hover:opacity-90",
      )}
    >
      {create.isPending ? <Loader2 className="animate-spin" /> : <ArrowUp />}
    </button>
  );

  return (
    <div className="group/composer relative flex max-h-[70vh] min-h-(--magica-composer-min-height) w-full flex-col justify-between gap-space-04 overflow-clip rounded-radius-xxxxl bg-linear-to-b from-surface-primary to-surface-main-background px-space-05 pt-space-05 pb-space-04 dark:bg-surface-main-background-3 dark:bg-none">
      {/* The reference draws its 1px edge as an inset ring on an overlay; it darkens on hover. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-radius-xxxxl shadow-[inset_0_0_0_1px_var(--boarder-secondary)] transition-shadow duration-150 group-hover/composer:shadow-[inset_0_0_0_1px_var(--boarder-primary)]"
      />
      <textarea
        ref={textarea}
        rows={1}
        aria-label="Message"
        placeholder="Assign a task or ask anything..."
        maxLength={MAX_MESSAGE_LENGTH}
        value={text}
        // The empty state exists to take a prompt; the reference focuses it too.
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus
        onChange={(e) => {
          clientMessageId.current = null;
          setDraft(NEW_CHAT, e.target.value);
        }}
        onKeyDown={(e) => {
          // Enter while an IME is composing confirms the candidate; it must not send.
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            send();
          }
        }}
        className="block min-h-5 w-full resize-none overflow-y-auto bg-transparent p-0 leading-6 text-text-primary placeholder:text-text-tertiary focus:outline-none"
      />
      <div className="flex items-center justify-between gap-space-02">
        <div className="flex min-w-0 items-center gap-space-02">
          <Action label="Attach files">
            <Paperclip />
          </Action>
          <button
            type="button"
            aria-label="Choose project"
            onClick={notAvailable}
            className="flex h-(--magica-composer-action-control) max-w-56 min-w-0 shrink items-center gap-space-02 rounded-radius-max px-space-03 text-small font-medium text-text-secondary transition-colors outline-none hover:bg-surface-main-background-2 focus-visible:ring-2 focus-visible:ring-boarder-action"
          >
            <Folder className="size-(--magica-icon-size) shrink-0" />
            <span className="truncate">Choose project</span>
          </button>
          <Action label="Connect apps">
            <IconPlug className="-rotate-45" />
          </Action>
        </div>
        <div className="flex shrink-0 items-center gap-space-02">
          <Action label="Dictation">
            <Mic />
          </Action>
          {empty ? (
            <Tooltip>
              <TooltipTrigger asChild>
                {/* A disabled button gets no pointer events, so the tooltip hangs on a wrapper. */}
                <span aria-label="Add a message first" className="inline-flex">
                  {sendButton}
                </span>
              </TooltipTrigger>
              <TooltipContent>Add a message first</TooltipContent>
            </Tooltip>
          ) : (
            sendButton
          )}
        </div>
      </div>
    </div>
  );
}
