import { useAuth } from "@clerk/nextjs";
import { screen, waitFor, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, expect, it, vi } from "vitest";

import type { ApiKey } from "@mohitbhalotia/magica-contracts";

import { ApiKeysDialog } from "@/features/apiKeys/ApiKeysDialog";
import { server } from "@/mocks/server";
import { useUiStore } from "@/stores/uiStore";
import { API, renderWithProviders } from "@/test/render";

const at = "2026-10-20T10:00:00.000Z";
const key = (id: string, name: string): ApiKey => ({
  id,
  name,
  prefix: "ak_3f9Q2xZ",
  createdAt: at,
  lastUsedAt: null,
});

let keys: ApiKey[];
beforeEach(() => {
  vi.mocked(useAuth).mockReturnValue({
    isSignedIn: true,
    userId: "user_1",
    getToken: () => Promise.resolve("token"),
  } as unknown as ReturnType<typeof useAuth>);
  keys = [key("k1", "CI")];
  useUiStore.setState({ apiKeysOpen: true });
  server.use(
    http.get(`${API}/api-keys`, () => HttpResponse.json({ items: keys, nextCursor: null })),
    http.post(`${API}/api-keys`, async ({ request }) => {
      const { name } = (await request.json()) as { name: string };
      const created = key("k2", name);
      keys = [created, ...keys];
      return HttpResponse.json({ apiKey: created, key: "ak_secret_shown_once" }, { status: 201 });
    }),
    http.delete(`${API}/api-keys/:id`, ({ params }) => {
      keys = keys.filter((k) => k.id !== params.id);
      return new HttpResponse(null, { status: 204 });
    }),
  );
});

it("lists the keys by name and prefix, never the key itself", async () => {
  renderWithProviders(<ApiKeysDialog />);
  const list = await screen.findByRole("list", { name: "Your API keys" });
  expect(within(list).getByText("CI")).toBeInTheDocument();
  expect(within(list).getByText("ak_3f9Q2xZ…")).toBeInTheDocument();
  expect(within(list).getByText(/Never used/)).toBeInTheDocument();
});

it("a new key is shown once, and forgotten when the dialog closes", async () => {
  const user = userEvent.setup();
  renderWithProviders(<ApiKeysDialog />);
  await user.type(screen.getByRole("textbox", { name: "Key name" }), "Server");
  await user.click(screen.getByRole("button", { name: "Create key" }));

  expect(await screen.findByText("ak_secret_shown_once")).toBeInTheDocument();
  await waitFor(() => {
    expect(screen.getByText("Server")).toBeInTheDocument();
  });

  await user.click(screen.getByRole("button", { name: "Close" }));
  useUiStore.setState({ apiKeysOpen: true });
  expect(await screen.findByRole("list", { name: "Your API keys" })).toBeInTheDocument();
  expect(screen.queryByText("ak_secret_shown_once")).not.toBeInTheDocument();
});

it("revoking asks to confirm, then the key is gone", async () => {
  const user = userEvent.setup();
  renderWithProviders(<ApiKeysDialog />);
  await user.click(await screen.findByRole("button", { name: "Revoke" }));
  await user.click(screen.getByRole("button", { name: "Revoke CI?" }));

  expect(await screen.findByText("No keys yet.")).toBeInTheDocument();
});

it("Create stays off until the key has a name", () => {
  renderWithProviders(<ApiKeysDialog />);
  expect(screen.getByRole("button", { name: "Create key" })).toBeDisabled();
});
