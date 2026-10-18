import { IconApiBook, IconBooks } from "@tabler/icons-react";
import { Boxes, FolderOpen, LifeBuoy, MessageSquareMore, Sparkles } from "lucide-react";
import type { ComponentType } from "react";
import { toast } from "sonner";

/** Reference affordances outside the brief render with parity but stay inert (PRD §6.10). */
export function notAvailable() {
  toast("Not available in this build");
}

type NavItem = { label: string; Icon: ComponentType<{ className?: string }> };

/** Sidebar nav in reference order (DESIGN §3.2, §2.9). */
export const NAV_ITEMS: readonly NavItem[] = [
  { label: "Tasks", Icon: MessageSquareMore },
  { label: "Projects", Icon: FolderOpen },
  { label: "Library", Icon: IconBooks },
  { label: "Tools", Icon: Boxes },
  { label: "API / MCP", Icon: IconApiBook },
  { label: "Help & Support", Icon: LifeBuoy },
  { label: "Unfair Advantage", Icon: Sparkles },
];

/** Shared row look: nav rows, New task, footer rows (34px, radius 10, 14px/500). */
export const ROW =
  "flex h-(--magica-control-height) w-full items-center gap-(--magica-navigation-gap) rounded-radius-l px-space-03 text-small font-medium text-text-secondary outline-none transition-colors hover:bg-surface-secondary hover:text-text-primary focus-visible:ring-2 focus-visible:ring-boarder-action [&_svg]:size-(--magica-icon-size) [&_svg]:shrink-0";

/** 28px round icon button (sidebar header, rail). */
export const ICON_BUTTON =
  "flex size-(--magica-sidebar-header-control) shrink-0 items-center justify-center rounded-radius-max text-icon-primary outline-none transition-colors hover:bg-surface-secondary focus-visible:ring-2 focus-visible:ring-boarder-action [&_svg]:size-(--magica-icon-size)";
