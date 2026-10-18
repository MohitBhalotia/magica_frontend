"use client";

import { Dialog as DialogPrimitive } from "radix-ui";

import { SidebarContent } from "@/features/shell/SidebarContent";
import { useUiStore } from "@/stores/uiStore";

const panel =
  "flex w-(--magica-sidebar-expanded) shrink-0 flex-col overflow-hidden rounded-radius-xxxxl bg-surface-main-background-2";

/**
 * Inline floating card from md (768px) up; below that, the same content in a Radix dialog drawer
 * (focus trap, Esc, backdrop) — DESIGN §3.1, observed 2026-10-18.
 */
export function AppSidebar() {
  const open = useUiStore((s) => s.drawerOpen);
  const setOpen = useUiStore((s) => s.setDrawerOpen);

  return (
    <>
      <aside className={`${panel} hidden md:flex`}>
        <SidebarContent />
      </aside>
      <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-surface-overlay-control backdrop-blur-[3px] md:hidden" />
          <DialogPrimitive.Content
            className={`${panel} fixed inset-y-space-03 left-space-03 z-50 max-w-[calc(100vw-16px)] md:hidden`}
          >
            <DialogPrimitive.Title className="sr-only">Sidebar</DialogPrimitive.Title>
            <SidebarContent />
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}
