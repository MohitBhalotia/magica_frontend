import { existsSync } from "node:fs";

import { defineConfig, devices } from "@playwright/test";

// Written by e2e/journeys/auth.setup.ts (git-ignored).
const AUTH_FILE = "playwright/.clerk/user.json";

// Locally the Clerk keys and the e2e user come from .env.local; in CI from secrets.
if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  use: { baseURL, trace: "retain-on-failure", video: "retain-on-failure" },
  projects: [
    // Signed out, against a local build on every PR (`pnpm test:e2e`).
    {
      name: "public",
      testIgnore: /journeys\//,
      use: { ...devices["Desktop Chrome"] },
    },
    // Signed in as the e2e user, against the deployed app (`pnpm test:e2e:journeys`).
    { name: "auth", testMatch: /journeys\/auth\.setup\.ts/ },
    {
      name: "journeys",
      testMatch: /journeys\/.*\.spec\.ts/,
      dependencies: ["auth"],
      use: { ...devices["Desktop Chrome"], storageState: AUTH_FILE },
    },
  ],
  // Start the app locally; against a deployed app (E2E_BASE_URL) there is nothing to start.
  ...(process.env.E2E_BASE_URL
    ? {}
    : { webServer: { command: "pnpm dev", url: baseURL, reuseExistingServer: !process.env.CI } }),
});
