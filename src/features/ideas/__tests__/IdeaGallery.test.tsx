import { render, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { beforeEach, expect, it } from "vitest";

import { IdeaGallery } from "@/features/ideas/IdeaGallery";
import { IDEAS } from "@/features/ideas/ideas";
import { NEW_CHAT, useComposerStore } from "@/stores/composerStore";

const cards = () => within(screen.getByRole("list")).getAllByRole("button");

beforeEach(() => {
  useComposerStore.setState({ drafts: {} });
});

it("shows a page of ideas, then the rest on See more ideas", async () => {
  render(<IdeaGallery />);
  expect(screen.getByRole("tab", { name: "All" })).toHaveAttribute("aria-selected", "true");
  expect(cards()).toHaveLength(9);

  await userEvent.click(screen.getByRole("button", { name: "See more ideas" }));
  expect(cards()).toHaveLength(IDEAS.length);
  expect(screen.queryByRole("button", { name: "See more ideas" })).not.toBeInTheDocument();
});

it("a tab shows only its category", async () => {
  render(<IdeaGallery />);
  await userEvent.click(screen.getByRole("tab", { name: "Branding & Design" }));
  const expected = IDEAS.filter((i) => i.category === "Branding & Design").map((i) => i.title);
  expect(cards().map((c) => c.textContent)).toEqual(expected);
});

it("a card fills the new-chat draft without sending", async () => {
  render(<IdeaGallery />);
  const idea = IDEAS[0];
  if (!idea) throw new Error("no ideas");
  await userEvent.click(screen.getByRole("button", { name: idea.title }));
  expect(useComposerStore.getState().drafts[NEW_CHAT]).toBe(idea.prompt);
});
