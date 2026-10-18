"use client";

import { ChevronDown } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// The brief allows only OpenRouter Free, so the reference's five-model menu has one entry (DESIGN §4.3).
const MODEL = {
  name: "OpenRouter Free",
  description: "Picks an available free model for your task",
};

const Mark = ({ size }: { size: number }) => (
  <Image
    src="/magica_favicon_black.svg"
    alt=""
    width={size}
    height={size}
    className="shrink-0 rounded-sm dark:invert"
  />
);

/** Top-bar model selector (observed 2026-10-18). Disabled while a run is active (M2). */
export function ModelSelector() {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="group flex h-(--magica-model-control) max-w-[min(180px,100%)] min-w-0 items-center gap-space-03 rounded-radius-l px-space-03 py-space-02 text-small text-(--magica-foundation-foreground) transition-colors outline-none hover:bg-(--magica-foundation-surface-hover) focus-visible:ring-2 focus-visible:ring-boarder-action data-[state=open]:bg-(--magica-foundation-surface-hover)">
        <Mark size={12} />
        <span className="min-w-0 truncate">{MODEL.name}</span>
        <ChevronDown className="size-(--magica-compact-icon-size) shrink-0 text-icon-secondary transition-transform group-data-[state=open]:rotate-180" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[360px]">
        <button
          type="button"
          aria-current="true"
          onClick={() => {
            setOpen(false);
          }}
          className="flex w-full items-start gap-2.5 rounded-radius-l bg-surface-primary py-space-03 pr-space-07 pl-space-04 text-left transition-colors outline-none hover:bg-(--magica-foundation-surface-hover) focus-visible:ring-2 focus-visible:ring-boarder-action focus-visible:ring-inset"
        >
          <span className="mt-0.5">
            <Mark size={20} />
          </span>
          <span className="flex flex-col">
            <span className="text-small whitespace-nowrap text-text-primary">{MODEL.name}</span>
            <span className="mt-0.5 text-caption whitespace-nowrap text-text-secondary">
              {MODEL.description}
            </span>
          </span>
        </button>
      </PopoverContent>
    </Popover>
  );
}
