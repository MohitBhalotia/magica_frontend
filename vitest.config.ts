import path from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/__tests__/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["**/__tests__/**", "src/mocks/**"],
      // TESTING.md §6: logic is gated, UI is report-only
      thresholds: {
        "src/{stores,services}/**/*.ts": { lines: 80, branches: 75 },
        "src/features/realtime/**/*.ts": { lines: 80, branches: 75 },
      },
    },
  },
});
