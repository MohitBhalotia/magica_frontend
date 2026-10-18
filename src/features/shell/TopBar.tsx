"use client";

import { Show, SignInButton, SignUpButton, useAuth } from "@clerk/nextjs";
import { IconLayoutSidebar, IconSparkles2 } from "@tabler/icons-react";
import { Monitor } from "lucide-react";

import { ModelSelector } from "@/features/shell/ModelSelector";
import { notAvailable } from "@/features/shell/nav";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/uiStore";

/** Top bar (DESIGN §3.3, observed 2026-10-18): model selector left; Computer + credits right. */
export function TopBar() {
  const setDrawerOpen = useUiStore((s) => s.setDrawerOpen);
  const { isSignedIn } = useAuth();

  return (
    <header
      className={cn(
        "relative flex h-(--magica-sidebar-header) shrink-0 items-center gap-space-03 py-space-03",
        // The reference pads the signed-out bar less (observed 2026-10-18).
        isSignedIn ? "pr-space-07 pl-space-05" : "pr-space-05 pl-space-03 sm:pl-space-05",
      )}
    >
      <button
        type="button"
        aria-label="Open sidebar"
        className="flex size-(--magica-sidebar-header-control) items-center justify-center rounded-radius-l text-icon-secondary hover:bg-surface-secondary hover:text-icon-primary md:hidden"
        onClick={() => {
          setDrawerOpen(true);
        }}
      >
        <IconLayoutSidebar className="size-(--magica-icon-size)" />
      </button>
      <ModelSelector />
      <div className="ml-auto flex shrink-0 items-center gap-space-03">
        <Show when="signed-in">
          {/* The reference's cloud computer is outside the brief: rendered for parity, inert. */}
          <button
            type="button"
            aria-label="Open computer"
            onClick={notAvailable}
            className="inline-flex h-9 shrink-0 items-center gap-space-02 rounded-radius-max bg-surface-primary-active px-space-04 text-small font-medium text-text-on-action transition-colors hover:bg-surface-primary-hover"
          >
            <Monitor className="size-4" />
            <span className="hidden sm:inline">Computer</span>
          </button>
          {/* The balance and the plan popover arrive with credits (M4). */}
          <button
            type="button"
            aria-label="Credits available. Click for plan details."
            onClick={notAvailable}
            className="inline-flex h-(--magica-credit-control) items-center gap-space-03 rounded-radius-max border border-boarder-tertiary bg-surface-main-background-2 px-space-04 py-space-02 transition-colors outline-none hover:bg-surface-primary focus-visible:ring-2 focus-visible:ring-boarder-action"
          >
            <IconSparkles2 className="size-(--magica-compact-icon-size) text-icon-primary" />
            <span className="text-small whitespace-nowrap text-text-primary">–</span>
          </button>
        </Show>
        <Show when="signed-out">
          {/* Magica 101 is a reference page outside the brief (PRD §6.10): shown, inert. */}
          <button
            type="button"
            onClick={notAvailable}
            className="absolute left-1/2 hidden -translate-x-1/2 rounded-radius-max bg-surface-secondary px-space-04 py-space-02 text-small font-medium text-text-primary sm:inline-flex"
          >
            Magica 101
          </button>
          <SignInButton mode="modal">
            <button
              type="button"
              className="h-8 rounded-radius-max px-space-04 text-small font-medium text-text-primary transition-colors hover:bg-surface-secondary"
            >
              Sign in
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button
              type="button"
              className="h-8 rounded-radius-max bg-text-primary px-space-04 text-small font-medium text-surface-main-background shadow-sm transition-opacity hover:opacity-90"
            >
              Sign up
            </button>
          </SignUpButton>
        </Show>
      </div>
    </header>
  );
}
