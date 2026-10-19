import { useAuth } from "@clerk/nextjs";
import { screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, expect, it, vi } from "vitest";

import type { ChatAsset } from "@mohitbhalotia/magica-contracts";

import { FilesButton } from "@/features/chat/FilesModal";
import { server } from "@/mocks/server";
import { API, renderWithProviders } from "@/test/render";

const asset = (patch: Partial<ChatAsset>): ChatAsset => ({
  id: "a1",
  kind: "image",
  url: "https://g.tlcdn.com/gen/apple.png",
  mimeType: "image/png",
  width: 1024,
  height: 1024,
  sizeBytes: 1_153_434,
  prompt: "a red apple",
  model: "gpt-image-2-text",
  createdAt: "2026-10-17T10:00:00.000Z",
  ...patch,
});

beforeEach(() => {
  vi.mocked(useAuth).mockReturnValue({
    isSignedIn: true,
    userId: "user_1",
    getToken: () => Promise.resolve("token"),
  } as unknown as ReturnType<typeof useAuth>);
  server.use(
    http.get(`${API}/chats/c1/assets`, () =>
      HttpResponse.json({
        items: [
          asset({}),
          asset({
            id: "a2",
            kind: "video",
            url: "https://g.tlcdn.com/gen/merged.mp4",
            mimeType: "video/mp4",
            sizeBytes: undefined,
          }),
        ],
        nextCursor: null,
      }),
    ),
  );
});

it("lists the chat's files by day, with the reference's chips and meta", async () => {
  const user = userEvent.setup();
  renderWithProviders(<FilesButton chatId="c1" />);

  await user.click(screen.getByRole("button", { name: "View all files in this task" }));
  const dialog = await screen.findByRole("dialog", { name: "All files in this task" });

  expect(await within(dialog).findByText("Saturday, October 17, 2026")).toBeInTheDocument();
  expect(within(dialog).getByText("PNG · Sat, Oct 17 · 1.1 MB")).toBeInTheDocument();
  expect(within(dialog).getByText("MP4 · Sat, Oct 17")).toBeInTheDocument();
  // The count is a separate span, so the chip's name reads "All2", as in the reference.
  expect(within(dialog).getByRole("button", { name: "All2" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(within(dialog).getByRole("button", { name: "Documents" })).toBeInTheDocument();

  await user.click(within(dialog).getByRole("button", { name: "Videos1" }));
  expect(within(dialog).queryByText("PNG · Sat, Oct 17 · 1.1 MB")).not.toBeInTheDocument();
  expect(within(dialog).getByText("video file")).toBeInTheDocument();
});

it("an empty chat says so, and Download all is disabled", async () => {
  server.use(
    http.get(`${API}/chats/c1/assets`, () => HttpResponse.json({ items: [], nextCursor: null })),
  );
  const user = userEvent.setup();
  renderWithProviders(<FilesButton chatId="c1" />);

  await user.click(screen.getByRole("button", { name: "View all files in this task" }));

  expect(await screen.findByText("No files yet")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Download all" })).toBeDisabled();
});
