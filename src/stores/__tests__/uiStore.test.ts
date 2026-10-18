import { beforeEach, expect, it } from "vitest";

import { useUiStore } from "@/stores/uiStore";

beforeEach(() => {
  useUiStore.setState({ drawerOpen: false });
});

it("opens and closes the mobile drawer", () => {
  useUiStore.getState().setDrawerOpen(true);
  expect(useUiStore.getState().drawerOpen).toBe(true);
  useUiStore.getState().setDrawerOpen(false);
  expect(useUiStore.getState().drawerOpen).toBe(false);
});
