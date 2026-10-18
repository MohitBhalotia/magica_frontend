import { vi } from "vitest";

/** The Clerk instance `useClerk()` returns in tests (mocked in vitest.setup.ts). */
export const clerk = { openSignIn: vi.fn() };
