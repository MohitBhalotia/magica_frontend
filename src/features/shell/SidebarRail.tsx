"use client";

import { IconLayoutSidebar } from "@tabler/icons-react";
import { CirclePlus, Search, Settings } from "lucide-react";
import { useRouter } from "next/navigation";

import { LogoMark } from "@/features/shell/Logo";
import { ICON_BUTTON, NAV_ITEMS, notAvailable } from "@/features/shell/nav";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/uiStore";

const RAIL_BUTTON =
  "flex size-(--magica-control-height) items-center justify-center rounded-radius-l text-text-secondary outline-none transition-colors hover:bg-surface-secondary hover:text-text-primary focus-visible:ring-2 focus-visible:ring-boarder-action [&_svg]:size-(--magica-icon-size)";

/** Collapsed 48px rail: icon-only nav, Settings pinned to the bottom (observed 2026-10-18). */
export function SidebarRail() {
  const router = useRouter();
  const setCollapsed = useUiStore((s) => s.setSidebarCollapsed);

  return (
    <nav aria-label="Sidebar" className="flex h-full flex-col items-center py-space-03">
      <button
        type="button"
        aria-label="Open sidebar"
        onClick={() => {
          setCollapsed(false);
        }}
        className={cn(RAIL_BUTTON, "group/expand relative")}
      >
        {/* The mark gives way to the sidebar icon on hover/focus, as in the reference. */}
        <LogoMark className="transition-opacity group-hover/expand:opacity-0 group-focus-visible/expand:opacity-0" />
        <IconLayoutSidebar className="absolute opacity-0 transition-opacity group-hover/expand:opacity-100 group-focus-visible/expand:opacity-100" />
      </button>
      <button type="button" aria-label="Search" className={`${ICON_BUTTON} mt-space-05`}>
        <Search />
      </button>
      <ul className="mt-space-02 flex flex-col gap-space-02">
        <li>
          <button
            type="button"
            aria-label="New task"
            onClick={() => {
              router.push("/chat");
            }}
            className={RAIL_BUTTON}
          >
            <CirclePlus />
          </button>
        </li>
        {NAV_ITEMS.map(({ label, Icon }) => (
          <li key={label}>
            <button type="button" aria-label={label} onClick={notAvailable} className={RAIL_BUTTON}>
              <Icon />
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        aria-label="Settings"
        onClick={notAvailable}
        className={cn(ICON_BUTTON, "mt-auto mb-space-03 size-8")}
      >
        <Settings />
      </button>
    </nav>
  );
}
