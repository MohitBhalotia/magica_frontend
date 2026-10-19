import { useAuth } from "@clerk/nextjs";
import { screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useRealtimeRun, useRealtimeStream } from "@trigger.dev/react-hooks";
import type { UIMessageChunk } from "ai";
import { http, HttpResponse } from "msw";
import { beforeEach, expect, it, vi } from "vitest";

import type { ChatDetail, Message } from "@mohitbhalotia/magica-contracts";

import { AssistantMessage, AssistantParts } from "@/features/chat/AssistantTurn";
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
  runId: null,
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
  expect(screen.getByRole("button", { name: /Thought for 3s/ })).toHaveAttribute(
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

it("a finished reply has the footer, and Copy copies its text", async () => {
  const user = userEvent.setup();
  renderWithProviders(
    <AssistantMessage
      chatId="c1"
      latest
      message={message({ text: "Copy me", contentBlocks: [{ type: "text", text: "Copy me" }] })}
    />,
  );
  for (const name of ["Fork chat", "Good response", "Bad response"])
    expect(screen.getByRole("button", { name })).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Copy" }));
  expect(await navigator.clipboard.readText()).toBe("Copy me");
  expect(screen.getByRole("button", { name: "Copied" })).toBeInTheDocument();
});

it("a failed latest reply keeps its partial text, shows the safe error and retries its run", async () => {
  const retried: string[] = [];
  server.use(
    http.post(`${API}/runs/:runId/retry`, ({ params }) => {
      retried.push(String(params.runId));
      return HttpResponse.json(
        {
          chatId: "c1",
          userMessageId: "u1",
          assistantMessageId: "a2",
          run: { runId: "r2", status: "queued", triggerRunId: null, publicAccessToken: null },
        },
        { status: 201 },
      );
    }),
  );
  renderWithProviders(
    <AssistantMessage
      chatId="c1"
      latest
      message={message({
        status: "failed",
        runId: "r1",
        contentBlocks: [{ type: "text", text: "Half an answer" }],
        errorCode: "MODEL_UNAVAILABLE",
        errorMessage: "Free models are busy right now. Try again in a minute.",
      })}
    />,
  );
  expect(screen.getByText("Half an answer")).toBeInTheDocument();
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Something went wrong — Free models are busy right now. Try again in a minute.",
  );
  expect(screen.queryByRole("button", { name: "Copy" })).not.toBeInTheDocument();

  await userEvent.click(screen.getByRole("button", { name: "Retry" }));
  await waitFor(() => {
    expect(retried).toEqual(["r1"]);
  });
});

it("a stopped reply reads Stopped; an older one can't be retried", () => {
  renderWithProviders(
    <AssistantMessage
      chatId="c1"
      latest={false}
      message={message({ status: "cancelled", runId: "r1" })}
    />,
  );
  expect(screen.getByText("Stopped")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Retry" })).not.toBeInTheDocument();
});
