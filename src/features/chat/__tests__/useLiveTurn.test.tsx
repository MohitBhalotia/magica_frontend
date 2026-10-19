import { useAuth } from "@clerk/nextjs";
import { act, screen, waitFor } from "@testing-library/react";
import { useRealtimeRun } from "@trigger.dev/react-hooks";
import { http, HttpResponse } from "msw";
import { beforeEach, expect, it, vi } from "vitest";

import type { ChatDetail, RunHandle } from "@mohitbhalotia/magica-contracts";

import { useLiveTurn } from "@/features/chat/useLiveTurn";
import { useChat } from "@/features/chats/useChats";
import { server } from "@/mocks/server";
import { API, renderWithProviders } from "@/test/render";

vi.mock("@trigger.dev/react-hooks", () => ({
  useRealtimeStream: vi.fn(() => ({ parts: [] })),
  useRealtimeRun: vi.fn(() => ({ run: undefined })),
}));

const handle = (patch: Partial<RunHandle> = {}): RunHandle => ({
  runId: "r1",
  status: "working",
  triggerRunId: "run_1",
  publicAccessToken: "pk",
  waitpoint: null,
  ...patch,
});
const chat: ChatDetail = {
  id: "c1",
  title: "Logo",
  titleSource: "generated",
  isPinned: false,
  createdAt: "2026-10-19T10:00:00.000Z",
  updatedAt: "2026-10-19T10:00:00.000Z",
  messages: { items: [], nextCursor: null },
  activeRun: handle(),
};

/** The live turn plus the chat query it refreshes, like LiveTurn inside ChatThread. */
function Probe() {
  useChat("c1");
  const { waitpoint } = useLiveTurn("c1", handle());
  return <p>{waitpoint ? `asks ${waitpoint.id}` : "no question"}</p>;
}

let chatLoads: number;
beforeEach(() => {
  vi.mocked(useAuth).mockReturnValue({
    isSignedIn: true,
    userId: "user_1",
    getToken: () => Promise.resolve("token"),
  } as unknown as ReturnType<typeof useAuth>);
  chatLoads = 0;
  server.use(
    http.get(`${API}/chats/c1`, () => {
      chatLoads++;
      return HttpResponse.json(chat);
    }),
  );
});

it("when Realtime fails, it polls the run: shows its question, then the saved reply when it ends", async () => {
  let status: RunHandle["status"] = "waiting";
  const waitpoint = {
    id: "w1",
    type: "options" as const,
    status: "pending" as const,
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    request: { question: "Which style?", options: ["Photo", "Watercolor"] },
  };
  server.use(
    http.get(`${API}/runs/r1`, () =>
      HttpResponse.json(handle({ status, waitpoint: status === "waiting" ? waitpoint : null })),
    ),
  );
  renderWithProviders(<Probe />);
  await waitFor(() => {
    expect(chatLoads).toBe(1);
  });

  // Realtime drops; the run is still waiting on the user.
  const [, options] = vi.mocked(useRealtimeRun).mock.calls.at(-1) ?? [];
  act(() => {
    options?.onComplete?.(undefined as never, new Error("realtime down"));
  });
  expect(await screen.findByText("asks w1", {}, { timeout: 4000 })).toBeInTheDocument();
  expect(chatLoads).toBe(1);

  // The run ends: polling sees it and the chat reloads its saved reply.
  status = "completed";
  await waitFor(
    () => {
      expect(chatLoads).toBeGreaterThan(1);
    },
    { timeout: 5000 },
  );
});

it("a normal end of the Realtime run reloads the chat at once", async () => {
  renderWithProviders(<Probe />);
  await waitFor(() => {
    expect(chatLoads).toBe(1);
  });

  const [, options] = vi.mocked(useRealtimeRun).mock.calls.at(-1) ?? [];
  act(() => {
    options?.onComplete?.(undefined as never);
  });

  await waitFor(() => {
    expect(chatLoads).toBe(2);
  });
});
