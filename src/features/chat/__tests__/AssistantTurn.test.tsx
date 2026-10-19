import { useAuth } from "@clerk/nextjs";
import { screen, waitFor } from "@testing-library/react";
import { useRealtimeRun, useRealtimeStream } from "@trigger.dev/react-hooks";
import type { UIMessageChunk } from "ai";
import { http, HttpResponse } from "msw";
import { beforeEach, expect, it, vi } from "vitest";

import type { ChatDetail, Message } from "@mohitbhalotia/magica-contracts";

import { AssistantParts } from "@/features/chat/AssistantTurn";
import { ChatThread } from "@/features/chat/ChatThread";
import { server } from "@/mocks/server";
import { API, renderWithProviders } from "@/test/render";

vi.mock("@trigger.dev/react-hooks", () => ({
  useRealtimeStream: vi.fn(() => ({ parts: [] })),
  useRealtimeRun: vi.fn(() => ({})),
}));

const at = "2026-10-19T10:00:00.000Z";
const message = (patch: Partial<Message>): Message => ({
  id: "m",
  role: "assistant",
  status: "success",
  text: "",
  contentBlocks: [],
  metadata: null,
  errorCode: null,
  errorMessage: null,
  createdAt: at,
  completedAt: at,
  ...patch,
});

const chunks: UIMessageChunk[] = [
  { type: "start" },
  { type: "start-step" },
  { type: "reasoning-start", id: "r" },
  { type: "reasoning-delta", id: "r", delta: "Let me think." },
  { type: "reasoning-end", id: "r" },
  { type: "text-start", id: "t" },
  { type: "text-delta", id: "t", delta: "Hello **there**" },
];

beforeEach(() => {
  vi.mocked(useAuth).mockReturnValue({
    isSignedIn: true,
    userId: "user_1",
    getToken: () => Promise.resolve("token"),
  } as unknown as ReturnType<typeof useAuth>);
});

it("renders a saved reply: Markdown text and collapsed reasoning with its thinking time", () => {
  renderWithProviders(
    <AssistantParts
      parts={[
        { type: "step-start" },
        { type: "reasoning", text: "Plan it", state: "done" },
        { type: "text", text: "Hello **there**", state: "done" },
      ]}
      metadata={{ thinkingMs: 2400 }}
    />,
  );
  // Rendered as Markdown: bold text, no literal asterisks.
  expect(screen.getByText("there")).toBeInTheDocument();
  expect(screen.queryByText(/\*\*/)).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Thought for 3 seconds/ })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
});

it("ignores parts it doesn't know instead of crashing", () => {
  renderWithProviders(
    <AssistantParts
      parts={[
        { type: "file", url: "x" },
        { type: "text", text: "ok" },
      ]}
    />,
  );
  expect(screen.getByText("ok")).toBeInTheDocument();
});

it("follows a live reply, then shows the saved message when the run ends", async () => {
  const run = {
    runId: "r1",
    status: "thinking" as const,
    triggerRunId: "run_1",
    publicAccessToken: "pk",
  };
  const live: ChatDetail = {
    id: "c1",
    title: "Hi",
    titleSource: "prompt",
    isPinned: false,
    createdAt: at,
    updatedAt: at,
    messages: {
      items: [
        message({ id: "a1", status: "streaming", completedAt: null }),
        message({ id: "u1", role: "user", text: "hi" }),
      ],
      nextCursor: null,
    },
    activeRun: run,
  };
  const saved: ChatDetail = {
    ...live,
    activeRun: null,
    messages: {
      items: [
        message({
          id: "a1",
          text: "Saved answer",
          contentBlocks: [{ type: "text", text: "Saved answer" }],
        }),
        message({ id: "u1", role: "user", text: "hi" }),
      ],
      nextCursor: null,
    },
  };
  let detail = live;
  server.use(http.get(`${API}/chats/c1`, () => HttpResponse.json(detail)));

  // Nothing streamed yet: the "Thinking" placeholder.
  const view = renderWithProviders(<ChatThread id="c1" />);
  expect(await screen.findByText("Thinking")).toBeInTheDocument();
  expect(useRealtimeStream).toHaveBeenCalledWith(
    "run_1",
    "ui",
    expect.objectContaining({ accessToken: "pk", enabled: true }),
  );

  // Chunks arrive: the reasoning and the text so far.
  vi.mocked(useRealtimeStream).mockReturnValue({
    parts: chunks,
    lastEventId: undefined,
    error: undefined,
    stop: vi.fn(),
  });
  view.rerender(<ChatThread id="c1" />);
  expect(await screen.findByText("there")).toBeInTheDocument();
  // Thinking is over once text streams, so the reasoning sits collapsed above it.
  expect(screen.getByRole("button", { name: /Thought for/ })).toBeInTheDocument();

  // The run ends: the chat is refetched and the saved message replaces the live one.
  detail = saved;
  const onComplete = vi.mocked(useRealtimeRun).mock.lastCall?.[1]?.onComplete;
  onComplete?.({} as never);
  await waitFor(() => {
    expect(screen.getByText("Saved answer")).toBeInTheDocument();
  });
});
