import { expect, test } from "@playwright/test";

test("/ redirects to the chat shell with Clerk sign-in", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/chat$/);
  await expect(page.getByRole("heading", { name: "Your AI worker" })).toBeVisible();
  await expect(page.getByRole("banner").getByRole("button", { name: /sign in/i })).toBeVisible();
});

test("/chat/a/b matches no route: a real 404", async ({ page }) => {
  const res = await page.goto("/chat/a/b");
  expect(res?.status()).toBe(404);
});

// Regression: on Vercel the old optional catch-all served the /chat prerender (empty state) for
// every chat URL on a full load. A chat URL must never render the empty state.
test("a chat URL loads the chat view, not the empty state", async ({ page }) => {
  await page.goto("/chat/00000000-0000-4000-8000-000000000000");
  await expect(page.getByRole("heading", { name: "Sign in to see this task" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Your AI worker" })).toHaveCount(0);
});

test("mobile: no sideways page scroll, the composer is fully on screen, no focus zoom", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto("/chat");
  const composer = page.getByRole("textbox", { name: "Message" });
  await expect(composer).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  const send = await page.getByRole("button", { name: "Send message" }).boundingBox();
  expect(send && send.x + send.width).toBeLessThanOrEqual(360);
  await expect(page.locator('meta[name="viewport"]')).toHaveAttribute(
    "content",
    /maximum-scale=1.*interactive-widget=resizes-content/,
  );
});

test("mobile: the sidebar opens as a drawer", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/chat");
  await page.getByRole("button", { name: "Open sidebar" }).click();
  await expect(page.getByRole("dialog", { name: "Sidebar" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Sidebar" })).toBeHidden();
});
