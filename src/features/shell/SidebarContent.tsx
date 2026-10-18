"use client";

import { IconLayoutSidebar } from "@tabler/icons-react";
import { CirclePlus, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { Suspense } from "react";

import { TaskList } from "@/features/chats/TaskList";
import { Logo } from "@/features/shell/Logo";
import { SidebarFooter } from "@/features/shell/SidebarFooter";
import { ICON_BUTTON, NAV_ITEMS, notAvailable, ROW } from "@/features/shell/nav";

/** Expanded sidebar body, shared by the inline card and the mobile drawer (DESIGN §3.2). */
export function SidebarContent({
  onClose,
  onNavigate,
}: {
  onClose: () => void;
  /** Called after any in-app navigation (the drawer closes itself). */
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const newTask = () => {
    router.push("/chat");
    onNavigate?.();
  };

  return (
    <nav aria-label="Sidebar" className="flex h-full min-h-0 flex-col">
      <div className="flex h-(--magica-sidebar-header) shrink-0 items-start justify-between pt-(--magica-navigation-gap) pr-space-03 pl-space-04">
        <button
          type="button"
          aria-label="Start a new task"
          onClick={newTask}
          className="flex h-8 items-center rounded-radius-l px-space-01 outline-none focus-visible:ring-2 focus-visible:ring-boarder-action"
        >
          <Logo />
        </button>
        <div className="flex gap-space-01">
          {/* Opens the search dialog (F8). */}
          <button type="button" aria-label="Search" className={ICON_BUTTON}>
            <Search />
          </button>
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={onClose}
            className={ICON_BUTTON}
          >
            <IconLayoutSidebar />
          </button>
        </div>
      </div>

      <div className="px-space-03">
        <button type="button" onClick={newTask} className={`group ${ROW}`}>
          <CirclePlus />
          New task
          <span className="text-caption leading-3 text-text-primary opacity-0 transition-opacity duration-150 group-hover:opacity-100">
            Ctrl+Shift+O
          </span>
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-space-03 pt-space-02">
        <ul className="flex flex-col gap-space-02">
          {NAV_ITEMS.map(({ label, Icon }) => (
            <li key={label}>
              <button type="button" onClick={notAvailable} className={ROW}>
                <Icon />
                {label}
              </button>
            </li>
          ))}
        </ul>
        {/* The active row depends on the URL, so it renders per request, after the static shell. */}
        <Suspense>
          <TaskList onNavigate={onNavigate} />
        </Suspense>
      </div>

      <SidebarFooter />
    </nav>
  );
}
