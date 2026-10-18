import { vi } from "vitest";

/** The App Router instance `useRouter()` returns in tests (mocked in vitest.setup.ts). */
export const router = { push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() };
