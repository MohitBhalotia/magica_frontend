import { expect, test } from "@playwright/test";

import { expectNoSeriousViolations } from "./axe";

// M6 step 5: every screen a signed-out visitor can reach. Signed-in screens: journeys/.

for (const [name, size] of [
  ["desktop", { width: 1440, height: 900 }],
  ["mobile", { width: 390, height: 844 }],
] as const) {
  test.describe(name, () => {
    test.use({ viewport: size });

    test("the empty state", async ({ page }) => {
      await page.goto("/chat");
      await expect(page.getByRole("heading", { name: "Your AI worker" })).toBeVisible();
      await expectNoSeriousViolations(page);
    });

    test("a chat URL while signed out", async ({ page }) => {
      await page.goto("/chat/00000000-0000-4000-8000-000000000000");
      await expect(page.getByRole("heading", { name: "Sign in to see this task" })).toBeVisible();
      await expectNoSeriousViolations(page);
    });
  });
}

test("the search dialog", async ({ page }) => {
  await page.goto("/chat");
  await expect(page.getByRole("heading", { name: "Your AI worker" })).toBeVisible();
  await page.keyboard.press("ControlOrMeta+k");
  await expect(page.getByRole("dialog")).toBeVisible();
  await expectNoSeriousViolations(page);
});

test("keyboard: ⌘K opens search, Esc closes it and focus goes back", async ({ page }) => {
  await page.goto("/chat");
  const composer = page.getByRole("textbox", { name: "Message" });
  await composer.focus();
  await page.keyboard.press("ControlOrMeta+k");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(composer).toBeFocused();
});

test("keyboard: Shift+Enter adds a line instead of sending", async ({ page }) => {
  await page.goto("/chat");
  const composer = page.getByRole("textbox", { name: "Message" });
  await composer.fill("one");
  await composer.press("Shift+Enter");
  await composer.pressSequentially("two");
  await expect(composer).toHaveValue("one\ntwo");
});

test("keyboard: every idea tab is reachable and selects with the arrow keys", async ({ page }) => {
  await page.goto("/chat");
  const all = page.getByRole("tab", { name: "All" });
  await all.focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  await expect(all).toHaveAttribute("aria-selected", "false");
  await expect(page.getByRole("tabpanel")).toBeVisible();
});

test("the mobile sidebar drawer", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/chat");
  await page.getByRole("button", { name: "Open sidebar" }).click();
  await expect(page.getByRole("dialog", { name: "Sidebar" })).toBeVisible();
  await expectNoSeriousViolations(page);
});
