import { act, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { beforeEach, expect, it } from "vitest";

import { AppSidebar } from "@/features/shell/AppSidebar";
import { useUiStore } from "@/stores/uiStore";

beforeEach(() => {
  useUiStore.setState({ drawerOpen: false });
});

it("shows the drawer when the store opens it, and Esc closes it", async () => {
  render(<AppSidebar />);
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

  act(() => {
    useUiStore.getState().setDrawerOpen(true);
  });
  expect(await screen.findByRole("dialog", { name: "Sidebar" })).toBeInTheDocument();

  await userEvent.keyboard("{Escape}");
  expect(useUiStore.getState().drawerOpen).toBe(false);
});
