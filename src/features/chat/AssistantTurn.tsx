"use client";

import {
  ContentBlockSchema,
  MessageMetadataSchema,
  type RunHandle,
} from "@mohitbhalotia/magica-contracts";

import { MessageResponse } from "@/components/ai-elements/message";
import { Reasoning, ReasoningContent, ReasoningTrigger } from "@/components/ai-elements/reasoning";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { useLiveTurn } from "@/features/chat/useLiveTurn";

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
    return <Shimmer className="text-small">Thinking</Shimmer>;

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

/** The reply being written right now, followed live until its run ends. */
export function LiveTurn({ chatId, run }: { chatId: string; run: RunHandle }) {
  const message = useLiveTurn(chatId, run);
  return <AssistantParts parts={message?.parts ?? []} metadata={message?.metadata} streaming />;
}
