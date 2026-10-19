import { expect, test, type Page } from "@playwright/test";

import { expectNoSeriousViolations } from "../axe";

// PRD §3 journeys that run on the free model only (no Magica credits): J1 first task, J5 reload
// mid-run, J6 Stop, J9 manage chats, plus axe and the 390px pass on the signed-in thread. They
// run against the deployed app after each deploy (CI `journeys`). Media journeys J2–J4 and J7
// spend Magica credits: they're run by hand, on request.

const API = process.env.E2E_API_URL ?? "https://magica-galaxy-backend.vercel.app";
// The free model can queue for a while before it answers.
const REPLY_MS = 150_000;
const LONG_PROMPT = "Write a 400-word story about a lighthouse keeper. Plain text, no headings.";

test.describe.configure({ mode: "parallel", timeout: 240_000 });

const created: string[] = [];
const chatIdOf = (page: Page) => new URL(page.url()).pathname.split("/").at(-1) ?? "";

/** Sends `prompt` from the empty state and waits for the chat's URL. */
async function startTask(page: Page, prompt: string) {
  await page.goto("/chat");
  // Send waits for Clerk (a click before it loads does nothing), and typing before React
  // hydrates is lost (known gap), so wait for one and retry until Send accepts the text.
  await page.waitForFunction(
    () => (window as unknown as { Clerk?: { loaded?: boolean } }).Clerk?.loaded,
  );
  await expect(async () => {
    await page.getByRole("textbox", { name: "Message" }).fill(prompt);
    await expect(page.getByRole("button", { name: "Send message" })).toBeEnabled({ timeout: 1000 });
  }).toPass();
  await page.getByRole("button", { name: "Send message" }).click();
  await page.waitForURL(/\/chat\/[0-9a-f-]{36}$/);
  created.push(chatIdOf(page));
}

/** The reply is done once Stop is gone again (the composer is back to Send). */
async function replyDone(page: Page) {
  // Stop may not be on screen yet just after sending, so also wait for the saved reply's Copy
  // (the user's bubble has the first one).
  const log = page.getByRole("log", { name: "Chat messages" });
  await expect(log.getByRole("button", { name: "Copy" }).nth(1)).toBeAttached({
    timeout: REPLY_MS,
  });
  await expect(page.getByRole("button", { name: "Stop" })).toBeHidden({ timeout: REPLY_MS });
}

// Every chat a journey made is deleted again, so the e2e user's list stays small.
test.afterAll(async ({ browser }) => {
  const page = await browser.newPage({ storageState: "playwright/.clerk/user.json" });
  await page.goto("/chat");
  type WithClerk = { Clerk?: { session?: { getToken: () => Promise<string> } } };
  await page.waitForFunction(() => (window as unknown as WithClerk).Clerk?.session);
  await page.evaluate(
    async ({ api, ids }) => {
      const token = await (window as unknown as WithClerk).Clerk?.session?.getToken();
      await Promise.all(
        ids.map((id) =>
          fetch(`${api}/api/v1/chats/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          }),
        ),
      );
    },
    { api: API, ids: created },
  );
  await page.close();
});

test("J1 first task: the chat appears, the reply streams in and is saved", async ({ page }) => {
  await startTask(page, "Reply with one short sentence that includes the word lighthouse.");
  const id = chatIdOf(page);
  await expect(page.locator(`a[href="/chat/${id}"]`)).toBeVisible();
  const log = page.getByRole("log", { name: "Chat messages" });
  await replyDone(page);
  // The user's bubble plus a saved reply that mentions the word (maybe more than once).
  const mentions = log.getByText(/lighthouse/i);
  await expect(mentions.nth(1)).toBeVisible();

  await page.reload();
  await expect(mentions.nth(1)).toBeVisible();
  await expect(log.getByText(/^Reply with one short sentence/)).toHaveCount(1);
  await expectNoSeriousViolations(page);

  // 390px: no sideways scroll and the composer fully on screen.
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  const box = await page.getByRole("textbox", { name: "Message" }).boundingBox();
  expect(box && box.y + box.height).toBeLessThanOrEqual(844);
  await expectNoSeriousViolations(page);
});

test("J5 reload mid-run: the same reply carries on, nothing duplicated", async ({ page }) => {
  await startTask(page, LONG_PROMPT);
  await expect(page.getByRole("button", { name: "Stop" })).toBeVisible();
  await page.reload();
  const log = page.getByRole("log", { name: "Chat messages" });
  await replyDone(page);
  await expect(log.getByText(LONG_PROMPT)).toHaveCount(1);
  await expect(log).toContainText(/keeper/i);
  await expect(log.getByRole("button", { name: "Retry" })).toHaveCount(0);
});

test("J6 Stop: the reply ends as Stopped, keeps what it wrote and can be retried", async ({
  page,
}) => {
  await startTask(page, LONG_PROMPT);
  const log = page.getByRole("log", { name: "Chat messages" });
  // Mid-run: once the story has started streaming, well past the prompt's own text.
  await expect
    .poll(async () => (await log.innerText()).length, { timeout: REPLY_MS })
    .toBeGreaterThan(LONG_PROMPT.length + 200);
  await page.getByRole("button", { name: "Stop" }).click();
  await expect(log.getByText("Stopped", { exact: true })).toBeVisible({ timeout: 90_000 });
  await expect(log.getByRole("button", { name: "Retry" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Send message" })).toBeVisible();
});

test("J9 manage chats: rename, pin, search, duplicate, delete", async ({ page }) => {
  await startTask(page, "Say hi in three words.");
  await replyDone(page);
  const id = chatIdOf(page);
  const row = page.locator(`a[href="/chat/${id}"]`).locator("..");
  const actions = () => row.getByRole("button", { name: "Chat actions" }).click();
  const title = `e2e ${String(Date.now())}`;

  await actions();
  await page.getByRole("menuitem", { name: "Rename" }).click();
  await page.getByRole("textbox", { name: "Task title" }).fill(title);
  await page.keyboard.press("Enter");
  await expect(page.locator(`a[href="/chat/${id}"]`)).toHaveText(title);

  await actions();
  await page.getByRole("menuitem", { name: "Pin to top" }).click();
  await actions();
  await expect(page.getByRole("menuitem", { name: "Unpin" })).toBeVisible();
  await page.keyboard.press("Escape");
  // Radix blocks clicks until a closing menu or dialog has gone.
  await expect(page.getByRole("menu")).toHaveCount(0);

  await page.getByRole("button", { name: "Search", exact: true }).click();
  await page.getByRole("combobox", { name: "Search projects and tasks" }).fill(title);
  await expect(page.getByRole("dialog").getByText(title)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await actions();
  await page.getByRole("menuitem", { name: "Duplicate" }).click();
  await page.getByRole("button", { name: "Duplicate task" }).click();
  // The copy's id comes from the server.
  await expect(page).toHaveURL(
    (url) => /^\/chat\/[^/]+$/.test(url.pathname) && !url.pathname.endsWith(id),
  );
  created.push(chatIdOf(page));
  await page.goto(`/chat/${id}`);

  await actions();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click();
  await expect(page.locator(`a[href="/chat/${id}"]`)).toHaveCount(0);
});
