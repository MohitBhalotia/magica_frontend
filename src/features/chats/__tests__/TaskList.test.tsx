import { useAuth } from "@clerk/nextjs";
import { screen, waitFor, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, expect, it, vi } from "vitest";

import type { ChatSummary } from "@mohitbhalotia/magica-contracts";

import { TaskList } from "@/features/chats/TaskList";
import { server } from "@/mocks/server";
import { API, renderWithProviders } from "@/test/render";
import { router } from "@/test/router";

const at = "2026-10-18T10:00:00.000Z";
const chat = (id: string, title: string, isPinned = false): ChatSummary => ({
  id,
  title,
  titleSource: "prompt",
  isPinned,
  createdAt: at,
  updatedAt: at,
});

// In-memory backend: the list refetches after every mutation, so handlers keep it current.
let db: ChatSummary[];
beforeEach(() => {
  db = [chat("c1", "Red apple"), chat("c2", "Greeting")];
  vi.mocked(useAuth).mockReturnValue({
    isSignedIn: true,
    userId: "user_1",
    getToken: () => Promise.resolve("token"),
  } as unknown as ReturnType<typeof useAuth>);
  server.use(
    http.get(`${API}/chats`, () =>
      HttpResponse.json({
        items: [...db.filter((c) => c.isPinned), ...db.filter((c) => !c.isPinned)],
        nextCursor: null,
      }),
    ),
    http.patch(`${API}/chats/:id`, async ({ params, request }) => {
      const patch = (await request.json()) as Partial<ChatSummary>;
      db = db.map((c) => (c.id === params.id ? { ...c, ...patch } : c));
      return HttpResponse.json(db.find((c) => c.id === params.id));
    }),
    http.delete(`${API}/chats/:id`, ({ params }) => {
      db = db.filter((c) => c.id !== params.id);
      return new HttpResponse(null, { status: 204 });
    }),
    http.post(`${API}/chats/:id/duplicate`, () => {
      const copy = chat("c3", "Greeting - Copy");
      db = [copy, ...db];
      return HttpResponse.json(copy, { status: 201 });
    }),
  );
});

const openMenu = async (title: string) => {
  const row = screen.getByRole("link", { name: title }).closest("li");
  if (!row) throw new Error(`No row for "${title}"`);
  await userEvent.click(within(row).getByRole("button", { name: "Chat actions" }));
};
const section = (name: string) => screen.getByRole("region", { name });

it("shows a skeleton, then recent tasks", async () => {
  renderWithProviders(<TaskList />);
  expect(screen.getByLabelText("Loading tasks")).toBeInTheDocument();
  await screen.findByRole("link", { name: "Greeting" });
  const link = within(section("Recent tasks")).getByRole("link", { name: "Greeting" });
  expect(link).toHaveAttribute("href", "/chat/c2");
  expect(screen.queryByRole("region", { name: "Pinned tasks" })).not.toBeInTheDocument();
});

it("shows the empty state", async () => {
  db = [];
  renderWithProviders(<TaskList />);
  expect(await screen.findByText("No tasks yet")).toBeInTheDocument();
});

it("pin moves the row into Pinned tasks", async () => {
  renderWithProviders(<TaskList />);
  await screen.findByRole("link", { name: "Greeting" });

  await openMenu("Greeting");
  await userEvent.click(screen.getByRole("menuitem", { name: "Pin to top" }));
  expect(
    within(section("Pinned tasks")).getByRole("link", { name: "Greeting" }),
  ).toBeInTheDocument();
  await waitFor(() => {
    expect(db.find((c) => c.id === "c2")?.isPinned).toBe(true);
  });
});

it("rolls back and toasts when the server rejects a change", async () => {
  server.use(
    http.patch(`${API}/chats/:id`, () =>
      HttpResponse.json(
        { error: { code: "INTERNAL", message: "Could not save. Try again.", traceId: "t1" } },
        { status: 500 },
      ),
    ),
  );
  renderWithProviders(<TaskList />);
  await screen.findByRole("link", { name: "Greeting" });

  await openMenu("Greeting");
  await userEvent.click(screen.getByRole("menuitem", { name: "Pin to top" }));
  expect(await screen.findByText("Could not save. Try again.")).toBeInTheDocument();
  expect(screen.queryByRole("region", { name: "Pinned tasks" })).not.toBeInTheDocument();
});

it("renames inline: Enter saves, Escape cancels", async () => {
  renderWithProviders(<TaskList />);
  await screen.findByRole("link", { name: "Greeting" });

  await openMenu("Greeting");
  await userEvent.click(screen.getByRole("menuitem", { name: "Rename" }));
  const input = screen.getByRole("textbox", { name: "Task title" });
  expect(input).toHaveFocus();
  await userEvent.keyboard("Hello there{Enter}");
  expect(screen.getByRole("link", { name: "Hello there" })).toBeInTheDocument();

  await openMenu("Red apple");
  await userEvent.click(screen.getByRole("menuitem", { name: "Rename" }));
  await userEvent.keyboard("Nope{Escape}");
  expect(screen.getByRole("link", { name: "Red apple" })).toBeInTheDocument();
  await waitFor(() => {
    expect(db.find((c) => c.id === "c2")?.title).toBe("Hello there");
  });
});

it("delete asks first, then removes the row", async () => {
  renderWithProviders(<TaskList />);
  await screen.findByRole("link", { name: "Greeting" });

  await openMenu("Greeting");
  await userEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
  const dialog = screen.getByRole("alertdialog", { name: "Delete task?" });
  await userEvent.click(within(dialog).getByRole("button", { name: "Delete" }));
  expect(screen.queryByRole("link", { name: "Greeting" })).not.toBeInTheDocument();
  await waitFor(() => {
    expect(db.map((c) => c.id)).toEqual(["c1"]);
  });
});

it("duplicate asks first, then opens the copy with a toast", async () => {
  renderWithProviders(<TaskList />);
  await screen.findByRole("link", { name: "Greeting" });

  await openMenu("Greeting");
  await userEvent.click(screen.getByRole("menuitem", { name: "Duplicate" }));
  const dialog = screen.getByRole("dialog", { name: "Duplicate task" });
  await userEvent.click(within(dialog).getByRole("button", { name: "Duplicate task" }));
  expect(await screen.findByText("Task duplicated")).toBeInTheDocument();
  expect(router.push).toHaveBeenCalledWith("/chat/c3");
  expect(await screen.findByRole("link", { name: "Greeting - Copy" })).toBeInTheDocument();
});
