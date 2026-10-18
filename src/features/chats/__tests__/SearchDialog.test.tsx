import { useAuth } from "@clerk/nextjs";
import { screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, expect, it, vi } from "vitest";

import type { ChatSummary } from "@mohitbhalotia/magica-contracts";

import { SearchDialog } from "@/features/chats/SearchDialog";
import { Shortcuts } from "@/features/shell/Shortcuts";
import { server } from "@/mocks/server";
import { useUiStore } from "@/stores/uiStore";
import { API, renderWithProviders } from "@/test/render";
import { router } from "@/test/router";

const at = "2026-10-18T10:00:00.000Z";
const chat = (id: string, title: string): ChatSummary => ({
  id,
  title,
  titleSource: "prompt",
  isPinned: false,
  createdAt: at,
  updatedAt: at,
});

let searched: string[];
beforeEach(() => {
  searched = [];
  useUiStore.setState({ searchOpen: false });
  vi.mocked(useAuth).mockReturnValue({
    isSignedIn: true,
    userId: "user_1",
    getToken: () => Promise.resolve("token"),
  } as unknown as ReturnType<typeof useAuth>);
  server.use(
    http.get(`${API}/chats`, () =>
      HttpResponse.json({
        items: [chat("c1", "Bakery logo"), chat("c2", "Greeting")],
        nextCursor: null,
      }),
    ),
    http.get(`${API}/chats/search`, ({ request }) => {
      const q = new URL(request.url).searchParams.get("q") ?? "";
      searched.push(q);
      return HttpResponse.json({
        items: [chat("c1", "Bakery logo"), chat("c3", "Logo ideas")].map((c) => ({
          ...c,
          snippet: "",
        })),
        nextCursor: null,
      });
    }),
  );
});

const options = () =>
  within(screen.getByRole("listbox", { name: "Suggestions" })).getAllByRole("option");

it("Ctrl+K opens it with recent tasks; Esc closes it", async () => {
  renderWithProviders(
    <>
      <SearchDialog />
      <Shortcuts />
    </>,
  );
  await userEvent.keyboard("{Control>}k{/Control}");

  expect(await screen.findByRole("dialog", { name: "Search tasks" })).toBeInTheDocument();
  expect(await screen.findByText("End of search results")).toBeInTheDocument();
  expect(options().map((o) => o.textContent)).toEqual(["Bakery logo", "Greeting"]);

  await userEvent.keyboard("{Escape}");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

it("typing searches once, bolds the match, and Enter opens the selected task", async () => {
  useUiStore.setState({ searchOpen: true });
  renderWithProviders(<SearchDialog />);

  await userEvent.type(screen.getByRole("combobox", { name: "Search projects and tasks" }), "logo");
  expect(await screen.findByText("Logo", { selector: "strong" })).toBeInTheDocument();
  expect(searched).toEqual(["logo"]);
  expect(options()[0]).toHaveAttribute("aria-selected", "true");

  await userEvent.keyboard("{ArrowDown}{Enter}");
  expect(router.push).toHaveBeenCalledWith("/chat/c3");
  expect(useUiStore.getState().searchOpen).toBe(false);
});

it("New task starts a fresh chat", async () => {
  useUiStore.setState({ searchOpen: true });
  renderWithProviders(<SearchDialog />);
  await userEvent.click(screen.getByRole("button", { name: /New task/ }));
  expect(router.push).toHaveBeenCalledWith("/chat");
});
