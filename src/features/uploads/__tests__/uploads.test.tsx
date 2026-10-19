import { useAuth } from "@clerk/nextjs";
import { act, renderHook, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, expect, it, vi } from "vitest";

import type { Attachment } from "@mohitbhalotia/magica-contracts";

import { AttachPopover } from "@/features/uploads/AttachPopover";
import { AttachmentChips } from "@/features/uploads/AttachmentChips";
import { MessageAttachments } from "@/features/uploads/MessageAttachments";
import { useUploads, type Chip } from "@/features/uploads/useUploads";
import { server } from "@/mocks/server";
import { API, renderWithProviders } from "@/test/render";

// Uppy talks to Transloadit over tus; these tests cover our side, so it's replaced by a stub.
vi.mock("@uppy/core", () => ({
  // A regular function, so `new Uppy()` works on the stub.
  default: vi.fn(function Uppy() {
    return {
      use: vi.fn(),
      on: vi.fn(),
      once: vi.fn(),
      addFile: vi.fn(),
      upload: vi.fn(() => Promise.resolve()),
      cancelAll: vi.fn(),
      destroy: vi.fn(),
      retryAll: vi.fn(),
    };
  }),
}));
vi.mock("@uppy/transloadit", () => ({ default: vi.fn() }));

const file = (patch: Partial<Attachment>): Attachment => ({
  id: "a1",
  clientFileId: "c1",
  name: "sky.png",
  kind: "image",
  mimeType: "image/png",
  sizeBytes: 1000,
  status: "ready",
  url: "https://r2.test/uploads/u/a1?X-Amz-Signature=x",
  width: 10,
  height: 10,
  durationMs: null,
  error: null,
  createdAt: "2026-10-19T10:00:00.000Z",
  ...patch,
});

beforeEach(() => {
  vi.mocked(useAuth).mockReturnValue({
    isSignedIn: true,
    userId: "user_1",
    getToken: () => Promise.resolve("token"),
  } as unknown as ReturnType<typeof useAuth>);
  URL.createObjectURL = vi.fn(() => "blob:preview");
});

it("picking files: media starts uploading, anything else fails with a reason", () => {
  const { result } = renderHook(() => useUploads());

  act(() => {
    result.current.add([
      new File(["x"], "sky.png", { type: "image/png" }),
      new File(["x"], "notes.pdf", { type: "application/pdf" }),
    ]);
  });

  expect(result.current.chips.map((chip) => [chip.name, chip.status])).toEqual([
    ["sky.png", "uploading"],
    ["notes.pdf", "failed"],
  ]);
  expect(result.current.chips[1]?.error).toContain("Only images, videos and audio");
  expect(result.current.ready).toBe(false);
});

it("library picks join ready and keep the order; removing one drops it", () => {
  const { result } = renderHook(() => useUploads());

  act(() => {
    result.current.addExisting([file({ id: "a2" }), file({ id: "a1" })]);
  });
  expect(result.current.attachmentIds).toEqual(["a2", "a1"]);
  expect(result.current.ready).toBe(true);

  act(() => {
    result.current.remove("a2");
  });
  expect(result.current.attachmentIds).toEqual(["a1"]);
});

it("at most 10 files", () => {
  const { result } = renderHook(() => useUploads());
  let warning: string | null = null;

  act(() => {
    warning = result.current.add(
      Array.from(
        { length: 12 },
        (_, i) => new File(["x"], `${String(i)}.png`, { type: "image/png" }),
      ),
    );
  });

  expect(result.current.chips).toHaveLength(10);
  expect(warning).toBe("You can attach up to 10 files.");
});

it("chips show progress, and retry / remove call back with the chip", async () => {
  const onRemove = vi.fn();
  const onRetry = vi.fn();
  const chips: Chip[] = [
    {
      key: "k1",
      name: "sky.png",
      kind: "image",
      previewUrl: null,
      status: "uploading",
      progress: 40,
    },
    {
      key: "k2",
      name: "clip.mp4",
      kind: "video",
      previewUrl: null,
      status: "failed",
      progress: 0,
      error: "Nope",
    },
  ];
  renderWithProviders(<AttachmentChips chips={chips} onRemove={onRemove} onRetry={onRetry} />);

  expect(screen.getByRole("progressbar", { name: "Uploading sky.png" })).toHaveTextContent("40%");
  await userEvent.click(screen.getByRole("button", { name: "Retry clip.mp4" }));
  await userEvent.click(screen.getByRole("button", { name: "Remove sky.png" }));

  expect(onRetry).toHaveBeenCalledWith("k2");
  expect(onRemove).toHaveBeenCalledWith("k1");
});

it("the popover offers the library; picked files come back in the order picked", async () => {
  server.use(
    http.get(`${API}/uploads`, () =>
      HttpResponse.json({
        items: [file({ id: "a1", name: "one.png" }), file({ id: "a2", name: "two.png" })],
        nextCursor: null,
      }),
    ),
  );
  const onPick = vi.fn();
  renderWithProviders(
    <AttachPopover
      trigger={<button type="button">Attach files</button>}
      onFiles={vi.fn()}
      onPick={onPick}
    />,
  );

  await userEvent.click(screen.getByRole("button", { name: "Attach files" }));
  expect(
    screen.getByText("Add a file from your device or select one from your library"),
  ).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Select Asset" }));
  await userEvent.click(await screen.findByRole("button", { name: "two.png" }));
  await userEvent.click(screen.getByRole("button", { name: "one.png" }));
  await userEvent.click(screen.getByRole("button", { name: /^Add/ }));

  await waitFor(() => {
    expect(onPick).toHaveBeenCalledTimes(1);
  });
  expect((onPick.mock.calls[0]?.[0] as Attachment[]).map((a) => a.id)).toEqual(["a2", "a1"]);
});

it("a sent message shows its files, in order", () => {
  renderWithProviders(
    <MessageAttachments
      attachments={[
        file({ id: "a1", name: "sky.png" }),
        file({ id: "a2", name: "clip.mp4", kind: "video" }),
      ]}
    />,
  );

  expect(screen.getAllByRole("link").map((link) => link.getAttribute("aria-label"))).toEqual([
    "Open sky.png",
    "Open clip.mp4",
  ]);
});
