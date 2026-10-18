import { act, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { beforeEach, expect, it } from "vitest";

import { AppSidebar } from "@/features/shell/AppSidebar";
import { useUiStore } from "@/stores/uiStore";

beforeEach(() => {
  useUiStore.setState({ drawerOpen: false, sidebarCollapsed: false });
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

it("collapses to the rail and opens again", async () => {
  render(<AppSidebar />);

  await userEvent.click(screen.getByRole("button", { name: "Close sidebar" }));
  expect(useUiStore.getState().sidebarCollapsed).toBe(true);
  expect(screen.queryByRole("button", { name: "Close sidebar" })).not.toBeInTheDocument();

  await userEvent.click(screen.getByRole("button", { name: "Open sidebar" }));
  expect(useUiStore.getState().sidebarCollapsed).toBe(false);
});
