import { create } from "zustand";

/** Draft key for the empty state; chats use their id. */
export const NEW_CHAT = "new";

type ComposerState = {
  drafts: Record<string, string>;
  setDraft: (key: string, text: string) => void;
};

// Per-chat drafts; F6 adds sessionStorage persistence and the composer itself.
export const useComposerStore = create<ComposerState>()((set) => ({
  drafts: {},
  setDraft: (key, text) => {
    set((s) => ({ drafts: { ...s.drafts, [key]: text } }));
  },
}));
