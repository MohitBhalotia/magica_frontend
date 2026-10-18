"use client";

import { IconLayoutSidebar } from "@tabler/icons-react";
import { CirclePlus, Search, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { LogoMark } from "@/features/shell/Logo";
import { ICON_BUTTON, NAV_ITEMS, notAvailable } from "@/features/shell/nav";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/uiStore";

const RAIL_BUTTON =
  "flex size-(--magica-control-height) items-center justify-center rounded-radius-l text-text-secondary outline-none transition-colors hover:bg-surface-secondary hover:text-text-primary focus-visible:ring-2 focus-visible:ring-boarder-action [&_svg]:size-(--magica-icon-size)";

/** Icon-only, so each button names itself in a tooltip to the right. */
function RailButton({
  label,
  onClick,
  className = RAIL_BUTTON,
  children,
}: {
  label: string;
  onClick: () => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" aria-label={label} onClick={onClick} className={className}>
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

/** Collapsed 48px rail: icon-only nav, Settings pinned to the bottom (observed 2026-10-18). */
export function SidebarRail() {
  const router = useRouter();
  const setCollapsed = useUiStore((s) => s.setSidebarCollapsed);
  const setSearchOpen = useUiStore((s) => s.setSearchOpen);

  return (
    <nav aria-label="Sidebar" className="flex h-full flex-col items-center py-space-03">
      <RailButton
        label="Open sidebar"
        onClick={() => {
          setCollapsed(false);
        }}
        className={cn(RAIL_BUTTON, "group/expand relative")}
      >
        {/* The mark gives way to the sidebar icon on hover/focus, as in the reference. */}
        <LogoMark className="transition-opacity group-hover/expand:opacity-0 group-focus-visible/expand:opacity-0" />
        <IconLayoutSidebar className="absolute opacity-0 transition-opacity group-hover/expand:opacity-100 group-focus-visible/expand:opacity-100" />
      </RailButton>
      <RailButton
        label="Search"
        onClick={() => {
          setSearchOpen(true);
        }}
        className={cn(ICON_BUTTON, "mt-space-05")}
      >
        <Search />
      </RailButton>
      <ul className="mt-space-02 flex flex-col gap-space-02">
        <li>
          <RailButton
            label="New task"
            onClick={() => {
              router.push("/chat");
            }}
          >
            <CirclePlus />
          </RailButton>
        </li>
        {NAV_ITEMS.map(({ label, Icon }) => (
          <li key={label}>
            <RailButton label={label} onClick={notAvailable}>
              <Icon />
            </RailButton>
          </li>
        ))}
      </ul>
      <RailButton
        label="Settings"
        onClick={notAvailable}
        className={cn(ICON_BUTTON, "mt-auto mb-space-03 size-8")}
      >
        <Settings />
      </RailButton>
    </nav>
  );
}
