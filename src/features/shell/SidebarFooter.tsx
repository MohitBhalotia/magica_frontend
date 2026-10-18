"use client";

import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import {
  ArrowRight,
  EllipsisVertical,
  Laptop,
  Moon,
  Settings,
  Sparkles,
  Sun,
  Users,
  Wallet,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Tabs as TabsPrimitive } from "radix-ui";
import { useState } from "react";

import { Mascot } from "@/components/Mascot";
import { notAvailable, ROW } from "@/features/shell/nav";
import { cn } from "@/lib/utils";

const THEMES = [
  { value: "system", label: "System theme", Icon: Laptop },
  { value: "light", label: "Light theme", Icon: Sun },
  { value: "dark", label: "Dark theme", Icon: Moon },
] as const;

const OUTLINED =
  "rounded-radius-l border border-boarder-tertiary bg-surface-main-background text-small font-medium text-text-secondary transition-colors hover:bg-surface-secondary hover:text-text-primary [&_svg]:size-(--magica-icon-size)";

/** Footer: "More" expands inline to credits, settings and theme; then the user button (DESIGN §3.2). */
export function SidebarFooter() {
  const [open, setOpen] = useState(false);

  return (
    <div className="shrink-0 border-t border-boarder-tertiary px-space-03 pb-space-03">
      <Show when="signed-out">
        {/* Magica 101 is outside the brief (PRD §6.10): the card renders, inert. */}
        <button
          type="button"
          onClick={notAvailable}
          className="mt-space-03 mb-space-01 flex w-full items-start gap-space-03 rounded-radius-xxl bg-surface-main-background px-(--magica-sidebar-card-padding-x) py-space-03 text-left text-metadata text-text-secondary shadow-[0_0_1px_rgba(34,34,34,.08),inset_0_0_2px_rgba(34,34,34,.02)] transition-colors hover:text-text-primary"
        >
          <Mascot className="mt-space-01 size-4 shrink-0" />
          <span className="flex flex-col">
            <span className="text-small text-text-primary">Magica 101</span>
            Learn what Magica can do
          </span>
        </button>
      </Show>
      <div className="py-space-02">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => {
            setOpen(!open);
          }}
          className={cn(ROW, "font-normal")}
        >
          <EllipsisVertical />
          {open ? "Less" : "More"}
        </button>
      </div>

      {open && (
        <div className="flex flex-col">
          <div className="flex items-center justify-between px-space-03 text-caption">
            <span>Available Credits</span>
            {/* Wired to the credit ledger in M4. */}
            <span className="font-medium text-text-secondary tabular-nums">–</span>
          </div>
          <button
            type="button"
            onClick={notAvailable}
            className="mt-space-03 flex h-8 items-center justify-center gap-[7px] rounded-radius-l bg-linear-to-b from-(--magica-foundation-primary-top) to-(--magica-foundation-primary-bottom) text-caption font-medium text-(--magica-foundation-action-foreground) shadow-[0_0_0_1px_#303030,inset_0_1px_0_rgba(255,255,255,.15),0_1px_3px_rgba(0,0,0,.2)] [&_svg]:size-(--magica-icon-size)"
          >
            <Wallet />
            Add Credits
          </button>
          <div className="mt-space-04 grid grid-cols-2 gap-space-03">
            {[
              { label: "Settings", Icon: Settings },
              { label: "Updates", Icon: Sparkles },
            ].map(({ label, Icon }) => (
              <button
                key={label}
                type="button"
                onClick={notAvailable}
                className={cn(
                  OUTLINED,
                  "flex h-(--magica-model-control) items-center justify-center gap-[6px] px-space-04",
                )}
              >
                <Icon />
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={notAvailable}
            className={cn(
              OUTLINED,
              "mt-space-03 flex h-(--magica-control-height) items-center gap-(--magica-navigation-gap) px-space-03",
            )}
          >
            <Users />
            Invite team members
            <ArrowRight className="ml-auto" />
          </button>
          <ThemeTabs />
        </div>
      )}

      <Show when="signed-in">
        <UserButton
          showName
          appearance={{
            elements: {
              // Clerk's root sizes to its content; full width makes the hover row match "More"
              // (and right-aligns the name like the reference). User call, 2026-10-19.
              rootBox: "flex! w-full!",
              userButtonTrigger:
                "h-(--magica-control-height)! w-full! rounded-radius-l! px-space-03! hover:bg-surface-secondary!",
              userButtonBox: "w-full! flex-row-reverse! justify-between!",
              userButtonOuterIdentifier: "text-metadata! font-medium! text-text-primary!",
            },
          }}
        />
      </Show>
      <Show when="signed-out">
        <div className="flex justify-center px-space-04 py-space-02">
          <SignInButton mode="modal">
            <button
              type="button"
              className="h-(--magica-control-height) w-full rounded-radius-l bg-surface-secondary px-space-05 text-small font-medium text-text-primary transition-colors outline-none hover:bg-surface-tertiary focus-visible:ring-2 focus-visible:ring-boarder-action"
            >
              Sign in
            </button>
          </SignInButton>
        </div>
      </Show>
    </div>
  );
}

/** System / Light / Dark segmented control with a sliding indicator (DESIGN §7). */
function ThemeTabs() {
  const { theme = "system", setTheme } = useTheme();
  const index = Math.max(
    0,
    THEMES.findIndex((t) => t.value === theme),
  );

  return (
    <TabsPrimitive.Root value={theme} onValueChange={setTheme} className="mt-space-04 mb-space-02">
      <TabsPrimitive.List
        aria-label="Theme"
        className="relative z-0 flex h-8 w-full items-center rounded-radius-max border border-boarder-tertiary bg-surface-main-background p-space-01"
      >
        <span
          aria-hidden
          style={{ transform: `translateX(${String(index * 100)}%)` }}
          className="absolute top-1/2 left-space-01 -z-10 h-6 w-[calc((100%-var(--space-02))/3)] -translate-y-1/2 rounded-radius-max bg-(--magica-foundation-surface-hover) transition-transform duration-200 ease-in-out motion-reduce:transition-none"
        />
        {THEMES.map(({ value, label, Icon }) => (
          <TabsPrimitive.Trigger
            key={value}
            value={value}
            aria-label={label}
            className="flex h-6 flex-1 items-center justify-center rounded-radius-max text-icon-secondary outline-none focus-visible:ring-2 focus-visible:ring-boarder-action data-[state=active]:text-icon-primary"
          >
            <Icon className="size-(--magica-compact-icon-size)" />
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
    </TabsPrimitive.Root>
  );
}
