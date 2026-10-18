"use client";

import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import { IconLayoutSidebar } from "@tabler/icons-react";

import { useUiStore } from "@/stores/uiStore";

/** Top bar (DESIGN §3.3). Model selector, Computer and credits arrive in F4. */
export function TopBar() {
  const setDrawerOpen = useUiStore((s) => s.setDrawerOpen);

  return (
    <header className="flex h-(--magica-sidebar-header) shrink-0 items-center gap-space-03 px-space-05">
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
      <div className="ml-auto flex items-center gap-space-03">
        <Show when="signed-out">
          <SignInButton mode="modal" />
        </Show>
        <Show when="signed-in">
          <UserButton />
        </Show>
      </div>
    </header>
  );
}
