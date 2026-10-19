"use client";

import { IconChartBar, IconCoin, IconSparkles2, IconWallet } from "@tabler/icons-react";
import Link from "next/link";
import { useState } from "react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useBalance } from "@/features/credits/useCredits";
import { notAvailable } from "@/features/shell/nav";
import { formatCredits } from "@/lib/credits";

const CHIP =
  "flex h-6 w-[130px] items-center justify-between gap-space-02 rounded-radius-xxl border-(length:--border-width-xs) border-boarder-tertiary bg-surface-primary px-space-03 text-xs text-text-primary transition-colors hover:bg-surface-main-background-2";

/** The top bar's balance and its plan popover (DESIGN §4.9, measured 2026-10-19). */
export function CreditsPill() {
  const balance = useBalance().data?.balanceMicro;
  const value = balance === undefined ? "–" : formatCredits(balance);
  // Controlled, so "View usage" can close it: the pill stays mounted across navigation.
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={`Credits available: ${value}. Click for plan details.`}
        className="inline-flex h-(--magica-credit-control) items-center gap-space-03 rounded-radius-max border-(length:--border-width-xs) border-boarder-tertiary bg-surface-main-background-2 px-space-04 py-space-02 transition-colors outline-none hover:bg-surface-primary focus-visible:ring-2 focus-visible:ring-boarder-action"
      >
        <IconSparkles2 className="size-(--magica-compact-icon-size) text-icon-primary" />
        <span className="text-small whitespace-nowrap text-text-primary">{value}</span>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="flex w-[300px] flex-col gap-space-04 rounded-radius-xxxl border-(length:--border-width-s) border-boarder-tertiary bg-surface-main-background-3 p-space-05 shadow-popover"
      >
        <div className="flex w-full flex-col gap-space-04">
          <div className="flex flex-col gap-space-02">
            {/* Everyone is on the free plan in this build. */}
            <span className="text-xs font-semibold text-text-primary uppercase">Hobby</span>
            <div className="flex items-center justify-between gap-space-03">
              <span className="text-sm text-text-secondary">Available Credits</span>
              <span className="text-base font-bold text-text-primary">{value}</span>
            </div>
          </div>
          {/* Buying credits is outside the brief (PRD §6.10): shown, inert. */}
          <button
            type="button"
            onClick={notAvailable}
            className="flex h-9 w-full items-center justify-center gap-space-03 rounded-radius-max bg-surface-primary-active px-space-04 text-sm font-semibold text-text-on-action transition-opacity hover:opacity-90"
          >
            <IconWallet className="size-4" />
            Add Credits
          </button>
        </div>
        <div className="flex gap-space-03">
          <Link
            href="/usage"
            className={CHIP}
            onClick={() => {
              setOpen(false);
            }}
          >
            View usage
            <IconChartBar className="size-4" />
          </Link>
          <button type="button" onClick={notAvailable} className={CHIP}>
            Billing details
            <IconCoin className="size-4" />
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
