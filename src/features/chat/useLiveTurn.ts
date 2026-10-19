"use client";

import { useAuth } from "@clerk/nextjs";
import { useQueryClient } from "@tanstack/react-query";
import { useRealtimeRun, useRealtimeStream } from "@trigger.dev/react-hooks";
import { readUIMessageStream, type UIMessage, type UIMessageChunk } from "ai";
import { useEffect, useState } from "react";

import {
  UI_STREAM,
  type ChatDetail,
  type MessageMetadata,
  type RunHandle,
} from "@mohitbhalotia/magica-contracts";

import { chatKey, chatListKey } from "@/features/chats/useChats";

export type LiveMessage = UIMessage<MessageMetadata>;

const TITLE_REFRESH_MS = [3_000, 10_000, 25_000];

/** The chunks so far as one message, built by the AI SDK's own reducer. */
async function fold(chunks: UIMessageChunk[]) {
  const stream = new ReadableStream<UIMessageChunk>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(chunk);
      controller.close();
    },
  });
  let message: LiveMessage | undefined;
  // An error chunk carries the safe message; the saved turn shows it once the run ends.
  for await (const m of readUIMessageStream<LiveMessage>({ stream, onError: () => undefined }))
    message = m;
  return message;
}

/**
 * The reply being written, read from the run's Realtime stream (DEC-052). The stream always
 * replays from its start, so a reload rebuilds the same message with no gap and no duplicates.
 * When the run ends the chat is refetched and the saved message (Postgres) replaces this one.
 */
export function useLiveTurn(chatId: string, run: RunHandle) {
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  // shortcut: the 1h read token isn't refreshed; a turn is far shorter and a reload mints a new one.
  const options = {
    accessToken: run.publicAccessToken ?? undefined,
    enabled: Boolean(run.triggerRunId && run.publicAccessToken),
  };
  const { parts } = useRealtimeStream<UIMessageChunk>(run.triggerRunId ?? "", UI_STREAM, {
    ...options,
    throttleInMs: 50,
    // A Magica step can wait up to 15 minutes in silence (DEC-054); the default 60s would drop it.
    timeoutInSeconds: 15 * 60,
  });
  useRealtimeRun(run.triggerRunId ?? undefined, {
    ...options,
    // The stream itself stays open ~60s after the run ends, so the run's status marks the end.
    onComplete: () => {
      const refresh = () => {
        void queryClient.invalidateQueries({ queryKey: chatKey(userId, chatId) });
        void queryClient.invalidateQueries({ queryKey: chatListKey(userId) });
      };
      refresh();
      // A chat's first reply is followed by chat-title, which can take 2–20s on a busy free model:
      // a few spaced refetches pick the AI title up (bounded, and only while it isn't there yet).
      const titled = () =>
        queryClient.getQueryData<ChatDetail>(chatKey(userId, chatId))?.titleSource !== "prompt";
      for (const delay of TITLE_REFRESH_MS)
        setTimeout(() => {
          if (!titled()) refresh();
        }, delay);
    },
  });

  const [message, setMessage] = useState<LiveMessage>();
  useEffect(() => {
    let current = true;
    void fold(parts).then((m) => {
      if (current) setMessage(m);
    });
    return () => {
      current = false;
    };
  }, [parts]);
  return message;
}
