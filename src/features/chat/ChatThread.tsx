"use client";

import { Show, SignInButton } from "@clerk/nextjs";
import Link from "next/link";

import { Skeleton } from "@/components/ui/skeleton";
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
 * `/chat/<id>` in M1: the user messages (DESIGN §4.5). Streaming turns, the assistant's blocks and
 * the composer here arrive with runs in M2.
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
          <ol
            role="log"
            aria-label="Chat messages"
            className={`${COLUMN} flex flex-col gap-space-07 py-space-07`}
          >
            {[...data.messages.items].reverse().map((m) =>
              m.role === "user" ? (
                <li key={m.id} className="flex justify-end">
                  <p className="max-w-md rounded-radius-xxl bg-user-message px-space-05 py-[6px] text-small break-words whitespace-pre-wrap text-text-primary">
                    {m.text}
                  </p>
                </li>
              ) : (
                <li key={m.id} className="text-body whitespace-pre-wrap text-text-primary">
                  {m.text}
                </li>
              ),
            )}
          </ol>
        )}
      </Show>
    </>
  );
}
