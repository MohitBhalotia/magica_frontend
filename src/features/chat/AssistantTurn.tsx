"use client";

import {
  Check,
  ChevronDown,
  CircleAlert,
  Copy,
  GitBranch,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { useState } from "react";

import {
  ContentBlockSchema,
  MessageMetadataSchema,
  type Message,
  type RunHandle,
} from "@mohitbhalotia/magica-contracts";

import { MessageAction, MessageActions, MessageResponse } from "@/components/ai-elements/message";
import { Reasoning, ReasoningContent, ReasoningTrigger } from "@/components/ai-elements/reasoning";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { useLiveTurn } from "@/features/chat/useLiveTurn";
import { useRetryRun } from "@/features/chats/useChats";
import { notAvailable } from "@/features/shell/nav";

/** Message parts we can render. Live parts come off the wire, so they're checked like saved ones. */
const toBlocks = (parts: readonly unknown[]) =>
  parts.flatMap((part) => {
    const block = ContentBlockSchema.safeParse(part);
    return block.success ? [block.data] : [];
  });

/**
 * An assistant turn from its parts (DEC-052): the same renderer for the live and the saved
 * message. Reasoning is one collapsible block, open while the model thinks; text is Markdown.
 */
export function AssistantParts({
  parts,
  metadata,
  streaming = false,
}: {
  parts: readonly unknown[];
  metadata?: unknown;
  streaming?: boolean;
}) {
  const blocks = toBlocks(parts);
  const reasoning = blocks.flatMap((b) => (b.type === "reasoning" ? [b.text] : [])).join("\n\n");
  const thinkingMs = MessageMetadataSchema.safeParse(metadata).data?.thinkingMs;

  // Before the first part arrives (DESIGN §4.6).
  if (streaming && !blocks.some((b) => b.type !== "step-start"))
    return (
      <div className="flex items-center gap-space-02 text-small text-text-secondary">
        <ChevronDown className="size-3" />
        <Shimmer>Thinking</Shimmer>
      </div>
    );

  return (
    <div className="flex flex-col text-body text-text-primary">
      {reasoning && (
        <Reasoning
          isStreaming={streaming && blocks.at(-1)?.type === "reasoning"}
          duration={thinkingMs === undefined ? undefined : Math.ceil(thinkingMs / 1000)}
        >
          <ReasoningTrigger />
          <ReasoningContent>{reasoning}</ReasoningContent>
        </Reasoning>
      )}
      {blocks.map((b, i) =>
        b.type === "text" ? (
          // Parts only ever append, so the index is a stable key.
          <MessageResponse key={i} isAnimating={streaming}>
            {b.text}
          </MessageResponse>
        ) : null,
      )}
    </div>
  );
}

const COPIED_FOR_MS = 2000;
const clock = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

/** Under a finished reply (DESIGN §4.5): Copy, Fork, Good, Bad, then the time. */
function TurnFooter({ message }: { message: Message }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    void navigator.clipboard.writeText(message.text).then(() => {
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, COPIED_FOR_MS);
    });
  };
  const action = "size-7 text-icon-secondary hover:text-icon-primary";
  return (
    <MessageActions>
      <MessageAction tooltip={copied ? "Copied" : "Copy"} className={action} onClick={copy}>
        {copied ? <Check /> : <Copy />}
      </MessageAction>
      {/* Out of scope in this build: they explain themselves with a toast (PRD §6.10). */}
      <MessageAction tooltip="Fork chat" className={action} onClick={notAvailable}>
        <GitBranch />
      </MessageAction>
      <MessageAction tooltip="Good response" className={action} onClick={notAvailable}>
        <ThumbsUp />
      </MessageAction>
      <MessageAction tooltip="Bad response" className={action} onClick={notAvailable}>
        <ThumbsDown />
      </MessageAction>
      <time
        dateTime={message.completedAt ?? message.createdAt}
        className="ml-space-02 text-caption text-text-tertiary"
      >
        {clock(message.completedAt ?? message.createdAt)}
      </time>
    </MessageActions>
  );
}

/**
 * A saved reply: its parts, then the footer, or why it ended early (DESIGN §4.12). The chat's
 * latest failed or stopped reply offers Retry; partial content always stays visible.
 */
export function AssistantMessage({
  chatId,
  message,
  latest,
}: {
  chatId: string;
  message: Message;
  latest: boolean;
}) {
  const retry = useRetryRun(chatId);
  const { runId } = message;
  const ended = message.status === "failed" || message.status === "cancelled";
  return (
    <div className="flex flex-col gap-space-03">
      <AssistantParts parts={message.contentBlocks} metadata={message.metadata} />
      {message.status === "failed" && (
        <p role="alert" className="flex items-center gap-space-02 text-caption text-text-error">
          <CircleAlert className="size-3 shrink-0" />
          Something went wrong — {message.errorMessage ?? "Please try again."}
        </p>
      )}
      {message.status === "cancelled" && <p className="text-caption text-text-tertiary">Stopped</p>}
      {ended && latest && runId && (
        <button
          type="button"
          disabled={retry.isPending}
          onClick={() => {
            retry.mutate(runId);
          }}
          className="inline-flex h-8 w-fit items-center rounded-radius-max border border-boarder-secondary px-space-04 text-small font-medium text-text-primary transition-colors outline-none hover:bg-surface-main-background-2 focus-visible:ring-2 focus-visible:ring-boarder-action disabled:opacity-50"
        >
          Retry
        </button>
      )}
      {message.status === "success" && <TurnFooter message={message} />}
    </div>
  );
}

/** The reply being written right now, followed live until its run ends. */
export function LiveTurn({ chatId, run }: { chatId: string; run: RunHandle }) {
  const message = useLiveTurn(chatId, run);
  return <AssistantParts parts={message?.parts ?? []} metadata={message?.metadata} streaming />;
}
