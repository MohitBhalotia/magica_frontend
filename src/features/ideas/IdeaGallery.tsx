"use client";

import Image from "next/image";
import { Tabs as TabsPrimitive } from "radix-ui";
import { useRef, useState } from "react";

import { IDEA_CATEGORIES, IDEAS, type Idea } from "@/features/ideas/ideas";
import { notAvailable } from "@/features/shell/nav";
import { NEW_CHAT, useComposerStore } from "@/stores/composerStore";

const ALL = "All";

/** One idea: poster or image at its reference size; a video preview plays only while hovered. */
function IdeaCard({ idea, onPick }: { idea: Idea; onPick: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const play = () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // play() rejects if the user leaves before it starts; nothing to recover.
    video.current?.play().catch(() => undefined);
  };
  const stop = () => {
    video.current?.pause();
  };

  return (
    <button
      type="button"
      onClick={onPick}
      onMouseEnter={play}
      onMouseLeave={stop}
      onFocus={play}
      onBlur={stop}
      className="block w-full overflow-hidden rounded-radius-xxl border border-boarder-secondary bg-surface-main-background-2 text-left shadow-xs transition-[background-color,border-color,box-shadow] outline-none hover:shadow-md focus-visible:ring-2 focus-visible:ring-boarder-action active:bg-surface-tertiary"
    >
      {idea.video ? (
        // Like the reference: nothing downloads until hover (preload none), muted and looping.
        <video
          ref={video}
          src={idea.video}
          poster={idea.poster}
          preload="none"
          muted
          loop
          playsInline
          aria-hidden
          style={{ aspectRatio: `${String(idea.width)}/${String(idea.height)}` }}
          className="block w-full bg-surface-secondary object-cover"
        />
      ) : (
        <Image
          src={idea.image ?? ""}
          alt=""
          width={idea.width}
          height={idea.height}
          sizes="(min-width: 768px) 300px, 50vw"
          className="block h-auto w-full bg-surface-secondary"
        />
      )}
      <span className="block px-space-03 pt-space-02 pb-space-03">
        <span className="line-clamp-1 text-small font-medium text-text-primary">{idea.title}</span>
      </span>
    </button>
  );
}

/** Idea tabs + masonry cards (DESIGN §4.4, observed 2026-10-18). A card fills the composer. */
export function IdeaGallery() {
  const [tab, setTab] = useState<string>(ALL);
  const setDraft = useComposerStore((s) => s.setDraft);
  const ideas = tab === ALL ? IDEAS : IDEAS.filter((i) => (i.categories as string[]).includes(tab));

  return (
    <div className="flex w-full flex-col gap-space-08">
      <TabsPrimitive.Root
        value={tab}
        onValueChange={setTab}
        className="w-full [scrollbar-width:none] overflow-x-auto"
      >
        <TabsPrimitive.List
          aria-label="Explore ideas"
          className="flex min-h-(--magica-control-height) w-full min-w-max items-center justify-between gap-space-02"
        >
          {[ALL, ...IDEA_CATEGORIES].map((name) => (
            <TabsPrimitive.Trigger
              key={name}
              value={name}
              className="inline-flex h-(--magica-control-height) shrink-0 items-center rounded-radius-l px-[10px] text-small font-medium whitespace-nowrap text-text-secondary transition-colors outline-none hover:bg-surface-secondary focus-visible:bg-surface-secondary data-[state=active]:bg-surface-secondary data-[state=active]:text-(--magica-foundation-foreground)"
            >
              {name}
            </TabsPrimitive.Trigger>
          ))}
        </TabsPrimitive.List>
      </TabsPrimitive.Root>

      <div className="mx-auto flex w-full flex-col items-center">
        <ul className="w-full columns-2 gap-space-04 md:columns-3 md:gap-space-05">
          {ideas.map((idea) => (
            <li key={idea.title} className="mb-space-04 break-inside-avoid md:mb-space-05">
              <IdeaCard
                idea={idea}
                onPick={() => {
                  setDraft(NEW_CHAT, idea.prompt);
                }}
              />
            </li>
          ))}
        </ul>
        {/* The reference pages more ideas from its server; we ship only its first 30. */}
        <button
          type="button"
          onClick={notAvailable}
          className="mt-space-08 inline-flex h-9 items-center rounded-radius-l border border-boarder-tertiary bg-surface-main-background-3 px-space-04 text-small font-medium text-text-primary shadow-xs transition-colors outline-none hover:bg-surface-primary focus-visible:ring-2 focus-visible:ring-boarder-action"
        >
          See more ideas
        </button>
      </div>
    </div>
  );
}
