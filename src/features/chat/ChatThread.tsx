"use client";

import { Show, SignInButton } from "@clerk/nextjs";
import Link from "next/link";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { MessageActions } from "@/components/ai-elements/message";
import { Skeleton } from "@/components/ui/skeleton";
import { AssistantMessage, CopyAction, LiveTurn, Stamp } from "@/features/chat/AssistantTurn";
import { Composer } from "@/features/chat/Composer";
import { useChat } from "@/features/chats/useChats";
import { ApiError } from "@/services/http";

// Measured on the reference: messages 868px wide, the composer below them 900px (plus 16px gutters).
const COLUMN = "mx-auto w-full max-w-[900px] px-space-05";
const COMPOSER_COLUMN = "mx-auto w-full max-w-[932px] px-space-05";
// Skeleton line widths (% of the column), read off the reference's loading state.
const REPLY_LINES = [85, 75, 90, 65, 72, 88, 55];
const MORE_LINES = [78, 65];

/** Centred notice for a chat that can't be shown. */
function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-space-04 px-space-05 text-center">
      <h1 className="text-heading-sm font-semibold text-text-primary">{title}</h1>
      {children}
    </div>
  );
}

const ACTION_PILL =
  "inline-flex h-8 items-center rounded-radius-max bg-text-primary px-space-04 text-small font-medium text-surface-main-background shadow-sm transition-opacity hover:opacity-90";

/**
 * `/chat/<id>`: the thread (DESIGN §4.5) above the follow-up composer. The live turn and the
 * assistant's blocks render here from M2 F3.
 */
export function ChatThread({ id }: { id: string }) {
  const { data, error, isPending } = useChat(id);

  if (error) {
    // Missing, deleted and someone else's chat all answer 404 (never leak existence).
    const missing = error instanceof ApiError && error.status === 404;
    return (
      <Notice title={missing ? "Task not found" : "Couldn't load this task"}>
        <p className="text-small text-text-secondary">
          {missing
            ? "It may have been deleted, or the link is wrong."
            : error instanceof ApiError
              ? error.message
              : "Check your connection and try again."}
        </p>
        <Link href="/chat" className={ACTION_PILL}>
          New task
        </Link>
      </Notice>
    );
  }

  return (
    <>
      <Show when="signed-out">
        <Notice title="Sign in to see this task">
          <SignInButton mode="modal">
            <button type="button" className={ACTION_PILL}>
              Sign in
            </button>
          </SignInButton>
        </Notice>
      </Show>
      <Show when="signed-in">
        {isPending ? (
          // Reference loading state: a user bubble, then 7 + 2 lines of reply.
          <div aria-label="Loading task" aria-busy="true" className={`${COLUMN} pt-space-07`}>
            <Skeleton className="ml-auto h-10 w-48 rounded-radius-xxl bg-surface-tertiary" />
            {[REPLY_LINES, MORE_LINES].map((lines) => (
              <div key={lines.length} className="mt-space-07 flex flex-col gap-space-03">
                {lines.map((width, i) => (
                  <Skeleton
                    key={i}
                    style={{ width: `${String(width)}%` }}
                    className="h-3 rounded-radius-max bg-surface-tertiary"
                  />
                ))}
              </div>
            ))}
          </div>
        ) : (
          // The API pages newest first; the thread reads oldest first.
          <div className="flex h-full flex-col">
            {/* React 19 hoists <title> into <head>: the tab shows the chat (DESIGN §5.2). */}
            <title>{`${data.title} | Magica`}</title>
            {/* Follows new content only while the reader is at the bottom (DESIGN §5.1). */}
            <Conversation aria-label="Chat messages" className="min-h-0">
              <ConversationContent className={`${COLUMN} gap-space-07 py-space-07`}>
                {[...data.messages.items].reverse().map((m) => (
                  // Stable wrapper: the fade-in runs once, not again when a live reply is saved.
                  <div key={m.id} className="animate-chat-fade-in-up">
                    {m.role === "user" ? (
                      <div className="group/user flex flex-col items-end gap-1">
                        {/* `user-message` scopes the reference's dark bubble colour (tokens.css). */}
                        <p className="user-message max-w-md rounded-radius-xxl bg-user-message px-space-05 py-[6px] text-small break-words whitespace-pre-wrap text-text-primary">
                          {m.text}
                        </p>
                        {/* Reference: the time and Copy appear under the bubble on hover. */}
                        <MessageActions className="gap-0.5 opacity-0 transition-opacity group-hover/user:opacity-100 focus-within:opacity-100">
                          <Stamp at={m.createdAt} />
                          <CopyAction text={m.text} />
                        </MessageActions>
                      </div>
                    ) : data.activeRun && (m.status === "streaming" || m.status === "pending") ? (
                      <LiveTurn chatId={id} run={data.activeRun} />
                    ) : (
                      <AssistantMessage
                        chatId={id}
                        message={m}
                        // Newest first from the API: only the latest reply can be retried.
                        latest={m.id === data.messages.items[0]?.id}
                      />
                    )}
                  </div>
                ))}
              </ConversationContent>
              {/* DESIGN §5.1: a 32px white circle with shadow-sm, centred above the composer. */}
              <ConversationScrollButton
                variant="ghost"
                className="size-8 bg-surface-main-background text-icon-primary shadow-sm hover:bg-surface-main-background-2 dark:bg-surface-main-background-3 dark:hover:bg-surface-main-background-2"
              />
            </Conversation>
            <div className={`${COMPOSER_COLUMN} pb-space-05`}>
              <Composer chatId={id} activeRun={data.activeRun} />
            </div>
          </div>
        )}
      </Show>
    </>
  );
}
