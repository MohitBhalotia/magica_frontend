"use client";

import { Show, SignInButton } from "@clerk/nextjs";
import Link from "next/link";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Skeleton } from "@/components/ui/skeleton";
import { AssistantMessage, LiveTurn } from "@/features/chat/AssistantTurn";
import { Composer } from "@/features/chat/Composer";
import { useChat } from "@/features/chats/useChats";
import { ApiError } from "@/services/http";

const COLUMN = "mx-auto w-full max-w-[868px] px-space-05";

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
          <div aria-label="Loading task" aria-busy="true" className={`${COLUMN} pt-space-07`}>
            <Skeleton className="ml-auto h-8 w-40 rounded-radius-xxl bg-surface-tertiary" />
          </div>
        ) : (
          // The API pages newest first; the thread reads oldest first.
          <div className="flex h-full flex-col">
            {/* React 19 hoists <title> into <head>: the tab shows the chat (DESIGN §5.2). */}
            <title>{`${data.title} | Magica`}</title>
            {/* Follows new content only while the reader is at the bottom (DESIGN §5.1). */}
            <Conversation aria-label="Chat messages" className="min-h-0">
              <ConversationContent className={`${COLUMN} gap-space-07 py-space-07`}>
                {[...data.messages.items].reverse().map((m) =>
                  m.role === "user" ? (
                    <div key={m.id} className="flex justify-end">
                      <p className="max-w-md rounded-radius-xxl bg-user-message px-space-05 py-[6px] text-small break-words whitespace-pre-wrap text-text-primary">
                        {m.text}
                      </p>
                    </div>
                  ) : data.activeRun && (m.status === "streaming" || m.status === "pending") ? (
                    <LiveTurn key={m.id} chatId={id} run={data.activeRun} />
                  ) : (
                    <AssistantMessage
                      key={m.id}
                      chatId={id}
                      message={m}
                      // Newest first from the API: only the latest reply can be retried.
                      latest={m.id === data.messages.items[0]?.id}
                    />
                  ),
                )}
              </ConversationContent>
              <ConversationScrollButton />
            </Conversation>
            <div className={`${COLUMN} pb-space-05`}>
              <Composer chatId={id} activeRun={data.activeRun} />
            </div>
          </div>
        )}
      </Show>
    </>
  );
}
