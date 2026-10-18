import { create } from "zustand";

type UiState = {
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  // shortcut: not persisted across reloads, persist it if users ask for it to stick.
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
};

export const useUiStore = create<UiState>()((set) => ({
  drawerOpen: false,
  setDrawerOpen: (drawerOpen) => {
    set({ drawerOpen });
  },
  sidebarCollapsed: false,
  setSidebarCollapsed: (sidebarCollapsed) => {
    set({ sidebarCollapsed });
  },
}));
