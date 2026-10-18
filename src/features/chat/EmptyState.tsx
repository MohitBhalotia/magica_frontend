"use client";

import { useSyncExternalStore } from "react";

import { Mascot } from "@/components/Mascot";
import { IdeaGallery } from "@/features/ideas/IdeaGallery";

// Ticks every 15s so the minute rolls over on time without a per-second render.
const subscribe = (onChange: () => void) => {
  const id = setInterval(onChange, 15_000);
  return () => {
    clearInterval(id);
  };
};
// en-US like the reference ("10:19 PM" on every locale); the viewer's own time zone.
const now = () =>
  new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

/** "10:19 PM" with a raised "PM" (DESIGN §4.4). The server can't know the viewer's clock. */
function LocalTime() {
  const time = useSyncExternalStore(subscribe, now, () => "");
  // Intl separates "PM" with a narrow no-break space (U+202F), so split on any whitespace.
  const [clock, period] = time.split(/\s/);
  return (
    <div
      aria-label="Local time"
      className="mt-[14px] flex h-5 items-baseline justify-center gap-[6px] text-metadata font-medium tracking-[0.01em] whitespace-nowrap text-text-secondary md:mt-[19px]"
    >
      <span>{clock}</span>
      {period && (
        <span className="-translate-x-[3px] -translate-y-[5px] text-caption-1 font-normal">
          {period}
        </span>
      )}
    </div>
  );
}

/** `/chat` before the first message (DESIGN §4.4, observed 2026-10-18). */
export function EmptyState() {
  return (
    <div className="mx-auto flex w-full max-w-[1000px] flex-col items-center gap-space-10 px-space-05 pb-space-10 md:px-space-07">
      <div className="w-[min(448px,calc(100vw-48px))] pt-space-10 text-center md:pt-[113px]">
        <Mascot className="mx-auto block size-10" />
        <LocalTime />
        <h1 className="mt-space-05 text-heading-md font-bold text-text-primary md:mt-space-02 md:text-heading-lg">
          Your AI worker
        </h1>
        <p className="mt-space-03 text-copy font-medium text-text-secondary">
          Work at the speed of thought.
        </p>
      </div>
      <div className="flex w-full max-w-[900px] flex-col gap-space-08">
        {/* The composer goes here (F6). */}
        <IdeaGallery />
      </div>
    </div>
  );
}
