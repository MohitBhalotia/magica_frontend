import { render } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { beforeEach, expect, it } from "vitest";

import { Shortcuts } from "@/features/shell/Shortcuts";
import { useUiStore } from "@/stores/uiStore";
import { router } from "@/test/router";

beforeEach(() => {
  useUiStore.setState({ searchOpen: false, drawerOpen: false });
});

it("Ctrl+K toggles search", async () => {
  render(<Shortcuts />);
  await userEvent.keyboard("{Control>}k{/Control}");
  expect(useUiStore.getState().searchOpen).toBe(true);
  await userEvent.keyboard("{Control>}k{/Control}");
  expect(useUiStore.getState().searchOpen).toBe(false);
});

it("Ctrl+Shift+O starts a new task and closes search and the drawer", async () => {
  useUiStore.setState({ searchOpen: true, drawerOpen: true });
  render(<Shortcuts />);
  await userEvent.keyboard("{Control>}{Shift>}o{/Shift}{/Control}");
  expect(router.push).toHaveBeenCalledWith("/chat");
  expect(useUiStore.getState()).toMatchObject({ searchOpen: false, drawerOpen: false });
});
