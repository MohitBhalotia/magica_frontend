import { z } from "zod";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/** Draft key for the empty state; chats use their id. */
export const NEW_CHAT = "new";

type ComposerState = {
  drafts: Record<string, string>;
  setDraft: (key: string, text: string) => void;
};

// Storage is user-editable: anything that isn't a map of strings is dropped.
const DraftsSchema = z.record(z.string(), z.string()).catch({});

/**
 * Per-chat composer drafts, kept for the tab's lifetime (sessionStorage) so a reload or a
 * detour to another chat doesn't lose typing. Rehydrated after mount by the composer, since
 * the server can't see sessionStorage (avoids a hydration mismatch).
 */
export const useComposerStore = create<ComposerState>()(
  persist(
    (set) => ({
      drafts: {},
      setDraft: (key, text) => {
        // An emptied draft is dropped, so storage only holds unsent text.
        set((s) => ({
          drafts: Object.fromEntries(
            Object.entries({ ...s.drafts, [key]: text }).filter(([, v]) => v !== ""),
          ),
        }));
      },
    }),
    {
      name: "composer-drafts",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (s) => ({ drafts: s.drafts }),
      merge: (persisted, current) => ({
        ...current,
        drafts: DraftsSchema.parse((persisted as { drafts?: unknown } | undefined)?.drafts),
      }),
      skipHydration: true,
    },
  ),
);
