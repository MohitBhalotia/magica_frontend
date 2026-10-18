import { expect, test } from "@playwright/test";

test("/ redirects to the chat shell with Clerk sign-in", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/chat$/);
  await expect(page.getByRole("heading", { name: "Your AI worker" })).toBeVisible();
  await expect(page.getByRole("banner").getByRole("button", { name: /sign in/i })).toBeVisible();
});

test("mobile: the sidebar opens as a drawer", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/chat");
  await page.getByRole("button", { name: "Open sidebar" }).click();
  await expect(page.getByRole("dialog", { name: "Sidebar" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Sidebar" })).toBeHidden();
});
