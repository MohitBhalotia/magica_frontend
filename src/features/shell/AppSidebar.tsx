"use client";

import { Dialog as DialogPrimitive } from "radix-ui";

import { SidebarContent } from "@/features/shell/SidebarContent";
import { SidebarRail } from "@/features/shell/SidebarRail";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/uiStore";

const panel =
  "flex w-(--magica-sidebar-expanded) shrink-0 flex-col overflow-hidden rounded-radius-xxxxl bg-surface-main-background-2";

/**
 * Inline floating card from md (768px) up, collapsing to a 48px rail; below md, the expanded
 * content in a Radix dialog drawer (focus trap, Esc, backdrop) — DESIGN §3.1, observed 2026-10-18.
 */
export function AppSidebar() {
  const open = useUiStore((s) => s.drawerOpen);
  const setOpen = useUiStore((s) => s.setDrawerOpen);
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const setCollapsed = useUiStore((s) => s.setSidebarCollapsed);
  const closeDrawer = () => {
    setOpen(false);
  };

  return (
    <>
      <aside
        className={cn(
          panel,
          "hidden transition-[width] duration-300 motion-reduce:transition-none md:flex",
          collapsed && "w-(--magica-sidebar-collapsed)",
        )}
      >
        {collapsed ? (
          <SidebarRail />
        ) : (
          <SidebarContent
            onClose={() => {
              setCollapsed(true);
            }}
          />
        )}
      </aside>
      <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-surface-overlay-control backdrop-blur-[3px] md:hidden" />
          <DialogPrimitive.Content
            aria-describedby={undefined}
            className={cn(
              panel,
              "fixed inset-y-space-03 left-space-03 z-50 max-w-[calc(100vw-16px)] md:hidden",
            )}
          >
            <DialogPrimitive.Title className="sr-only">Sidebar</DialogPrimitive.Title>
            <SidebarContent onClose={closeDrawer} onNavigate={closeDrawer} />
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}
