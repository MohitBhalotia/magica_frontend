import { screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { beforeEach, expect, it } from "vitest";

import { IdeaGallery } from "@/features/ideas/IdeaGallery";
import { IDEAS } from "@/features/ideas/ideas";
import { NEW_CHAT, useComposerStore } from "@/stores/composerStore";
import { renderWithProviders } from "@/test/render";

const cards = () => within(screen.getByRole("list")).getAllByRole("button");

beforeEach(() => {
  useComposerStore.setState({ drafts: {} });
});

it("All shows every reference idea, with video previews and images", () => {
  renderWithProviders(<IdeaGallery />);
  expect(screen.getByRole("tab", { name: "All" })).toHaveAttribute("aria-selected", "true");
  expect(cards()).toHaveLength(IDEAS.length);
  expect(IDEAS.some((i) => i.video) && IDEAS.some((i) => i.image)).toBe(true);
});

it("a tab shows only the ideas the reference lists under it", async () => {
  renderWithProviders(<IdeaGallery />);
  await userEvent.click(screen.getByRole("tab", { name: "Image & Editing" }));
  const expected = IDEAS.filter((i) => i.categories.includes("Image & Editing")).map(
    (i) => i.title,
  );
  expect(expected.length).toBeGreaterThan(0);
  expect(cards().map((c) => c.textContent)).toEqual(expected);
});

it("a card fills the new-chat draft without sending; hovering a video card is safe", async () => {
  renderWithProviders(<IdeaGallery />);
  const idea = IDEAS.find((i) => i.video);
  if (!idea) throw new Error("no video idea");
  const card = screen.getByRole("button", { name: idea.title });
  await userEvent.hover(card);
  await userEvent.click(card);
  expect(useComposerStore.getState().drafts[NEW_CHAT]).toBe(idea.prompt);
});

it("See more ideas explains it isn't available", async () => {
  renderWithProviders(<IdeaGallery />);
  await userEvent.click(screen.getByRole("button", { name: "See more ideas" }));
  expect(await screen.findByText("Not available in this build")).toBeInTheDocument();
});
