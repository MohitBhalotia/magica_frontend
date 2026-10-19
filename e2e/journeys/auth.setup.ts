import { clerk, clerkSetup } from "@clerk/testing/playwright";
import { expect, test as setup } from "@playwright/test";

/** Signed-in browser state shared by every journey (Clerk dev instance, seeded e2e user). */
const AUTH_FILE = "playwright/.clerk/user.json";

setup("sign in the e2e user", async ({ page }) => {
  setup.setTimeout(90_000);
  // A Clerk testing token, so bot protection lets the scripted browser through.
  await clerkSetup();
  await page.goto("/chat");
  await clerk.signIn({ page, emailAddress: process.env.E2E_CLERK_USER_EMAIL ?? "" });
  await page.goto("/chat");
  await expect(page.getByRole("textbox", { name: "Message" })).toBeVisible();
  await expect(page.getByRole("banner").getByRole("button", { name: /sign in/i })).toHaveCount(0);
  await page.context().storageState({ path: AUTH_FILE });
});
