import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterAll, afterEach, beforeAll, vi } from "vitest";

import { server } from "@/mocks/server";

// App Router and Clerk need their providers; components only touch these hooks. Tests assert
// on `router` from @/test/router. Clerk is signed out unless a test mocks `useAuth`.
vi.mock("next/navigation", async () => {
  // vi.mock is hoisted above static imports, so load the shared router here.
  const { router } = await import("@/test/router");
  return { useRouter: () => router, usePathname: () => "/chat", useParams: () => ({}) };
});
vi.mock("@clerk/nextjs", async () => {
  const { clerk } = await import("@/test/clerk");
  // Signed out by default; tests override with vi.mocked(useAuth).mockReturnValue(...).
  const useAuth = vi.fn(() => ({
    isSignedIn: false,
    userId: null as string | null,
    getToken: () => Promise.resolve(null as string | null),
  }));
  return {
    useAuth,
    useClerk: () => clerk,
    // Follows the mocked useAuth, like the real <Show>.
    Show: ({ when, children }: { when: string; children: ReactNode }) =>
      (when === "signed-in") === useAuth().isSignedIn ? children : null,
    SignInButton: ({ children }: { children?: ReactNode }) => children,
    SignUpButton: ({ children }: { children?: ReactNode }) => children,
    UserButton: () => null,
  };
});

// jsdom has no matchMedia; sonner and next-themes read it.
window.matchMedia = (query) => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
  addListener: () => undefined,
  removeListener: () => undefined,
  dispatchEvent: () => false,
});

// Browser APIs jsdom lacks: Radix popper sizing, pointer capture, menu scrolling, and the
// task list's load-on-scroll observer (never fires in tests).
class NoopObserver {
  observe = () => undefined;
  unobserve = () => undefined;
  disconnect = () => undefined;
}
globalThis.ResizeObserver = NoopObserver;
globalThis.IntersectionObserver = NoopObserver as unknown as typeof IntersectionObserver;
Object.assign(Element.prototype, {
  hasPointerCapture: () => false,
  releasePointerCapture: () => undefined,
  scrollIntoView: () => undefined,
});
// jsdom has no layout, so every element is 0×0; the virtualized thread would show no rows in a
// 0px viewport. A typical viewport size instead.
Object.defineProperties(HTMLElement.prototype, {
  offsetHeight: { configurable: true, get: () => 800 },
  offsetWidth: { configurable: true, get: () => 900 },
});
// jsdom has no media playback (idea-card previews play on hover).
Object.assign(HTMLMediaElement.prototype, {
  play: () => Promise.resolve(),
  pause: () => undefined,
});

// Any request a test didn't mock fails loudly instead of hitting a real API.
beforeAll(() => {
  server.listen({ onUnhandledFrame: "error" });
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  server.resetHandlers();
});
afterAll(() => {
  server.close();
});
