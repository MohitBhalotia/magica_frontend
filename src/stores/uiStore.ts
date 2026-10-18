import { create } from "zustand";

/** UI-only state (PRD §9). Server data lives in TanStack Query, never here. */
type UiState = {
  /** Mobile sidebar drawer (below md). */
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
};

export const useUiStore = create<UiState>()((set) => ({
  drawerOpen: false,
  setDrawerOpen: (drawerOpen) => {
    set({ drawerOpen });
  },
}));
