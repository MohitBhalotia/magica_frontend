import { useAuth } from "@clerk/nextjs";
import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { beforeEach, expect, it, vi } from "vitest";

import type { ChatDetail } from "@mohitbhalotia/magica-contracts";

import { ChatThread } from "@/features/chat/ChatThread";
import { server } from "@/mocks/server";
import { API, renderWithProviders } from "@/test/render";

const at = "2026-10-18T10:00:00.000Z";
const message = (id: string, text: string) => ({
  id,
  role: "user" as const,
  status: "success" as const,
  text,
  contentBlocks: [],
  metadata: null,
  errorCode: null,
  errorMessage: null,
  createdAt: at,
  completedAt: at,
  runId: null,
});
const chat: ChatDetail = {
  id: "c1",
  title: "Logo",
  titleSource: "prompt",
  isPinned: false,
  createdAt: at,
  updatedAt: at,
  // Newest first, as the API pages them.
  messages: {
    items: [message("m2", "second"), message("m1", "first\nline two")],
    nextCursor: null,
  },
  activeRun: null,
};

const signIn = (signedIn: boolean) => {
  vi.mocked(useAuth).mockReturnValue({
    isSignedIn: signedIn,
    userId: signedIn ? "user_1" : null,
    getToken: () => Promise.resolve(signedIn ? "token" : null),
  } as unknown as ReturnType<typeof useAuth>);
};

beforeEach(() => {
  signIn(true);
});

it("shows the messages oldest first", async () => {
  server.use(http.get(`${API}/chats/c1`, () => HttpResponse.json(chat)));
  renderWithProviders(<ChatThread id="c1" />);

  const log = await screen.findByRole("log", { name: "Chat messages" });
  expect(log.textContent).toBe("first\nline twosecond");
  expect(document.title).toBe("Logo | Magica");
});

it("a missing or foreign chat shows Task not found with a way out", async () => {
  server.use(
    http.get(`${API}/chats/nope`, () =>
      HttpResponse.json(
        { error: { code: "NOT_FOUND", message: "Chat not found.", traceId: "t" } },
        { status: 404 },
      ),
    ),
  );
  renderWithProviders(<ChatThread id="nope" />);

  expect(await screen.findByRole("heading", { name: "Task not found" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "New task" })).toHaveAttribute("href", "/chat");
});

it("signed out, asks to sign in instead of fetching", () => {
  signIn(false);
  renderWithProviders(<ChatThread id="c1" />);
  expect(screen.getByRole("heading", { name: "Sign in to see this task" })).toBeInTheDocument();
});
