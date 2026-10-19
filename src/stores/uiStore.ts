import { create } from "zustand";

type UiState = {
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  // shortcut: not persisted across reloads, persist it if users ask for it to stick.
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  apiKeysOpen: boolean;
  setApiKeysOpen: (open: boolean) => void;
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
  searchOpen: false,
  setSearchOpen: (searchOpen) => {
    set({ searchOpen });
  },
  apiKeysOpen: false,
  setApiKeysOpen: (apiKeysOpen) => {
    set({ apiKeysOpen });
  },
}));
